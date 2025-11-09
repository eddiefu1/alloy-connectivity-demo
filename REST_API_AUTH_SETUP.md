# REST API Authentication Setup Guide

## Quick Fix Guide

Your API key `3w7i97HGoxuRIi4EAngKv` is **not valid for REST API calls**. Here's how to fix it:

## Step 1: Get a Valid API Key

1. **Go to Alloy Dashboard**: [https://app.runalloy.com](https://app.runalloy.com)
2. **Navigate to Settings → API Keys**
3. **Create a new API key** with Connectivity API permissions
4. **Copy the new API key** (you won't see it again!)

## Step 2: Update Your .env File

Replace the API key in your `.env` file:

```env
ALLOY_API_KEY=your_new_api_key_here
ALLOY_USER_ID=690674c276dcda35a40b242d
ALLOY_BASE_URL=https://production.runalloy.com
CONNECTION_ID=690ff6ff2472d76a35e7ebaa
```

## Step 3: Test the API Key

Run the diagnostic script:

```bash
npm run test-api-auth
```

You should see ✅ SUCCESS for the tests.

## Step 4: Test OAuth Flow

Once the API key works, test the OAuth flow:

```bash
npm run connect-notion
```

## Why This Happens

- **MCP Tools** use a different authentication method (configured in Cursor)
- **REST API** requires a valid API key with Bearer token authentication
- Your current API key works with MCP but not with REST API
- You need a REST API-compatible API key from the Alloy Dashboard

## Current Configuration

- ✅ **Connection ID**: `690ff6ff2472d76a35e7ebaa` (working)
- ✅ **Base URL**: `https://production.runalloy.com` (correct)
- ✅ **User ID**: `690674c276dcda35a40b242d` (correct)
- ❌ **API Key**: `3w7i97HGoxuRIi4EAngKv` (not valid for REST API)

## Diagnostic Tool

I've created a diagnostic script to test your API key:

```bash
npm run test-api-auth
```

This will test:
1. List connections endpoint
2. Get connection endpoint
3. List available connectors
4. OAuth initiation endpoint

## Need Help?

1. Check the [API Key Setup Guide](docs/api-key-setup.md) for detailed instructions
2. Verify your API key has Connectivity API permissions
3. Make sure the User ID matches the API key owner
4. Try regenerating the API key in the dashboard

## Next Steps

After getting a valid API key:

1. ✅ Update `.env` file
2. ✅ Run `npm run test-api-auth`
3. ✅ Run `npm run connect-notion`
4. ✅ Run `npm run dev`

Your connection ID is already set up, so once the API key works, everything should function correctly!

