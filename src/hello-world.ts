import { NotionClient } from './notion-client.js';
import { getConfig } from './config.js';
import { createSimplePage } from './notion-helpers.js';

/**
 * Simple script to write "Hello World" to Notion
 * Usage: node --loader ts-node/esm src/hello-world.ts
 * 
 * Now using the easier helper function!
 */
async function writeHelloWorld() {
  try {
    console.log('🚀 Writing "Hello World" to Notion...\n');

    // Setup
    const config = getConfig();
    const connectionId = process.env.CONNECTION_ID;

    if (!connectionId) {
      console.error('❌ CONNECTION_ID not set in .env file');
      console.log('\n💡 To fix this:');
      console.log('   1. Run: npm run connect-notion');
      console.log('   2. Or: npm run list-connections notion');
      console.log('   3. Add CONNECTION_ID to your .env file');
      process.exit(1);
    }

    const notionClient = new NotionClient(config, connectionId);

    // Create a page with "Hello World" as the title - MUCH SIMPLER NOW!
    console.log('Creating page with "Hello World"...');
    
    const newPage = await createSimplePage(notionClient, 'Hello World');

    // Extract page ID and URL
    const pageId = newPage.id || newPage.data?.id || newPage.responseData?.id;
    const pageUrl = newPage.url || newPage.data?.url || newPage.responseData?.url || newPage.public_url;

    console.log('\n✅ Success! "Hello World" written to Notion');
    console.log(`   Page ID: ${pageId || 'N/A'}`);
    console.log(`   Page URL: ${pageUrl || 'N/A'}`);
    
    if (pageUrl) {
      console.log(`\n🔗 View your page: ${pageUrl}`);
    }

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    if (error.response?.data) {
      console.error('\nAPI Error Details:');
      console.error(JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

writeHelloWorld();

