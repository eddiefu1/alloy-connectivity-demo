import { NotionClient } from './notion-client.js';

/**
 * Helper functions to make writing and updating Notion pages easier
 * These functions simplify the complex nested object structure required by the Notion API
 */

/**
 * Create a simple page with just a title
 * Usage: await createSimplePage(notionClient, 'My Page Title')
 */
export async function createSimplePage(
  client: NotionClient,
  title: string,
  options?: {
    parentPageId?: string;
    parentDatabaseId?: string;
  }
) {
  const parent = options?.parentPageId
    ? { type: 'page_id' as const, page_id: options.parentPageId }
    : options?.parentDatabaseId
    ? { type: 'database_id' as const, database_id: options.parentDatabaseId }
    : { type: 'workspace' as const, workspace: true };

  return await client.createPage({
    parent,
    properties: {
      title: {
        type: 'title',
        title: [{ type: 'text', text: { content: title } }],
      },
    },
  });
}

/**
 * Update a page title easily
 * Usage: await updatePageTitle(notionClient, pageId, 'New Title')
 */
export async function updatePageTitle(
  client: NotionClient,
  pageId: string,
  newTitle: string
) {
  return await client.updatePage(pageId, {
    properties: {
      title: {
        type: 'title',
        title: [{ type: 'text', text: { content: newTitle } }],
      },
    },
  });
}

/**
 * Create a page with simple properties (no nested structure needed)
 * 
 * IMPORTANT: For workspace pages, only 'title' is allowed.
 * For database pages, you can add any properties that exist in the database.
 * 
 * Usage: 
 *   - Workspace: await createPageSimple(notionClient, { title: 'My Page' })
 *   - Database: await createPageSimple(notionClient, { title: 'Task', status: 'Active' }, { parentDatabaseId: 'db-id' })
 */
export async function createPageSimple(
  client: NotionClient,
  properties: {
    title: string;
    [key: string]: any; // Other properties as simple values
  },
  options?: {
    parentPageId?: string;
    parentDatabaseId?: string;
  }
) {
  const parent = options?.parentPageId
    ? { type: 'page_id' as const, page_id: options.parentPageId }
    : options?.parentDatabaseId
    ? { type: 'database_id' as const, database_id: options.parentDatabaseId }
    : { type: 'workspace' as const, workspace: true };

  // Convert simple properties to Notion format
  const notionProperties: Record<string, any> = {
    title: {
      type: 'title',
      title: [{ type: 'text', text: { content: properties.title } }],
    },
  };

  // For workspace pages, only title is allowed
  const isWorkspacePage = !options?.parentPageId && !options?.parentDatabaseId;
  
  if (isWorkspacePage) {
    // Only include title for workspace pages
    const extraProps = Object.keys(properties).filter(k => k !== 'title');
    if (extraProps.length > 0) {
      console.warn(`⚠️  Warning: Workspace pages only support 'title'. Ignoring properties: ${extraProps.join(', ')}`);
      console.warn(`   To use custom properties, create the page in a database using parentDatabaseId option.`);
    }
  } else {
    // Handle other properties for database pages
    for (const [key, value] of Object.entries(properties)) {
      if (key === 'title') continue;

      // Auto-detect property type based on value
      if (typeof value === 'string') {
        notionProperties[key] = {
          type: 'rich_text',
          rich_text: [{ type: 'text', text: { content: value } }],
        };
      } else if (typeof value === 'number') {
        notionProperties[key] = {
          type: 'number',
          number: value,
        };
      } else if (typeof value === 'boolean') {
        notionProperties[key] = {
          type: 'checkbox',
          checkbox: value,
        };
      } else if (value instanceof Date) {
        notionProperties[key] = {
          type: 'date',
          date: { start: value.toISOString().split('T')[0] },
        };
      } else if (typeof value === 'object' && value !== null) {
        // If it's already in Notion format, use it as-is
        notionProperties[key] = value;
      }
    }
  }

  return await client.createPage({
    parent,
    properties: notionProperties,
  });
}

/**
 * Update page properties easily
 * Usage: await updatePageSimple(notionClient, pageId, { status: 'Done', notes: 'Completed!' })
 */
export async function updatePageSimple(
  client: NotionClient,
  pageId: string,
  updates: Record<string, any>
) {
  const notionProperties: Record<string, any> = {};

  for (const [key, value] of Object.entries(updates)) {
    if (key === 'title') {
      notionProperties.title = {
        type: 'title',
        title: [{ type: 'text', text: { content: value } }],
      };
    } else if (typeof value === 'string') {
      notionProperties[key] = {
        type: 'rich_text',
        rich_text: [{ type: 'text', text: { content: value } }],
      };
    } else if (typeof value === 'number') {
      notionProperties[key] = {
        type: 'number',
        number: value,
      };
    } else if (typeof value === 'boolean') {
      notionProperties[key] = {
        type: 'checkbox',
        checkbox: value,
      };
    } else if (value instanceof Date) {
      notionProperties[key] = {
        type: 'date',
        date: { start: value.toISOString().split('T')[0] },
      };
    } else if (typeof value === 'object' && value !== null) {
      // If it's already in Notion format, use it as-is
      notionProperties[key] = value;
    }
  }

  return await client.updatePage(pageId, {
    properties: notionProperties,
  });
}

/**
 * Helper to create property values in Notion format
 */
export const NotionProps = {
  title: (text: string) => ({
    type: 'title' as const,
    title: [{ type: 'text' as const, text: { content: text } }],
  }),
  text: (text: string) => ({
    type: 'rich_text' as const,
    rich_text: [{ type: 'text' as const, text: { content: text } }],
  }),
  number: (num: number) => ({
    type: 'number' as const,
    number: num,
  }),
  checkbox: (checked: boolean) => ({
    type: 'checkbox' as const,
    checkbox: checked,
  }),
  date: (date: string | Date) => ({
    type: 'date' as const,
    date: {
      start: typeof date === 'string' ? date : date.toISOString().split('T')[0],
    },
  }),
  select: (option: string) => ({
    type: 'select' as const,
    select: { name: option },
  }),
};

