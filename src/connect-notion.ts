import { AlloyOAuthFlow } from './oauth-flow.js';
import { getConfig } from './config.js';
import * as http from 'http';
import * as url from 'url';
import { exec } from 'child_process';

/**
 * Complete OAuth flow script for Notion
 * Usage: npm run connect-notion
 */
async function connectNotion() {
  try {
    console.log('🔗 Connecting Notion to Alloy Automation\n');

    const config = getConfig();
    const oauthFlow = new AlloyOAuthFlow();

    const connectorId = 'notion';
    const port = 3000;
    const redirectUri = `http://localhost:${port}/oauth/callback`;

    // Step 1: Initiate OAuth flow
    console.log('Initiating OAuth flow...');
    const { oauthUrl } = await oauthFlow.initiateOAuthFlow(connectorId, redirectUri);
    console.log('✅ OAuth flow initiated!\n');

    // Step 2: Start local server to catch callback
    const server = http.createServer(async (req, res) => {
      const parsedUrl = url.parse(req.url || '', true);
      
      if (parsedUrl.pathname === '/oauth/callback') {
        const code = parsedUrl.query.code as string;
        const state = parsedUrl.query.state as string;

        if (!code) {
          res.writeHead(400, { 'Content-Type': 'text/html' });
          res.end('<html><body><h1>OAuth Error</h1><p>No authorization code received.</p></body></html>');
          return;
        }

        try {
          // Exchange code for Connection ID
          const { connectionId } = await oauthFlow.handleOAuthCallback(connectorId, code, state);

          console.log('\n✅ SUCCESS! Notion connected to Alloy!');
          console.log(`\n🔗 Connection ID: ${connectionId}\n`);
          console.log('📝 Add this to your .env file:');
          console.log(`   CONNECTION_ID=${connectionId}\n`);

          // Send success response to browser
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(`
            <html>
              <head><title>Success!</title></head>
              <body>
                <h1>✅ Success!</h1>
                <p>Notion has been connected to Alloy Automation!</p>
                <p><strong>Connection ID:</strong> <code>${connectionId}</code></p>
                <p>You can close this window. Check your terminal for next steps.</p>
              </body>
            </html>
          `);

          // Close server after a short delay
          setTimeout(() => {
            server.close();
            process.exit(0);
          }, 2000);

        } catch (error: any) {
          console.error('\n❌ Failed to complete OAuth flow:', error.message);
          res.writeHead(500, { 'Content-Type': 'text/html' });
          res.end(`<html><body><h1>OAuth Error</h1><p>${error.message}</p></body></html>`);
          server.close();
          process.exit(1);
        }
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not found');
      }
    });

    server.listen(port, () => {
      console.log(`Server listening on http://localhost:${port}`);
      console.log('Waiting for OAuth callback...\n');

      // Step 3: Open browser
      console.log('Opening browser for authorization...\n');
      const startCommand = process.platform === 'win32' ? 'start' :
                          process.platform === 'darwin' ? 'open' :
                          'xdg-open';
      
      exec(`${startCommand} "${oauthUrl}"`, (error) => {
        if (error) {
          console.log(`⚠️  Could not open browser automatically.`);
          console.log(`   Please manually open this URL: ${oauthUrl}\n`);
        }
      });
    });

    // Handle server errors
    server.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`\n❌ Port ${port} is already in use.`);
        process.exit(1);
      } else {
        console.error('\n❌ Server error:', error.message);
        process.exit(1);
      }
    });

    // Timeout after 5 minutes
    setTimeout(() => {
      console.log('\n⏱️  OAuth flow timed out after 5 minutes.');
      server.close();
      process.exit(1);
    }, 5 * 60 * 1000);

  } catch (error: any) {
    console.error('\n❌ Failed to connect Notion:', error.message);
    if (error.response?.data) {
      console.error('API Error:', error.response.data);
    }
    process.exit(1);
  }
}

connectNotion();
