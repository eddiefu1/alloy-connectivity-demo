# Quick Setup Guide - API Keys

## Your API Keys

You have been provided with the following API keys:

- **Development API Key**: `M4FRCFAQaciuUMF2lKwQv`
- **Production API Key**: `TWsxXkP4OngtBYRl1_soA`

## Quick Setup

### Step 1: Create `.env` File

Create a `.env` file in the project root with the following content:

```env
# Alloy API Configuration

# For Development - use development key
ALLOY_ENVIRONMENT=development
ALLOY_API_KEY=M4FRCFAQaciuUMF2lKwQv

# For Production - use production key
# ALLOY_ENVIRONMENT=production
# ALLOY_API_KEY=TWsxXkP4OngtBYRl1_soA

# Your User ID (get from Alloy Dashboard)
ALLOY_USER_ID=your_user_id_here

# Base URL (both dev and prod use the same URL)
ALLOY_BASE_URL=https://production.runalloy.com

# Connection ID (obtained after OAuth flow)
CONNECTION_ID=your_connection_id_here
```

### Step 2: Get Your User ID

1. Go to [Alloy Dashboard](https://app.runalloy.com)
2. Navigate to Settings → API Keys
3. Copy your **User ID**
4. Replace `your_user_id_here` in the `.env` file

### Step 3: Verify Configuration

```bash
# Start the server
npm run server

# In another terminal, check config
curl http://localhost:3000/api/config/check
```

You should see:
```json
{
  "success": true,
  "config": {
    "hasApiKey": true,
    "hasUserId": true,
    "baseUrl": "https://production.runalloy.com",
    "environment": "development",
    "apiKeyPreview": "M4FRCFAQac..."
  },
  "status": {
    "ready": true
  }
}
```

## Switching Between Environments

### Development Mode

```env
ALLOY_ENVIRONMENT=development
ALLOY_API_KEY=M4FRCFAQaciuUMF2lKwQv
```

### Production Mode

```env
ALLOY_ENVIRONMENT=production
ALLOY_API_KEY=TWsxXkP4OngtBYRl1_soA
```

**Important**: Restart the server after changing the `.env` file.

## Security Notes

⚠️ **IMPORTANT SECURITY REMINDERS**:

1. **Never commit `.env` file**: The `.env` file is in `.gitignore` and should never be committed to version control
2. **Keep keys secret**: Don't share API keys in public channels, emails, or code repositories
3. **Use development key for testing**: Use the development key for local testing and development
4. **Use production key for live apps**: Only use the production key in production environments
5. **Rotate keys if compromised**: If you suspect a key is compromised, regenerate it in Alloy Dashboard

## Next Steps

1. ✅ Add API keys to `.env` file
2. ✅ Add User ID to `.env` file
3. ✅ Start the server: `npm run server`
4. ✅ Complete OAuth flow to get Connection ID
5. ✅ Add Connection ID to `.env` file
6. ✅ Start making API calls!

For more detailed information, see [Environment Setup Guide](docs/environment-setup.md).

