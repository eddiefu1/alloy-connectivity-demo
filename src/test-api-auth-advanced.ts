import axios from 'axios';
import { getConfig } from './config.js';

/**
 * Advanced diagnostic script to test different authentication methods
 * Usage: npm run test-api-auth-advanced
 */

async function testAdvancedAuth() {
  console.log('🔍 Advanced API Authentication Testing\n');
  console.log('='.repeat(60));

  const config = getConfig();
  const apiKey = config.alloyApiKey;
  const userId = config.alloyUserId;
  const baseUrl = config.alloyBaseUrl;

  console.log('\n📋 Configuration:');
  console.log(`   API Key: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}`);
  console.log(`   User ID: ${userId}`);
  console.log(`   Base URL: ${baseUrl}`);
  console.log(`   API Key Length: ${apiKey.length} characters`);

  // Test different authentication methods
  const authMethods = [
    {
      name: 'Bearer Token (Standard)',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'x-api-version': '2025-09',
        'Content-Type': 'application/json',
      },
    },
    {
      name: 'Bearer Token (No API Version)',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    },
    {
      name: 'API Key Header',
      headers: {
        'X-API-Key': apiKey,
        'x-api-version': '2025-09',
        'Content-Type': 'application/json',
      },
    },
    {
      name: 'Authorization Header (No Bearer)',
      headers: {
        'Authorization': apiKey,
        'x-api-version': '2025-09',
        'Content-Type': 'application/json',
      },
    },
  ];

  const endpoint = `${baseUrl}/users/${userId}/credentials`;

  for (const method of authMethods) {
    console.log('\n' + '='.repeat(60));
    console.log(`Testing: ${method.name}`);
    console.log('='.repeat(60));
    console.log(`Endpoint: GET ${endpoint}`);
    console.log(`Headers:`, JSON.stringify(method.headers, null, 2));

    try {
      const response = await axios.get(endpoint, {
        headers: method.headers,
        timeout: 5000,
        validateStatus: (status) => status < 500, // Don't throw on 401/403
      });

      if (response.status === 200) {
        console.log('✅ SUCCESS!');
        console.log(`   Status: ${response.status}`);
        console.log(`   This authentication method works!`);
        break;
      } else {
        console.log(`❌ Failed (Status: ${response.status})`);
        if (response.data) {
          console.log(`   Response: ${JSON.stringify(response.data, null, 2)}`);
        }
      }
    } catch (error: any) {
      console.log(`❌ Error: ${error.message}`);
      if (error.response?.data) {
        console.log(`   Response: ${JSON.stringify(error.response.data, null, 2)}`);
      }
    }
  }

  // Test with provided API keys
  console.log('\n' + '='.repeat(60));
  console.log('Testing Provided API Keys');
  console.log('='.repeat(60));

  const providedKeys = [
    { name: 'Development Key', key: 'M4FRCFAQaciuUMF2lKwQv' },
    { name: 'Production Key', key: 'TWsxXkP4OngtBYRl1_soA' },
  ];

  for (const providedKey of providedKeys) {
    console.log(`\nTesting: ${providedKey.name}`);
    console.log(`Key: ${providedKey.key.substring(0, 10)}...${providedKey.key.substring(providedKey.key.length - 4)}`);

    try {
      const response = await axios.get(endpoint, {
        headers: {
          'Authorization': `Bearer ${providedKey.key}`,
          'x-api-version': '2025-09',
          'Content-Type': 'application/json',
        },
        timeout: 5000,
        validateStatus: (status) => status < 500,
      });

      if (response.status === 200) {
        console.log('✅ SUCCESS! This key works!');
        console.log(`   You should use this key in your .env file`);
        console.log(`   ALLOY_API_KEY=${providedKey.key}`);
        break;
      } else {
        console.log(`❌ Failed (Status: ${response.status})`);
        if (response.data) {
          console.log(`   Response: ${JSON.stringify(response.data, null, 2)}`);
        }
      }
    } catch (error: any) {
      console.log(`❌ Error: ${error.message}`);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  console.log('\n💡 Recommendations:');
  console.log('   1. If a provided key works, update your .env file');
  console.log('   2. If none work, get a new API key from Alloy Dashboard');
  console.log('   3. Verify the API key has Connectivity API permissions');
  console.log('   4. Make sure the User ID matches the API key owner');
  console.log('\n');
}

testAdvancedAuth().catch(console.error);

