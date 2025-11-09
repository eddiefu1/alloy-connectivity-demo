import axios, { AxiosInstance } from 'axios';
import { getConfig } from './config.js';

/**
 * OAuth Flow Helper for Alloy Automation
 * 
 * This module helps initiate OAuth flows and create connections programmatically.
 */
export class AlloyOAuthFlow {
  private client: AxiosInstance;
  private config: ReturnType<typeof getConfig>;
  private apiVersion: string = '2025-09'; // Update to latest API version as needed

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
   * Initiate OAuth flow for a connector (e.g., Notion, HubSpot, etc.)
   * 
   * @param connectorId - The ID of the connector (e.g., 'notion', 'hubspot')
   * @param redirectUri - The URI to redirect to after OAuth completes
   * @returns OAuth URL that the user should be redirected to
   */
  async initiateOAuthFlow(
    connectorId: string,
    redirectUri: string
  ): Promise<{ oauthUrl: string; credentialId?: string }> {
    try {
      console.log(`\n🔐 Initiating OAuth flow for ${connectorId}...`);
      console.log(`   Redirect URI: ${redirectUri}`);
      console.log(`   User ID from config: ${this.config.alloyUserId}`);

      // Try to get user ID from API first, or use the one from config
      let userId = this.config.alloyUserId;
      
      // Validate userId format (MongoDB ObjectId is 24 hex characters, or UUID format, or user_xxx format)
      const isValidUserId = userId && (
        userId.length === 24 && /^[a-f0-9]{24}$/i.test(userId) || // MongoDB ObjectId
        userId.length === 36 && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId) || // UUID
        userId.startsWith('user_') // user_xxx format
      );

      if (!isValidUserId) {
        console.log(`   ⚠️  User ID "${userId}" may be invalid format, but attempting to use it...`);
      }

      // Build request body with userId (API requires it)
      const requestBody: any = {
        connectorId: connectorId,
        authenticationType: 'oauth2',
        redirectUri: redirectUri,
        userId: userId, // Always include userId as API requires it
      };

      console.log(`   Request body: ${JSON.stringify(requestBody, null, 2)}`);
      console.log(`   Endpoint: POST /connectors/${connectorId}/credentials`);

      // Make the request
      let response;
      try {
        response = await this.client.post(
          `/connectors/${connectorId}/credentials`,
          requestBody
        );
      } catch (error: any) {
        // If it fails and we didn't include userId, the API might need it
        // But we've already validated, so throw the error
        if (error.response?.status === 400 && error.response?.data?.error?.details) {
          const details = error.response.data.error.details;
          const userIdError = details.find((d: any) => d.properties === 'userId');
          if (userIdError && !requestBody.userId) {
            throw new Error(
              `The API requires a valid userId. Please check your ALLOY_USER_ID in .env file. ` +
              `Current value: "${this.config.alloyUserId}". ` +
              `User IDs should be in format like "user_xxx" or a UUID. ` +
              `Get your user ID from: https://app.runalloy.com → Settings → API Keys`
            );
          }
        }
        throw error;
      }

      const oauthUrl = response.data.oauthUrl;
      const credentialId = response.data.credentialId;

      console.log(`✓ OAuth flow initiated successfully`);
      console.log(`   OAuth URL: ${oauthUrl}`);
      if (credentialId) {
        console.log(`   Credential ID: ${credentialId}`);
      }

      return {
        oauthUrl: oauthUrl,
        credentialId: credentialId,
      };
    } catch (error: any) {
      console.error(`Failed to initiate OAuth flow for ${connectorId}:`, error.message);
      if (error.response) {
        console.error('Response:', error.response.data);
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
      console.log(`\n🔄 Handling OAuth callback for ${connectorId}...`);

      // Validate userId is available
      if (!this.config.alloyUserId) {
        throw new Error('ALLOY_USER_ID is required in .env file for OAuth callback');
      }

      // Build callback request body with required fields
      const callbackBody: any = {
        code: code,
        userId: this.config.alloyUserId,
      };

      // Add state if provided
      if (state) {
        callbackBody.state = state;
      }

      console.log(`   Callback body: ${JSON.stringify({ ...callbackBody, code: '[REDACTED]' }, null, 2)}`);
      console.log(`   Endpoint: POST /connectors/${connectorId}/credentials/callback`);

      const response = await this.client.post(
        `/connectors/${connectorId}/credentials/callback`,
        callbackBody
      );

      console.log(`   Response status: ${response.status}`);
      console.log(`   Response data keys: ${Object.keys(response.data || {}).join(', ')}`);

      const connectionId = response.data.connectionId || response.data.id;
      const credentialId = response.data.credentialId || response.data.id;

      console.log(`✓ OAuth callback processed successfully`);
      console.log(`   Connection ID: ${connectionId}`);
      console.log(`   Credential ID: ${credentialId}`);

      return {
        connectionId: connectionId,
        credentialId: credentialId,
      };
    } catch (error: any) {
      console.error(`Failed to handle OAuth callback for ${connectorId}:`, error.message);
      if (error.response) {
        console.error('Response:', error.response.data);
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
      console.log(`\n📋 Listing all connections...`);

      const response = await this.client.get(
        `/users/${this.config.alloyUserId}/credentials`
      );

      const connections = response.data.data || response.data || [];

      console.log(`✓ Found ${connections.length} connection(s)`);
      connections.forEach((conn: any, index: number) => {
        console.log(`   ${index + 1}. ${conn.connectorId || conn.integrationId} - ${conn.id}`);
      });

      return connections;
    } catch (error: any) {
      console.error('Failed to list connections:', error.message);
      if (error.response) {
        console.error('Response:', error.response.data);
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
      console.log(`\n🔍 Fetching connection ${connectionId}...`);

      const response = await this.client.get(
        `/credentials/${connectionId}`
      );

      console.log(`✓ Connection retrieved successfully`);
      return response.data;
    } catch (error: any) {
      console.error(`Failed to get connection ${connectionId}:`, error.message);
      if (error.response) {
        console.error('Response:', error.response.data);
      }
      throw error;
    }
  }
}

/**
 * Example: Initiate OAuth flow for Notion
 */
async function exampleInitiateNotionOAuth() {
  const oauthFlow = new AlloyOAuthFlow();

  try {
    // Step 1: Initiate OAuth flow
    const { oauthUrl } = await oauthFlow.initiateOAuthFlow(
      'notion',
      'http://localhost:3000/oauth/callback' // Your callback URL
    );

    console.log('\n📝 Next steps:');
    console.log(`1. Redirect user to: ${oauthUrl}`);
    console.log('2. User authorizes the connection');
    console.log('3. User is redirected back to your callback URL');
    console.log('4. Extract the "code" parameter from the callback URL');
    console.log('5. Call handleOAuthCallback() with the code');

  } catch (error: any) {
    console.error('OAuth flow initiation failed:', error.message);
  }
}

/**
 * Example: Handle OAuth callback
 */
async function exampleHandleCallback() {
  const oauthFlow = new AlloyOAuthFlow();

  try {
    // Step 4: Handle the callback (this would be called from your callback endpoint)
    const { connectionId } = await oauthFlow.handleOAuthCallback(
      'notion',
      'authorization_code_from_callback', // Extract from callback URL
      'optional_state_parameter'
    );

    console.log('\n✅ Connection created!');
    console.log(`   Connection ID: ${connectionId}`);
    console.log(`   Add this to your .env file: CONNECTION_ID=${connectionId}`);

  } catch (error: any) {
    console.error('OAuth callback handling failed:', error.message);
  }
}

// Export for use in other modules
export { exampleInitiateNotionOAuth, exampleHandleCallback };

// Uncomment to run examples directly
// exampleInitiateNotionOAuth();

