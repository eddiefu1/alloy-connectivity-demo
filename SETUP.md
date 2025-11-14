# Setup Guide

This guide will walk you through setting up the Alloy Connectivity Demo step by step.

## Step 1: Get Alloy Credentials

1. **Create an Alloy Account**
   - Visit [https://runalloy.com](https://runalloy.com)
   - Sign up for a free account
   - Verify your email address

2. **Get Your API Credentials**
   - Log in to [Alloy Dashboard](https://app.runalloy.com)
   - Navigate to **Settings** → **API Keys**
   - Click **Create API Key**
   - Copy your API Key (keep it secure!)
   - Copy your User ID from the dashboard

3. **Set Up an Integration (Optional for Full Demo)**
   - Go to **Connections** in the Alloy dashboard
   - Select an integration (e.g., Notion)
   - Follow the OAuth flow to connect your account
   - Note the Connection ID for your `.env` file

## Step 2: Install Dependencies

```bash
# Clone the repository
git clone https://github.com/eddiefu1/alloy-connectivity-demo.git
cd alloy-connectivity-demo

# Install Node.js dependencies
npm install
```

## Step 3: Configure Environment

1. **Copy the environment template**
   ```bash
   cp .env.example .env
   ```

2. **Edit the .env file**
   ```bash
   # Use your favorite editor
   nano .env
   # or
   vim .env
   # or
   code .env
   ```

3. **Add your credentials**
   ```env
   ALLOY_API_KEY=your_api_key_here
   ALLOY_USER_ID=your_user_id_here
   CONNECTION_ID=your_connection_id_here
   
   # Optional: Custom OAuth Redirect URI
   # If not set, defaults to http://localhost:3000/oauth/callback
   # Make sure this matches what's registered in your Alloy account
   OAUTH_REDIRECT_URI=http://localhost:3000/oauth/callback
   
   # Optional: Notion Internal Integration Token
   # For direct Notion API access (bypassing Alloy OAuth)
   NOTION_INTERNAL_TOKEN=your_notion_internal_token_here
   ```

## Step 4: Run the Demo

### Option A: Development Mode (Recommended for Testing)

```bash
npm run dev
```

This will run the demo using TypeScript directly without compilation.

### Option B: Production Mode

```bash
# First, build the project
npm run build

# Then run the compiled JavaScript
npm start
```

## Step 5: Test Your Setup

### Verify Connection (Recommended)

Verify and set your working Notion connection:

```bash
npm run verify-connection
```

This will test your connections, find a working one, and automatically update your `.env` file.

### List Existing Connections

If you already have connections, list them:

```bash
npm run list-connections
```

This will list all your connections and suggest a connection ID to use.

## Step 6: Run the Demo

When you run the demo successfully, you should see output similar to:

```
🚀 Starting Alloy Connectivity API Demo

==================================================
STEP 1: Authentication Flow
==================================================
✓ API Key configured: [REDACTED]
✓ User ID: [REDACTED]
✓ Connection ID: [REDACTED]

STEP 2: Connect to Integration
==================================================
   Testing connection: [REDACTED]
✓ Connection verified and working!
✓ Connection ID: [REDACTED]
✓ API calls are functional

STEP 3: Read Data - Fetch Pages
==================================================
✓ Successfully read 0 page records
   No pages found in your Notion workspace

STEP 4: Write Data - Create New Page
==================================================
✅ Page created successfully!
   Page ID: [REDACTED]
   URL: [REDACTED]

STEP 5: Update Data - Update Existing Page
==================================================
   Using newly created page: [REDACTED]
✅ Page updated successfully!
   Updated page ID: [REDACTED]
   Updated URL: [REDACTED]
```

## Troubleshooting

### "ALLOY_API_KEY environment variable is required"

**Problem**: The `.env` file is missing or doesn't contain the required variables.

**Solution**:
1. Make sure you created a `.env` file from `.env.example`
2. Verify the file contains `ALLOY_API_KEY` and `ALLOY_USER_ID`
3. Check there are no extra spaces around the `=` sign

### "Authentication failed" or "Invalid Authorization"

**Problem**: Invalid API credentials or network issues.

**Solutions**:
1. Verify your API key is correct and hasn't been revoked
2. Check your User ID is correct
3. Ensure you have internet connectivity
4. Verify your connection: `npm run verify-connection`
5. Verify you're using the correct base URL: `https://production.runalloy.com`
6. Try regenerating your API key in the Alloy dashboard
7. Ensure your API key has Connectivity API permissions

### "Connection not yet established" or "Credential not found"

**Problem**: The integration hasn't been connected yet or the connection ID is invalid.

**Solutions**:
1. **Verify connection (Recommended)**: Run `npm run verify-connection` to find and set a working connection
2. **List existing connections**: Run `npm run list-connections` to see your connections
3. **Create a new connection**: Run `npm run connect-notion` to create a new OAuth connection
4. **Verify connection ID**: Make sure the Connection ID in your `.env` file is correct
5. **Check connection in dashboard**: Go to Alloy Dashboard → Connections to verify

**Note**: Some connection IDs from the list may not work for API calls. Use `npm run verify-connection` to identify which connections actually work and automatically update your `.env` file.

### Module not found errors

**Problem**: Dependencies not installed or npm cache issues.

**Solution**:
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

### TypeScript compilation errors

**Problem**: TypeScript configuration issues.

**Solution**:
```bash
# Rebuild the project
npm run build
```

## Next Steps

Once you have the basic demo running:

1. **Customize the Integration**: Change the `CONNECTION_ID` in `.env` to use different Notion workspaces
2. **Modify the Data**: Edit the page data in `src/demo.ts` to sync different information
3. **Add More Operations**: Explore the `AlloyClient` class to add more CRUD operations for pages and databases
4. **Build Your Own Integration**: Use this as a template for your own iPaaS automation with Notion

## Additional Resources

- [Alloy Documentation](https://docs.runalloy.com)
- [Alloy API Reference](https://docs.runalloy.com/api-reference)
- [Alloy Community](https://community.runalloy.com)
- [Node.js SDK Documentation](https://github.com/alloy-automation/alloy-node)

## Support

If you encounter issues not covered in this guide:

1. Check the [Alloy Documentation](https://docs.runalloy.com)
2. Search for similar issues on GitHub
3. Contact Alloy Support through their dashboard
4. Open an issue in this repository
