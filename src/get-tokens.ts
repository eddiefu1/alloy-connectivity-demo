import { AlloyOAuthFlow } from './oauth-flow.js';
import { getConfig } from './config.js';

/**
 * Script to retrieve token information for a connection
 * Usage: npm run get-tokens <connectionId>
 * Or: node --loader ts-node/esm src/get-tokens.ts <connectionId>
 */

async function getTokens() {
  try {
    const connectionId = process.argv[2];
    
    if (!connectionId) {
      console.error('❌ Error: Connection ID is required');
      console.log('\nUsage:');
      console.log('  npm run get-tokens <connectionId>');
      console.log('  node --loader ts-node/esm src/get-tokens.ts <connectionId>');
      console.log('\nTo get your connection ID:');
      console.log('  1. Complete the OAuth flow');
      console.log('  2. Check the connection ID from the success page');
      console.log('  3. Or list connections: npm run list-connections');
      process.exit(1);
    }

    console.log('🔍 Retrieving token information...\n');
    
    const config = getConfig();
    const oauthFlow = new AlloyOAuthFlow();
    
    console.log('📋 Connection Information:');
    console.log(`   Connection ID: ${connectionId}`);
    console.log(`   Alloy User ID: ${config.alloyUserId}`);
    console.log(`   Alloy API Key: ${config.alloyApiKey.substring(0, 10)}... (masked)\n`);
    
    // Get connection details
    console.log('📡 Fetching connection details...');
    const connection = await oauthFlow.getConnection(connectionId);
    
    console.log('\n✅ Connection Details:');
    console.log(JSON.stringify(connection, null, 2));
    
    // Get token information
    console.log('\n🔑 Fetching token information...');
    const tokenInfo = await oauthFlow.getConnectionTokens(connectionId);
    
    console.log('\n📊 Token Information:');
    console.log(`   Has Tokens: ${tokenInfo.hasTokens ? '✅ Yes' : '❌ No'}`);
    
    if (tokenInfo.tokenInfo) {
      console.log('\n   Token Details:');
      console.log(`   Access Token: ${tokenInfo.tokenInfo.accessToken ? '[REDACTED]' : 'Not available'}`);
      console.log(`   Refresh Token: ${tokenInfo.tokenInfo.refreshToken ? '[REDACTED]' : 'Not available'}`);
      console.log(`   Token Type: ${tokenInfo.tokenInfo.tokenType || 'N/A'}`);
      console.log(`   Expires At: ${tokenInfo.tokenInfo.expiresAt || 'N/A'}`);
      console.log(`   Scopes: ${tokenInfo.tokenInfo.scopes || 'N/A'}`);
    } else {
      console.log('\n   ⚠️  Token information not available in connection details.');
      console.log('   This is normal - Alloy stores tokens securely and may not expose them via API.');
    }
    
    console.log('\n💡 Notes:');
    console.log('   1. Alloy API Key: Use ALLOY_API_KEY from .env file');
    console.log('   2. Notion Tokens: Managed by Alloy, use connection ID for API calls');
    console.log('   3. To make API calls: Use the connection ID with Alloy\'s API');
    console.log('   4. Direct token access: Not typically available for security reasons');
    
    console.log('\n📚 API Usage:');
    console.log('   - Use connection ID with Alloy API endpoints');
    console.log('   - Alloy handles token refresh automatically');
    console.log('   - No need to manage tokens directly');
    
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    if (error.response?.data) {
      console.error('API Error:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

getTokens();

