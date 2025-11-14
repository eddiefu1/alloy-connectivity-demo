import { NotionClient } from './notion-client.js';
import { getConfig } from './config.js';

/**
 * Read, Write, and Update example
 * Usage: npm run notion-example
 */
async function readWriteUpdateExample() {
  try {
    console.log('🚀 Notion Read/Write/Update Example\n');

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
    const timestamp = new Date().toISOString();
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
                content: `Test Page - ${timestamp}`,
              },
            },
          ],
        },
      },
    });

    const pageId = newPage.id || newPage.data?.id;
    console.log(`✅ Page created: ${pageId}\n`);

    // Update: Update the page
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
                  content: `Updated Test Page - ${timestamp}`,
                },
              },
            ],
          },
        },
      });
      console.log(`✅ Page updated: ${pageId}\n`);
    }

    // Read: Get specific page
    if (pageId) {
      console.log('📖 Reading specific page...');
      const page = await notionClient.getPage(pageId);
      const title = page.properties?.title?.title?.[0]?.plain_text || 'Untitled';
      console.log(`✅ Page retrieved: "${title}"\n`);
    }

    console.log('✅ Example completed successfully!');

  } catch (error: any) {
    console.error('❌ Example failed:', error.message);
    if (error.response?.data) {
      console.error('API Error:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

readWriteUpdateExample();
