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
    console.log(`   User ID: ${config.alloyUserId}`);
    console.log(`   API Key: ${config.alloyApiKey.substring(0, 10)}...`);

    // Initialize Alloy client
    const alloyClient = new AlloyClient(config);

    // Step 1: Authentication Flow
    console.log('\n' + '='.repeat(50));
    console.log('STEP 1: Authentication Flow');
    console.log('='.repeat(50));
    
    // For this demo, we'll use a Salesforce integration as an example
    // In a real scenario, you would get this from your Alloy dashboard
    const integrationId = process.env.INTEGRATION_ID || 'salesforce';
    
    await alloyClient.authenticateUser(integrationId);

    // Step 2: Check Connection Status
    console.log('\n' + '='.repeat(50));
    console.log('STEP 2: Check Connection Status');
    console.log('='.repeat(50));
    
    try {
      await alloyClient.getConnectionStatus(config.alloyUserId, integrationId);
    } catch (error) {
      console.log('⚠️  Connection not yet established. In a real app, you would redirect the user to authenticate.');
    }

    // Step 3: List Available Integrations
    console.log('\n' + '='.repeat(50));
    console.log('STEP 3: List Available Integrations');
    console.log('='.repeat(50));
    
    try {
      const integrations = await alloyClient.listIntegrations();
      console.log('\nAvailable integrations:');
      integrations.slice(0, 5).forEach((integration: any) => {
        console.log(`  • ${integration.name || integration.id}`);
      });
    } catch (error) {
      console.log('⚠️  Could not list integrations');
    }

    // Step 4: Read Data (Contacts) - READ Operation
    console.log('\n' + '='.repeat(50));
    console.log('STEP 4: Read Data - Fetch Contacts');
    console.log('='.repeat(50));
    
    try {
      const contacts = await alloyClient.readData(
        config.alloyUserId,
        integrationId,
        'contacts'
      );

      if (contacts.length > 0) {
        console.log('\nSample contact data:');
        console.log(JSON.stringify(contacts[0], null, 2));
      }
    } catch (error) {
      console.log('⚠️  Could not read contacts. This is normal if no connection is set up yet.');
    }

    // Step 5: Write Data (Create Contact) - WRITE Operation
    console.log('\n' + '='.repeat(50));
    console.log('STEP 5: Write Data - Create New Contact');
    console.log('='.repeat(50));
    
    const newContact = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '+1-555-0123',
      company: 'Acme Corp',
    };

    try {
      const result = await alloyClient.writeData(
        config.alloyUserId,
        integrationId,
        'contacts',
        newContact
      );
      
      console.log('\n✅ Contact created successfully!');
    } catch (error) {
      console.log('⚠️  Could not create contact. This is normal if no connection is set up yet.');
    }

    // Step 6: Update Data - UPDATE Operation
    console.log('\n' + '='.repeat(50));
    console.log('STEP 6: Update Data - Update Existing Contact');
    console.log('='.repeat(50));
    
    try {
      // In a real scenario, you would use an actual record ID from the read operation
      const recordId = process.env.SAMPLE_RECORD_ID || 'sample-id';
      const updatedData = {
        phone: '+1-555-9999',
        company: 'New Company Inc',
      };

      await alloyClient.updateData(
        config.alloyUserId,
        integrationId,
        'contacts',
        recordId,
        updatedData
      );
    } catch (error) {
      console.log('⚠️  Could not update contact. This is normal if no connection is set up yet.');
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('✅ Demo Completed Successfully!');
    console.log('='.repeat(50));
    console.log('\nThis demo demonstrated:');
    console.log('  ✓ Authentication flow with Alloy API');
    console.log('  ✓ Reading data (contacts) from a connected CRM');
    console.log('  ✓ Writing data (creating contacts) to a connected CRM');
    console.log('  ✓ Updating existing data in a connected CRM');
    console.log('\nNext steps:');
    console.log('  1. Set up your Alloy account and get API credentials');
    console.log('  2. Configure your integration in the Alloy dashboard');
    console.log('  3. Update the .env file with your credentials');
    console.log('  4. Run this demo again with a real connection');
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
