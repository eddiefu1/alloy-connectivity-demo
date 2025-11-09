# Alloy Frontend SDK Guide

This guide explains how to use the Alloy Frontend SDK for OAuth flows in web applications.

## Installation

```bash
npm install alloy-frontend
```

## Setup

### Option 1: CDN (Quick Start)

Include the Alloy SDK in your HTML:

```html
<script src="https://cdn.jsdelivr.net/npm/alloy-frontend@latest/dist/alloy.js"></script>
```

### Option 2: NPM Module (Recommended for Production)

```javascript
// Using ES6 modules
import alloy from 'alloy-frontend';

// Or using CommonJS
const alloy = require('alloy-frontend');
```

### Option 3: Browser Bundle

If using a bundler (Webpack, Vite, etc.), import it normally:

```javascript
import alloy from 'alloy-frontend';
```

## Step-by-Step OAuth Flow

### Step 1: Get JWT Token from Backend

First, your backend needs to generate a JWT token for the user:

```typescript
// Backend endpoint (Node.js/Express example)
app.post('/api/alloy/token', async (req, res) => {
  const userId = req.user.id; // Get from your authentication
  
  // Use GET method with x-api-version header
  const response = await axios.get(
    `https://embedded.runalloy.com/users/${userId}/token`,
    {
      headers: {
        'Authorization': `Bearer ${process.env.ALLOY_API_KEY}`,
        'x-api-version': '2025-09',
        'Accept': 'application/json',
      },
    }
  );
  
  // The token is returned directly in the response
  const token = response.data.token || response.data;
  res.json({ token });
});
```

### Step 2: Authenticate Frontend SDK

In your frontend application:

```javascript
// Get JWT token from your backend
const response = await fetch('/api/alloy/token');
const { token } = await response.json();

// Authenticate with Alloy
await alloy.authenticate(token);
console.log('Authenticated with Alloy');
```

### Step 3: Connect Integration

After authentication, connect to an integration:

```javascript
alloy.connect('notion', {
  onSuccess: (connectionId) => {
    console.log('Connection ID:', connectionId);
    // Save connectionId to your backend/database
    // Use it for subsequent API calls
    
    // Send to backend
    fetch('/api/alloy/connection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ connectionId }),
    });
  },
  onError: (error) => {
    console.error('Connection failed:', error);
  },
});
```

## Complete Example

### HTML File

```html
<!DOCTYPE html>
<html>
<head>
    <title>Alloy OAuth Example</title>
    <script src="https://cdn.jsdelivr.net/npm/alloy-frontend@latest/dist/alloy.js"></script>
</head>
<body>
    <button id="connectBtn">Connect Notion</button>
    <div id="result"></div>

    <script>
        // Step 1: Get JWT token from backend
        async function getToken() {
            const response = await fetch('/api/alloy/token');
            const { token } = await response.json();
            return token;
        }

        // Step 2: Authenticate and connect
        document.getElementById('connectBtn').addEventListener('click', async () => {
            try {
                // Get token
                const token = await getToken();
                
                // Authenticate
                await alloy.authenticate(token);
                console.log('Authenticated');
                
                // Connect
                alloy.connect('notion', {
                    onSuccess: (connectionId) => {
                        document.getElementById('result').innerHTML = 
                            `Connected! Connection ID: ${connectionId}`;
                        
                        // Save to backend
                        fetch('/api/alloy/connection', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ connectionId }),
                        });
                    },
                    onError: (error) => {
                        document.getElementById('result').innerHTML = 
                            `Error: ${error.message}`;
                    },
                });
            } catch (error) {
                console.error('Error:', error);
            }
        });
    </script>
</body>
</html>
```

### Backend API Endpoints

```typescript
import express from 'express';
import axios from 'axios';

const app = express();
app.use(express.json());

