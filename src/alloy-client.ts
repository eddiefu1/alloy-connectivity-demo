import { UAPI } from 'alloy-node';
import { Config } from './config.js';

/**
 * Alloy Client using Unified API (UAPI)
 * 
 * Note: This uses Alloy's Unified API which maps integrations to standardized formats.
 * For direct Connectivity API access, use NotionClient instead.
 */
export class AlloyClient {
  private client: UAPI;
  private config: Config;

  constructor(config: Config) {
    this.config = config;
    this.client = new UAPI(config.alloyApiKey);
    
    // Set the base URL for API calls
    if (this.client.url !== undefined) {
      const baseUrl = config.alloyBaseUrl.replace(/\/api$/, '');
      this.client.url = baseUrl;
    }
  }

  /**
   * Authenticate a user and identify them with Alloy
   */
  async authenticateUser(username: string): Promise<void> {
    try {
      // Set user ID directly if available
      if (this.config.alloyUserId) {
        this.client.userId = this.config.alloyUserId;
      }
      
      // Identify the user with Alloy
      try {
        await this.client.identify(username);
      } catch (error) {
        // If identify fails, that's okay - we can still use the API with userId set
        console.log('⚠️  Identify call failed (this is okay for Connectivity API)');
      }
    } catch (error: any) {
      console.error('Authentication failed:', error.message);
    }
  }

  /**
   * Connect to a specific integration/connection
   */
  async connectToIntegration(connectionId: string): Promise<void> {
    try {
      await this.client.connect(connectionId);
    } catch (error: any) {
      console.error('Failed to connect to integration:', error.message);
      throw error;
    }
  }

  /**
   * Read pages from Notion (READ operation)
   * Uses Unified API which maps Notion pages to CRM contacts
   */
  async readPages(): Promise<any[]> {
    try {
      const response = await this.client.CRM.listContacts();
      return response?.data || [];
    } catch (error: any) {
      console.error('Failed to read pages:', error.message);
      throw error;
    }
  }

  /**
   * Create a new page in Notion (WRITE operation)
   * Uses Unified API which maps Notion pages to CRM contacts
   */
  async createPage(pageData: any): Promise<any> {
    try {
      const response = await this.client.CRM.createContact(pageData);
      return response;
    } catch (error: any) {
      console.error('Failed to create page:', error.message);
      throw error;
    }
  }

  /**
   * Update an existing page in Notion (UPDATE operation)
   * Uses Unified API which maps Notion pages to CRM contacts
   */
  async updatePage(pageId: string, updates: any): Promise<any> {
    try {
      const response = await this.client.CRM.updateContact(pageId, updates);
      return response;
    } catch (error: any) {
      console.error('Failed to update page:', error.message);
      throw error;
    }
  }

  /**
   * Get a specific page from Notion
   */
  async getPage(pageId: string): Promise<any> {
    try {
      const response = await this.client.CRM.getContact(pageId);
      return response;
    } catch (error: any) {
      console.error('Failed to get page:', error.message);
      throw error;
    }
  }

  /**
   * List databases from Notion
   * Uses Unified API which maps Notion databases to CRM accounts
   */
  async listDatabases(): Promise<any[]> {
    try {
      const response = await this.client.CRM.listAccounts();
      return response?.data || [];
    } catch (error: any) {
      console.error('Failed to list databases:', error.message);
      throw error;
    }
  }
}
