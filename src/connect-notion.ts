import { AlloyOAuthFlow } from './oauth-flow.js';
import { NotionClient } from './notion-client.js';
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
    console.log(`   Connector: ${connectorId}`);
    console.log(`   Redirect URI: ${redirectUri}`);
    
    let oauthUrl: string;
    let initialCredentialId: string | undefined;
    
    try {
      const result = await oauthFlow.initiateOAuthFlow(connectorId, redirectUri);
      oauthUrl = result.oauthUrl;
      initialCredentialId = result.credentialId;
      console.log('✅ OAuth flow initiated!');
      if (initialCredentialId) {
        console.log(`🔑 Credential ID: ${initialCredentialId}`);
      }
      console.log(`🔗 OAuth URL received: ${oauthUrl.substring(0, 100)}...\n`);
    } catch (error: any) {
      console.error('❌ Failed to initiate OAuth flow:', error.message);
      if (error.response?.data) {
        console.error('API Error:', JSON.stringify(error.response.data, null, 2));
      }
      throw error;
    }

    // Step 2: Start local server to catch callback
    const server = http.createServer(async (req, res) => {
      try {
        const parsedUrl = url.parse(req.url || '', true);
        
        console.log(`\n📥 Received request: ${req.method} ${req.url}`);
        console.log(`   Path: ${parsedUrl.pathname}`);
        if (parsedUrl.pathname === '/oauth/callback') {
          console.log(`   Query params: ${JSON.stringify(parsedUrl.query)}`);
        }
        
        if (parsedUrl.pathname === '/oauth/callback') {
          // Extract parameters from query string
          const code = parsedUrl.query.code as string;
          const state = parsedUrl.query.state as string;
          const error = parsedUrl.query.error as string;
          const errorDescription = parsedUrl.query.error_description as string;
          
          console.log(`\n🔍 OAuth Callback Details:`);
          console.log(`   Code: ${code ? 'Present' : 'Missing'}`);
          console.log(`   State: ${state || 'Not provided'}`);
          console.log(`   Error: ${error || 'None'}`);
          console.log(`   All query params: ${JSON.stringify(parsedUrl.query)}`);
          
          // Note: URL hash fragments (#access_token=...) are not sent to the server
          // They are client-side only. OAuth 2.0 authorization code flow uses query params.

          // Handle OAuth errors
          if (error) {
            console.error(`\n❌ OAuth Error: ${error}`);
            if (errorDescription) {
              console.error(`   Description: ${errorDescription}`);
            }
            res.writeHead(400, { 'Content-Type': 'text/html' });
            res.end(`
              <html>
                <head><title>OAuth Error</title></head>
                <body>
                  <h1>❌ OAuth Error</h1>
                  <p><strong>Error:</strong> ${error}</p>
                  ${errorDescription ? `<p><strong>Description:</strong> ${errorDescription}</p>` : ''}
                  <p>Please check your terminal for more details.</p>
                </body>
              </html>
            `);
            setTimeout(() => {
              server.close();
              process.exit(1);
            }, 2000);
            return;
          }

          // OAuth 2.0 authorization code flow uses query parameters
          // Hash fragments are not sent to the server (they're client-side only)
          const authCode = code;
          const authState = state;

          // If no code is received, but we have a credentialId from initiation,
          // Alloy might have already processed the OAuth flow server-side
          // In this case, we should check if the connection was created
          if (!authCode) {
            console.log('\n⚠️  No authorization code in callback URL');
            console.log('   This might mean Alloy processed the OAuth server-side');
            console.log('   Checking if connection was created using credentialId...\n');
            
            if (initialCredentialId) {
              console.log(`   Using credentialId from initiation: ${initialCredentialId}`);
              console.log('   Attempting to retrieve connection...\n');
              
              try {
                // Wait a moment for Alloy to process the connection
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                // Try to list connections and find the one matching our credentialId
                const connections = await oauthFlow.listConnections();
                console.log(`   Found ${connections.length} total connections`);
                
                // Find connection with matching credentialId or check for newest Notion connection
                let connection = connections.find((conn: any) => {
                  const connId = conn.credentialId || conn.id || conn._id;
                  return connId === initialCredentialId;
                });
                
                // If not found by credentialId, find the most recent Notion connection
                if (!connection) {
                  const notionConnections = connections.filter((conn: any) => {
                    const connectorId = conn.connectorId || conn.connector || conn.integrationId || '';
                    const type = conn.type || '';
                    return (
                      connectorId.toLowerCase() === 'notion' ||
                      type.toLowerCase() === 'notion-oauth2' ||
                      type.toLowerCase().includes('notion')
                    );
                  });
                  
                  if (notionConnections.length > 0) {
                    // Sort by creation date (most recent first)
                    notionConnections.sort((a: any, b: any) => {
                      const dateA = new Date(a.createdAt || a.created_at || 0).getTime();
                      const dateB = new Date(b.createdAt || b.created_at || 0).getTime();
                      return dateB - dateA;
                    });
                    connection = notionConnections[0];
                    console.log(`   Found most recent Notion connection instead`);
                  }
                }
                
                // Also try using the initialCredentialId directly if we have it
                if (!connection && initialCredentialId) {
                  console.log(`   Trying to use credentialId directly: ${initialCredentialId}`);
                  // Test if this credentialId works for API calls
                  try {
                    const testClient = new NotionClient(config, initialCredentialId);
                    await testClient.searchPages(undefined, { value: 'page', property: 'object' });
                    console.log(`   ✅ CredentialId works for API calls!`);
                    connection = {
                      credentialId: initialCredentialId,
                      id: initialCredentialId,
                      connectorId: 'notion',
                      name: 'OAuth Connection',
                      type: 'notion-oauth2',
                    };
                  } catch (testError: any) {
                    console.log(`   ❌ CredentialId test failed: ${testError.message}`);
                  }
                }
                
                if (connection) {
                  const connectionId = connection.credentialId || connection.id || connection._id;
                  const connectorId = connection.connectorId || connection.connector || 'notion';
                  
                  // Verify the connection works before reporting success
                  try {
                    console.log(`   Verifying connection works...`);
                    const testClient = new NotionClient(config, connectionId);
                    await testClient.searchPages(undefined, { value: 'page', property: 'object' });
                    console.log(`   ✅ Connection verified and working!`);
                  } catch (verifyError: any) {
                    console.log(`   ⚠️  Connection found but API test failed: ${verifyError.message}`);
                    console.log(`   You may need to wait a moment for the connection to be fully ready`);
                  }
                  
                  console.log('\n✅ Connection found!');
                  console.log(`   Connection ID (credentialId): ${connectionId}`);
                  console.log(`   Connector ID: ${connectorId}`);
                  console.log(`   Name: ${connection.name || 'N/A'}`);
                  console.log(`   Type: ${connection.type || 'N/A'}`);
                  console.log(`   Created: ${connection.createdAt || connection.created_at || 'N/A'}\n`);
                  
                  // Send success response
                  res.writeHead(200, { 'Content-Type': 'text/html' });
                  res.end(`
                    <!DOCTYPE html>
                    <html>
                      <head>
                        <title>Success!</title>
                        <style>
                          body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
                          h1 { color: #10b981; }
                          code { background: #f3f4f6; padding: 2px 6px; border-radius: 3px; }
                        </style>
                      </head>
                      <body>
                        <h1>✅ Success!</h1>
                        <p>Notion has been connected to Alloy Automation!</p>
                        <p><strong>Connection ID:</strong> <code>${connectionId}</code></p>
                        <p><strong>Connector:</strong> <code>${connectorId}</code></p>
                        <p>You can close this window. Check your terminal for next steps.</p>
                      </body>
                    </html>
                  `);
                  
                  console.log('\n✅ SUCCESS! Notion connected to Alloy!');
                  console.log(`\n🔗 Connection ID (credentialId): ${connectionId}`);
                  console.log(`📦 Connector ID: ${connectorId}`);
                  console.log(`🔑 Initial Credential ID: ${initialCredentialId || 'N/A'}\n`);
                  console.log('📝 Add this to your .env file:');
                  console.log(`   CONNECTION_ID=${connectionId}\n`);
                  
                  // Close server after a short delay
                  setTimeout(() => {
                    server.close();
                    process.exit(0);
                  }, 3000);
                  return;
                } else {
                  console.log('   Connection not found yet. Waiting a bit longer...\n');
                  // Wait a bit more and try again
                  await new Promise(resolve => setTimeout(resolve, 3000));
                  
                  const connections2 = await oauthFlow.listConnections();
                  let connection2 = connections2.find((conn: any) => {
                    const connId = conn.credentialId || conn.id || conn._id;
                    return connId === initialCredentialId;
                  });
                  
                  // If still not found, try finding most recent Notion connection
                  if (!connection2) {
                    const notionConnections2 = connections2.filter((conn: any) => {
                      const connectorId = conn.connectorId || conn.connector || conn.integrationId || '';
                      const type = conn.type || '';
                      return (
                        connectorId.toLowerCase() === 'notion' ||
                        type.toLowerCase() === 'notion-oauth2' ||
                        type.toLowerCase().includes('notion')
                      );
                    });
                    
                    if (notionConnections2.length > 0) {
                      notionConnections2.sort((a: any, b: any) => {
                        const dateA = new Date(a.createdAt || a.created_at || 0).getTime();
                        const dateB = new Date(b.createdAt || b.created_at || 0).getTime();
                        return dateB - dateA;
                      });
                      connection2 = notionConnections2[0];
                    }
                  }
                  
                  // Last resort: try using initialCredentialId directly
                  if (!connection2 && initialCredentialId) {
                    try {
                      const testClient = new NotionClient(config, initialCredentialId);
                      await testClient.searchPages(undefined, { value: 'page', property: 'object' });
                      connection2 = {
                        credentialId: initialCredentialId,
                        id: initialCredentialId,
                        connectorId: 'notion',
                        name: 'OAuth Connection',
                        type: 'notion-oauth2',
                      };
                      console.log(`   ✅ Using credentialId directly - it works!`);
                    } catch (testError: any) {
                      // Ignore test error
                    }
                  }
                  
                  if (connection2) {
                    const connectionId = connection2.credentialId || connection2.id || connection2._id;
                    const connectorId = connection2.connectorId || connection2.connector || 'notion';
                    console.log('\n✅ Connection found on second attempt!');
                    console.log(`   Connection ID (credentialId): ${connectionId}`);
                    console.log(`   Connector ID: ${connectorId}`);
                    console.log(`   Name: ${connection2.name || 'N/A'}\n`);
                    
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.end(`
                      <!DOCTYPE html>
                      <html>
                        <head><title>Success!</title></head>
                        <body>
                          <h1>✅ Success!</h1>
                          <p>Notion has been connected to Alloy Automation!</p>
                          <p><strong>Connection ID:</strong> <code>${connectionId}</code></p>
                          <p><strong>Connector:</strong> <code>${connectorId}</code></p>
                          <p>Check your terminal for next steps.</p>
                        </body>
                      </html>
                    `);
                    
                    console.log('📝 Add this to your .env file:');
                    console.log(`   CONNECTION_ID=${connectionId}\n`);
                    
                    setTimeout(() => {
                      server.close();
                      process.exit(0);
                    }, 3000);
                    return;
                  }
                }
              } catch (checkError: any) {
                console.error('   Error checking connection:', checkError.message);
              }
            }
            
            // If we still don't have a code or connection, show error page
            console.error('\n❌ No authorization code received and connection not found');
            console.log('   Received query params:', parsedUrl.query);
            console.log('   Full URL:', req.url);
            
            // Provide helpful error page with instructions
            res.writeHead(400, { 'Content-Type': 'text/html' });
            res.end(`
              <!DOCTYPE html>
              <html>
                <head>
                  <title>OAuth Callback - No Code Received</title>
                  <style>
                    body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
                    code { background: #f3f4f6; padding: 2px 6px; border-radius: 3px; font-family: monospace; }
                    pre { background: #f3f4f6; padding: 15px; border-radius: 5px; overflow-x: auto; }
                    .warning { color: #f59e0b; }
                    .info { background: #dbeafe; padding: 15px; border-radius: 5px; margin: 15px 0; }
                  </style>
                  <script>
                    // Try to extract code from URL fragment (client-side)
                    window.addEventListener('DOMContentLoaded', function() {
                      const hash = window.location.hash;
                      if (hash) {
                        const params = new URLSearchParams(hash.substring(1));
                        const code = params.get('code');
                        if (code) {
                          document.getElementById('fragment-code').innerHTML = 
                            '<strong style="color: green;">Found code in URL fragment! Redirecting...</strong>';
                          setTimeout(function() {
                            window.location.href = '/oauth/callback?code=' + encodeURIComponent(code) + 
                              (params.get('state') ? '&state=' + encodeURIComponent(params.get('state')) : '');
                          }, 1000);
                        } else {
                          document.getElementById('fragment-code').textContent = 'No code found in URL fragment.';
                        }
                      } else {
                        document.getElementById('fragment-code').textContent = 'No URL fragment present.';
                      }
                    });
                  </script>
                </head>
                <body>
                  <h1 class="warning">⚠️ OAuth Callback Received - No Authorization Code</h1>
                  <div class="info">
                    <p><strong>Received URL:</strong></p>
                    <pre>${req.url}</pre>
                    <p><strong>Query Parameters:</strong></p>
                    <pre>${JSON.stringify(parsedUrl.query, null, 2)}</pre>
                    <p id="fragment-code"><strong>URL Fragment Check:</strong> Checking...</p>
                    ${initialCredentialId ? `<p><strong>Credential ID from initiation:</strong> <code>${initialCredentialId}</code></p>` : ''}
                  </div>
                  <h2>What happened:</h2>
                  <p>The OAuth callback reached our server, but no authorization code was found in the URL.</p>
                  <p>This can happen if:</p>
                  <ul>
                    <li>Alloy processed the OAuth flow server-side (we attempted to find the connection automatically)</li>
                    <li>The code is in a URL fragment (#code=...) which requires client-side JavaScript to extract</li>
                    <li>Notion redirected without including the code</li>
                  </ul>
                  <h2>Next Steps:</h2>
                  <ol>
                    <li>Check the browser's address bar - look for the full URL including any fragments</li>
                    <li>If you see <code>#code=...</code> in the URL, the page should automatically redirect</li>
                    <li>Check your terminal - we may have found the connection automatically</li>
                    <li>Try checking your connections: <code>npm run find-notion-connection</code></li>
                    <li>If a connection was created, you can use it even without the callback code</li>
                  </ol>
                  <p><strong>Redirect URI used:</strong> <code>${redirectUri}</code></p>
                </body>
              </html>
            `);
            return;
          }

          try {
            console.log('\n🔄 Processing OAuth callback...');
            console.log(`   Authorization code: ${authCode.substring(0, 20)}...`);
            
            // Exchange authorization code for Connection ID
            console.log('   Using authorization code from callback');
            if (initialCredentialId) {
              console.log(`   Using credential ID from initiation: ${initialCredentialId}`);
            }
            
            const result = await oauthFlow.handleOAuthCallback(
              connectorId,
              authCode,
              authState,
              initialCredentialId // Pass credentialId from initiation if available
            );
            
            const connectionId = result.connectionId;
            const credentialId = result.credentialId;

            console.log('\n✅ SUCCESS! Notion connected to Alloy!');
            console.log(`\n🔗 Connection ID: ${connectionId}`);
            console.log(`🔑 Credential ID: ${credentialId || 'N/A'}\n`);
            console.log('📝 Add this to your .env file:');
            console.log(`   CONNECTION_ID=${connectionId}\n`);

            // Send success response to browser
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(`
              <html>
                <head>
                  <title>Success!</title>
                  <style>
                    body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
                    h1 { color: #10b981; }
                    code { background: #f3f4f6; padding: 2px 6px; border-radius: 3px; }
                  </style>
                </head>
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
            }, 3000);

          } catch (error: any) {
            console.error('\n❌ Failed to complete OAuth flow:', error.message);
            if (error.response?.data) {
              console.error('   API Error:', JSON.stringify(error.response.data, null, 2));
            }
            res.writeHead(500, { 'Content-Type': 'text/html' });
            res.end(`
              <html>
                <head><title>OAuth Error</title></head>
                <body>
                  <h1>❌ OAuth Error</h1>
                  <p>${error.message}</p>
                  <p>Please check your terminal for more details.</p>
                </body>
              </html>
            `);
            setTimeout(() => {
              server.close();
              process.exit(1);
            }, 3000);
          }
        } else if (parsedUrl.pathname === '/') {
          // Root path - provide info with JavaScript to handle URL fragments
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>Alloy OAuth Server</title>
                <style>
                  body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
                  .status { padding: 15px; margin: 10px 0; border-radius: 5px; }
                  .waiting { background: #fef3c7; border: 1px solid #f59e0b; }
                  .processing { background: #dbeafe; border: 1px solid #3b82f6; }
                </style>
              </head>
              <body>
                <h1>Alloy OAuth Server</h1>
                <div id="status" class="status waiting">
                  <p>Waiting for OAuth callback...</p>
                  <p>Please complete the authorization in the browser window that opened.</p>
                </div>
                <script>
                  // Check if we have URL fragments (client-side only)
                  const hash = window.location.hash;
                  if (hash) {
                    const params = new URLSearchParams(hash.substring(1));
                    const code = params.get('code');
                    const access_token = params.get('access_token');
                    const error = params.get('error');
                    
                    if (error) {
                      document.getElementById('status').innerHTML = 
                        '<p>❌ OAuth Error: ' + error + '</p>' +
                        '<p>Please check your terminal for details.</p>';
                      // Redirect to callback with error
                      window.location.href = '/oauth/callback?error=' + encodeURIComponent(error);
                    } else if (code) {
                      document.getElementById('status').innerHTML = 
                        '<p>🔄 Processing authorization code...</p>';
                      // Redirect to callback with code from fragment
                      window.location.href = '/oauth/callback?code=' + encodeURIComponent(code) + 
                        (params.get('state') ? '&state=' + encodeURIComponent(params.get('state')) : '');
                    } else if (access_token) {
                      document.getElementById('status').innerHTML = 
                        '<p>⚠️ Access token found in URL fragment.</p>' +
                        '<p>This format is not directly supported. Please contact support.</p>';
                    }
                  }
                </script>
              </body>
            </html>
          `);
        } else if (parsedUrl.pathname === '/oauth/callback-handler') {
          // Alternative callback handler that can process client-side data
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>OAuth Callback Handler</title>
                <script>
                  // Extract code from URL (query params or hash)
                  const urlParams = new URLSearchParams(window.location.search);
                  const hashParams = new URLSearchParams(window.location.hash.substring(1));
                  
                  const code = urlParams.get('code') || hashParams.get('code');
                  const state = urlParams.get('state') || hashParams.get('state');
                  const error = urlParams.get('error') || hashParams.get('error');
                  
                  if (code) {
                    // Forward to server endpoint
                    fetch('/oauth/callback?code=' + encodeURIComponent(code) + 
                          (state ? '&state=' + encodeURIComponent(state) : ''), {
                      method: 'GET'
                    }).then(() => {
                      document.body.innerHTML = '<h1>✅ Processing...</h1><p>Check your terminal.</p>';
                    }).catch(err => {
                      document.body.innerHTML = '<h1>❌ Error</h1><p>' + err.message + '</p>';
                    });
                  } else if (error) {
                    document.body.innerHTML = '<h1>❌ OAuth Error</h1><p>' + error + '</p>';
                  } else {
                    document.body.innerHTML = '<h1>⚠️ No code found</h1><p>URL: ' + window.location.href + '</p>';
                  }
                </script>
              </head>
              <body>
                <h1>Processing OAuth callback...</h1>
              </body>
            </html>
          `);
        } else if (parsedUrl.pathname === '/health' || parsedUrl.pathname === '/test') {
          // Health check endpoint
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            status: 'ok',
            message: 'OAuth server is running',
            redirectUri: redirectUri,
            timestamp: new Date().toISOString()
          }));
        } else if (parsedUrl.pathname === '/debug') {
          // Debug endpoint to see what we receive
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            url: req.url,
            method: req.method,
            pathname: parsedUrl.pathname,
            query: parsedUrl.query,
            headers: req.headers,
            timestamp: new Date().toISOString()
          }, null, 2));
        } else {
          // Log all other requests for debugging
          console.log(`\n⚠️  Unhandled request: ${req.method} ${req.url}`);
          console.log(`   Path: ${parsedUrl.pathname}`);
          console.log(`   Query: ${JSON.stringify(parsedUrl.query)}`);
          res.writeHead(404, { 'Content-Type': 'text/html' });
          res.end(`
            <!DOCTYPE html>
            <html>
              <head><title>404 - Not Found</title></head>
              <body>
                <h1>404 - Not Found</h1>
                <p>Path: ${parsedUrl.pathname}</p>
                <p>Expected: /oauth/callback</p>
                <p>Full URL: ${req.url}</p>
                <p><a href="/">Go to home</a></p>
              </body>
            </html>
          `);
        }
      } catch (error: any) {
        console.error('Error handling request:', error);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal server error');
      }
    });

    server.listen(port, '0.0.0.0', () => {
      console.log(`\n🌐 Server listening on http://localhost:${port}`);
      console.log(`📋 Redirect URI: ${redirectUri}`);
      console.log(`🔍 Health check: http://localhost:${port}/health`);
      console.log('⏳ Waiting for OAuth callback...\n');
      console.log('='.repeat(60));
      console.log(`\n🔗 OAuth URL:`);
      console.log(`   ${oauthUrl}\n`);
      console.log('='.repeat(60));
      console.log('\n💡 Tip: If the browser doesn\'t open automatically,');
      console.log('   copy the OAuth URL above and open it in your browser.');
      console.log('   After authorization, you will be redirected back to this server.\n');

      // Step 3: Open browser
      console.log('\n🌐 Opening browser for authorization...\n');
      const startCommand = process.platform === 'win32' ? 'start' :
                          process.platform === 'darwin' ? 'open' :
                          'xdg-open';
      
      // Small delay before opening browser to ensure server is ready
      setTimeout(() => {
        exec(`${startCommand} "${oauthUrl}"`, (error) => {
          if (error) {
            console.log(`⚠️  Could not open browser automatically.`);
            console.log(`\n   Please manually open this URL in your browser:`);
            console.log(`   ${oauthUrl}\n`);
          } else {
            console.log('✅ Browser opened successfully');
            console.log('   Complete the authorization in the browser window.\n');
          }
        });
      }, 500);
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

    // Timeout after 10 minutes
    const timeout = setTimeout(() => {
      console.log('\n⏱️  OAuth flow timed out after 10 minutes.');
      console.log('   The server will close. Please try again.');
      server.close();
      process.exit(1);
    }, 10 * 60 * 1000);
    
    // Clear timeout when server closes successfully
    server.on('close', () => {
      clearTimeout(timeout);
    });

  } catch (error: any) {
    console.error('\n❌ Failed to connect Notion:', error.message);
    if (error.response?.data) {
      console.error('API Error:', error.response.data);
    }
    process.exit(1);
  }
}

connectNotion();
