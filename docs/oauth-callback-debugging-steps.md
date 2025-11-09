# OAuth Callback Debugging: No Authorization Code

## Problem
The callback endpoint `/oauth/callback` is being hit, but no `code` parameter is received. This means Alloy redirected back to your callback URL, but didn't include the authorization code.

## Understanding the Flow

```
1. Your App → POST /api/oauth/initiate
2. Alloy → Returns OAuth URL
3. User → Redirected to OAuth URL (Alloy's server)
4. Alloy → Redirects to Notion
5. User → Authorizes with Notion
6. Notion → Redirects back to Alloy
7. Alloy → Should redirect to YOUR callback with ?code=...
8. YOUR Callback → Receives request but NO CODE ❌
```

## Critical Debugging Steps

### Step 1: Check Browser Address Bar

**CRITICAL:** After authorizing with Notion, before the error page appears:

1. **Look at the browser address bar**
2. **Copy the EXACT URL** you see
3. **Check if it contains:**
   - `?code=...` in the query string?
   - `#code=...` in the hash/fragment?
   - Any other parameters?
   - Is it even your callback URL?

**Example of what you SHOULD see:**
```
http://localhost:3000/oauth/callback?code=abc123xyz&state=xyz789
```

**What you might be seeing:**
```
http://localhost:3000/oauth/callback
(no parameters at all)
```

### Step 2: Check Server Logs

When the callback is hit, check your server console for:

```
📥 OAuth Callback Received (GET)
   ========================================
   Method: GET
   Full URL: /oauth/callback
   Query parameters: {}
   Query string: (empty or none)
   ========================================
```

**Look for:**
- What query parameters are actually received?
- What is the full URL?
- Are there any headers that might contain the code?

### Step 3: Check OAuth URL Generation

Before clicking "Connect Notion", check the server logs for:

```
✅ OAuth URL Generated:
   OAuth URL: https://api.runalloy.com/api/strategy/connector/notion/authorize?...
   Expected Callback: http://localhost:3000/oauth/callback
```

**Verify:**
- Does the OAuth URL contain `redirectUri=http://localhost:3000/oauth/callback`?
- Is the redirectUri URL-encoded in the OAuth URL?
- Does it match exactly what you expect?

### Step 4: Check What Alloy Actually Redirects To

**This is the KEY question:** What URL does Alloy actually redirect to?

1. **Open browser DevTools (F12)**
2. **Go to Network tab**
3. **Click "Connect Notion"**
4. **Watch the network requests:**
   - Look for redirects (status 302 or 307)
   - Check the final redirect location
   - See what URL Alloy is actually sending you to

### Step 5: Verify Alloy Configuration

Check your Alloy dashboard:

1. **API Key Permissions:**
   - Go to Alloy Dashboard → Settings → API Keys
   - Verify your API key has OAuth/credentials permissions
   - Check if there are any restrictions

2. **User ID:**
   - Verify the User ID in your `.env` matches your Alloy account
   - Check if the User ID is correct format

3. **Redirect URI Registration:**
   - Some Alloy configurations require redirect URIs to be pre-registered
   - Check if `http://localhost:3000/oauth/callback` needs to be registered
   - Look for OAuth app settings in Alloy dashboard

4. **Notion Connector:**
   - Verify Notion connector is enabled
   - Check for any errors or warnings
   - Verify connector is available for your account

### Step 6: Test with Different Redirect URI

Try using a different redirect URI to see if the issue persists:

1. **Use a public URL** (if you have one):
   ```
   https://your-domain.com/oauth/callback
   ```

2. **Or use ngrok** for localhost:
   ```bash
   ngrok http 3000
   # Use the ngrok URL as redirect URI
   ```

### Step 7: Check Alloy API Response

When you initiate OAuth, check the response from Alloy:

```bash
POST /api/oauth/initiate
{
  "connectorId": "notion",
  "redirectUri": "http://localhost:3000/oauth/callback"
}
```

**Response should include:**
```json
{
  "success": true,
  "oauthUrl": "https://api.runalloy.com/...",
  "credentialId": "cred_...",
  "redirectUri": "http://localhost:3000/oauth/callback"
}
```

**Check:**
- Does the response include `oauthUrl`?
- Does it include `credentialId`?
- Is the `redirectUri` what you expected?

## Possible Causes

### Cause 1: Alloy OAuth Flow Failure
**Symptom:** Callback hit but no code
**Reason:** OAuth flow failed at Alloy's end (after Notion authorization)
**Solution:** Check Alloy dashboard for errors, verify API key permissions

### Cause 2: Redirect URI Not Registered
**Symptom:** Callback hit but no code
**Reason:** Alloy requires redirect URIs to be pre-registered
**Solution:** Register redirect URI in Alloy dashboard OAuth settings

### Cause 3: Redirect URI Mismatch
**Symptom:** Callback hit but no code, or callback not hit at all
**Reason:** Redirect URI in OAuth URL doesn't match what Alloy expects
**Solution:** Verify redirect URI matches exactly (no trailing slashes, correct protocol)

### Cause 4: API Key Permissions
**Symptom:** OAuth initiates but callback has no code
**Reason:** API key doesn't have permission to complete OAuth flow
**Solution:** Check API key permissions in Alloy dashboard

### Cause 5: User ID Mismatch
**Symptom:** OAuth initiates but callback has no code
**Reason:** User ID doesn't match the account associated with API key
**Solution:** Verify User ID in `.env` matches your Alloy account

### Cause 6: Alloy Using Different Callback Mechanism
**Symptom:** Callback hit but no code in query params
**Reason:** Alloy might use POST, headers, or different mechanism
**Solution:** Check if Alloy uses POST callback or passes code differently

## What to Do Next

1. **Check browser address bar** - What URL are you actually on?
2. **Check server logs** - What does the callback receive?
3. **Check network tab** - What URL does Alloy redirect to?
4. **Check Alloy dashboard** - Any errors or configuration issues?
5. **Contact Alloy support** - Provide them with:
   - OAuth URL that was generated
   - Callback URL you were redirected to
   - Server logs
   - API key (first few chars only)
   - User ID
   - Timestamp of attempt

## Quick Test

Try this to see what's happening:

1. **Open browser console (F12)**
2. **Go to Network tab**
3. **Click "Connect Notion"**
4. **Watch the redirects:**
   - Initial redirect to OAuth URL
   - Redirect to Notion
   - Redirect back from Notion
   - Final redirect to your callback
5. **Check the final redirect:**
   - What URL is it?
   - What parameters does it have?
   - Is it your callback URL?

## Still Need Help?

If the issue persists:
1. Gather all the debugging information above
2. Check Alloy's documentation for OAuth callback requirements
3. Contact Alloy support with detailed information
4. Consider using Alloy's support channels or community forums

