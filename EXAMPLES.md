# Usage Examples

This document provides practical examples of how to use the Alloy Connectivity API for various integration scenarios with Notion.

## Basic Examples

### Example 1: Simple Page Creation

Create a page in your Notion workspace:

```typescript
import { AlloyClient } from './src/alloy-client';
import { getConfig } from './src/config';

const config = getConfig();
const client = new AlloyClient(config);

// Authenticate and connect
await client.authenticateUser(config.alloyUserId);
await client.connectToIntegration(process.env.CONNECTION_ID!);

// Create a page in Notion
const newPage = {
  title: 'Meeting Notes',
  content: 'Discussion about Q4 planning',
  author: 'Jane Smith',
  tags: ['meeting', 'planning'],
  status: 'active'
};

await client.createPage(newPage);
```

### Example 2: Batch Read Operations

Read multiple pages from Notion:

```typescript
// Authenticate and connect
await client.authenticateUser(config.alloyUserId);
await client.connectToIntegration(process.env.CONNECTION_ID!);

// Fetch all pages
const pages = await client.readPages();

console.log(`Found ${pages.length} pages`);

// Process each page
pages.forEach(page => {
  console.log(`${page.title || page.name} - ${page.id}`);
});
```

### Example 3: Update Existing Page

Update a page's information:

```typescript
// Authenticate and connect
await client.authenticateUser(config.alloyUserId);
await client.connectToIntegration(process.env.CONNECTION_ID!);

// Update a specific page
await client.updatePage(
  'page_id_123',
  {
    content: 'Updated content with new information',
    status: 'completed',
    tags: ['project', 'completed']
  }
);
```

## Real-World Use Cases

### Use Case 1: Content Creation from Website

Automatically create Notion pages when users submit a form on your website:

```typescript
// In your web application's API endpoint
async function handleFormSubmission(formData: any) {
  const config = getConfig();
  const client = new AlloyClient(config);

  // Authenticate and connect
  await client.authenticateUser(config.alloyUserId);
  await client.connectToIntegration(process.env.CONNECTION_ID!);

  const pageData = {
    title: `${formData.name} - Contact Form Submission`,
    content: `Name: ${formData.name}\nEmail: ${formData.email}\nMessage: ${formData.message}`,
    author: formData.name,
    source: 'Website Form',
    status: 'new',
    tags: ['contact', 'form-submission']
  };

  try {
    await client.createPage(pageData);
    
    console.log('Page created successfully in Notion');
    return { success: true };
  } catch (error) {
    console.error('Failed to create page:', error);
    return { success: false, error: error.message };
  }
}
```

### Use Case 2: Two-Way Notion Sync

Synchronize pages between two different Notion workspaces:

```typescript
async function syncNotionWorkspaces() {
  const config = getConfig();
  const client = new AlloyClient(config);

  // Authenticate and connect to source workspace
  await client.authenticateUser(config.alloyUserId);
  await client.connectToIntegration(process.env.CONNECTION_ID_SOURCE!);

  // Read pages from source workspace
  const sourcePages = await client.readPages();

  // Connect to target workspace
  await client.connectToIntegration(process.env.CONNECTION_ID_TARGET!);

  // Write each page to target workspace
  for (const page of sourcePages) {
    const pageData = {
      title: page.title || page.name,
      content: page.content || '',
      author: page.author || 'System',
      tags: page.tags || [],
      status: page.status || 'active'
    };

    await client.createPage(pageData);
  }

  console.log(`Synced ${sourcePages.length} pages between Notion workspaces`);
}
```

### Use Case 3: Page Data Enrichment

Enrich Notion page data by combining information from multiple sources:

```typescript
async function enrichPageData(pageId: string) {
  const config = getConfig();
  const client = new AlloyClient(config);

  // Authenticate and connect
  await client.authenticateUser(config.alloyUserId);
  await client.connectToIntegration(process.env.CONNECTION_ID!);

  // Get page from Notion
  const page = await client.getPage(pageId);

  // Get additional data from external source (example: API call)
  const externalData = await fetchExternalData(page.title);

  // Combine and enrich data
  const enrichedData = {
    ...page,
    externalMetadata: externalData.metadata,
    lastSynced: new Date().toISOString(),
    tags: [...(page.tags || []), ...(externalData.tags || [])],
    status: externalData.status || page.status
  };

  // Update page with enriched data
  await client.updatePage(pageId, enrichedData);

  return enrichedData;
}
```

### Use Case 4: Documentation Integration

Create Notion pages from support tickets or issues:

