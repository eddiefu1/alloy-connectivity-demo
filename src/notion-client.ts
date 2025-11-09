import axios, { AxiosInstance } from 'axios';
import { getConfig } from './config.js';

/**
 * Notion-specific client using Alloy Connectivity API
 * This client uses the correct Alloy API endpoints for Notion operations
 */
export class NotionClient {
  private client: AxiosInstance;
  private config: ReturnType<typeof getConfig>;
  private connectionId: string;
  private apiVersion: string = '2025-09';

  constructor(config: ReturnType<typeof getConfig>, connectionId: string) {
    this.config = config;
    this.connectionId = connectionId;
    
    // Use production.runalloy.com for executing actions (same base URL as OAuth endpoints)
    this.client = axios.create({
      baseURL: 'https://production.runalloy.com',
      headers: {
        'Authorization': `Bearer ${config.alloyApiKey}`,
        'x-api-version': this.apiVersion,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  /**
   * Execute a Notion action via Alloy Connectivity API
   * Endpoint pattern: POST /connectors/{connectorId}/actions/{actionId}/execute
   */
  private async executeAction(
    actionId: string,
    parameters: {
      requestBody?: any;
      pathParams?: Record<string, string>;
      queryParameters?: Record<string, any>;
    } = {}
  ): Promise<any> {
    try {
      // Alloy Connectivity API endpoint pattern for executing actions
      // Pattern: POST https://api.runalloy.com/connectors/{connectorId}/actions/{actionId}/execute
      let path = `/connectors/notion/actions/${actionId}/execute`;
      
      // Replace path parameters in actionId if needed (e.g., retrieve-a-page uses {page_id})
      if (parameters.pathParams) {
        Object.entries(parameters.pathParams).forEach(([key, value]) => {
          // Some actions have path params that need to be in the URL
          path = path.replace(`{${key}}`, value);
        });
      }

      // Build the request body according to Alloy Connectivity API structure
      // Pattern: { credentialId, requestBody, headers }
      const requestBody: any = {
        credentialId: this.connectionId,
      };

      // Add the actual Notion API request body
      if (parameters.requestBody) {
        requestBody.requestBody = parameters.requestBody;
      }

      // Add path parameters if any (for actions that require IDs in the path)
      if (parameters.pathParams && Object.keys(parameters.pathParams).length > 0) {
        requestBody.pathParams = parameters.pathParams;
      }

      // Add query parameters if any
      if (parameters.queryParameters && Object.keys(parameters.queryParameters).length > 0) {
        requestBody.queryParameters = parameters.queryParameters;
      }

      // Add Notion-Version header requirement
      requestBody.headers = {
        'Notion-Version': '2022-06-28',
      };

      // Make the request to Alloy's API
      const response = await this.client.post(path, requestBody);
      
      // Alloy returns the result (may be wrapped or direct)
      return response.data.data || response.data;
    } catch (error: any) {
      console.error(`Failed to execute action ${actionId}:`, error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', JSON.stringify(error.response.data, null, 2));
      }
      throw error;
    }
  }

  /**
   * Search for pages in Notion
   */
  async searchPages(query?: string, filter?: { value: 'page' | 'database'; property: 'object' }): Promise<any[]> {
    try {
      console.log(`\n🔍 Searching for pages in Notion...`);
      
      const requestBody: any = {};
      if (query) {
        requestBody.query = query;
      }
      if (filter) {
        requestBody.filter = filter;
      } else {
        // Default to pages only
        requestBody.filter = {
          value: 'page',
          property: 'object',
        };
      }

      const response = await this.executeAction('post-search', {
        requestBody,
        additionalHeaders: {
          'x-alloy-credentialId': this.connectionId,
        },
      });

      return response.results || [];
    } catch (error: any) {
      console.error('Failed to search pages:', error.message);
      throw error;
    }
  }

  /**
   * Get a specific page by ID
   */
  async getPage(pageId: string): Promise<any> {
    try {
      console.log(`\n📄 Retrieving page ${pageId}...`);
      
      const response = await this.executeAction('retrieve-a-page', {
        pathParams: {
          page_id: pageId,
        },
        additionalHeaders: {
          'x-alloy-credentialId': this.connectionId,
        },
      });

      return response;
    } catch (error: any) {
      console.error('Failed to get page:', error.message);
      throw error;
    }
  }

  /**
   * Create a new page in Notion
   */
  async createPage(pageData: {
    parent: { type: 'page_id' | 'database_id' | 'workspace'; page_id?: string; database_id?: string; workspace?: boolean };
    properties: Record<string, any>;
    children?: any[];
    icon?: any;
    cover?: any;
  }): Promise<any> {
    try {
      console.log(`\n✍️  Creating new page in Notion...`);
      console.log('Page data:', JSON.stringify(pageData, null, 2));

      const response = await this.executeAction('post-page', {
        requestBody: pageData,
        additionalHeaders: {
          'x-alloy-credentialId': this.connectionId,
        },
      });

      console.log(`✓ Successfully created page: ${response.id}`);
      return response;
    } catch (error: any) {
      console.error('Failed to create page:', error.message);
      if (error.response?.data) {
        console.error('Error details:', JSON.stringify(error.response.data, null, 2));
      }
      throw error;
    }
  }

  /**
   * Update a page in Notion
   */
  async updatePage(pageId: string, updates: {
    properties?: Record<string, any>;
    archived?: boolean;
    icon?: any;
    cover?: any;
  }): Promise<any> {
    try {
      console.log(`\n🔄 Updating page ${pageId}...`);
      console.log('Updates:', JSON.stringify(updates, null, 2));

      const response = await this.executeAction('patch-page', {
        pathParams: {
          page_id: pageId,
        },
        requestBody: updates,
        additionalHeaders: {
          'x-alloy-credentialId': this.connectionId,
        },
      });

      console.log(`✓ Successfully updated page: ${response.id}`);
      return response;
    } catch (error: any) {
      console.error('Failed to update page:', error.message);
      if (error.response?.data) {
        console.error('Error details:', JSON.stringify(error.response.data, null, 2));
      }
      throw error;
    }
  }

  /**
   * Query a database in Notion
   */
  async queryDatabase(databaseId: string, query?: any): Promise<any[]> {
    try {
      console.log(`\n📊 Querying database ${databaseId}...`);
      
      const response = await this.executeAction('post-database-query', {
        pathParams: {
          database_id: databaseId,
        },
        requestBody: query || {},
        additionalHeaders: {
          'x-alloy-credentialId': this.connectionId,
        },
      });

      return response.results || [];
    } catch (error: any) {
      console.error('Failed to query database:', error.message);
      throw error;
    }
  }

  /**
   * Get a database by ID
   */
  async getDatabase(databaseId: string): Promise<any> {
    try {
      console.log(`\n📋 Retrieving database ${databaseId}...`);
      
      const response = await this.executeAction('retrieve-a-database', {
        pathParams: {
          database_id: databaseId,
        },
        additionalHeaders: {
          'x-alloy-credentialId': this.connectionId,
        },
      });

      return response;
    } catch (error: any) {
      console.error('Failed to get database:', error.message);
      throw error;
    }
  }
}

