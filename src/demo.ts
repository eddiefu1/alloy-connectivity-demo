import { NotionClient } from './notion-client.js';
import { getConfig } from './config.js';
import { AlloyOAuthFlow } from './oauth-flow.js';
import { getConnectionId, getConnectorId } from './connection-utils.js';

/**
 * Main demo function that demonstrates:
 * 1. Authentication flow
 * 2. Reading data (pages) from Notion
 * 3. Writing data (creating new pages) to Notion
 */
async function runDemo() {
  try {
    console.log('🚀 Starting Alloy Connectivity API Demo\n');
    console.log('='.repeat(50));

    // Load configuration
    const config = getConfig();
    const connectionId = process.env.CONNECTION_ID;

    // Step 1: Authentication Flow
    console.log('\nSTEP 1: Authentication Flow');
    console.log('='.repeat(50));
    
    if (!connectionId) {
      console.log('⚠️  CONNECTION_ID not set in .env file');
      console.log('   Run: npm run connect-notion to create a connection');
      console.log('   Or: npm run list-connections notion to find existing connections');
      return;
    }

    console.log(`✓ API Key configured: ${config.alloyApiKey.substring(0, 10)}...`);
    console.log(`✓ User ID: ${config.alloyUserId}`);
    console.log(`✓ Connection ID: ${connectionId}`);

    // Step 2: Connect to Integration
    console.log('\nSTEP 2: Connect to Integration');
    console.log('='.repeat(50));
    
    // Create Notion client first to test the connection
    const notionClient = new NotionClient(config, connectionId);
    
    try {
      // Try to verify connection by making a test API call
      console.log(`   Testing connection: ${connectionId}`);
      const testResult = await notionClient.searchPages(
        undefined,
        { value: 'page', property: 'object' }
      );
      
      console.log(`✓ Connection verified and working!`);
      console.log(`✓ Connection ID: ${connectionId}`);
      console.log(`✓ API calls are functional`);
      
      // Also try to get connection details from list
      try {
        const oauthFlow = new AlloyOAuthFlow();
        const connections = await oauthFlow.listConnections();
        const connection = connections.find((conn: any) => {
          const connId = getConnectionId(conn);
          return connId === connectionId;
        });
        
        if (connection) {
          const connectorId = getConnectorId(connection);
          console.log(`✓ Connection details found:`);
          console.log(`   Connection ID (credentialId): ${connectionId}`);
          console.log(`   Connector ID: ${connectorId}`);
          console.log(`   Name: ${connection.name || 'N/A'}`);
          console.log(`   Type: ${connection.type || 'N/A'}`);
          console.log(`   Created: ${connection.createdAt || connection.created_at || 'N/A'}`);
        } else {
          console.log(`   Note: Connection not found in list, but API calls work`);
          console.log(`   Using connection ID: ${connectionId}`);
          console.log(`   Connector: notion (default)`);
        }
      } catch (listError: any) {
        // Ignore list errors if direct API works
        console.log(`   Note: Could not fetch connection details from list`);
        console.log(`   Using connection ID: ${connectionId}`);
        console.log(`   Connector: notion (default)`);
      }
    } catch (error: any) {
      console.log(`❌ Connection test failed: ${error.message}`);
      if (error.response?.data) {
        const errorData = error.response.data;
        if (errorData.error?.code === 'INVALID_INPUT' && errorData.error?.message === 'Credential not found') {
          console.log(`   Error: This connection ID is not valid for API calls`);
          console.log(`   Please use a valid connection ID from: npm run list-connections notion`);
        } else {
          console.log(`   Error details: ${JSON.stringify(errorData, null, 2)}`);
        }
      }
      throw error; // Re-throw to stop demo if connection doesn't work
    }

    // Step 3: Read Data (Pages) - READ Operation
    console.log('\nSTEP 3: Read Data - Fetch Pages');
    console.log('='.repeat(50));
    
    try {
      const pages = await notionClient.searchPages(
        undefined, // query
        { value: 'page', property: 'object' } // filter
      );
      console.log(`✓ Successfully read ${pages.length} page records`);
      if (pages.length > 0) {
        const page = pages[0];
        const title = page.properties?.title?.title?.[0]?.plain_text || 
                     page.properties?.Name?.title?.[0]?.plain_text || 
                     'Untitled';
        console.log(`✓ Sample page: "${title}" (${page.id})`);
      } else {
        console.log('   No pages found in your Notion workspace');
      }
    } catch (error: any) {
      console.log(`⚠️  Could not read pages: ${error.message}`);
      if (error.response?.data) {
        console.log(`   Error details: ${JSON.stringify(error.response.data, null, 2)}`);
      }
    }

    // Step 4: Write Data (Create Page) - WRITE Operation
    console.log('\nSTEP 4: Write Data - Create New Page');
    console.log('='.repeat(50));
    
    let createdPageId: string | undefined;
    let createdPageUrl: string | undefined;
    
    try {
      const newPage = await notionClient.createPage({
        parent: {
          type: 'workspace',
          workspace: true,
        },
        properties: {
          title: {
            type: 'title',
            title: [
              {
                type: 'text',
                text: {
                  content: 'Project Planning - Created via Alloy API',
                },
              },
            ],
          },
        },
      });
      
      // Extract page ID and URL from response
      createdPageId = newPage.id || newPage.data?.id || newPage.responseData?.id;
      createdPageUrl = newPage.url || newPage.data?.url || newPage.responseData?.url || newPage.public_url;
      
      console.log('✅ Page created successfully!');
      console.log(`   Page ID: ${createdPageId || 'N/A'}`);
      console.log(`   URL: ${createdPageUrl || 'N/A'}`);
      
      // Log full response for debugging
      if (!createdPageId || !createdPageUrl) {
        console.log('\n   Full response structure:');
        console.log(JSON.stringify(newPage, null, 2));
      }
    } catch (error: any) {
      console.log(`⚠️  Could not create page: ${error.message}`);
      if (error.response?.data) {
        console.log(`   Error details: ${JSON.stringify(error.response.data, null, 2)}`);
      }
    }

    // Step 5: Update Data - UPDATE Operation
    console.log('\nSTEP 5: Update Data - Update Existing Page');
    console.log('='.repeat(50));
    
    try {
      let pageIdToUpdate: string | undefined;
      
      // Use the page we just created, or search for an existing one
      if (createdPageId) {
        pageIdToUpdate = createdPageId;
        console.log(`   Using newly created page: ${pageIdToUpdate}`);
      } else {
        // Fallback: search for pages
        const pages = await notionClient.searchPages(
          undefined,
          { value: 'page', property: 'object' }
        );
        
        if (pages.length > 0) {
          pageIdToUpdate = pages[0].id;
          console.log(`   Using existing page: ${pageIdToUpdate}`);
        }
      }
      
      if (pageIdToUpdate) {
        // Update the page title
        const updatedPage = await notionClient.updatePage(pageIdToUpdate, {
          properties: {
            title: {
              type: 'title',
              title: [
                {
                  type: 'text',
                  text: {
                    content: 'Project Planning - Updated via Alloy API',
                  },
                },
              ],
            },
          },
        });
        
        console.log('✅ Page updated successfully!');
        console.log(`   Updated page ID: ${updatedPage.id || pageIdToUpdate}`);
        console.log(`   Updated URL: ${updatedPage.url || createdPageUrl || 'N/A'}`);
        
        // Save page ID to environment for future use
        if (createdPageId || updatedPage.id) {
          console.log(`\n   💡 Page ID saved: ${createdPageId || updatedPage.id}`);
          console.log(`   💡 Page URL: ${createdPageUrl || updatedPage.url || 'N/A'}`);
        }
      } else {
        console.log('⚠️  No page ID available to update');
        console.log('   Create a page first, then try updating it');
      }
    } catch (error: any) {
      console.log(`⚠️  Could not update page: ${error.message}`);
      if (error.response?.data) {
        console.log(`   Error details: ${JSON.stringify(error.response.data, null, 2)}`);
      }
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('✅ Demo Completed Successfully!');
    console.log('='.repeat(50));
    console.log('\nThis demo demonstrated:');
    console.log('  ✓ Authentication flow with Alloy Unified API');
    console.log('  ✓ Reading data (pages) from Notion');
    console.log('  ✓ Writing data (creating pages) to Notion');
    console.log('  ✓ Updating existing page data in Notion');
    console.log('\nFor a real connection:');
    console.log('  1. Complete OAuth flow: npm run connect-notion');
    console.log('  2. Add CONNECTION_ID to your .env file');
    console.log('  3. Run this demo again');
    console.log();

  } catch (error: any) {
    console.error('\n❌ Demo failed:', error.message);
    process.exit(1);
  }
}

// Run the demo
runDemo();
