import { AlloyOAuthFlow } from './oauth-flow.js';
import { NotionClient } from './notion-client.js';
import { getConfig } from './config.js';
import { 
  getConnectionId, 
  filterNotionConnections,
  getMostRecentConnection,
  type Connection 
} from './connection-utils.js';

/**
 * Examples demonstrating how the Alloy Connectivity API connects
 * Usage: node --loader ts-node/esm src/api-connection-examples.ts
 */
async function demonstrateApiConnections() {
  console.log('🔗 Alloy Connectivity API Connection Examples\n');
  console.log('='.repeat(70));
  
  const config = getConfig();
  const oauthFlow = new AlloyOAuthFlow();

  // ============================================================
  // EXAMPLE 1: List All Connections
  // ============================================================
  console.log('\n📋 Example 1: Listing All Connections');
  console.log('-'.repeat(70));
  console.log('Code:');
  console.log('  const oauthFlow = new AlloyOAuthFlow();');
  console.log('  const connections = await oauthFlow.listConnections();');
  console.log('\nExecuting...\n');
  
  try {
    const allConnections = await oauthFlow.listConnections();
    console.log(`✅ Found ${allConnections.length} total connection(s)`);
    
    if (allConnections.length > 0) {
      console.log('\nSample connections:');
      allConnections.slice(0, 3).forEach((conn: Connection, index: number) => {
        const connId = getConnectionId(conn);
        console.log(`  ${index + 1}. ${conn.name || 'Unnamed'}`);
        console.log(`     ID: ${connId}`);
        console.log(`     Type: ${conn.type || 'N/A'}`);
        console.log(`     Created: ${conn.createdAt || conn.created_at || 'N/A'}`);
      });
      if (allConnections.length > 3) {
        console.log(`  ... and ${allConnections.length - 3} more`);
      }
    }
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.response?.data) {
      console.error('API Error:', JSON.stringify(error.response.data, null, 2));
    }
  }

  // ============================================================
  // EXAMPLE 2: Filter Notion Connections
  // ============================================================
  console.log('\n\n📋 Example 2: Filtering Notion Connections');
  console.log('-'.repeat(70));
  console.log('Code:');
  console.log('  const notionConnections = connections.filter(');
  console.log('    (conn) => conn.connectorId === "notion"');
  console.log('  );');
  console.log('\nExecuting...\n');
  
  try {
    const allConnections = await oauthFlow.listConnections();
    const notionConnections = filterNotionConnections(allConnections);
    console.log(`✅ Found ${notionConnections.length} Notion connection(s)`);
    
    if (notionConnections.length > 0) {
      const recent = getMostRecentConnection(notionConnections);
      if (recent) {
        const connId = getConnectionId(recent);
        console.log(`\n💡 Most recent Notion connection:`);
        console.log(`   ID: ${connId}`);
        console.log(`   Name: ${recent.name || 'N/A'}`);
      }
    }
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }

  // ============================================================
  // EXAMPLE 3: Initialize OAuth Flow
  // ============================================================
  console.log('\n\n🔐 Example 3: Initiating OAuth Flow');
  console.log('-'.repeat(70));
  console.log('Code:');
  console.log('  const { oauthUrl, credentialId } = await oauthFlow.initiateOAuthFlow(');
  console.log('    "notion",');
  console.log('    "http://localhost:3000/oauth/callback"');
  console.log('  );');
  console.log('\n⚠️  Note: This example shows the code pattern but won\'t execute');
  console.log('   (to avoid creating unnecessary connections)');
  console.log('\n   To actually connect:');
  console.log('   1. Run: npm run connect-notion');
  console.log('   2. Or use the web UI: npm run server');

  // ============================================================
  // EXAMPLE 4: Using a Connection to Make API Calls
  // ============================================================
  console.log('\n\n📡 Example 4: Using Connection ID for API Calls');
  console.log('-'.repeat(70));
  console.log('Code:');
  console.log('  const config = getConfig();');
  console.log('  const notionClient = new NotionClient(config, connectionId);');
  console.log('  const pages = await notionClient.searchPages();');
  console.log('\nExecuting with CONNECTION_ID from .env...\n');
  
  try {
    const connectionId = process.env.CONNECTION_ID;
    
    if (!connectionId) {
      console.log('⚠️  CONNECTION_ID not set in .env file');
      console.log('\n💡 To test API calls:');
      console.log('   1. Get a connection ID: npm run list-connections notion');
      console.log('   2. Add to .env: CONNECTION_ID=your_connection_id');
      console.log('   3. Run this script again');
    } else {
      console.log(`Using Connection ID: ${connectionId}`);
      const notionClient = new NotionClient(config, connectionId);
      
      // Test search
      console.log('\n  Testing: Search for pages...');
      try {
        const pages = await notionClient.searchPages(
          undefined, 
          { value: 'page', property: 'object' }
        );
        console.log(`  ✅ Success! Found ${pages.length} page(s)`);
        
        if (pages.length > 0) {
          console.log('\n  Sample pages:');
          pages.slice(0, 3).forEach((page: any, index: number) => {
            const title = page.properties?.title?.title?.[0]?.plain_text || 
                         page.properties?.Name?.title?.[0]?.plain_text ||
                         'Untitled';
            console.log(`    ${index + 1}. ${title}`);
            console.log(`       ID: ${page.id}`);
          });
        }
      } catch (apiError: any) {
        console.log(`  ❌ API call failed: ${apiError.message}`);
        if (apiError.response?.data) {
          console.log(`     Error: ${JSON.stringify(apiError.response.data, null, 2)}`);
        }
        console.log('\n  💡 This might mean:');
        console.log('     - Connection ID is invalid or expired');
        console.log('     - Connection needs to be re-authenticated');
        console.log('     - Try: npm run connect-notion');
      }
    }
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }

  // ============================================================
  // EXAMPLE 5: Complete Connection Flow Summary
  // ============================================================
  console.log('\n\n📚 Example 5: Complete Connection Flow Summary');
  console.log('-'.repeat(70));
  console.log(`
The Alloy Connectivity API connection flow:

1. INITIALIZE OAUTH
   ┌─────────────────────────────────────────┐
   │ const oauthFlow = new AlloyOAuthFlow(); │
   │ const { oauthUrl } = await              │
   │   oauthFlow.initiateOAuthFlow(          │
   │     'notion',                           │
   │     'http://localhost:3000/callback'    │
   │   );                                    │
   └─────────────────────────────────────────┘
                    ↓
2. USER AUTHORIZES
   ┌─────────────────────────────────────────┐
   │ Redirect user to oauthUrl               │
   │ User grants permissions in Notion        │
   └─────────────────────────────────────────┘
                    ↓
3. HANDLE CALLBACK
   ┌─────────────────────────────────────────┐
   │ const { connectionId } = await          │
   │   oauthFlow.handleOAuthCallback(        │
   │     'notion',                           │
   │     code  // from callback URL          │
   │   );                                    │
   └─────────────────────────────────────────┘
                    ↓
4. USE CONNECTION
   ┌─────────────────────────────────────────┐
   │ const client = new NotionClient(         │
   │   config,                                │
   │   connectionId                           │
   │ );                                       │
   │ const pages = await                     │
   │   client.searchPages();                 │
   └─────────────────────────────────────────┘
  `);

  console.log('\n' + '='.repeat(70));
  console.log('✅ Examples Complete!');
  console.log('='.repeat(70));
  console.log('\n💡 Quick Commands:');
  console.log('   npm run list-connections      - List all connections');
  console.log('   npm run list-connections notion - List Notion connections');
  console.log('   npm run connect-notion        - Create new Notion connection');
  console.log('   npm run test-connection       - Test a connection');
  console.log('   npm run hello-world           - Simple write example');
  console.log('   npm run easy-example          - More examples');
  console.log();
}

demonstrateApiConnections();

