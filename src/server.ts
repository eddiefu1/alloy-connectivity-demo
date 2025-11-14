import express, { Request, Response } from 'express';
import cors from 'cors';
import { getConfig } from './config.js';
import { AlloyOAuthFlow } from './oauth-flow.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = process.env.PORT || 3000;
const app = express();

// Default redirect URI for development (localhost)
const DEFAULT_REDIRECT_URI = `http://localhost:${PORT}/oauth/callback`;

// Middleware
app.use(cors());
app.use(express.json());

// Log all incoming requests for debugging
app.use((req: Request, res: Response, next) => {
  console.log(`\n📥 [${new Date().toISOString()}] ${req.method} ${req.path}`);
  if (Object.keys(req.query).length > 0) {
    console.log(`   Query params:`, req.query);
  }
  if (req.body && Object.keys(req.body).length > 0) {
    console.log(`   Body:`, JSON.stringify(req.body, null, 2));
  }
  next();
});

// Serve static files from multiple possible locations
const staticPaths = [
  join(__dirname, '../src'),
  join(__dirname, '..'),
  join(process.cwd(), 'src'),
  join(process.cwd())
];

// Try to serve static files from the first available path
for (const staticPath of staticPaths) {
  try {
    if (existsSync(staticPath)) {
      app.use(express.static(staticPath));
      console.log(`📁 Serving static files from: ${staticPath}`);
      break;
    }
  } catch (e) {
    // Continue to next path
  }
}

// Initialize services
const config = getConfig();
const oauthFlow = new AlloyOAuthFlow();

// ============================================================================
// Core API Endpoints
// ============================================================================

/**
 * Health check endpoint
 */
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    message: 'Alloy Connectivity Backend is running',
    timestamp: new Date().toISOString(),
    port: PORT,
    callbackUrl: config.oauthRedirectUri || DEFAULT_REDIRECT_URI
  });
});

/**
 * Test callback endpoint - to verify server is reachable
 */
app.get('/oauth/callback/test', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Callback endpoint is reachable!',
    receivedAt: new Date().toISOString(),
    queryParams: req.query,
    fullUrl: req.protocol + '://' + req.get('host') + req.originalUrl
  });
});

/**
 * Check configuration status
 */
app.get('/api/config/check', (req: Request, res: Response) => {
  const defaultRedirectUri = config.oauthRedirectUri || DEFAULT_REDIRECT_URI;
  res.json({
    success: true,
    config: {
      hasApiKey: !!config.alloyApiKey,
      hasUserId: !!config.alloyUserId,
      baseUrl: config.alloyBaseUrl,
      environment: config.environment,
      apiKeyPreview: config.alloyApiKey ? `${config.alloyApiKey.substring(0, 10)}...` : undefined,
      oauthRedirectUri: config.oauthRedirectUri || defaultRedirectUri,
      hasCustomRedirectUri: !!config.oauthRedirectUri
    },
    status: {
      ready: !!config.alloyApiKey && !!config.alloyUserId
    }
  });
});

/**
 * Create connection with API key (for internal integrations)
 * POST /api/oauth/create-with-api-key
 * Body: { connectorId: string, apiKey?: string }
 */
