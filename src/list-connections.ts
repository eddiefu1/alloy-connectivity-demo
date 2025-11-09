import axios from 'axios';
import { getConfig } from './config.js';

/**
 * Utility script to list all connections for a user
 * This helps you find your Connection ID
 */
async function listConnections() {
  try {
    console.log('🔍 Fetching connections from Alloy...\n');
    
    const config = getConfig();
    
    // Create axios client
    const client = axios.create({
      baseURL: config.alloyBaseUrl,
      headers: {
        'Authorization': `Bearer ${config.alloyApiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    // Try to get connections via API
    // Note: The exact endpoint may vary - check Alloy API docs for the latest endpoint
    try {
      const response = await client.get(`/users/${config.alloyUserId}/connections`);
      
      console.log('✅ Connections found:\n');
      
      if (response.data && response.data.length > 0) {
        response.data.forEach((connection: any, index: number) => {
          console.log(`Connection ${index + 1}:`);
          console.log(`  ID: ${connection.id || connection.connectionId || 'N/A'}`);
          console.log(`  Integration: ${connection.integrationId || connection.integration || 'N/A'}`);
          console.log(`  Status: ${connection.status || 'N/A'}`);
          console.log(`  Created: ${connection.createdAt || 'N/A'}`);
          console.log('');
        });
        
        console.log('📋 To use a connection, copy its ID to your .env file:');
        console.log(`   CONNECTION_ID=${response.data[0].id || response.data[0].connectionId}`);
      } else {
        console.log('No connections found.');
        console.log('\n💡 To create a connection:');
        console.log('   1. Go to https://app.runalloy.com');
        console.log('   2. Navigate to Connections or Integrations');
        console.log('   3. Connect an integration (e.g., Notion)');
        console.log('   4. Run this script again to see the connection ID');
      }
    } catch (apiError: any) {
      // If the API endpoint doesn't work, provide alternative instructions
      console.log('⚠️  Could not fetch connections via API.');
      console.log('   This might be because:');
      console.log('   - The API endpoint structure has changed');
      console.log('   - You need to use a different authentication method');
      console.log('\n💡 Alternative ways to get your Connection ID:\n');
      console.log('1. From Alloy Dashboard:');
      console.log('   - Visit https://app.runalloy.com');
      console.log('   - Go to Connections or Integrations');
      console.log('   - Click on your connected integration');
      console.log('   - Copy the Connection ID from the details page');
      console.log('\n2. After OAuth Flow:');
      console.log('   - When a user connects an integration via OAuth');
      console.log('   - The connection ID is returned in the callback');
      console.log('   - Or check the Alloy dashboard after connection');
      console.log('\n3. Via Webhook:');
      console.log('   - Set up webhooks in Alloy dashboard');
      console.log('   - Receive connection.created events');
      console.log('   - Extract connection ID from webhook payload');
      console.log('\n📖 See docs/getting-connection-id.md for detailed instructions');
      
      if (apiError.response) {
        console.log('\nAPI Error Details:');
        console.log(`   Status: ${apiError.response.status}`);
        console.log(`   Message: ${JSON.stringify(apiError.response.data)}`);
      }
    }

  } catch (error: any) {
    console.error('\n❌ Failed to list connections:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    process.exit(1);
  }
}

// Run the script
listConnections();

