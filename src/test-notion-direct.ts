import { NotionDirectClient } from './notion-direct-client.js';
import { getConfig } from './config.js';

/**
 * Test script to verify Notion internal token connection
 * Usage: npm run test-notion-direct
 */
async function testNotionDirect() {
  try {
    console.log('🔗 Testing Direct Notion API Connection\n');
    
    const config = getConfig();
    
    if (!config.notionInternalToken) {
      console.error('❌ NOTION_INTERNAL_TOKEN is not set in .env file');
      console.log('\n💡 Add this to your .env file:');
      console.log('   NOTION_INTERNAL_TOKEN=your_notion_token_here');
      console.log('   (Get your token from: https://www.notion.so/my-integrations)');
      process.exit(1);
    }

    console.log('✅ Notion internal token found');
    console.log(`   Token: ${config.notionInternalToken.substring(0, 20)}...\n`);

    // Create direct Notion client
    const notionClient = new NotionDirectClient();

    // Test 1: Get bot user info
    console.log('🧪 Test 1: Getting bot user info...');
    try {
      const botUser = await notionClient.getBotUser();
      console.log('✅ Bot user retrieved successfully!');
      console.log(`   Name: ${botUser.name || 'N/A'}`);
      console.log(`   Type: ${botUser.type || 'N/A'}`);
      console.log(`   Bot ID: ${botUser.id || 'N/A'}\n`);
    } catch (error: any) {
      console.error('❌ Failed to get bot user:', error.message);
      if (error.response?.status === 401) {
        console.error('   ⚠️  Token is invalid or expired');
      }
      throw error;
    }

    // Test 2: Search for pages
    console.log('🧪 Test 2: Searching for pages...');
    try {
      const pages = await notionClient.searchPages(undefined, { value: 'page', property: 'object' });
      console.log(`✅ Search successful! Found ${pages.length} page(s)\n`);
      
      if (pages.length > 0) {
        console.log('📄 Sample pages:');
        pages.slice(0, 3).forEach((page: any, index: number) => {
          const title = page.properties?.title?.title?.[0]?.plain_text || 
                       page.properties?.Name?.title?.[0]?.plain_text ||
                       'Untitled';
          console.log(`   ${index + 1}. ${title} (${page.id})`);
        });
        console.log();
      }
    } catch (error: any) {
      console.error('❌ Failed to search pages:', error.message);
      throw error;
    }

    console.log('✅ All tests passed! Your Notion internal token is working correctly.');
    console.log('\n💡 You can now use NotionDirectClient in your code:');
    console.log('   import { NotionDirectClient } from "./notion-direct-client.js";');
    console.log('   const client = new NotionDirectClient();');
    console.log('   const pages = await client.searchPages();');

  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response?.data) {
      console.error('\nAPI Error Details:');
      console.error(JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

// Run the test
testNotionDirect();