```typescript
async function createNotionPageFromTicket(ticketId: string, ticketData: any) {
  const config = getConfig();
  const client = new AlloyClient(config);

  // Authenticate and connect
  await client.authenticateUser(config.alloyUserId);
  await client.connectToIntegration(process.env.CONNECTION_ID!);

  // Create Notion page from ticket
  const pageData = {
    title: `Support Ticket #${ticketId}: ${ticketData.subject}`,
    content: `**Issue:** ${ticketData.description}\n\n**Requester:** ${ticketData.requester.name}\n**Email:** ${ticketData.requester.email}\n**Priority:** ${ticketData.priority}`,
    author: ticketData.requester.name,
    priority: ticketData.priority,
    status: ticketData.status,
    tags: ['support', 'ticket', ticketData.priority],
    ticketId: ticketId
  };

  const page = await client.createPage(pageData);

  console.log(`Created Notion page for ticket #${ticketId}`);
  return page;
}
```

## Advanced Examples

### Example 4: Error Handling and Retry Logic

Implement robust error handling with retries:

```typescript
async function syncWithRetry(
  maxRetries: number = 3,
  delayMs: number = 1000
) {
  const config = getConfig();
  const client = new AlloyClient(config);

  // Authenticate and connect
  await client.authenticateUser(config.alloyUserId);
  await client.connectToIntegration(process.env.CONNECTION_ID!);

  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      const result = await client.createPage({
        title: 'Test Page',
        content: 'Sync test',
        status: 'active'
      });
      
      console.log('Sync successful');
      return result;
    } catch (error) {
      attempt++;
      
      if (attempt >= maxRetries) {
        console.error(`Failed after ${maxRetries} attempts`);
        throw error;
      }
      
      console.log(`Attempt ${attempt} failed, retrying in ${delayMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
      delayMs *= 2; // Exponential backoff
    }
  }
}
```

### Example 5: Bulk Operations with Rate Limiting

Process large datasets with rate limiting:

```typescript
async function bulkSync(pages: any[], rateLimit: number = 5) {
  const config = getConfig();
  const client = new AlloyClient(config);

  // Authenticate and connect
  await client.authenticateUser(config.alloyUserId);
  await client.connectToIntegration(process.env.CONNECTION_ID!);

  const chunks = [];
  for (let i = 0; i < pages.length; i += rateLimit) {
    chunks.push(pages.slice(i, i + rateLimit));
  }

  let processed = 0;
  
  for (const chunk of chunks) {
    const promises = chunk.map(page =>
      client.createPage(page)
    );

    await Promise.all(promises);
    processed += chunk.length;
    
    console.log(`Processed ${processed}/${pages.length} pages`);
    
    // Wait between batches to respect rate limits
    if (processed < pages.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log('Bulk sync completed');
}
```

### Example 6: Webhook Integration

Create a webhook handler for real-time syncing:

```typescript
import express from 'express';

const app = express();
app.use(express.json());

// Webhook endpoint that syncs data when triggered
app.post('/webhook/page-created', async (req, res) => {
  const config = getConfig();
  const client = new AlloyClient(config);

  try {
    const pageData = req.body;
    
    // Authenticate and connect
    await client.authenticateUser(config.alloyUserId);
    await client.connectToIntegration(process.env.CONNECTION_ID!);
    
    // Sync to Notion
    await client.createPage(pageData);

    res.json({ success: true, message: 'Page synced to Notion' });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(3000, () => {
  console.log('Webhook server listening on port 3000');
});
```

## Using the REST API Directly

If you prefer not to use the SDK, you can use the REST API directly:

```typescript
import { AlloyRestClient } from './src/rest-api-example';
import { getConfig } from './src/config';

const config = getConfig();
const client = new AlloyRestClient(
  config.alloyApiKey,
  config.alloyBaseUrl,
  config.alloyUserId
);

// Same operations as SDK, but using REST calls
const pages = await client.readData(
  config.alloyUserId,
  'notion',
  'pages'
);

await client.createData(
  config.alloyUserId,
  'notion',
  'pages',
  { title: 'New Page', content: 'Page content', author: 'John Doe' }
);
```

## Testing and Development

### Mock Data for Testing

```typescript
// Authenticate and connect
await client.authenticateUser(config.alloyUserId);
await client.connectToIntegration(process.env.CONNECTION_ID!);

const mockPage = {
  title: `Test Page ${Date.now()}`, // Unique title
  content: 'This is a test page',
  author: 'Test User',
  tags: ['test'],
  status: 'active'
};

// Use in tests
await client.createPage(mockPage);
```

### Environment-Specific Configuration

```typescript
const connectionId = process.env.NODE_ENV === 'production'
  ? process.env.CONNECTION_ID_PROD!
  : process.env.CONNECTION_ID_DEV!;

await client.authenticateUser(config.alloyUserId);
await client.connectToIntegration(connectionId);
await client.readPages();
```

## Best Practices

1. **Always validate data before syncing**
   ```typescript
   function validatePage(page: any): boolean {
     return !!(page.title && page.content);
   }
   ```

2. **Log all sync operations for debugging**
   ```typescript
   console.log(`[${new Date().toISOString()}] Syncing page: ${page.title}`);
   ```

3. **Handle partial failures gracefully**
   ```typescript
   const results = await Promise.allSettled(promises);
   const failed = results.filter(r => r.status === 'rejected');
   if (failed.length > 0) {
     console.error(`${failed.length} operations failed`);
   }
   ```

4. **Use idempotency keys for critical operations**
   ```typescript
   const idempotencyKey = `page-${page.title}-${Date.now()}`;
   // Include in your API calls to prevent duplicates
   ```

## Additional Resources

- See `src/demo.ts` for the complete working example
- Check `src/alloy-client.ts` for all available methods
- Review `src/rest-api-example.ts` for REST API usage

For more information, visit the [Alloy Documentation](https://docs.runalloy.com).
