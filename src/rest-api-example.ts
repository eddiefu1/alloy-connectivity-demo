import axios, { AxiosInstance } from 'axios';
import { getConfig } from './config.js';

/**
 * Alternative implementation using REST API directly (without SDK)
 * This demonstrates how to use Alloy's Connectivity API via direct HTTP calls
 */
export class AlloyRestClient {
  private client: AxiosInstance;
  private apiKey: string;
  private userId: string;

  constructor(apiKey: string, baseUrl: string, userId: string) {
    this.apiKey = apiKey;
    this.userId = userId;
    
    // Create axios client with default headers
    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  /**
   * List all integrations via REST API
   */
  async listIntegrations(): Promise<any> {
    try {
      const response = await this.client.get('/integrations');
      return response.data;
    } catch (error: any) {
      console.error('Failed to list integrations:', error.message);
      throw error;
    }
  }

  /**
   * Get user information via REST API
   */
  async getUser(userId: string): Promise<any> {
    try {
      const response = await this.client.get(`/users/${userId}`);
      return response.data;
    } catch (error: any) {
      console.error('Failed to get user:', error.message);
      throw error;
    }
  }

  /**
   * Read data from an integration via REST API
   */
  async readData(userId: string, integrationId: string, entity: string): Promise<any> {
    try {
      const response = await this.client.get(
        `/users/${userId}/integrations/${integrationId}/data/${entity}`
      );
      return response.data;
    } catch (error: any) {
      console.error(`Failed to read ${entity}:`, error.message);
      throw error;
    }
  }

  /**
   * Create data in an integration via REST API
   */
  async createData(
    userId: string,
    integrationId: string,
    entity: string,
    data: any
  ): Promise<any> {
    try {
      const response = await this.client.post(
        `/users/${userId}/integrations/${integrationId}/data/${entity}`,
        data
      );
      return response.data;
    } catch (error: any) {
      console.error(`Failed to create ${entity}:`, error.message);
      throw error;
    }
  }

  /**
   * Update data in an integration via REST API
   */
  async updateData(
    userId: string,
    integrationId: string,
    entity: string,
    recordId: string,
    data: any
  ): Promise<any> {
    try {
      const response = await this.client.put(
        `/users/${userId}/integrations/${integrationId}/data/${entity}/${recordId}`,
        data
      );
      return response.data;
    } catch (error: any) {
      console.error(`Failed to update ${entity}:`, error.message);
      throw error;
    }
  }

  /**
   * Get connection status via REST API
   */
  async getConnectionStatus(userId: string, integrationId: string): Promise<any> {
    try {
      const response = await this.client.get(
        `/users/${userId}/integrations/${integrationId}/connection`
      );
      return response.data;
    } catch (error: any) {
      console.error('Failed to get connection status:', error.message);
      throw error;
    }
  }
}

/**
 * Example usage of the REST API client
 */
async function demonstrateRestApi() {
  console.log('🔗 REST API Demo\n');
  console.log('This example shows how to use Alloy Connectivity API via direct REST calls');
  console.log('without using the SDK.\n');

  const config = getConfig();
  const client = new AlloyRestClient(
    config.alloyApiKey,
    config.alloyBaseUrl,
    config.alloyUserId
  );

  try {
    // Example: Get user information
    console.log('Fetching user information...');
    const user = await client.getUser(config.alloyUserId);
    console.log('User:', JSON.stringify(user, null, 2));

    // Example: List integrations
    console.log('\nFetching integrations...');
    const integrations = await client.listIntegrations();
    console.log(`Found ${integrations.length || 0} integrations`);

    // Example: Read data
    const integrationId = process.env.INTEGRATION_ID || 'notion';
    console.log(`\nReading pages from ${integrationId}...`);
    const pages = await client.readData(config.alloyUserId, integrationId, 'pages');
    console.log(`Retrieved ${pages.data?.length || 0} pages`);

  } catch (error: any) {
    console.error('REST API demo failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

// Uncomment to run this example directly
// demonstrateRestApi();
