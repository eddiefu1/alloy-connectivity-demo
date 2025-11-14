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
    const redirectUri = config.oauthRedirectUri || `http://localhost:${port}/oauth/callback`;

    // Step 1: Initiate OAuth flow
    console.log('Initiating OAuth flow...');
    const result = await oauthFlow.initiateOAuthFlow(connectorId, redirectUri);
    const oauthUrl = result.oauthUrl;
    const credentialId = result.credentialId;

    console.log('✅ OAuth flow initiated!');
    console.log(`🔗 OAuth URL: ${oauthUrl}\n`);

    // Step 2: Start local server to catch callback
    const server = http.createServer(async (req, res) => {
      const parsedUrl = url.parse(req.url || '', true);

      if (parsedUrl.pathname === '/oauth/callback') {
        const code = parsedUrl.query.code as string;
        const error = parsedUrl.query.error as string;

        if (error) {
          console.error(`❌ OAuth Error: ${error}`);
          res.writeHead(400, { 'Content-Type': 'text/html' });
          res.end(`<h1>OAuth Error</h1><p>${error}</p>`);
          server.close();
          process.exit(1);
          return;
        }

        if (code) {
          try {
            const { connectionId } = await oauthFlow.handleOAuthCallback(
              connectorId,
              code,
              undefined,
              credentialId
            );

            console.log('\n✅ SUCCESS! Notion connected to Alloy!');
            console.log(`🔗 Connection ID: ${connectionId}`);
            console.log(`\n📝 Add this to your .env file:`);
            console.log(`   CONNECTION_ID=${connectionId}\n`);

            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(`
              <h1>✅ Success!</h1>
              <p>Connection ID: <code>${connectionId}</code></p>
              <p>Add this to your .env file: <code>CONNECTION_ID=${connectionId}</code></p>
            `);

            setTimeout(() => {
              server.close();
              process.exit(0);
            }, 3000);
          } catch (error: any) {
            console.error('❌ Failed to complete OAuth flow:', error.message);
            res.writeHead(500, { 'Content-Type': 'text/html' });
            res.end(`<h1>Error</h1><p>${error.message}</p>`);
            setTimeout(() => {
              server.close();
              process.exit(1);
            }, 3000);
          }
        } else {
          res.writeHead(400, { 'Content-Type': 'text/html' });
          res.end(`<h1>No authorization code received</h1><p>Check terminal for details.</p>`);
        }
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not found');
      }
    });

    server.listen(port, () => {
      console.log(`🌐 Server listening on http://localhost:${port}`);
      console.log(`⏳ Waiting for OAuth callback...\n`);
      console.log(`🔗 OAuth URL:\n   ${oauthUrl}\n`);

      // Open browser
      const startCommand = process.platform === 'win32' ? 'start' :
                          process.platform === 'darwin' ? 'open' : 'xdg-open';
      
      setTimeout(() => {
        exec(`${startCommand} "${oauthUrl}"`, (error) => {
          if (error) {
            console.log(`⚠️  Please manually open this URL in your browser:\n   ${oauthUrl}\n`);
          }
        });
      }, 500);
    });

    server.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${port} is already in use.`);
        process.exit(1);
      }
    });

  } catch (error: any) {
    console.error('❌ Failed to connect Notion:', error.message);
    if (error.response?.data) {
      console.error('API Error:', error.response.data);
    }
    process.exit(1);
  }
}

connectNotion();
