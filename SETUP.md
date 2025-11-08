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
   - Go to **Integrations** in the Alloy dashboard
   - Select an integration (e.g., Salesforce, HubSpot)
   - Follow the OAuth flow to connect your account
   - Note the Integration ID for your `.env` file

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
   ALLOY_API_KEY=your_actual_api_key_here
   ALLOY_USER_ID=your_actual_user_id_here
   INTEGRATION_ID=salesforce
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

## Step 5: Expected Output

When you run the demo successfully, you should see output similar to:

```
🚀 Starting Alloy Connectivity API Demo

==================================================
📋 Configuration loaded:
   Base URL: https://api.runalloy.com
   User ID: usr_123abc...
   API Key: key_456def...

==================================================
STEP 1: Authentication Flow
==================================================
Authenticating user usr_123abc for integration salesforce...
✓ User authenticated successfully

...
```

## Troubleshooting

### "ALLOY_API_KEY environment variable is required"

**Problem**: The `.env` file is missing or doesn't contain the required variables.

**Solution**:
1. Make sure you created a `.env` file from `.env.example`
2. Verify the file contains `ALLOY_API_KEY` and `ALLOY_USER_ID`
3. Check there are no extra spaces around the `=` sign

### "Authentication failed"

**Problem**: Invalid API credentials or network issues.

**Solutions**:
1. Verify your API key is correct and hasn't been revoked
2. Check your User ID is correct
3. Ensure you have internet connectivity
4. Try regenerating your API key in the Alloy dashboard

### "Connection not yet established"

**Problem**: The integration hasn't been connected yet.

**Solution**: This is normal if you haven't set up an integration yet. The demo will show you what would happen when a connection exists. To fully test:
1. Go to Alloy Dashboard → Integrations
2. Select an integration (e.g., Salesforce)
3. Click "Connect" and follow the OAuth flow
4. Run the demo again

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

1. **Customize the Integration**: Change the `INTEGRATION_ID` in `.env` to use different integrations
2. **Modify the Data**: Edit the contact data in `src/demo.ts` to sync different information
3. **Add More Operations**: Explore the `AlloyClient` class to add more CRUD operations
4. **Build Your Own Integration**: Use this as a template for your own iPaaS automation

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
