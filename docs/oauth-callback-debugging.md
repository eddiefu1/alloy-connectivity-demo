# OAuth Callback Debugging Guide

## Issue: Callback Received But No Code Parameter

If your callback endpoint is being hit but no `code` parameter is received, follow these debugging steps:

## Step 1: Understand the OAuth Flow

With Alloy's OAuth flow:
1. You initiate OAuth → Get OAuth URL from Alloy
2. User redirects to OAuth URL → Alloy handles Notion authorization
3. Notion authorizes → Redirects back to Alloy
4. Alloy processes → Should redirect to your callback with `code`
5. Your callback receives `code` → Exchange for Connection ID

## Step 2: Check What You're Being Redirected To

**Critical:** After authorizing with Notion, check the browser address bar:

1. **What URL are you on?**
   - Is it `http://localhost:3000/oauth/callback`?
   - Or is it still on Alloy's domain?
   - Or is it on Notion's domain?

2. **What parameters does it have?**
   - Does it have `?code=...` in the query string?
   - Does it have `#code=...` in the hash/fragment?
   - Are there any other parameters?

3. **Copy the full URL** from the address bar and check server logs

## Step 3: Check Server Logs

When you click "Connect Notion", you should see in server logs:

```
📋 OAuth Initiation Request:
   Redirect URI: http://localhost:3000/oauth/callback
   
✅ OAuth URL Generated:
   OAuth URL: https://api.runalloy.com/api/strategy/connector/notion/authorize?...
   Expected Callback: http://localhost:3000/oauth/callback
```

When the callback is hit, you should see:

```
📥 OAuth Callback Received (GET)
   Query parameters: {...}
   Full URL: /oauth/callback?code=...
```

## Step 4: Common Issues

### Issue 1: Alloy Redirects Without Code
**Symptom:** Callback is hit but no `code` parameter
**Cause:** OAuth flow failed at Alloy's end
**Solution:** 
- Check Alloy dashboard for OAuth configuration
- Verify your API key has correct permissions
- Check if redirect URI needs to be registered in Alloy

### Issue 2: Redirect URI Mismatch
**Symptom:** Callback never gets hit, or gets hit with errors
**Cause:** Redirect URI in OAuth URL doesn't match what Alloy expects
**Solution:**
- Verify the redirect URI in the OAuth URL matches exactly
- Check if Alloy requires redirect URI to be registered
- Ensure no trailing slashes or protocol mismatches

### Issue 3: Code in URL Fragment
**Symptom:** Callback hit but code not in query params
**Cause:** Some OAuth flows use `#code=...` instead of `?code=...`
**Solution:**
- Check browser address bar for `#code=...`
- The improved callback handler now checks URL fragments

## Step 5: About Notion Integration Tokens

**Note:** The string `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` looks like a Notion integration token/secret, **not** a redirect URI.

**With Alloy's OAuth flow:**
- You **don't need** to configure Notion tokens directly
- Alloy handles the OAuth flow with Notion
- You only need to provide the redirect URI (a URL like `http://localhost:3000/oauth/callback`)

**If you have a Notion integration token:**
- This is typically used for direct Notion API access
- With Alloy, you use Alloy's API, not Notion's API directly
- The token might be needed in Alloy's dashboard settings (check Alloy documentation)

## Step 6: Next Steps

1. **Try the OAuth flow again** and watch:
   - Browser console (F12) for the OAuth URL
   - Server console for callback logs
   - Browser address bar for the final redirect URL

2. **Check Alloy Dashboard:**
   - Verify OAuth settings
   - Check if redirect URI needs to be registered
   - Verify API key permissions

3. **Contact Alloy Support:**
   - If the callback is consistently hit without a code
   - This might indicate an issue with Alloy's OAuth flow
   - Provide them with:
     - The OAuth URL that was generated
     - The redirect URI you're using
     - Server logs showing the callback was hit

## Diagnostic Checklist

- [ ] OAuth URL generated successfully
- [ ] Redirect URI is correct in OAuth URL
- [ ] User completes Notion authorization
- [ ] Browser is redirected to callback URL
- [ ] Callback URL has `code` parameter (check address bar)
- [ ] Server receives callback with `code` parameter
- [ ] Code is exchanged for Connection ID successfully

## Still Need Help?

If the issue persists:
1. Check Alloy's documentation for OAuth flow
2. Verify your Alloy account setup
3. Check if there are any restrictions on redirect URIs
4. Try with a different connector to isolate the issue
5. Contact Alloy support with detailed logs

