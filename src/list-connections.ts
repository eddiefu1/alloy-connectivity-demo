import { AlloyOAuthFlow } from './oauth-flow.js';
import { getConfig } from './config.js';
import { 
  getConnectionId, 
  getConnectorId, 
  filterNotionConnections,
  getMostRecentConnection,
  formatConnection,
  type Connection 
} from './connection-utils.js';

/**
 * List all connections or filter for Notion connections
 * Usage: 
 *   npm run list-connections           # List all connections
 *   npm run list-connections notion    # List only Notion connections
 */
async function listConnections() {
  try {
    const filter = process.argv[2]?.toLowerCase();
    const filterNotion = filter === 'notion';
    
    console.log(filterNotion 
      ? '🔍 Finding Notion Connections\n' 
      : '🔍 Fetching connections from Alloy...\n');
    
    const config = getConfig();
    const oauthFlow = new AlloyOAuthFlow();
    
    // Fetch all connections
    const allConnections = await oauthFlow.listConnections();
    
    if (allConnections.length === 0) {
      console.log('❌ No connections found');
      console.log('\n💡 To create a connection:');
      console.log('   1. Run: npm run connect-notion');
      console.log('   2. Or visit: https://app.runalloy.com');
      return;
    }
    
    // Filter if requested
    const connections = filterNotion 
      ? filterNotionConnections(allConnections) 
      : allConnections;
    
    if (connections.length === 0) {
      console.log(`❌ No ${filterNotion ? 'Notion ' : ''}connections found`);
      if (filterNotion) {
        console.log('\n📋 All available connections:');
        allConnections.forEach((conn: Connection, index: number) => {
          console.log(`\nConnection ${index + 1}:`);
          console.log(formatConnection(conn));
        });
      }
      console.log('\n💡 To create a Notion connection, run:');
      console.log('   npm run connect-notion\n');
      return;
    }
    
    console.log(`✅ Found ${connections.length} ${filterNotion ? 'Notion ' : ''}connection(s)\n`);
    
    // Display connections
    connections.forEach((conn: Connection, index: number) => {
      console.log(`${filterNotion ? 'Notion ' : ''}Connection ${index + 1}:`);
      console.log(formatConnection(conn, index));
      console.log('');
    });
    
    // Recommend the most recent connection
    const recommended = getMostRecentConnection(connections);
    if (recommended) {
      const connectionId = getConnectionId(recommended);
      if (connectionId) {
        console.log(`💡 Recommended Connection ID: ${connectionId}`);
        console.log(`   Connector: ${getConnectorId(recommended)}`);
        console.log(`   Name: ${recommended.name || 'N/A'}`);
        console.log(`\n📝 Add this to your .env file:`);
        console.log(`   CONNECTION_ID=${connectionId}`);
        if (filterNotion) {
          console.log(`\n✅ This connection ID is ready to use with the Connectivity API\n`);
        }
      }
    }
    
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    if (error.response?.data) {
      console.error('API Error:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

listConnections();
