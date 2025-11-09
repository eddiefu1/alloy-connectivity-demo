import { NotionClient } from './notion-client.js';
import { getConfig } from './config.js';

/**
 * Test Notion connection with the configured connection ID
 * Usage: npm run test-notion-connection
 */

async function testNotionConnection() {
  try {
    console.log('🔍 Testing Notion Connection\n');
    console.log('='.repeat(60));

    const config = getConfig();
    const connectionId = process.env.CONNECTION_ID;

    if (!connectionId) {
      console.error('❌ CONNECTION_ID not set in .env file');
      process.exit(1);
    }

    console.log(`Connection ID: ${connectionId}`);
    console.log(`API Key: ${config.alloyApiKey.substring(0, 10)}...`);
    console.log(`User ID: ${config.alloyUserId}`);
    console.log(`Base URL: ${config.alloyBaseUrl}\n`);

    // Create Notion client
    console.log('Creating Notion client...');
    const notionClient = new NotionClient(config, connectionId);

    // Test 1: Search pages
    console.log('\n' + '='.repeat(60));
    console.log('TEST 1: Search Pages');
    console.log('='.repeat(60));
    
    try {
      const pages = await notionClient.searchPages(
        undefined, // query (optional)
        {
          value: 'page',
          property: 'object'
        }
      );
      
      console.log('✅ SUCCESS!');
      console.log(`   Found ${pages.length} pages`);
      if (pages.length > 0) {
        console.log('\n   Sample pages:');
        pages.slice(0, 3).forEach((page: any, index: number) => {
          const title = page.properties?.title?.title?.[0]?.plain_text || 
                       page.properties?.Name?.title?.[0]?.plain_text || 
                       'Untitled';
          console.log(`   ${index + 1}. ${title} (${page.id})`);
        });
      }
    } catch (error: any) {
      console.log('❌ FAILED');
      console.log(`   Error: ${error.message}`);
      if (error.response?.data) {
        console.log(`   Response: ${JSON.stringify(error.response.data, null, 2)}`);
      }
      if (error.response?.status) {
        console.log(`   Status: ${error.response.status}`);
      }
    }

    // Test 2: Get a specific page (if we have pages)
    console.log('\n' + '='.repeat(60));
    console.log('TEST 2: Get Page Details');
    console.log('='.repeat(60));
    
    // Use a test page ID or skip if no pages
    const testPageId = '2a5445ce-1cdc-8001-8570-c28e81fbf2fa'; // From MCP test
    
    try {
      const page = await notionClient.getPage(testPageId);
      console.log('✅ SUCCESS!');
      console.log(`   Page ID: ${page.id}`);
      const title = page.properties?.title?.title?.[0]?.plain_text || 
                   page.properties?.Name?.title?.[0]?.plain_text || 
                   'Untitled';
      console.log(`   Title: ${title}`);
    } catch (error: any) {
      console.log('⚠️  Page not found or error (this is okay)');
      console.log(`   Error: ${error.message}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Connection Test Complete');
    console.log('='.repeat(60));
    console.log('\n💡 If tests pass, your connection is working!');
    console.log('   You can now use the connection ID in your applications.\n');

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    if (error.response?.data) {
      console.error('API Error:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

testNotionConnection();

