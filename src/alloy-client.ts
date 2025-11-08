import Alloy from 'alloy-node';
import { Config } from './config';

export class AlloyClient {
  private client: any;
  private config: Config;

  constructor(config: Config) {
    this.config = config;
    this.client = new Alloy({
      apiKey: config.alloyApiKey,
    });
  }

  /**
   * Authenticate a user and get an access token for a specific integration
   * This demonstrates the authentication flow
   */
  async authenticateUser(integrationId: string): Promise<string> {
    try {
      console.log(`Authenticating user ${this.config.alloyUserId} for integration ${integrationId}...`);
      
      // Get or create user token
      const response = await this.client.users.getUser(this.config.alloyUserId);
      
      console.log('✓ User authenticated successfully');
      return response.token || '';
    } catch (error: any) {
      console.error('Authentication failed:', error.message);
      throw error;
    }
  }

  /**
   * List all available integrations for the user
   */
  async listIntegrations(): Promise<any[]> {
    try {
      console.log('Fetching available integrations...');
      const integrations = await this.client.integrations.list();
      console.log(`✓ Found ${integrations.length} integrations`);
      return integrations;
    } catch (error: any) {
      console.error('Failed to list integrations:', error.message);
      throw error;
    }
  }

  /**
   * Read data from a connected app (e.g., fetch contacts from Salesforce)
   * This demonstrates the READ operation
   */
  async readData(userId: string, integrationId: string, entity: string): Promise<any[]> {
    try {
      console.log(`\n📖 Reading ${entity} from integration ${integrationId}...`);
      
      // Use the SDK to read data from the integration
      const response = await this.client.data.get({
        userId: userId,
        integrationId: integrationId,
        entity: entity,
      });

      console.log(`✓ Successfully read ${response.data?.length || 0} ${entity} records`);
      return response.data || [];
    } catch (error: any) {
      console.error(`Failed to read ${entity}:`, error.message);
      throw error;
    }
  }

  /**
   * Write data to a connected app (e.g., create a new contact in Salesforce)
   * This demonstrates the WRITE operation
   */
  async writeData(
    userId: string,
    integrationId: string,
    entity: string,
    data: any
  ): Promise<any> {
    try {
      console.log(`\n✍️  Writing ${entity} to integration ${integrationId}...`);
      console.log('Data to write:', JSON.stringify(data, null, 2));

      // Use the SDK to write data to the integration
      const response = await this.client.data.create({
        userId: userId,
        integrationId: integrationId,
        entity: entity,
        data: data,
      });

      console.log(`✓ Successfully wrote ${entity} record`);
      console.log('Response:', JSON.stringify(response, null, 2));
      return response;
    } catch (error: any) {
      console.error(`Failed to write ${entity}:`, error.message);
      throw error;
    }
  }

  /**
   * Update existing data in a connected app
   */
  async updateData(
    userId: string,
    integrationId: string,
    entity: string,
    recordId: string,
    data: any
  ): Promise<any> {
    try {
      console.log(`\n🔄 Updating ${entity} record ${recordId} in integration ${integrationId}...`);
      console.log('Updated data:', JSON.stringify(data, null, 2));

      const response = await this.client.data.update({
        userId: userId,
        integrationId: integrationId,
        entity: entity,
        recordId: recordId,
        data: data,
      });

      console.log(`✓ Successfully updated ${entity} record`);
      return response;
    } catch (error: any) {
      console.error(`Failed to update ${entity}:`, error.message);
      throw error;
    }
  }

  /**
   * Get the status of a connection
   */
  async getConnectionStatus(userId: string, integrationId: string): Promise<any> {
    try {
      console.log(`\n🔍 Checking connection status for integration ${integrationId}...`);
      
      const response = await this.client.connections.get({
        userId: userId,
        integrationId: integrationId,
      });

      console.log('✓ Connection status:', response.status);
      return response;
    } catch (error: any) {
      console.error('Failed to get connection status:', error.message);
      throw error;
    }
  }
}
