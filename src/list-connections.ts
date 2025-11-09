import axios from 'axios';
import { getConfig } from './config.js';

/**
 * Utility script to list all connections for a user
 * Usage: npm run list-connections
 */
async function listConnections() {
  try {
    console.log('🔍 Fetching connections from Alloy...\n');
    
    const config = getConfig();
    const client = axios.create({
      baseURL: 'https://production.runalloy.com',
      headers: {
        'Authorization': `Bearer ${config.alloyApiKey}`,
        'x-api-version': '2025-09',
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    const response = await client.get(`/users/${config.alloyUserId}/credentials`);
    const connections = response.data.data || response.data || [];
    
    if (connections.length > 0) {
      console.log(`✅ Found ${connections.length} connection(s):\n`);
      
      connections.forEach((connection: any, index: number) => {
        const connectionId = connection.id || connection.connectionId || connection.credentialId || 'N/A';
        const connectorId = connection.connectorId || connection.integrationId || 'N/A';
        
        console.log(`Connection ${index + 1}:`);
        console.log(`  ID: ${connectionId}`);
        console.log(`  Connector: ${connectorId}`);
        console.log('');
      });
      
      const mostRecentConnection = connections[0];
      const connectionId = mostRecentConnection?.id || mostRecentConnection?.connectionId || mostRecentConnection?.credentialId;
      
      console.log('📋 Add this to your .env file:');
      console.log(`   CONNECTION_ID=${connectionId}`);
    } else {
      console.log('No connections found.');
      console.log('\n💡 To create a connection:');
      console.log('   1. Run: npm run connect-notion');
      console.log('   2. Or visit: https://app.runalloy.com');
    }
  } catch (error: any) {
    console.error('\n❌ Failed to list connections:', error.message);
    if (error.response?.data) {
      console.error('API Error:', error.response.data);
    }
    process.exit(1);
  }
}

listConnections();