app.post('/api/oauth/create-with-api-key', async (req: Request, res: Response) => {
  try {
    const { connectorId, apiKey } = req.body;

    if (!connectorId) {
      return res.status(400).json({
        success: false,
        error: 'connectorId is required'
      });
    }

    // Check if this is Notion - it only supports OAuth 2.0
    if (connectorId === 'notion') {
      return res.status(400).json({
        success: false,
        error: 'Notion connector only supports OAuth 2.0 authentication',
        message: 'The Notion connector does not support API key authentication. Please use OAuth 2.0 flow instead.',
        solution: {
          method: 'Use OAuth 2.0 flow',
          endpoint: 'POST /api/oauth/initiate',
          steps: [
            '1. Call POST /api/oauth/initiate with connectorId: "notion"',
            '2. Redirect user to the returned oauthUrl',
            '3. Handle callback at /oauth/callback',
            '4. Connection will be created automatically'
          ],
          note: 'Your NOTION_INTERNAL_TOKEN can be used directly with Notion API, but for Alloy connectivity, OAuth is required.'
        },
        alternative: {
          message: 'If you have a Notion internal token, you can use it directly with Notion API (not through Alloy)',
          directApi: 'Use the Notion API directly: https://developers.notion.com/reference'
        }
      });
    }

    // Use provided API key
    const finalApiKey = apiKey;
    
    if (!finalApiKey) {
      return res.status(400).json({
        success: false,
        error: 'API key is required. Provide it in the request body.'
      });
    }

    console.log(`\n=== Creating Connection with API Key ===`);
    console.log(`Connector ID: ${connectorId}`);
    console.log(`API Key: ${finalApiKey.substring(0, 10)}...`);
    
    const { connectionId, credentialId } = await oauthFlow.createConnectionWithApiKey(
      connectorId,
      finalApiKey
    );

    console.log(`Connection created: ${connectionId}`);
    console.log(`Credential ID: ${credentialId || 'N/A'}`);
    
    res.json({
      success: true,
      connectionId: connectionId,
      credentialId: credentialId,
      message: 'Connection created successfully using API key authentication'
    });
  } catch (error: any) {
    console.error('Error creating connection with API key:', error.message);
    console.error('Full error:', error);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
      console.error('Response headers:', error.response.headers);
    }
    
    const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
    const errorDetails = error.response?.data || { 
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText
    };
    
    // Check if it's the authentication type not found error
    if (error.response?.data?.code === 'AUTHENTICATION_NOT_FOUND') {
      return res.status(400).json({
        success: false,
        error: 'Authentication type not found',
        message: `The connector "${req.body.connectorId}" does not support API key authentication. Use OAuth 2.0 instead.`,
        details: errorDetails,
        solution: {
          useOAuth: true,
          endpoint: 'POST /api/oauth/initiate',
          connectorId: req.body.connectorId
        }
      });
    }
    
    res.status(error.response?.status || 500).json({
      success: false,
      error: errorMessage,
      details: errorDetails,
      troubleshooting: {
        suggestion: 'This connector may not support API key authentication. Try OAuth 2.0 instead.',
        commonIssues: [
          'Connector only supports OAuth 2.0 (like Notion)',
          'API key format is incorrect',
          'API key does not have proper permissions',
          'Alloy API endpoint returned an error - check server logs'
        ]
      }
    });
  }
});

/**
 * Initiate OAuth flow for a connector using MCP server
 * POST /api/oauth/initiate
 * Body: { connectorId: string, redirectUri?: string, useMCP?: boolean }
 */
app.post('/api/oauth/initiate', async (req: Request, res: Response) => {
  try {
    const { connectorId, redirectUri, useMCP } = req.body;

    if (!connectorId) {
      return res.status(400).json({
        success: false,
        error: 'connectorId is required'
      });
    }

    // Use custom redirect URI from request, config, or default
    const finalRedirectUri = redirectUri || config.oauthRedirectUri || DEFAULT_REDIRECT_URI;
    
    console.log(`\n=== Initiating OAuth Flow ===`);
    console.log(`Connector ID: ${connectorId}`);
    console.log(`Redirect URI: ${finalRedirectUri}`);
    console.log(`Using MCP: ${useMCP ? 'Yes' : 'No (direct API)'}`);
    
    if (useMCP) {
      // Note: MCP functions need to be called from MCP context
      // This endpoint provides instructions for using MCP
      return res.json({
        success: true,
        useMCP: true,
        message: 'Use MCP server to create credential',
        instructions: {
          step1: 'Call mcp_alloy_create_credential_alloy with:',
          parameters: {
            connectorId: connectorId,
            authenticationType: 'oauth2',
            redirectUri: finalRedirectUri
          },
          step2: 'The MCP server will return an oauthUrl',
          step3: 'Redirect user to the oauthUrl',
          step4: 'Handle callback at /oauth/callback'
        },
        note: 'MCP functions must be called from MCP-enabled context (like Cursor AI)'
      });
    }

    // If we have an internal token for Notion, log a warning but allow OAuth as fallback
    if (connectorId === 'notion' && config.notionInternalToken) {
      console.log('⚠️  Warning: Notion internal token detected. Consider using API key authentication instead.');
    }
    
    if (config.oauthRedirectUri && !redirectUri) {
      console.log(`   (Using configured redirect URI from OAUTH_REDIRECT_URI)`);
    }
    
    const { oauthUrl, credentialId } = await oauthFlow.initiateOAuthFlow(
      connectorId,
      finalRedirectUri
    );

    console.log(`OAuth URL generated: ${oauthUrl}`);
    console.log(`Credential ID: ${credentialId || 'N/A'}`);

    // Store credentialId temporarily (in production, use Redis or database)
    // For now, we'll pass it via state parameter
    // Note: The OAuth URL might already include a state parameter from Alloy
    // We need to append our state or merge it properly
    
    res.json({
      success: true,
      oauthUrl: oauthUrl,
      credentialId: credentialId,
      redirectUri: finalRedirectUri,
      useMCP: false
    });
  } catch (error: any) {
    console.error('Error initiating OAuth flow:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.message,
      details: error.response?.data
    });
  }
});

/**
 * Handle OAuth callback (web redirect)
 * GET /oauth/callback
 */
