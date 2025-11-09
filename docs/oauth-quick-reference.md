# OAuth Flow Quick Reference

## API Version: 2025-09

## Step 1: Initiate OAuth Flow

```bash
curl -X POST https://production.runalloy.com/connectors/notion/credentials \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "x-api-version: 2025-09" \
  -H "Content-Type: application/json" \
  -d '{
    "connectorId": "notion",
    "credentialType": "oauth2",
    "redirectUri": "https://your-app.com/oauth/callback"
  }'
```

**Response:**
```json
{
  "oauthUrl": "https://api.runalloy.com/api/strategy/connector/notion/authorize?userId=...",
  "credentialId": "cred_abc123..."
}
```

## Step 2: Redirect User to oauthUrl

The user should be redirected to the `oauthUrl` from the response.

## Step 3: User Authenticates

User completes OAuth authorization in their browser.

## Step 4: User Redirected Back

User is redirected to your `redirectUri` with query parameters:
```
https://your-app.com/oauth/callback?code=abc123...&state=xyz789...
```

## Step 5: Exchange Code for Connection ID

```bash
curl -X POST https://production.runalloy.com/connectors/notion/credentials/callback \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "x-api-version: 2025-09" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "authorization_code_from_callback",
    "state": "optional_state_parameter"
  }'
```

**Response:**
```json
{
  "connectionId": "conn_abc123xyz",
  "credentialId": "cred_abc123...",
  "status": "connected"
}
```

## Using the Helper Class

```typescript
import { AlloyOAuthFlow } from './src/oauth-flow';

const oauthFlow = new AlloyOAuthFlow();

// Step 1: Initiate OAuth
const { oauthUrl } = await oauthFlow.initiateOAuthFlow(
  'notion',
  'https://your-app.com/oauth/callback'
);

// Step 2: Redirect user to oauthUrl
// Step 3-4: User authorizes and is redirected back
// Step 5: Handle callback
const { connectionId } = await oauthFlow.handleOAuthCallback(
  'notion',
  codeFromCallback,
  stateFromCallback
);
```

## Test Script

Run the test script to initiate OAuth flow:

```bash
npm run test-oauth
```

Or use the interactive script:

```bash
npm run initiate-oauth
```

## Supported Connectors

- `notion` - Notion workspace
- `hubspot` - HubSpot CRM
- `salesforce` - Salesforce CRM
- `slack` - Slack workspace
- `google-drive` - Google Drive
- `github` - GitHub repositories
- And many more...

## Environment Variables

Make sure your `.env` file contains:

```env
ALLOY_API_KEY=your_api_key_here
ALLOY_USER_ID=your_user_id_here
REDIRECT_URI=https://your-app.com/oauth/callback
```

## Full Documentation

- [OAuth Flow Guide](./oauth-flow-guide.md) - Complete step-by-step guide
- [Frontend SDK Guide](./frontend-sdk-guide.md) - Frontend SDK usage
- [Getting Connection ID](./getting-connection-id.md) - Other methods to get Connection ID

