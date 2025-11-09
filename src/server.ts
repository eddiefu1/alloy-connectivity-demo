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
      baseUrl: config.alloyBaseUrl
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
    const { oauthUrl, credentialId } = await oauthFlow.initiateOAuthFlow(
      connectorId,
      finalRedirectUri
    );

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
    const code = req.query.code as string;
    const state = req.query.state as string;
    const connectorId = (req.query.connectorId as string) || 'notion';
    const error = req.query.error as string;

    // Handle OAuth errors
    if (error) {
      return res.status(400).send(`
        <html>
          <head><title>OAuth Error</title></head>
          <body>
            <h1>OAuth Error</h1>
            <p>Error: ${error}</p>
            <p><a href="/connect-notion-frontend.html">Try again</a></p>
          </body>
        </html>
      `);
    }

    // Validate authorization code
    if (!code) {
      return res.status(400).send(`
        <html>
          <head><title>OAuth Error</title></head>
          <body>
            <h1>OAuth Error</h1>
            <p>No authorization code received. Please try again.</p>
            <p><a href="/connect-notion-frontend.html">Try again</a></p>
          </body>
        </html>
      `);
    }

    // Exchange code for connection ID
    const { connectionId, credentialId } = await oauthFlow.handleOAuthCallback(
      connectorId,
      code,
      state
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
            ${credentialId ? `<p><strong>Credential ID:</strong> <code>${credentialId}</code></p>` : ''}
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
    const connection = await oauthFlow.getConnection(connectionId);
    res.json({
      success: true,
      connection: connection
    });
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
    const html = readFileSync(join(__dirname, 'connect-notion-frontend.html'), 'utf-8');
    res.send(html);
  } catch (error) {
    res.json({
      message: 'Alloy Connectivity Backend API',
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

// Start server
app.listen(PORT, () => {
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

export default app;
