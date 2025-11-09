# Finding Working Connections

This guide explains how to find a working connection ID from your Alloy account.

## Quick Answer

**The easiest way to find a working connection:**

```bash
npm run test-all-connections
```

This script will:
1. List all your connections
2. Test each one with a real API call
3. Show you which connections actually work
4. Recommend the best connection to use

## Understanding Connection IDs

There are two types of connection IDs you might encounter:

1. **Credential IDs from List API** - These appear when you list connections, but may not work for API calls
2. **Working Connection IDs** - These work for actual API calls (created via OAuth flow or MCP tools)

## Methods to Find Working Connections

### Method 1: Test All Connections (Recommended)

```bash
npm run test-all-connections
```

**What it does:**
- Tests all connections in your account
- Verifies which ones work for API calls
- Provides a recommended connection ID

**Output:**
```
✅ Working Connections: 1

   Recommended connection(s):

   1. Connection from .env (Current)
      Connection ID: 6911017b4d2bcbfd4ce727fe
      Type: notion-oauth2
      Pages found: 0
      
      Add to .env:
      CONNECTION_ID=6911017b4d2bcbfd4ce727fe
```

### Method 2: Create a New Connection via OAuth

```bash
npm run connect-notion
```

**What it does:**
- Initiates OAuth flow
- Opens browser for authorization
- Creates a new connection
- Returns a connection ID that works for API calls

**Steps:**
1. Run `npm run connect-notion`
2. Authorize the connection in your browser
3. Copy the connection ID from the success page
4. Add it to your `.env` file

### Method 3: Find Connections via List

```bash
npm run find-notion-connection
```

**What it does:**
- Lists all Notion connections
- Shows connection details
- **Note:** These connections may not all work for API calls

**Important:** Just because a connection appears in the list doesn't mean it works for API calls. You need to test it.

### Method 4: Test a Specific Connection

```bash
npm run test-notion-connection
```

**What it does:**
- Tests the connection ID in your `.env` file
- Verifies it works for API calls
- Shows connection status

**Before running:**
- Make sure `CONNECTION_ID` is set in your `.env` file

## Why Some Connections Don't Work

### Common Reasons

1. **Different Authentication Source**
   - Connections created via MCP tools may use different IDs
   - Connections created via REST API OAuth use different IDs
   - Connections from the dashboard may use different IDs

2. **Connection Status**
   - Connections may be inactive or expired
   - Connections may not have proper permissions
   - Connections may be from a different user/workspace

3. **API Scope**
   - Some connections work for specific APIs only
   - Connectivity API may require specific connection types
   - Different APIs may use different credential formats

## Best Practices

### 1. Test Before Using

Always test a connection before using it:

```bash
npm run test-notion-connection
```

### 2. Use the Test All Script

When in doubt, test all connections:

```bash
npm run test-all-connections
```

This will tell you exactly which connections work.

### 3. Create New Connections via OAuth

The most reliable way to get a working connection:

```bash
npm run connect-notion
```

This creates a connection specifically for the REST API.

### 4. Keep Working Connection IDs

Once you find a working connection ID:
- Save it in your `.env` file
- Document it for your team
- Don't delete it unless necessary

## Troubleshooting

### "Credential not found" for All Connections

**Problem:** None of your connections work for API calls.

**Solutions:**
1. Create a new connection via OAuth: `npm run connect-notion`
2. Verify your API key has Connectivity API permissions
3. Check that you're using the correct base URL: `https://production.runalloy.com`
4. Ensure your API key matches the user who created the connections

### Connection Works but Not in List

**Problem:** Connection ID works for API calls but doesn't appear in the list.

**Solution:** This is normal! Some connections work for API calls even if they don't appear in the list. If the connection works, use it.

### Connection in List but Doesn't Work

**Problem:** Connection appears in list but fails API calls with "Credential not found".

**Solution:** This connection was created via a different method. You need to:
1. Create a new connection via OAuth: `npm run connect-notion`
2. Or use a connection ID that you know works (from MCP tools, etc.)

## Example Workflow

```bash
# Step 1: Test all connections to see what works
npm run test-all-connections

# Step 2: If no working connections, create a new one
npm run connect-notion

# Step 3: Test the new connection
npm run test-notion-connection

# Step 4: Run the demo
npm run dev
```

## Summary

**To find a working connection:**

1. ✅ **Best method:** Run `npm run test-all-connections` to test all connections
2. ✅ **If none work:** Create a new connection via `npm run connect-notion`
3. ✅ **Test it:** Use `npm run test-notion-connection` to verify it works
4. ✅ **Use it:** Add the working connection ID to your `.env` file

**Remember:** 
- Connection IDs from the list may not work for API calls
- Always test connections before using them
- Create new connections via OAuth for the most reliable results
- The connection ID `6911017b4d2bcbfd4ce727fe` is currently working in your setup

