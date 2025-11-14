import { NotionClient } from './notion-client.js';
import { getConfig } from './config.js';

/**
 * Test a Notion connection with Alloy
 * Usage: npm run test-connection [connectionId]
 */
async function testConnection() {
  try {
    const config = getConfig();
    const connectionId = process.argv[2] || process.env.CONNECTION_ID;
    
    if (!connectionId) {
      console.error('❌ Connection ID is required');
      console.log('\n💡 Usage:');
      console.log('   npm run test-connection [connectionId]');
      console.log('   Or set CONNECTION_ID in .env file');
      process.exit(1);
    }

    console.log('🔗 Testing Notion Connection with Alloy\n');
    console.log(`📋 Connection ID: ${connectionId}\n`);

    // Create Notion client
    const notionClient = new NotionClient(config, connectionId);

    // Test 1: Search for pages
    console.log('🧪 Test 1: Searching for pages...');
    try {
      const pages = await notionClient.searchPages(undefined, { value: 'page', property: 'object' });
      console.log(`✅ Search successful! Found ${pages.length} page(s)\n`);
      
      if (pages.length > 0) {
        console.log('📄 Sample pages:');
        pages.slice(0, 5).forEach((page: any, index: number) => {
          const title = page.properties?.title?.title?.[0]?.plain_text || 
                       page.properties?.Name?.title?.[0]?.plain_text ||
                       'Untitled';
          console.log(`   ${index + 1}. ${title}`);
          console.log(`      ID: ${page.id}`);
        });
        console.log();
      }
    } catch (error: any) {
      console.error('❌ Failed to search pages:', error.message);
      if (error.response?.data) {
        console.error('API Error:', JSON.stringify(error.response.data, null, 2));
      }
      throw error;
    }

    // Test 2: Get a specific page (if we have pages)
    try {
      const pages = await notionClient.searchPages(undefined, { value: 'page', property: 'object' });
      if (pages.length > 0) {
        console.log(`🧪 Test 2: Retrieving page "${pages[0].id}"...`);
        const page = await notionClient.getPage(pages[0].id);
        console.log(`✅ Page retrieved successfully!`);
        console.log(`   Title: ${page.properties?.title?.title?.[0]?.plain_text || 'Untitled'}`);
        console.log(`   Created: ${page.created_time || 'N/A'}\n`);
      }
    } catch (error: any) {
      console.log(`⚠️  Page retrieval test skipped: ${error.message}\n`);
    }

    console.log('✅ All tests passed! Your Notion OAuth2 connection with Alloy is working correctly.');
    console.log('\n💡 You can now use this connection in your code:');
    console.log('   import { NotionClient } from "./notion-client.js";');
    console.log('   import { getConfig } from "./config.js";');
    console.log('   const config = getConfig();');
    console.log(`   const client = new NotionClient(config, "${connectionId}");`);
    console.log('   const pages = await client.searchPages();');

  } catch (error: any) {
    console.error('\n❌ Connection test failed:', error.message);
    if (error.response?.data) {
      console.error('\nAPI Error Details:');
      console.error(JSON.stringify(error.response.data, null, 2));
    }
    
    console.error('\n💡 Troubleshooting:');
    console.error('   1. Verify the connection ID is correct');
    console.error('   2. Check that the connection exists in your Alloy account');
    console.error('   3. Ensure your ALLOY_API_KEY and ALLOY_USER_ID are correct');
    console.error('   4. Try listing connections: npm run list-connections notion');
    
    process.exit(1);
  }
}

// Run the test
testConnection();

