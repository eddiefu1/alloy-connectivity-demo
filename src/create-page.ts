import { NotionClient } from './notion-client.js';
import { getConfig } from './config.js';

/**
 * Create a Notion page with a specific title
 * Usage: npm run create-page [title]
 * Example: npm run create-page "My New Page"
 */
async function createPage() {
  try {
    // Get title from command line argument or use default
    const pageTitle = process.argv[2] || 'New Page';

    console.log('🚀 Creating Notion page...\n');

    const config = getConfig();
    const connectionId = process.env.CONNECTION_ID;

    if (!connectionId) {
      console.error('❌ CONNECTION_ID not set in .env file');
      console.log('   Run: npm run connect-notion to create a connection');
      process.exit(1);
    }

    const notionClient = new NotionClient(config, connectionId);

    // Create the page
    console.log(`✍️  Creating page: "${pageTitle}"...`);
    
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
                content: pageTitle,
              },
            },
          ],
        },
      },
    });

    const pageId = newPage.id || newPage.data?.id || newPage.responseData?.id;
    const pageUrl = newPage.url || newPage.data?.url || newPage.responseData?.url || newPage.public_url;

    console.log('\n✅ Page created successfully!');
    console.log(`   Page ID: ${pageId || 'N/A'}`);
    console.log(`   URL: ${pageUrl || 'N/A'}`);
    
    if (pageUrl) {
      console.log(`\n🔗 Open in browser: ${pageUrl}`);
    }

  } catch (error: any) {
    console.error('\n❌ Error creating page:', error.message);
    if (error.response?.data) {
      console.error('API Error:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

createPage();

