import express, { Request, Response } from 'express';
import cors from 'cors';
import { getConfig } from './config.js';
import { AlloyOAuthFlow } from './oauth-flow.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(join(__dirname, '../src')));

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
    timestamp: new Date().toISOString()
  });
});

/**
 * Check configuration status
 */
app.get('/api/config/check', (req: Request, res: Response) => {
  res.json({
    success: true,
    config: {
      hasApiKey: !!config.alloyApiKey,
      hasUserId: !!config.alloyUserId,
      baseUrl: config.alloyBaseUrl,
      environment: config.environment,
      apiKeyPreview: config.alloyApiKey ? `${config.alloyApiKey.substring(0, 10)}...` : undefined
    },
    status: {
      ready: !!config.alloyApiKey && !!config.alloyUserId
    }
  });
});

/**
 * Initiate OAuth flow for a connector
 * POST /api/oauth/initiate
 * Body: { connectorId: string, redirectUri?: string }
 */
app.post('/api/oauth/initiate', async (req: Request, res: Response) => {
  try {
    const { connectorId, redirectUri } = req.body;

    if (!connectorId) {
      return res.status(400).json({
        success: false,
        error: 'connectorId is required'
      });
    }

    const finalRedirectUri = redirectUri || `http://localhost:${PORT}/oauth/callback`;
    
    console.log(`\n=== Initiating OAuth Flow ===`);
    console.log(`Connector ID: ${connectorId}`);
    console.log(`Redirect URI: ${finalRedirectUri}`);
    
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
      redirectUri: finalRedirectUri
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
    console.log('\n=== OAuth Callback Received ===');
    console.log('Full URL:', req.protocol + '://' + req.get('host') + req.originalUrl);
    console.log('Query parameters:', JSON.stringify(req.query, null, 2));
    console.log('Headers:', {
      'user-agent': req.get('user-agent'),
      'referer': req.get('referer'),
      'host': req.get('host')
    });

    const code = req.query.code as string;
    const state = req.query.state as string;
    const connectorId = (req.query.connectorId as string) || 'notion';
    const error = req.query.error as string;
    const errorDescription = req.query.error_description as string;
    
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

    // Validate that we have either code or tokens
    if (!code && !accessToken && !refreshToken) {
      console.error('No authorization code received in callback');
      console.error('This usually means:');
      console.error('  1. The redirect URI doesn\'t match what was registered');
      console.error('  2. The user cancelled the authorization');
      console.error('  3. The OAuth provider didn\'t include the code parameter');
      
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>OAuth Error</title>
            <style>
              body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
              .error { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; padding: 15px; border-radius: 5px; margin: 20px 0; }
              .info { background: #d1ecf1; border: 1px solid #bee5eb; color: #0c5460; padding: 15px; border-radius: 5px; margin: 20px 0; }
              code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; font-family: monospace; }
              pre { background: #f4f4f4; padding: 10px; border-radius: 5px; overflow: auto; font-size: 12px; }
              ul { margin: 10px 0; padding-left: 20px; }
              li { margin: 5px 0; }
            </style>
          </head>
          <body>
            <h1>OAuth Error: No Authorization Code or Tokens</h1>
            <div class="error">
              <p><strong>No authorization code or tokens were received in the callback.</strong></p>
              <p>This usually happens when:</p>
              <ul>
                <li>The redirect URI doesn't match exactly what was registered with Alloy</li>
                <li>The user cancelled the authorization process</li>
                <li>There was an issue with the OAuth provider</li>
                <li>The redirect URI is not whitelisted in your Alloy account</li>
                <li>The OAuth provider didn't return the expected parameters</li>
              </ul>
            </div>
            <div class="info">
              <p><strong>Debug Information:</strong></p>
              <p>Callback URL: <code>${req.protocol}://${req.get('host')}${req.originalUrl}</code></p>
              <p>Expected redirect URI: <code>http://localhost:${PORT}/oauth/callback</code></p>
              <p>Received query parameters:</p>
              <pre>${JSON.stringify(req.query, null, 2)}</pre>
            </div>
            <h2>How to Fix:</h2>
            <ol>
              <li><strong>Verify redirect URI:</strong> Make sure the redirect URI matches exactly:
                <ul>
                  <li>Expected: <code>http://localhost:${PORT}/oauth/callback</code></li>
                  <li>No trailing slashes, no different ports</li>
                </ul>
              </li>
              <li><strong>Check Alloy Dashboard:</strong>
                <ul>
                  <li>Go to <a href="https://app.runalloy.com" target="_blank">Alloy Dashboard</a></li>
                  <li>Check if the redirect URI is registered/whitelisted</li>
                  <li>Verify your API key has the correct permissions</li>
                </ul>
              </li>
              <li><strong>Try again:</strong>
                <ul>
                  <li>Make sure you complete the full OAuth flow (don't close the browser)</li>
                  <li>Check the browser console for any errors</li>
                </ul>
              </li>
            </ol>
            <p><a href="/">← Back to Home</a> | <a href="/" onclick="window.location.reload(); return false;">Try Again</a></p>
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
 * Serve frontend HTML files
 */
app.get('/', (req: Request, res: Response) => {
  try {
    // Try to read from src directory (works in both dev and production)
    const htmlPath = join(__dirname, '../src/connect-notion-frontend.html');
    const html = readFileSync(htmlPath, 'utf-8');
    res.send(html);
  } catch (error) {
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
