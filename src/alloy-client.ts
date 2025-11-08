import { UAPI } from 'alloy-node';
import { Config } from './config';

export class AlloyClient {
  private client: UAPI;
  private config: Config;

  constructor(config: Config) {
    this.config = config;
    this.client = new UAPI(config.alloyApiKey);
  }

  /**
   * Authenticate a user and identify them with Alloy
   * This demonstrates the authentication flow
   */
  async authenticateUser(username: string): Promise<void> {
    try {
      console.log(`Authenticating user ${username}...`);
      
      // Identify the user with Alloy
      await this.client.identify(username);
      
      console.log('✓ User authenticated successfully');
      console.log(`  User ID: ${this.client.userId}`);
      console.log(`  Username: ${this.client.username}`);
    } catch (error: any) {
      console.error('Authentication failed:', error);
      throw error;
    }
  }

  /**
   * Connect to a specific integration/connection
   */
  async connectToIntegration(connectionId: string): Promise<void> {
    try {
      console.log(`Connecting to integration with connection ID: ${connectionId}...`);
      await this.client.connect(connectionId);
      console.log('✓ Connected to integration successfully');
    } catch (error: any) {
      console.error('Failed to connect to integration:', error.message);
      throw error;
    }
  }

  /**
   * Read contacts from CRM (READ operation)
   */
  async readContacts(): Promise<any[]> {
    try {
      console.log(`\n📖 Reading contacts from CRM...`);
      
      // Use the CRM module to list contacts
      const response = await this.client.CRM.listContacts();

      console.log(`✓ Successfully read ${response?.data?.length || 0} contact records`);
      return response?.data || [];
    } catch (error: any) {
      console.error('Failed to read contacts:', error);
      throw error;
    }
  }

  /**
   * Create a new contact in CRM (WRITE operation)
   */
  async createContact(contactData: any): Promise<any> {
    try {
      console.log(`\n✍️  Creating new contact in CRM...`);
      console.log('Contact data:', JSON.stringify(contactData, null, 2));

      // Use the CRM module to create a contact
      const response = await this.client.CRM.createContact(contactData);

      console.log(`✓ Successfully created contact`);
      console.log('Response:', JSON.stringify(response, null, 2));
      return response;
    } catch (error: any) {
      console.error('Failed to create contact:', error);
      throw error;
    }
  }

  /**
   * Update an existing contact in CRM (UPDATE operation)
   */
  async updateContact(contactId: string, updates: any): Promise<any> {
    try {
      console.log(`\n🔄 Updating contact ${contactId} in CRM...`);
      console.log('Updated data:', JSON.stringify(updates, null, 2));

      const response = await this.client.CRM.updateContact(contactId, updates);

      console.log(`✓ Successfully updated contact`);
      return response;
    } catch (error: any) {
      console.error('Failed to update contact:', error);
      throw error;
    }
  }

  /**
   * Get a specific contact from CRM
   */
  async getContact(contactId: string): Promise<any> {
    try {
      console.log(`\n🔍 Fetching contact ${contactId} from CRM...`);
      
      const response = await this.client.CRM.getContact(contactId);

      console.log('✓ Contact retrieved successfully');
      return response;
    } catch (error: any) {
      console.error('Failed to get contact:', error);
      throw error;
    }
  }

  /**
   * List accounts from CRM
   */
  async listAccounts(): Promise<any[]> {
    try {
      console.log(`\n📋 Listing accounts from CRM...`);
      
      const response = await this.client.CRM.listAccounts();

      console.log(`✓ Successfully read ${response?.data?.length || 0} account records`);
      return response?.data || [];
    } catch (error: any) {
      console.error('Failed to list accounts:', error);
      throw error;
    }
  }

  /**
   * Clear the current user session
   */
  clearSession(): void {
    this.client.clear();
    console.log('✓ Session cleared');
  }
}
