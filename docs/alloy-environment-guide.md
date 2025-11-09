# Alloy Environment Guide: Production vs Development

## Current Configuration

The codebase is currently configured to use **PRODUCTION** environment:

- **OAuth Flow**: `https://production.runalloy.com` (hardcoded in `src/oauth-flow.ts`)
- **Default Base URL**: `https://api.runalloy.com` (configurable via `ALLOY_BASE_URL`)
- **Dashboard**: `https://app.runalloy.com` (production dashboard)

## Which API Key Should You Use?

### ✅ **Use PRODUCTION API Key**

**You should use the PRODUCTION API key** from your Alloy dashboard:

1. **Go to**: https://app.runalloy.com
2. **Navigate to**: Settings → API Keys
3. **Copy your API key** - This is your **production API key**

### Why Production?

- The code is hardcoded to use `production.runalloy.com` for OAuth flows
- The Alloy dashboard at `app.runalloy.com` provides production API keys
- Production is the standard environment for real integrations

## Environment Configuration

### Current Setup (Production)

```env
ALLOY_API_KEY=your_production_api_key_here
ALLOY_USER_ID=your_user_id_here
ALLOY_BASE_URL=https://api.runalloy.com
```

### If Alloy Has Development/Staging Environment

If Alloy provides a separate development/staging environment, you would need to:

1. **Get development API key** from development dashboard (if available)
2. **Update OAuth flow base URL** in `src/oauth-flow.ts`:
   ```typescript
   baseURL: 'https://development.runalloy.com', // or staging URL
   ```
3. **Update base URL** in `.env`:
   ```env
   ALLOY_BASE_URL=https://api-dev.runalloy.com
   ```

## How to Verify Your Environment

### Check Your API Key

1. **Log in to Alloy Dashboard**: https://app.runalloy.com
2. **Go to Settings → API Keys**
3. **Check the API key details**:
   - Does it say "Production" or "Development"?
   - What environment does it belong to?

### Test Your API Key

Run the diagnostics endpoint to verify your API key works:

```bash
# Start the server
npm run server

# In another terminal, test the connection
curl http://localhost:3000/api/diagnose
```

Or visit: `http://localhost:3000/connect-notion-frontend.html` and click "Run Full Diagnostics"

## Common Issues

### Issue: OAuth Callback Has No Code

**If you're using a development API key with production endpoints:**
- The API key won't work with `production.runalloy.com`
- OAuth flow will fail
- **Solution**: Use production API key, or update code to use development endpoints

### Issue: API Key Doesn't Work

**Possible causes:**
- Using wrong environment API key
- API key expired or revoked
- API key doesn't have correct permissions

**Solution:**
1. Verify you're using the correct API key from the dashboard
2. Check API key permissions in Alloy dashboard
3. Regenerate API key if needed

## Recommendation

**For this demo/project:**
- ✅ **Use PRODUCTION API key** from https://app.runalloy.com
- ✅ The code is already configured for production
- ✅ Production is the standard environment

**Only use development/staging if:**
- Alloy explicitly provides a development environment
- You need to test without affecting production data
- Alloy support recommends using development for testing

## Next Steps

1. **Get your production API key** from https://app.runalloy.com
2. **Add it to `.env` file**:
   ```env
   ALLOY_API_KEY=your_production_api_key_here
   ALLOY_USER_ID=your_user_id_here
   ```
3. **Restart the server**
4. **Test with diagnostics**: Visit `http://localhost:3000/connect-notion-frontend.html` and click "Run Full Diagnostics"

## Questions?

If you're unsure which environment to use:
- Check Alloy documentation
- Contact Alloy support
- Use production (it's the standard environment)

