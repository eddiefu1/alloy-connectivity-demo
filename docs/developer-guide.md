# Alloy Connectivity API - Developer Guide

This guide provides comprehensive documentation for integrating Alloy Automation's Connectivity API into your applications. It covers authentication, data synchronization, connection management, and best practices.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Installation & Setup](#installation--setup)
4. [Authentication](#authentication)
5. [API Usage](#api-usage)
6. [Connection Management](#connection-management)
7. [Data Operations](#data-operations)
8. [Error Handling](#error-handling)
9. [Troubleshooting](#troubleshooting)
10. [Best Practices](#best-practices)

---

## Overview

The Alloy Connectivity API enables you to integrate with 200+ third-party services (like Notion, Slack, HubSpot, etc.) through a unified API. This integration handles:

- **OAuth 2.0 Authentication**: Secure, user-authorized connections to third-party services
- **Data Synchronization**: Read, write, and update operations across integrations
- **Connection Management**: Create, list, and manage authenticated connections
- **Unified Data Model**: Standardized API across all integrations

### Key Features

- ✅ Complete OAuth 2.0 implementation
- ✅ REST API and Node.js SDK support
- ✅ Web interface for connecting integrations
- ✅ Diagnostics and debugging tools
- ✅ Robust error handling
- ✅ Production-ready configuration

---

## Prerequisites

Before you begin, ensure you have:

### Required

1. **Node.js 18+** and npm installed
   ```bash
   node --version  # Should be 18.0.0 or higher
   npm --version
   ```

2. **Alloy Account**
   - Sign up at [https://runalloy.com](https://runalloy.com)
   - Access the dashboard at [https://app.runalloy.com](https://app.runalloy.com)

3. **API Credentials**
   - **API Key**: Get from Alloy Dashboard → Settings → API Keys
   - **User ID**: Get from Alloy Dashboard → Settings → API Keys
   - Both are required for API authentication

4. **Third-Party Service Account**
   - For example, a Notion workspace if integrating with Notion
   - Admin access to create OAuth applications (if required)

### Recommended

- TypeScript knowledge (the SDK is TypeScript-first)
- Familiarity with OAuth 2.0 flows
- Understanding of REST APIs
- Basic knowledge of Express.js (for backend server examples)

---

## Installation & Setup

### Step 1: Install Dependencies

```bash
npm install alloy-node axios express cors dotenv
npm install --save-dev typescript @types/node @types/express ts-node
```

### Step 2: Configure Environment Variables

Create a `.env` file in your project root:

```env
# Required: Get from Alloy Dashboard → Settings → API Keys
ALLOY_API_KEY=your_api_key_here
ALLOY_USER_ID=your_user_id_here

# Optional: API base URL (defaults to https://api.runalloy.com)
ALLOY_BASE_URL=https://api.runalloy.com

# Optional: Connection ID (obtained after OAuth flow)
CONNECTION_ID=your_connection_id_here
```

**⚠️ Security Note**: Never commit your `.env` file to version control. Add it to `.gitignore`.

### Step 3: TypeScript Configuration

Create a `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ES2020",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "strict": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

### Step 4: Verify Installation

Create a simple test file to verify your setup:

```typescript
// src/test-config.ts
import { getConfig } from './config.js';

try {
  const config = getConfig();
  console.log('✅ Configuration loaded successfully');
  console.log('API Key:', config.alloyApiKey.substring(0, 10) + '...');
  console.log('User ID:', config.alloyUserId);
} catch (error) {
  console.error('❌ Configuration error:', error.message);
}
```

Run it:

```bash
node --loader ts-node/esm src/test-config.ts
```

---

## Authentication

Alloy uses OAuth 2.0 for authenticating connections to third-party services. This section covers the complete OAuth flow.

### OAuth 2.0 Flow Overview

1. **Initiate OAuth**: Request an OAuth URL from Alloy
2. **User Authorization**: Redirect user to the OAuth URL
3. **Callback Handling**: Receive authorization code via callback
4. **Exchange Code**: Exchange authorization code for connection ID
5. **Use Connection**: Use the connection ID for API operations

### Implementation: Using the OAuth Flow Helper

```typescript
// src/oauth-flow.ts
import axios from 'axios';
import { getConfig } from './config.js';

export class AlloyOAuthFlow {
  private client: axios.AxiosInstance;
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
   * @param connectorId - The ID of the connector (e.g., 'notion', 'hubspot')
   * @param redirectUri - The URI to redirect to after OAuth completes
   * @returns OAuth URL and credential ID
   */
  async initiateOAuthFlow(
    connectorId: string,
    redirectUri: string
  ): Promise<{ oauthUrl: string; credentialId?: string }> {
    const response = await this.client.post(
      `/connectors/${connectorId}/credentials`,
      {
        connectorId: connectorId,
        authenticationType: 'oauth2',
        redirectUri: redirectUri,
        userId: this.config.alloyUserId,
      }
    );

    return {
      oauthUrl: response.data.oauthUrl,
      credentialId: response.data.credentialId,
    };
  }

  /**
   * Handle OAuth callback after user authorization
   * @param connectorId - The ID of the connector
   * @param code - The authorization code from the OAuth callback
   * @param state - The state parameter from the OAuth callback (optional)
   * @returns Connection ID and credential ID
   */
  async handleOAuthCallback(
    connectorId: string,
    code: string,
    state?: string
  ): Promise<{ connectionId: string; credentialId: string }> {
    const response = await this.client.post(
      `/connectors/${connectorId}/credentials/callback`,
      {
        code: code,
        userId: this.config.alloyUserId,
        ...(state && { state: state }),
      }
    );

    return {
      connectionId: response.data.connectionId || response.data.id,
      credentialId: response.data.credentialId || response.data.id,
    };
  }
}
```

### Complete OAuth Flow Example

```typescript
// src/connect-integration.ts
import { AlloyOAuthFlow } from './oauth-flow.js';
import { getConfig } from './config.js';

async function connectNotion() {
  const config = getConfig();
  const oauthFlow = new AlloyOAuthFlow();

  // Step 1: Initiate OAuth flow
  const connectorId = 'notion';
  const redirectUri = 'http://localhost:3000/oauth/callback';
  
  const { oauthUrl } = await oauthFlow.initiateOAuthFlow(
    connectorId,
    redirectUri
  );

  console.log('OAuth URL:', oauthUrl);
  console.log('Redirect user to this URL for authorization');

  // Step 2: After user authorizes and callback is received
  // (This would be handled by your server's callback endpoint)
  const code = 'authorization_code_from_callback';
  const { connectionId } = await oauthFlow.handleOAuthCallback(
    connectorId,
    code
  );

  console.log('Connection ID:', connectionId);
  console.log('Save this connection ID for API operations');
}

connectNotion();
```

### Server-Side OAuth Implementation

For a complete server implementation with Express:

```typescript
// src/server-oauth.ts
import express from 'express';
import { AlloyOAuthFlow } from './oauth-flow.js';

const app = express();
const oauthFlow = new AlloyOAuthFlow();

// Initiate OAuth flow
app.post('/api/oauth/initiate', async (req, res) => {
  try {
    const { connectorId, redirectUri } = req.body;
    
    const { oauthUrl, credentialId } = await oauthFlow.initiateOAuthFlow(
      connectorId,
      redirectUri || 'http://localhost:3000/oauth/callback'
    );

    res.json({
      success: true,
      oauthUrl: oauthUrl,
      credentialId: credentialId,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Handle OAuth callback
app.get('/oauth/callback', async (req, res) => {
  try {
    const { code, state, connectorId } = req.query;

    if (!code) {
      return res.status(400).send('Authorization code is required');
    }

    const { connectionId } = await oauthFlow.handleOAuthCallback(
      connectorId as string || 'notion',
      code as string,
      state as string
    );

    // Send success page with connection ID
    res.send(`
      <html>
        <body>
          <h1>Connection Successful!</h1>
          <p>Connection ID: <code>${connectionId}</code></p>
          <p>Save this connection ID for API operations.</p>
        </body>
      </html>
    `);
  } catch (error: any) {
    res.status(500).send(`Error: ${error.message}`);
  }
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
```

---

## API Usage

Alloy provides two ways to interact with the API:

1. **Node.js SDK** (Recommended for Node.js applications)
2. **REST API** (For any language or framework)

### Using the Node.js SDK

The Alloy Node.js SDK provides a simplified interface for API operations.

#### Installation

```bash
npm install alloy-node
```

#### Configuration

```typescript
// src/alloy-client.ts
import { UAPI } from 'alloy-node';
import { getConfig } from './config.js';

export class AlloyClient {
  private client: UAPI;
  private config: ReturnType<typeof getConfig>;

  constructor(config: ReturnType<typeof getConfig>) {
    this.config = config;
    this.client = new UAPI(config.alloyApiKey);
    
    // Set base URL
    if (this.client.url !== undefined) {
      const baseUrl = config.alloyBaseUrl.replace(/\/api$/, '');
      this.client.url = baseUrl;
    }
    
    // Set user ID
    this.client.userId = config.alloyUserId;
  }

  /**
   * Connect to a specific integration
   */
  async connectToIntegration(connectionId: string): Promise<void> {
    await this.client.connect(connectionId);
  }

  /**
   * Read data from an integration
   */
  async readData(entity: string): Promise<any[]> {
    // Example: Read pages from Notion
    const response = await this.client.CRM.listContacts();
    return response?.data || [];
  }

  /**
   * Create data in an integration
   */
  async createData(entity: string, data: any): Promise<any> {
    // Example: Create a page in Notion
    const response = await this.client.CRM.createContact(data);
    return response;
  }

  /**
   * Update data in an integration
   */
  async updateData(entity: string, recordId: string, updates: any): Promise<any> {
    // Example: Update a page in Notion
    const response = await this.client.CRM.updateContact(recordId, updates);
    return response;
  }
}
```

#### Usage Example

```typescript
// src/sdk-example.ts
import { AlloyClient } from './alloy-client.js';
import { getConfig } from './config.js';

async function main() {
  const config = getConfig();
  const client = new AlloyClient(config);

  // Connect to integration
  const connectionId = process.env.CONNECTION_ID;
  if (connectionId) {
    await client.connectToIntegration(connectionId);
  }

  // Read data
  const pages = await client.readData('pages');
  console.log('Pages:', pages);

  // Create data
  const newPage = await client.createData('pages', {
    title: 'New Page',
    content: 'Page content',
  });
  console.log('Created page:', newPage);

  // Update data
  const updatedPage = await client.updateData('pages', 'page_id', {
    title: 'Updated Title',
  });
  console.log('Updated page:', updatedPage);
}

main();
```

### Using the REST API

For direct REST API calls (useful for non-Node.js applications or custom implementations):

#### Base Configuration

```typescript
// src/rest-client.ts
import axios from 'axios';
import { getConfig } from './config.js';

export class AlloyRestClient {
  private client: axios.AxiosInstance;
  private apiKey: string;
  private userId: string;

  constructor(apiKey: string, baseUrl: string, userId: string) {
    this.apiKey = apiKey;
    this.userId = userId;
    
    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'x-api-version': '2025-09',
      },
      timeout: 30000,
    });
  }

  /**
   * Read data from an integration
   */
  async readData(
    userId: string,
    integrationId: string,
    entity: string
  ): Promise<any> {
    const response = await this.client.get(
      `/users/${userId}/integrations/${integrationId}/data/${entity}`
    );
    return response.data;
  }

  /**
   * Create data in an integration
   */
  async createData(
    userId: string,
    integrationId: string,
    entity: string,
    data: any
  ): Promise<any> {
    const response = await this.client.post(
      `/users/${userId}/integrations/${integrationId}/data/${entity}`,
      data
    );
    return response.data;
  }

  /**
   * Update data in an integration
   */
  async updateData(
    userId: string,
    integrationId: string,
    entity: string,
    recordId: string,
    data: any
  ): Promise<any> {
    const response = await this.client.put(
      `/users/${userId}/integrations/${integrationId}/data/${entity}/${recordId}`,
      data
    );
    return response.data;
  }
}
```

#### REST API Usage Example

```typescript
// src/rest-api-example.ts
import { AlloyRestClient } from './rest-client.js';
import { getConfig } from './config.js';

async function main() {
  const config = getConfig();
  const client = new AlloyRestClient(
    config.alloyApiKey,
    config.alloyBaseUrl,
    config.alloyUserId
  );

  // Read data
  const pages = await client.readData(
    config.alloyUserId,
    'notion',
    'pages'
  );
  console.log('Pages:', pages);

  // Create data
  const newPage = await client.createData(
    config.alloyUserId,
    'notion',
    'pages',
    {
      title: 'New Page',
      content: 'Page content',
    }
  );
  console.log('Created page:', newPage);

  // Update data
  const updatedPage = await client.updateData(
    config.alloyUserId,
    'notion',
    'pages',
    'page_id',
    {
      title: 'Updated Title',
    }
  );
  console.log('Updated page:', updatedPage);
}

main();
```

---

## Connection Management

### List All Connections

```typescript
// List all connections for a user
async function listConnections(): Promise<any[]> {
  const config = getConfig();
  const client = axios.create({
    baseURL: 'https://production.runalloy.com',
    headers: {
      'Authorization': `Bearer ${config.alloyApiKey}`,
      'x-api-version': '2025-09',
    },
  });

  const response = await client.get(
    `/users/${config.alloyUserId}/credentials`
  );

  return response.data.data || response.data || [];
}

// Usage
const connections = await listConnections();
console.log('Connections:', connections);
```

### Get Connection Details

```typescript
// Get connection details by ID
async function getConnection(connectionId: string): Promise<any> {
  const config = getConfig();
  const client = axios.create({
    baseURL: 'https://production.runalloy.com',
    headers: {
      'Authorization': `Bearer ${config.alloyApiKey}`,
      'x-api-version': '2025-09',
    },
  });

  const response = await client.get(`/credentials/${connectionId}`);
  return response.data;
}

// Usage
const connection = await getConnection('your_connection_id');
console.log('Connection:', connection);
```

### Check Connection Status

```typescript
// Check if a connection is active
async function checkConnectionStatus(connectionId: string): Promise<boolean> {
  try {
    const connection = await getConnection(connectionId);
    return connection.status === 'active' || connection.status === 'connected';
  } catch (error) {
    return false;
  }
}

// Usage
const isActive = await checkConnectionStatus('your_connection_id');
console.log('Connection active:', isActive);
```

### Using Existing Connections

```typescript
// Find existing connection for a connector
async function findConnectionByConnector(
  connectorId: string
): Promise<string | null> {
  const connections = await listConnections();
  
  const connection = connections.find(
    (conn: any) =>
      conn.connectorId === connectorId ||
      conn.integrationId === connectorId
  );

  return connection?.id || connection?.connectionId || null;
}

// Usage
const notionConnectionId = await findConnectionByConnector('notion');
if (notionConnectionId) {
  console.log('Found Notion connection:', notionConnectionId);
} else {
  console.log('No Notion connection found. Initiate OAuth flow.');
}
```

---

## Data Operations

### Read Operations

Read data from connected integrations:

```typescript
// Read pages from Notion
async function readNotionPages(connectionId: string): Promise<any[]> {
  const config = getConfig();
  const client = new AlloyClient(config);
  
  await client.connectToIntegration(connectionId);
  const pages = await client.readData('pages');
  
  return pages;
}

// Usage
const pages = await readNotionPages(process.env.CONNECTION_ID!);
console.log('Pages:', pages);
```

### Write Operations

Create new data in integrations:

```typescript
// Create a new page in Notion
async function createNotionPage(
  connectionId: string,
  pageData: { title: string; content: string }
): Promise<any> {
  const config = getConfig();
  const client = new AlloyClient(config);
  
  await client.connectToIntegration(connectionId);
  const newPage = await client.createData('pages', pageData);
  
  return newPage;
}

// Usage
const newPage = await createNotionPage(
  process.env.CONNECTION_ID!,
  {
    title: 'Project Planning',
    content: 'This is a new page created via Alloy API',
  }
);
console.log('Created page:', newPage);
```

### Update Operations

Update existing data:

```typescript
// Update an existing page in Notion
async function updateNotionPage(
  connectionId: string,
  pageId: string,
  updates: any
): Promise<any> {
  const config = getConfig();
  const client = new AlloyClient(config);
  
  await client.connectToIntegration(connectionId);
  const updatedPage = await client.updateData('pages', pageId, updates);
  
  return updatedPage;
}

// Usage
const updatedPage = await updateNotionPage(
  process.env.CONNECTION_ID!,
  'page_123',
  {
    title: 'Updated Title',
    content: 'Updated content',
  }
);
console.log('Updated page:', updatedPage);
```

### Complete Data Sync Example

```typescript
// Complete example: Read, create, and update
async function syncNotionData(connectionId: string) {
  const config = getConfig();
  const client = new AlloyClient(config);
  
  await client.connectToIntegration(connectionId);

  // 1. Read existing pages
  console.log('Reading pages...');
  const pages = await client.readData('pages');
  console.log(`Found ${pages.length} pages`);

  // 2. Create a new page
  console.log('Creating new page...');
  const newPage = await client.createData('pages', {
    title: 'New Page',
    content: 'Page content',
  });
  console.log('Created page:', newPage.id);

  // 3. Update the new page
  console.log('Updating page...');
  const updatedPage = await client.updateData('pages', newPage.id, {
    title: 'Updated Page Title',
  });
  console.log('Updated page:', updatedPage.id);
}

// Usage
syncNotionData(process.env.CONNECTION_ID!);
```

---

## Error Handling

### Common Error Patterns

```typescript
// Error handling wrapper
async function handleApiCall<T>(
  apiCall: () => Promise<T>
): Promise<{ data?: T; error?: string }> {
  try {
    const data = await apiCall();
    return { data };
  } catch (error: any) {
    if (error.response) {
      // API error response
      const status = error.response.status;
      const message = error.response.data?.error?.message || error.message;
      
      console.error(`API Error (${status}):`, message);
      
      return {
        error: `API Error: ${message}`,
      };
    } else if (error.request) {
      // No response received
      console.error('No response received:', error.message);
      return {
        error: 'No response from server',
      };
    } else {
      // Request setup error
      console.error('Request error:', error.message);
      return {
        error: error.message,
      };
    }
  }
}

// Usage
const result = await handleApiCall(() =>
  oauthFlow.initiateOAuthFlow('notion', 'http://localhost:3000/oauth/callback')
);

if (result.error) {
  console.error('Error:', result.error);
} else {
  console.log('OAuth URL:', result.data?.oauthUrl);
}
```

### Error Types and Handling

```typescript
// Specific error handling
async function initiateOAuthWithErrorHandling(
  connectorId: string,
  redirectUri: string
) {
  try {
    const { oauthUrl } = await oauthFlow.initiateOAuthFlow(
      connectorId,
      redirectUri
    );
    return { success: true, oauthUrl };
  } catch (error: any) {
    if (error.response?.status === 400) {
      // Validation error
      const details = error.response.data?.error?.details;
      if (details) {
        const userIdError = details.find((d: any) => d.properties === 'userId');
        if (userIdError) {
          return {
            success: false,
            error: 'Invalid user ID format',
            suggestion: 'Check your ALLOY_USER_ID in .env file',
          };
        }
      }
      return {
        success: false,
        error: error.response.data?.error?.message || 'Validation error',
      };
    } else if (error.response?.status === 401) {
      // Authentication error
      return {
        success: false,
        error: 'Authentication failed',
        suggestion: 'Check your ALLOY_API_KEY in .env file',
      };
    } else if (error.response?.status === 403) {
      // Authorization error
      return {
        success: false,
        error: 'Access forbidden',
        suggestion: 'Check your API key permissions',
      };
    } else {
      // Other errors
      return {
        success: false,
        error: error.message || 'Unknown error',
      };
    }
  }
}
```

---

## Troubleshooting

### Common Issues and Solutions

#### 1. "ALLOY_API_KEY environment variable is required"

**Problem**: API key is not set in environment variables.

**Solution**:
```bash
# Check if .env file exists
ls -la .env

# Verify .env file contains:
# ALLOY_API_KEY=your_api_key_here
# ALLOY_USER_ID=your_user_id_here

# Restart your application after updating .env
```

#### 2. "Invalid userId format"

**Problem**: User ID format is incorrect.

**Solution**:
- User IDs should be in one of these formats:
  - `user_xxx...` (starts with "user_")
  - UUID format: `12345678-1234-1234-1234-123456789abc`
  - MongoDB ObjectId: 24 hex characters
- Get your correct User ID from Alloy Dashboard → Settings → API Keys
- Update `.env` file and restart the application

#### 3. "OAuth callback received but no authorization code"

**Problem**: OAuth callback URL doesn't contain the authorization code.

**Solutions**:
- Check browser address bar for the exact callback URL
- Verify redirect URI matches exactly between:
  - OAuth initiation request
  - Alloy dashboard OAuth configuration
  - Callback endpoint URL
- Check if connection was created anyway (sometimes Alloy creates it without redirecting)
- List connections to see if a new connection exists

```typescript
// Check for existing connections
const connections = await oauthFlow.listConnections();
const notionConnections = connections.filter(
  (conn: any) => conn.connectorId === 'notion'
);
if (notionConnections.length > 0) {
  console.log('Found existing connection:', notionConnections[0].id);
}
```

#### 4. "Connection not yet established"

**Problem**: No connection ID available or connection is invalid.

**Solution**:
- Complete OAuth flow first to get a connection ID
- Add connection ID to `.env` file: `CONNECTION_ID=your_connection_id`
- Verify connection exists and is active:
  ```typescript
  const connection = await getConnection(connectionId);
  console.log('Connection status:', connection.status);
  ```

#### 5. "Authentication failed" (401 error)

**Problem**: API key is invalid or expired.

**Solution**:
- Verify API key in Alloy Dashboard → Settings → API Keys
- Check if API key has correct permissions
- Regenerate API key if necessary
- Ensure API key is correctly set in `.env` file (no extra spaces or quotes)

#### 6. "Access forbidden" (403 error)

**Problem**: API key doesn't have required permissions.

**Solution**:
- Check API key permissions in Alloy Dashboard
- Ensure API key has access to:
  - Create credentials (for OAuth)
  - List credentials (for connection management)
  - Access user data (for API operations)

#### 7. "Failed to read pages" or "Failed to create page"

**Problem**: Connection ID is invalid or connection is not active.

**Solution**:
- Verify connection ID is correct
- Check connection status:
  ```typescript
  const connection = await getConnection(connectionId);
  if (connection.status !== 'active') {
    console.log('Connection is not active. Re-authenticate.');
  }
  ```
- Re-authenticate if connection is expired or revoked
- Verify the integration (e.g., Notion) has the required permissions

### Diagnostic Endpoints

Use these diagnostic endpoints to troubleshoot issues:

```typescript
// Check configuration
app.get('/api/config/check', (req, res) => {
  const config = getConfig();
  res.json({
    hasApiKey: !!config.alloyApiKey,
    hasUserId: !!config.alloyUserId,
    apiKeyLength: config.alloyApiKey?.length || 0,
    userId: config.alloyUserId,
    baseUrl: config.alloyBaseUrl,
  });
});

// Comprehensive diagnostics
app.get('/api/diagnose', async (req, res) => {
  try {
    // Test API connection
    const connections = await oauthFlow.listConnections();
    
    res.json({
      success: true,
      apiConnection: 'ok',
      connectionCount: connections.length,
      connections: connections.map((conn: any) => ({
        id: conn.id,
        connectorId: conn.connectorId,
        status: conn.status,
      })),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});
```

### Debugging Tips

1. **Enable Detailed Logging**:
   ```typescript
   // Add console.log statements for debugging
   console.log('OAuth URL:', oauthUrl);
   console.log('Callback URL:', callbackUrl);
   console.log('Connection ID:', connectionId);
   ```

2. **Check API Responses**:
   ```typescript
   try {
     const response = await client.post('/endpoint', data);
     console.log('Response:', JSON.stringify(response.data, null, 2));
   } catch (error: any) {
     console.error('Error response:', error.response?.data);
     console.error('Status:', error.response?.status);
   }
   ```

3. **Verify Environment Variables**:
   ```typescript
   console.log('API Key:', process.env.ALLOY_API_KEY?.substring(0, 10) + '...');
   console.log('User ID:', process.env.ALLOY_USER_ID);
   console.log('Connection ID:', process.env.CONNECTION_ID);
   ```

4. **Test API Connectivity**:
   ```typescript
   // Test API connectivity
   const response = await axios.get('https://api.runalloy.com/health', {
     headers: {
       'Authorization': `Bearer ${config.alloyApiKey}`,
     },
   });
   console.log('API health:', response.data);
   ```

---

## Best Practices

### Security

1. **Never commit `.env` files**:
   ```bash
   # Add to .gitignore
   echo ".env" >> .gitignore
   ```

2. **Use environment variables for secrets**:
   ```typescript
   // ✅ Good
   const apiKey = process.env.ALLOY_API_KEY;
   
   // ❌ Bad
   const apiKey = 'your_api_key_here';
   ```

3. **Rotate API keys regularly**:
   - Regenerate API keys periodically
   - Use different keys for development and production
   - Revoke unused keys

4. **Validate user input**:
   ```typescript
   // Validate connection ID format
   function isValidConnectionId(id: string): boolean {
     return /^[a-f0-9]{24}$/i.test(id) || id.startsWith('conn_');
   }
   ```

### Error Handling

1. **Implement retry logic**:
   ```typescript
   async function retryApiCall<T>(
     apiCall: () => Promise<T>,
     maxRetries: number = 3
   ): Promise<T> {
     for (let i = 0; i < maxRetries; i++) {
       try {
         return await apiCall();
       } catch (error) {
         if (i === maxRetries - 1) throw error;
         await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
       }
     }
     throw new Error('Max retries exceeded');
   }
   ```

2. **Handle rate limiting**:
   ```typescript
   async function handleRateLimit<T>(
     apiCall: () => Promise<T>
   ): Promise<T> {
     try {
       return await apiCall();
     } catch (error: any) {
       if (error.response?.status === 429) {
         const retryAfter = error.response.headers['retry-after'] || 60;
         await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
         return await apiCall();
       }
       throw error;
     }
   }
   ```

### Connection Management

1. **Cache connection IDs**:
   ```typescript
   // Cache connections to avoid repeated API calls
   const connectionCache = new Map<string, string>();
   
   async function getCachedConnectionId(
     connectorId: string
   ): Promise<string | null> {
     if (connectionCache.has(connectorId)) {
       return connectionCache.get(connectorId)!;
     }
     
     const connections = await listConnections();
     const connection = connections.find(
       (conn: any) => conn.connectorId === connectorId
     );
     
     if (connection) {
       connectionCache.set(connectorId, connection.id);
       return connection.id;
     }
     
     return null;
   }
   ```

2. **Verify connection status before operations**:
   ```typescript
   async function ensureConnectionActive(
     connectionId: string
   ): Promise<boolean> {
     try {
       const connection = await getConnection(connectionId);
       return connection.status === 'active';
     } catch (error) {
       return false;
     }
   }
   ```

### Code Organization

1. **Separate concerns**:
   ```typescript
   // ✅ Good: Separate OAuth, API client, and business logic
   // src/oauth-flow.ts - OAuth handling
   // src/alloy-client.ts - API client
   // src/services/notion-service.ts - Business logic
   ```

2. **Use TypeScript types**:
   ```typescript
   // Define types for better type safety
   interface Connection {
     id: string;
     connectorId: string;
     status: 'active' | 'inactive' | 'expired';
     createdAt: string;
   }
   
   interface Page {
     id: string;
     title: string;
     content: string;
     createdAt: string;
   }
   ```

3. **Implement logging**:
   ```typescript
   // Use a logging library (e.g., winston, pino)
   import logger from './logger.js';
   
   logger.info('OAuth flow initiated', { connectorId });
   logger.error('OAuth flow failed', { error: error.message });
   ```

### Performance

1. **Batch operations when possible**:
   ```typescript
   // Instead of multiple API calls
   // ✅ Good: Batch operations
   const pages = await client.readData('pages');
   const updates = pages.map(page => updatePage(page.id, updates));
   await Promise.all(updates);
   ```

2. **Use pagination for large datasets**:
   ```typescript
   async function readAllPages(
     connectionId: string,
     pageSize: number = 100
   ): Promise<any[]> {
     const allPages: any[] = [];
     let offset = 0;
     
     while (true) {
       const pages = await client.readData('pages', {
         limit: pageSize,
         offset: offset,
       });
       
       if (pages.length === 0) break;
       
       allPages.push(...pages);
       offset += pageSize;
     }
     
     return allPages;
   }
   ```

---

## Additional Resources

- [Alloy Documentation](https://docs.runalloy.com)
- [Alloy API Reference](https://docs.runalloy.com/api-reference)
- [Alloy Node.js SDK](https://github.com/alloy-automation/alloy-node)
- [Alloy Dashboard](https://app.runalloy.com)
- [OAuth 2.0 Specification](https://oauth.net/2/)

---

## Support

For additional support:

1. **Check Documentation**: [https://docs.runalloy.com](https://docs.runalloy.com)
2. **Community Support**: [Alloy Community Forum](https://community.runalloy.com)
3. **API Support**: Contact Alloy support through the dashboard
4. **GitHub Issues**: Report bugs or request features on GitHub

---

**Last Updated**: 2025-01-27

**Version**: 1.0.0

