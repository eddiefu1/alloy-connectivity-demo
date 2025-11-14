# 🔐 OAuth Connection Guide - Connecting Notion with Alloy

This guide explains how to connect Notion to Alloy using OAuth 2.0 authentication.

## 📋 Prerequisites

Before starting, make sure you have:

1. ✅ **Alloy API Key** - Set in `.env` as `ALLOY_API_KEY`
2. ✅ **Alloy User ID** - Set in `.env` as `ALLOY_USER_ID`
3. ✅ **Server running** - The callback server must be accessible
4. ✅ **Redirect URI registered** - `http://localhost:3000/oauth/callback` (or your custom URI)

## 🚀 Method 1: Using the Web Interface (Easiest)

### Step 1: Start the Server
```bash
npm run server
```

The server will start on `http://localhost:3000`

### Step 2: Open the Web Interface
1. Open your browser and go to: `http://localhost:3000`
2. Click the **"Connect Notion"** button
3. You'll be redirected to Notion's authorization page
4. Authorize the connection
5. You'll be redirected back with the connection established

### Step 3: Get Your Connection ID
After successful connection, you'll see a **Connection ID** on the success page. Copy it and add to your `.env`:

```env
CONNECTION_ID=your_connection_id_here
```

---

## 🖥️ Method 2: Using Command Line Script

### Step 1: Run the Connection Script
```bash
npm run connect-notion
```

### Step 2: Follow the Instructions
1. The script will generate an OAuth URL
2. **Copy the OAuth URL** from the terminal
3. **Open it in your browser**
4. Authorize the connection in Notion
5. The script will automatically catch the callback and complete the connection

### Step 3: Connection ID
After successful connection, the script will display:
- ✅ Connection ID
- ✅ Credential ID
- Instructions to add it to `.env`

---

## 🔌 Method 3: Using the API Endpoint

### Step 1: Start the Server
```bash
npm run server
```

### Step 2: Initiate OAuth Flow
Make a POST request to initiate OAuth:

```bash
# Using curl
curl -X POST http://localhost:3000/api/oauth/initiate \
  -H "Content-Type: application/json" \
  -d '{"connectorId": "notion"}'

# Using PowerShell
Invoke-WebRequest -Uri "http://localhost:3000/api/oauth/initiate" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"connectorId": "notion"}'
```

### Step 3: Get OAuth URL
The response will include an `oauthUrl`:

```json
{
  "success": true,
  "oauthUrl": "https://api.runalloy.com/api/strategy/connector/notion/authorize?...",
  "credentialId": "abc123...",
  "redirectUri": "http://localhost:3000/oauth/callback"
}
```

### Step 4: Authorize
1. **Open the `oauthUrl` in your browser**
2. **Authorize the connection** in Notion
3. You'll be redirected to: `http://localhost:3000/oauth/callback?code=...`
4. The server will automatically process the callback

### Step 5: Get Connection ID
After authorization, visit:
```bash
GET http://localhost:3000/api/connections
```

Find your Notion connection and copy the `id` (Connection ID).

---

## 🤖 Method 4: Using MCP Server (Advanced)

If you're using Cursor AI or another MCP-enabled tool:

### Step 1: Create Credential via MCP
```javascript
// In MCP context (like Cursor AI)
mcp_alloy_create_credential_alloy({
  connectorId: "notion",
  authenticationType: "oauth2",
  redirectUri: "http://localhost:3000/oauth/callback"
})
```

### Step 2: Get OAuth URL
The MCP server will return an `oauthUrl` in the response.

### Step 3: Authorize
1. **Open the `oauthUrl`** in your browser
2. **Authorize** the connection
3. The MCP server will automatically handle the callback

### Step 4: Verify Connection
Check your connections:
```bash
npm run list-connections notion
```

---

## 🔍 Step-by-Step OAuth Flow

Here's what happens behind the scenes:

### 1. **Initiate OAuth** (`POST /api/oauth/initiate`)
   - Your app requests an OAuth URL from Alloy
   - Alloy creates a credential and returns an authorization URL
   - **Response**: `{ oauthUrl: "...", credentialId: "..." }`

