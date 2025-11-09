import { AlloyOAuthFlow } from './oauth-flow.js';
import { getConfig } from './config.js';
import * as http from 'http';
import * as url from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Complete OAuth flow script for Notion
 * This script will:
 * 1. Initiate OAuth flow
 * 2. Open browser for authorization
 * 3. Start local server to catch callback
 * 4. Complete OAuth flow and get Connection ID
 * 
 * Usage:
 *   npm run connect-notion
 */
async function connectNotion() {
  try {
    console.log('🔗 Connecting Notion to Alloy Automation\n');
    console.log('='.repeat(60));

    const config = getConfig();
    const oauthFlow = new AlloyOAuthFlow();

    const connectorId = 'notion';
    const port = 3000;
    const redirectUri = `http://localhost:${port}/oauth/callback`;

    console.log('\n📋 Configuration:');
    console.log(`   Connector: ${connectorId}`);
    console.log(`   Redirect URI: ${redirectUri}`);
    console.log(`   User ID: ${config.alloyUserId}`);

    // Step 1: Initiate OAuth flow
    console.log('\n' + '='.repeat(60));
    console.log('STEP 1: Initiating OAuth Flow');
    console.log('='.repeat(60));

    const { oauthUrl, credentialId } = await oauthFlow.initiateOAuthFlow(
      connectorId,
      redirectUri
    );

    console.log('\n✅ OAuth flow initiated!');
    if (credentialId) {
      console.log(`   Credential ID: ${credentialId}`);
    }

    // Step 2: Start local server to catch callback
    console.log('\n' + '='.repeat(60));
    console.log('STEP 2: Starting local callback server');
    console.log('='.repeat(60));

    const server = http.createServer(async (req, res) => {
      const parsedUrl = url.parse(req.url || '', true);
      
      if (parsedUrl.pathname === '/oauth/callback') {
        const code = parsedUrl.query.code as string;
        const state = parsedUrl.query.state as string;

        if (!code) {
          res.writeHead(400, { 'Content-Type': 'text/html' });
          res.end(`
            <html>
              <head><title>OAuth Error</title></head>
              <body>
                <h1>OAuth Error</h1>
                <p>No authorization code received. Please try again.</p>
              </body>
            </html>
          `);
          return;
        }

        try {
          console.log('\n📥 Received OAuth callback!');
          console.log('   Processing authorization code...');

          // Step 3: Exchange code for Connection ID
          const { connectionId } = await oauthFlow.handleOAuthCallback(
            connectorId,
            code,
            state
          );

          console.log('\n' + '='.repeat(60));
          console.log('✅ SUCCESS! Notion connected to Alloy!');
          console.log('='.repeat(60));
          console.log(`\n🔗 Connection ID: ${connectionId}\n`);
          console.log('📝 Next Steps:');
          console.log('\n1. Add this to your .env file:');
          console.log(`   CONNECTION_ID=${connectionId}\n`);
          console.log('2. You can now use this connection ID to interact with Notion via Alloy API');
          console.log('\n3. Test the connection:');
          console.log('   npm run dev\n');

          // Send success response to browser
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(`
            <html>
              <head>
                <title>Success!</title>
                <style>
                  body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
                  .success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 5px; }
                  code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; }
                </style>
              </head>
              <body>
                <div class="success">
                  <h1>✅ Success!</h1>
                  <p>Notion has been connected to Alloy Automation!</p>
                  <p><strong>Connection ID:</strong> <code>${connectionId}</code></p>
                  <p>You can close this window. Check your terminal for next steps.</p>
                </div>
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
          if (error.response) {
            console.error('Response:', error.response.data);
          }

          res.writeHead(500, { 'Content-Type': 'text/html' });
          res.end(`
            <html>
              <head><title>OAuth Error</title></head>
              <body>
                <h1>OAuth Error</h1>
                <p>Failed to complete OAuth flow: ${error.message}</p>
                <p>Check your terminal for details.</p>
              </body>
            </html>
          `);

          server.close();
          process.exit(1);
        }
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not found');
      }
    });

    server.listen(port, () => {
      console.log(`   Server listening on http://localhost:${port}`);
      console.log(`   Waiting for OAuth callback...\n`);

      // Step 3: Open browser
      console.log('='.repeat(60));
      console.log('STEP 3: Opening browser for authorization');
      console.log('='.repeat(60));
      console.log(`\n🌐 Opening browser to: ${oauthUrl}\n`);
      console.log('📋 Instructions:');
      console.log('   1. Authorize Notion in the browser');
      console.log('   2. You will be redirected back automatically');
      console.log('   3. The connection will be completed\n');

      // Open browser (cross-platform)
      const startCommand = process.platform === 'win32' ? 'start' :
                          process.platform === 'darwin' ? 'open' :
                          'xdg-open';
      
      exec(`${startCommand} "${oauthUrl}"`, (error) => {
        if (error) {
          console.log(`\n⚠️  Could not open browser automatically.`);
          console.log(`   Please manually open this URL in your browser:`);
          console.log(`   ${oauthUrl}\n`);
        }
      });
    });

    // Handle server errors
    server.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`\n❌ Port ${port} is already in use.`);
        console.error('   Please close any applications using this port or change the port number.');
        process.exit(1);
      } else {
        console.error('\n❌ Server error:', error.message);
        process.exit(1);
      }
    });

    // Timeout after 5 minutes
    setTimeout(() => {
      console.log('\n⏱️  OAuth flow timed out after 5 minutes.');
      console.log('   Please try again.');
      server.close();
      process.exit(1);
    }, 5 * 60 * 1000);

  } catch (error: any) {
    console.error('\n❌ Failed to connect Notion:', error.message);
    if (error.response) {
      console.error('\nAPI Response:', JSON.stringify(error.response.data, null, 2));
      console.error('\nStatus:', error.response.status);
    }
    process.exit(1);
  }
}

// Run the script
connectNotion();

