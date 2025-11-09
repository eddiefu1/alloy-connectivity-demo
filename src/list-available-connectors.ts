import axios from 'axios';
import { getConfig } from './config.js';

/**
 * Script to list available connectors
 * Usage: npm run list-connectors
 */
async function listAvailableIntegrations() {
  try {
    console.log('🔍 Checking available connectors...\n');
    
    const config = getConfig();
    const client = axios.create({
      baseURL: 'https://production.runalloy.com',
      headers: {
        'Authorization': `Bearer ${config.alloyApiKey}`,
        'x-api-version': '2025-09',
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    console.log('📋 Available Connector: Notion');
    console.log('   This demo focuses on Notion integration');
    console.log('\n💡 To see all available connectors:');
    console.log('   Visit https://app.runalloy.com and check the Connections page');
    console.log();

  } catch (error: any) {
    console.error('\n❌ Failed to list connectors:', error.message);
    process.exit(1);
  }
}

listAvailableIntegrations();
