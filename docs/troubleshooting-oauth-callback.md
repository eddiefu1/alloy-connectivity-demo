# Troubleshooting OAuth Callback Issues

## Error: "No authorization code received"

If you're seeing this error after authorizing with Notion, here are the most common causes and solutions:

### Issue 1: Redirect URI Mismatch

**Problem:** The callback URL doesn't match what was sent to Notion during OAuth initiation.

**Solution:**
1. Check that the redirect URI in your frontend matches exactly:
   ```javascript
   redirectUri: window.location.origin + '/oauth/callback'
   ```
2. Make sure you're using the same protocol (http vs https)
3. Verify the port number matches (usually `:3000` for localhost)

### Issue 2: Notion App Configuration

**Problem:** Notion might require the redirect URI to be registered in your Notion integration settings.

**Solution:**
1. Go to [Notion Integrations](https://www.notion.so/my-integrations)
2. Select your integration
3. Add your redirect URI to the "Redirect URIs" section:
   - For localhost: `http://localhost:3000/oauth/callback`
   - For production: `https://yourdomain.com/oauth/callback`

### Issue 3: Code in URL Fragment

**Problem:** Some OAuth providers return the code in the URL fragment (`#code=...`) instead of the query string (`?code=...`).

**Solution:**
- Check the browser's address bar after redirect
- Look for `#code=` instead of `?code=`
- If the code is in the fragment, you'll need to handle it differently (this is less common with server-side flows)

### Issue 4: OAuth Flow Cancelled

**Problem:** The user might have cancelled the authorization or closed the window.

**Solution:**
- Try the OAuth flow again
- Make sure to complete the authorization in Notion
- Don't close the browser window during the flow

### Issue 5: CORS or Network Issues

**Problem:** Browser security or network issues preventing the redirect.

**Solution:**
- Check browser console for errors (F12)
- Verify your server is running and accessible
- Try in an incognito/private window
- Check if any browser extensions are blocking the redirect

## Debugging Steps

1. **Check Server Logs:**
   - Look for the "OAuth Callback Received" log message
   - Check what query parameters were received
   - Verify the full URL that was called

2. **Check Browser Console:**
   - Open Developer Tools (F12)
   - Look for any errors or warnings
   - Check the Network tab for the callback request

3. **Verify Redirect URI:**
   - Check the OAuth URL that was generated
   - Verify the `redirectUri` parameter matches your callback endpoint
   - Make sure it's using the correct protocol and port

4. **Test the Callback Endpoint:**
   - Manually visit: `http://localhost:3000/oauth/callback?code=test123`
   - This should show you the error page with debug information
   - Check what parameters are being received

## Common Redirect URI Formats

**Local Development:**
```
http://localhost:3000/oauth/callback
```

**Production:**
```
https://yourdomain.com/oauth/callback
```

**Important:** The redirect URI must:
- Match exactly (including protocol, domain, port, and path)
- Be accessible from the internet (for production)
- Not have trailing slashes unless specified

## Getting Help

If you're still experiencing issues:

1. Check the server logs for detailed error messages
2. Check the browser console for client-side errors
3. Verify your Notion integration settings
4. Test with a different OAuth provider to isolate the issue
5. Check Alloy's API documentation for latest OAuth requirements

## Example: Checking Callback URL

After initiating OAuth, check the OAuth URL:
```
https://api.runalloy.com/api/strategy/connector/notion/authorize?userId=...&redirectUri=http%3A%2F%2Flocalhost%3A3000%2Foauth%2Fcallback&token=...
```

The `redirectUri` parameter should URL-encode to:
```
http://localhost:3000/oauth/callback
```

Make sure this matches your actual callback endpoint exactly.

