# How to Use Your Alloy Connection to Read, Write, and Update Notion Files

This guide shows you how to use your Alloy connection to interact with Notion pages and databases.

## Prerequisites

1. ✅ API Key configured in `.env` file
2. ✅ Connection ID from OAuth flow (stored in `.env` as `CONNECTION_ID`)
3. ✅ Connection verified and working

## Quick Start

### 1. Basic Setup

```typescript
import { NotionClient } from './src/notion-client.js';
import { getConfig } from './src/config.js';

// Load config and connection ID
const config = getConfig();
const connectionId = process.env.CONNECTION_ID!; // Your connection ID from .env

// Create Notion client
const notionClient = new NotionClient(config, connectionId);
```

## Reading Notion Files (READ Operations)

### Search for Pages

```typescript
// Search all pages
const pages = await notionClient.searchPages();

// Search with query
const pages = await notionClient.searchPages('Project Planning');

// Search with filter (pages only)
const pages = await notionClient.searchPages(undefined, {
  value: 'page',
  property: 'object'
});

// Search databases only
const databases = await notionClient.searchPages(undefined, {
  value: 'database',
  property: 'object'
});

// Process results
pages.forEach(page => {
  const title = page.properties?.title?.title?.[0]?.plain_text || 'Untitled';
  console.log(`${title} - ${page.id}`);
});
```

### Get a Specific Page by ID

```typescript
const pageId = 'your-page-id-here';
const page = await notionClient.getPage(pageId);

console.log('Page Title:', page.properties?.title?.title?.[0]?.plain_text);
console.log('Page ID:', page.id);
console.log('Page URL:', page.url);
```

### Query a Database

```typescript
const databaseId = 'your-database-id-here';

// Get all entries
const results = await notionClient.queryDatabase(databaseId);

// Query with filter
const results = await notionClient.queryDatabase(databaseId, {
  filter: {
    property: 'Status',
    select: {
      equals: 'Done'
    }
  }
});

// Query with sorting
const results = await notionClient.queryDatabase(databaseId, {
  sorts: [
    {
      property: 'Created',
      direction: 'descending'
    }
  ]
});

// Process results
results.forEach(result => {
  console.log('Entry:', result.properties);
});
```

### Get Database Schema

```typescript
const databaseId = 'your-database-id-here';
const database = await notionClient.getDatabase(databaseId);

console.log('Database Title:', database.title);
console.log('Properties:', Object.keys(database.properties));
```

## Writing Notion Files (WRITE Operations)

### Create a New Page

```typescript
// Create page in workspace root
const newPage = await notionClient.createPage({
  parent: {
    type: 'workspace',
    workspace: true
  },
  properties: {
    title: {
      type: 'title',
      title: [
        {
          type: 'text',
          text: {
            content: 'My New Page Title'
          }
        }
      ]
    }
  }
});

console.log('Created Page ID:', newPage.id);
console.log('Page URL:', newPage.url);
```

### Create a Page Under Another Page

```typescript
const parentPageId = 'parent-page-id-here';

const newPage = await notionClient.createPage({
  parent: {
    type: 'page_id',
    page_id: parentPageId
  },
  properties: {
    title: {
      type: 'title',
      title: [
        {
          type: 'text',
          text: {
            content: 'Child Page'
          }
        }
      ]
    }
  }
});
```

### Create a Page in a Database

```typescript
const databaseId = 'your-database-id-here';

const newPage = await notionClient.createPage({
  parent: {
    type: 'database_id',
    database_id: databaseId
  },
  properties: {
    // Use the property names from your database schema
    'Task Name': {
      type: 'title',
      title: [
        {
          type: 'text',
          text: {
            content: 'Complete project documentation'
          }
        }
      ]
    },
    'Status': {
      type: 'select',
      select: {
        name: 'In Progress'
      }
    },
    'Due Date': {
      type: 'date',
      date: {
        start: '2024-12-31'
      }
    }
  }
});
```

## Updating Notion Files (UPDATE Operations)

### Update Page Properties

```typescript
const pageId = 'page-id-to-update';

const updatedPage = await notionClient.updatePage(pageId, {
  properties: {
    title: {
      type: 'title',
      title: [
        {
          type: 'text',
          text: {
            content: 'Updated Page Title'
          }
        }
      ]
    }
  }
});

console.log('Page updated:', updatedPage.id);
```

### Update Database Entry

```typescript
const pageId = 'database-entry-page-id';

const updatedEntry = await notionClient.updatePage(pageId, {
  properties: {
    'Status': {
      type: 'select',
      select: {
        name: 'Completed'
      }
    },
    'Notes': {
      type: 'rich_text',
      rich_text: [
        {
          type: 'text',
          text: {
            content: 'Task completed successfully!'
          }
        }
      ]
    }
  }
});
```

