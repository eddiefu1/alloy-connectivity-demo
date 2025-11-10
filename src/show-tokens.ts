import { getConfig } from './config.js';
import { AlloyOAuthFlow } from './oauth-flow.js';

/**
 * Script to display both Alloy API Key and Notion Access Token information
 * Usage: npm run show-tokens [connectionId]
 */

async function showTokens() {
  try {
    const connectionId = process.argv[2] || process.env.CONNECTION_ID;
    
    console.log('🔑 Token Information\n');
    console.log('='.repeat(60));
    
    // 1. Alloy API Key
    console.log('\n📋 1. ALLOY API KEY');
    console.log('-'.repeat(60));
    const config = getConfig();
    console.log(`Environment: ${config.environment}`);
    console.log(`API Key: [REDACTED]`);
    console.log(`API Key (masked): ${config.alloyApiKey.substring(0, 10)}...${config.alloyApiKey.substring(config.alloyApiKey.length - 4)}`);
    console.log(`Base URL: ${config.alloyBaseUrl}`);
    console.log(`User ID: ${config.alloyUserId}`);
    
    // 2. Notion Access Token (if connection ID provided)
    if (connectionId) {
      console.log('\n📋 2. NOTION ACCESS TOKEN (via Alloy)');
      console.log('-'.repeat(60));
      console.log(`Connection ID: ${connectionId}`);
      
      try {
        const oauthFlow = new AlloyOAuthFlow();
        const tokenInfo = await oauthFlow.getConnectionTokens(connectionId);
        
        console.log(`Has Tokens: ${tokenInfo.hasTokens ? '✅ Yes' : '❌ No'}`);
        
        if (tokenInfo.tokenInfo) {
          console.log('\nToken Details:');
          if (tokenInfo.tokenInfo.accessToken) {
            console.log(`Access Token: [REDACTED]`);
          } else {
            console.log('Access Token: Not available in API response');
          }
          
          if (tokenInfo.tokenInfo.refreshToken) {
            console.log(`Refresh Token: [REDACTED]`);
          } else {
            console.log('Refresh Token: Not available in API response');
          }
          
          console.log(`Token Type: ${tokenInfo.tokenInfo.tokenType || 'N/A'}`);
          console.log(`Expires At: ${tokenInfo.tokenInfo.expiresAt || 'N/A'}`);
          console.log(`Scopes: ${tokenInfo.tokenInfo.scopes || 'N/A'}`);
        } else {
          console.log('\n⚠️  Token information not exposed by Alloy API');
          console.log('This is normal - Alloy stores tokens securely.');
          console.log('Use the Connection ID to make API calls instead.');
        }
        
        console.log('\nConnection Status:');
        console.log(JSON.stringify(tokenInfo.connection, null, 2));
        
      } catch (error: any) {
        console.error('Error retrieving token information:', error.message);
        if (error.response?.data) {
          console.error('API Response:', JSON.stringify(error.response.data, null, 2));
        }
      }
    } else {
      console.log('\n📋 2. NOTION ACCESS TOKEN');
      console.log('-'.repeat(60));
      console.log('❌ Connection ID not provided');
      console.log('\nTo get Notion token information:');
      console.log('  1. Complete OAuth flow to get Connection ID');
      console.log('  2. Run: npm run show-tokens <connectionId>');
      console.log('  3. Or set CONNECTION_ID in .env file');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('\n💡 Summary:');
    console.log('  • Alloy API Key: Available in config.alloyApiKey');
    console.log('  • Notion Tokens: Managed by Alloy, use Connection ID');
    console.log('  • To make API calls: Use Connection ID with Alloy API');
    console.log('  • Alloy handles token refresh automatically\n');
    
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    if (error.response?.data) {
      console.error('API Error:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

showTokens();

