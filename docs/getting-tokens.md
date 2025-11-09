# Getting Access Tokens from Notion and Alloy

This guide explains how to access tokens from both Notion (via Alloy) and Alloy's API.

## Overview

There are two types of tokens you need to understand:

1. **Alloy API Key** - Your API key for authenticating with Alloy's API
2. **Notion Access Token** - The OAuth token for accessing Notion (managed by Alloy)

## 1. Alloy API Key

The Alloy API Key is your authentication token for Alloy's API. It's stored in your `.env` file:

```bash
ALLOY_API_KEY=your_alloy_api_key_here
```

### Getting Your Alloy API Key

1. Go to [Alloy Dashboard](https://app.runalloy.com)
2. Navigate to Settings → API Keys
3. Create a new API key or copy an existing one
4. Add it to your `.env` file

### Using Alloy API Key

```typescript
import { getConfig } from './config.js';

const config = getConfig();
const alloyApiKey = config.alloyApiKey; // Use this for Alloy API calls
```

## 2. Notion Access Token (via Alloy)

After completing the OAuth flow, Alloy stores the Notion access token securely. You typically **don't need direct access** to this token because:

- Alloy manages token refresh automatically
- You use the Connection ID to make API calls
- Alloy handles authentication with Notion on your behalf

### Getting Token Information

#### Method 1: Using the API Endpoint

```bash
# Get connection details (without tokens)
GET http://localhost:3000/api/connections/{connectionId}

# Get connection details with token information
GET http://localhost:3000/api/connections/{connectionId}?tokens=true

# Get token information specifically
GET http://localhost:3000/api/connections/{connectionId}/tokens
```

#### Method 2: Using the Script

```bash
npm run get-tokens <connectionId>
```

Example:
```bash
npm run get-tokens 66d10d4f6601c8d828939c2f
```

#### Method 3: Programmatically

```typescript
import { AlloyOAuthFlow } from './oauth-flow.js';

const oauthFlow = new AlloyOAuthFlow();

// Get connection details
const connection = await oauthFlow.getConnection(connectionId);
console.log('Connection:', connection);

// Get token information
const tokenInfo = await oauthFlow.getConnectionTokens(connectionId);
console.log('Has Tokens:', tokenInfo.hasTokens);
console.log('Token Info:', tokenInfo.tokenInfo);
```

## 3. Making API Calls

### Using Alloy API (Recommended)

Instead of using Notion tokens directly, use Alloy's API with your connection ID:

```typescript
import { NotionClient } from './notion-client.js';
import { getConfig } from './config.js';

const config = getConfig();
const connectionId = process.env.CONNECTION_ID; // From OAuth flow

// Create Notion client (uses Alloy API internally)
const notionClient = new NotionClient(config, connectionId);

// Make API calls - Alloy handles authentication
const pages = await notionClient.searchPages();
```

### Using Alloy API Directly

```typescript
import axios from 'axios';
import { getConfig } from './config.js';

const config = getConfig();

const response = await axios.post(
  'https://production.runalloy.com/connectors/notion/actions/post-search/execute',
  {
    credentialId: connectionId,
    requestBody: {
      // Your Notion API request
    }
  },
  {
    headers: {
      'Authorization': `Bearer ${config.alloyApiKey}`, // Alloy API Key
      'x-api-version': '2025-09',
      'Content-Type': 'application/json'
    }
  }
);
```

## 4. Token Security Notes

### Why Tokens May Not Be Exposed

For security reasons, Alloy typically **does not expose raw access tokens** via the API:

1. **Security**: Raw tokens are sensitive and shouldn't be exposed
2. **Token Management**: Alloy handles token refresh automatically
3. **Best Practice**: Use Connection ID instead of raw tokens

### What You Can Access

- ✅ Connection ID (use this for API calls)
- ✅ Connection status
- ✅ Connection metadata
- ✅ Token expiration info (if available)
- ❌ Raw access tokens (typically not exposed)
- ❌ Raw refresh tokens (typically not exposed)

## 5. Complete Example

```typescript
import { AlloyOAuthFlow } from './oauth-flow.js';
import { getConfig } from './config.js';
import { NotionClient } from './notion-client.js';

async function example() {
  const config = getConfig();
  
  // 1. Get Alloy API Key (from config)
  console.log('Alloy API Key:', config.alloyApiKey.substring(0, 10) + '...');
  
  // 2. Get Connection ID (from OAuth flow)
  const connectionId = process.env.CONNECTION_ID;
  
  // 3. Get connection details
  const oauthFlow = new AlloyOAuthFlow();
  const connection = await oauthFlow.getConnection(connectionId);
  console.log('Connection Status:', connection.status);
  
  // 4. Get token information (if available)
  const tokenInfo = await oauthFlow.getConnectionTokens(connectionId);
  console.log('Has Tokens:', tokenInfo.hasTokens);
  
  // 5. Use connection to make API calls
  const notionClient = new NotionClient(config, connectionId);
  const pages = await notionClient.searchPages();
  console.log('Notion Pages:', pages);
}
```

## 6. Troubleshooting

### "No token information found"

This is normal. Alloy stores tokens securely and may not expose them via API. Use the Connection ID instead.

### "Connection not found"

1. Verify the Connection ID is correct
2. Check that OAuth flow completed successfully
3. List all connections: `GET /api/connections`

### "Invalid API Key"

1. Verify `ALLOY_API_KEY` is set in `.env`
2. Check the API key is valid in Alloy Dashboard
3. Ensure API key has correct permissions

## Summary

- **Alloy API Key**: Use `ALLOY_API_KEY` from `.env` file
- **Notion Tokens**: Managed by Alloy, use Connection ID for API calls
- **Token Access**: Typically not exposed for security, use Connection ID instead
- **Best Practice**: Let Alloy manage tokens and use Connection ID for API calls

