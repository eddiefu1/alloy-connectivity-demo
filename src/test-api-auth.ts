import axios from 'axios';
import { getConfig } from './config.js';

/**
 * Diagnostic script to test REST API authentication
 * Usage: npm run test-api-auth
 */

async function testApiAuth() {
  console.log('🔍 Testing Alloy REST API Authentication\n');
  console.log('='.repeat(60));

  const config = getConfig();
  
  console.log('\n📋 Configuration:');
  console.log(`   API Key: ${config.alloyApiKey.substring(0, 10)}...${config.alloyApiKey.substring(config.alloyApiKey.length - 4)}`);
  console.log(`   User ID: ${config.alloyUserId}`);
  console.log(`   Base URL: ${config.alloyBaseUrl}`);
  console.log(`   Environment: ${config.environment}`);
  console.log(`   API Key Length: ${config.alloyApiKey.length} characters`);

  // Test 1: List connections endpoint
  console.log('\n' + '='.repeat(60));
  console.log('TEST 1: List Connections Endpoint');
  console.log('='.repeat(60));
  console.log(`Endpoint: GET ${config.alloyBaseUrl}/users/${config.alloyUserId}/credentials`);
  
  try {
    const response = await axios.get(
      `${config.alloyBaseUrl}/users/${config.alloyUserId}/credentials`,
      {
        headers: {
          'Authorization': `Bearer ${config.alloyApiKey}`,
          'x-api-version': '2025-09',
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );
    
    console.log('✅ SUCCESS!');
    console.log(`   Status: ${response.status}`);
    console.log(`   Response keys: ${Object.keys(response.data).join(', ')}`);
    if (response.data.data) {
      console.log(`   Connections found: ${response.data.data.length}`);
    }
  } catch (error: any) {
    console.log('❌ FAILED');
    console.log(`   Status: ${error.response?.status || 'N/A'}`);
    console.log(`   Error: ${error.message}`);
    if (error.response?.data) {
      console.log(`   Response: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    if (error.response?.headers) {
      console.log(`   Response Headers:`, JSON.stringify(error.response.headers, null, 2));
    }
  }

  // Test 2: Get specific connection endpoint
  console.log('\n' + '='.repeat(60));
  console.log('TEST 2: Get Connection Endpoint');
  console.log('='.repeat(60));
  const connectionId = process.env.CONNECTION_ID || '690ff6ff2472d76a35e7ebaa';
  console.log(`Endpoint: GET ${config.alloyBaseUrl}/credentials/${connectionId}`);
  
  try {
    const response = await axios.get(
      `${config.alloyBaseUrl}/credentials/${connectionId}`,
      {
        headers: {
          'Authorization': `Bearer ${config.alloyApiKey}`,
          'x-api-version': '2025-09',
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );
    
    console.log('✅ SUCCESS!');
    console.log(`   Status: ${response.status}`);
    console.log(`   Connection ID: ${response.data.id || connectionId}`);
    console.log(`   Connector: ${response.data.connectorId || 'N/A'}`);
  } catch (error: any) {
    console.log('❌ FAILED');
    console.log(`   Status: ${error.response?.status || 'N/A'}`);
    console.log(`   Error: ${error.message}`);
    if (error.response?.data) {
      console.log(`   Response: ${JSON.stringify(error.response.data, null, 2)}`);
    }
  }

  // Test 3: List available connectors
  console.log('\n' + '='.repeat(60));
  console.log('TEST 3: List Available Connectors');
  console.log('='.repeat(60));
  console.log(`Endpoint: GET ${config.alloyBaseUrl}/connectors`);
  
  try {
    const response = await axios.get(
      `${config.alloyBaseUrl}/connectors`,
      {
        headers: {
          'Authorization': `Bearer ${config.alloyApiKey}`,
          'x-api-version': '2025-09',
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );
    
    console.log('✅ SUCCESS!');
    console.log(`   Status: ${response.status}`);
    console.log(`   Connectors found: ${Array.isArray(response.data) ? response.data.length : 'N/A'}`);
  } catch (error: any) {
    console.log('❌ FAILED');
    console.log(`   Status: ${error.response?.status || 'N/A'}`);
    console.log(`   Error: ${error.message}`);
    if (error.response?.data) {
      console.log(`   Response: ${JSON.stringify(error.response.data, null, 2)}`);
    }
  }

  // Test 4: OAuth initiation endpoint (POST)
  console.log('\n' + '='.repeat(60));
  console.log('TEST 4: OAuth Initiation Endpoint');
  console.log('='.repeat(60));
  console.log(`Endpoint: POST ${config.alloyBaseUrl}/connectors/notion/credentials`);
  
  try {
    const response = await axios.post(
      `${config.alloyBaseUrl}/connectors/notion/credentials`,
      {
        connectorId: 'notion',
        authenticationType: 'oauth2',
        redirectUri: 'http://localhost:3000/oauth/callback',
        userId: config.alloyUserId,
      },
      {
        headers: {
          'Authorization': `Bearer ${config.alloyApiKey}`,
          'x-api-version': '2025-09',
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );
    
    console.log('✅ SUCCESS!');
    console.log(`   Status: ${response.status}`);
    console.log(`   OAuth URL: ${response.data.oauthUrl ? 'Present' : 'Missing'}`);
    console.log(`   Credential ID: ${response.data.credentialId || 'N/A'}`);
  } catch (error: any) {
    console.log('❌ FAILED');
    console.log(`   Status: ${error.response?.status || 'N/A'}`);
    console.log(`   Error: ${error.message}`);
    if (error.response?.data) {
      console.log(`   Response: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    if (error.response?.status === 401) {
      console.log('\n   🔍 401 Unauthorized - Possible issues:');
      console.log('      1. API key is invalid or expired');
      console.log('      2. API key does not have required permissions');
      console.log('      3. API key format is incorrect');
      console.log('      4. User ID does not match the API key');
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  console.log('\n💡 Next Steps:');
  console.log('   1. If all tests fail with 401:');
  console.log('      - Verify API key in Alloy Dashboard');
  console.log('      - Check API key has Connectivity API permissions');
  console.log('      - Ensure User ID matches the API key owner');
  console.log('      - Try regenerating the API key');
  console.log('   2. If some tests pass:');
  console.log('      - Check which endpoints work');
  console.log('      - Verify endpoint-specific permissions');
  console.log('   3. If connection tests fail but OAuth works:');
  console.log('      - Connection ID might be invalid');
  console.log('      - Connection might belong to different user');
  console.log('\n');
}

testApiAuth().catch(console.error);

