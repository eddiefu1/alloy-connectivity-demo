# Alloy Connectivity API - Official Integration Documentation

Complete guide for integrating with Alloy's Connectivity API to connect and sync data with third-party services like Notion, Slack, Google Drive, and 200+ other integrations.

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Setup Instructions](#setup-instructions)
4. [Authentication](#authentication)
5. [API Usage](#api-usage)
6. [Code Examples](#code-examples)
7. [Troubleshooting](#troubleshooting)
8. [API Reference](#api-reference)
9. [Best Practices](#best-practices)

---

## Overview

The Alloy Connectivity API provides a unified interface to connect your application with 200+ third-party services through a single API. This documentation demonstrates integration with Notion, but the same patterns apply to all supported connectors.

### Key Features

- **OAuth 2.0 Authentication**: Secure, standard OAuth flow for connecting services
- **Unified API**: Single API interface for multiple integrations
- **Read & Write Operations**: Full CRUD support for connected services
- **Connection Management**: List, verify, and manage connections programmatically
- **Production Ready**: Built for scalability and reliability

### How It Works

```
Your Application → Alloy Connectivity API → Third-Party Service (Notion)
```

1. Authenticate with Alloy using your API key
2. Connect a third-party service via OAuth 2.0
3. Use Connection ID to make API calls through Alloy
4. Sync Data between your app and the connected service

---

## Prerequisites

Before you begin, ensure you have:

### Required

- **Node.js 18+** and npm installed
- **Alloy Account**: [Sign up at runalloy.com](https://runalloy.com)
- **API Credentials**: Get from [Alloy Dashboard](https://app.runalloy.com)
  - API Key (Settings → API Keys → Create API Key)
  - User ID (found in Settings → API Keys section)

### Getting Your Credentials

1. **Create Alloy Account**
   - Visit [https://runalloy.com](https://runalloy.com)
   - Sign up and verify your email

2. **Get API Key**
   - Log in to [Alloy Dashboard](https://app.runalloy.com)
   - Navigate to **Settings** → **API Keys**
   - Click **Create API Key**
   - Copy and securely store your API key

3. **Get User ID**
   - Found in the same **Settings** → **API Keys** section
   - Copy your User ID

---

## Setup Instructions

### Step 1: Install Dependencies

```bash
npm install axios dotenv
# or
yarn add axios dotenv
```

### Step 2: Configure Environment Variables

Create a `.env` file in your project root:

```env
# Required: Your Alloy API credentials
ALLOY_API_KEY=your_api_key_here
ALLOY_USER_ID=your_user_id_here

# Required: Connection ID (obtained after OAuth flow)
CONNECTION_ID=your_connection_id_here

# Optional: API Configuration
ALLOY_BASE_URL=https://production.runalloy.com
ALLOY_ENVIRONMENT=production

# Optional: Custom OAuth Redirect URI
OAUTH_REDIRECT_URI=http://localhost:3000/oauth/callback
```

**Security Note**: Never commit your `.env` file. Add it to `.gitignore`:

```gitignore
.env
.env.local
.env.*.local
```

### Step 3: Basic Setup Code

Create `config.ts`:

```typescript
// config.ts
import dotenv from 'dotenv';

dotenv.config();

export function getConfig() {
  const apiKey = process.env.ALLOY_API_KEY;
  const userId = process.env.ALLOY_USER_ID;
  const baseUrl = process.env.ALLOY_BASE_URL || 'https://production.runalloy.com';

  if (!apiKey) {
    throw new Error('ALLOY_API_KEY environment variable is required');
  }

  if (!userId) {
    throw new Error('ALLOY_USER_ID environment variable is required');
  }

  return {
    alloyApiKey: apiKey,
    alloyUserId: userId,
    alloyBaseUrl: baseUrl,
  };
}
```

### Step 4: Project Structure

Create the following files:

```
your-project/
├── .env                 # Environment variables
├── config.ts            # Configuration file
├── oauth-flow.ts        # OAuth flow handler
├── notion-client.ts     # Notion API client
├── connect-notion.ts    # OAuth connection script
└── example.ts           # Example usage script
```

---

## Authentication

Alloy uses **OAuth 2.0** for connecting third-party services. The authentication flow consists of two main steps:

1. **Initiate OAuth Flow**: Get an authorization URL
2. **Handle OAuth Callback**: Exchange authorization code for Connection ID

### Step 1: Create OAuth Flow Handler

Create `oauth-flow.ts`:

```typescript
// oauth-flow.ts
import axios, { AxiosInstance } from 'axios';
import { getConfig } from './config.js';

export class AlloyOAuthFlow {
  private client: AxiosInstance;
  private config: ReturnType<typeof getConfig>;

  constructor() {
    this.config = getConfig();
    this.client = axios.create({
      baseURL: this.config.alloyBaseUrl,
      headers: {
        'Authorization': `Bearer ${this.config.alloyApiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Initiate OAuth flow for a connector
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
   * @param connectorId - The ID of the connector
   * @param code - The authorization code from the OAuth callback
   * @param credentialId - The credential ID from OAuth initiation (optional)
   * @returns Connection/credential information including connection ID
   */
  async handleOAuthCallback(
    connectorId: string,
    code: string,
    credentialId?: string
  ): Promise<{ connectionId: string; credentialId: string }> {
    try {
      if (!this.config.alloyUserId) {
        throw new Error('ALLOY_USER_ID is required in .env file for OAuth callback');
      }

      const callbackBody: any = {
        code: code,
        userId: this.config.alloyUserId,
      };

      if (credentialId) {
        callbackBody.credentialId = credentialId;
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
        console.error('API Error Response:', JSON.stringify(error.response.data, null, 2));
      }
      throw error;
    }
  }

  /**
   * List all connections for the authenticated user
   */
  async listConnections(): Promise<any[]> {
    try {
      const response = await this.client.get('/credentials');
      return response.data || [];
    } catch (error: any) {
      console.error('Failed to list connections:', error.message);
      if (error.response?.data) {
        console.error('API Error:', error.response.data);
      }
      throw error;
    }
  }
}
```

### Step 2: Complete OAuth Connection Script

Create `connect-notion.ts`:

```typescript
// connect-notion.ts
import { AlloyOAuthFlow } from './oauth-flow.js';
import http from 'http';
import url from 'url';

async function connectNotion() {
  const oauthFlow = new AlloyOAuthFlow();
  const connectorId = 'notion';
  const redirectUri = process.env.OAUTH_REDIRECT_URI || 'http://localhost:3000/oauth/callback';

  try {
    // Step 1: Initiate OAuth flow
    console.log('Initiating OAuth flow...');
    const { oauthUrl, credentialId } = await oauthFlow.initiateOAuthFlow(
      connectorId,
      redirectUri
    );

    console.log(`\n✅ OAuth URL received`);
    console.log(`🔗 Open this URL in your browser: ${oauthUrl}\n`);

    // Step 2: Start local server to catch callback
    const server = http.createServer(async (req, res) => {
      const parsedUrl = url.parse(req.url || '', true);

      if (parsedUrl.pathname === '/oauth/callback') {
        const code = parsedUrl.query.code as string;
        const error = parsedUrl.query.error as string;

        if (error) {
          console.error(`❌ OAuth Error: ${error}`);
          res.writeHead(400, { 'Content-Type': 'text/html' });
          res.end(`<h1>OAuth Error</h1><p>${error}</p>`);
          server.close();
          return;
        }

        if (code) {
          try {
            // Step 3: Handle callback
            const { connectionId } = await oauthFlow.handleOAuthCallback(
              connectorId,
              code,
              credentialId
            );

            console.log(`\n✅ Connection established!`);
            console.log(`🔗 Connection ID: ${connectionId}`);
            console.log(`\n📝 Add this to your .env file:`);
            console.log(`   CONNECTION_ID=${connectionId}`);

            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(`
              <h1>✅ Success!</h1>
              <p>Connection ID: <code>${connectionId}</code></p>
              <p>Add this to your .env file: <code>CONNECTION_ID=${connectionId}</code></p>
            `);

            server.close();
          } catch (callbackError: any) {
            console.error('❌ Callback error:', callbackError.message);
            res.writeHead(500, { 'Content-Type': 'text/html' });
            res.end(`<h1>Error</h1><p>${callbackError.message}</p>`);
            server.close();
          }
        }
      }
    });

    server.listen(3000, () => {
      console.log(`📡 Server listening on http://localhost:3000`);
      console.log(`⏳ Waiting for OAuth callback...`);
    });
  } catch (error: any) {
    console.error('❌ Failed to connect:', error.message);
    process.exit(1);
  }
}

connectNotion();
```

### Running the OAuth Flow

```bash
# Using Node.js with ts-node
npx ts-node connect-notion.ts

# Or compile first
tsc connect-notion.ts
node connect-notion.js
```

This will:
1. Start a local server on port 3000
2. Print an OAuth URL to open in your browser
3. After authorization, display your Connection ID
4. Add the Connection ID to your `.env` file

---

## API Usage

Once you have a Connection ID, you can make API calls to the connected service through Alloy's Connectivity API.

### Creating a Client

Create `notion-client.ts`:

```typescript
// notion-client.ts
import axios, { AxiosInstance } from 'axios';
import { getConfig } from './config.js';

export class NotionClient {
  private client: AxiosInstance;
  private config: ReturnType<typeof getConfig>;
  private connectionId: string;

  constructor(config: ReturnType<typeof getConfig>, connectionId: string) {
    this.config = config;
    this.connectionId = connectionId;
    this.client = axios.create({
      baseURL: config.alloyBaseUrl,
      headers: {
        'Authorization': `Bearer ${config.alloyApiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Execute an action on the connected service
   */
  async executeAction(
    actionId: string,
    parameters: any = {}
  ): Promise<any> {
    try {
      const response = await this.client.post(
        `/connectors/notion/actions/${actionId}`,
        {
          credentialId: this.connectionId,
          parameters: parameters,
        }
      );

      return response.data;
    } catch (error: any) {
      console.error(`Failed to execute action ${actionId}:`, error.message);
      if (error.response?.data) {
        console.error('API Error:', error.response.data);
      }
      throw error;
    }
  }

  /**
   * Search for pages
   */
  async searchPages(
    query?: string,
    filter?: any
  ): Promise<any[]> {
    return await this.executeAction('post-search', {
      query: query,
      filter: filter || { value: 'page', property: 'object' },
    });
  }

  /**
   * Get page by ID
   */
  async getPage(pageId: string): Promise<any> {
    return await this.executeAction('get-page', {
      page_id: pageId,
    });
  }

  /**
   * Create a new page
   */
  async createPage(pageData: {
    parent: { type: string; [key: string]: any };
    properties: Record<string, any>;
  }): Promise<any> {
    return await this.executeAction('post-page', pageData);
  }

  /**
   * Update an existing page
   */
  async updatePage(
    pageId: string,
    updates: { properties: Record<string, any> }
  ): Promise<any> {
    return await this.executeAction('patch-page', {
      page_id: pageId,
      ...updates,
    });
  }

  /**
   * Get database by ID
   */
  async getDatabase(databaseId: string): Promise<any> {
    return await this.executeAction('get-database', {
      database_id: databaseId,
    });
  }

  /**
   * Query a database
   */
  async queryDatabase(
    databaseId: string,
    query?: { filter?: any; sorts?: any[] }
  ): Promise<any[]> {
    return await this.executeAction('query-database', {
      database_id: databaseId,
      ...query,
    });
  }
}
```

---

## Code Examples

### Example 1: Complete Read and Write Flow

Create `example.ts`:

```typescript
// example.ts
import { NotionClient } from './notion-client.js';
import { getConfig } from './config.js';

async function completeExample() {
  try {
    // Setup
    const config = getConfig();
    const connectionId = process.env.CONNECTION_ID;

    if (!connectionId) {
      throw new Error('CONNECTION_ID not set in .env file');
    }

    const notionClient = new NotionClient(config, connectionId);

    // 1. Read: Search for pages
    console.log('📖 Searching for pages...');
    const pages = await notionClient.searchPages(
      undefined,
      { value: 'page', property: 'object' }
    );
    console.log(`✅ Found ${pages.length} pages`);

    // 2. Write: Create a new page
    console.log('\n📝 Creating a new page...');
    const newPage = await notionClient.createPage({
      parent: {
        type: 'workspace',
        workspace: true,
      },
      properties: {
        title: {
          type: 'title',
          title: [
            {
              type: 'text',
              text: {
                content: 'Hello from Alloy API!',
              },
            },
          ],
        },
      },
    });
    console.log(`✅ Page created: ${newPage.id}`);
    console.log(`   URL: ${newPage.url}`);

    // 3. Update: Modify the page
    console.log('\n🔄 Updating the page...');
    const updatedPage = await notionClient.updatePage(newPage.id, {
      properties: {
        title: {
          type: 'title',
          title: [
            {
              type: 'text',
              text: {
                content: 'Updated: Hello from Alloy API!',
              },
            },
          ],
        },
      },
    });
    console.log(`✅ Page updated: ${updatedPage.id}`);

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.response?.data) {
      console.error('API Error:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

completeExample();
```

### Example 2: List All Connections

```typescript
// list-connections.ts
import { AlloyOAuthFlow } from './oauth-flow.js';

async function listConnections() {
  try {
    const oauthFlow = new AlloyOAuthFlow();
    const connections = await oauthFlow.listConnections();

    console.log(`✅ Found ${connections.length} connection(s)\n`);

    connections.forEach((conn: any, index: number) => {
      console.log(`Connection ${index + 1}:`);
      console.log(`  ID: ${conn.id || conn.credentialId || conn.connectionId}`);
      console.log(`  Name: ${conn.name || 'N/A'}`);
      console.log(`  Type: ${conn.type || 'N/A'}`);
      console.log(`  Connector: ${conn.connectorId || 'N/A'}`);
      console.log(`  Created: ${conn.createdAt || conn.created_at || 'N/A'}`);
      console.log('');
    });

    // Find Notion connections
    const notionConnections = connections.filter(
      (conn: any) => conn.connectorId === 'notion'
    );

    if (notionConnections.length > 0) {
      console.log(`\n💡 Found ${notionConnections.length} Notion connection(s)`);
      const mostRecent = notionConnections[0];
      const connectionId = mostRecent.id || mostRecent.credentialId;
      console.log(`   Recommended: CONNECTION_ID=${connectionId}`);
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.response?.data) {
      console.error('API Error:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

listConnections();
```

### Example 3: Batch Operations

```typescript
// batch-operations.ts
import { NotionClient } from './notion-client.js';
import { getConfig } from './config.js';

async function createMultiplePages() {
  const config = getConfig();
  const notionClient = new NotionClient(config, process.env.CONNECTION_ID!);

  const pagesToCreate = [
    'Daily Journal - Monday',
    'Daily Journal - Tuesday',
    'Daily Journal - Wednesday',
  ];

  const results = await Promise.allSettled(
    pagesToCreate.map(title =>
      notionClient.createPage({
        parent: { type: 'workspace', workspace: true },
        properties: {
          title: {
            type: 'title',
            title: [{ type: 'text', text: { content: title } }],
          },
        },
      })
    )
  );

  const successful = results.filter(r => r.status === 'fulfilled');
  const failed = results.filter(r => r.status === 'rejected');

  console.log(`✅ Created ${successful.length} pages`);
  console.log(`❌ Failed ${failed.length} pages`);

  if (failed.length > 0) {
    failed.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`  ${index + 1}: ${result.reason.message}`);
      }
    });
  }
}

createMultiplePages();
```

### Running Examples

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "connect": "ts-node connect-notion.ts",
    "example": "ts-node example.ts",
    "list-connections": "ts-node list-connections.ts",
    "build": "tsc"
  }
}
```

Then run:
```bash
npm run connect          # Run OAuth flow
npm run example          # Run API examples
npm run list-connections # List all connections
```

---

## Troubleshooting

### Common Issues and Solutions

#### Issue 1: "ALLOY_API_KEY environment variable is required"

**Symptoms:**
```
Error: ALLOY_API_KEY environment variable is required
```

**Solutions:**
1. Verify `.env` file exists in project root
2. Check `.env` file contains `ALLOY_API_KEY=your_key_here`
3. Ensure no extra spaces around `=`
4. Restart your application after modifying `.env`
5. Verify you're loading environment variables: `require('dotenv').config()`

**Verification:**
```typescript
console.log('API Key:', process.env.ALLOY_API_KEY ? 'Set' : 'Missing');
```

#### Issue 2: "Credential not found" or "Invalid Authorization"

**Symptoms:**
```
API Error: {
  "error": {
    "code": "INVALID_INPUT",
    "message": "Credential not found"
  }
}
```

**Solutions:**
1. **Verify Connection ID**
   - Run `npm run list-connections` to see all connections
   - Update `.env` with a valid Connection ID

2. **Check API Credentials**
   - Verify `ALLOY_API_KEY` is correct
   - Verify `ALLOY_USER_ID` is correct
   - Ensure you're using production credentials

3. **Reconnect via OAuth**
   - Run `npm run connect` to create a new connection
   - This creates a new connection and provides a new Connection ID

4. **Verify Connection in Dashboard**
   - Visit [Alloy Dashboard](https://app.runalloy.com)
   - Go to **Connections**
   - Verify your Notion connection exists and is active

#### Issue 3: OAuth Callback Not Received

**Symptoms:**
- OAuth URL opens but callback never arrives
- Server doesn't receive callback request

**Solutions:**
1. **Check Redirect URI**
   - Ensure redirect URI matches what's registered in Alloy
   - Default: `http://localhost:3000/oauth/callback`
   - Must be accessible from your browser

2. **Verify Server is Running**
   - Server must be running before opening OAuth URL
   - Check terminal for server logs

3. **Check Firewall/Network**
   - Ensure port 3000 is not blocked
   - Try a different port if needed

4. **Check Browser Console**
   - Open browser DevTools (F12)
   - Look for JavaScript errors
   - Check Network tab for failed requests

#### Issue 4: "Connection not yet established"

**Symptoms:**
```
Error: Connection not yet established
```

**Solutions:**
1. Complete OAuth flow first:
   ```bash
   npm run connect
   ```

2. Add Connection ID to `.env`:
   ```env
   CONNECTION_ID=your_connection_id_here
   ```

3. Verify connection works:
   ```bash
   npm run example
   ```

#### Issue 5: Rate Limiting

**Symptoms:**
```
HTTP 429 Too Many Requests
```

**Solutions:**
1. **Implement Retry Logic**
   ```typescript
   async function withRetry<T>(
     operation: () => Promise<T>,
     maxRetries: number = 3,
     delayMs: number = 1000
   ): Promise<T> {
     for (let i = 0; i < maxRetries; i++) {
       try {
         return await operation();
       } catch (error: any) {
         if (error.response?.status === 429) {
           if (i === maxRetries - 1) throw error;
           const retryAfter = error.response.headers['retry-after'] || delayMs;
           await new Promise(resolve => setTimeout(resolve, retryAfter));
           delayMs *= 2; // Exponential backoff
         } else {
           throw error;
         }
       }
     }
     throw new Error('Max retries exceeded');
   }
   ```

2. **Reduce Request Frequency**
   - Add delays between requests
   - Batch operations when possible
   - Cache results when appropriate

#### Issue 6: TypeScript Compilation Errors

**Symptoms:**
```
Cannot find module './config.js'
```

**Solutions:**
1. **Check tsconfig.json**
   ```json
   {
     "compilerOptions": {
       "module": "ESNext",
       "moduleResolution": "node",
       "target": "ES2020"
     }
   }
   ```

2. **Use .js extension in imports**
   ```typescript
   import { getConfig } from './config.js'; // Note .js extension
   ```

3. **Build before running**
   ```bash
   npm run build
   ```

### Error Handling Best Practices

```typescript
function handleApiError(error: any, context: string) {
  console.error(`❌ Error in ${context}:`, error.message);

  if (error.response) {
    // API responded with error
    const status = error.response.status;
    const errorData = error.response.data;

    switch (status) {
      case 400:
        console.error('   Bad Request - Check your parameters');
        console.error('   Details:', JSON.stringify(errorData, null, 2));
        break;
      case 401:
        console.error('   Unauthorized - Check your API key');
        break;
      case 403:
        console.error('   Forbidden - Check API key permissions');
        break;
      case 404:
        console.error('   Not Found - Resource does not exist');
        break;
      case 429:
        console.error('   Rate Limited - Too many requests');
        console.error('   Retry after:', error.response.headers['retry-after']);
        break;
      case 500:
        console.error('   Server Error - Alloy API issue');
        break;
      default:
        console.error(`   HTTP ${status} - Unexpected error`);
    }

    if (errorData?.error) {
      console.error('   Error Code:', errorData.error.code);
      console.error('   Error Message:', errorData.error.message);
    }
  } else if (error.request) {
    // Request made but no response
    console.error('   No response from server - Check your internet connection');
  } else {
    // Error setting up request
    console.error('   Request setup error:', error.message);
  }
}
```

---

## API Reference

### Base URL

```
Production: https://production.runalloy.com
```

### Authentication

All requests require a Bearer token in the Authorization header:

```
Authorization: Bearer YOUR_API_KEY
```

### Endpoints

#### List Connections

```http
GET /credentials
```

**Response:**
```json
[
  {
    "id": "connection_id_here",
    "name": "Connection Name",
    "type": "notion-oauth2",
    "connectorId": "notion",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

#### Initiate OAuth Flow

```http
POST /connectors/{connectorId}/credentials
```

**Request Body:**
```json
{
  "connectorId": "notion",
  "authenticationType": "oauth2",
  "redirectUri": "http://localhost:3000/oauth/callback",
  "userId": "your_user_id"
}
```

**Response:**
```json
{
  "oauthUrl": "https://notion.so/oauth/authorize?...",
  "credentialId": "credential_id_here"
}
```

#### Handle OAuth Callback

```http
POST /connectors/{connectorId}/credentials/callback
```

**Request Body:**
```json
{
  "code": "authorization_code_here",
  "userId": "your_user_id",
  "credentialId": "credential_id_here"
}
```

**Response:**
```json
{
  "connectionId": "connection_id_here",
  "credentialId": "credential_id_here"
}
```

#### Execute Action

```http
POST /connectors/{connectorId}/actions/{actionId}
```

**Request Body:**
```json
{
  "credentialId": "connection_id_here",
  "parameters": {
    "query": "search query",
    "filter": { "value": "page", "property": "object" }
  }
}
```

**Response:**
```json
{
  "data": [...],
  "has_more": false,
  "next_cursor": null
}
```

### Common Actions

#### Notion Actions

| Action ID | Description | Parameters |
|-----------|-------------|------------|
| `post-search` | Search pages/databases | `query`, `filter` |
| `get-page` | Get page by ID | `page_id` |
| `post-page` | Create new page | `parent`, `properties` |
| `patch-page` | Update page | `page_id`, `properties` |
| `get-database` | Get database by ID | `database_id` |
| `query-database` | Query database | `database_id`, `filter`, `sorts` |

### Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 429 | Rate Limited |
| 500 | Server Error |

---

## Best Practices

### 1. Environment Variables

✅ **Do:**
- Store all secrets in `.env` file
- Use different API keys for development and production
- Never commit `.env` to version control
- Use `.env.example` as a template

❌ **Don't:**
- Hardcode API keys in source code
- Share API keys in chat or email
- Use production keys in development

### 2. Error Handling

✅ **Do:**
- Always wrap API calls in try-catch blocks
- Provide meaningful error messages
- Log errors for debugging
- Implement retry logic for transient failures

❌ **Don't:**
- Ignore errors silently
- Expose sensitive information in error messages
- Retry indefinitely without backoff

### 3. Connection Management

✅ **Do:**
- Store Connection IDs securely
- Verify connections before use
- Handle connection expiration gracefully
- List connections to find working ones

❌ **Don't:**
- Hardcode Connection IDs
- Assume connections never expire
- Use invalid Connection IDs

### 4. API Usage

✅ **Do:**
- Batch operations when possible
- Implement rate limiting
- Cache results when appropriate
- Use pagination for large datasets

❌ **Don't:**
- Make excessive API calls
- Ignore rate limits
- Fetch unnecessary data
- Process large datasets without pagination

### 5. Security

✅ **Do:**
- Use HTTPS for all API calls
- Validate user input
- Sanitize data before sending
- Rotate API keys regularly

❌ **Don't:**
- Send sensitive data in URLs
- Trust user input without validation
- Log sensitive information
- Share API keys

---

## Additional Resources

- **Alloy Documentation**: [https://docs.runalloy.com](https://docs.runalloy.com)
- **API Reference**: [https://docs.runalloy.com/api-reference](https://docs.runalloy.com/api-reference)
- **Alloy Dashboard**: [https://app.runalloy.com](https://app.runalloy.com)
- **Node.js SDK**: [https://github.com/alloy-automation/alloy-node](https://github.com/alloy-automation/alloy-node)
- **Community Support**: [https://community.runalloy.com](https://community.runalloy.com)

---

## Support

If you encounter issues not covered in this documentation:

1. **Check the Troubleshooting section** above
2. **Review Alloy Documentation** at [docs.runalloy.com](https://docs.runalloy.com)
3. **Search GitHub Issues** for similar problems
4. **Contact Alloy Support** through the dashboard
5. **Open an Issue** in this repository

---

**Last Updated**: December 2024  
**Version**: 1.0.0

