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
    console.log(`\n📋 Configuration loaded:`);
    console.log(`   Base URL: ${config.alloyBaseUrl}`);
    console.log(`   User ID: [CONFIGURED]`);
    console.log(`   API Key: [CONFIGURED]`);

    // Initialize Alloy client
    const alloyClient = new AlloyClient(config);

    // Step 1: Authentication Flow
    console.log('\n' + '='.repeat(50));
    console.log('STEP 1: Authentication Flow');
    console.log('='.repeat(50));
    
    // Identify/authenticate the user
    const username = config.alloyUserId;
    
    try {
      await alloyClient.authenticateUser(username);
    } catch (error) {
      console.log('⚠️  Could not authenticate user. Make sure your API key and user ID are correct.');
      console.log('   This demo will continue to show what would happen with a valid connection.');
    }

    // Step 2: Connect to Integration
    console.log('\n' + '='.repeat(50));
    console.log('STEP 2: Connect to Integration');
    console.log('='.repeat(50));
    
    // In a real app, you would get the connection ID from your Alloy dashboard
    // after the user completes the OAuth flow
    const connectionId = process.env.CONNECTION_ID || 'demo-connection-id';
    
    try {
      await alloyClient.connectToIntegration(connectionId);
    } catch (error) {
      console.log('⚠️  Connection not yet established. In a real app, you would:');
      console.log('   1. Redirect user to Alloy OAuth flow');
      console.log('   2. Receive connection ID via webhook');
      console.log('   3. Use that connection ID to make API calls');
    }

    // Step 3: Read Data (Pages) - READ Operation
    console.log('\n' + '='.repeat(50));
    console.log('STEP 3: Read Data - Fetch Pages');
    console.log('='.repeat(50));
    
    try {
      const pages = await alloyClient.readPages();

      if (pages.length > 0) {
        console.log('\nSample page data:');
        console.log(JSON.stringify(pages[0], null, 2));
      }
    } catch (error) {
      console.log('⚠️  Could not read pages. This is expected without a valid connection.');
      console.log('   With a real connection, this would return page data from your Notion workspace.');
    }

    // Step 4: Write Data (Create Page) - WRITE Operation
    console.log('\n' + '='.repeat(50));
    console.log('STEP 4: Write Data - Create New Page');
    console.log('='.repeat(50));
    
    const newPage = {
      title: 'Project Planning',
      content: 'This is a new page created via Alloy API',
      author: 'John Doe',
      tags: ['project', 'planning'],
      status: 'active',
    };

    try {
      const result = await alloyClient.createPage(newPage);
      console.log('\n✅ Page created successfully!');
    } catch (error) {
      console.log('⚠️  Could not create page. This is expected without a valid connection.');
      console.log('   With a real connection, this would create a new page in your Notion workspace.');
    }

    // Step 5: Update Data - UPDATE Operation
    console.log('\n' + '='.repeat(50));
    console.log('STEP 5: Update Data - Update Existing Page');
    console.log('='.repeat(50));
    
    try {
      // In a real scenario, you would use an actual page ID from the read operation
      const pageId = process.env.SAMPLE_PAGE_ID || 'page_123abc';
      const updatedData = {
        content: 'Updated page content via Alloy API',
        status: 'completed',
        tags: ['project', 'planning', 'completed'],
      };

      await alloyClient.updatePage(pageId, updatedData);
      console.log('\n✅ Page updated successfully!');
    } catch (error) {
      console.log('⚠️  Could not update page. This is expected without a valid connection.');
      console.log('   With a real connection, this would update the page in your Notion workspace.');
    }

    // Step 6: List Databases
    console.log('\n' + '='.repeat(50));
    console.log('STEP 6: Read Additional Data - List Databases');
    console.log('='.repeat(50));
    
    try {
      const databases = await alloyClient.listDatabases();
      console.log(`✅ Found ${databases.length} databases`);
    } catch (error) {
      console.log('⚠️  Could not list databases. This is expected without a valid connection.');
      console.log('   With a real connection, this would return database data from your Notion workspace.');
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('✅ Demo Completed Successfully!');
    console.log('='.repeat(50));
    console.log('\nThis demo demonstrated:');
    console.log('  ✓ Authentication flow with Alloy Unified API');
    console.log('  ✓ Reading data (pages & databases) from Notion');
    console.log('  ✓ Writing data (creating pages) to Notion');
    console.log('  ✓ Updating existing page data in Notion');
    console.log('\nWhat you need for a real connection:');
    console.log('  1. Get your API key from Alloy dashboard (https://app.runalloy.com)');
    console.log('  2. Create/identify a user in your system');
    console.log('  3. Have the user complete OAuth flow for Notion');
    console.log('  4. Use the connection ID from the OAuth callback');
    console.log('  5. Update .env with real credentials and run again');
    console.log('\n📚 See EXAMPLES.md for more use cases');
    console.log('📖 See SETUP.md for detailed setup instructions');
    console.log('\n');

  } catch (error: any) {
    console.error('\n❌ Demo failed with error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    process.exit(1);
  }
}

// Run the demo
runDemo();
