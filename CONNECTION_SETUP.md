# 🔗 Notion OAuth2 Connection Setup

## Connection ID: `690ff6ff2472d76a35e7ebaa`

Your connection ID has been saved to `.env` file.

## ✅ Current Setup

Your `.env` file now contains:
```env
CONNECTION_ID=690ff6ff2472d76a35e7ebaa
```

## 🧪 Testing the Connection

### Method 1: Test Script
```bash
npm run test-connection 690ff6ff2472d76a35e7ebaa
```

### Method 2: Via API (if server is running)
```bash
# Start server first
npm run server

# Then test the connection
curl http://localhost:3000/api/connections/690ff6ff2472d76a35e7ebaa
```

### Method 3: Using Code
```typescript
import { NotionClient } from './notion-client.js';
import { getConfig } from './config.js';

const config = getConfig();
const connectionId = '690ff6ff2472d76a35e7ebaa';
const client = new NotionClient(config, connectionId);

// Test the connection
const pages = await client.searchPages();
console.log(`Found ${pages.length} pages`);
```

## ⚠️ Troubleshooting

### If you get "Credential not found" error:

1. **Verify the Connection ID is correct**
   - Check your Alloy Dashboard: https://app.runalloy.com
   - Go to Connections → Find your Notion connection
   - Copy the exact Connection ID

2. **Check API Credentials**
   - Verify `ALLOY_API_KEY` in `.env` is correct
   - Verify `ALLOY_USER_ID` in `.env` is correct
   - Make sure you're using the correct environment (development vs production)

3. **List Your Connections**
   ```bash
   npm run list-connections notion
   ```
   This will show all your Notion connections with their IDs.

4. **Verify Connection Status**
   - The connection might be inactive or expired
   - Check in Alloy Dashboard if the connection is active
   - You may need to reconnect via OAuth

## 🔄 Reconnecting (if needed)

If the connection doesn't work, create a new one:

### Option 1: Web Interface
```bash
npm run server
# Then visit http://localhost:3000
```

### Option 2: Command Line
```bash
npm run connect-notion
```

### Option 3: API
```bash
# Start server
npm run server

# Initiate OAuth
curl -X POST http://localhost:3000/api/oauth/initiate \
  -H "Content-Type: application/json" \
  -d '{"connectorId": "notion"}'
```

## 📝 Connection ID Format

Connection IDs in Alloy are typically:
- **24 characters** (hexadecimal)
- Example: `690ff6ff2472d76a35e7ebaa` ✅
- Format: `[a-f0-9]{24}`

If your ID is different, it might be:
- A **Credential ID** (used internally)
- A **User ID** (different from connection ID)
- An **OAuth state parameter**

## ✅ Verification Checklist

- [ ] Connection ID is 24 characters (hex)
- [ ] `ALLOY_API_KEY` is set correctly
- [ ] `ALLOY_USER_ID` is set correctly
- [ ] Connection exists in Alloy Dashboard
- [ ] Connection status is "active" or "connected"
- [ ] OAuth was completed successfully

## 🎯 Next Steps

Once the connection is verified:

1. **Use the Connection**:
   ```typescript
   const client = new NotionClient(config, '690ff6ff2472d76a35e7ebaa');
   ```

2. **Available Operations**:
   - `client.searchPages()` - Search for pages
   - `client.getPage(id)` - Get a specific page
   - `client.createPage(data)` - Create a new page
   - `client.updatePage(id, updates)` - Update a page
   - `client.queryDatabase(id, query)` - Query a database
   - `client.getDatabase(id)` - Get database details

3. **Test Operations**:
   ```bash
   npm run test-connection 690ff6ff2472d76a35e7ebaa
   ```

## 📚 Additional Resources

- **OAuth Guide**: See [OAUTH_GUIDE.md](./OAUTH_GUIDE.md)
- **Alloy Dashboard**: https://app.runalloy.com
- **API Documentation**: https://docs.runalloy.com/connectivity-api

