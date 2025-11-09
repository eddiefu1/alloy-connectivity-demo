# How to Obtain Connection ID from Alloy

The Connection ID is required to interact with connected integrations in Alloy. There are several ways to obtain it:

> **New**: For programmatic OAuth flow, see [OAuth Flow Guide](./oauth-flow-guide.md)

## Method 1: From Alloy Dashboard (Easiest for Testing)

1. **Log in to Alloy Dashboard**
   - Visit [https://app.runalloy.com](https://app.runalloy.com)
   - Log in with your account

2. **Navigate to Connections**
   - Go to **Connections** or **Integrations** in the dashboard
   - Find your connected integration (e.g., Notion)

3. **Get the Connection ID**
   - Click on the connection/integration
   - The Connection ID will be displayed in the connection details
   - It typically looks like: `conn_abc123...` or similar

4. **Copy to your `.env` file**
   ```env
   CONNECTION_ID=conn_abc123xyz
   ```

## Method 2: Via API - List Connections

You can programmatically retrieve connection IDs using Alloy's API. Use the utility script provided in this project:

```bash
npm run list-connections
```

Or use the REST API directly:

```typescript
import { AlloyRestClient } from './src/rest-api-example';
import { getConfig } from './src/config';

const config = getConfig();
const client = new AlloyRestClient(
  config.alloyApiKey,
  config.alloyBaseUrl,
  config.alloyUserId
);

// List all connections for a user
const response = await client.client.get(`/users/${config.alloyUserId}/connections`);
console.log('Connections:', response.data);
```

## Method 3: Via Frontend SDK (OAuth Flow)

When building a frontend application that connects integrations:

1. **Generate a JWT Token** (backend)
   ```typescript
   POST https://embedded.runalloy.com/2023-12/users/{userId}/token
   Headers:
     Authorization: Bearer {YOUR_API_KEY}
     Accept: application/json
   ```

2. **Authenticate Frontend SDK**
   ```javascript
   alloy.authenticate(jwtToken);
   ```

3. **Initiate Connection**
   ```javascript
   alloy.connect('notion', {
     onSuccess: (connectionId) => {
       console.log('Connection ID:', connectionId);
       // Save this connection ID to your backend/database
     },
     onError: (error) => {
       console.error('Connection failed:', error);
     }
   });
   ```

4. **Store Connection ID**
   - The `onSuccess` callback provides the `connectionId`
   - Send it to your backend to store in your database
   - Use it for subsequent API calls

## Method 4: Via Webhook (Production)

For production applications, set up webhooks to receive connection IDs automatically:

1. **Configure Webhook in Alloy Dashboard**
   - Go to Settings → Webhooks
   - Add your webhook URL
   - Subscribe to connection events

2. **Handle Webhook Event**
   ```typescript
   // Webhook endpoint
   app.post('/webhook/alloy', (req, res) => {
     const event = req.body;
     
     if (event.type === 'connection.created') {
       const connectionId = event.data.connectionId;
       const userId = event.data.userId;
       const integrationId = event.data.integrationId;
       
       // Store connection ID in your database
       saveConnection(userId, integrationId, connectionId);
     }
     
     res.json({ received: true });
   });
   ```

## Method 5: Using the Connection Status Endpoint

You can check connection status and get connection details:

```typescript
// Get connection status (may include connection ID)
const status = await client.getConnectionStatus(
  config.alloyUserId,
   'notion' // integration ID
);

console.log('Connection Status:', status);
// The response may contain connection details including ID
```

## Quick Start: Using Connection ID

Once you have the Connection ID:

1. **Add to `.env` file**
   ```env
   CONNECTION_ID=conn_abc123xyz
   ```

2. **Use in your code**
   ```typescript
   const connectionId = process.env.CONNECTION_ID;
   await alloyClient.connectToIntegration(connectionId);
   ```

## Troubleshooting

### "Connection ID not found"
- Make sure the integration is connected in the Alloy dashboard
- Verify you're using the correct user ID
- Check that the connection hasn't been disconnected or revoked

### "Invalid connection ID"
- Ensure the connection ID format is correct
- Verify the connection belongs to the specified user
- Check that the connection is still active (not expired)

### "No connections available"
- Connect an integration first through the Alloy dashboard
- Or initiate the OAuth flow via the frontend SDK
- Wait for the connection to be established before using it

## Additional Resources

- [Alloy Documentation](https://docs.runalloy.com)
- [Alloy API Reference](https://docs.runalloy.com/api-reference)
- [Alloy Embedded SDK](https://docs.runalloy.com/embedded)

