# Quick Start Guide - Finding Working Connections

## How to Find a Working Connection

### Method 1: Test All Connections (Recommended) ⭐

```bash
npm run test-all-connections
```

**This is the best way to find a working connection!**

The script will:
1. ✅ List all your connections
2. ✅ Test each one with a real API call
3. ✅ Show you which connections work
4. ✅ Recommend the best connection to use

**Example Output:**
```
✅ Working Connections: 1

   💡 RECOMMENDED CONNECTION:
      Connection ID: 6911017b4d2bcbfd4ce727fe
      Name: Connection from .env (Current)
      
      Update your .env file:
      CONNECTION_ID=6911017b4d2bcbfd4ce727fe
```

### Method 2: Create a New Connection

```bash
npm run connect-notion
```

**Steps:**
1. Run the command
2. Authorize in your browser
3. Copy the connection ID from the success page
4. Add it to your `.env` file

### Method 3: Find Connections (Lists but doesn't test)

```bash
npm run find-notion-connection
```

**Note:** This lists connections but doesn't test if they work. Use `test-all-connections` instead.

## Quick Checklist

- [ ] ✅ Test all connections: `npm run test-all-connections`
- [ ] ✅ If no working connections, create new one: `npm run connect-notion`
- [ ] ✅ Test the connection: `npm run test-notion-connection`
- [ ] ✅ Update `.env` with working connection ID
- [ ] ✅ Run demo: `npm run dev`

## Current Working Connection

Based on testing, your current working connection is:

```
CONNECTION_ID=6911017b4d2bcbfd4ce727fe
```

**This connection works for API calls!** ✅

## Why Some Connections Don't Work

- Connections from the list API may not work for Connectivity API calls
- Connections created via different methods use different IDs
- Some connections may be inactive or expired
- Always test connections before using them

## Need Help?

See the [Finding Working Connections Guide](docs/finding-working-connections.md) for detailed information.

