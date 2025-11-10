# Usage Examples

Practical examples using the Alloy Connectivity API with Notion. All examples use the actual working code patterns from this project.

## Quick Start

### Basic Setup

```typescript
import { NotionClient } from './src/notion-client.js';
import { getConfig } from './src/config.js';

const config = getConfig();
const connectionId = process.env.CONNECTION_ID!;
const notionClient = new NotionClient(config, connectionId);
```

## OAuth Flow

### Connect Notion via OAuth

```typescript
import { AlloyOAuthFlow } from './src/oauth-flow.js';
import { getConfig } from './src/config.js';

const config = getConfig();
const oauthFlow = new AlloyOAuthFlow();

// Step 1: Initiate OAuth flow
const { oauthUrl } = await oauthFlow.initiateOAuthFlow(
  'notion',
  'http://localhost:3000/oauth/callback'
);

console.log('OAuth URL:', oauthUrl);
// Redirect user to oauthUrl

// Step 2: After user authorizes, handle callback
const { connectionId } = await oauthFlow.handleOAuthCallback(
  'notion',
  code, // authorization code from callback
  state // optional state parameter
);

console.log('Connection ID:', connectionId);
// Save connectionId to .env file
```

### List Connections

```typescript
import { AlloyOAuthFlow } from './src/oauth-flow.js';

const oauthFlow = new AlloyOAuthFlow();
const connections = await oauthFlow.listConnections();

// Find Notion connections
const notionConnections = connections.filter(
  (conn: any) => conn.connectorId === 'notion'
);

console.log('Notion connections:', notionConnections);
```

## Basic Operations

### Search Pages

```typescript
import { NotionClient } from './src/notion-client.js';
import { getConfig } from './src/config.js';

const config = getConfig();
const notionClient = new NotionClient(config, connectionId);

// Search for pages
const pages = await notionClient.searchPages(
  undefined, // query (optional)
  { value: 'page', property: 'object' } // filter
);

console.log(`Found ${pages.length} pages`);

// Process pages
pages.forEach(page => {
  const title = page.properties?.title?.title?.[0]?.plain_text || 'Untitled';
  console.log(`${title} - ${page.id}`);
});
```

### Get Page by ID

```typescript
const page = await notionClient.getPage('page-id-here');
console.log('Page:', page);
```

### Create Page

```typescript
const newPage = await notionClient.createPage({
  parent: {
    type: 'workspace',
    workspace: true,
  },
  properties: {
    title: {
      type: 'title',
      title: [
        {
          type: 'text',
          text: {
            content: 'My New Page',
          },
        },
      ],
    },
  },
});

console.log('Page created:', newPage.id);
console.log('Page URL:', newPage.url);
```

### Update Page

```typescript
const updatedPage = await notionClient.updatePage(pageId, {
  properties: {
    title: {
      type: 'title',
      title: [
        {
          type: 'text',
          text: {
            content: 'Updated Title',
          },
        },
      ],
    },
  },
});

console.log('Page updated:', updatedPage.id);
```

### Query Database

```typescript
const results = await notionClient.queryDatabase(
  'database-id-here',
  {
    filter: {
      property: 'Status',
      select: {
        equals: 'Done',
      },
    },
  }
);

console.log(`Found ${results.length} results`);
```

## Real-World Use Cases

### Use Case 1: Create Page from Form Submission

```typescript
async function createPageFromForm(formData: {
  name: string;
  email: string;
  message: string;
}) {
  const config = getConfig();
  const notionClient = new NotionClient(config, process.env.CONNECTION_ID!);

  const page = await notionClient.createPage({
    parent: {
      type: 'workspace',
      workspace: true,
    },
    properties: {
      title: {
        type: 'title',
        title: [
          {
            type: 'text',
            text: {
              content: `${formData.name} - Contact Form`,
            },
          },
        ],
      },
    },
  });

  console.log('Page created:', page.id);
  return page;
}
```

### Use Case 2: Sync Pages Between Workspaces

```typescript
async function syncPages(sourceConnectionId: string, targetConnectionId: string) {
  const config = getConfig();
  
  // Read from source
  const sourceClient = new NotionClient(config, sourceConnectionId);
  const pages = await sourceClient.searchPages(
    undefined,
    { value: 'page', property: 'object' }
  );

  // Write to target
  const targetClient = new NotionClient(config, targetConnectionId);
  
  for (const page of pages) {
    const title = page.properties?.title?.title?.[0]?.plain_text || 'Untitled';
    
    await targetClient.createPage({
      parent: {
        type: 'workspace',
        workspace: true,
      },
      properties: {
        title: {
          type: 'title',
          title: [
            {
              type: 'text',
              text: {
                content: title,
              },
            },
          ],
        },
      },
    });
  }

  console.log(`Synced ${pages.length} pages`);
}
```

### Use Case 3: Update Page with Enriched Data

```typescript
async function enrichPage(pageId: string, additionalData: any) {
  const config = getConfig();
  const notionClient = new NotionClient(config, process.env.CONNECTION_ID!);

  // Get existing page
  const page = await notionClient.getPage(pageId);
  
  // Update with enriched data
  const updatedPage = await notionClient.updatePage(pageId, {
    properties: {
      ...page.properties,
      // Add additional properties
      'Last Synced': {
        type: 'date',
        date: {
          start: new Date().toISOString(),
        },
      },
    },
  });

  return updatedPage;
}
```

