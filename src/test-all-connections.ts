import { AlloyOAuthFlow } from './oauth-flow.js';
import { NotionClient } from './notion-client.js';
import { getConfig } from './config.js';

/**
 * Test all connections to find which ones work
 * Usage: npm run test-all-connections
 */

async function testAllConnections() {
  try {
    console.log('🔍 Testing All Connections to Find Working Ones\n');
    console.log('='.repeat(60));

    const config = getConfig();
    const oauthFlow = new AlloyOAuthFlow();

    // Step 1: Get all connections
    console.log('📋 Fetching all connections...\n');
    const connections = await oauthFlow.listConnections();

    if (connections.length === 0) {
      console.log('❌ No connections found');
      console.log('   Run: npm run connect-notion to create a connection');
      return;
    }

    console.log(`✅ Found ${connections.length} connection(s)\n`);

    // Step 2: Filter for Notion connections - check multiple possible fields
    const notionConnections = connections.filter((conn: any) => {
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

    if (notionConnections.length === 0) {
      console.log('❌ No Notion connections found');
      console.log('   Run: npm run connect-notion to create a Notion connection');
      return;
    }

    console.log(`📌 Found ${notionConnections.length} Notion connection(s) to test\n`);
    
    // Also check if there's a connection ID in .env that works
    const envConnectionId = process.env.CONNECTION_ID;
    if (envConnectionId) {
      console.log(`🔍 Also testing connection ID from .env: ${envConnectionId}\n`);
      // Add it to the list if not already there
      const envConnInList = notionConnections.find((conn: any) => 
        (conn.credentialId || conn.id || conn._id) === envConnectionId
      );
      if (!envConnInList) {
        notionConnections.unshift({
          credentialId: envConnectionId,
          id: envConnectionId,
          name: 'Connection from .env (Current)',
          type: 'notion-oauth2',
          createdAt: 'N/A (from environment)',
        });
      }
    }
    
    console.log('='.repeat(60));

    // Step 3: Test each connection
    const workingConnections: any[] = [];
    const failedConnections: any[] = [];

    for (let i = 0; i < notionConnections.length; i++) {
      const conn = notionConnections[i];
      // Prioritize credentialId as that's what's used in API calls
      const connectionId = conn.credentialId || conn.id || conn._id;
      const connectorId = conn.connectorId || conn.connector || conn.integrationId || 'notion';
      const connectionName = conn.name || `Connection ${i + 1}`;

      console.log(`\n[${i + 1}/${notionConnections.length}] Testing: ${connectionName}`);
      console.log(`   Connection ID (credentialId): ${connectionId}`);
      console.log(`   Connector ID: ${connectorId}`);
      console.log(`   Type: ${conn.type || 'N/A'}`);
      console.log(`   Created: ${conn.createdAt || conn.created_at || 'N/A'}`);

      try {
        // Test the connection with a real API call
        const notionClient = new NotionClient(config, connectionId);
        const testResult = await notionClient.searchPages(
          undefined,
          { value: 'page', property: 'object' }
        );

        console.log(`   ✅ WORKING! API calls successful`);
        console.log(`   📊 Found ${testResult.length} pages`);

        workingConnections.push({
          ...conn,
          connectionId,
          connectionName,
          pageCount: testResult.length,
        });

      } catch (error: any) {
        const errorMessage = error.response?.data?.error?.message || error.message;
        console.log(`   ❌ FAILED: ${errorMessage}`);
        
        if (error.response?.data?.error?.code === 'INVALID_INPUT' && 
            error.response?.data?.error?.message === 'Credential not found') {
          console.log(`   ⚠️  This connection ID is not valid for API calls`);
        }

        failedConnections.push({
          ...conn,
          connectionId,
          connectionName,
          error: errorMessage,
        });
      }
    }

    // Step 4: Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY');
    console.log('='.repeat(60));

    console.log(`\n✅ Working Connections: ${workingConnections.length}`);
    if (workingConnections.length > 0) {
      console.log('\n   Recommended connection(s):\n');
      workingConnections.forEach((conn, index) => {
        console.log(`   ${index + 1}. ${conn.connectionName}`);
        console.log(`      Connection ID: ${conn.connectionId}`);
        console.log(`      Type: ${conn.type || 'N/A'}`);
        console.log(`      Created: ${conn.createdAt || 'N/A'}`);
        console.log(`      Pages found: ${conn.pageCount}`);
        console.log(`      \n      Add to .env:`);
        console.log(`      CONNECTION_ID=${conn.connectionId}\n`);
      });

      // Recommend the first working connection
      const recommended = workingConnections[0];
      console.log('   💡 RECOMMENDED CONNECTION:');
      console.log(`      Connection ID: ${recommended.connectionId}`);
      console.log(`      Name: ${recommended.connectionName}`);
      console.log(`      \n      Update your .env file:`);
      console.log(`      CONNECTION_ID=${recommended.connectionId}\n`);
    }

    console.log(`\n❌ Failed Connections: ${failedConnections.length}`);
    if (failedConnections.length > 0) {
      console.log('\n   These connections did not work for API calls:\n');
      failedConnections.forEach((conn, index) => {
        console.log(`   ${index + 1}. ${conn.connectionName}`);
        console.log(`      Connection ID: ${conn.connectionId}`);
        console.log(`      Error: ${conn.error}`);
        console.log('');
      });
    }

    // Step 5: Instructions
    console.log('='.repeat(60));
    console.log('📝 NEXT STEPS');
    console.log('='.repeat(60));

    if (workingConnections.length > 0) {
      const recommended = workingConnections[0];
      console.log(`\n1. Update your .env file with the recommended connection:`);
      console.log(`   CONNECTION_ID=${recommended.connectionId}`);
      console.log(`\n2. Test the connection:`);
      console.log(`   npm run test-notion-connection`);
      console.log(`\n3. Run the demo:`);
      console.log(`   npm run dev`);
    } else {
      console.log(`\n❌ No working connections found.`);
      console.log(`\n1. Create a new connection:`);
      console.log(`   npm run connect-notion`);
      console.log(`\n2. Or check your connections in the Alloy Dashboard`);
      console.log(`   https://app.runalloy.com`);
    }

    console.log('\n');

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    if (error.response?.data) {
      console.error('API Error:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

testAllConnections();

