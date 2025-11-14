import { NotionClient } from './notion-client.js';
import { getConfig } from './config.js';

/**
 * Main demo: Read, Write, and Update Notion pages
 */
async function runDemo() {
  try {
    console.log('🚀 Alloy Connectivity API Demo\n');

    const config = getConfig();
    const connectionId = process.env.CONNECTION_ID;

    if (!connectionId) {
      console.error('❌ CONNECTION_ID not set in .env file');
      console.log('💡 Run: npm run connect-notion');
      process.exit(1);
    }

    const notionClient = new NotionClient(config, connectionId);

    // Read: Search for pages
    console.log('📖 Reading pages...');
    const pages = await notionClient.searchPages(
      undefined,
      { value: 'page', property: 'object' }
    );
    console.log(`✅ Found ${pages.length} page(s)\n`);

    // Write: Create a new page
    console.log('✍️  Creating a new page...');
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

    const pageId = newPage.id || newPage.data?.id;
    console.log(`✅ Page created: ${pageId}\n`);

    // Update: Modify the page
    if (pageId) {
      console.log('🔄 Updating the page...');
      await notionClient.updatePage(pageId, {
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
      console.log(`✅ Page updated: ${pageId}\n`);
    }

    console.log('✅ Demo completed successfully!');

  } catch (error: any) {
    console.error('❌ Demo failed:', error.message);
    if (error.response?.data) {
      console.error('API Error:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

runDemo();
