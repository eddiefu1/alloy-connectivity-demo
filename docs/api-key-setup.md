# API Key Setup Guide for REST API Authentication

## Problem

The REST API is returning `401 Invalid Authorization` errors, which means the API key is not valid for REST API calls.

## Current Status

- ✅ Connection ID: `690ff6ff2472d76a35e7ebaa` (configured)
- ✅ Base URL: `https://production.runalloy.com` (correct)
- ❌ API Key: `3w7i97HGoxuRIi4EAngKv` (not valid for REST API)
- ✅ MCP Tools: Working (using different authentication)

## Solution: Get a Valid REST API Key

### Step 1: Access Alloy Dashboard

1. Go to [https://app.runalloy.com](https://app.runalloy.com)
2. Log in to your account

### Step 2: Navigate to API Keys

1. Click on **Settings** in the navigation menu
2. Select **API Keys** from the settings menu
3. You should see a list of your API keys

### Step 3: Create or Verify API Key

#### Option A: Create a New API Key

1. Click **Create API Key** or **New API Key**
2. Give it a descriptive name (e.g., "REST API Key")
3. **Important**: Make sure it has **Connectivity API** permissions enabled
4. Copy the API key immediately (you won't be able to see it again)
5. Copy your **User ID** from the dashboard

#### Option B: Verify Existing API Key

1. Find your existing API key in the list
2. Check if it has **Connectivity API** permissions
3. If not, you may need to create a new one with the correct permissions
4. Verify the User ID matches your account

### Step 4: Update .env File

Update your `.env` file with the new API key:

```env
# Alloy API Configuration
ALLOY_API_KEY=your_new_api_key_here
ALLOY_USER_ID=690674c276dcda35a40b242d
ALLOY_BASE_URL=https://production.runalloy.com
CONNECTION_ID=690ff6ff2472d76a35e7ebaa
```

### Step 5: Test the API Key

Run the diagnostic script to verify the API key works:

```bash
npm run test-api-auth
```

You should see ✅ SUCCESS for at least some of the tests.

## API Key Requirements

### Format
- API keys are typically 20-30 characters long
- They may contain letters, numbers, and special characters
- Example format: `M4FRCFAQaciuUMF2lKwQv` or `TWsxXkP4OngtBYRl1_soA`

### Permissions
- **Connectivity API**: Required for OAuth and connection management
- **Data API**: Required for reading/writing data through connections
- Make sure your API key has the necessary permissions enabled

### Base URL
- **REST API**: `https://production.runalloy.com`
- **MCP Tools**: May use different authentication (configured separately)

## Troubleshooting

### Still Getting 401 Errors?

1. **Verify API Key Format**
   - Check for extra spaces or newlines
   - Ensure the key is copied correctly
   - Try regenerating the key

2. **Check Permissions**
   - Verify the API key has Connectivity API permissions
   - Check if the key is active (not revoked or expired)

3. **Verify User ID**
   - Ensure the User ID matches the API key owner
   - User ID format: 24-character hex string (e.g., `690674c276dcda35a40b242d`)

4. **Check Base URL**
   - Use `https://production.runalloy.com` for REST API
   - Don't use `https://api.runalloy.com` (may be deprecated)

5. **Test with Different Endpoints**
   - Some endpoints may work while others don't
   - Run `npm run test-api-auth` to see which endpoints work

### API Key Works with MCP but Not REST API?

- MCP tools may use a different authentication method
- REST API requires a valid API key with Bearer token authentication
- Make sure you're using the correct API key for REST API calls

## Verification Steps

After updating your API key, verify it works:

1. **Test Authentication**
   ```bash
   npm run test-api-auth
   ```

2. **List Connections**
   ```bash
   npm run list-connections
   ```

3. **Test OAuth Flow**
   ```bash
   npm run connect-notion
   ```

4. **Run Demo**
   ```bash
   npm run dev
   ```

## Security Notes

- ⚠️ **Never commit API keys to version control**
- ⚠️ **Keep API keys secure and private**
- ⚠️ **Rotate API keys regularly**
- ⚠️ **Use different keys for development and production**
- ⚠️ **Revoke unused or compromised keys immediately**

## Next Steps

Once you have a valid API key:

1. ✅ Update `.env` file with the new API key
2. ✅ Run `npm run test-api-auth` to verify
3. ✅ Test OAuth flow: `npm run connect-notion`
4. ✅ Run the demo: `npm run dev`

## Additional Resources

- [Alloy Dashboard](https://app.runalloy.com)
- [Alloy Documentation](https://docs.runalloy.com)
- [API Key Management](https://app.runalloy.com/settings/api-keys)