### 2. **User Authorization**
   - User opens the `oauthUrl` in browser
   - User logs into Notion and authorizes the app
   - Notion redirects back with authorization code

### 3. **Callback Handling** (`GET /oauth/callback`)
   - Server receives callback with `code` parameter
   - Server exchanges code for access token via Alloy API
   - Alloy creates the connection
   - **Result**: Connection ID is returned

### 4. **Use the Connection**
   - Store the Connection ID in `.env` as `CONNECTION_ID`
   - Use it with `NotionClient` to interact with Notion

---

## 🛠️ Troubleshooting

### Issue: "No authorization code found in URL"

**Solution:**
- Check browser console (F12) for extraction logs
- The code might be in a URL fragment (`#code=...`)
- The page should automatically extract and redirect
- Check terminal logs for connection auto-detection

### Issue: "Redirect URI mismatch"

**Solution:**
- Make sure `OAUTH_REDIRECT_URI` in `.env` matches exactly
- Default: `http://localhost:3000/oauth/callback`
- Register the redirect URI in your Alloy account if needed:
  ```bash
  POST /api/oauth/register-redirect-uri
  ```

### Issue: "Connection not found after OAuth"

**Solution:**
- Wait a few seconds - Alloy may process it server-side
- Check connections: `npm run list-connections notion`
- The connection might have been created automatically
- Look for the most recent Notion connection

### Issue: "OAuth URL not working"

**Solution:**
- Verify your `ALLOY_API_KEY` and `ALLOY_USER_ID` are correct
- Check server logs for API errors
- Make sure the server is running: `npm run server`
- Verify redirect URI is registered in Alloy

---

## 📝 Example: Complete OAuth Flow

```typescript
import { AlloyOAuthFlow } from './oauth-flow.js';
import { getConfig } from './config.js';

async function connectNotion() {
  const config = getConfig();
  const oauthFlow = new AlloyOAuthFlow();
  
  // Step 1: Initiate OAuth
  const { oauthUrl, credentialId } = await oauthFlow.initiateOAuthFlow(
    'notion',
    'http://localhost:3000/oauth/callback'
  );
  
  console.log('Open this URL in your browser:', oauthUrl);
  console.log('After authorization, the callback will be handled automatically');
  
  // Step 2: Wait for callback (or handle it via web server)
  // The callback handler will call handleOAuthCallback()
  
  // Step 3: Use the connection
  const { NotionClient } = await import('./notion-client.js');
  const client = new NotionClient(config, connectionId);
  const pages = await client.searchPages();
}
```

---

## ✅ Verification

After connecting, verify your connection:

```bash
# List all connections
npm run list-connections notion

# Or use the API
curl http://localhost:3000/api/connections
```

You should see your Notion connection with:
- ✅ Connection ID
- ✅ Connector ID: `notion`
- ✅ Status: `active` or `connected`
- ✅ Creation timestamp

---

## 🎯 Next Steps

Once connected:

1. **Add Connection ID to `.env`**:
   ```env
   CONNECTION_ID=your_connection_id_here
   ```

2. **Use the Connection**:
   ```typescript
   import { NotionClient } from './notion-client.js';
   import { getConfig } from './config.js';
   
   const config = getConfig();
   const client = new NotionClient(config, config.connectionId);
   const pages = await client.searchPages();
   ```

3. **Test the Connection**:
   ```bash
   # The connection is ready to use!
   # Try creating a page, searching, etc.
   ```

---

## 📚 Additional Resources

- **Alloy Documentation**: https://docs.runalloy.com/connectivity-api
- **Notion API Docs**: https://developers.notion.com/reference
- **OAuth 2.0 Spec**: https://oauth.net/2/

---

## 💡 Tips

1. **Keep the server running** during OAuth flow
2. **Use the web interface** for easiest setup
3. **Check terminal logs** for detailed debugging info
4. **Connection IDs are persistent** - save them for reuse
5. **Multiple connections** can exist - use the most recent one

---

## 🆘 Need Help?

- Check server logs: `npm run server`
- Verify configuration: `GET http://localhost:3000/api/config/check`
- Test health: `GET http://localhost:3000/api/health`
- List connections: `GET http://localhost:3000/api/connections`

