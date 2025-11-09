import axios from 'axios';
import { getConfig } from './config.js';

/**
 * Utility script to get JWT token from Alloy
 * This token is needed for authenticating the Alloy Frontend SDK
 * 
 * Usage:
 *   npm run get-jwt-token
 *   or
 *   node --loader ts-node/esm src/get-jwt-token.ts
 */
async function getJWTToken() {
  try {
    console.log('🔑 Getting JWT Token from Alloy\n');
    console.log('='.repeat(60));

    const config = getConfig();
    
    // Try different base URLs and endpoint patterns
    // WORKING ENDPOINT: GET https://embedded.runalloy.com/users/{userId}/token with x-api-version header
    const endpointsToTry = [
      // Working endpoint - try this first!
      { url: 'https://embedded.runalloy.com', path: '/users/{userId}/token', method: 'GET', useVersionHeader: true, priority: 1 },
      
      // Fallback endpoints
      { url: 'https://embedded.runalloy.com', path: '/users/{userId}/token', method: 'GET', useVersionHeader: true, priority: 2 },
      { url: 'https://embedded.runalloy.com', path: '/2025-09/users/{userId}/token', method: 'GET', useVersionHeader: false, priority: 3 },
      { url: 'https://embedded.runalloy.com', path: '/2024-02/users/{userId}/token', method: 'GET', useVersionHeader: false, priority: 4 },
      { url: 'https://embedded.runalloy.com', path: '/users/{userId}/token', method: 'POST', useVersionHeader: true, priority: 5 },
    ];
    
    const apiVersions = ['2025-09', '2024-02', '2023-12'];
    let jwtToken = null;
    let lastError = null;

    console.log('\n📋 Configuration:');
    console.log(`   User ID: ${config.alloyUserId}`);
    console.log(`   API Key: ${config.alloyApiKey.substring(0, 20)}...`);

    console.log('\n' + '='.repeat(60));
    console.log('Generating JWT token from Alloy...');
    console.log('='.repeat(60));

    // Sort by priority (lower number = higher priority)
    endpointsToTry.sort((a, b) => (a.priority || 999) - (b.priority || 999));

    // Try each endpoint configuration
    for (const endpointConfig of endpointsToTry) {
      const versionsToTry = endpointConfig.useVersionHeader ? apiVersions : [null];
      
      for (const version of versionsToTry) {
        const endpoint = endpointConfig.path.replace('{userId}', config.alloyUserId);
        const fullUrl = `${endpointConfig.url}${endpoint}`;
        
        const headers: any = {
          'Authorization': `Bearer ${config.alloyApiKey}`,
          'Accept': 'application/json',
        };
        
        // Add API version header if needed
        if (endpointConfig.useVersionHeader && version) {
          headers['x-api-version'] = version;
        }
        
        // Only show detailed logs if we haven't found a token yet
        if (!jwtToken) {
          console.log(`\nTrying: ${endpointConfig.method} ${fullUrl}`);
          if (version && endpointConfig.useVersionHeader) {
            console.log(`   Header: x-api-version: ${version}`);
          }
        }
        
        try {
          // Make the request based on method
          let response;
          if (endpointConfig.method === 'GET') {
            response = await axios.get(fullUrl, { headers });
          } else {
            response = await axios.post(fullUrl, {}, { headers });
          }

          // Try to extract JWT token from various response formats
          jwtToken = response.data.token || response.data.data?.token || response.data.access_token || response.data.jwt || response.data;
          
          // Validate it looks like a JWT (has dots and reasonable length)
          if (jwtToken && typeof jwtToken === 'string' && jwtToken.includes('.') && jwtToken.length > 50) {
            console.log(`\n✅ Success! JWT token generated successfully`);
            console.log(`   Endpoint: ${endpointConfig.method} ${fullUrl}`);
            if (version && endpointConfig.useVersionHeader) {
              console.log(`   API Version: ${version}`);
            }
            break;
          } else if (response.data && typeof response.data === 'object') {
            // Log the response to see what we got
            console.log(`   Response keys: ${Object.keys(response.data).join(', ')}`);
            console.log(`   Response sample: ${JSON.stringify(response.data).substring(0, 150)}...`);
          }
        } catch (error: any) {
          lastError = error;
          // Only log errors if we haven't found a token yet
          if (!jwtToken) {
            if (error.response?.status === 404) {
              console.log(`   ❌ 404 - Endpoint not found`);
            } else if (error.response?.status === 401) {
              console.log(`   ❌ 401 - Unauthorized`);
            } else if (error.response?.status === 403) {
              console.log(`   ❌ 403 - Forbidden`);
            } else if (error.response?.status === 400) {
              console.log(`   ❌ 400 - Bad Request`);
              if (error.response?.data?.error) {
                console.log(`   Error: ${error.response.data.error.message || JSON.stringify(error.response.data.error)}`);
              }
            } else {
              console.log(`   ⚠️  Error: ${error.message}`);
            }
          }
          continue;
        }
      }
      
      if (jwtToken) break;
    }

    if (!jwtToken) {
      if (lastError) {
        throw lastError;
      } else {
        throw new Error('No token received in response from any API version');
      }
    }

    console.log('\n✅ JWT Token retrieved successfully!\n');
    console.log('='.repeat(60));
    console.log('JWT Token:');
    console.log('='.repeat(60));
    console.log(jwtToken);
    console.log('='.repeat(60));

    console.log('\n📝 Next Steps:');
    console.log('\n1. Copy this JWT token');
    console.log('2. Use it in your frontend application:');
    console.log('   ```javascript');
    console.log('   await alloy.authenticate("' + jwtToken.substring(0, 50) + '...");');
    console.log('   ```');
    console.log('\n3. Or paste it in the HTML example file:');
    console.log('   - Open src/frontend-oauth-example.html');
    console.log('   - Paste the token in the "JWT Token" field');
    console.log('   - Click "Authenticate with Alloy"');
    console.log('\n⚠️  Note: JWT tokens are typically short-lived');
    console.log('   You may need to generate a new token if it expires');
    console.log('\n');

  } catch (error: any) {
    console.error('\n❌ Failed to get JWT token:', error.message);
    
    if (error.response) {
      console.error('\nAPI Response:', JSON.stringify(error.response.data, null, 2));
      console.error('\nStatus:', error.response.status);
      console.error('Headers:', error.response.headers);
      
      if (error.response.status === 401) {
        console.error('\n💡 Tip: Check that your API key is correct and has the right permissions');
      } else if (error.response.status === 404) {
        console.error('\n💡 Tip: Check that your User ID is correct');
        console.error('   User ID format should match what you see in the Alloy dashboard');
      }
    } else if (error.request) {
      console.error('\n💡 Tip: Check your internet connection');
    }
    
    process.exit(1);
  }
}

// Run the script
getJWTToken();

