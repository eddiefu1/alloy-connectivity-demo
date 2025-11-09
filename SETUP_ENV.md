# Environment Variables Setup

## Required Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Alloy API Configuration
ALLOY_API_KEY=your_api_key_here
ALLOY_USER_ID=your_user_id_here
ALLOY_BASE_URL=https://api.runalloy.com
```

## Variable Descriptions

### ALLOY_API_KEY (Required)
- Your Alloy API key
- Get it from: [Alloy Dashboard](https://app.runalloy.com) → Settings → API Keys
- Used for authenticating all API requests

### ALLOY_USER_ID (Required)
- Your Alloy user ID
- Format example: `690674c276dcda35a40b242d` (24 character hex string)
- Used for:
  - JWT token generation (`GET /users/{userId}/token`)
  - User-specific API endpoints
- **Note:** For OAuth credential creation, the API should infer userId from the API key, so userId is not included in the request body

### ALLOY_BASE_URL (Optional)
- Base URL for Alloy API
- Default: `https://api.runalloy.com`
- Usually don't need to change this

## Updating User ID

To update the user ID, edit the `.env` file:

```bash
# Windows (PowerShell)
(Get-Content .env) -replace 'ALLOY_USER_ID=.*', 'ALLOY_USER_ID=your_new_user_id' | Set-Content .env

# Linux/Mac
sed -i 's/ALLOY_USER_ID=.*/ALLOY_USER_ID=your_new_user_id/' .env
```

Or manually edit the `.env` file:
```env
ALLOY_USER_ID=your_user_id_here
```

## Verifying Configuration

After updating `.env`, restart the server:

```bash
# Stop the server (Ctrl+C) and restart
npm run server
```

To verify the configuration is loaded correctly:

```bash
# Check if the values are being read
node -e "require('dotenv').config(); console.log('User ID:', process.env.ALLOY_USER_ID);"
```

## Notes

- The `.env` file is in `.gitignore` and won't be committed to version control
- Never commit your API keys or sensitive credentials
- If you change the `.env` file, restart the server for changes to take effect
- The userId format is typically a 24-character hex string (MongoDB ObjectId format)
- For OAuth flows, userId should not be included in the request body (API infers it from the API key)

