import { AlloyOAuthFlow } from './oauth-flow.js';
import { getConfig } from './config.js';

/**
 * Find credential ID from connection ID or list all connections
 * Usage: npm run find-credential [connectionId]
 */
async function findCredentialId() {
  try {
    const config = getConfig();
    const oauthFlow = new AlloyOAuthFlow();
    const searchId = process.argv[2];

    console.log('🔍 Finding Credential/Connection Information\n');

    if (searchId) {
      console.log(`📋 Searching for ID: ${searchId}\n`);
      
      // Try to get connection details
      try {
        const connection = await oauthFlow.getConnection(searchId);
        console.log('✅ Found Connection:');
        console.log(JSON.stringify(connection, null, 2));
        
        // Extract credential ID
        const credentialId = connection.credentialId || connection.id || connection.credential_id;
        const connectionId = connection.connectionId || connection.id || connection.connection_id;
        
        console.log('\n📝 IDs:');
        console.log(`   Connection ID: ${connectionId || 'N/A'}`);
        console.log(`   Credential ID: ${credentialId || 'N/A'}`);
        console.log(`   Connector ID: ${connection.connectorId || connection.connector_id || 'N/A'}`);
        
        if (credentialId && credentialId !== searchId) {
          console.log(`\n💡 Use this Credential ID: ${credentialId}`);
          console.log(`   Update your .env: CONNECTION_ID=${credentialId}`);
        }
      } catch (error: any) {
        console.log(`❌ ID ${searchId} not found as connection`);
        console.log(`   Error: ${error.message}\n`);
      }
    }

    // List all connections
    console.log('📋 Listing all connections...\n');
    const connections = await oauthFlow.listConnections();
    
    if (connections.length === 0) {
      console.log('❌ No connections found');
      console.log('\n💡 Create a new connection:');
      console.log('   npm run connect-notion');
      return;
    }

    console.log(`✅ Found ${connections.length} connection(s):\n`);
    
    connections.forEach((conn: any, index: number) => {
      const connId = conn.id || conn.connectionId || conn.credentialId;
      const credId = conn.credentialId || conn.id;
      const connectorId = conn.connectorId || conn.connector_id;
      
      console.log(`Connection ${index + 1}:`);
      console.log(`   ID: ${connId}`);
      console.log(`   Credential ID: ${credId || 'Same as ID'}`);
      console.log(`   Connector: ${connectorId || 'N/A'}`);
      console.log(`   Name: ${conn.name || 'N/A'}`);
      console.log(`   Created: ${conn.createdAt || conn.created_at || 'N/A'}`);
      
      if (connectorId === 'notion' || (conn.name && conn.name.toLowerCase().includes('notion'))) {
        console.log(`   ⭐ This is a Notion connection!`);
        console.log(`   💡 Use this ID: ${credId || connId}`);
      }
      console.log('');
    });

    // Find Notion connections specifically
    const notionConnections = connections.filter((conn: any) => {
      const connectorId = conn.connectorId || conn.connector_id || '';
      const name = (conn.name || '').toLowerCase();
      return connectorId === 'notion' || name.includes('notion');
    });

    if (notionConnections.length > 0) {
      console.log(`\n🎯 Notion Connections Found: ${notionConnections.length}\n`);
      notionConnections.forEach((conn: any, index: number) => {
        const connId = conn.id || conn.connectionId || conn.credentialId;
        const credId = conn.credentialId || conn.id;
        
        console.log(`Notion Connection ${index + 1}:`);
        console.log(`   Connection ID: ${connId}`);
        console.log(`   Credential ID: ${credId || connId}`);
        console.log(`   Status: ${conn.status || 'active'}`);
        console.log(`   Created: ${conn.createdAt || conn.created_at || 'N/A'}`);
        
        // Recommend the most recent one
        if (index === 0) {
          console.log(`\n   ✅ Recommended: Use Credential ID ${credId || connId}`);
          console.log(`   📝 Add to .env: CONNECTION_ID=${credId || connId}`);
        }
        console.log('');
      });
    }

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    if (error.response?.data) {
      console.error('API Error:', JSON.stringify(error.response.data, null, 2));
    }
    
    if (error.response?.status === 401) {
      console.error('\n💡 Authentication Error:');
      console.error('   Check your ALLOY_API_KEY and ALLOY_USER_ID in .env');
    }
    
    process.exit(1);
  }
}

findCredentialId();