### Archive a Page

```typescript
const pageId = 'page-id-to-archive';

const archivedPage = await notionClient.updatePage(pageId, {
  archived: true
});
```

## Complete Example: Read, Write, Update Workflow

```typescript
import { NotionClient } from './src/notion-client.js';
import { getConfig } from './src/config.js';

async function completeWorkflow() {
  const config = getConfig();
  const connectionId = process.env.CONNECTION_ID!;
  const notionClient = new NotionClient(config, connectionId);

  try {
    // 1. READ: Search for existing pages
    console.log('📖 Reading pages...');
    const pages = await notionClient.searchPages();
    console.log(`Found ${pages.length} pages`);

    // 2. WRITE: Create a new page
    console.log('\n✍️  Creating new page...');
    const newPage = await notionClient.createPage({
      parent: {
        type: 'workspace',
        workspace: true
      },
      properties: {
        title: {
          type: 'title',
          title: [
            {
              type: 'text',
              text: {
                content: 'Test Page - ' + new Date().toISOString()
              }
            }
          ]
        }
      }
    });
    console.log(`Created page: ${newPage.id}`);

    // 3. UPDATE: Update the page we just created
    console.log('\n🔄 Updating page...');
    const updatedPage = await notionClient.updatePage(newPage.id, {
      properties: {
        title: {
          type: 'title',
          title: [
            {
              type: 'text',
              text: {
                content: 'Updated Test Page - ' + new Date().toISOString()
              }
            }
          ]
        }
      }
    });
    console.log(`Updated page: ${updatedPage.id}`);

    // 4. READ: Get the updated page
    console.log('\n📖 Reading updated page...');
    const retrievedPage = await notionClient.getPage(newPage.id);
    const title = retrievedPage.properties?.title?.title?.[0]?.plain_text;
    console.log(`Page title: ${title}`);

  } catch (error: any) {
    console.error('Error:', error.message);
    if (error.response?.data) {
      console.error('API Error:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

completeWorkflow();
```

## Running the Examples

### Option 1: Use the Built-in Demo

```bash
npm run start
# or
npm run dev
```

This runs `src/demo.ts` which demonstrates read, write, and update operations.

### Option 2: Test Your Connection

```bash
npm run test-connection
```

This tests your connection and shows sample pages.

### Option 3: Create Your Own Script

Create a new file `src/my-notion-script.ts`:

```typescript
import { NotionClient } from './notion-client.js';
import { getConfig } from './config.js';

async function myScript() {
  const config = getConfig();
  const notionClient = new NotionClient(config, process.env.CONNECTION_ID!);
  
  // Your code here
  const pages = await notionClient.searchPages();
  console.log(`Found ${pages.length} pages`);
}

myScript();
```

Then run it:
```bash
node --loader ts-node/esm src/my-notion-script.ts
```

## Finding Your Connection ID

If you need to find or update your connection ID:

```bash
# List all connections
npm run list-connections

# List only Notion connections
npm run list-connections notion

# Verify your current connection
npm run verify-setup
```

## Common Property Types

When creating or updating pages, you'll need to format properties correctly:

### Title Property
```typescript
title: {
  type: 'title',
  title: [{ type: 'text', text: { content: 'My Title' } }]
}
```

### Rich Text Property
```typescript
description: {
  type: 'rich_text',
  rich_text: [{ type: 'text', text: { content: 'My description' } }]
}
```

### Select Property
```typescript
status: {
  type: 'select',
  select: { name: 'In Progress' }
}
```

### Date Property
```typescript
dueDate: {
  type: 'date',
  date: { start: '2024-12-31' }
}
```

### Number Property
```typescript
priority: {
  type: 'number',
  number: 5
}
```

### Checkbox Property
```typescript
completed: {
  type: 'checkbox',
  checkbox: true
}
```

## Error Handling

```typescript
try {
  const page = await notionClient.createPage({...});
  console.log('Success:', page.id);
} catch (error: any) {
  if (error.response?.status === 401) {
    console.error('Authentication failed. Check your API key.');
  } else if (error.response?.status === 404) {
    console.error('Resource not found. Check the page/database ID.');
  } else if (error.response?.data) {
    console.error('API Error:', error.response.data);
  } else {
    console.error('Error:', error.message);
  }
}
```

## Next Steps

1. **Test your connection**: `npm run test-connection`
2. **Run the demo**: `npm run start`
3. **Explore the code**: Check `src/notion-client.ts` for all available methods
4. **Read examples**: See `EXAMPLES.md` for more patterns

## Additional Resources

- [Notion API Documentation](https://developers.notion.com/reference)
- [Alloy Documentation](https://docs.runalloy.com)
- See `src/demo.ts` for a complete working example
- See `EXAMPLES.md` for more use cases

