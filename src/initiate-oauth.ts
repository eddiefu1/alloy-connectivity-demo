import { AlloyOAuthFlow } from './oauth-flow.js';
import * as readline from 'readline';

/**
 * Interactive script to initiate OAuth flow and get Connection ID
 * 
 * Usage:
 *   npm run initiate-oauth
 *   or
 *   ts-node src/initiate-oauth.ts
 */
async function initiateOAuthInteractive() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (prompt: string): Promise<string> => {
    return new Promise((resolve) => {
      rl.question(prompt, resolve);
    });
  };

  try {
    console.log('🔐 Alloy OAuth Flow Initiator\n');
    console.log('This script will help you create a connection via OAuth flow.\n');

    // Get connector ID (default to notion)
    const connectorIdInput = await question('Enter connector ID (default: notion): ');
    const connectorId = connectorIdInput.trim() || 'notion';

    // Get redirect URI
    const redirectUri = await question('Enter redirect URI (e.g., http://localhost:3000/oauth/callback): ');
    if (!redirectUri) {
      console.error('❌ Redirect URI is required');
      process.exit(1);
    }

    console.log('\n⏳ Initiating OAuth flow...\n');

    const oauthFlow = new AlloyOAuthFlow();
    const { oauthUrl } = await oauthFlow.initiateOAuthFlow(connectorId, redirectUri);

    console.log('\n' + '='.repeat(60));
    console.log('✅ OAuth flow initiated successfully!');
    console.log('='.repeat(60));
    console.log('\n📋 Next steps:');
    console.log('\n1. Redirect the user to this URL:');
    console.log(`   ${oauthUrl}\n`);
    console.log('2. User will authorize the connection');
    console.log('3. User will be redirected back to your redirect URI');
    console.log('4. Extract the "code" parameter from the callback URL');
    console.log('5. Use the handleOAuthCallback() method to exchange the code for Connection ID');
    console.log('\n💡 Example callback handler:');
    console.log(`
app.get('/oauth/callback', async (req, res) => {
  const { code } = req.query;
  const oauthFlow = new AlloyOAuthFlow();
  const { connectionId } = await oauthFlow.handleOAuthCallback('${connectorId}', code);
  console.log('Connection ID:', connectionId);
  // Save to .env: CONNECTION_ID=\${connectionId}
});
    `);

  } catch (error: any) {
    console.error('\n❌ Failed to initiate OAuth flow:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Run the script
initiateOAuthInteractive();

export { initiateOAuthInteractive };

