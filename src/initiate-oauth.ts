import { AlloyOAuthFlow } from './oauth-flow.js';
import * as readline from 'readline';

/**
 * Interactive script to initiate OAuth flow
 * Usage: npm run initiate-oauth
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

    const connectorIdInput = await question('Enter connector ID (default: notion): ');
    const connectorId = connectorIdInput.trim() || 'notion';

    const redirectUri = await question('Enter redirect URI (e.g., http://localhost:3000/oauth/callback): ');
    if (!redirectUri) {
      console.error('❌ Redirect URI is required');
      process.exit(1);
    }

    console.log('\nInitiating OAuth flow...\n');

    const oauthFlow = new AlloyOAuthFlow();
    const { oauthUrl } = await oauthFlow.initiateOAuthFlow(connectorId, redirectUri);

    console.log('✅ OAuth flow initiated successfully!');
    console.log('\n📋 OAuth URL:');
    console.log(`   ${oauthUrl}\n`);
    console.log('Next steps:');
    console.log('1. Redirect user to the OAuth URL');
    console.log('2. User authorizes the connection');
    console.log('3. User is redirected back to your redirect URI');
    console.log('4. Extract the "code" parameter from the callback URL');
    console.log('5. Use handleOAuthCallback() to exchange code for Connection ID');

  } catch (error: any) {
    console.error('\n❌ Failed to initiate OAuth flow:', error.message);
    if (error.response?.data) {
      console.error('API Error:', error.response.data);
    }
    process.exit(1);
  } finally {
    rl.close();
  }
}

initiateOAuthInteractive();
