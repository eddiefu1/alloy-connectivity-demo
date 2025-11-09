# Alloy Connectivity API - Quick Reference

A quick reference guide for common tasks and code snippets when integrating with Alloy's Connectivity API.

## Table of Contents

- [Quick Start](#quick-start)
- [OAuth Flow](#oauth-flow)
- [API Operations](#api-operations)
- [Connection Management](#connection-management)
- [Common Patterns](#common-patterns)
- [Error Codes](#error-codes)

---

## Quick Start

### 1. Install Dependencies

```bash
npm install alloy-node axios express cors dotenv
```

### 2. Configure Environment

```env
ALLOY_API_KEY=your_api_key_here
ALLOY_USER_ID=your_user_id_here
CONNECTION_ID=your_connection_id_here
ALLOY_BASE_URL=https://api.runalloy.com
```

### 3. Basic Setup

```typescript
import { UAPI } from 'alloy-node';
import dotenv from 'dotenv';

dotenv.config();

const client = new UAPI(process.env.ALLOY_API_KEY!);
client.userId = process.env.ALLOY_USER_ID!;
await client.connect(process.env.CONNECTION_ID!);
```

---

## OAuth Flow

### Initiate OAuth

```typescript
const response = await axios.post(
  'https://production.runalloy.com/connectors/notion/credentials',
  {
    connectorId: 'notion',
    authenticationType: 'oauth2',
    redirectUri: 'http://localhost:3000/oauth/callback',
    userId: process.env.ALLOY_USER_ID,
  },
  {
    headers: {
      'Authorization': `Bearer ${process.env.ALLOY_API_KEY}`,
      'x-api-version': '2025-09',
    },
  }
);

const oauthUrl = response.data.oauthUrl;
// Redirect user to oauthUrl
```

### Handle Callback

```typescript
const response = await axios.post(
  'https://production.runalloy.com/connectors/notion/credentials/callback',
  {
    code: 'authorization_code_from_callback',
    userId: process.env.ALLOY_USER_ID,
  },
  {
    headers: {
      'Authorization': `Bearer ${process.env.ALLOY_API_KEY}`,
      'x-api-version': '2025-09',
    },
  }
);

const connectionId = response.data.connectionId;
// Save connectionId for future API calls
```

---

## API Operations

### Read Data

```typescript
// Using SDK
const client = new UAPI(process.env.ALLOY_API_KEY!);
client.userId = process.env.ALLOY_USER_ID!;
await client.connect(process.env.CONNECTION_ID!);

const response = await client.CRM.listContacts();
const pages = response.data;
```

```typescript
// Using REST API
const response = await axios.get(
  `https://api.runalloy.com/users/${userId}/integrations/notion/data/pages`,
  {
    headers: {
      'Authorization': `Bearer ${process.env.ALLOY_API_KEY}`,
    },
  }
);

const pages = response.data;
```

### Create Data

```typescript
// Using SDK
const response = await client.CRM.createContact({
  title: 'New Page',
  content: 'Page content',
});
```

```typescript
// Using REST API
const response = await axios.post(
  `https://api.runalloy.com/users/${userId}/integrations/notion/data/pages`,
  {
    title: 'New Page',
    content: 'Page content',
  },
  {
    headers: {
      'Authorization': `Bearer ${process.env.ALLOY_API_KEY}`,
    },
  }
);
```

### Update Data

```typescript
// Using SDK
const response = await client.CRM.updateContact('page_id', {
  title: 'Updated Title',
});
```

```typescript
// Using REST API
const response = await axios.put(
  `https://api.runalloy.com/users/${userId}/integrations/notion/data/pages/page_id`,
  {
    title: 'Updated Title',
  },
  {
    headers: {
      'Authorization': `Bearer ${process.env.ALLOY_API_KEY}`,
    },
  }
);
```

---

## Connection Management

### List Connections

```typescript
const response = await axios.get(
  `https://production.runalloy.com/users/${userId}/credentials`,
  {
    headers: {
      'Authorization': `Bearer ${process.env.ALLOY_API_KEY}`,
      'x-api-version': '2025-09',
    },
  }
);

const connections = response.data.data || response.data;
```

### Get Connection

```typescript
const response = await axios.get(
  `https://production.runalloy.com/credentials/${connectionId}`,
  {
    headers: {
      'Authorization': `Bearer ${process.env.ALLOY_API_KEY}`,
      'x-api-version': '2025-09',
    },
  }
);

const connection = response.data;
```

### Find Connection by Connector

```typescript
const connections = await listConnections();
const notionConnection = connections.find(
  (conn: any) => conn.connectorId === 'notion'
);
const connectionId = notionConnection?.id;
```

---

## Common Patterns

### Error Handling

```typescript
try {
  const response = await apiCall();
  return { success: true, data: response.data };
} catch (error: any) {
  if (error.response) {
    // API error
    return {
      success: false,
      error: error.response.data?.error?.message || error.message,
      status: error.response.status,
    };
  } else {
    // Network error
    return {
      success: false,
      error: error.message,
    };
  }
}
```

### Retry Logic

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

### Connection Caching

```typescript
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

---

## Error Codes

### HTTP Status Codes

| Code | Meaning | Solution |
|------|---------|----------|
| 400 | Bad Request | Check request parameters and data format |
| 401 | Unauthorized | Verify API key is correct and valid |
| 403 | Forbidden | Check API key permissions |
| 404 | Not Found | Verify resource ID (connection, user, etc.) |
| 429 | Rate Limited | Implement retry logic with exponential backoff |
| 500 | Server Error | Retry request or contact support |

### Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| "ALLOY_API_KEY environment variable is required" | API key not set | Add `ALLOY_API_KEY` to `.env` file |
| "Invalid userId format" | User ID format incorrect | Get correct User ID from Alloy Dashboard |
| "OAuth callback received but no authorization code" | OAuth flow incomplete | Check redirect URI and OAuth configuration |
| "Connection not yet established" | No connection ID | Complete OAuth flow to get connection ID |
| "Authentication failed" | Invalid API key | Verify API key in Alloy Dashboard |

---

## API Endpoints

### OAuth Endpoints

```
POST /connectors/{connectorId}/credentials
  - Initiate OAuth flow
  - Returns: { oauthUrl, credentialId }

POST /connectors/{connectorId}/credentials/callback
  - Handle OAuth callback
  - Returns: { connectionId, credentialId }
```

### Connection Endpoints

```
GET /users/{userId}/credentials
  - List all connections
  - Returns: Array of connections

GET /credentials/{connectionId}
  - Get connection details
  - Returns: Connection object
```

### Data Endpoints

```
GET /users/{userId}/integrations/{integrationId}/data/{entity}
  - Read data
  - Returns: Array of records

POST /users/{userId}/integrations/{integrationId}/data/{entity}
  - Create data
  - Returns: Created record

PUT /users/{userId}/integrations/{integrationId}/data/{entity}/{recordId}
  - Update data
  - Returns: Updated record
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ALLOY_API_KEY` | Yes | API key from Alloy Dashboard |
| `ALLOY_USER_ID` | Yes | User ID from Alloy Dashboard |
| `CONNECTION_ID` | Yes* | Connection ID after OAuth flow |
| `ALLOY_BASE_URL` | No | API base URL (default: https://api.runalloy.com) |

\* Required for data operations

---

## TypeScript Types

```typescript
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
  updatedAt: string;
}

interface OAuthResponse {
  oauthUrl: string;
  credentialId?: string;
}

interface CallbackResponse {
  connectionId: string;
  credentialId: string;
}
```

---

## Useful Links

- [Full Developer Guide](./developer-guide.md)
- [Alloy Documentation](https://docs.runalloy.com)
- [Alloy API Reference](https://docs.runalloy.com/api-reference)
- [Alloy Dashboard](https://app.runalloy.com)

---

**Last Updated**: 2025-01-27