// Get JWT token
app.post('/api/alloy/token', async (req, res) => {
  try {
    const userId = req.user.id; // From your auth middleware
    
    // Use GET method with x-api-version header
    const response = await axios.get(
      `https://embedded.runalloy.com/users/${userId}/token`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.ALLOY_API_KEY}`,
          'x-api-version': '2025-09',
          'Accept': 'application/json',
        },
      }
    );
    
    const token = response.data.token || response.data;
    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Save connection ID
app.post('/api/alloy/connection', async (req, res) => {
  try {
    const { connectionId } = req.body;
    const userId = req.user.id;
    
    // Save to database
    await saveConnection(userId, connectionId);
    
    res.json({ success: true, connectionId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
```

## React Example

```jsx
import React, { useState, useEffect } from 'react';
import alloy from 'alloy-frontend';

function AlloyConnection() {
  const [connected, setConnected] = useState(false);
  const [connectionId, setConnectionId] = useState(null);

  useEffect(() => {
    // Authenticate on component mount
    async function authenticate() {
      try {
        const response = await fetch('/api/alloy/token');
        const { token } = await response.json();
        await alloy.authenticate(token);
      } catch (error) {
        console.error('Authentication failed:', error);
      }
    }
    
    authenticate();
  }, []);

  const connectNotion = () => {
    alloy.connect('notion', {
      onSuccess: (connId) => {
        setConnectionId(connId);
        setConnected(true);
        
        // Save to backend
        fetch('/api/alloy/connection', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ connectionId: connId }),
        });
      },
      onError: (error) => {
        console.error('Connection failed:', error);
      },
    });
  };

  return (
    <div>
      {!connected ? (
        <button onClick={connectNotion}>Connect Notion</button>
      ) : (
        <div>
          <p>Connected!</p>
          <p>Connection ID: {connectionId}</p>
        </div>
      )}
    </div>
  );
}

export default AlloyConnection;
```

## Vue.js Example

```vue
<template>
  <div>
    <button v-if="!connected" @click="connectNotion">
      Connect Notion
    </button>
    <div v-else>
      <p>Connected!</p>
      <p>Connection ID: {{ connectionId }}</p>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import alloy from 'alloy-frontend';

export default {
  setup() {
    const connected = ref(false);
    const connectionId = ref(null);

    onMounted(async () => {
      // Authenticate on mount
      try {
        const response = await fetch('/api/alloy/token');
        const { token } = await response.json();
        await alloy.authenticate(token);
      } catch (error) {
        console.error('Authentication failed:', error);
      }
    });

    const connectNotion = () => {
      alloy.connect('notion', {
        onSuccess: (connId) => {
          connectionId.value = connId;
          connected.value = true;
          
          // Save to backend
          fetch('/api/alloy/connection', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ connectionId: connId }),
          });
        },
        onError: (error) => {
          console.error('Connection failed:', error);
        },
      });
    };

    return {
      connected,
      connectionId,
      connectNotion,
    };
  },
};
</script>
```

## Supported Connectors

You can connect to any connector supported by Alloy:

- `notion` - Notion workspace
- `hubspot` - HubSpot CRM
- `salesforce` - Salesforce CRM
- `slack` - Slack workspace
- `google-drive` - Google Drive
- `github` - GitHub repositories
- And many more...

## API Reference

### `alloy.authenticate(token)`

Authenticate the SDK with a JWT token.

**Parameters:**
- `token` (string): JWT token from backend

**Returns:** Promise

**Example:**
```javascript
await alloy.authenticate(jwtToken);
```

### `alloy.connect(connectorId, options)`

Connect to an integration.

**Parameters:**
- `connectorId` (string): The connector ID (e.g., 'notion', 'hubspot')
- `options` (object):
  - `onSuccess` (function): Callback with connectionId
  - `onError` (function): Callback with error

**Example:**
```javascript
alloy.connect('notion', {
  onSuccess: (connectionId) => {
    console.log('Connected:', connectionId);
  },
  onError: (error) => {
    console.error('Error:', error);
  },
});
```

## Security Best Practices

1. **Never expose API keys in frontend code**
   - Always generate JWT tokens on the backend
   - Use environment variables for API keys

2. **Validate user authentication**
   - Only generate JWT tokens for authenticated users
   - Validate user permissions before allowing connections

3. **Store Connection IDs securely**
   - Save Connection IDs in your database
   - Associate them with user accounts
   - Don't expose them in client-side code unnecessarily

4. **Use HTTPS in production**
   - Always use HTTPS for OAuth flows
   - Never use HTTP for redirect URIs in production

## Troubleshooting

### "Alloy SDK not loaded"
- Make sure the script is included before using it
- Check that the CDN URL is correct
- Verify network connectivity

### "Authentication failed"
- Check that the JWT token is valid
- Verify the token hasn't expired
- Ensure the backend is generating tokens correctly

### "Connection failed"
- Verify the connector ID is correct
- Check that the user has completed the OAuth flow
- Ensure the integration is available in your Alloy plan

## Additional Resources

- [Alloy Frontend SDK Documentation](https://docs.runalloy.com/frontend-sdk)
- [Alloy Embedded Documentation](https://docs.runalloy.com/embedded)
- [Alloy API Reference](https://docs.runalloy.com/api-reference)

