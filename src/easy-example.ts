import { NotionClient } from './notion-client.js';
import { getConfig } from './config.js';
import {
  createSimplePage,
  updatePageTitle,
  createPageSimple,
  updatePageSimple,
  NotionProps,
} from './notion-helpers.js';

/**
 * Examples showing the EASIER way to write and update Notion pages
 * Usage: node --loader ts-node/esm src/easy-example.ts
 */
async function easyExamples() {
  try {
    console.log('🚀 Easy Notion Write & Update Examples\n');
    console.log('='.repeat(60));

    const config = getConfig();
    const connectionId = process.env.CONNECTION_ID;

    if (!connectionId) {
      console.error('❌ CONNECTION_ID not set in .env file');
      process.exit(1);
    }

    const notionClient = new NotionClient(config, connectionId);

    // ============================================================
    // EXAMPLE 1: Create a simple page (EASIEST!)
    // ============================================================
    console.log('\n📝 Example 1: Create Simple Page');
    console.log('-'.repeat(60));
    console.log('Code: createSimplePage(notionClient, "My Page Title")');
    
    const page1 = await createSimplePage(notionClient, 'My Simple Page');
    console.log(`✅ Created page: ${page1.id || page1.data?.id}`);
    console.log(`   URL: ${page1.url || page1.data?.url || 'N/A'}`);

    // ============================================================
    // EXAMPLE 2: Update page title (EASY!)
    // ============================================================
    console.log('\n🔄 Example 2: Update Page Title');
    console.log('-'.repeat(60));
    console.log('Code: updatePageTitle(notionClient, pageId, "New Title")');
    
    const pageId = page1.id || page1.data?.id || page1.responseData?.id;
    if (pageId) {
      const updated = await updatePageTitle(notionClient, pageId, 'Updated Title!');
      console.log(`✅ Updated page: ${updated.id || pageId}`);
    }

    // ============================================================
    // EXAMPLE 3: Create page with properties (Database only!)
    // ============================================================
    console.log('\n📋 Example 3: Create Page with Properties');
    console.log('-'.repeat(60));
    console.log('⚠️  Note: Custom properties only work in databases!');
    console.log('   For workspace pages, only "title" is allowed.');
    console.log('   This example creates a workspace page with just title.');
    console.log('Code: createPageSimple(notionClient, { title: "..." })');
    
    // For workspace pages, only title is allowed
    const page2 = await createPageSimple(notionClient, {
      title: 'Task Page',
      // Note: description, priority, completed would be ignored for workspace pages
      // To use these, you'd need to create the page in a database
    });
    console.log(`✅ Created page: ${page2.id || page2.data?.id}`);
    console.log(`   (Only title property used - workspace pages don't support custom properties)`);

    // ============================================================
    // EXAMPLE 4: Update page title (EASY!)
    // ============================================================
    console.log('\n🔄 Example 4: Update Page Title');
    console.log('-'.repeat(60));
    console.log('Code: updatePageTitle(notionClient, pageId, "New Title")');
    
    const page2Id = page2.id || page2.data?.id || page2.responseData?.id;
    if (page2Id) {
      const updated2 = await updatePageTitle(notionClient, page2Id, 'Updated Task Page!');
      console.log(`✅ Updated title: ${updated2.id || page2Id}`);
    }

    // ============================================================
    // EXAMPLE 5: Using NotionProps helper (CLEAN!)
    // ============================================================
    console.log('\n🎨 Example 5: Using NotionProps Helper');
    console.log('-'.repeat(60));
    console.log('Code: NotionProps.title("...")');
    console.log('⚠️  Note: Only title works for workspace pages');
    
    const page3 = await notionClient.createPage({
      parent: { type: 'workspace', workspace: true },
      properties: {
        title: NotionProps.title('Styled Page'),
        // Note: Other properties (status, priority, etc.) only work in databases
      },
    });
    console.log(`✅ Created styled page: ${page3.id || page3.data?.id}`);

    // ============================================================
    // Summary
    // ============================================================
    console.log('\n' + '='.repeat(60));
    console.log('✅ All Examples Completed!');
    console.log('='.repeat(60));
    console.log('\n📚 Summary of Easy Methods:');
    console.log('   1. createSimplePage() - Create page with just a title');
    console.log('   2. updatePageTitle() - Update page title easily');
    console.log('   3. createPageSimple() - Create with properties (database only for custom props)');
    console.log('   4. updatePageSimple() - Update properties (works for any page)');
    console.log('   5. NotionProps.* - Helper functions for property types');
    console.log('\n💡 Important: Workspace pages only support "title" property.');
    console.log('   To use custom properties (status, priority, etc.), create pages in a database.');
    console.log('\n💡 Check your Notion workspace to see the created pages!');
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

easyExamples();

