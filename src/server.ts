import express, { Request, Response } from 'express';
import cors from 'cors';
import { getConfig } from './config.js';
import { AlloyOAuthFlow } from './oauth-flow.js';
import axios from 'axios';
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
// Serve node_modules for SDK access
app.use('/node_modules', express.static(join(__dirname, '../node_modules')));

// Initialize Alloy services
const config = getConfig();
const oauthFlow = new AlloyOAuthFlow();

// ============================================================================
// API Routes
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
 * Comprehensive diagnostic endpoint
 * GET /api/diagnose
 */
app.get('/api/diagnose', async (req: Request, res: Response) => {
  try {
    const diagnostics: any = {
      timestamp: new Date().toISOString(),
      config: {
        hasApiKey: !!config.alloyApiKey,
        apiKeyLength: config.alloyApiKey ? config.alloyApiKey.length : 0,
        apiKeyPrefix: config.alloyApiKey ? `${config.alloyApiKey.substring(0, 10)}...` : 'N/A',
        hasUserId: !!config.alloyUserId,
        userId: config.alloyUserId || 'N/A',
        baseUrl: config.alloyBaseUrl,
        redirectUri: `http://localhost:${PORT}/oauth/callback`
      },
      tests: []
    };

    // Test 1: Check if we can list connections (tests API key and user ID)
    try {
      console.log('\n🔍 Diagnostic: Testing API connection...');
      const connections = await oauthFlow.listConnections();
      diagnostics.tests.push({
        name: 'API Connection Test',
        status: 'success',
        message: `Successfully connected to Alloy API. Found ${connections.length} connection(s)`,
        data: {
          connectionCount: connections.length,
          connections: connections.map((conn: any) => ({
            id: conn.id,
            connectorId: conn.connectorId || conn.integrationId,
            status: conn.status
          }))
        }
      });

      // Check for existing Notion connections
      const notionConnections = connections.filter((conn: any) => 
        conn.connectorId === 'notion' || conn.integrationId === 'notion'
      );
      if (notionConnections.length > 0) {
        diagnostics.tests.push({
          name: 'Existing Notion Connections',
          status: 'info',
          message: `Found ${notionConnections.length} existing Notion connection(s)`,
          data: {
            connections: notionConnections.map((conn: any) => ({
              id: conn.id,
              connectionId: conn.id || conn.connectionId,
              status: conn.status
            }))
          },
          suggestion: 'You may already have a Notion connection. Try using an existing connection ID.'
        });
      }
    } catch (error: any) {
      diagnostics.tests.push({
        name: 'API Connection Test',
        status: 'failed',
        message: `Failed to connect to Alloy API: ${error.message}`,
        error: error.response?.data || error.message,
        suggestion: 'Check your API key permissions and user ID. The API key may not have access to list credentials, or the user ID may be incorrect.'
      });
    }

    // Test 2: Validate OAuth configuration
    diagnostics.tests.push({
      name: 'OAuth Configuration',
      status: 'ready',
      message: 'OAuth configuration appears valid',
      config: {
        connectorId: 'notion',
        redirectUri: `http://localhost:${PORT}/oauth/callback`,
        userId: config.alloyUserId,
        apiVersion: '2025-09',
        authenticationType: 'oauth2'
      },
      checklist: [
        {
          item: 'API Key is set',
          status: !!config.alloyApiKey ? 'pass' : 'fail'
        },
        {
          item: 'User ID is set',
          status: !!config.alloyUserId ? 'pass' : 'fail'
        },
        {
          item: 'User ID format looks valid',
          status: config.alloyUserId && (
            config.alloyUserId.length === 24 || 
            config.alloyUserId.length === 36 || 
            config.alloyUserId.startsWith('user_')
          ) ? 'pass' : 'warning'
        },
        {
          item: 'Base URL is configured',
          status: !!config.alloyBaseUrl ? 'pass' : 'fail'
        }
      ]
    });

    res.json({
      success: true,
      diagnostics: diagnostics,
      summary: {
        totalTests: diagnostics.tests.length,
        passed: diagnostics.tests.filter((t: any) => t.status === 'success').length,
        failed: diagnostics.tests.filter((t: any) => t.status === 'failed').length,
        ready: diagnostics.tests.filter((t: any) => t.status === 'ready').length,
        info: diagnostics.tests.filter((t: any) => t.status === 'info').length
      },
      nextSteps: [
        'If API connection test failed: Check API key permissions in Alloy dashboard',
        'If no connections found: Proceed with OAuth flow to create a new connection',
        'If connections exist: You can use an existing connection ID',
        'Check Alloy dashboard for OAuth configuration and redirect URI settings'
      ]
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Configuration diagnostic endpoint
 * GET /api/config/check
 */
app.get('/api/config/check', (req: Request, res: Response) => {
  try {
    const hasApiKey = !!config.alloyApiKey;
    const hasUserId = !!config.alloyUserId;
    const apiKeyLength = config.alloyApiKey?.length || 0;
    const userIdLength = config.alloyUserId?.length || 0;
    const apiKeyPrefix = config.alloyApiKey?.substring(0, 10) || 'N/A';
    const userIdPreview = config.alloyUserId || 'N/A';

    res.json({
      success: true,
      config: {
        hasApiKey: hasApiKey,
        hasUserId: hasUserId,
        apiKeyLength: apiKeyLength,
        userIdLength: userIdLength,
        apiKeyPrefix: hasApiKey ? `${apiKeyPrefix}...` : 'N/A',
        userId: hasUserId ? userIdPreview : 'N/A',
        baseUrl: config.alloyBaseUrl
      },
      status: {
        ready: hasApiKey && hasUserId,
        missing: {
          apiKey: !hasApiKey,
          userId: !hasUserId
        }
      },
      suggestions: {
        apiKey: !hasApiKey ? 'Set ALLOY_API_KEY in your .env file' : 'API key is set',
        userId: !hasUserId ? 'Set ALLOY_USER_ID in your .env file' : 'User ID is set'
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get JWT token for Frontend SDK
 * POST /api/alloy/token
 */
app.post('/api/alloy/token', async (req: Request, res: Response) => {
  try {
    // Debug logging
    console.log('JWT token request received:', {
      hasBodyUserId: !!req.body.userId,
      bodyUserId: req.body.userId,
      configUserId: config.alloyUserId,
      configUserIdLength: config.alloyUserId?.length || 0,
      envUserId: process.env.ALLOY_USER_ID
    });
    
    const userId = req.body.userId || config.alloyUserId;
    
    // Validate userId is present
    if (!userId) {
      console.error('userId validation failed:', {
        bodyUserId: req.body.userId,
        configUserId: config.alloyUserId,
        envUserId: process.env.ALLOY_USER_ID,
        configType: typeof config.alloyUserId
      });
      
      return res.status(400).json({
        success: false,
        error: 'userId is required',
        message: 'userId must be provided either in the request body or in the ALLOY_USER_ID environment variable',
        details: {
          providedInBody: !!req.body.userId,
          providedInEnv: !!config.alloyUserId,
          configUserIdValue: config.alloyUserId || 'undefined',
          envUserIdValue: process.env.ALLOY_USER_ID || 'undefined',
          suggestion: 'Please set ALLOY_USER_ID in your .env file and restart the server, or provide userId in the request body'
        }
      });
    }

    // Validate userId format (basic check - not empty, no spaces)
    if (typeof userId !== 'string' || userId.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid userId format',
        message: 'userId must be a non-empty string',
        details: {
          userId: userId,
          suggestion: 'Please check your ALLOY_USER_ID in .env file or the userId in your request'
        }
      });
    }
    
    console.log(`Generating JWT token for userId: ${userId}`);
    
    // Generate JWT token using the embedded API
    const response = await axios.get(
      `https://embedded.runalloy.com/users/${userId}/token`,
      {
        headers: {
          'Authorization': `Bearer ${config.alloyApiKey}`,
          'x-api-version': '2025-09',
          'Accept': 'application/json',
        },
      }
    );

    const token = response.data.token || response.data;
    
    res.json({ 
      success: true,
      token: token,
      userId: userId
    });
  } catch (error: any) {
    console.error('Error generating JWT token:', error.message);
    
    // Provide better error messages based on the error type
    let errorMessage = error.message;
    let statusCode = error.response?.status || 500;
    let errorDetails = error.response?.data;
    let suggestion = '';

    if (error.response?.status === 400) {
      // Check if it's a userId validation error
      if (errorDetails?.error?.details) {
        const details = errorDetails.error.details;
        if (Array.isArray(details)) {
          const userIdError = details.find((d: any) => 
            d.properties === 'userId' || 
            d.message?.toLowerCase().includes('user') ||
            errorDetails.error?.message?.toLowerCase().includes('user')
          );
          
          if (userIdError || errorDetails.error?.message?.toLowerCase().includes('user')) {
            errorMessage = errorDetails.error?.message || 'Invalid userId format';
            suggestion = `The Alloy API rejected the userId format. Please check:
1. Your ALLOY_USER_ID in .env file is correct
2. The userId format matches what Alloy expects (check your Alloy dashboard)
3. Your API key has the correct permissions to generate tokens for this userId`;
          }
        }
      } else if (errorDetails?.error?.message) {
        errorMessage = errorDetails.error.message;
      } else if (errorDetails?.message) {
        errorMessage = errorDetails.message;
      }
    } else if (error.response?.status === 401) {
      errorMessage = 'Authentication failed';
      suggestion = 'Check your ALLOY_API_KEY in .env file';
    } else if (error.response?.status === 404) {
      errorMessage = 'User not found';
      suggestion = 'The userId may not exist or your API key does not have access to it';
    }
    
    res.status(statusCode).json({ 
      success: false,
      error: errorMessage,
      details: errorDetails,
      suggestion: suggestion || undefined
    });
  }
});

/**
 * Initiate OAuth flow for a connector
 * POST /api/oauth/initiate
 * Body: { connectorId: string, redirectUri: string }
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

    console.log(`\n📋 OAuth Initiation Request:`);
    console.log(`   Connector ID: ${connectorId}`);
    console.log(`   Redirect URI: ${finalRedirectUri}`);
    console.log(`   Request Origin: ${req.headers.origin || 'N/A'}`);

    const { oauthUrl, credentialId } = await oauthFlow.initiateOAuthFlow(
      connectorId,
      finalRedirectUri
    );

    console.log(`\n✅ OAuth URL Generated:`);
    console.log(`   OAuth URL: ${oauthUrl}`);
    console.log(`   Expected Callback: ${finalRedirectUri}`);
    console.log(`   ⚠️  IMPORTANT: Make sure this redirect URI matches exactly!`);

    res.json({
      success: true,
      oauthUrl: oauthUrl,
      credentialId: credentialId,
      redirectUri: finalRedirectUri,
      debug: {
        expectedCallback: finalRedirectUri,
        oauthUrlGenerated: oauthUrl
      }
    });
  } catch (error: any) {
    console.error('Error initiating OAuth flow:', error.message);
    console.error('Full error:', JSON.stringify(error.response?.data, null, 2));
    
    // Provide more helpful error messages
    let errorMessage = error.message;
    let errorDetails = error.response?.data;
    let suggestion = '';
    
    if (error.response?.status === 400) {
      if (errorDetails?.error?.details) {
        const details = errorDetails.error.details;
        if (Array.isArray(details)) {
          const userIdError = details.find((d: any) => d.properties === 'userId');
          if (userIdError) {
            errorMessage = `API Error: ${userIdError.message || 'Invalid userId format'}`;
            const currentUserId = config.alloyUserId || 'not set';
            suggestion = `The Alloy API is rejecting your userId format. Current value: "${currentUserId}"

To fix this:
1. Get your correct User ID from Alloy Dashboard:
   - Go to: https://app.runalloy.com
   - Navigate to: Settings → API Keys
   - Look for your User ID (it should look like "user_abc123..." or a UUID format)
   
2. Update your .env file:
   ALLOY_USER_ID=your_correct_user_id_here

3. Restart the server after updating .env

Note: User IDs are typically:
- Format: "user_xxx..." (starts with "user_")
- Or UUID format: "12345678-1234-1234-1234-123456789abc"
- Not short codes (use the full user ID from your Alloy dashboard)`;
          } else {
            // Other validation errors
            const errorMessages = details.map((d: any) => `${d.properties}: ${d.message}`).join(', ');
            errorMessage = `API Validation Error: ${errorMessages}`;
          }
        }
      } else if (errorDetails?.error?.message) {
        errorMessage = errorDetails.error.message;
      }
    } else if (error.response?.status === 401) {
      errorMessage = 'Authentication failed. Check your ALLOY_API_KEY in .env file.';
      suggestion = 'Verify your API key is correct and has the necessary permissions.';
    } else if (error.response?.status === 403) {
      errorMessage = 'Access forbidden. Your API key may not have permission to create OAuth credentials.';
      suggestion = 'Check your API key permissions in Alloy dashboard.';
    }
    
    res.status(error.response?.status || 500).json({
      success: false,
      error: errorMessage,
      details: errorDetails,
      suggestion: suggestion || undefined
    });
  }
});

/**
 * Handle OAuth callback
 * GET /oauth/callback
 */
app.get('/oauth/callback', async (req: Request, res: Response) => {
  try {
    // Log all query parameters for debugging
    console.log('\n📥 OAuth Callback Received (GET)');
    console.log('   Method: GET');
    console.log('   Query parameters:', JSON.stringify(req.query, null, 2));
    console.log('   Full URL:', req.url);
    console.log('   Headers:', JSON.stringify(req.headers, null, 2));
    console.log('   Body (if any):', JSON.stringify(req.body, null, 2));
    
    // Try to get code from query parameters first
    let code = req.query.code as string;
    let state = req.query.state as string;
    let connectorId = req.query.connectorId as string;
    let error = req.query.error as string;
    let error_description = req.query.error_description as string;
    
    // Also check URL hash/fragment (some OAuth flows use # instead of ?)
    const urlHash = req.url.split('#')[1];
    if (urlHash && !code) {
      console.log('   ⚠️  Found URL hash/fragment:', urlHash);
      // Try to parse hash parameters
      const hashParams = new URLSearchParams(urlHash);
      if (hashParams.has('code')) {
        const hashCode = hashParams.get('code');
        if (hashCode) {
          code = hashCode;
          console.log('   ✅ Found code in URL hash!');
        }
      }
    }

    // Check for OAuth errors first
    if (error) {
      console.error('   ❌ OAuth error received:', error);
      return res.status(400).send(`
        <html>
          <head>
            <title>OAuth Error</title>
            <style>
              body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
              .error { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; padding: 15px; border-radius: 5px; }
            </style>
          </head>
          <body>
            <h1>OAuth Error</h1>
            <div class="error">
              <p><strong>Error:</strong> ${error}</p>
              ${error_description ? `<p><strong>Description:</strong> ${error_description}</p>` : ''}
            </div>
            <p>Please try connecting again.</p>
          </body>
        </html>
      `);
    }

    // Check if code is present
    if (!code) {
      console.error('   ❌ No authorization code found');
      console.error('   Checked: query params, URL hash/fragment');
      console.error('   Available query params:', Object.keys(req.query));
      console.error('   Full request URL:', req.url);
      console.error('   ⚠️  IMPORTANT: Check what URL you were redirected to!');
      console.error('      - Look at browser address bar');
      console.error('      - Check if code is in query string (?code=...) or hash (#code=...)');
      console.error('      - Verify the OAuth URL from Alloy includes the redirectUri parameter');
      
      // Try to check if connection was created anyway (sometimes Alloy creates it without redirecting with code)
      console.log('   🔍 Attempting to check connection status by listing connections...');
      try {
        const connections = await oauthFlow.listConnections();
        const notionConnections = connections.filter((conn: any) => 
          conn.connectorId === 'notion' || conn.integrationId === 'notion'
        );
        
        if (notionConnections.length > 0) {
          console.log('   ✅ Found existing Notion connection(s)!');
          const latestConnection = notionConnections[notionConnections.length - 1];
          const connectionId = latestConnection.id || latestConnection.connectionId;
          
          return res.send(`
            <html>
              <head>
                <title>Connection Found!</title>
                <style>
                  body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
                  .success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 5px; margin: 20px 0; }
                  .warning { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; border-radius: 5px; margin: 20px 0; }
                  code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; font-family: monospace; }
                </style>
              </head>
              <body>
                <h1>✅ Connection Found!</h1>
                <div class="warning">
                  <p><strong>Note:</strong> The callback was received without a code parameter, but we found an existing Notion connection.</p>
                </div>
                <div class="success">
                  <p><strong>Connection ID:</strong> <code>${connectionId}</code></p>
                  <p><strong>Add this to your .env file:</strong></p>
                  <code>CONNECTION_ID=${connectionId}</code>
                </div>
                <p style="margin-top: 20px;"><a href="/connect-notion-frontend.html">← Back to Connect Page</a></p>
              </body>
            </html>
          `);
        }
      } catch (listError: any) {
        console.error('   ⚠️  Could not check connections:', listError.message);
      }
      
      // Provide detailed diagnostic page
      const diagnosticInfo = `
        <h2>Debug Information:</h2>
        <p><strong>Query Parameters:</strong></p>
        <pre>${JSON.stringify(req.query, null, 2)}</pre>
        <p><strong>Full URL:</strong></p>
        <code>${req.url}</code>
        ${urlHash ? `<p><strong>URL Hash/Fragment:</strong></p><code>${urlHash}</code>` : ''}
        <p><strong>Request Method:</strong> ${req.method}</p>
        
        <h2>What to Check:</h2>
        <ol>
          <li><strong>Browser Address Bar (CRITICAL):</strong>
            <ul>
              <li>What is the EXACT URL shown in your browser's address bar right now?</li>
              <li>Copy the full URL and check if it has <code>?code=...</code> or <code>#code=...</code></li>
              <li>If the URL is different from <code>http://localhost:3000/oauth/callback</code>, that's the issue!</li>
            </ul>
          </li>
          <li><strong>Alloy OAuth Flow:</strong>
            <ul>
              <li>The OAuth flow goes: Your App → Alloy → Notion → Alloy → Your Callback</li>
              <li>If Alloy redirects without a code, it means the OAuth flow failed at Alloy's end</li>
              <li>Check Alloy dashboard for OAuth errors or configuration issues</li>
            </ul>
          </li>
          <li><strong>Possible Solutions:</strong>
            <ul>
              <li>Check if the redirect URI needs to be registered in Alloy's dashboard</li>
              <li>Verify your API key has OAuth permissions</li>
              <li>Try checking if a connection was created anyway (see server logs)</li>
              <li>Check Alloy's documentation for OAuth callback requirements</li>
            </ul>
          </li>
        </ol>
        
        <h2>Next Steps:</h2>
        <p><strong>1. Check the browser address bar</strong> - What URL are you on? Copy it exactly.</p>
        <p><strong>2. Check server console</strong> - Look for the OAuth URL that was generated and any errors.</p>
        <p><strong>3. Check Alloy Dashboard</strong> - Verify OAuth settings and redirect URI configuration.</p>
        <p><strong>4. Try listing connections</strong> - The connection might have been created even without the code.</p>
      `;
      
      return res.status(400).send(`
        <html>
          <head>
            <title>OAuth Error - No Authorization Code</title>
            <style>
              body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
              .error { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; padding: 15px; border-radius: 5px; margin: 20px 0; }
              .info { background: #d1ecf1; border: 1px solid #bee5eb; color: #0c5460; padding: 15px; border-radius: 5px; margin: 20px 0; }
              code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; font-family: monospace; }
              pre { background: #f4f4f4; padding: 10px; border-radius: 5px; overflow: auto; font-size: 12px; }
              ol, ul { margin: 10px 0; padding-left: 30px; }
              li { margin: 5px 0; }
              .critical { background: #fff3cd; border: 2px solid #ffc107; color: #856404; padding: 15px; border-radius: 5px; margin: 20px 0; font-weight: bold; }
            </style>
          </head>
          <body>
            <h1>OAuth Error: No Authorization Code Received</h1>
            <div class="error">
              <p><strong>The callback was received but no authorization code was found.</strong></p>
              <p>This usually means the OAuth flow didn't complete successfully or Alloy redirected without the code parameter.</p>
            </div>
            <div class="critical">
              <p>🔍 <strong>CRITICAL: Please check your browser's address bar right now!</strong></p>
              <p>What URL are you on? Copy the exact URL and check if it contains a code parameter.</p>
            </div>
            ${diagnosticInfo}
            <p style="margin-top: 30px;"><a href="/connect-notion-frontend.html">← Try again</a> | <a href="/api/connections">Check existing connections</a></p>
          </body>
        </html>
      `);
    }

    console.log('   ✅ Authorization code received');
    console.log('   Code length:', (code as string).length);
    console.log('   State:', state || 'none');
    console.log('   Connector ID:', connectorId || 'notion (default)');

    const connector = (connectorId as string) || 'notion';
    const { connectionId, credentialId } = await oauthFlow.handleOAuthCallback(
      connector,
      code as string,
      state as string
    );

    // Send success page
    res.send(`
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
              background: #f5f5f5;
            }
            .container {
              background: white;
              padding: 30px;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
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
            h1 { color: #28a745; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>✅ Success!</h1>
            <div class="success">
              <p><strong>Connection established successfully!</strong></p>
              <p><strong>Connection ID:</strong></p>
              <code>${connectionId}</code>
              ${credentialId ? `<p><strong>Credential ID:</strong> <code>${credentialId}</code></p>` : ''}
            </div>
            <h2>Next Steps:</h2>
            <ol>
              <li>Copy the Connection ID above</li>
              <li>Add it to your <code>.env</code> file: <code>CONNECTION_ID=${connectionId}</code></li>
              <li>You can now use this connection to interact with ${connector} via Alloy API</li>
            </ol>
            <p>You can close this window.</p>
          </div>
        </body>
      </html>
    `);
  } catch (error: any) {
    console.error('❌ Error handling OAuth callback:', error.message);
    if (error.response) {
      console.error('   API Response:', JSON.stringify(error.response.data, null, 2));
    }
    
    res.status(500).send(`
      <html>
        <head>
          <title>OAuth Error</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
            .error { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; padding: 15px; border-radius: 5px; }
            pre { background: #f4f4f4; padding: 10px; border-radius: 5px; overflow: auto; font-size: 12px; }
          </style>
        </head>
        <body>
          <h1>OAuth Error</h1>
          <div class="error">
            <p><strong>Failed to complete OAuth flow:</strong></p>
            <p>${error.message}</p>
            ${error.response?.data ? `<pre>${JSON.stringify(error.response.data, null, 2)}</pre>` : ''}
          </div>
          <p style="margin-top: 20px;"><a href="/connect-notion-frontend.html">← Try again</a></p>
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
    const { code, state, connectorId } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Authorization code is required'
      });
    }

    const connector = connectorId || 'notion';
    const { connectionId, credentialId } = await oauthFlow.handleOAuthCallback(
      connector,
      code,
      state
    );

    res.json({
      success: true,
      connectionId: connectionId,
      credentialId: credentialId,
      connectorId: connector
    });
  } catch (error: any) {
    console.error('Error handling OAuth callback:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.response?.data
    });
  }
});

/**
 * List connections
 * GET /api/connections
 */
app.get('/api/connections', async (req: Request, res: Response) => {
  try {
    console.log('\n📋 Listing connections...');
    const connections = await oauthFlow.listConnections();
    
    res.json({
      success: true,
      connections: connections,
      count: connections.length
    });
  } catch (error: any) {
    console.error('Error listing connections:', error.message);
    res.status(500).json({
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
    console.log(`\n🔍 Getting connection ${connectionId}...`);
    const connection = await oauthFlow.getConnection(connectionId);
    
    res.json({
      success: true,
      connection: connection
    });
  } catch (error: any) {
    console.error('Error getting connection:', error.message);
    res.status(500).json({
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
    // Try to get available connectors from Alloy API
    const client = axios.create({
      baseURL: 'https://production.runalloy.com',
      headers: {
        'Authorization': `Bearer ${config.alloyApiKey}`,
        'x-api-version': '2025-09',
        'Content-Type': 'application/json',
      },
    });

    // Based on MCP Alloy, we know Notion is available
    // In a real scenario, you'd fetch this from the API
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
      note: 'To see all available connectors, visit https://app.runalloy.com and check the Connections page',
      message: 'Alloy supports 200+ integrations. Check your Alloy dashboard for the full list.'
    });
  } catch (error: any) {
    console.error('Error listing connectors:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.response?.data
    });
  }
});

/**
 * Get connection by ID
 * GET /api/connections/:connectionId
 */
app.get('/api/connections/:connectionId', async (req: Request, res: Response) => {
  try {
    const { connectionId } = req.params;
    const connection = await oauthFlow.getConnection(connectionId);
    res.json({
      success: true,
      connection: connection
    });
  } catch (error: any) {
    console.error('Error getting connection:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.response?.data
    });
  }
});

/**
 * Serve frontend HTML files
 */
app.get('/', (req: Request, res: Response) => {
  try {
    // Try simple version first, fallback to full version
    try {
      const html = readFileSync(join(__dirname, 'connect-notion-simple.html'), 'utf-8');
      res.send(html);
    } catch {
      const html = readFileSync(join(__dirname, 'connect-notion-frontend.html'), 'utf-8');
      res.send(html);
    }
  } catch (error) {
    res.json({
      message: 'Alloy Connectivity Backend API',
      endpoints: {
        health: '/api/health',
        jwtToken: 'POST /api/alloy/token',
        initiateOAuth: 'POST /api/oauth/initiate',
        oauthCallback: 'GET /oauth/callback',
        listConnections: 'GET /api/connections',
        getConnection: 'GET /api/connections/:connectionId'
      }
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 Alloy Connectivity Backend Server');
  console.log('='.repeat(60));
  console.log(`\n📍 Server running on http://localhost:${PORT}`);
  console.log(`\n📋 Available endpoints:`);
  console.log(`   GET  /api/health - Health check`);
  console.log(`   GET  /api/config/check - Check configuration (diagnostics)`);
  console.log(`   POST /api/alloy/token - Get JWT token`);
  console.log(`   POST /api/oauth/initiate - Initiate OAuth flow`);
  console.log(`   GET  /oauth/callback - OAuth callback (web)`);
  console.log(`   POST /api/oauth/callback - OAuth callback (API)`);
  console.log(`   GET  /api/connections - List all connections`);
  console.log(`   GET  /api/connections/:id - Get connection details`);
  console.log(`   GET  /api/connectors - List available connectors`);
  console.log(`\n🌐 Frontend: http://localhost:${PORT}/`);
  console.log(`\n💡 To connect Notion:`);
  console.log(`   1. Open http://localhost:${PORT}/ in your browser`);
  console.log(`   2. Check configuration if you see errors`);
  console.log(`   3. Get JWT token and authenticate (optional)`);
  console.log(`   4. Click "Connect Notion"`);
  console.log(`\n⚠️  Troubleshooting:`);
  console.log(`   If you see "userId is required" error:`);
  console.log(`   1. Check your .env file has ALLOY_USER_ID set`);
  console.log(`   2. Visit http://localhost:${PORT}/api/config/check to verify`);
  console.log(`   3. Restart the server after updating .env`);
  console.log('\n' + '='.repeat(60) + '\n');
});

export default app;

