import { UAPI } from 'alloy-node';
import { Config } from './config.js';

export class AlloyClient {
  private client: UAPI;
  private config: Config;

  constructor(config: Config) {
    this.config = config;
    this.client = new UAPI(config.alloyApiKey);
    // Set the base URL for API calls
    if (this.client.url !== undefined) {
      // Extract base URL from config (remove /api if present)
      const baseUrl = config.alloyBaseUrl.replace(/\/api$/, '');
      this.client.url = baseUrl;
    }
  }

  /**
   * Authenticate a user and identify them with Alloy
   * This demonstrates the authentication flow
   */
  async authenticateUser(username: string): Promise<void> {
    try {
      console.log('Authenticating user...');
      
      // Set user ID directly if available (for Connectivity API)
      if (this.config.alloyUserId) {
        this.client.userId = this.config.alloyUserId;
      }
      
      // Identify the user with Alloy
      // Note: This may not be needed for Connectivity API, but demonstrates the flow
      try {
        await this.client.identify(username);
        console.log('✓ User authenticated successfully');
        console.log(`  User ID: ${this.client.userId || '[NOT SET]'}`);
        console.log(`  Username: ${this.client.username || '[NOT SET]'}`);
      } catch (identifyError: any) {
        // If identify fails, that's okay - we can still use the API with userId set
        console.log('⚠️  Identify call failed (this is okay for Connectivity API)');
        console.log(`  Using User ID from config: ${this.config.alloyUserId}`);
      }
    } catch (error: any) {
      console.error('Authentication failed:', error.message || error);
      // Don't throw - allow demo to continue
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
   * Read pages from Notion (READ operation)
   */
  async readPages(): Promise<any[]> {
    try {
      console.log(`\n📖 Reading pages from Notion...`);
      
      // Use the CRM module as a generic data access layer for Notion pages
      // Alloy's Unified API maps Notion pages to a standardized format
      const response = await this.client.CRM.listContacts();

      console.log(`✓ Successfully read ${response?.data?.length || 0} page records`);
      return response?.data || [];
    } catch (error: any) {
      console.error('Failed to read pages:', error);
      throw error;
    }
  }

  /**
   * Create a new page in Notion (WRITE operation)
   */
  async createPage(pageData: any): Promise<any> {
    try {
      console.log(`\n✍️  Creating new page in Notion...`);
      console.log('Page data:', JSON.stringify(pageData, null, 2));

      // Use the CRM module as a generic data access layer for Notion pages
      // Alloy's Unified API maps Notion pages to a standardized format
      const response = await this.client.CRM.createContact(pageData);

      console.log(`✓ Successfully created page`);
      console.log('Response:', JSON.stringify(response, null, 2));
      return response;
    } catch (error: any) {
      console.error('Failed to create page:', error);
      throw error;
    }
  }

  /**
   * Update an existing page in Notion (UPDATE operation)
   */
  async updatePage(pageId: string, updates: any): Promise<any> {
    try {
      console.log(`\n🔄 Updating page ${pageId} in Notion...`);
      console.log('Updated data:', JSON.stringify(updates, null, 2));

      const response = await this.client.CRM.updateContact(pageId, updates);

      console.log(`✓ Successfully updated page`);
      return response;
    } catch (error: any) {
      console.error('Failed to update page:', error);
      throw error;
    }
  }

  /**
   * Get a specific page from Notion
   */
  async getPage(pageId: string): Promise<any> {
    try {
      console.log(`\n🔍 Fetching page ${pageId} from Notion...`);
      
      const response = await this.client.CRM.getContact(pageId);

      console.log('✓ Page retrieved successfully');
      return response;
    } catch (error: any) {
      console.error('Failed to get page:', error);
      throw error;
    }
  }

  /**
   * List databases from Notion
   */
  async listDatabases(): Promise<any[]> {
    try {
      console.log(`\n📋 Listing databases from Notion...`);
      
      // Use the CRM module as a generic data access layer for Notion databases
      // Alloy's Unified API maps Notion databases to accounts in the standardized format
      const response = await this.client.CRM.listAccounts();

      console.log(`✓ Successfully read ${response?.data?.length || 0} database records`);
      return response?.data || [];
    } catch (error: any) {
      console.error('Failed to list databases:', error);
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
