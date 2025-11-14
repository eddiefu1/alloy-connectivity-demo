# How to Use MCP Servers

This guide explains how to use Model Context Protocol (MCP) servers in Cursor IDE with the Alloy Connectivity Demo.

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

---

### Example 2: Create OAuth Credential for Notion

**You say:**
```
Create a Notion OAuth credential for me
```

**The AI will use:** `mcp_alloy_create_credential_alloy` with:
- `connectorId: "notion"`
- `authenticationType: "oauth2"`
- `redirectUri: "http://localhost:3000/oauth/callback"`

**Expected result:** An OAuth URL to authorize Notion

---

### Example 3: Get Existing Credentials

**You say:**
```
Show me my existing Notion credentials
```

**The AI will use:** `mcp_alloy_get_credentials_alloy` with:
- `connectorId: "notion"`

**Expected result:** List of your Notion connection credentials

---

### Example 4: Execute Actions on Notion

**You say:**
```
Search for pages in my Notion workspace
```

**The AI will:
1. Get your credentials: `mcp_alloy_get_credentials_alloy`
2. Get available actions: `mcp_alloy_get_connector_resources_alloy`
3. Get action details: `mcp_alloy_get_action_details_alloy`
4. Execute the action: `mcp_alloy_execute_action_alloy`

**Expected result:** List of pages from your Notion workspace

---

### Example 5: Create a Notion Page via MCP

**You say:**
```
Create a new Notion page with title "Meeting Notes"
```

**The AI will:
1. Get your credential ID
2. Find the create page action
3. Execute it with your page data

**Expected result:** A new page created in Notion

---

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

---

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

---

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

---

## 🔍 Troubleshooting

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

---

## 💡 Tips for Using MCP

1. **Be Specific:** Instead of "connect Notion", say "Create an OAuth credential for Notion connector"

2. **Check First:** Ask "What connectors are available?" before trying to connect

3. **Use Credential ID:** Once you have a credential ID, you can reference it directly

4. **Natural Language:** You don't need to know function names - just describe what you want

5. **Chain Operations:** You can ask for multiple operations in one request:
   ```
   Create a Notion credential, then search for pages, then create a new page
   ```

---

## 🔗 Related Resources

- [Alloy MCP Documentation](https://docs.runalloy.com)
- [Notion MCP Documentation](https://developers.notion.com)
- [MCP Protocol Specification](https://modelcontextprotocol.io)

---

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