## Error Handling

### Basic Error Handling

```typescript
try {
  const page = await notionClient.createPage({
    parent: {
      type: 'workspace',
      workspace: true,
    },
    properties: {
      title: {
        type: 'title',
        title: [
          {
            type: 'text',
            text: {
              content: 'Test Page',
            },
          },
        ],
      },
    },
  });
  
  console.log('Success:', page.id);
} catch (error: any) {
  if (error.response?.data) {
    console.error('API Error:', error.response.data);
  } else {
    console.error('Error:', error.message);
  }
}
```

### Retry Logic

```typescript
async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      console.log(`Attempt ${i + 1} failed, retrying in ${delayMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
      delayMs *= 2; // Exponential backoff
    }
  }
  throw new Error('Max retries exceeded');
}

// Usage
const page = await retryOperation(() =>
  notionClient.createPage({
    parent: { type: 'workspace', workspace: true },
    properties: {
      title: {
        type: 'title',
        title: [{ type: 'text', text: { content: 'Test' } }],
      },
    },
  })
);
```

### Batch Operations with Error Handling

```typescript
async function createPagesBatch(pagesData: any[]) {
  const results = await Promise.allSettled(
    pagesData.map(pageData =>
      notionClient.createPage({
        parent: { type: 'workspace', workspace: true },
        properties: pageData.properties,
      })
    )
  );

  const successful = results.filter(r => r.status === 'fulfilled');
  const failed = results.filter(r => r.status === 'rejected');

  console.log(`Success: ${successful.length}, Failed: ${failed.length}`);

  if (failed.length > 0) {
    console.error('Failed pages:');
    failed.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`  ${index}: ${result.reason.message}`);
      }
    });
  }

  return successful.map(r => 
    r.status === 'fulfilled' ? r.value : null
  ).filter(Boolean);
}
```

## Connection Management

### Test Connection

```typescript
async function testConnection(connectionId: string): Promise<boolean> {
  try {
    const config = getConfig();
    const notionClient = new NotionClient(config, connectionId);
    
    // Test with a simple search
    await notionClient.searchPages(
      undefined,
      { value: 'page', property: 'object' }
    );
    
    return true;
  } catch (error: any) {
    console.error('Connection test failed:', error.message);
    return false;
  }
}
```

### Find Working Connection

```typescript
import { AlloyOAuthFlow } from './src/oauth-flow.js';

async function findWorkingConnection(): Promise<string | null> {
  const oauthFlow = new AlloyOAuthFlow();
  const connections = await oauthFlow.listConnections();
  
  const notionConnections = connections.filter(
    (conn: any) => conn.connectorId === 'notion'
  );

  // Test each connection
  for (const conn of notionConnections) {
    const connectionId = conn.credentialId || conn.id || conn._id;
    const isWorking = await testConnection(connectionId);
    
    if (isWorking) {
      return connectionId;
    }
  }

  return null;
}
```

## Common Patterns

### Rate Limiting

```typescript
async function createPagesWithRateLimit(
  pagesData: any[],
  rateLimit: number = 5
) {
  const chunks = [];
  for (let i = 0; i < pagesData.length; i += rateLimit) {
    chunks.push(pagesData.slice(i, i + rateLimit));
  }

  for (const chunk of chunks) {
    await Promise.all(
      chunk.map(pageData => notionClient.createPage(pageData))
    );
    
    // Wait between batches
    if (chunks.indexOf(chunk) < chunks.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}
```

### Connection Caching

```typescript
const connectionCache = new Map<string, string>();

async function getCachedConnection(connectorId: string): Promise<string | null> {
  if (connectionCache.has(connectorId)) {
    return connectionCache.get(connectorId)!;
  }

  const oauthFlow = new AlloyOAuthFlow();
  const connections = await oauthFlow.listConnections();
  const connection = connections.find(
    (conn: any) => conn.connectorId === connectorId
  );

  if (connection) {
    const connectionId = connection.credentialId || connection.id || connection._id;
    connectionCache.set(connectorId, connectionId);
    return connectionId;
  }

  return null;
}
```

## Error Codes

### Common HTTP Status Codes

| Code | Meaning | Solution |
|------|---------|----------|
| 400 | Bad Request | Check request parameters and data format |
| 401 | Unauthorized | Verify API key is correct and valid |
| 403 | Forbidden | Check API key permissions |
| 404 | Not Found | Verify resource ID (connection, page, etc.) |
| 429 | Rate Limited | Implement retry logic with exponential backoff |
| 500 | Server Error | Retry request or contact support |

### Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| "Credential not found" | Invalid connection ID | Use `npm run verify-connection` to find and set working connection |
| "Invalid Authorization" | Invalid API key | Verify API key in Alloy Dashboard |
| "Connection not yet established" | No connection ID | Complete OAuth flow: `npm run connect-notion` |

## Additional Resources

- See `src/demo.ts` for the complete working example
- Check `src/notion-client.ts` for all available methods
- Review `src/oauth-flow.ts` for OAuth implementation
- See [Endpoint Pattern Summary](docs/endpoint-pattern-summary.md) for API details

For more information, visit the [Alloy Documentation](https://docs.runalloy.com).
