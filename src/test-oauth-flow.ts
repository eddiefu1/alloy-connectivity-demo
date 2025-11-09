import { AlloyOAuthFlow } from './oauth-flow.js';
import { getConfig } from './config.js';

/**
 * Test script to initiate OAuth flow for Notion
 * Usage: npm run test-oauth
 */
async function testOAuthFlow() {
  try {
    console.log('🧪 Testing OAuth Flow for Notion\n');

    const config = getConfig();
    const oauthFlow = new AlloyOAuthFlow();

    const connectorId = 'notion';
    const redirectUri = process.env.REDIRECT_URI || 'http://localhost:3000/oauth/callback';

    console.log('Configuration:');
    console.log(`   Connector ID: ${connectorId}`);
    console.log(`   Redirect URI: ${redirectUri}`);
    console.log(`   User ID: ${config.alloyUserId}\n`);

    const { oauthUrl, credentialId } = await oauthFlow.initiateOAuthFlow(
      connectorId,
      redirectUri
    );

    console.log('✅ OAuth flow initiated successfully!');
    console.log('\n📋 OAuth URL:');
    console.log(`   ${oauthUrl}\n`);
    
    if (credentialId) {
      console.log(`💡 Credential ID: ${credentialId}\n`);
    }

    console.log('Next steps:');
    console.log('1. Open the OAuth URL in your browser');
    console.log('2. Complete the OAuth authorization');
    console.log('3. Extract the "code" parameter from the callback URL');
    console.log('4. Use handleOAuthCallback() to exchange code for Connection ID');

  } catch (error: any) {
    console.error('\n❌ OAuth flow test failed:', error.message);
    if (error.response?.data) {
      console.error('API Error:', error.response.data);
    }
    process.exit(1);
  }
}

testOAuthFlow();
