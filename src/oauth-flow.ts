import axios, { AxiosInstance } from 'axios';
import { getConfig } from './config.js';

/**
 * OAuth Flow Helper for Alloy Automation
 * Handles OAuth 2.0 authentication flow for connecting integrations
 */
export class AlloyOAuthFlow {
  private client: AxiosInstance;
  private config: ReturnType<typeof getConfig>;
  private apiVersion: string = '2025-09';

  constructor() {
    this.config = getConfig();
    this.client = axios.create({
      baseURL: 'https://production.runalloy.com',
      headers: {
        'Authorization': `Bearer ${this.config.alloyApiKey}`,
        'x-api-version': this.apiVersion,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  /**
   * Initiate OAuth flow for a connector
   * 
   * @param connectorId - The ID of the connector (e.g., 'notion')
   * @param redirectUri - The URI to redirect to after OAuth completes
   * @returns OAuth URL that the user should be redirected to
   */
  async initiateOAuthFlow(
    connectorId: string,
    redirectUri: string
  ): Promise<{ oauthUrl: string; credentialId?: string }> {
    try {
      const requestBody = {
        connectorId: connectorId,
        authenticationType: 'oauth2',
        redirectUri: redirectUri,
        userId: this.config.alloyUserId,
      };

      const response = await this.client.post(
        `/connectors/${connectorId}/credentials`,
        requestBody
      );

      return {
        oauthUrl: response.data.oauthUrl,
        credentialId: response.data.credentialId,
      };
    } catch (error: any) {
      console.error(`Failed to initiate OAuth flow for ${connectorId}:`, error.message);
      if (error.response?.data) {
        console.error('API Error:', error.response.data);
      }
      throw error;
    }
  }

  /**
   * Handle OAuth callback after user authorization
   * 
   * @param connectorId - The ID of the connector
   * @param code - The authorization code from the OAuth callback
   * @param state - The state parameter from the OAuth callback (optional)
   * @returns Connection/credential information including connection ID
   */
  async handleOAuthCallback(
    connectorId: string,
    code: string,
    state?: string
  ): Promise<{ connectionId: string; credentialId: string }> {
    try {
      if (!this.config.alloyUserId) {
        throw new Error('ALLOY_USER_ID is required in .env file for OAuth callback');
      }

      const callbackBody: any = {
        code: code,
        userId: this.config.alloyUserId,
      };

      if (state) {
        callbackBody.state = state;
      }

      const response = await this.client.post(
        `/connectors/${connectorId}/credentials/callback`,
        callbackBody
      );

      return {
        connectionId: response.data.connectionId || response.data.id,
        credentialId: response.data.credentialId || response.data.id,
      };
    } catch (error: any) {
      console.error(`Failed to handle OAuth callback for ${connectorId}:`, error.message);
      if (error.response?.data) {
        console.error('API Error:', error.response.data);
      }
      throw error;
    }
  }

  /**
   * List all credentials/connections for a user
   * 
   * @returns List of credentials/connections
   */
  async listConnections(): Promise<any[]> {
    try {
      const response = await this.client.get(
        `/users/${this.config.alloyUserId}/credentials`
      );

      return response.data.data || response.data || [];
    } catch (error: any) {
      console.error('Failed to list connections:', error.message);
      if (error.response?.data) {
        console.error('API Error:', error.response.data);
      }
      throw error;
    }
  }

  /**
   * Get connection details by connection ID
   * 
   * @param connectionId - The connection ID
   * @returns Connection details
   */
  async getConnection(connectionId: string): Promise<any> {
    try {
      const response = await this.client.get(
        `/credentials/${connectionId}`
      );

      return response.data;
    } catch (error: any) {
      console.error(`Failed to get connection ${connectionId}:`, error.message);
      if (error.response?.data) {
        console.error('API Error:', error.response.data);
      }
      throw error;
    }
  }
}
