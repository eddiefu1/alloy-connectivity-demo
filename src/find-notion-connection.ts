import { AlloyOAuthFlow } from './oauth-flow.js';
import { getConfig } from './config.js';

/**
 * Script to find Notion connection
 * Usage: npm run find-notion-connection
 */

async function findNotionConnection() {
  try {
    console.log('🔍 Finding Notion Connection\n');
    
    const config = getConfig();
    const oauthFlow = new AlloyOAuthFlow();
    
    // List all connections
    console.log('Fetching all connections...');
    const connections = await oauthFlow.listConnections();
    
    console.log(`\n✅ Found ${connections.length} connection(s)\n`);
    
    // Filter for Notion connections - check multiple possible fields
    const notionConnections = connections.filter((conn: any) => {
      // Check various fields that might indicate a Notion connection
      const connectorId = conn.connectorId || conn.connector || conn.integrationId || '';
      const type = conn.type || '';
      const name = (conn.name || '').toLowerCase();
      
      return (
        connectorId.toLowerCase() === 'notion' ||
        type.toLowerCase() === 'notion-oauth2' ||
        type.toLowerCase().includes('notion') ||
        name.includes('notion')
      );
    });
    
    if (notionConnections.length > 0) {
      console.log(`✅ Found ${notionConnections.length} Notion connection(s):\n`);
      
      notionConnections.forEach((conn: any, index: number) => {
        // Extract connection ID - prioritize credentialId, then id
        const connectionId = conn.credentialId || conn.id || conn._id || 'N/A';
        const connectorId = conn.connectorId || conn.connector || conn.integrationId || 'N/A';
        
        console.log(`Notion Connection ${index + 1}:`);
        console.log(`  Connection ID (credentialId): ${connectionId}`);
        console.log(`  Connector ID: ${connectorId}`);
        console.log(`  Type: ${conn.type || 'N/A'}`);
        console.log(`  Name: ${conn.name || 'N/A'}`);
        console.log(`  Created: ${conn.createdAt || conn.created_at || 'N/A'}`);
        console.log(`  Status: ${conn.status || 'N/A'}`);
        console.log('');
      });
      
      // Sort by creation date (most recent first)
      const sortedConnections = notionConnections.sort((a: any, b: any) => {
        const dateA = new Date(a.createdAt || a.created_at || 0).getTime();
        const dateB = new Date(b.createdAt || b.created_at || 0).getTime();
        return dateB - dateA;
      });
      
      // Use the most recent Notion connection
      const recommended = sortedConnections[0];
      const connectionId = recommended.credentialId || recommended.id || recommended._id;
      
      console.log(`\n💡 Recommended Connection ID: ${connectionId}`);
      console.log(`   Connector: ${recommended.connectorId || recommended.connector || 'notion'}`);
      console.log(`   Name: ${recommended.name || 'N/A'}`);
      console.log(`   Type: ${recommended.type || 'N/A'}`);
      console.log(`   Created: ${recommended.createdAt || recommended.created_at || 'N/A'}`);
      console.log(`\n📝 Add this to your .env file:`);
      console.log(`   CONNECTION_ID=${connectionId}`);
      console.log(`\n✅ This connection ID is ready to use with the Connectivity API\n`);
    } else {
      console.log('❌ No Notion connections found');
      console.log('\n📋 All available connections:');
      if (connections.length > 0) {
        connections.forEach((conn: any, index: number) => {
          const connectionId = conn.credentialId || conn.id || conn._id || 'N/A';
          const connectorId = conn.connectorId || conn.connector || conn.integrationId || 'N/A';
          console.log(`\nConnection ${index + 1}:`);
          console.log(`  ID: ${connectionId}`);
          console.log(`  Connector: ${connectorId}`);
          console.log(`  Type: ${conn.type || 'N/A'}`);
          console.log(`  Name: ${conn.name || 'N/A'}`);
        });
      } else {
        console.log('   No connections found in your account');
      }
      console.log('\n💡 To create a Notion connection, run:');
      console.log('   npm run connect-notion\n');
    }
    
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    if (error.response?.data) {
      console.error('API Error:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

findNotionConnection();

