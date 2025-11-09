# Troubleshooting OAuth Flow Issues

## Error: "userId must be a valid ID"

### Problem
When trying to initiate an OAuth flow, you get an error:
```
Invalid User ID format: Request failed with status code 400. 
Your ALLOY_USER_ID in .env might need to be in a different format
```

### Root Cause
The Alloy API is complaining about the userId format, even though according to the documentation, userId should not be required in the request body (the API should infer it from the Authorization token).

### Solutions

#### Solution 1: Remove userId from Request (Recommended)
The OAuth flow should work without explicitly passing userId. The code has been updated to not include userId in the request body.

**Check your `.env` file:**
```env
ALLOY_API_KEY=your_api_key_here
ALLOY_USER_ID=your_user_id_here  # This is used for JWT token generation, not OAuth
ALLOY_BASE_URL=https://api.runalloy.com
```

**Note:** The `ALLOY_USER_ID` is still needed for JWT token generation, but should not be included in OAuth credential creation requests.

#### Solution 2: Check API Key Permissions
The error might indicate that your API key doesn't have the correct permissions to create OAuth credentials.

1. Go to your Alloy dashboard
2. Navigate to Settings → API Keys
3. Check that your API key has permissions for:
   - Creating credentials
   - OAuth flows
   - Connector management

#### Solution 3: Verify User ID Format
If the API still requires userId, you may need to find the correct format:

1. **Check Alloy Dashboard:**
   - Log in to [https://app.runalloy.com](https://app.runalloy.com)
   - Go to your profile/settings
   - Look for your User ID (might be in Account Settings or API Settings)
   - User IDs typically look like:
     - `user_abc123...` (string prefix format)
     - UUID format: `12345678-1234-1234-1234-123456789abc`
     - Or a MongoDB ObjectId format: `690674c276dcda35a40b242d` (24 hex characters)

2. **Try API Endpoints:**
   ```bash
   # Try to get user information
   curl -X GET https://api.runalloy.com/users/me \
     -H "Authorization: Bearer YOUR_API_KEY" \
     -H "x-api-version: 2025-09"
   ```

#### Solution 4: Contact Alloy Support
If none of the above solutions work:

1. The API endpoint behavior might have changed
2. Your account might need special setup for OAuth flows
3. There might be account-level restrictions

Contact Alloy support with:
- Your API key (redacted)
- The exact error message
- The request you're making
- Your account email/ID

### Testing the Fix

After applying the fix, test the OAuth flow:

1. **Start the server:**
   ```bash
   npm run server
   ```

2. **Open the frontend:**
   - Navigate to `http://localhost:3000`
   - Click "Connect Notion"

3. **Check the error:**
   - If you still get an error, check the browser console (F12)
   - Look at the server logs for detailed error information
   - The error message should now be more helpful

### Alternative: Use Alloy Dashboard
If the programmatic OAuth flow continues to have issues, you can always connect integrations through the Alloy dashboard:

1. Log in to [https://app.runalloy.com](https://app.runalloy.com)
2. Go to Connections → Add Connection
3. Select Notion (or your integration)
4. Complete the OAuth flow in the dashboard
5. Get the Connection ID from the dashboard
6. Use the Connection ID in your `.env` file

### Related Documentation
- [OAuth Flow Guide](./oauth-flow-guide.md)
- [Getting Connection ID](./getting-connection-id.md)
- [Backend Server Guide](./backend-server-guide.md)

