# Access Tokens Guide: Alloy and Notion

This guide explains how to access tokens for both Alloy API and Notion API.

## Overview

There are **two types of tokens** you need:

1. **Alloy API Key** - For authenticating with Alloy's API (you have this)
2. **Notion Access Token** - For accessing Notion API (managed by Alloy after OAuth)

## 1. Alloy API Key

### Your API Keys

- **Development API Key**: `M4FRCFAQaciuUMF2lKwQv`
- **Production API Key**: `TWsxXkP4OngtBYRl1_soA`

### Setting Up Alloy API Key

Add to your `.env` file:

```env
# For Development
ALLOY_ENVIRONMENT=development
ALLOY_API_KEY=M4FRCFAQaciuUMF2lKwQv

# OR for Production
ALLOY_ENVIRONMENT=production
ALLOY_API_KEY=TWsxXkP4OngtBYRl1_soA

ALLOY_USER_ID=your_user_id_here
ALLOY_BASE_URL=https://production.runalloy.com
```

### Accessing Alloy API Key in Code

```typescript
import { getConfig } from './config.js';

const config = getConfig();
const alloyApiKey = config.alloyApiKey; // Use this for Alloy API calls
console.log('Alloy API Key:', alloyApiKey.substring(0, 10) + '...');
```

## 2. Notion Access Token

### How Notion Tokens Work

After completing the OAuth flow:
1. User authorizes your app with Notion
2. Notion returns an authorization code
3. Alloy exchanges the code for access/refresh tokens
4. Alloy stores the tokens securely
5. You use the **Connection ID** to make API calls (not the raw tokens)

### Getting Notion Token Information

#### Method 1: Using the API Endpoint

```bash
# Get token information for a connection
GET http://localhost:3000/api/connections/{connectionId}/tokens
```

#### Method 2: Using the Script

```bash
npm run get-tokens <connectionId>
```

#### Method 3: Programmatically

```typescript
import { AlloyOAuthFlow } from './oauth-flow.js';

const oauthFlow = new AlloyOAuthFlow();
const connectionId = process.env.CONNECTION_ID;

// Get token information
const tokenInfo = await oauthFlow.getConnectionTokens(connectionId);

if (tokenInfo.hasTokens) {
  console.log('Access Token:', tokenInfo.tokenInfo?.accessToken);
  console.log('Refresh Token:', tokenInfo.tokenInfo?.refreshToken);
  console.log('Expires At:', tokenInfo.tokenInfo?.expiresAt);
} else {
  console.log('Tokens not exposed by Alloy (normal for security)');
}
```

## 3. Important: Token Access Limitations

### Alloy API Key
- ✅ **Always accessible** - You have full access to your Alloy API key
- ✅ **Use directly** - Use it in API calls to Alloy
- ✅ **Stored in .env** - Keep it secure, never commit to git

### Notion Access Token
- ⚠️ **May not be exposed** - Alloy typically doesn't expose raw tokens for security
- ✅ **Use Connection ID instead** - Make API calls using the Connection ID
- ✅ **Alloy handles refresh** - Alloy automatically refreshes expired tokens
- ✅ **No direct access needed** - You don't need raw tokens to use the API

## 4. Making API Calls

### Using Alloy API (Recommended)

```typescript
import { NotionClient } from './notion-client.js';
import { getConfig } from './config.js';

const config = getConfig();
const connectionId = process.env.CONNECTION_ID;

// Create client - uses Alloy API Key internally
const notionClient = new NotionClient(config, connectionId);

// Make API calls - Alloy handles Notion authentication
const pages = await notionClient.searchPages();
```

### Direct API Calls

```typescript
import axios from 'axios';
import { getConfig } from './config.js';

const config = getConfig();

// Alloy API Key (for authenticating with Alloy)
const alloyApiKey = config.alloyApiKey;

// Connection ID (for accessing Notion via Alloy)
const connectionId = process.env.CONNECTION_ID;

// Make API call through Alloy
const response = await axios.post(
  'https://production.runalloy.com/connectors/notion/actions/post-search/execute',
  {
    credentialId: connectionId, // Uses stored Notion tokens internally
    requestBody: {
      // Your Notion API request
    }
  },
  {
    headers: {
      'Authorization': `Bearer ${alloyApiKey}`, // Alloy API Key
      'x-api-version': '2025-09',
      'Content-Type': 'application/json'
    }
  }
);
```

## 5. Complete Example

```typescript
import { getConfig } from './config.js';
import { AlloyOAuthFlow } from './oauth-flow.js';
import { NotionClient } from './notion-client.js';

async function example() {
  // 1. Get Alloy API Key
  const config = getConfig();
  console.log('Alloy API Key:', config.alloyApiKey.substring(0, 10) + '...');
  console.log('Environment:', config.environment);
  
  // 2. Get Connection ID (from OAuth flow)
  const connectionId = process.env.CONNECTION_ID;
  
  // 3. Try to get Notion token information
  const oauthFlow = new AlloyOAuthFlow();
  const tokenInfo = await oauthFlow.getConnectionTokens(connectionId);
  
  console.log('Has Notion Tokens:', tokenInfo.hasTokens);
  if (tokenInfo.tokenInfo) {
    console.log('Token Info:', tokenInfo.tokenInfo);
  } else {
    console.log('Tokens not exposed (normal - use Connection ID instead)');
  }
  
  // 4. Use Connection ID to make API calls
  const notionClient = new NotionClient(config, connectionId);
  const pages = await notionClient.searchPages();
  console.log('Notion Pages:', pages);
}
```

## 6. Summary

### Alloy API Key
- **Location**: `.env` file (`ALLOY_API_KEY`)
- **Access**: Direct access via `getConfig().alloyApiKey`
- **Usage**: Authenticate with Alloy API
- **Keys**: 
  - Dev: `M4FRCFAQaciuUMF2lKwQv`
  - Prod: `TWsxXkP4OngtBYRl1_soA`

### Notion Access Token
- **Location**: Stored securely by Alloy (not directly accessible)
- **Access**: Use Connection ID instead of raw tokens
- **Usage**: Make API calls through Alloy using Connection ID
- **Management**: Alloy handles token refresh automatically

## 7. Quick Reference

```typescript
// Get Alloy API Key
const config = getConfig();
const alloyApiKey = config.alloyApiKey;

// Get Notion token info (if available)
const tokenInfo = await oauthFlow.getConnectionTokens(connectionId);

// Use Connection ID for API calls (recommended)
const notionClient = new NotionClient(config, connectionId);
const data = await notionClient.searchPages();
```

## 8. Security Notes

1. **Never expose API keys** in code or commits
2. **Use Connection ID** instead of raw Notion tokens
3. **Let Alloy manage tokens** - it handles refresh automatically
4. **Keep .env secure** - never commit to version control
5. **Use dev keys for testing** - use prod keys only in production

