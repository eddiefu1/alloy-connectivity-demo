# Fix: OAuth Callback Receives No Authorization Code

## Problem
After authorizing with Notion, the callback URL is hit but no `code` parameter is received:
- Query Parameters: `{}`
- Full URL: `/oauth/callback` (no query string)

## Root Cause
This typically happens when:
1. **Redirect URI not registered in Notion** - Notion requires redirect URIs to be whitelisted
2. **Redirect URI mismatch** - The URI in the OAuth URL doesn't match what Notion expects
3. **OAuth flow configuration** - The OAuth URL from Alloy might not be configured correctly

## Solution Steps

### Step 1: Check the OAuth URL
1. Open browser console (F12) before clicking "Connect Notion"
2. Click "Connect Notion"
3. Check the console logs - you should see:
   ```
   OAuth URL: https://api.runalloy.com/api/strategy/connector/notion/authorize?...
   Expected callback: http://localhost:3000/oauth/callback
   ```
4. Copy the OAuth URL and check if it contains `redirectUri` parameter
5. Verify the `redirectUri` value matches exactly: `http://localhost:3000/oauth/callback`

### Step 2: Register Redirect URI in Notion
1. Go to [Notion Integrations](https://www.notion.so/my-integrations)
2. Select your integration (or create one if needed)
3. Scroll to **"Redirect URIs"** section
4. Add: `http://localhost:3000/oauth/callback`
5. **Important**: 
   - No trailing slash
   - Exact match required
   - Must include `http://` (not `https://` for localhost)

### Step 3: Check Browser Address Bar
After authorizing with Notion, check the browser's address bar:
- Does it show `?code=...` in the query string?
- Does it show `#code=...` in the fragment?
- What is the full URL that Notion redirected to?

### Step 4: Verify Server Logs
Check your server console logs for:
```
📋 OAuth Initiation Request:
   Redirect URI: http://localhost:3000/oauth/callback
   
✅ OAuth URL Generated:
   OAuth URL: https://api.runalloy.com/...
   Expected Callback: http://localhost:3000/oauth/callback
```

### Step 5: Test Again
1. Make sure redirect URI is registered in Notion
2. Restart the OAuth flow
3. Complete the authorization
4. Check if the code is now received

## Alternative: Check Alloy OAuth URL Format

The OAuth URL from Alloy should look like:
```
https://api.runalloy.com/api/strategy/connector/notion/authorize?userId=...&redirectUri=http%3A%2F%2Flocalhost%3A3000%2Foauth%2Fcallback&token=...
```

The `redirectUri` should be URL-encoded. When decoded, it should be:
```
http://localhost:3000/oauth/callback
```

## Still Not Working?

If the issue persists:
1. Check Alloy dashboard - verify OAuth settings
2. Try a different redirect URI format
3. Check if Notion requires HTTPS (for production)
4. Verify your Notion integration has the correct permissions
5. Check Alloy API documentation for latest OAuth requirements

## Quick Test

To test if the callback endpoint works:
1. Manually visit: `http://localhost:3000/oauth/callback?code=test123`
2. You should see an error about invalid code, but it confirms the endpoint is working
3. This helps isolate if the issue is with Notion's redirect or the endpoint itself

