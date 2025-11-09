# How to Get JWT Token from Alloy

## Summary

The JWT token endpoint appears to require special setup or permissions that may not be available in all Alloy accounts. This document explains the issue and provides alternative approaches.

## ✅ Working Solution

**The correct endpoint for getting JWT tokens is:**
```
GET https://embedded.runalloy.com/users/{USER_ID}/token
Headers:
  Authorization: Bearer {YOUR_API_KEY}
  x-api-version: 2025-09
  Accept: application/json
```

**Key points:**
- Use **GET** method (not POST)
- Use `embedded.runalloy.com` (not `api.runalloy.com`)
- Include `x-api-version: 2025-09` header
- API version goes in the header, not the URL path

## Quick Start

Run the provided script to generate a JWT token:
```bash
npm run get-jwt-token
```

This will automatically use your credentials from `.env` and generate a JWT token.

## Alternative Approaches

### Option 1: Check Alloy Dashboard

1. **Log in to Alloy Dashboard**
   - Visit [https://app.runalloy.com](https://app.runalloy.com)
   - Check if there's a section for "Embedded" or "Frontend SDK" setup
   - Look for JWT token generation in Settings → API Keys or Settings → Embedded

2. **Contact Alloy Support**
   - The JWT token endpoint may require:
     - Enabling embedded/Frontend SDK features
     - Special API key permissions
     - Account plan upgrades
   - Ask support about the correct endpoint and authentication method

### Option 2: Use Backend OAuth Flow Instead

Instead of using the Frontend SDK with JWT tokens, you can use the backend OAuth flow:

```bash
# Interactive OAuth flow (asks for connector ID and redirect URI)
npm run initiate-oauth

# Test OAuth flow for Notion (pre-configured)
npm run test-oauth

# List existing connections
npm run list-connections
```

**What these commands do:**
- `initiate-oauth`: Interactive script that prompts you for a connector ID (e.g., "notion", "hubspot") and redirect URI, then generates an OAuth URL
- `test-oauth`: Pre-configured test script for Notion that initiates an OAuth flow and shows you the OAuth URL
- `list-connections`: Lists all your existing connections and their Connection IDs

**This approach:**
- Doesn't require JWT tokens
- Uses your API key directly
- Works with the existing scripts in this project
- See [docs/oauth-flow-guide.md](./oauth-flow-guide.md) for details

**Example workflow:**
1. Run `npm run test-oauth` to get an OAuth URL
2. Open the OAuth URL in your browser
3. Authorize the connection
4. Get redirected back with a code parameter
5. Use the code to get a Connection ID
6. Use the Connection ID in your `.env` file for API calls

**Note:** If you get an error about "userId must be a valid ID", make sure your `ALLOY_USER_ID` in `.env` is in the correct format. User IDs typically look like `user_abc123...` or similar. Check your Alloy dashboard to find the correct user ID format.

### Option 3: Check Alloy Documentation

1. **Visit Alloy's Official Documentation**
   - [Alloy Frontend SDK Docs](https://docs.runalloy.com/frontend-sdk)
   - [Alloy Embedded Docs](https://docs.runalloy.com/embedded)
   - [Alloy API Reference](https://docs.runalloy.com/api-reference)

2. **Look for Updated Endpoints**
   - API endpoints may have changed
   - Check for the latest API version
   - Verify the correct base URL and path structure

### Option 4: Manual Testing with cURL

Use this command to generate a JWT token manually:

```bash
# Working endpoint - GET method with x-api-version header
curl -X GET https://embedded.runalloy.com/users/YOUR_USER_ID/token \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "x-api-version: 2025-09" \
  -H "Accept: application/json" \
  -v
```

**Important:** 
- Use **GET** method (not POST)
- Include the `x-api-version` header
- Replace `YOUR_USER_ID` and `YOUR_API_KEY` with your actual credentials

### Option 5: Check if Frontend SDK Works Without JWT

Some versions of the Frontend SDK might work with just the API key. Try:

```javascript
// In your HTML file, try authenticating with API key directly
// (This may not work, but worth trying)
await alloy.authenticate(API_KEY);
```

## Recommended Next Steps

1. **Contact Alloy Support** - Ask about:
   - How to enable JWT token generation
   - The correct endpoint URL and API version
   - Required account permissions or plan features

2. **Use Backend OAuth Flow** - For now, use the OAuth flow scripts:
   ```bash
   npm run initiate-oauth  # Start OAuth flow
   npm run list-connections # List existing connections
   ```

3. **Check Your Alloy Dashboard** - Look for:
   - Embedded/Frontend SDK settings
   - JWT token generation options
   - API key permissions

## Script Available

We've created a script to help test different endpoints:

```bash
npm run get-jwt-token
```

This script tries multiple endpoint variations and API versions to find the correct one.

## Related Documentation

- [Frontend SDK Guide](./frontend-sdk-guide.md) - Complete Frontend SDK usage
- [OAuth Flow Guide](./oauth-flow-guide.md) - Backend OAuth flow (alternative)
- [Getting Connection ID](./getting-connection-id.md) - How to get Connection IDs

## Notes

- JWT tokens are typically short-lived (minutes to hours)
- They're used specifically for the Frontend SDK authentication
- If you're building a backend-only integration, you don't need JWT tokens
- The backend OAuth flow is often simpler and doesn't require JWT tokens

