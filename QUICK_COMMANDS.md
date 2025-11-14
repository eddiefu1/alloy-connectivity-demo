# Quick Commands: Write & Update Notion Pages

## ⚡ EASIER WAY (Recommended!)

**Use helper functions for simpler syntax:**

```typescript
import { NotionClient } from './src/notion-client.js';
import { getConfig } from './src/config.js';
import { createSimplePage, updatePageTitle, createPageSimple, updatePageSimple } from './src/notion-helpers.js';

const config = getConfig();
const notionClient = new NotionClient(config, process.env.CONNECTION_ID!);

// ✨ EASIEST: Create a page with just a title
const page = await createSimplePage(notionClient, 'Hello World');

// ✨ EASY: Update page title
await updatePageTitle(notionClient, page.id, 'New Title');

// ✨ EASY: Create page with multiple properties (auto-detects types)
const task = await createPageSimple(notionClient, {
  title: 'My Task',
  description: 'Task description',
  priority: 5,
  completed: false
});

// ✨ EASY: Update multiple properties
await updatePageSimple(notionClient, task.id, {
  description: 'Updated description',
  priority: 10,
  completed: true
});
```

**See `npm run easy-example` for more examples!**

---

## Traditional Way (Full Control)

## Setup (One-time)

```typescript
import { NotionClient } from './src/notion-client.js';
import { getConfig } from './src/config.js';

const config = getConfig();
const notionClient = new NotionClient(config, process.env.CONNECTION_ID!);
```

## WRITE (Create a Page)

### Basic Command:
```typescript
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
            content: 'My Page Title'
          }
        }
      ]
    }
  }
});

console.log('Created page:', newPage.id);
console.log('Page URL:', newPage.url);
```

### Create Page Under Another Page:
```typescript
const newPage = await notionClient.createPage({
  parent: {
    type: 'page_id',
    page_id: 'parent-page-id-here'
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

### Create Page in Database:
```typescript
const newPage = await notionClient.createPage({
  parent: {
    type: 'database_id',
    database_id: 'your-database-id-here'
  },
  properties: {
    'Task Name': {
      type: 'title',
      title: [
        {
          type: 'text',
          text: {
            content: 'Complete project'
          }
        }
      ]
    },
    'Status': {
      type: 'select',
      select: {
        name: 'In Progress'
      }
    }
  }
});
```

## UPDATE (Update a Page)

### Basic Command:
```typescript
const updatedPage = await notionClient.updatePage('page-id-here', {
  properties: {
    title: {
      type: 'title',
      title: [
        {
          type: 'text',
          text: {
            content: 'Updated Title'
          }
        }
      ]
    }
  }
});

console.log('Updated page:', updatedPage.id);
```

### Update Multiple Properties:
```typescript
const updatedPage = await notionClient.updatePage('page-id-here', {
  properties: {
    title: {
      type: 'title',
      title: [
        {
          type: 'text',
          text: {
            content: 'New Title'
          }
        }
      ]
    },
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
            content: 'Task completed!'
          }
        }
      ]
    }
  }
});
```

### Archive a Page:
```typescript
await notionClient.updatePage('page-id-here', {
  archived: true
});
```

## Quick Test Script

Save this as `src/quick-write-update.ts`:

```typescript
import { NotionClient } from './notion-client.js';
import { getConfig } from './config.js';

async function quickTest() {
  const config = getConfig();
  const notionClient = new NotionClient(config, process.env.CONNECTION_ID!);

  // WRITE: Create a page
  console.log('Creating page...');
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
  console.log('✅ Created:', newPage.id);

  // UPDATE: Update the page
  console.log('Updating page...');
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
  console.log('✅ Updated:', updatedPage.id);
}

quickTest();
```

Then run: `node --loader ts-node/esm src/quick-write-update.ts`

## Common Property Types

### Title:
```typescript
title: {
  type: 'title',
  title: [{ type: 'text', text: { content: 'My Title' } }]
}
```

### Rich Text:
```typescript
description: {
  type: 'rich_text',
  rich_text: [{ type: 'text', text: { content: 'My description' } }]
}
```

### Select:
```typescript
status: {
  type: 'select',
  select: { name: 'In Progress' }
}
```

### Date:
```typescript
dueDate: {
  type: 'date',
  date: { start: '2024-12-31' }
}
```

### Number:
```typescript
priority: {
  type: 'number',
  number: 5
}
```

### Checkbox:
```typescript
completed: {
  type: 'checkbox',
  checkbox: true
}
```

## Summary

**To WRITE (create):**
```typescript
await notionClient.createPage({ parent: {...}, properties: {...} })
```

**To UPDATE:**
```typescript
await notionClient.updatePage(pageId, { properties: {...} })
```

**To run examples:**
- `npm run notion-example` - Full demo
- `npm run start` - Main demo script

