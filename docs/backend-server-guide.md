# Alloy Backend Server Guide

This guide explains how to use the Express backend server to connect Alloy with your application.

## Quick Start

### 1. Start the Backend Server

```bash
npm run server
```

The server will start on `http://localhost:3000` by default.

### 2. Access the Frontend

Open your browser and navigate to:
```
http://localhost:3000
```

You'll see the Notion connection interface where you can:
- Get a JWT token
- Authenticate with Alloy
- Connect Notion workspace

## API Endpoints

### Health Check
```bash
GET /api/health
```

Returns server status.

### Get JWT Token
```bash
POST /api/alloy/token
Content-Type: application/json

{
  "userId": "optional-user-id"  // Uses .env ALLOY_USER_ID if not provided
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userId": "690674c276dcda35a40b242d"
}
```

### Initiate OAuth Flow
```bash
POST /api/oauth/initiate
Content-Type: application/json

{
  "connectorId": "notion",
  "redirectUri": "http://localhost:3000/oauth/callback"  // Optional
}
```

**Response:**
```json
{
  "success": true,
  "oauthUrl": "https://api.runalloy.com/api/strategy/connector/notion/authorize?userId=...",
  "credentialId": "cred_abc123...",
  "redirectUri": "http://localhost:3000/oauth/callback"
}
```

### OAuth Callback (Web)
```bash
GET /oauth/callback?code=abc123&state=xyz789&connectorId=notion
```

This endpoint handles the OAuth callback and displays a success page with the Connection ID.

### OAuth Callback (API)
```bash
POST /api/oauth/callback
Content-Type: application/json

{
  "code": "authorization_code",
  "state": "optional_state",
  "connectorId": "notion"
}
```

**Response:**
```json
{
  "success": true,
  "connectionId": "conn_abc123xyz",
  "credentialId": "cred_abc123...",
  "connectorId": "notion"
}
```

### List Connections
```bash
GET /api/connections
```

**Response:**
```json
{
  "success": true,
  "connections": [
    {
      "id": "conn_abc123",
      "connectorId": "notion",
      "status": "connected",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Get Connection Details
```bash
GET /api/connections/:connectionId
```

**Response:**
```json
{
  "success": true,
  "connection": {
    "id": "conn_abc123",
    "connectorId": "notion",
    "status": "connected",
    // ... other connection details
  }
}
```

## Complete Workflow Example

### 1. Using the Web Interface

1. Start the server: `npm run server`
2. Open `http://localhost:3000` in your browser
3. Get JWT token (click the button or use the API)
4. Authenticate with Alloy
5. Click "Connect Notion"
6. Authorize in the browser
7. Copy the Connection ID from the success page
8. Add to `.env`: `CONNECTION_ID=your_connection_id`

### 2. Using the API Directly

#### Step 1: Get JWT Token
```bash
curl -X POST http://localhost:3000/api/alloy/token \
  -H "Content-Type: application/json"
```

#### Step 2: Initiate OAuth Flow
```bash
curl -X POST http://localhost:3000/api/oauth/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "connectorId": "notion",
    "redirectUri": "http://localhost:3000/oauth/callback"
  }'
```

#### Step 3: Redirect User to OAuth URL
Open the `oauthUrl` from the response in a browser.

#### Step 4: Handle Callback
After authorization, the user will be redirected to your `redirectUri` with a `code` parameter. The server will automatically handle this and display the Connection ID.

#### Step 5: Use Connection ID
Add the Connection ID to your `.env` file and use it in your application.

## Integration with Frontend

### React Example

```tsx
import React, { useState } from 'react';

function ConnectNotion() {
  const [token, setToken] = useState('');
  const [connected, setConnected] = useState(false);
  const [connectionId, setConnectionId] = useState('');

  // Get JWT token from backend
  const getToken = async () => {
    const response = await fetch('http://localhost:3000/api/alloy/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await response.json();
    setToken(data.token);
  };

  // Initiate OAuth flow
  const connectNotion = async () => {
    const response = await fetch('http://localhost:3000/api/oauth/initiate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        connectorId: 'notion',
        redirectUri: 'http://localhost:3000/oauth/callback'
      })
    });
    const data = await response.json();
    // Redirect user to oauthUrl
    window.location.href = data.oauthUrl;
  };

  return (
    <div>
      <button onClick={getToken}>Get JWT Token</button>
      <button onClick={connectNotion}>Connect Notion</button>
      {connected && <p>Connected! Connection ID: {connectionId}</p>}
    </div>
  );
}
```

### Vanilla JavaScript Example

```javascript
// Get JWT token
async function getJWTToken() {
  const response = await fetch('http://localhost:3000/api/alloy/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  const data = await response.json();
  return data.token;
}

// Initiate OAuth flow
async function connectNotion() {
  const response = await fetch('http://localhost:3000/api/oauth/initiate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      connectorId: 'notion',
      redirectUri: 'http://localhost:3000/oauth/callback'
    })
  });
  const data = await response.json();
  // Redirect to OAuth URL
  window.location.href = data.oauthUrl;
}

// Use the functions
getJWTToken().then(token => {
  console.log('JWT Token:', token);
  // Use token with Alloy Frontend SDK
});

// Connect Notion
connectNotion();
```

## Environment Variables

Make sure your `.env` file contains:

```env
ALLOY_API_KEY=your_api_key_here
ALLOY_USER_ID=your_user_id_here
ALLOY_BASE_URL=https://api.runalloy.com
PORT=3000
```

## Troubleshooting

### Port Already in Use
If port 3000 is already in use, set a different port:
```bash
PORT=3001 npm run server
```

### CORS Issues
The server includes CORS middleware, but if you encounter issues, make sure your frontend is making requests to the correct origin.

### OAuth Callback Not Working
- Make sure the `redirectUri` matches exactly what you configured
- Check that the server is accessible at the redirect URI
- Verify that your Alloy API key has the correct permissions

### Connection ID Not Received
- Check the server logs for error messages
- Verify that the OAuth flow completed successfully
- Make sure you're using the correct connector ID

## Next Steps

After connecting Notion:
1. Save the Connection ID to your `.env` file
2. Use the Connection ID in your Alloy API calls
3. Test the connection with `npm run dev`
4. Start building your integration!

## Related Documentation

- [Frontend SDK Guide](./frontend-sdk-guide.md)
- [OAuth Flow Guide](./oauth-flow-guide.md)
- [Getting Connection ID](./getting-connection-id.md)
- [Getting JWT Token](./getting-jwt-token.md)

