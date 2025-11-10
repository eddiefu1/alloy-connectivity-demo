import { getConfig } from './config.js';
import { NotionClient } from './notion-client.js';
import { AlloyOAuthFlow } from './oauth-flow.js';
import { 
  getConnectionId, 
  getConnectorId,
  filterNotionConnections,
  sortConnectionsByDate,
  type Connection 
} from './connection-utils.js';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Verify and set the working Notion connection
 * This script:
 * 1. Tests the current connection from .env
 * 2. Tests connections from REST API to find working ones
 * 3. Updates .env file with the working connection ID
 * 
 * Usage: npm run verify-connection
 * Options:
 *   --test-all    Test all connections (default: test up to 10 most recent)
 *   --no-update   Don't update .env file, just verify
 */
async function verifyAndSetConnection() {
  try {
    const args = process.argv.slice(2);
    const testAll = args.includes('--test-all');
    const noUpdate = args.includes('--no-update');
    
    console.log('🔍 Verifying and Setting Notion Connection\n');
    console.log('='.repeat(60));

    const config = getConfig();
    const oauthFlow = new AlloyOAuthFlow();

    // Step 1: Test current connection from .env first
    const currentConnectionId = process.env.CONNECTION_ID;
    let workingConnection: Connection & { pageCount?: number } | null = null;

    if (currentConnectionId) {
      console.log(`📋 Testing current connection from .env: ${currentConnectionId}\n`);
      try {
        const notionClient = new NotionClient(config, currentConnectionId);
        const testResult = await notionClient.searchPages(
          undefined,
          { value: 'page', property: 'object' }
        );
        console.log(`   ✅ CURRENT CONNECTION WORKS!`);
        console.log(`   📊 Found ${testResult.length} pages`);
        console.log(`   🎯 Using this connection\n`);
        
        workingConnection = {
          credentialId: currentConnectionId,
          id: currentConnectionId,
          connectorId: 'notion',
          name: 'Current Connection (.env)',
          pageCount: testResult.length,
        };
      } catch (error: any) {
        console.log(`   ❌ Current connection failed: ${error.response?.data?.error?.message || error.message}\n`);
      }
    }

    // Step 2: Get all connections from REST API and test them
    if (!workingConnection) {
      console.log('📋 Fetching connections from REST API...\n');
      const connections = await oauthFlow.listConnections();

      if (connections.length === 0) {
        console.log('❌ No connections found');
        console.log('   Run: npm run connect-notion to create a connection');
        return;
      }

      console.log(`✅ Found ${connections.length} connection(s) from REST API\n`);

      // Filter for Notion connections
      const notionConnections = filterNotionConnections(connections);

      if (notionConnections.length === 0) {
        console.log('❌ No Notion connections found');
        console.log('   Run: npm run connect-notion to create a Notion connection');
        return;
      }

      console.log(`📌 Testing ${notionConnections.length} Notion connection(s)\n`);
      console.log('='.repeat(60));

      // Sort by date and limit to most recent (unless testAll is true)
      const connectionsToTest = testAll 
        ? sortConnectionsByDate(notionConnections)
        : sortConnectionsByDate(notionConnections).slice(0, 10);

      console.log(`Testing ${connectionsToTest.length} connection(s)...\n`);

      // Test each connection
      for (let i = 0; i < connectionsToTest.length && !workingConnection; i++) {
        const conn = connectionsToTest[i];
        const connectionId = getConnectionId(conn);
        const connectorId = getConnectorId(conn);
        const connectionName = conn.name || `Connection ${i + 1}`;

        if (!connectionId) {
          console.log(`\n[${i + 1}/${connectionsToTest.length}] Skipping: ${connectionName} (no connection ID)`);
          continue;
        }

        console.log(`\n[${i + 1}/${connectionsToTest.length}] Testing: ${connectionName}`);
        console.log(`   Connection ID: ${connectionId}`);
        console.log(`   Connector ID: ${connectorId}`);

        try {
          // Test the connection with a real API call
          const notionClient = new NotionClient(config, connectionId);
          const testResult = await notionClient.searchPages(
            undefined,
            { value: 'page', property: 'object' }
          );

          console.log(`   ✅ WORKING! API calls successful`);
          console.log(`   📊 Found ${testResult.length} pages`);

          workingConnection = {
            ...conn,
            connectionId: connectionId,
            pageCount: testResult.length,
          };
          console.log(`   🎯 Using this as the working connection`);

        } catch (error: any) {
          const errorMessage = error.response?.data?.error?.message || error.message;
          // Only show error for last connection or if verbose
          if (i === connectionsToTest.length - 1 || testAll) {
            console.log(`   ❌ FAILED: ${errorMessage}`);
          }
        }
      }
    }

    // Step 3: Update .env file if working connection found
    if (workingConnection) {
      const connectionId = getConnectionId(workingConnection);
      
      if (!connectionId) {
        console.log('\n❌ Working connection found but no connection ID available');
        return;
      }

      console.log('\n' + '='.repeat(60));
      console.log('✅ Working Connection Found!');
      console.log('='.repeat(60));
      console.log(`\n🔗 Connection ID (credentialId): ${connectionId}`);
      console.log(`📦 Connector ID: ${getConnectorId(workingConnection)}`);
      console.log(`📝 Name: ${workingConnection.name || 'N/A'}`);
      if (workingConnection.pageCount !== undefined) {
        console.log(`📊 Pages found: ${workingConnection.pageCount}`);
      }

      // Update .env file if not in no-update mode
      if (!noUpdate) {
        const currentEnvConnectionId = process.env.CONNECTION_ID;
        const shouldUpdate = currentEnvConnectionId !== connectionId;

        if (shouldUpdate) {
          // Update .env file
          const envPath = path.join(process.cwd(), '.env');
          let envContent = '';

          if (fs.existsSync(envPath)) {
            envContent = fs.readFileSync(envPath, 'utf-8');
          } else {
            // Create .env from .env.example if it doesn't exist
            const envExamplePath = path.join(process.cwd(), '.env.example');
            if (fs.existsSync(envExamplePath)) {
              envContent = fs.readFileSync(envExamplePath, 'utf-8');
            }
          }

          // Update or add CONNECTION_ID
          if (envContent.includes('CONNECTION_ID=')) {
            envContent = envContent.replace(
              /CONNECTION_ID=.*/,
              `CONNECTION_ID=${connectionId}`
            );
          } else {
            envContent += `\nCONNECTION_ID=${connectionId}\n`;
          }

          // Write updated .env file
          fs.writeFileSync(envPath, envContent, 'utf-8');

          console.log(`\n✅ Updated .env file with connection ID: ${connectionId}`);
          console.log(`   (Previous: ${currentEnvConnectionId || 'not set'})`);
        } else {
          console.log(`\n✅ Connection ID already set correctly in .env`);
          console.log(`   No update needed`);
        }
      } else {
        console.log(`\n⚠️  --no-update flag set, skipping .env update`);
      }

      console.log(`\n📝 Your .env file contains:`);
      console.log(`   CONNECTION_ID=${connectionId}`);
      console.log(`\n🎉 Connection is ready to use!`);
      console.log(`\n💡 Next steps:`);
      console.log(`   1. Run: npm run dev`);
      console.log(`   2. Or test: npm run verify-connection --no-update`);
      console.log('\n');

    } else {
      console.log('\n' + '='.repeat(60));
      console.log('❌ No Working Connections Found');
      console.log('='.repeat(60));
      console.log(`\n💡 Solutions:`);
      console.log(`   1. Create a new connection: npm run connect-notion`);
      console.log(`   2. Check your connections: npm run list-connections notion`);
      console.log(`   3. Check your connections in Alloy Dashboard`);
      console.log(`      https://app.runalloy.com`);
      console.log(`   4. Verify your API key has Connectivity API permissions`);
      console.log('\n');
    }

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    if (error.response?.data) {
      console.error('API Error:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

verifyAndSetConnection();
