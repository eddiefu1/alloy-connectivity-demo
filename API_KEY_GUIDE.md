# 🔑 Alloy API Key Guide: Production vs Development

## Quick Answer

**Use the API key that matches your Alloy account type:**
- **Production API Key**: For production accounts and real integrations
- **Development API Key**: For development/testing accounts

**Both use the same API endpoint** (`https://production.runalloy.com`), so the choice depends on which account you're using.

## Current Configuration

Looking at your `.env` file, you have:
- `ALLOY_ENVIRONMENT=development` 
- `ALLOY_API_KEY=T7TcvQzvBlBhO4qqFIzIS` (Development key)
- Commented production key: `# ALLOY_API_KEY=TWsxXkP4OngtBYRl1_soA`

## Which Should You Use?

### Option 1: Try Production Key (Recommended)

If you're getting "Unauthorized" errors with the dev key, try the production key:

```env
ALLOY_ENVIRONMENT=production
ALLOY_API_KEY=TWsxXkP4OngtBYRl1_soA
```

### Option 2: Get Fresh API Key from Dashboard

1. Go to https://app.runalloy.com
2. Navigate to **Settings** → **API Keys**
3. Copy your **current active API key**
4. Update `.env` with the fresh key

## How to Switch

### Switch to Production Key:
```powershell
# Edit .env file
(Get-Content .env) -replace 'ALLOY_ENVIRONMENT=development', 'ALLOY_ENVIRONMENT=production' | Set-Content .env
(Get-Content .env) -replace 'ALLOY_API_KEY=T7TcvQzvBlBhO4qqFIzIS', 'ALLOY_API_KEY=TWsxXkP4OngtBYRl1_soA' | Set-Content .env
(Get-Content .env) -replace '# ALLOY_API_KEY=TWsxXkP4OngtBYRl1_soA', '# ALLOY_API_KEY=T7TcvQzvBlBhO4qqFIzIS' | Set-Content .env
```

### Switch to Development Key:
```powershell
(Get-Content .env) -replace 'ALLOY_ENVIRONMENT=production', 'ALLOY_ENVIRONMENT=development' | Set-Content .env
(Get-Content .env) -replace 'ALLOY_API_KEY=TWsxXkP4OngtBYRl1_soA', 'ALLOY_API_KEY=T7TcvQzvBlBhO4qqFIzIS' | Set-Content .env
```

## Verify Your Choice

After switching, test with:
```bash
npm run verify-setup
```

This will tell you if the API key works.

## Important Notes

1. **Both keys use the same endpoint**: `https://production.runalloy.com`
2. **The environment variable is just for tracking** - it doesn't change the API endpoint
3. **Use the key that matches your account type** in Alloy Dashboard
4. **If both fail**, get a fresh API key from the dashboard

## Troubleshooting

### "Unauthorized, Wrong API Key" Error

**Possible causes:**
1. API key is incorrect or expired
2. Using wrong key type (dev vs prod)
3. API key was revoked or regenerated

**Solution:**
1. Go to https://app.runalloy.com → Settings → API Keys
2. Verify which key type you're using (dev or prod)
3. Copy the **exact** API key from the dashboard
4. Update `.env` with the correct key
5. Make sure `ALLOY_ENVIRONMENT` matches your key type

## Recommendation

**Start with Production Key** if you're unsure:
- Production keys are more commonly used
- They work with the same endpoint
- If it works, you're set!

Then test:
```bash
npm run verify-setup
```



