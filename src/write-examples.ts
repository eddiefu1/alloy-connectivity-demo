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
 * Examples showing what you can write to Notion beyond "Hello World"
 * Usage: node --loader ts-node/esm src/write-examples.ts
 */
async function writeExamples() {
  try {
    console.log('📝 What Can You Write to Notion?\n');
    console.log('='.repeat(70));

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

    // ============================================================
    // EXAMPLE 1: Different Page Titles
    // ============================================================
    console.log('\n📄 Example 1: Different Types of Page Titles');
    console.log('-'.repeat(70));
    
    const titles = [
      'My Daily Journal',
      'Project Ideas 💡',
      'Meeting Notes - 2024',
      '📚 Reading List',
      '✅ Task: Complete project',
      '🎯 Goals for Q1',
    ];

    console.log('Creating pages with different titles...\n');
    for (const title of titles.slice(0, 2)) { // Only create 2 to avoid spam
      const page = await createSimplePage(notionClient, title);
      const pageId = page.id || page.data?.id;
      console.log(`  ✅ Created: "${title}" (ID: ${pageId?.substring(0, 20)}...)`);
    }
    console.log('\n💡 You can create pages with any title you want!');

    // ============================================================
    // EXAMPLE 2: Create and Update Pages
    // ============================================================
    console.log('\n\n🔄 Example 2: Create and Update Pages');
    console.log('-'.repeat(70));
    console.log('Creating a page, then updating its title...\n');
    
    const page1 = await createSimplePage(notionClient, 'Original Title');
    const page1Id = page1.id || page1.data?.id || page1.responseData?.id;
    console.log(`  ✅ Created page: "${'Original Title'}"`);
    
    if (page1Id) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait a moment
      const updated = await updatePageTitle(notionClient, page1Id, 'Updated Title - Changed!');
      console.log(`  ✅ Updated to: "${'Updated Title - Changed!'}"`);
    }

    // ============================================================
    // EXAMPLE 3: Pages with Rich Content (using NotionProps)
    // ============================================================
    console.log('\n\n🎨 Example 3: Pages with Rich Content');
    console.log('-'.repeat(70));
    console.log('Creating pages using NotionProps helper...\n');
    
    const styledPage = await notionClient.createPage({
      parent: { type: 'workspace', workspace: true },
      properties: {
        title: NotionProps.title('Styled Page with Helper'),
      },
    });
    console.log(`  ✅ Created styled page: ${styledPage.id || styledPage.data?.id}`);

    // ============================================================
    // EXAMPLE 4: Multiple Pages at Once
    // ============================================================
    console.log('\n\n📚 Example 4: Creating Multiple Pages');
    console.log('-'.repeat(70));
    console.log('Creating a series of related pages...\n');
    
    const topics = [
      'Chapter 1: Introduction',
      'Chapter 2: Getting Started',
      'Chapter 3: Advanced Topics',
    ];

    for (const topic of topics.slice(0, 2)) { // Only 2 to avoid spam
      const page = await createSimplePage(notionClient, topic);
      console.log(`  ✅ Created: ${topic}`);
    }
    console.log('\n💡 You can create multiple pages in a loop!');

    // ============================================================
    // EXAMPLE 5: Dynamic Content Based on Data
    // ============================================================
    console.log('\n\n💾 Example 5: Dynamic Content from Data');
    console.log('-'.repeat(70));
    console.log('Creating pages from structured data...\n');
    
    const tasks = [
      { title: 'Task: Review code', priority: 'High' },
      { title: 'Task: Write documentation', priority: 'Medium' },
      { title: 'Task: Deploy to production', priority: 'High' },
    ];

    for (const task of tasks.slice(0, 2)) { // Only 2 to avoid spam
      const page = await createSimplePage(notionClient, task.title);
      console.log(`  ✅ Created: ${task.title} (Priority: ${task.priority})`);
    }
    console.log('\n💡 You can create pages from arrays, databases, APIs, etc.!');

    // ============================================================
    // EXAMPLE 6: Timestamped Pages
    // ============================================================
    console.log('\n\n⏰ Example 6: Pages with Timestamps');
    console.log('-'.repeat(70));
    console.log('Creating pages with date/time in the title...\n');
    
    const now = new Date();
    const timestamp = now.toLocaleString();
    const datePage = await createSimplePage(
      notionClient, 
      `Daily Log - ${now.toLocaleDateString()}`
    );
    console.log(`  ✅ Created: Daily Log - ${now.toLocaleDateString()}`);
    console.log(`  📅 Timestamp: ${timestamp}`);

    // ============================================================
    // EXAMPLE 7: Formatted Titles
    // ============================================================
    console.log('\n\n✨ Example 7: Formatted Titles');
    console.log('-'.repeat(70));
    console.log('Creating pages with emojis and special formatting...\n');
    
    const formattedTitles = [
      '🚀 Project Launch',
      '📊 Analytics Report',
      '🎉 Celebration Notes',
      '⚠️ Important Notice',
      '📝 Meeting Summary',
    ];

    for (const title of formattedTitles.slice(0, 2)) { // Only 2
      const page = await createSimplePage(notionClient, title);
      console.log(`  ✅ Created: ${title}`);
    }
    console.log('\n💡 You can use emojis, special characters, and formatting!');

    // ============================================================
    // Summary
    // ============================================================
    console.log('\n' + '='.repeat(70));
    console.log('✅ Examples Complete!');
    console.log('='.repeat(70));
    console.log('\n📋 Summary: What You Can Write to Notion');
    console.log('\n1. ✅ Simple Pages');
    console.log('   - Any text title');
    console.log('   - Emojis and special characters');
    console.log('   - Formatted text');
    console.log('\n2. ✅ Dynamic Content');
    console.log('   - Pages from arrays/loops');
    console.log('   - Pages from API data');
    console.log('   - Pages from user input');
    console.log('   - Pages with timestamps');
    console.log('\n3. ✅ Updates');
    console.log('   - Change page titles');
    console.log('   - Update page properties');
    console.log('   - Modify existing content');
    console.log('\n4. ✅ Batch Operations');
    console.log('   - Create multiple pages at once');
    console.log('   - Process lists of items');
    console.log('   - Generate pages from templates');
    console.log('\n5. ✅ Real-World Use Cases');
    console.log('   - Daily journals/logs');
    console.log('   - Task lists');
    console.log('   - Meeting notes');
    console.log('   - Project documentation');
    console.log('   - Form submissions');
    console.log('   - Data sync from other systems');
    console.log('\n💡 Check your Notion workspace to see all the created pages!');
    console.log('\n💡 To see more examples, check:');
    console.log('   - src/easy-example.ts');
    console.log('   - src/notion-read-write-update.ts');
    console.log('   - EXAMPLES.md');
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

writeExamples();

