import axios, { AxiosInstance } from 'axios';
import { getConfig } from './config.js';

/**
 * Notion-specific client using Alloy Connectivity API
 * 
 * This client uses the Alloy Connectivity API endpoint pattern:
 * POST /connectors/{connectorId}/actions/{actionId}/execute
 */
export class NotionClient {
  private client: AxiosInstance;
  private config: ReturnType<typeof getConfig>;
  private connectionId: string;
  private apiVersion: string = '2025-09';

  constructor(config: ReturnType<typeof getConfig>, connectionId: string) {
    this.config = config;
    this.connectionId = connectionId;
    
    // Use production.runalloy.com for executing actions
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
   * Endpoint pattern: POST /connectors/notion/actions/{actionId}/execute
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
      let path = `/connectors/notion/actions/${actionId}/execute`;
      
      // Replace path parameters in actionId if needed
      if (parameters.pathParams) {
        Object.entries(parameters.pathParams).forEach(([key, value]) => {
          path = path.replace(`{${key}}`, value);
        });
      }

      // Build request body according to Alloy Connectivity API structure
      const requestBody: any = {
        credentialId: this.connectionId,
        headers: {
          'Notion-Version': '2022-06-28',
        },
      };

      // Add the actual Notion API request body
      if (parameters.requestBody) {
        requestBody.requestBody = parameters.requestBody;
      }

      // Add path parameters if any
      if (parameters.pathParams && Object.keys(parameters.pathParams).length > 0) {
        requestBody.pathParams = parameters.pathParams;
      }

      // Add query parameters if any
      if (parameters.queryParameters && Object.keys(parameters.queryParameters).length > 0) {
        requestBody.queryParameters = parameters.queryParameters;
      }

      // Make the request to Alloy's API
      const response = await this.client.post(path, requestBody);
      
      // Alloy returns the result (may be wrapped or direct)
      return response.data.data || response.data;
    } catch (error: any) {
      console.error(`Failed to execute action ${actionId}:`, error.message);
      if (error.response?.data) {
        console.error('API Error:', JSON.stringify(error.response.data, null, 2));
      }
      throw error;
    }
  }

  /**
   * Search for pages in Notion
   */
  async searchPages(query?: string, filter?: { value: 'page' | 'database'; property: 'object' }): Promise<any[]> {
    try {
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
      const response = await this.executeAction('retrieve-a-page', {
        pathParams: {
          page_id: pageId,
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
      const response = await this.executeAction('post-page', {
        requestBody: pageData,
      });

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
      const response = await this.executeAction('patch-page', {
        pathParams: {
          page_id: pageId,
        },
        requestBody: updates,
      });

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
      const response = await this.executeAction('post-database-query', {
        pathParams: {
          database_id: databaseId,
        },
        requestBody: query || {},
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
      const response = await this.executeAction('retrieve-a-database', {
        pathParams: {
          database_id: databaseId,
        },
      });

      return response;
    } catch (error: any) {
      console.error('Failed to get database:', error.message);
      throw error;
    }
  }
}
