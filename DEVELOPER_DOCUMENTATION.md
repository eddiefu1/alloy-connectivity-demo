# Alloy Connectivity API - Developer Documentation

Complete guide for integrating with Alloy's Connectivity API to connect and sync data with third-party services like Notion, Slack, Google Drive, and 200+ other integrations.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Quick Start](#quick-start)
4. [How to Run Examples](#how-to-run-examples)
5. [Authentication](#authentication)
6. [API Usage](#api-usage)
7. [Code Examples](#code-examples)
8. [Error Handling](#error-handling)
9. [API Reference](#api-reference)

## Overview

The Alloy Connectivity API provides a unified interface to connect your application with 200+ third-party services through a single API. This documentation demonstrates integration with Notion, but the same patterns apply to all supported connectors.

### Key Features

- OAuth 2.0 Authentication: Secure, standard OAuth flow for connecting services
- Unified API: Single API interface for multiple integrations
- Read & Write Operations: Full CRUD support for connected services
- Connection Management: List, verify, and manage connections programmatically

### How It Works

```
Your Application → Alloy Connectivity API → Third-Party Service (Notion)
```

1. Authenticate with Alloy using your API key
2. Connect a third-party service via OAuth 2.0
3. Use Connection ID to make API calls through Alloy
4. Sync Data between your app and the connected service

## Prerequisites

- Node.js 18+ and npm installed
- Alloy Account: [Sign up at runalloy.com](https://runalloy.com)
- API Credentials from [Alloy Dashboard](https://app.runalloy.com):
  - API Key (Settings → API Keys → Create API Key)
  - User ID (found in Settings → API Keys section)

## Quick Start

### Step 1: Install Dependencies

```bash
npm install axios dotenv
```

### Step 2: Configure Environment Variables

Create a `.env` file in your project root:

```env
ALLOY_API_KEY=your_api_key_here
ALLOY_USER_ID=your_user_id_here
CONNECTION_ID=your_connection_id_here
ALLOY_BASE_URL=https://production.runalloy.com
```

**Security Note**: Never commit your `.env` file. Add it to `.gitignore`:

```gitignore
.env
.env.local
.env.*.local
```

### Step 3: Basic Setup Code

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

## How to Run Examples

### Setup Project Structure

Create the following files in your project:

```
your-project/
├── .env                 # Environment variables
├── config.ts            # Configuration file
├── oauth-flow.ts        # OAuth flow handler
├── notion-client.ts     # Notion API client
├── connect-notion.ts    # OAuth connection script
└── example.ts           # Example usage script
```

### Step 1: Create OAuth Flow File

Save the `AlloyOAuthFlow` class code from the [Authentication](#authentication) section into `oauth-flow.ts`.

### Step 2: Create Notion Client File

Save the `NotionClient` class code from the [API Usage](#api-usage) section into `notion-client.ts`.

### Step 3: Run OAuth Connection

Create `connect-notion.ts` with the complete OAuth example from the [Authentication](#authentication) section, then run:

```bash
# Using Node.js directly (if using TypeScript with ts-node)
npx ts-node connect-notion.ts

# Or compile first, then run
tsc connect-notion.ts
node connect-notion.js
```

This will:
1. Start a local server on port 3000
2. Print an OAuth URL to open in your browser
3. After authorization, display your Connection ID
4. Add the Connection ID to your `.env` file

### Step 4: Run API Examples

Create `example.ts` with the example code from the [Code Examples](#code-examples) section, then run:

```bash
# Using Node.js directly
npx ts-node example.ts

# Or compile first
tsc example.ts
node example.js
```

### Using npm Scripts (Recommended)

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "connect": "ts-node connect-notion.ts",
    "example": "ts-node example.ts",
    "build": "tsc"
  }
}
```

Then run:
```bash
npm run connect    # Run OAuth flow
npm run example     # Run API examples
```

### Quick Test Commands

```bash
# 1. Connect Notion via OAuth
npm run connect

# 2. After getting Connection ID, add it to .env file
# CONNECTION_ID=your_connection_id_here

# 3. Run example script
npm run example
```

### Troubleshooting

**"Cannot find module" errors:**
- Make sure all files are in the same directory
- Use `.js` extension in imports: `import { getConfig } from './config.js'`
- Run `npm install axios dotenv` if not already installed

**"Connection ID not set" errors:**
- Complete OAuth flow first: `npm run connect`
- Add `CONNECTION_ID` to your `.env` file
- Restart your terminal/application after updating `.env`

**Port 3000 already in use:**
- Change the port in `connect-notion.ts` (e.g., `server.listen(3001)`)
- Update redirect URI in `.env` to match: `OAUTH_REDIRECT_URI=http://localhost:3001/oauth/callback`

## Authentication

Alloy uses OAuth 2.0 for connecting third-party services. The authentication flow consists of two main steps:

1. Initiate OAuth Flow: Get an authorization URL
2. Handle OAuth Callback: Exchange authorization code for Connection ID

### OAuth Flow Handler

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

### Complete OAuth Example

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
    const { oauthUrl, credentialId } = await oauthFlow.initiateOAuthFlow(
      connectorId,
      redirectUri
    );

    console.log(`Open this URL in your browser: ${oauthUrl}`);

    const server = http.createServer(async (req, res) => {
      const parsedUrl = url.parse(req.url || '', true);

      if (parsedUrl.pathname === '/oauth/callback') {
        const code = parsedUrl.query.code as string;
        const error = parsedUrl.query.error as string;

        if (error) {
          console.error(`OAuth Error: ${error}`);
          res.writeHead(400, { 'Content-Type': 'text/html' });
          res.end(`<h1>OAuth Error</h1><p>${error}</p>`);
          server.close();
          return;
        }

        if (code) {
          try {
            const { connectionId } = await oauthFlow.handleOAuthCallback(
              connectorId,
              code,
              credentialId
            );

            console.log(`Connection ID: ${connectionId}`);
            console.log(`Add this to your .env file: CONNECTION_ID=${connectionId}`);

            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(`
              <h1>Success!</h1>
              <p>Connection ID: <code>${connectionId}</code></p>
              <p>Add this to your .env file: <code>CONNECTION_ID=${connectionId}</code></p>
            `);

            server.close();
          } catch (callbackError: any) {
            console.error('Callback error:', callbackError.message);
            res.writeHead(500, { 'Content-Type': 'text/html' });
            res.end(`<h1>Error</h1><p>${callbackError.message}</p>`);
            server.close();
          }
        }
      }
    });

    server.listen(3000, () => {
      console.log(`Server listening on http://localhost:3000`);
      console.log(`Waiting for OAuth callback...`);
    });
  } catch (error: any) {
    console.error('Failed to connect:', error.message);
    process.exit(1);
  }
}

connectNotion();
```

## API Usage

Once you have a Connection ID, you can make API calls to the connected service through Alloy's Connectivity API.

### Creating a Client

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

  async searchPages(
    query?: string,
    filter?: any
  ): Promise<any[]> {
    return await this.executeAction('post-search', {
      query: query,
      filter: filter || { value: 'page', property: 'object' },
    });
  }

  async getPage(pageId: string): Promise<any> {
    return await this.executeAction('get-page', {
      page_id: pageId,
    });
  }

  async createPage(pageData: {
    parent: { type: string; [key: string]: any };
    properties: Record<string, any>;
  }): Promise<any> {
    return await this.executeAction('post-page', pageData);
  }

  async updatePage(
    pageId: string,
    updates: { properties: Record<string, any> }
  ): Promise<any> {
    return await this.executeAction('patch-page', {
      page_id: pageId,
      ...updates,
    });
  }

  async getDatabase(databaseId: string): Promise<any> {
    return await this.executeAction('get-database', {
      database_id: databaseId,
    });
  }

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

## Code Examples

### Example 1: Complete Read and Write Flow

```typescript
// example.ts
import { NotionClient } from './notion-client.js';
import { getConfig } from './config.js';

async function completeExample() {
  try {
    const config = getConfig();
    const connectionId = process.env.CONNECTION_ID;

    if (!connectionId) {
      throw new Error('CONNECTION_ID not set in .env file');
    }

    const notionClient = new NotionClient(config, connectionId);

    // 1. Read: Search for pages
    console.log('Searching for pages...');
    const pages = await notionClient.searchPages(
      undefined,
      { value: 'page', property: 'object' }
    );
    console.log(`Found ${pages.length} pages`);

    // 2. Write: Create a new page
    console.log('\nCreating a new page...');
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
    console.log(`Page created: ${newPage.id}`);
    console.log(`URL: ${newPage.url}`);

    // 3. Update: Modify the page
    console.log('\nUpdating the page...');
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
    console.log(`Page updated: ${updatedPage.id}`);

  } catch (error: any) {
    console.error('Error:', error.message);
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

    console.log(`Found ${connections.length} connection(s)\n`);

    connections.forEach((conn: any, index: number) => {
      console.log(`Connection ${index + 1}:`);
      console.log(`  ID: ${conn.id || conn.credentialId || conn.connectionId}`);
      console.log(`  Connector: ${conn.connectorId || 'N/A'}`);
      console.log('');
    });

    const notionConnections = connections.filter(
      (conn: any) => conn.connectorId === 'notion'
    );

    if (notionConnections.length > 0) {
      const mostRecent = notionConnections[0];
      const connectionId = mostRecent.id || mostRecent.credentialId;
      console.log(`Recommended: CONNECTION_ID=${connectionId}`);
    }

  } catch (error: any) {
    console.error('Error:', error.message);
    if (error.response?.data) {
      console.error('API Error:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

listConnections();
```

## Error Handling

### Common Error Types

#### Authentication Errors

```typescript
try {
  await notionClient.searchPages();
} catch (error: any) {
  if (error.response?.status === 401) {
    console.error('Authentication failed - Check your ALLOY_API_KEY and ALLOY_USER_ID');
  } else if (error.response?.status === 403) {
    console.error('Authorization failed - Your API key may not have the required permissions');
  }
}
```

#### Connection Errors

```typescript
try {
  await notionClient.searchPages();
} catch (error: any) {
  const errorData = error.response?.data;
  
  if (errorData?.error?.code === 'INVALID_INPUT' && 
      errorData?.error?.message === 'Credential not found') {
    console.error('Connection ID is invalid - Update CONNECTION_ID in your .env file');
  }
}
```

#### Rate Limiting

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
        delayMs *= 2;
      } else {
        throw error;
      }
    }
  }
  throw new Error('Max retries exceeded');
}

const pages = await withRetry(() => notionClient.searchPages());
```

### Troubleshooting

**"ALLOY_API_KEY environment variable is required"**
- Verify `.env` file exists and contains `ALLOY_API_KEY=your_key_here`
- Ensure no extra spaces around `=`
- Restart your application after modifying `.env`

**"Credential not found" or "Invalid Authorization"**
- Verify Connection ID: Run OAuth flow again or check Alloy Dashboard
- Check API credentials are correct
- Ensure you're using production credentials

**"Connection not yet established"**
- Complete OAuth flow first
- Add Connection ID to `.env` file
- Verify connection works with a test API call

**Rate Limiting (HTTP 429)**
- Implement retry logic with exponential backoff
- Reduce request frequency
- Batch operations when possible

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

**Last Updated**: December 2024  
**Version**: 1.0.0

