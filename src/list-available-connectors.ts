import axios from 'axios';
import { getConfig } from './config.js';

/**
 * Script to list available connectors and existing connections
 */
async function listAvailableIntegrations() {
  try {
    console.log('🔍 Checking available integrations...\n');
    
    const config = getConfig();
    
    // Create axios client
    const client = axios.create({
      baseURL: config.alloyBaseUrl,
      headers: {
        'Authorization': `Bearer ${config.alloyApiKey}`,
        'Content-Type': 'application/json',
        'x-api-version': '2025-09',
      },
      timeout: 30000,
    });

    // Try to get available connectors/integrations
    console.log('📋 Available Connectors (that you can connect):');
    console.log('─'.repeat(50));
    
    try {
      // Try different possible endpoints for listing connectors
      const endpoints = [
        '/connectors',
        '/integrations',
        '/connectors/available',
        '/api/connectors',
      ];

      let connectorsFound = false;
      for (const endpoint of endpoints) {
        try {
          const response = await client.get(endpoint);
          if (response.data && (Array.isArray(response.data) || response.data.data)) {
            const connectors = Array.isArray(response.data) ? response.data : response.data.data;
            if (connectors && connectors.length > 0) {
              connectorsFound = true;
              connectors.forEach((connector: any, index: number) => {
                console.log(`${index + 1}. ${connector.name || connector.id || 'Unknown'}`);
                console.log(`   ID: ${connector.id || 'N/A'}`);
                console.log(`   Category: ${connector.category?.join(', ') || 'N/A'}`);
                console.log('');
              });
              break;
            }
          }
        } catch (e) {
          // Continue to next endpoint
        }
      }

      if (!connectorsFound) {
        console.log('⚠️  Could not fetch available connectors via API.');
        console.log('   This endpoint may not be available or may require different authentication.');
        console.log('');
        console.log('💡 To see available connectors:');
        console.log('   1. Visit https://app.runalloy.com');
        console.log('   2. Go to Connections or Integrations');
        console.log('   3. Click "Add Connection" or "Connect Integration"');
        console.log('   4. You\'ll see a list of all available connectors');
        console.log('');
      }
    } catch (error: any) {
      console.log('⚠️  Could not fetch available connectors via API.');
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Message: ${JSON.stringify(error.response.data)}`);
      }
      console.log('');
    }

    // List existing connections
    console.log('📦 Your Existing Connections:');
    console.log('─'.repeat(50));
    
    try {
      const response = await client.get(`/users/${config.alloyUserId}/connections`);
      
      if (response.data && (Array.isArray(response.data) || response.data.data)) {
        const connections = Array.isArray(response.data) ? response.data : response.data.data;
        
        if (connections && connections.length > 0) {
          connections.forEach((connection: any, index: number) => {
            console.log(`Connection ${index + 1}:`);
            console.log(`  ID: ${connection.id || connection.connectionId || 'N/A'}`);
            console.log(`  Connector: ${connection.connectorId || connection.integrationId || 'N/A'}`);
            console.log(`  Status: ${connection.status || 'N/A'}`);
            console.log(`  Created: ${connection.createdAt || 'N/A'}`);
            console.log('');
          });
        } else {
          console.log('No existing connections found.');
          console.log('');
        }
      }
    } catch (error: any) {
      console.log('⚠️  Could not fetch existing connections via API.');
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Message: ${JSON.stringify(error.response.data)}`);
      }
      console.log('');
      console.log('💡 To check your connections:');
      console.log('   1. Visit https://app.runalloy.com');
      console.log('   2. Go to Connections');
      console.log('   3. View your connected integrations');
      console.log('');
    }

    // Summary
    console.log('📝 Summary:');
    console.log('─'.repeat(50));
    console.log('• Available Connector: Notion');
    console.log('• This demo focuses on Notion integration');
    console.log('');
    console.log('💡 To see all available connectors for your account:');
    console.log('   Visit https://app.runalloy.com and check the Connections page');
    console.log('');

  } catch (error: any) {
    console.error('\n❌ Failed to list integrations:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    process.exit(1);
  }
}

// Run the script
listAvailableIntegrations();

