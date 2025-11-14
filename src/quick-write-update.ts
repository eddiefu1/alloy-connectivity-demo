import { NotionClient } from './notion-client.js';
import { getConfig } from './config.js';

/**
 * Quick Write & Update Example
 * Usage: npm run write-update
 */
async function writeAndUpdate() {
  try {
    console.log('🚀 Write & Update Example\n');

    const config = getConfig();
    const notionClient = new NotionClient(config, process.env.CONNECTION_ID!);

    // Write: Create a new page
    console.log('✍️  Creating a new page...');
    const pageTitle = `My Page - ${new Date().toLocaleString()}`;
    
    const newPage = await notionClient.createPage({
      parent: {
        type: 'workspace',
        workspace: true
      },
      properties: {
        title: {
          type: 'title',
          title: [
            {
              type: 'text',
              text: {
                content: pageTitle
              }
            }
          ]
        }
      }
    });

    const pageId = newPage.id || newPage.data?.id;
    console.log(`✅ Page created: ${pageId}`);

    if (!pageId) {
      console.error('❌ Could not extract page ID from response');
      process.exit(1);
    }

    // Update: Update the page
    console.log('\n🔄 Updating the page...');
    await notionClient.updatePage(pageId, {
      properties: {
        title: {
          type: 'title',
          title: [
            {
              type: 'text',
              text: {
                content: `Updated: ${pageTitle}`
              }
            }
          ]
        }
      }
    });

    console.log(`✅ Page updated: ${pageId}`);
    console.log('\n✅ Success!');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.response?.data) {
      console.error('API Error:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

writeAndUpdate();
