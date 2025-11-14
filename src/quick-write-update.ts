import { NotionClient } from './notion-client.js';
import { getConfig } from './config.js';

/**
 * Quick Write & Update Example
 * Usage: node --loader ts-node/esm src/quick-write-update.ts
 */
async function writeAndUpdate() {
  try {
    console.log('🚀 Write & Update Example\n');
    console.log('='.repeat(50));

    const config = getConfig();
    const notionClient = new NotionClient(config, process.env.CONNECTION_ID!);

    // ============================================================
    // WRITE: Create a new page
    // ============================================================
    console.log('\n✍️  WRITE: Creating a new page...');
    
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

    const pageId = newPage.id || newPage.data?.id || newPage.responseData?.id;
    const pageUrl = newPage.url || newPage.data?.url || newPage.responseData?.url;
    
    console.log('✅ Page created successfully!');
    console.log(`   Page ID: ${pageId}`);
    console.log(`   Page URL: ${pageUrl || 'N/A'}`);

    if (!pageId) {
      console.log('\n⚠️  Could not extract page ID from response:');
      console.log(JSON.stringify(newPage, null, 2));
      return;
    }

    // ============================================================
    // UPDATE: Update the page we just created
    // ============================================================
    console.log('\n🔄 UPDATE: Updating the page...');
    
    const updatedTitle = `Updated: ${pageTitle}`;
    
    const updatedPage = await notionClient.updatePage(pageId, {
      properties: {
        title: {
          type: 'title',
          title: [
            {
              type: 'text',
              text: {
                content: updatedTitle
              }
            }
          ]
        }
      }
    });

    console.log('✅ Page updated successfully!');
    console.log(`   Updated Page ID: ${updatedPage.id || pageId}`);
    console.log(`   Updated Page URL: ${updatedPage.url || pageUrl || 'N/A'}`);

    // ============================================================
    // Summary
    // ============================================================
    console.log('\n' + '='.repeat(50));
    console.log('✅ Success!');
    console.log('='.repeat(50));
    console.log('\n📋 What happened:');
    console.log('   1. Created a new page in your Notion workspace');
    console.log('   2. Updated the page title');
    console.log(`\n🔗 Check your Notion workspace to see the page!`);
    if (pageUrl) {
      console.log(`   URL: ${pageUrl}`);
    }
    console.log();

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    if (error.response?.data) {
      console.error('\nAPI Error Details:');
      console.error(JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

writeAndUpdate();

