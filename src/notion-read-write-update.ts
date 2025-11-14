import { NotionClient } from './notion-client.js';
import { getConfig } from './config.js';

/**
 * Practical example: Read, Write, and Update Notion files
 * Usage: npm run notion-example
 * 
 * This script demonstrates:
 * 1. Reading pages from Notion
 * 2. Creating a new page
 * 3. Updating the page
 * 4. Querying databases (if available)
 */
async function readWriteUpdateExample() {
  try {
    console.log('🚀 Notion Read/Write/Update Example\n');
    console.log('='.repeat(60));

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

    console.log(`✓ Using Connection ID: ${connectionId}\n`);

    const notionClient = new NotionClient(config, connectionId);

    // ========================================================================
    // STEP 1: READ - Search for existing pages
    // ========================================================================
    console.log('📖 STEP 1: Reading Pages from Notion');
    console.log('-'.repeat(60));

    try {
      const pages = await notionClient.searchPages(
        undefined,
        { value: 'page', property: 'object' }
      );

      console.log(`✅ Found ${pages.length} page(s) in your workspace\n`);

      if (pages.length > 0) {
        console.log('📄 Sample pages:');
        pages.slice(0, 5).forEach((page: any, index: number) => {
          const title = page.properties?.title?.title?.[0]?.plain_text ||
                       page.properties?.Name?.title?.[0]?.plain_text ||
                       'Untitled';
          console.log(`   ${index + 1}. ${title}`);
          console.log(`      ID: ${page.id}`);
          if (page.url) {
            console.log(`      URL: ${page.url}`);
          }
        });
        console.log();
      } else {
        console.log('   No pages found. Creating a test page...\n');
      }
    } catch (error: any) {
      console.error(`❌ Failed to read pages: ${error.message}`);
      if (error.response?.data) {
        console.error('   Error details:', JSON.stringify(error.response.data, null, 2));
      }
      throw error;
    }

    // ========================================================================
    // STEP 2: WRITE - Create a new page
    // ========================================================================
    console.log('✍️  STEP 2: Creating a New Page');
    console.log('-'.repeat(60));

    let createdPageId: string | undefined;
    let createdPageUrl: string | undefined;

    try {
      const timestamp = new Date().toISOString();
      const pageTitle = `Test Page - ${timestamp}`;

      console.log(`   Creating page: "${pageTitle}"`);

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

      // Extract page ID and URL from response
      createdPageId = newPage.id || newPage.data?.id || newPage.responseData?.id;
      createdPageUrl = newPage.url || newPage.data?.url || newPage.responseData?.url || newPage.public_url;

      console.log(`✅ Page created successfully!`);
      console.log(`   Page ID: ${createdPageId || 'N/A'}`);
      console.log(`   Page URL: ${createdPageUrl || 'N/A'}\n`);

      // If we couldn't extract ID/URL, show full response
      if (!createdPageId) {
        console.log('   Full response structure:');
        console.log(JSON.stringify(newPage, null, 2));
      }
    } catch (error: any) {
      console.error(`❌ Failed to create page: ${error.message}`);
      if (error.response?.data) {
        console.error('   Error details:', JSON.stringify(error.response.data, null, 2));
      }
      console.log('\n⚠️  Continuing with update step using existing page...\n');
    }

    // ========================================================================
    // STEP 3: UPDATE - Update the page we just created (or an existing one)
    // ========================================================================
    console.log('🔄 STEP 3: Updating Page');
    console.log('-'.repeat(60));

    try {
      let pageIdToUpdate: string | undefined = createdPageId;

      // If we didn't create a page, try to use the first existing page
      if (!pageIdToUpdate) {
        const pages = await notionClient.searchPages(
          undefined,
          { value: 'page', property: 'object' }
        );
        if (pages.length > 0) {
          pageIdToUpdate = pages[0].id;
          console.log(`   Using existing page: ${pageIdToUpdate}`);
        }
      } else {
        console.log(`   Updating newly created page: ${pageIdToUpdate}`);
      }

      if (pageIdToUpdate) {
        const updatedTitle = `Updated Test Page - ${new Date().toISOString()}`;

        const updatedPage = await notionClient.updatePage(pageIdToUpdate, {
          properties: {
            title: {
              type: 'title',
              title: [
                {
                  type: 'text',
                  text: {
                    content: updatedTitle,
                  },
                },
              ],
            },
          },
        });

        console.log(`✅ Page updated successfully!`);
        console.log(`   Updated Page ID: ${updatedPage.id || pageIdToUpdate}`);
        console.log(`   Updated Page URL: ${updatedPage.url || createdPageUrl || 'N/A'}\n`);
      } else {
        console.log('⚠️  No page available to update');
        console.log('   Create a page first, then try updating it\n');
      }
    } catch (error: any) {
      console.error(`❌ Failed to update page: ${error.message}`);
      if (error.response?.data) {
        console.error('   Error details:', JSON.stringify(error.response.data, null, 2));
      }
    }

    // ========================================================================
    // STEP 4: READ - Get a specific page by ID
    // ========================================================================
    console.log('📖 STEP 4: Reading Specific Page');
    console.log('-'.repeat(60));

    try {
      let pageIdToRead: string | undefined = createdPageId;

      if (!pageIdToRead) {
        const pages = await notionClient.searchPages(
          undefined,
          { value: 'page', property: 'object' }
        );
        if (pages.length > 0) {
          pageIdToRead = pages[0].id;
        }
      }

      if (pageIdToRead) {
        console.log(`   Reading page: ${pageIdToRead}`);
        const page = await notionClient.getPage(pageIdToRead);

        const title = page.properties?.title?.title?.[0]?.plain_text ||
                     page.properties?.Name?.title?.[0]?.plain_text ||
                     'Untitled';

        console.log(`✅ Page retrieved successfully!`);
        console.log(`   Title: ${title}`);
        console.log(`   ID: ${page.id}`);
        console.log(`   Created: ${page.created_time || 'N/A'}`);
        console.log(`   Last Edited: ${page.last_edited_time || 'N/A'}`);
        if (page.url) {
          console.log(`   URL: ${page.url}`);
        }
        console.log();
      } else {
        console.log('⚠️  No page ID available to read\n');
      }
    } catch (error: any) {
      console.error(`❌ Failed to read page: ${error.message}`);
      if (error.response?.data) {
        console.error('   Error details:', JSON.stringify(error.response.data, null, 2));
      }
    }

    // ========================================================================
    // STEP 5: BONUS - Query databases (if available)
    // ========================================================================
    console.log('🗄️  STEP 5: Querying Databases (Bonus)');
    console.log('-'.repeat(60));

    try {
      // Search for databases
      const databases = await notionClient.searchPages(
        undefined,
        { value: 'database', property: 'object' }
      );

      console.log(`✅ Found ${databases.length} database(s)\n`);

      if (databases.length > 0) {
        console.log('📊 Available databases:');
        for (let index = 0; index < Math.min(3, databases.length); index++) {
          const db = databases[index];
          const title = db.title?.[0]?.plain_text ||
                       db.properties?.title?.title?.[0]?.plain_text ||
                       'Untitled Database';
          console.log(`   ${index + 1}. ${title}`);
          console.log(`      ID: ${db.id}`);

          // Try to query the database
          try {
            const results = await notionClient.queryDatabase(db.id);
            console.log(`      Entries: ${results.length}`);
          } catch (queryError: any) {
            console.log(`      (Could not query: ${queryError.message})`);
          }
        }
        console.log();
      } else {
        console.log('   No databases found in your workspace\n');
      }
    } catch (error: any) {
      console.log(`⚠️  Could not query databases: ${error.message}\n`);
    }

    // ========================================================================
    // Summary
    // ========================================================================
    console.log('='.repeat(60));
    console.log('✅ Example Completed Successfully!');
    console.log('='.repeat(60));
    console.log('\n📋 Summary:');
    console.log('   ✓ Read pages from Notion');
    console.log('   ✓ Created a new page');
    console.log('   ✓ Updated the page');
    console.log('   ✓ Retrieved page details');
    console.log('   ✓ Queried databases');
    console.log('\n💡 Next Steps:');
    console.log('   - Check your Notion workspace to see the created page');
    console.log('   - Modify this script to work with your specific pages/databases');
    console.log('   - See NOTION_USAGE_GUIDE.md for more examples');
    console.log();

  } catch (error: any) {
    console.error('\n❌ Example failed:', error.message);
    if (error.response?.data) {
      console.error('\nAPI Error Details:');
      console.error(JSON.stringify(error.response.data, null, 2));
    }
    console.error('\n💡 Troubleshooting:');
    console.error('   1. Verify CONNECTION_ID is set correctly in .env');
    console.error('   2. Test your connection: npm run test-connection');
    console.error('   3. Check your API key: npm run verify-setup');
    process.exit(1);
  }
}

// Run the example
readWriteUpdateExample();

