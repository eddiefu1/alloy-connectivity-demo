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
    
    // Filter for Notion connections
    const notionConnections = connections.filter((conn: any) => 
      conn.connectorId === 'notion' || 
      conn.connector?.toLowerCase() === 'notion' ||
      conn.type?.toLowerCase().includes('notion') ||
      JSON.stringify(conn).toLowerCase().includes('notion')
    );
    
    if (notionConnections.length > 0) {
      console.log(`✅ Found ${notionConnections.length} Notion connection(s):\n`);
      notionConnections.forEach((conn: any, index: number) => {
        console.log(`Notion Connection ${index + 1}:`);
        console.log(`  ID: ${conn.id || conn._id || 'N/A'}`);
        console.log(`  Connector: ${conn.connectorId || conn.connector || 'N/A'}`);
        console.log(`  Type: ${conn.type || 'N/A'}`);
        console.log(`  Created: ${conn.createdAt || conn.created_at || 'N/A'}`);
        console.log(`  Status: ${conn.status || 'N/A'}`);
        console.log(`  Full object:`, JSON.stringify(conn, null, 2));
        console.log('');
      });
      
      // Use the first Notion connection (most recent)
      const firstNotion = notionConnections[0];
      const connectionId = firstNotion.credentialId || firstNotion.id || firstNotion._id;
      console.log(`\n💡 Recommended Connection ID: ${connectionId}`);
      console.log(`   Name: ${firstNotion.name || 'N/A'}`);
      console.log(`   Created: ${firstNotion.createdAt || 'N/A'}`);
      console.log(`\nAdd this to your .env file:`);
      console.log(`   CONNECTION_ID=${connectionId}\n`);
    } else {
      console.log('❌ No Notion connections found');
      console.log('\n📋 All connections:');
      connections.forEach((conn: any, index: number) => {
        console.log(`\nConnection ${index + 1}:`);
        console.log(JSON.stringify(conn, null, 2));
      });
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

