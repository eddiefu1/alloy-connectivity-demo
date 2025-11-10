import { getConfig } from './config.js';
import { NotionClient } from './notion-client.js';
import { AlloyOAuthFlow } from './oauth-flow.js';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Verify and set the working Notion connection
 * This script:
 * 1. Tests the known working connection ID from .env
 * 2. Gets credentials from REST API and tests them
 * 3. Tests the MCP-verified credential ID if available
 * 4. Updates .env file with the working connection ID
 * Usage: npm run verify-connection
 */

async function verifyAndSetConnection() {
  try {
    console.log('🔍 Verifying and Setting Notion Connection\n');
    console.log('='.repeat(60));

    const config = getConfig();
    const oauthFlow = new AlloyOAuthFlow();

    // Step 1: Test current connection from .env first
    const currentConnectionId = process.env.CONNECTION_ID;
    let workingConnection: any = null;

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
          connectionId: currentConnectionId,
          connectorId: 'notion',
          name: 'Current Connection (.env)',
          pageCount: testResult.length,
        };
      } catch (error: any) {
        console.log(`   ❌ Current connection failed: ${error.response?.data?.error?.message || error.message}\n`);
      }
    }

    // Step 2: Test known working credential from MCP
    // Based on MCP verification, this credential ID works: 6911017b4d2bcbfd4ce727fe
    const knownWorkingCredentialId = '6911017b4d2bcbfd4ce727fe';
    
    if (!workingConnection && knownWorkingCredentialId !== currentConnectionId) {
      console.log(`📋 Testing known working credential: ${knownWorkingCredentialId}\n`);
      try {
        const notionClient = new NotionClient(config, knownWorkingCredentialId);
        const testResult = await notionClient.searchPages(
          undefined,
          { value: 'page', property: 'object' }
        );
        console.log(`   ✅ KNOWN WORKING CREDENTIAL WORKS!`);
        console.log(`   📊 Found ${testResult.length} pages`);
        console.log(`   🎯 Using this credential\n`);
        
        workingConnection = {
          connectionId: knownWorkingCredentialId,
          connectorId: 'notion',
          name: 'Known Working Credential (MCP verified)',
          pageCount: testResult.length,
        };
      } catch (error: any) {
        console.log(`   ❌ Known credential failed: ${error.response?.data?.error?.message || error.message}\n`);
      }
    }

    // Step 3: Get all connections from REST API
    console.log('📋 Fetching connections from REST API...\n');
    const connections = await oauthFlow.listConnections();

    if (connections.length === 0) {
      console.log('❌ No connections found');
      console.log('   Run: npm run connect-notion to create a connection');
      return;
    }

    console.log(`✅ Found ${connections.length} connection(s) from REST API\n`);

    // Step 4: Filter for Notion connections and test them (only if we don't have a working connection yet)
    if (!workingConnection) {
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

      if (notionConnections.length > 0) {
        console.log(`📌 Testing ${notionConnections.length} Notion connection(s) from REST API\n`);
        console.log('='.repeat(60));

        // Test up to 10 most recent connections (to avoid testing all 24)
        const recentConnections = notionConnections
          .sort((a: any, b: any) => {
            const dateA = new Date(a.createdAt || a.created_at || 0).getTime();
            const dateB = new Date(b.createdAt || b.created_at || 0).getTime();
            return dateB - dateA;
          })
          .slice(0, 10); // Test only the 10 most recent

        for (let i = 0; i < recentConnections.length && !workingConnection; i++) {
          const conn = recentConnections[i];
          const connectionId = conn.credentialId || conn.id || conn._id;
          const connectorId = conn.connectorId || conn.connector || conn.integrationId || 'notion';
          const connectionName = conn.name || `Connection ${i + 1}`;

          console.log(`\n[${i + 1}/${recentConnections.length}] Testing: ${connectionName}`);
          console.log(`   Connection ID: ${connectionId}`);

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
              connectionId,
              connectorId,
              name: connectionName,
              type: conn.type,
              createdAt: conn.createdAt || conn.created_at,
              pageCount: testResult.length,
            };
            console.log(`   🎯 Using this as the working connection`);

          } catch (error: any) {
            // Silently fail - don't spam output for failed connections
            // Only log if it's the last one or if there's an interesting error
            if (i === recentConnections.length - 1) {
              const errorMessage = error.response?.data?.error?.message || error.message;
              console.log(`   ❌ FAILED: ${errorMessage}`);
            }
          }
        }
      }
    }

    // Step 5: Update .env file if working connection found
    if (workingConnection) {
      console.log('\n' + '='.repeat(60));
      console.log('✅ Working Connection Found!');
      console.log('='.repeat(60));
      console.log(`\n🔗 Connection ID (credentialId): ${workingConnection.connectionId}`);
      console.log(`📦 Connector ID: ${workingConnection.connectorId}`);
      console.log(`📝 Name: ${workingConnection.name}`);
      if (workingConnection.pageCount !== undefined) {
        console.log(`📊 Pages found: ${workingConnection.pageCount}`);
      }

      // Only update .env if it's different from current
      const currentEnvConnectionId = process.env.CONNECTION_ID;
      const shouldUpdate = currentEnvConnectionId !== workingConnection.connectionId;

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
            `CONNECTION_ID=${workingConnection.connectionId}`
          );
        } else {
          envContent += `\nCONNECTION_ID=${workingConnection.connectionId}\n`;
        }

        // Write updated .env file
        fs.writeFileSync(envPath, envContent, 'utf-8');

        console.log(`\n✅ Updated .env file with connection ID: ${workingConnection.connectionId}`);
        console.log(`   (Previous: ${currentEnvConnectionId || 'not set'})`);
      } else {
        console.log(`\n✅ Connection ID already set correctly in .env`);
        console.log(`   No update needed`);
      }

      console.log(`\n📝 Your .env file contains:`);
      console.log(`   CONNECTION_ID=${workingConnection.connectionId}`);
      console.log(`\n🎉 Connection is ready to use!`);
      console.log(`\n💡 Next steps:`);
      console.log(`   1. Run: npm run dev`);
      console.log(`   2. Or test: npm run test-notion-connection`);
      console.log('\n');

    } else {
      console.log('\n' + '='.repeat(60));
      console.log('❌ No Working Connections Found');
      console.log('='.repeat(60));
      console.log(`\n💡 Solutions:`);
      console.log(`   1. The known working credential ID is: 6911017b4d2bcbfd4ce727fe`);
      console.log(`      Try adding this to your .env file:`);
      console.log(`      CONNECTION_ID=6911017b4d2bcbfd4ce727fe`);
      console.log(`\n   2. Create a new connection: npm run connect-notion`);
      console.log(`\n   3. Check your connections in Alloy Dashboard`);
      console.log(`      https://app.runalloy.com`);
      console.log(`\n   4. Verify your API key has Connectivity API permissions`);
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

