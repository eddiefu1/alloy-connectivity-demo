# OAuth Flow Guide for Alloy Automation

This guide explains how to programmatically initiate OAuth flows and create connections with Alloy Automation.

## Overview

The OAuth flow allows you to:
1. Initiate an OAuth connection programmatically
2. Redirect users to authorize the connection
3. Handle the callback and receive the Connection ID
4. Use the Connection ID for API operations

## Step-by-Step Process

### Step 1: Initiate OAuth Flow

Make a POST request to initiate the OAuth flow:

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

### Step 2: Redirect User to OAuth URL

Redirect the user's browser to the `oauthUrl` from the response:

```typescript
// In your web application
window.location.href = oauthUrl;
// or in a server-side redirect
res.redirect(oauthUrl);
```

### Step 3: User Authenticates

The user will be redirected to the integration's OAuth page (e.g., Notion) where they:
- Log in to their account
- Authorize Alloy to access their workspace
- Grant necessary permissions

### Step 4: User is Redirected Back

After authorization, the user is redirected back to your `redirectUri` with query parameters:

```
https://your-app.com/oauth/callback?code=abc123...&state=xyz789...
```

### Step 5: Exchange Code for Connection ID

Exchange the authorization code for a Connection ID:

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

### Step 6: Use Connection ID

Store the `connectionId` and use it in your application:

```env
CONNECTION_ID=conn_abc123xyz
```

## Using the OAuth Flow Helper

This project includes an `AlloyOAuthFlow` class to simplify the process:

### Example: Initiate OAuth Flow

```typescript
import { AlloyOAuthFlow } from './src/oauth-flow';

const oauthFlow = new AlloyOAuthFlow();

// Initiate OAuth flow for Notion
const { oauthUrl } = await oauthFlow.initiateOAuthFlow(
  'notion',
  'http://localhost:3000/oauth/callback'
);

// Redirect user to oauthUrl
console.log(`Redirect user to: ${oauthUrl}`);
```

### Example: Handle OAuth Callback

```typescript
import { AlloyOAuthFlow } from './src/oauth-flow';

const oauthFlow = new AlloyOAuthFlow();

// In your callback endpoint
app.get('/oauth/callback', async (req, res) => {
  const { code, state } = req.query;

  try {
    const { connectionId } = await oauthFlow.handleOAuthCallback(
      'notion',
      code as string,
      state as string
    );

    // Save connectionId to database or .env
    console.log(`Connection ID: ${connectionId}`);
    
    res.json({ 
      success: true, 
      connectionId: connectionId 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});
```

## Complete Web Server Example

Here's a complete Express.js example:

```typescript
import express from 'express';
import { AlloyOAuthFlow } from './src/oauth-flow';

const app = express();
const oauthFlow = new AlloyOAuthFlow();

// Step 1: Initiate OAuth flow
app.get('/connect/notion', async (req, res) => {
  try {
    const { oauthUrl } = await oauthFlow.initiateOAuthFlow(
      'notion',
      'http://localhost:3000/oauth/callback'
    );
    
    // Store oauthUrl in session if needed
    // Then redirect user
    res.redirect(oauthUrl);
  } catch (error) {
    res.status(500).send('Failed to initiate OAuth flow');
  }
});

// Step 2: Handle OAuth callback
app.get('/oauth/callback', async (req, res) => {
  const { code, state, error } = req.query;

  if (error) {
    return res.status(400).send(`OAuth error: ${error}`);
  }

  try {
    const { connectionId } = await oauthFlow.handleOAuthCallback(
      'notion',
      code as string,
      state as string
    );

    // Save connectionId (to database, .env, etc.)
    console.log(`Connection established: ${connectionId}`);
    
    res.send(`
      <h1>Connection Successful!</h1>
      <p>Connection ID: ${connectionId}</p>
      <p>Add this to your .env file: CONNECTION_ID=${connectionId}</p>
    `);
  } catch (error) {
    res.status(500).send(`Failed to complete OAuth: ${error.message}`);
  }
});

app.listen(3000, () => {
  console.log('OAuth server running on http://localhost:3000');
  console.log('Visit http://localhost:3000/connect/notion to start OAuth flow');
});
```

## Supported Connectors

Common connectors you can use OAuth flow with:

- `notion` - Notion workspace
- `hubspot` - HubSpot CRM
- `salesforce` - Salesforce CRM
- `slack` - Slack workspace
- `google-drive` - Google Drive
- `github` - GitHub repositories
- And many more...

Check the [Alloy Documentation](https://docs.runalloy.com) for the full list.

## API Version

Make sure to use the correct API version in the `x-api-version` header:

- `2025-09` (current)
- `2024-02` (previous)
- `2023-12` (older)

Check [Alloy API Reference](https://docs.runalloy.com/api-reference) for the latest version.

## Security Best Practices

1. **Use HTTPS for redirect URIs in production**
   - Never use `http://localhost` in production
   - Use a secure callback URL

2. **Validate state parameter**
   - Use the `state` parameter to prevent CSRF attacks
   - Store state in session and validate on callback

3. **Store Connection IDs securely**
   - Don't expose Connection IDs in client-side code
   - Store them securely in your database or environment variables

4. **Handle errors gracefully**
   - Check for error parameters in the callback
   - Provide meaningful error messages to users

## Troubleshooting

### "Invalid redirect_uri"
- Make sure the redirect URI matches exactly what you provided
- Check that the URI is registered in your Alloy app settings

### "Invalid authorization code"
- Authorization codes are single-use and expire quickly
- Make sure you're exchanging the code immediately after receiving it

### "Connection not found"
- Verify the Connection ID is correct
- Check that the connection hasn't been deleted or revoked

## Frontend SDK Alternative

For web applications, you can also use the Alloy Frontend SDK which simplifies the OAuth flow:

```javascript
// Authenticate with JWT token from backend
await alloy.authenticate(jwtToken);

// Connect to integration
alloy.connect('notion', {
  onSuccess: (connectionId) => {
    console.log('Connection ID:', connectionId);
  },
  onError: (error) => {
    console.error('Error:', error);
  },
});
```

See [Frontend SDK Guide](./frontend-sdk-guide.md) for complete documentation.

## Additional Resources

- [Alloy OAuth Documentation](https://docs.runalloy.com/oauth)
- [Alloy Frontend SDK Guide](./frontend-sdk-guide.md)
- [Alloy API Reference](https://docs.runalloy.com/api-reference)
- [OAuth 2.0 Specification](https://oauth.net/2/)

