# Environment Setup Guide

This guide explains how to configure your development and production environments for the Alloy Connectivity API.

## API Keys

You have two API keys:

- **Development API Key**: `M4FRCFAQaciuUMF2lKwQv`
- **Production API Key**: `TWsxXkP4OngtBYRl1_soA`

## Environment Configuration

### Development Environment

For development/testing, use your development API key:

```env
# .env (development)
ALLOY_ENVIRONMENT=development
ALLOY_API_KEY=M4FRCFAQaciuUMF2lKwQv
ALLOY_USER_ID=your_user_id_here
ALLOY_BASE_URL=https://production.runalloy.com
```

### Production Environment

For production, use your production API key:

```env
# .env (production)
ALLOY_ENVIRONMENT=production
ALLOY_API_KEY=TWsxXkP4OngtBYRl1_soA
ALLOY_USER_ID=your_user_id_here
ALLOY_BASE_URL=https://production.runalloy.com
```

## Base URL Configuration

**Important**: Both development and production API keys use the same base URL:
- `https://production.runalloy.com` (for OAuth and credentials)
- `https://api.runalloy.com` (for unified API, if used)

The difference is only in which API key you use, not the base URL.

## Setup Instructions

### 1. Create `.env` File

Create a `.env` file in the project root:

```bash
# Copy the example file
cp .env.example .env
```

### 2. Configure Your Environment

Edit the `.env` file with your credentials:

**For Development:**
```env
ALLOY_ENVIRONMENT=development
ALLOY_API_KEY=M4FRCFAQaciuUMF2lKwQv
ALLOY_USER_ID=your_user_id_here
ALLOY_BASE_URL=https://production.runalloy.com
```

**For Production:**
```env
ALLOY_ENVIRONMENT=production
ALLOY_API_KEY=TWsxXkP4OngtBYRl1_soA
ALLOY_USER_ID=your_user_id_here
ALLOY_BASE_URL=https://production.runalloy.com
```

### 3. Verify Configuration

Check your configuration:

```bash
# Start the server
npm run server

# In another terminal, check the config
curl http://localhost:3000/api/config/check
```

## Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `ALLOY_ENVIRONMENT` | No | Environment: `development` or `production` | `production` |
| `ALLOY_API_KEY` | Yes | Your Alloy API key | `TWsxXkP4OngtBYRl1_soA` |
| `ALLOY_USER_ID` | Yes | Your Alloy user ID | `user_123` |
| `ALLOY_BASE_URL` | No | API base URL (default: `https://production.runalloy.com`) | `https://production.runalloy.com` |
| `CONNECTION_ID` | Yes* | Connection ID after OAuth flow | `conn_123` |

*Required for data operations after completing OAuth flow.

## Switching Between Environments

### Method 1: Update `.env` File

Simply edit the `.env` file and change the `ALLOY_API_KEY`:

```env
# Switch to development
ALLOY_API_KEY=M4FRCFAQaciuUMF2lKwQv
ALLOY_ENVIRONMENT=development

# Switch to production
ALLOY_API_KEY=TWsxXkP4OngtBYRl1_soA
ALLOY_ENVIRONMENT=production
```

### Method 2: Use Environment-Specific Files

Create separate environment files:

```bash
# .env.development
ALLOY_ENVIRONMENT=development
ALLOY_API_KEY=M4FRCFAQaciuUMF2lKwQv
ALLOY_USER_ID=your_user_id_here

# .env.production
ALLOY_ENVIRONMENT=production
ALLOY_API_KEY=TWsxXkP4OngtBYRl1_soA
ALLOY_USER_ID=your_user_id_here
```

Then load the appropriate file:

```bash
# Development
cp .env.development .env
npm run server

# Production
cp .env.production .env
npm run server
```

### Method 3: Use Environment Variables Directly

Set environment variables when running commands:

```bash
# Development
ALLOY_API_KEY=M4FRCFAQaciuUMF2lKwQv ALLOY_ENVIRONMENT=development npm run server

# Production
ALLOY_API_KEY=TWsxXkP4OngtBYRl1_soA ALLOY_ENVIRONMENT=production npm run server
```

## Security Best Practices

1. **Never commit API keys**: The `.env` file is in `.gitignore` and should never be committed
2. **Use different keys for dev/prod**: Use development keys for testing, production keys for live apps
3. **Rotate keys regularly**: Update your API keys periodically for security
4. **Limit key permissions**: In Alloy Dashboard, restrict API key permissions to only what's needed
5. **Monitor key usage**: Check Alloy Dashboard for unusual API key activity

## Troubleshooting

### "Invalid API Key" Error

1. Verify the API key is correct in `.env`
2. Check for extra spaces or quotes in the API key
3. Ensure you're using the correct key for your environment
4. Verify the key is active in Alloy Dashboard

### "Unauthorized" Error

1. Check that `ALLOY_USER_ID` matches your account
2. Verify the API key has the correct permissions
3. Ensure the API key is not expired or revoked

### Environment Not Switching

1. Restart the server after changing `.env`
2. Clear any cached configuration
3. Verify the `.env` file is in the project root
4. Check that environment variables are being loaded correctly

## Testing Your Setup

1. **Check configuration**:
   ```bash
   curl http://localhost:3000/api/config/check
   ```

2. **Test OAuth flow**:
   ```bash
   npm run connect-notion
   ```

3. **List connections**:
   ```bash
   npm run list-connections
   ```

4. **Get token information**:
   ```bash
   npm run get-tokens <connectionId>
   ```

## Next Steps

After setting up your environment:

1. Complete the OAuth flow to get a Connection ID
2. Add the Connection ID to your `.env` file
3. Start making API calls using the Connection ID
4. Monitor your API usage in Alloy Dashboard

