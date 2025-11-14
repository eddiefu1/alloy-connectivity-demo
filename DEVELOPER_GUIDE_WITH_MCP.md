# Alloy Connectivity API - Complete Developer Guide & MCP Usage

Complete guide for integrating with Alloy's Connectivity API to connect and sync data with third-party services like Notion, Slack, Google Drive, and 200+ other integrations.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Quick Start](#quick-start)
4. [API Key Setup](#api-key-setup)
5. [OAuth Connection](#oauth-connection)
6. [API Usage](#api-usage)
7. [Code Examples](#code-examples)
8. [Error Handling](#error-handling)
9. [API Reference](#api-reference)
10. [MCP (Model Context Protocol) Usage Guide](#mcp-model-context-protocol-usage-guide)

---

# Overview

The Alloy Connectivity API provides a unified interface to connect your application with 200+ third-party services through a single API. This documentation demonstrates integration with Notion, but the same patterns apply to all supported connectors.

## Key Features

- OAuth 2.0 Authentication: Secure, standard OAuth flow for connecting services
- Unified API: Single API interface for multiple integrations
- Read & Write Operations: Full CRUD support for connected services
- Connection Management: List, verify, and manage connections programmatically

## How It Works

```
Your Application → Alloy Connectivity API → Third-Party Service (Notion)
```

1. Authenticate with Alloy using your API key
2. Connect a third-party service via OAuth 2.0
3. Use Connection ID to make API calls through Alloy
4. Sync Data between your app and the connected service

---

# Prerequisites

- Node.js 18+ and npm installed
- Alloy Account: [Sign up at runalloy.com](https://runalloy.com)
- API Credentials from [Alloy Dashboard](https://app.runalloy.com):
  - API Key (Settings → API Keys → Create API Key)
  - User ID (found in Settings → API Keys section)

---

# Quick Start

## Step 1: Install Dependencies

```bash
npm install axios dotenv
```

## Step 2: Configure Environment Variables

Create a `.env` file in your project root:

```env
ALLOY_API_KEY=your_api_key_here
ALLOY_USER_ID=your_user_id_here
CONNECTION_ID=your_connection_id_here
ALLOY_BASE_URL=https://production.runalloy.com
```

**Security Note**: Never commit your `.env` file. Add it to `.gitignore`:

```gitignore
.env
.env.local
.env.*.local
```

## Step 3: Basic Setup Code

```typescript
// config.ts
import dotenv from 'dotenv';

dotenv.config();

export function getConfig() {
  const apiKey = process.env.ALLOY_API_KEY;
  const userId = process.env.ALLOY_USER_ID;
  const baseUrl = process.env.ALLOY_BASE_URL || 'https://production.runalloy.com';

  if (!apiKey) {
    throw new Error('ALLOY_API_KEY environment variable is required');
  }

  if (!userId) {
    throw new Error('ALLOY_USER_ID environment variable is required');
  }

  return {
    alloyApiKey: apiKey,
    alloyUserId: userId,
    alloyBaseUrl: baseUrl,
  };
}
```

---

# API Key Setup

## Getting Your API Key

1. Go to [Alloy Dashboard](https://app.runalloy.com)
2. Navigate to **Settings** → **API Keys**
3. Click **Create API Key**
4. Copy and securely store your API key
5. Copy your User ID from the same section

## Production vs Development

- Both use the same endpoint: `https://production.runalloy.com`
- Use the API key that matches your Alloy account type
- If you get "Unauthorized" errors, try switching between production/development keys
- Get a fresh API key from the dashboard if both fail

## Verifying Your API Key

```bash
npm run verify-setup
```

---

# OAuth Connection

Alloy uses OAuth 2.0 for connecting third-party services. The authentication flow consists of two main steps:

1. Initiate OAuth Flow: Get an authorization URL
2. Handle OAuth Callback: Exchange authorization code for Connection ID

## Connection Methods

**Method 1: Command Line**
```bash
npm run connect-notion
```

**Method 2: List Existing Connections**
```bash
npm run list-connections notion
```

**Method 3: Web Interface**
```bash
npm run server
# Then visit http://localhost:3000
```

## Connection ID Format

- 24 characters (hexadecimal)
- Example: `690ff6ff2472d76a35e7ebaa`
- Format: `[a-f0-9]{24}`

After getting your Connection ID, add it to `.env`:
```env
CONNECTION_ID=your_connection_id_here
```

---

# API Usage

Once you have a Connection ID, you can make API calls to the connected service through Alloy's Connectivity API.

## Creating a Client

```typescript
// notion-client.ts
import axios, { AxiosInstance } from 'axios';
import { getConfig } from './config.js';

export class NotionClient {
  private client: AxiosInstance;
  private config: ReturnType<typeof getConfig>;
  private connectionId: string;

  constructor(config: ReturnType<typeof getConfig>, connectionId: string) {
    this.config = config;
    this.connectionId = connectionId;
    this.client = axios.create({
      baseURL: config.alloyBaseUrl,
      headers: {
        'Authorization': `Bearer ${config.alloyApiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async executeAction(
    actionId: string,
    parameters: any = {}
  ): Promise<any> {
    try {
      const response = await this.client.post(
        `/connectors/notion/actions/${actionId}`,
        {
          credentialId: this.connectionId,
          parameters: parameters,
        }
      );

      return response.data;
    } catch (error: any) {
      console.error(`Failed to execute action ${actionId}:`, error.message);
      if (error.response?.data) {
        console.error('API Error:', error.response.data);
      }
      throw error;
    }
  }

  async searchPages(
    query?: string,
    filter?: any
  ): Promise<any[]> {
    return await this.executeAction('post-search', {
      query: query,
      filter: filter || { value: 'page', property: 'object' },
    });
  }

  async createPage(pageData: {
    parent: { type: string; [key: string]: any };
    properties: Record<string, any>;
  }): Promise<any> {
    return await this.executeAction('post-page', pageData);
  }

  async updatePage(
    pageId: string,
    updates: { properties: Record<string, any> }
  ): Promise<any> {
    return await this.executeAction('patch-page', {
      page_id: pageId,
      ...updates,
    });
  }
}
```

---

# Code Examples

## Basic Setup

```typescript
import { NotionClient } from './notion-client.js';
import { getConfig } from './config.js';

const config = getConfig();
const connectionId = process.env.CONNECTION_ID!;
const notionClient = new NotionClient(config, connectionId);
```

## Read Operations

**Search Pages:**
```typescript
// Search all pages
const pages = await notionClient.searchPages();

// Search with query
const pages = await notionClient.searchPages('Project Planning');
```

## Write Operations

**Create Page:**
```typescript
const newPage = await notionClient.createPage({
  parent: {
    type: 'workspace',
    workspace: true
  },
  properties: {
    title: {
      type: 'title',
      title: [{ type: 'text', text: { content: 'My Page Title' } }]
    }
  }
});
```

## Update Operations

**Update Page:**
```typescript
const updatedPage = await notionClient.updatePage('page-id-here', {
  properties: {
    title: {
      type: 'title',
      title: [{ type: 'text', text: { content: 'Updated Title' } }]
    }
  }
});
```

---

# Error Handling

## Common Error Types

**Authentication Errors:**
```typescript
try {
  await notionClient.searchPages();
} catch (error: any) {
  if (error.response?.status === 401) {
    console.error('Authentication failed - Check your ALLOY_API_KEY and ALLOY_USER_ID');
  } else if (error.response?.status === 403) {
    console.error('Authorization failed - Your API key may not have the required permissions');
  }
}
```

**Connection Errors:**
```typescript
try {
  await notionClient.searchPages();
} catch (error: any) {
  const errorData = error.response?.data;
  
  if (errorData?.error?.code === 'INVALID_INPUT' && 
      errorData?.error?.message === 'Credential not found') {
    console.error('Connection ID is invalid - Update CONNECTION_ID in your .env file');
  }
}
```

## Troubleshooting

**"ALLOY_API_KEY environment variable is required"**
- Verify `.env` file exists and contains `ALLOY_API_KEY=your_key_here`
- Ensure no extra spaces around `=`
- Restart your application after modifying `.env`

**"Credential not found" or "Invalid Authorization"**
- Verify Connection ID: Run OAuth flow again or check Alloy Dashboard
- Check API credentials are correct
- List connections: `npm run list-connections notion`

**Rate Limiting (HTTP 429)**
- Implement retry logic with exponential backoff
- Reduce request frequency
- Batch operations when possible

---

# API Reference

## Base URL

```
Production: https://production.runalloy.com
```

## Authentication

All requests require a Bearer token in the Authorization header:

```
Authorization: Bearer YOUR_API_KEY
```

## Common Actions

### Notion Actions

| Action ID | Description | Parameters |
|-----------|-------------|------------|
| `post-search` | Search pages/databases | `query`, `filter` |
| `get-page` | Get page by ID | `page_id` |
| `post-page` | Create new page | `parent`, `properties` |
| `patch-page` | Update page | `page_id`, `properties` |
| `get-database` | Get database by ID | `database_id` |
| `query-database` | Query database | `database_id`, `filter`, `sorts` |

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 429 | Rate Limited |
| 500 | Server Error |

---

# MCP (Model Context Protocol) Usage Guide

## What is MCP?

MCP (Model Context Protocol) allows AI assistants like Cursor to interact with external services through standardized functions. In this project, you have access to:

1. **Alloy MCP Server** - Access to Alloy's Connectivity API
2. **Notion MCP Server** - Direct access to Notion API

## ✅ Verify MCP is Configured

Your MCP servers are already configured in `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "alloy": {
      "url": "https://mcp-api.runalloy.com/mcp/..."
    },
    "Notion": {
      "url": "https://mcp.notion.com/mcp"
    }
  }
}
```

**To verify MCP is working:**
1. Restart Cursor IDE (if you just configured it)
2. Open the chat panel in Cursor
3. Ask: "What MCP functions are available?"
4. The AI should list available MCP functions

## 🚀 Using MCP Functions

MCP functions are automatically available when you chat with Cursor's AI. You can use them by:

1. **Asking natural language questions** - The AI will use MCP functions automatically
2. **Directly requesting actions** - Ask the AI to perform specific operations

### Example 1: List Available Connectors

**You say:**
```
List all available connectors in Alloy
```

**The AI will use:** `mcp_alloy_list_connectors_alloy`

**Expected result:** A list of all connectors (Notion, Slack, HubSpot, etc.)

### Example 2: Create OAuth Credential for Notion

**You say:**
```
Create a Notion OAuth credential for me
```

**The AI will use:** `mcp_alloy_create_credential_alloy` with:
- `connectorId: "notion"`
- `authenticationType: "oauth2"`

**Expected result:** An OAuth URL to authorize Notion

### Example 3: Get Existing Credentials

**You say:**
```
Show me my existing Notion credentials
```

**The AI will use:** `mcp_alloy_get_credentials_alloy` with:
- `connectorId: "notion"`

**Expected result:** List of your Notion connection credentials

### Example 4: Execute Actions on Notion

**You say:**
```
Search for pages in my Notion workspace
```

**The AI will:**
1. Get your credentials: `mcp_alloy_get_credentials_alloy`
2. Get available actions: `mcp_alloy_get_connector_resources_alloy`
3. Get action details: `mcp_alloy_get_action_details_alloy`
4. Execute the action: `mcp_alloy_execute_action_alloy`

**Expected result:** List of pages from your Notion workspace

### Example 5: Create a Notion Page via MCP

**You say:**
```
Create a new Notion page with title "Meeting Notes"
```

**The AI will:**
1. Get your credential ID
2. Find the create page action
3. Execute it with your page data

**Expected result:** A new page created in Notion

## 📋 Common MCP Functions Available

### Alloy MCP Functions

| Function | Purpose | Example Usage |
|----------|---------|---------------|
| `mcp_alloy_list_connectors_alloy` | List all available connectors | "What connectors are available?" |
| `mcp_alloy_get_credentials_alloy` | Get existing credentials | "Show my Notion credentials" |
| `mcp_alloy_create_credential_alloy` | Create OAuth credential | "Connect Notion via OAuth" |
| `mcp_alloy_get_connector_resources_alloy` | List available actions | "What can I do with Notion?" |
| `mcp_alloy_get_action_details_alloy` | Get action parameters | "How do I create a page?" |
| `mcp_alloy_execute_action_alloy` | Execute an action | "Create a Notion page" |
| `mcp_alloy_get_credential_metadata_alloy` | Get auth requirements | "What auth does Notion need?" |

### Notion MCP Functions

| Function | Purpose | Example Usage |
|----------|---------|---------------|
| `mcp_Notion_notion-search` | Search Notion workspace | "Search for pages about projects" |
| `mcp_Notion_notion-fetch` | Fetch a page/database | "Get page details for [page-id]" |
| `mcp_Notion_notion-create-pages` | Create pages | "Create a new page" |
| `mcp_Notion_notion-update-page` | Update a page | "Update page [id]" |
| `mcp_Notion_notion-move-pages` | Move pages | "Move page to database" |

## 🎯 Practical Examples

### Example: Complete OAuth Flow via MCP

**Step 1:** Ask to create a credential
```
Create a Notion OAuth credential with redirect URI http://localhost:3000/oauth/callback
```

**Step 2:** The AI will return an OAuth URL. Open it in your browser.

**Step 3:** After authorization, ask:
```
Check if my Notion connection is ready
```

**Step 4:** Use the connection:
```
List all pages in my Notion workspace
```

### Example: Search and Create in Notion

**Search:**
```
Search for pages containing "project" in my Notion workspace
```

**Create:**
```
Create a new Notion page titled "Project Planning" with content "# Project Plan\n\nThis is my project plan."
```

**Update:**
```
Update the page [page-id] to add a section about timeline
```

## 🔍 Troubleshooting MCP

### MCP Functions Not Available

**Problem:** AI doesn't recognize MCP functions

**Solutions:**
1. **Restart Cursor** - MCP servers load on startup
2. **Check MCP config** - Verify `~/.cursor/mcp.json` exists
3. **Check Cursor settings** - Ensure MCP is enabled
4. **Check server status** - External MCP servers should be accessible

### OAuth Flow Issues

**Problem:** OAuth credential creation fails

**Solutions:**
1. **Check redirect URI** - Must match what's registered in Alloy
2. **Verify API key** - Ensure your Alloy API key is valid
3. **Check network** - MCP servers need internet access

### Credential Not Found

**Problem:** "No credentials found" error

**Solutions:**
1. **Create credential first** - Use `create_credential` function
2. **Check connector ID** - Use exact ID (e.g., "notion", not "Notion")
3. **Verify in dashboard** - Check Alloy dashboard for connections

## 💡 Tips for Using MCP

1. **Be Specific:** Instead of "connect Notion", say "Create an OAuth credential for Notion connector"

2. **Check First:** Ask "What connectors are available?" before trying to connect

3. **Use Credential ID:** Once you have a credential ID, you can reference it directly

4. **Natural Language:** You don't need to know function names - just describe what you want

5. **Chain Operations:** You can ask for multiple operations in one request:
   ```
   Create a Notion credential, then search for pages, then create a new page
   ```

## 📝 Quick Reference

**List connectors:**
```
What connectors can I use with Alloy?
```

**Create OAuth connection:**
```
Connect Notion via OAuth
```

**List credentials:**
```
Show my existing connections
```

**Execute action:**
```
[Describe what you want to do, e.g., "Create a page", "Search pages", etc.]
```

**Get help:**
```
What MCP functions are available?
How do I use the Alloy MCP server?
```

## 🔗 Related Resources

- [Alloy MCP Documentation](https://docs.runalloy.com)
- [Notion MCP Documentation](https://developers.notion.com)
- [MCP Protocol Specification](https://modelcontextprotocol.io)

---

**Last Updated**: December 2024  
**Version**: 1.0.0

