# Easy Way to Write & Update Notion Pages

## 🎯 Quick Start

```typescript
import { NotionClient } from './src/notion-client.js';
import { getConfig } from './src/config.js';
import { createSimplePage, updatePageTitle } from './src/notion-helpers.js';

const config = getConfig();
const notionClient = new NotionClient(config, process.env.CONNECTION_ID!);

// Write "Hello World" - ONE LINE!
const page = await createSimplePage(notionClient, 'Hello World');

// Update it - ONE LINE!
await updatePageTitle(notionClient, page.id, 'Updated!');
```

## 📚 All Helper Functions

### 1. `createSimplePage()` - Create page with just a title

**Before (complex):**
```typescript
const page = await notionClient.createPage({
  parent: { type: 'workspace', workspace: true },
  properties: {
    title: {
      type: 'title',
      title: [{ type: 'text', text: { content: 'Hello World' } }]
    }
  }
});
```

**After (simple):**
```typescript
const page = await createSimplePage(notionClient, 'Hello World');
```

### 2. `updatePageTitle()` - Update page title easily

**Before (complex):**
```typescript
await notionClient.updatePage(pageId, {
  properties: {
    title: {
      type: 'title',
      title: [{ type: 'text', text: { content: 'New Title' } }]
    }
  }
});
```

**After (simple):**
```typescript
await updatePageTitle(notionClient, pageId, 'New Title');
```

### 3. `createPageSimple()` - Create with multiple properties

**Before (complex):**
```typescript
const page = await notionClient.createPage({
  parent: { type: 'workspace', workspace: true },
  properties: {
    title: {
      type: 'title',
      title: [{ type: 'text', text: { content: 'Task' } }]
    },
    description: {
      type: 'rich_text',
      rich_text: [{ type: 'text', text: { content: 'Description' } }]
    },
    priority: { type: 'number', number: 5 },
    completed: { type: 'checkbox', checkbox: false }
  }
});
```

**After (simple):**
```typescript
const page = await createPageSimple(notionClient, {
  title: 'Task',
  description: 'Description',
  priority: 5,
  completed: false
});
```

### 4. `updatePageSimple()` - Update multiple properties

**Before (complex):**
```typescript
await notionClient.updatePage(pageId, {
  properties: {
    description: {
      type: 'rich_text',
      rich_text: [{ type: 'text', text: { content: 'Updated' } }]
    },
    priority: { type: 'number', number: 10 },
    completed: { type: 'checkbox', checkbox: true }
  }
});
```

**After (simple):**
```typescript
await updatePageSimple(notionClient, pageId, {
  description: 'Updated',
  priority: 10,
  completed: true
});
```

### 5. `NotionProps` - Helper for property types

When you need more control but still want clean code:

```typescript
import { NotionProps } from './src/notion-helpers.js';

const page = await notionClient.createPage({
  parent: { type: 'workspace', workspace: true },
  properties: {
    title: NotionProps.title('My Page'),
    status: NotionProps.select('In Progress'),
    priority: NotionProps.number(8),
    done: NotionProps.checkbox(false),
    dueDate: NotionProps.date('2024-12-31'),
  }
});
```

## 🚀 Examples

### Example 1: Write "Hello World"
```typescript
const page = await createSimplePage(notionClient, 'Hello World');
console.log('Created:', page.id);
```

### Example 2: Update a page
```typescript
await updatePageTitle(notionClient, pageId, 'Updated Title');
```

### Example 3: Create a task
```typescript
const task = await createPageSimple(notionClient, {
  title: 'Complete project',
  description: 'Finish the documentation',
  priority: 5,
  completed: false
});
```

### Example 4: Update task status
```typescript
await updatePageSimple(notionClient, task.id, {
  completed: true,
  description: 'Task completed!'
});
```

### Example 5: Create page under another page
```typescript
const childPage = await createSimplePage(notionClient, 'Child Page', {
  parentPageId: 'parent-page-id-here'
});
```

### Example 6: Create page in database
```typescript
const dbEntry = await createPageSimple(notionClient, {
  title: 'New Entry',
  status: 'Active'
}, {
  parentDatabaseId: 'database-id-here'
});
```

## 📝 Property Type Auto-Detection

`createPageSimple()` and `updatePageSimple()` automatically detect types:

- **String** → `rich_text`
- **Number** → `number`
- **Boolean** → `checkbox`
- **Date** → `date`
- **Object** → Used as-is (for advanced cases)

## 🎓 Run Examples

```bash
# See all easy examples in action
npm run easy-example

# Write "Hello World" (uses helper)
npm run hello-world
```

## 📖 Full Documentation

- `QUICK_COMMANDS.md` - Complete reference
- `NOTION_USAGE_GUIDE.md` - Detailed guide
- `src/notion-helpers.ts` - Source code with all helpers

