# Alloy OAuth Configuration Checklist

## Problem: Callback Received But No Authorization Code

If your callback endpoint is hit but no `code` parameter is received, it means **Alloy redirected back without completing the OAuth flow**. This indicates an issue at Alloy's end.

## OAuth Flow Diagram

```
Your App → Alloy OAuth URL → Notion Authorization → Alloy Processing → Your Callback
                                                          ↓
                                              (Should include ?code=...)
```

If the callback arrives without `?code=...`, the flow failed at Alloy's processing step.

## Alloy Dashboard Configuration Checklist

### 1. Check API Key Permissions

**Location:** Alloy Dashboard → Settings → API Keys

**Verify:**
- [ ] Your API key has **OAuth/Credentials** permissions
- [ ] API key is **active** (not expired or revoked)
- [ ] API key has access to create OAuth credentials
- [ ] API key belongs to the correct user account

**How to Check:**
1. Go to https://app.runalloy.com
2. Navigate to **Settings** → **API Keys**
3. Find your API key
4. Verify permissions include OAuth/credentials creation

### 2. Check Redirect URI Configuration

**Location:** Alloy Dashboard → Settings → OAuth/Connections (if available)

**Verify:**
- [ ] Redirect URI is registered/whitelisted in Alloy (if required)
- [ ] Redirect URI matches exactly: `http://localhost:3000/oauth/callback`
- [ ] No trailing slashes
- [ ] Protocol matches (`http://` for localhost, `https://` for production)

**Important:** Some Alloy configurations require redirect URIs to be pre-registered. Check if your Alloy account/workspace has this requirement.

### 3. Check User ID Format

**Location:** Alloy Dashboard → Settings → User/Account Settings

**Verify:**
- [ ] User ID format is correct (should match what's in your `.env` file)
- [ ] User ID is from the same account as your API key
- [ ] User ID has the correct format:
  - MongoDB ObjectId: `690674c276dcda35a40b242d` (24 hex characters) - example format
  - UUID format: `12345678-1234-1234-1234-123456789abc` - example format
  - User prefix: `user_abc123...` - example format

**User ID in `.env` should look like:**
```
ALLOY_USER_ID=your_actual_user_id_here
```

### 4. Check Connector/Integration Status

**Location:** Alloy Dashboard → Integrations/Connectors → Notion

**Verify:**
- [ ] Notion connector is **enabled** in your Alloy workspace
- [ ] Notion connector is **available** (not deprecated or disabled)
- [ ] Your account has access to the Notion connector
- [ ] No errors or warnings shown for the Notion connector

### 5. Check OAuth App Configuration in Alloy

**Location:** Alloy Dashboard → Settings → OAuth Apps/Applications (if available)

**Verify:**
- [ ] OAuth application is properly configured
- [ ] Redirect URIs are registered
- [ ] OAuth scopes/permissions are correct
- [ ] No rate limiting or restrictions

### 6. Check API Version

**Verify:**
- [ ] You're using the correct API version (should be `2025-09`)
- [ ] API version matches what Alloy expects
- [ ] Headers include `x-api-version: 2025-09`

**Current API Version in code:**
```typescript
'x-api-version': '2025-09'
```

### 7. Check Alloy Account Type/Plan

**Location:** Alloy Dashboard → Settings → Billing/Plan

**Verify:**
- [ ] Your Alloy account supports OAuth flows
- [ ] Your plan includes API access
- [ ] No restrictions on OAuth credential creation
- [ ] Account is in good standing (not suspended)

## Diagnostic Steps

### Step 1: Verify API Key Works

Test your API key with a simple API call:

```bash
curl -X GET https://production.runalloy.com/api/users/YOUR_USER_ID/credentials \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "x-api-version: 2025-09"
```

If this fails, your API key might not have the correct permissions.

### Step 2: Check OAuth URL Generation

When you initiate OAuth, check the generated OAuth URL:

1. Open browser console (F12)
2. Click "Connect Notion"
3. Check the OAuth URL that's generated
4. Verify it contains:
   - `redirectUri=http://localhost:3000/oauth/callback` (URL-encoded)
   - `userId=YOUR_USER_ID`
   - Correct connector ID (`notion`)

### Step 3: Monitor Server Logs

Watch your server console for:
- OAuth initiation request
- OAuth URL generation
- Callback reception
- Any error messages from Alloy API

### Step 4: Check Alloy Dashboard Logs

**Location:** Alloy Dashboard → Logs/Activity (if available)

**Look for:**
- OAuth flow attempts
- Error messages
- Failed credential creation attempts
- Redirect URI mismatches

## Common Issues and Solutions

### Issue 1: Redirect URI Not Registered

**Symptom:** Callback received but no code
**Solution:** Register redirect URI in Alloy dashboard (if required)

### Issue 2: API Key Permissions

**Symptom:** OAuth initiation fails or callback has no code
**Solution:** Ensure API key has OAuth/credentials permissions

### Issue 3: User ID Mismatch

**Symptom:** `userId is required` or `userId must be valid`
**Solution:** Verify User ID matches the account associated with API key

### Issue 4: Connector Not Available

**Symptom:** OAuth initiation fails
**Solution:** Verify Notion connector is enabled in your Alloy workspace

### Issue 5: API Version Mismatch

**Symptom:** Requests fail with version errors
**Solution:** Ensure using correct API version (`2025-09`)

## Testing OAuth Flow Manually

1. **Initiate OAuth:**
   ```bash
   POST /api/oauth/initiate
   {
     "connectorId": "notion",
     "redirectUri": "http://localhost:3000/oauth/callback"
   }
   ```

2. **Copy the OAuth URL** from the response

3. **Open OAuth URL in browser** and complete authorization

4. **Check what URL you're redirected to:**
   - Should be: `http://localhost:3000/oauth/callback?code=...`
   - If different, that's the issue!

5. **Check server logs** for callback details

## Contact Alloy Support

If the issue persists after checking all of the above:

1. **Gather Information:**
   - API key (first few characters only for security)
   - User ID
   - OAuth URL that was generated
   - Callback URL you were redirected to
   - Server logs
   - Timestamp of the attempt

2. **Contact Alloy Support:**
   - Email: support@runalloy.com (or check Alloy dashboard for support contact)
   - Include all gathered information
   - Mention: "OAuth callback received but no authorization code parameter"

3. **Ask Specifically:**
   - Does my account/API key have OAuth permissions?
   - Do I need to register redirect URIs?
   - Are there any restrictions on my account?
   - Is the Notion connector available for my account?

## Quick Diagnostic Script

Run this to test your Alloy configuration:

```bash
# Test API key and list connections
curl -X GET https://production.runalloy.com/api/users/YOUR_USER_ID/credentials \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "x-api-version: 2025-09" \
  | jq .

# Test OAuth initiation
curl -X POST https://production.runalloy.com/connectors/notion/credentials \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "x-api-version: 2025-09" \
  -H "Content-Type: application/json" \
  -d '{
    "connectorId": "notion",
    "authenticationType": "oauth2",
    "redirectUri": "http://localhost:3000/oauth/callback",
    "userId": "YOUR_USER_ID"
  }' \
  | jq .
```

## Next Steps

1. ✅ Check Alloy Dashboard for OAuth configuration
2. ✅ Verify API key permissions
3. ✅ Test API key with diagnostic script
4. ✅ Check server logs for detailed error messages
5. ✅ Contact Alloy support if issue persists

