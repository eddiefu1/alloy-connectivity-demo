import { AlloyOAuthFlow } from './oauth-flow.js';
import { getConfig } from './config.js';

/**
 * Test script to initiate OAuth flow for Notion
 * 
 * Usage:
 *   npm run test-oauth
 *   or
 *   ts-node src/test-oauth-flow.ts
 */
async function testOAuthFlow() {
  try {
    console.log('🧪 Testing OAuth Flow for Notion\n');
    console.log('='.repeat(60));

    const config = getConfig();
    const oauthFlow = new AlloyOAuthFlow();

    // Test parameters
    const connectorId = 'notion';
    const redirectUri = process.env.REDIRECT_URI || 'http://localhost:3000/oauth/callback';

    console.log('\n📋 Configuration:');
    console.log(`   Connector ID: ${connectorId}`);
    console.log(`   Redirect URI: ${redirectUri}`);
    console.log(`   User ID: ${config.alloyUserId}`);
    console.log(`   API Version: 2025-09`);

    // Step 1: Initiate OAuth flow
    console.log('\n' + '='.repeat(60));
    console.log('STEP 1: Initiating OAuth Flow');
    console.log('='.repeat(60));

    const { oauthUrl, credentialId } = await oauthFlow.initiateOAuthFlow(
      connectorId,
      redirectUri
    );

    console.log('\n✅ OAuth flow initiated successfully!');
    console.log('\n📋 Next Steps:');
    console.log('\n1. Copy this OAuth URL and open it in your browser:');
    console.log(`   ${oauthUrl}\n`);
    console.log('2. Complete the OAuth authorization in your browser');
    console.log('3. After authorization, you will be redirected to:');
    console.log(`   ${redirectUri}?code=...&state=...\n`);
    console.log('4. Extract the "code" parameter from the callback URL');
    console.log('5. Use the handleOAuthCallback() method to exchange the code for Connection ID\n');

    if (credentialId) {
      console.log(`💡 Credential ID: ${credentialId}`);
    }

    console.log('\n📝 Example callback handler:');
    console.log(`
import { AlloyOAuthFlow } from './oauth-flow';

const oauthFlow = new AlloyOAuthFlow();

// In your callback endpoint
app.get('/oauth/callback', async (req, res) => {
  const { code, state } = req.query;
  
  try {
    const { connectionId } = await oauthFlow.handleOAuthCallback(
      '${connectorId}',
      code as string,
      state as string
    );
    
    console.log('Connection ID:', connectionId);
    // Save to .env: CONNECTION_ID=\${connectionId}
    
    res.json({ success: true, connectionId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
    `);

    console.log('\n' + '='.repeat(60));
    console.log('✅ Test completed successfully!');
    console.log('='.repeat(60));

  } catch (error: any) {
    console.error('\n❌ OAuth flow test failed:', error.message);
    if (error.response) {
      console.error('\nAPI Response:', JSON.stringify(error.response.data, null, 2));
      console.error('\nStatus:', error.response.status);
      console.error('Headers:', error.response.headers);
    }
    process.exit(1);
  }
}

// Run the test
testOAuthFlow();

