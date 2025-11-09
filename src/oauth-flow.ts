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
    // OAuth and credentials endpoints use production.runalloy.com
    // See docs/endpoint-pattern-summary.md for details
    const baseUrl = this.config.alloyBaseUrl || 'https://production.runalloy.com';
    this.client = axios.create({
      baseURL: baseUrl,
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
   * @param code - The authorization code from the OAuth callback (optional if tokens are provided)
   * @param state - The state parameter from the OAuth callback (optional)
   * @param credentialId - The credential ID from OAuth initiation (optional)
   * @param accessToken - Access token from OAuth callback (optional)
   * @param refreshToken - Refresh token from OAuth callback (optional)
   * @returns Connection/credential information including connection ID
   */
  async handleOAuthCallback(
    connectorId: string,
    code?: string,
    state?: string,
    credentialId?: string,
    accessToken?: string,
    refreshToken?: string
  ): Promise<{ connectionId: string; credentialId: string }> {
    try {
      if (!this.config.alloyUserId) {
        throw new Error('ALLOY_USER_ID is required in .env file for OAuth callback');
      }

      // Alloy API expects both access_token and refresh_token
      // If we have tokens, use them; otherwise try with code
      let callbackBody: any;
      
      if (accessToken && refreshToken) {
        // Use tokens if provided (this is what Alloy expects)
        console.log('Using access_token and refresh_token for callback');
        callbackBody = {
          access_token: accessToken,
          refresh_token: refreshToken,
          userId: this.config.alloyUserId,
        };
        
        // Include credentialId if provided
        if (credentialId) {
          callbackBody.credentialId = credentialId;
        }
      } else if (code) {
        // Fall back to authorization code flow
        console.log('Using authorization code for callback');
        if (credentialId) {
          callbackBody = {
            credentialId: credentialId,
            code: code,
            userId: this.config.alloyUserId,
          };
        } else {
          callbackBody = {
            code: code,
            userId: this.config.alloyUserId,
          };
        }
      } else {
        throw new Error('Either authorization code or both access_token and refresh_token are required');
      }

      // Include state if provided
      if (state) {
        callbackBody.state = state;
      }

      console.log(`Calling callback endpoint: /connectors/${connectorId}/credentials/callback`);
      console.log(`Request body:`, JSON.stringify(callbackBody, null, 2));

      const response = await this.client.post(
        `/connectors/${connectorId}/credentials/callback`,
        callbackBody
      );

      console.log(`Callback response:`, JSON.stringify(response.data, null, 2));

      return {
        connectionId: response.data.connectionId || response.data.id,
        credentialId: response.data.credentialId || response.data.id,
      };
    } catch (error: any) {
      console.error(`Failed to handle OAuth callback for ${connectorId}:`, error.message);
      if (error.response?.data) {
        console.error('API Error Response:', JSON.stringify(error.response.data, null, 2));
        console.error('API Error Status:', error.response.status);
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
   * This includes connection metadata, status, and potentially token information
   * 
   * @param connectionId - The connection ID
   * @returns Connection details including token information if available
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

  /**
   * Get token information for a connection
   * This retrieves access token metadata (if available) from the connection
   * Note: For security, raw tokens are not returned - only metadata
   * 
   * @param connectionId - The connection ID
   * @returns Token metadata including expiration, scopes, etc. (no raw tokens)
   */
  async getConnectionTokens(connectionId: string): Promise<{
    hasTokens: boolean;
    tokenInfo?: any;
    connection: any;
    alloyApiKey?: string;
  }> {
    try {
      const connection = await this.getConnection(connectionId);
      
      // Extract token information from connection object
      // The structure may vary, but tokens are typically in:
      // - connection.tokens
      // - connection.credentials
      // - connection.authentication
      // - connection.metadata
      
      const rawAccessToken = connection.tokens?.access_token || connection.access_token || connection.credentials?.access_token;
      const rawRefreshToken = connection.tokens?.refresh_token || connection.refresh_token || connection.credentials?.refresh_token;
      
      // Return token metadata only, not raw tokens
      const tokenInfo = {
        accessToken: rawAccessToken ? `${rawAccessToken.substring(0, 10)}...[REDACTED]` : undefined,
        refreshToken: rawRefreshToken ? `${rawRefreshToken.substring(0, 10)}...[REDACTED]` : undefined,
        expiresAt: connection.tokens?.expires_at || connection.expires_at,
        tokenType: connection.tokens?.token_type || connection.token_type || 'Bearer',
        scopes: connection.tokens?.scope || connection.scope || connection.scopes,
      };

      return {
        hasTokens: !!(rawAccessToken || rawRefreshToken),
        tokenInfo: rawAccessToken || rawRefreshToken ? tokenInfo : undefined,
        connection: connection,
        alloyApiKey: this.config.alloyApiKey ? `${this.config.alloyApiKey.substring(0, 10)}...` : undefined, // Masked for security
      };
    } catch (error: any) {
      console.error(`Failed to get connection tokens for ${connectionId}:`, error.message);
      if (error.response?.data) {
        console.error('API Error:', error.response.data);
      }
      throw error;
    }
  }
}
