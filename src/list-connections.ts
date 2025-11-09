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
    
    // Create axios client (use production.runalloy.com like oauth-flow.ts)
    const client = axios.create({
      baseURL: 'https://production.runalloy.com',
      headers: {
        'Authorization': `Bearer ${config.alloyApiKey}`,
        'x-api-version': '2025-09',
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    // Try to get connections via API
    // Use /credentials endpoint like oauth-flow.ts
    try {
      const response = await client.get(`/users/${config.alloyUserId}/credentials`);
      
      const connections = response.data.data || response.data || [];
      
      if (Array.isArray(connections) && connections.length > 0) {
        console.log(`✅ Found ${connections.length} connection(s):\n`);
        
        // Sort by creation date (most recent first)
        const sortedConnections = [...connections].sort((a: any, b: any) => {
          const dateA = new Date(a.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || 0).getTime();
          return dateB - dateA;
        });
        
        sortedConnections.forEach((connection: any, index: number) => {
          const connectionId = connection.id || connection.connectionId || connection.credentialId || 'N/A';
          const connectorId = connection.connectorId || connection.integrationId || connection.type || 'N/A';
          const status = connection.status || connection.state || 'N/A';
          const createdAt = connection.createdAt ? new Date(connection.createdAt).toLocaleString() : 'N/A';
          
          console.log(`Connection ${index + 1}:`);
          console.log(`  ID: ${connectionId}`);
          console.log(`  Connector: ${connectorId}`);
          console.log(`  Status: ${status}`);
          console.log(`  Created: ${createdAt}`);
          
          // Show additional fields if available
          if (connection.name) console.log(`  Name: ${connection.name}`);
          if (connection.description) console.log(`  Description: ${connection.description}`);
          
          console.log('');
        });
        
        // Get the most recent connection (first in sorted list)
        const mostRecentConnection = sortedConnections[0];
        const connectionId = mostRecentConnection?.id || mostRecentConnection?.connectionId || mostRecentConnection?.credentialId;
        
        console.log('📋 Recommended: Use the most recent connection');
        console.log(`   Copy this to your .env file:`);
        console.log(`   CONNECTION_ID=${connectionId}`);
        console.log('');
        console.log('💡 Tip: You can use any of the connection IDs above. The most recent one is shown by default.');
      } else {
        console.log('No connections found.');
        console.log('\n💡 To create a connection:');
        console.log('   1. Run: npm run connect-notion');
        console.log('   2. Or go to https://app.runalloy.com');
        console.log('   3. Navigate to Connections or Integrations');
        console.log('   4. Connect an integration (e.g., Notion)');
        console.log('   5. Run this script again to see the connection ID');
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

