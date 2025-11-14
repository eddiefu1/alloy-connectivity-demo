import axios, { AxiosInstance } from 'axios';
import { getConfig } from './config.js';

/**
 * Direct Notion API Client
 * Uses Notion internal integration token directly (bypasses Alloy)
 * 
 * This is useful when you have a Notion internal token and want to use it
 * directly with Notion's API without going through Alloy's OAuth flow.
 */
export class NotionDirectClient {
  private client: AxiosInstance;
  private token: string;
  private apiVersion: string = '2022-06-28';

  constructor(token?: string) {
    const config = getConfig();
    this.token = token || config.notionInternalToken || '';
    
    if (!this.token) {
      throw new Error('Notion internal token is required. Provide it as parameter or set NOTION_INTERNAL_TOKEN in .env');
    }

    // Use Notion's official API endpoint
    this.client = axios.create({
      baseURL: 'https://api.notion.com/v1',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Notion-Version': this.apiVersion,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
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

      const response = await this.client.post('/search', requestBody);
      return response.data.results || [];
    } catch (error: any) {
      console.error('Failed to search pages:', error.message);
      if (error.response?.data) {
        console.error('Notion API Error:', JSON.stringify(error.response.data, null, 2));
      }
      throw error;
    }
  }

  /**
   * Get a specific page by ID
   */
  async getPage(pageId: string): Promise<any> {
    try {
      const response = await this.client.get(`/pages/${pageId}`);
      return response.data;
    } catch (error: any) {
      console.error('Failed to get page:', error.message);
      if (error.response?.data) {
        console.error('Notion API Error:', JSON.stringify(error.response.data, null, 2));
      }
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
      const response = await this.client.post('/pages', pageData);
      return response.data;
    } catch (error: any) {
      console.error('Failed to create page:', error.message);
      if (error.response?.data) {
        console.error('Notion API Error:', JSON.stringify(error.response.data, null, 2));
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
      const response = await this.client.patch(`/pages/${pageId}`, updates);
      return response.data;
    } catch (error: any) {
      console.error('Failed to update page:', error.message);
      if (error.response?.data) {
        console.error('Notion API Error:', JSON.stringify(error.response.data, null, 2));
      }
      throw error;
    }
  }

  /**
   * Query a database in Notion
   */
  async queryDatabase(databaseId: string, query?: any): Promise<any[]> {
    try {
      const response = await this.client.post(`/databases/${databaseId}/query`, query || {});
      return response.data.results || [];
    } catch (error: any) {
      console.error('Failed to query database:', error.message);
      if (error.response?.data) {
        console.error('Notion API Error:', JSON.stringify(error.response.data, null, 2));
      }
      throw error;
    }
  }

  /**
   * Get a database by ID
   */
  async getDatabase(databaseId: string): Promise<any> {
    try {
      const response = await this.client.get(`/databases/${databaseId}`);
      return response.data;
    } catch (error: any) {
      console.error('Failed to get database:', error.message);
      if (error.response?.data) {
        console.error('Notion API Error:', JSON.stringify(error.response.data, null, 2));
      }
      throw error;
    }
  }

  /**
   * Get current bot user info
   */
  async getBotUser(): Promise<any> {
    try {
      const response = await this.client.get('/users/me');
      return response.data;
    } catch (error: any) {
      console.error('Failed to get bot user:', error.message);
      if (error.response?.data) {
        console.error('Notion API Error:', JSON.stringify(error.response.data, null, 2));
      }
      throw error;
    }
  }
}

