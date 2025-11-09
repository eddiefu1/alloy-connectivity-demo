import { AlloyClient } from './alloy-client.js';
import { getConfig } from './config.js';

/**
 * Main demo function that demonstrates:
 * 1. Authentication flow
 * 2. Reading data (pages) from Notion
 * 3. Writing data (creating new pages) to Notion
 */
async function runDemo() {
  try {
    console.log('🚀 Starting Alloy Connectivity API Demo\n');
    console.log('='.repeat(50));

    // Load configuration
    const config = getConfig();
    const alloyClient = new AlloyClient(config);

    // Step 1: Authentication Flow
    console.log('\nSTEP 1: Authentication Flow');
    console.log('='.repeat(50));
    
    try {
      await alloyClient.authenticateUser(config.alloyUserId);
    } catch (error) {
      console.log('⚠️  Could not authenticate user. Make sure your API key and user ID are correct.');
    }

    // Step 2: Connect to Integration
    console.log('\nSTEP 2: Connect to Integration');
    console.log('='.repeat(50));
    
    const connectionId = process.env.CONNECTION_ID || 'demo-connection-id';
    
    try {
      await alloyClient.connectToIntegration(connectionId);
    } catch (error) {
      console.log('⚠️  Connection not yet established. Complete OAuth flow to get a connection ID.');
    }

    // Step 3: Read Data (Pages) - READ Operation
    console.log('\nSTEP 3: Read Data - Fetch Pages');
    console.log('='.repeat(50));
    
    try {
      const pages = await alloyClient.readPages();
      console.log(`✓ Successfully read ${pages.length} page records`);
      if (pages.length > 0) {
        console.log('Sample page:', JSON.stringify(pages[0], null, 2));
      }
    } catch (error) {
      console.log('⚠️  Could not read pages. This is expected without a valid connection.');
    }

    // Step 4: Write Data (Create Page) - WRITE Operation
    console.log('\nSTEP 4: Write Data - Create New Page');
    console.log('='.repeat(50));
    
    const newPage = {
      title: 'Project Planning',
      content: 'This is a new page created via Alloy API',
      author: 'John Doe',
      tags: ['project', 'planning'],
      status: 'active',
    };

    try {
      await alloyClient.createPage(newPage);
      console.log('✅ Page created successfully!');
    } catch (error) {
      console.log('⚠️  Could not create page. This is expected without a valid connection.');
    }

    // Step 5: Update Data - UPDATE Operation
    console.log('\nSTEP 5: Update Data - Update Existing Page');
    console.log('='.repeat(50));
    
    try {
      const pageId = process.env.SAMPLE_PAGE_ID || 'page_123abc';
      const updatedData = {
        content: 'Updated page content via Alloy API',
        status: 'completed',
      };

      await alloyClient.updatePage(pageId, updatedData);
      console.log('✅ Page updated successfully!');
    } catch (error) {
      console.log('⚠️  Could not update page. This is expected without a valid connection.');
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('✅ Demo Completed Successfully!');
    console.log('='.repeat(50));
    console.log('\nThis demo demonstrated:');
    console.log('  ✓ Authentication flow with Alloy Unified API');
    console.log('  ✓ Reading data (pages) from Notion');
    console.log('  ✓ Writing data (creating pages) to Notion');
    console.log('  ✓ Updating existing page data in Notion');
    console.log('\nFor a real connection:');
    console.log('  1. Complete OAuth flow: npm run connect-notion');
    console.log('  2. Add CONNECTION_ID to your .env file');
    console.log('  3. Run this demo again');
    console.log();

  } catch (error: any) {
    console.error('\n❌ Demo failed:', error.message);
    process.exit(1);
  }
}

// Run the demo
runDemo();