app.get('/oauth/callback', async (req: Request, res: Response) => {
  try {
    // Debug: Log all received parameters
    console.log('\n🎯 === OAuth Callback Received ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Full URL:', req.protocol + '://' + req.get('host') + req.originalUrl);
    console.log('Path:', req.path);
    console.log('Original URL:', req.originalUrl);
    console.log('Query parameters:', JSON.stringify(req.query, null, 2));
    console.log('URL Hash (if any):', req.url.split('#')[1] || 'none');
    console.log('Headers:', {
      'user-agent': req.get('user-agent'),
      'referer': req.get('referer'),
      'host': req.get('host'),
      'origin': req.get('origin')
    });

    const code = req.query.code as string;
    const state = req.query.state as string;
    const connectorId = (req.query.connectorId as string) || 'notion';
    const error = req.query.error as string;
    const errorDescription = req.query.error_description as string;
    const useMCP = req.query.useMCP === 'true' || req.query.mcp === 'true';
    
    // If using MCP, show the code and provide instructions
    // The MCP server will handle the callback automatically when the user authorizes
    if (useMCP && code) {
      console.log('📋 MCP OAuth callback detected - code received');
      console.log('   Code:', code);
      console.log('   State:', state || 'none');
      console.log('   Note: MCP server should handle this automatically');
      
      // Try to find the connection that was created via MCP
      try {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const connections = await oauthFlow.listConnections();
        const notionConnections = connections.filter((conn: any) => {
          const connId = conn.connectorId || conn.connector_id;
          return connId === 'notion';
        });
        
        if (notionConnections.length > 0) {
          const sorted = notionConnections.sort((a: any, b: any) => {
            const aTime = new Date(a.createdAt || a.created_at || 0).getTime();
            const bTime = new Date(b.createdAt || b.created_at || 0).getTime();
            return bTime - aTime;
          });
          const recentConnection = sorted[0];
          const connectionId = recentConnection.id || recentConnection.connectionId || recentConnection.credentialId;
          
          return res.send(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>OAuth Success</title>
                <style>
                  body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
                  .success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 5px; margin: 20px 0; }
                  code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; font-family: monospace; word-break: break-all; display: block; margin: 10px 0; }
                </style>
              </head>
              <body>
                <h1>✅ Success!</h1>
                <div class="success">
                  <p><strong>Connection established via MCP server!</strong></p>
                  <p><strong>Connection ID:</strong></p>
                  <code>${connectionId}</code>
                </div>
                <h2>Next Steps:</h2>
                <ol>
                  <li>Copy the Connection ID above</li>
                  <li>Add it to your <code>.env</code> file: <code>CONNECTION_ID=${connectionId}</code></li>
                </ol>
                <p><a href="/">← Back to Home</a></p>
              </body>
            </html>
          `);
        }
      } catch (findError: any) {
        console.log('Could not find connection automatically:', findError.message);
      }
      
      return res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>MCP OAuth Callback</title>
            <style>
              body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
              .info { background: #d1ecf1; border: 1px solid #bee5eb; color: #0c5460; padding: 15px; border-radius: 5px; margin: 20px 0; }
              code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; font-family: monospace; word-break: break-all; display: block; margin: 10px 0; }
            </style>
          </head>
          <body>
            <h1>✅ OAuth Code Received</h1>
            <div class="info">
              <p><strong>Authorization code received via MCP OAuth flow!</strong></p>
              <p><strong>Code:</strong></p>
              <code>${code}</code>
              <p><strong>Note:</strong> The MCP server should have automatically created the connection.</p>
              <p>Check your connections or wait a moment for the connection to be processed.</p>
            </div>
            <p><a href="/">← Back to Home</a></p>
          </body>
        </html>
      `);
    }
    
    // Check if tokens are passed directly in the callback (some OAuth flows return tokens)
    const accessToken = req.query.access_token as string;
    const refreshToken = req.query.refresh_token as string;
    
    // For Alloy API, we may need to look up the credentialId from the most recent initiation
    // Since we can't store state server-side easily, let's try without credentialId first
    // If that fails with the tokens error, we'll need to list credentials and find the matching one
    let credentialId: string | undefined;
    
    // Try to get credentialId from recent credentials if code exchange fails
    // For now, we'll try the callback without it first
    
    console.log('Checking for tokens in callback:');
    console.log(`  access_token: ${accessToken ? 'present' : 'not present'}`);
    console.log(`  refresh_token: ${refreshToken ? 'present' : 'not present'}`);
    console.log(`  code: ${code ? 'present' : 'not present'}`);

    // Handle OAuth errors from the provider
    if (error) {
      console.error('OAuth provider error:', error, errorDescription);
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>OAuth Error</title>
            <style>
              body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
              .error { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; padding: 15px; border-radius: 5px; margin: 20px 0; }
              code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; font-family: monospace; }
            </style>
          </head>
          <body>
            <h1>OAuth Error</h1>
            <div class="error">
              <p><strong>Error:</strong> ${error}</p>
              ${errorDescription ? `<p><strong>Description:</strong> ${errorDescription}</p>` : ''}
            </div>
            <p><a href="/">← Back to Home</a></p>
          </body>
        </html>
      `);
    }

    // Check for code in URL fragment (client-side only)
    // If no code in query params, try to find connection automatically first
    if (!code && !accessToken && !refreshToken) {
      console.log('No authorization code in query parameters');
      console.log('Attempting to find connection that was created server-side by Alloy...');
      
      try {
        // Wait a moment for Alloy to process the connection
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // List all connections and find the most recent Notion connection
        const connections = await oauthFlow.listConnections();
        console.log(`Found ${connections.length} total connections`);
        
        // Filter for Notion connections
        const notionConnections = connections.filter((conn: any) => {
          const connId = conn.connectorId || conn.connector_id;
          const connType = conn.type || '';
          const connName = (conn.name || '').toLowerCase();
          return connId === 'notion' || 
                 connType === 'notion-oauth2' || 
                 connType.includes('notion') || 
                 connName.includes('notion');
        });
        
        if (notionConnections.length > 0) {
          // Sort by creation date (most recent first)
          const sorted = notionConnections.sort((a: any, b: any) => {
            const aTime = new Date(a.createdAt || a.created_at || 0).getTime();
            const bTime = new Date(b.createdAt || b.created_at || 0).getTime();
            return bTime - aTime;
          });
          
          const recentConnection = sorted[0];
          const connectionId = recentConnection.id || recentConnection.connectionId || recentConnection.credentialId;
          
          console.log(`✅ Found recent Notion connection: ${connectionId}`);
          console.log(`   Created: ${recentConnection.createdAt || recentConnection.created_at || 'unknown'}`);
          
          // Test the connection to make sure it works
          try {
            const { NotionClient } = await import('./notion-client.js');
            const testClient = new NotionClient(config, connectionId);
            await testClient.searchPages(undefined, { value: 'page', property: 'object' });
            console.log(`✅ Connection test successful!`);
            
            // Send success response
            return res.send(`
              <!DOCTYPE html>
              <html>
                <head>
                  <title>OAuth Success</title>
                  <style>
                    body {
                      font-family: Arial, sans-serif;
                      max-width: 600px;
                      margin: 50px auto;
                      padding: 20px;
                    }
                    .success {
                      background: #d4edda;
                      border: 1px solid #c3e6cb;
                      color: #155724;
                      padding: 15px;
                      border-radius: 5px;
                      margin: 20px 0;
                    }
                    .info {
                      background: #d1ecf1;
                      border: 1px solid #bee5eb;
                      color: #0c5460;
                      padding: 15px;
                      border-radius: 5px;
                      margin: 20px 0;
                    }
                    code {
                      background: #f4f4f4;
                      padding: 2px 6px;
                      border-radius: 3px;
                      font-family: monospace;
                      word-break: break-all;
                      display: block;
                      margin: 10px 0;
                    }
                  </style>
                </head>
                <body>
                  <h1>✅ Success!</h1>
                  <div class="success">
                    <p><strong>Connection established successfully!</strong></p>
                    <p>Alloy processed the OAuth flow server-side and created the connection automatically.</p>
                    <p><strong>Connection ID:</strong></p>
                    <code>${connectionId}</code>
                  </div>
                  <div class="info">
                    <p><strong>Note:</strong> No authorization code was needed - Alloy handled the OAuth flow automatically.</p>
                  </div>
                  <h2>Next Steps:</h2>
                  <ol>
                    <li>Copy the Connection ID above</li>
                    <li>Add it to your <code>.env</code> file: <code>CONNECTION_ID=${connectionId}</code></li>
                    <li>You can now use this connection to interact with ${connectorId} via Alloy API</li>
                  </ol>
                  <p><a href="/">← Back to Home</a></p>
                </body>
              </html>
            `);
          } catch (testError: any) {
            console.log(`⚠️  Connection found but test failed: ${testError.message}`);
            // Continue to show fragment extraction page
          }
        } else {
          console.log('No Notion connections found, checking for code in URL fragment...');
        }
      } catch (findError: any) {
        console.log(`Error finding connections: ${findError.message}`);
        // Continue to show fragment extraction page
      }
      
      // Send HTML page with JavaScript to extract code from URL fragment
      return res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Processing OAuth Callback</title>
            <style>
              body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; text-align: center; }
              .loading { display: inline-block; width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #007bff; border-radius: 50%; animation: spin 1s linear infinite; margin: 20px; }
              @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
              .info { background: #d1ecf1; border: 1px solid #bee5eb; color: #0c5460; padding: 15px; border-radius: 5px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <h1>Processing OAuth Callback...</h1>
            <div class="loading"></div>
            <div class="info">
              <p>Extracting authorization code from URL...</p>
            </div>
            <script>
              (function() {
                // Extract code from URL fragment (#code=...)
                const hash = window.location.hash.substring(1);
                const params = new URLSearchParams(hash);
                const code = params.get('code');
                const state = params.get('state');
                const error = params.get('error');
                const errorDescription = params.get('error_description');
                
                // Also check query parameters
                const urlParams = new URLSearchParams(window.location.search);
                const queryCode = urlParams.get('code');
                const queryState = urlParams.get('state');
                const queryError = urlParams.get('error');
                
                // Use code from fragment or query params
                const finalCode = code || queryCode;
                const finalState = state || queryState;
                const finalError = error || queryError;
                
                console.log('URL Fragment:', hash);
                console.log('Extracted Code:', finalCode ? 'Found' : 'Not found');
                console.log('Extracted State:', finalState || 'Not found');
                console.log('Extracted Error:', finalError || 'None');
                
                if (finalError) {
                  // Redirect with error
                  window.location.href = window.location.pathname + '?error=' + encodeURIComponent(finalError) + 
                    (errorDescription ? '&error_description=' + encodeURIComponent(errorDescription) : '');
                  return;
                }
                
                if (finalCode) {
                  // Redirect with code in query parameters so server can read it
                  const newUrl = window.location.pathname + '?code=' + encodeURIComponent(finalCode) + 
                    (finalState ? '&state=' + encodeURIComponent(finalState) : '') +
                    '&_extracted_from_fragment=true';
                  console.log('Redirecting to:', newUrl);
                  window.location.href = newUrl;
                } else {
                  // No code found, show error
                  document.body.innerHTML = '<h1>⚠️ No Authorization Code Found</h1>' +
                    '<div class="info">' +
                    '<p><strong>The OAuth callback reached our server, but no authorization code was found in the URL.</strong></p>' +
                    '<p>This can happen if:</p>' +
                    '<ul style="text-align: left; display: inline-block;">' +
                    '<li>Alloy processed the OAuth flow server-side (we attempted to find the connection automatically)</li>' +
                    '<li>The code is in a URL fragment (#code=...) which requires client-side JavaScript to extract</li>' +
                    '<li>Notion redirected without including the code</li>' +
                    '</ul>' +
                    '<p><strong>Next Steps:</strong></p>' +
                    '<ul style="text-align: left; display: inline-block;">' +
                    '<li>Check the browser\'s address bar - look for the full URL including any fragments</li>' +
                    '<li>If you see #code=... in the URL, the page should automatically redirect</li>' +
                    '<li>Check your terminal - we may have found the connection automatically</li>' +
                    '<li>Try checking your connections: <code>npm run list-connections notion</code></li>' +
                    '<li>If a connection was created, you can use it even without the callback code</li>' +
                    '</ul>' +
                    '<p>Redirect URI used: <code>${req.protocol}://${req.get('host')}/oauth/callback</code></p>' +
                    '<p><a href="/">← Back to Home</a></p>' +
                    '</div>';
                }
              })();
            </script>
          </body>
        </html>
      `);
    }

    // Exchange code/tokens for connection ID
    console.log(`Processing OAuth callback for connection ID (connector: ${connectorId})...`);
    
    try {
      // Try with tokens first if available, otherwise use code
      console.log(`Using credentialId: ${credentialId || 'none (will try to find from recent credentials)'}`);
      const { connectionId, credentialId: returnedCredentialId } = await oauthFlow.handleOAuthCallback(
        connectorId,
        code || undefined, // Pass code if available
        state,
        credentialId,
        accessToken || undefined, // Pass access token if available
        refreshToken || undefined // Pass refresh token if available
      );
      console.log(`✅ Connection established: ${connectionId}`);
      
      // Send success response
      return res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>OAuth Success</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                max-width: 600px;
                margin: 50px auto;
                padding: 20px;
              }
              .success {
                background: #d4edda;
                border: 1px solid #c3e6cb;
                color: #155724;
                padding: 15px;
                border-radius: 5px;
                margin: 20px 0;
              }
              code {
                background: #f4f4f4;
                padding: 2px 6px;
                border-radius: 3px;
                font-family: monospace;
                word-break: break-all;
                display: block;
                margin: 10px 0;
              }
            </style>
          </head>
          <body>
            <h1>✅ Success!</h1>
            <div class="success">
              <p><strong>Connection established successfully!</strong></p>
              <p><strong>Connection ID:</strong></p>
              <code>${connectionId}</code>
              ${returnedCredentialId ? `<p><strong>Credential ID:</strong> <code>${returnedCredentialId}</code></p>` : ''}
            </div>
            <h2>Next Steps:</h2>
            <ol>
              <li>Copy the Connection ID above</li>
              <li>Add it to your <code>.env</code> file: <code>CONNECTION_ID=${connectionId}</code></li>
              <li>You can now use this connection to interact with ${connectorId} via Alloy API</li>
            </ol>
          </body>
        </html>
      `);
    } catch (callbackError: any) {
      // If callback fails and we don't have credentialId, try to find it from recent credentials
      if (!credentialId && callbackError.response?.data?.message?.includes('token')) {
        console.log('Callback failed, attempting to find credentialId from recent credentials...');
        try {
          const connections = await oauthFlow.listConnections();
          const recentCredentials = connections
            .filter((conn: any) => conn.connectorId === connectorId)
            .sort((a: any, b: any) => {
              const aTime = new Date(a.createdAt || a.created_at || 0).getTime();
              const bTime = new Date(b.createdAt || b.created_at || 0).getTime();
              return bTime - aTime;
            });
          
          if (recentCredentials.length > 0) {
            const recentCredentialId = recentCredentials[0].id || recentCredentials[0].credentialId;
            console.log(`Found recent credential: ${recentCredentialId}, retrying callback...`);
            
            const { connectionId, credentialId: returnedCredentialId } = await oauthFlow.handleOAuthCallback(
              connectorId,
              code,
              state,
              recentCredentialId
            );
            console.log(`✅ Connection established: ${connectionId}`);
            
            // Send success response
            return res.send(`
              <!DOCTYPE html>
              <html>
                <head>
                  <title>OAuth Success</title>
                  <style>
                    body {
                      font-family: Arial, sans-serif;
                      max-width: 600px;
                      margin: 50px auto;
                      padding: 20px;
                    }
                    .success {
                      background: #d4edda;
                      border: 1px solid #c3e6cb;
                      color: #155724;
                      padding: 15px;
                      border-radius: 5px;
                      margin: 20px 0;
                    }
                    code {
                      background: #f4f4f4;
                      padding: 2px 6px;
                      border-radius: 3px;
                      font-family: monospace;
                      word-break: break-all;
                      display: block;
                      margin: 10px 0;
                    }
                  </style>
                </head>
                <body>
                  <h1>✅ Success!</h1>
                  <div class="success">
                    <p><strong>Connection established successfully!</strong></p>
                    <p><strong>Connection ID:</strong></p>
                    <code>${connectionId}</code>
                    ${returnedCredentialId ? `<p><strong>Credential ID:</strong> <code>${returnedCredentialId}</code></p>` : ''}
                  </div>
                  <h2>Next Steps:</h2>
                  <ol>
                    <li>Copy the Connection ID above</li>
                    <li>Add it to your <code>.env</code> file: <code>CONNECTION_ID=${connectionId}</code></li>
                    <li>You can now use this connection to interact with ${connectorId} via Alloy API</li>
                  </ol>
                </body>
              </html>
            `);
          }
        } catch (retryError: any) {
          console.error('Retry with credentialId also failed:', retryError.message);
          throw callbackError; // Throw original error
        }
      }
      throw callbackError; // Re-throw if we can't recover
    }

  } catch (error: any) {
    console.error('Error handling OAuth callback:', error.message);
    res.status(500).send(`
      <html>
        <head><title>OAuth Error</title></head>
        <body>
          <h1>OAuth Error</h1>
          <p>Failed to complete OAuth flow: ${error.message}</p>
          <p><a href="/connect-notion-frontend.html">Try again</a></p>
        </body>
      </html>
    `);
  }
});

/**
 * Handle OAuth callback (API endpoint)
 * POST /api/oauth/callback
 */
app.post('/api/oauth/callback', async (req: Request, res: Response) => {
  try {
    const { code, state, connectorId, access_token, refresh_token, credentialId } = req.body;

    // Validate that we have either code or tokens
    if (!code && !access_token && !refresh_token) {
      return res.status(400).json({
        success: false,
        error: 'Either authorization code or both access_token and refresh_token are required'
      });
    }

    const connector = connectorId || 'notion';
    const { connectionId, credentialId: returnedCredentialId } = await oauthFlow.handleOAuthCallback(
      connector,
      code,
      state,
      credentialId,
      access_token,
      refresh_token
    );

    res.json({
      success: true,
      connectionId: connectionId,
      credentialId: returnedCredentialId,
      connectorId: connector
    });
  } catch (error: any) {
    console.error('Error handling OAuth callback:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.message,
      details: error.response?.data
    });
  }
});

/**
 * List all connections
 * GET /api/connections
 */
app.get('/api/connections', async (req: Request, res: Response) => {
  try {
    const connections = await oauthFlow.listConnections();
    res.json({
      success: true,
      connections: connections,
      count: connections.length
    });
  } catch (error: any) {
    console.error('Error listing connections:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.message,
      details: error.response?.data
    });
  }
});

/**
 * Get a specific connection by ID
 * GET /api/connections/:connectionId
 */
app.get('/api/connections/:connectionId', async (req: Request, res: Response) => {
  try {
    const { connectionId } = req.params;
    const includeTokens = req.query.tokens === 'true'; // Optional: ?tokens=true
    
    if (includeTokens) {
      // Get connection with token information
      const tokenInfo = await oauthFlow.getConnectionTokens(connectionId);
      res.json({
        success: true,
        connection: tokenInfo.connection,
        tokens: tokenInfo.tokenInfo,
        hasTokens: tokenInfo.hasTokens,
        alloyApiKey: tokenInfo.alloyApiKey, // Masked version
        note: 'Token information may be limited for security reasons. Raw tokens are typically not exposed.'
      });
    } else {
      // Get connection details only
      const connection = await oauthFlow.getConnection(connectionId);
      res.json({
        success: true,
        connection: connection,
        note: 'Add ?tokens=true to the URL to include token information'
      });
    }
  } catch (error: any) {
    console.error('Error getting connection:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.message,
      details: error.response?.data
    });
  }
});

/**
 * Get token information for a connection
 * GET /api/connections/:connectionId/tokens
 */
app.get('/api/connections/:connectionId/tokens', async (req: Request, res: Response) => {
  try {
    const { connectionId } = req.params;
    const tokenInfo = await oauthFlow.getConnectionTokens(connectionId);
    
    res.json({
      success: true,
      connectionId: connectionId,
      hasTokens: tokenInfo.hasTokens,
      tokenInfo: tokenInfo.tokenInfo,
      alloyApiKey: tokenInfo.alloyApiKey, // Masked version for reference
      connectionStatus: tokenInfo.connection?.status,
      note: tokenInfo.hasTokens 
        ? 'Tokens retrieved successfully. Note: Alloy may mask sensitive token values for security.'
        : 'No token information found in connection. Tokens may be stored securely by Alloy and not exposed via API.',
      securityNote: 'For security reasons, Alloy typically does not expose raw access tokens. Use the connection ID to make API calls through Alloy.'
    });
  } catch (error: any) {
    console.error('Error getting connection tokens:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.message,
      details: error.response?.data
    });
  }
});

/**
 * List available connectors/integrations
 * GET /api/connectors
 */
app.get('/api/connectors', async (req: Request, res: Response) => {
  try {
    // Return list of available connectors
    // In production, this would fetch from Alloy API
    const availableConnectors = [
      {
        id: 'notion',
        name: 'Notion',
        category: ['productivity'],
        description: 'Connect to Notion workspace to manage pages, databases, and blocks'
      }
    ];

    res.json({
      success: true,
      connectors: availableConnectors,
      count: availableConnectors.length,
      note: 'To see all available connectors, visit https://app.runalloy.com'
    });
  } catch (error: any) {
    console.error('Error listing connectors:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Register redirect URI with Alloy account
 * POST /api/oauth/register-redirect-uri
 * Body: { connectorId?: string, redirectUri?: string }
 */
app.post('/api/oauth/register-redirect-uri', async (req: Request, res: Response) => {
  try {
    const { connectorId = 'notion', redirectUri } = req.body;
    const finalRedirectUri = redirectUri || config.oauthRedirectUri || DEFAULT_REDIRECT_URI;
    
    console.log(`\n=== Registering Redirect URI ===`);
    console.log(`Connector ID: ${connectorId}`);
    console.log(`Redirect URI: ${finalRedirectUri}`);
    
    const oauthFlow = new AlloyOAuthFlow();
    const result = await oauthFlow.registerRedirectUri(connectorId, finalRedirectUri);
    
    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        redirectUri: finalRedirectUri,
        connectorId: connectorId,
        oauthUrl: result.oauthUrl,
        credentialId: result.credentialId,
        note: 'The redirect URI should now be registered. You can use the oauthUrl to complete OAuth if needed.',
        dashboardInstructions: {
          step1: 'Go to https://app.runalloy.com',
          step2: 'Navigate to your account settings or connector settings',
          step3: `Verify that ${finalRedirectUri} is listed as an allowed redirect URI`,
          step4: 'If not listed, you may need to add it manually in the dashboard'
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
        redirectUri: finalRedirectUri,
        connectorId: connectorId,
        dashboardInstructions: {
          step1: 'Go to https://app.runalloy.com and sign in',
          step2: 'Navigate to Settings > Integrations or Connectors',
          step3: `Find the ${connectorId} connector settings`,
          step4: `Add ${finalRedirectUri} to the list of allowed redirect URIs`,
          step5: 'Save the changes',
          alternative: 'Contact Alloy support if you cannot find the redirect URI settings'
        },
        troubleshooting: {
          commonIssues: [
            'Redirect URI must match exactly (including protocol, domain, and path)',
            'Some connectors require redirect URIs to be registered before creating credentials',
            'Check your Alloy account permissions - you may need admin access',
            'The redirect URI might already be registered - try initiating OAuth'
          ]
        }
      });
    }
  } catch (error: any) {
    console.error('Error registering redirect URI:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to register redirect URI. Please register it manually in the Alloy dashboard.'
    });
  }
});

/**
 * Serve frontend HTML files
 */
app.get('/', (req: Request, res: Response) => {
  try {
    // Try multiple paths to find the HTML file (works in both dev and production)
    const possiblePaths = [
      join(__dirname, '../src/connect-notion-frontend.html'),
      join(__dirname, 'connect-notion-frontend.html'),
      join(process.cwd(), 'src/connect-notion-frontend.html'),
      join(process.cwd(), 'connect-notion-frontend.html')
    ];
    
    let html: string | null = null;
    for (const htmlPath of possiblePaths) {
      try {
        html = readFileSync(htmlPath, 'utf-8');
        break;
      } catch (e) {
        // Try next path
        continue;
      }
    }
    
    if (html) {
      res.send(html);
    } else {
      // If HTML file not found, return API info
      res.json({
        message: 'Alloy Connectivity Backend API',
        endpoints: {
          health: '/api/health',
          initiateOAuth: 'POST /api/oauth/initiate',
          oauthCallback: 'GET /oauth/callback',
          listConnections: 'GET /api/connections',
          getConnection: 'GET /api/connections/:connectionId'
        },
        note: 'Frontend HTML file not found. API endpoints are available.'
      });
    }
  } catch (error: any) {
    console.error('Error serving frontend:', error.message);
    res.status(500).json({
      message: 'Alloy Connectivity Backend API',
      error: 'Failed to serve frontend',
      endpoints: {
        health: '/api/health',
        initiateOAuth: 'POST /api/oauth/initiate',
        oauthCallback: 'GET /oauth/callback',
        listConnections: 'GET /api/connections',
        getConnection: 'GET /api/connections/:connectionId'
      }
    });
  }
});

/**
 * 404 Handler - Catch all unmatched routes
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `The requested route ${req.method} ${req.path} was not found on this server.`,
    availableEndpoints: {
      health: 'GET /api/health',
      configCheck: 'GET /api/config/check',
      initiateOAuth: 'POST /api/oauth/initiate',
      oauthCallback: 'GET /oauth/callback',
      oauthCallbackApi: 'POST /api/oauth/callback',
      listConnections: 'GET /api/connections',
      getConnection: 'GET /api/connections/:connectionId',
      getConnectionTokens: 'GET /api/connections/:connectionId/tokens',
      listConnectors: 'GET /api/connectors'
    },
    note: 'Check the available endpoints above or visit the root path (/) for the frontend interface.'
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`\n🚀 Alloy Connectivity Backend Server`);
  console.log(`📍 Server running on http://localhost:${PORT}`);
  console.log(`🌐 Frontend: http://localhost:${PORT}/`);
  console.log(`\n📋 Available endpoints:`);
  console.log(`   GET  /api/health - Health check`);
  console.log(`   GET  /api/config/check - Check configuration`);
  console.log(`   POST /api/oauth/initiate - Initiate OAuth flow`);
  console.log(`   GET  /oauth/callback - OAuth callback (web)`);
  console.log(`   POST /api/oauth/callback - OAuth callback (API)`);
  console.log(`   GET  /api/connections - List all connections`);
  console.log(`   GET  /api/connections/:id - Get connection details`);
  console.log(`   GET  /api/connectors - List available connectors`);
  console.log(`   POST /api/oauth/register-redirect-uri - Register redirect URI with Alloy`);
  console.log(`\n🔗 OAuth Callback URL: ${config.oauthRedirectUri || DEFAULT_REDIRECT_URI}`);
  console.log(`   Make sure this EXACT URL is registered in your Alloy account!`);
  console.log(`   💡 Tip: Use POST /api/oauth/register-redirect-uri to attempt automatic registration`);
  console.log();
});

// Handle server errors
server.on('error', (error: any) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`\n❌ Port ${PORT} is already in use.`);
    console.error(`   Please stop any other services using port ${PORT} or change the PORT environment variable.`);
    process.exit(1);
  } else {
    console.error('\n❌ Server error:', error.message);
    process.exit(1);
  }
});

export default app;
