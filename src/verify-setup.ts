import { getConfig } from './config.js';
import dotenv from 'dotenv';

/**
 * Verify Alloy API setup and credentials
 * Usage: npm run verify-setup
 */
async function verifySetup() {
  dotenv.config();
  
  console.log('🔍 Verifying Alloy API Setup\n');
  console.log('='.repeat(50));
  
  // Check environment variables
  console.log('\n📋 Environment Variables:');
  const apiKey = process.env.ALLOY_API_KEY;
  const userId = process.env.ALLOY_USER_ID;
  const connectionId = process.env.CONNECTION_ID;
  const baseUrl = process.env.ALLOY_BASE_URL || 'https://production.runalloy.com';
  const environment = process.env.ALLOY_ENVIRONMENT || 'production';
  
  console.log(`   ALLOY_API_KEY: ${apiKey ? apiKey.substring(0, 10) + '...' : '❌ Missing'}`);
  console.log(`   ALLOY_USER_ID: ${userId || '❌ Missing'}`);
  console.log(`   CONNECTION_ID: ${connectionId || '⚠️  Not set'}`);
  console.log(`   ALLOY_BASE_URL: ${baseUrl}`);
  console.log(`   ALLOY_ENVIRONMENT: ${environment}`);
  
  // Validate required fields
  let hasErrors = false;
  
  if (!apiKey) {
    console.log('\n❌ ALLOY_API_KEY is missing!');
    console.log('   Get it from: https://app.runalloy.com → Settings → API Keys');
    hasErrors = true;
  }
  
  if (!userId) {
    console.log('\n❌ ALLOY_USER_ID is missing!');
    console.log('   Get it from: https://app.runalloy.com → Settings → API Keys');
    hasErrors = true;
  }
  
  if (hasErrors) {
    console.log('\n💡 Fix these errors and try again.');
    process.exit(1);
  }
  
  // Test API connection
  console.log('\n🧪 Testing API Connection...');
  try {
    const config = getConfig();
    const { AlloyOAuthFlow } = await import('./oauth-flow.js');
    const oauthFlow = new AlloyOAuthFlow();
    
    // Try to list connections (this will test authentication)
    console.log('   Attempting to list connections...');
    const connections = await oauthFlow.listConnections();
    
    console.log(`✅ API Connection successful!`);
    console.log(`   Found ${connections.length} connection(s)\n`);
    
    if (connections.length > 0) {
      console.log('📋 Available Connections:');
      connections.forEach((conn: any, index: number) => {
        const connId = conn.id || conn.connectionId || conn.credentialId;
        const connectorId = conn.connectorId || conn.connector_id || 'unknown';
        console.log(`   ${index + 1}. ${connectorId} - ID: ${connId}`);
      });
      
      // Check if connection ID exists
      if (connectionId) {
        const found = connections.find((conn: any) => {
          const connId = conn.id || conn.connectionId || conn.credentialId;
          return connId === connectionId;
        });
        
        if (found) {
          console.log(`\n✅ Your CONNECTION_ID (${connectionId}) exists!`);
          const connectorId = found.connectorId || found.connector_id;
          console.log(`   Connector: ${connectorId}`);
        } else {
          console.log(`\n⚠️  Your CONNECTION_ID (${connectionId}) was not found in your connections.`);
          console.log(`   Available IDs are listed above.`);
          console.log(`   Update .env with a valid connection ID.`);
        }
      } else {
        console.log(`\n💡 No CONNECTION_ID set. Use one of the IDs above.`);
        const notionConn = connections.find((conn: any) => {
          const connectorId = conn.connectorId || conn.connector_id;
          return connectorId === 'notion';
        });
        if (notionConn) {
          const connId = notionConn.id || notionConn.connectionId || notionConn.credentialId;
          console.log(`   Recommended: CONNECTION_ID=${connId}`);
        }
      }
    } else {
      console.log('\n⚠️  No connections found.');
      console.log('   Create a new connection: npm run connect-notion');
    }
    
  } catch (error: any) {
    console.log(`\n❌ API Connection failed!`);
    console.log(`   Error: ${error.message}`);
    
    if (error.response?.status === 401) {
      console.log('\n🔐 Authentication Error:');
      console.log('   Your API key or User ID is incorrect.');
      console.log('   Steps to fix:');
      console.log('   1. Go to https://app.runalloy.com');
      console.log('   2. Navigate to Settings → API Keys');
      console.log('   3. Copy your API Key and User ID');
      console.log('   4. Update your .env file');
    } else if (error.response?.data) {
      console.log('\n📋 API Error Details:');
      console.log(JSON.stringify(error.response.data, null, 2));
    }
    
    process.exit(1);
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ Setup verification complete!');
}

verifySetup();

