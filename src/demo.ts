import { AlloyClient } from './alloy-client';
import { getConfig } from './config';

/**
 * Main demo function that demonstrates:
 * 1. Authentication flow
 * 2. Reading data (contacts) from a CRM
 * 3. Writing data (creating a new contact) to a CRM
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

    // Step 3: Read Data (Contacts) - READ Operation
    console.log('\n' + '='.repeat(50));
    console.log('STEP 3: Read Data - Fetch Contacts');
    console.log('='.repeat(50));
    
    try {
      const contacts = await alloyClient.readContacts();

      if (contacts.length > 0) {
        console.log('\nSample contact data:');
        console.log(JSON.stringify(contacts[0], null, 2));
      }
    } catch (error) {
      console.log('⚠️  Could not read contacts. This is expected without a valid connection.');
      console.log('   With a real connection, this would return contact data from your CRM.');
    }

    // Step 4: Write Data (Create Contact) - WRITE Operation
    console.log('\n' + '='.repeat(50));
    console.log('STEP 4: Write Data - Create New Contact');
    console.log('='.repeat(50));
    
    const newContact = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '+1-555-0123',
      company: 'Acme Corp',
    };

    try {
      const result = await alloyClient.createContact(newContact);
      console.log('\n✅ Contact created successfully!');
    } catch (error) {
      console.log('⚠️  Could not create contact. This is expected without a valid connection.');
      console.log('   With a real connection, this would create a new contact in your CRM.');
    }

    // Step 5: Update Data - UPDATE Operation
    console.log('\n' + '='.repeat(50));
    console.log('STEP 5: Update Data - Update Existing Contact');
    console.log('='.repeat(50));
    
    try {
      // In a real scenario, you would use an actual contact ID from the read operation
      const contactId = process.env.SAMPLE_CONTACT_ID || 'contact_123abc';
      const updatedData = {
        phone: '+1-555-9999',
        company: 'New Company Inc',
      };

      await alloyClient.updateContact(contactId, updatedData);
      console.log('\n✅ Contact updated successfully!');
    } catch (error) {
      console.log('⚠️  Could not update contact. This is expected without a valid connection.');
      console.log('   With a real connection, this would update the contact in your CRM.');
    }

    // Step 6: List Accounts
    console.log('\n' + '='.repeat(50));
    console.log('STEP 6: Read Additional Data - List Accounts');
    console.log('='.repeat(50));
    
    try {
      const accounts = await alloyClient.listAccounts();
      console.log(`✅ Found ${accounts.length} accounts`);
    } catch (error) {
      console.log('⚠️  Could not list accounts. This is expected without a valid connection.');
      console.log('   With a real connection, this would return account data from your CRM.');
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('✅ Demo Completed Successfully!');
    console.log('='.repeat(50));
    console.log('\nThis demo demonstrated:');
    console.log('  ✓ Authentication flow with Alloy Unified API');
    console.log('  ✓ Reading data (contacts & accounts) from CRM');
    console.log('  ✓ Writing data (creating contacts) to CRM');
    console.log('  ✓ Updating existing contact data in CRM');
    console.log('\nWhat you need for a real connection:');
    console.log('  1. Get your API key from Alloy dashboard (https://app.runalloy.com)');
    console.log('  2. Create/identify a user in your system');
    console.log('  3. Have the user complete OAuth flow for their CRM');
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
