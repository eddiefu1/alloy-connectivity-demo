# MCP Server Commands Guide

This guide explains how to use MCP (Model Context Protocol) server commands in Cursor IDE with the Alloy Connectivity API.

## 🚀 Quick Start

Once your MCP server is configured and Cursor is restarted, you can use MCP commands directly in your conversations with Cursor's AI assistant.

## 📋 Available MCP Commands

### 1. List Available Connectors

**Natural Language:**
```
List all available connectors in Alloy
```
or
```
What integrations are available?
```

**What it does:** Shows all connectors (Notion, Slack, Google Calendar, etc.) available in your Alloy account.

---

### 2. Get Credentials for a Connector

**Natural Language:**
```
Get my Notion credentials
```
or
```
Show me my Notion connections
```

**What it does:** Lists all credentials/connections you have for a specific connector (e.g., Notion).

---

### 3. Explore Connector Actions

**Natural Language:**
```
What actions can I perform with Notion?
```
or
```
Show me what I can do with the Notion connector
```

**What it does:** Lists all available actions for a connector (e.g., create page, search pages, update page, etc.).

---

### 4. Get Action Details

**Natural Language:**
```
What parameters do I need to create a Notion page?
```
or
```
Show me the details for the post-page action
```

**What it does:** Shows required parameters, data formats, and examples for a specific action.

---

### 5. Execute Actions

**Natural Language:**
```
Create a Notion page titled "My New Page"
```
or
```
Search for pages in my Notion workspace
```
or
```
Update a Notion page with ID [page-id] to have title "Updated Title"
```

**What it does:** Executes the action on your connected service.

---

## 💡 How MCP Commands Work in Cursor

### Method 1: Natural Language (Easiest)

Just ask Cursor what you want to do in plain English:

```
Create a new page in Notion with the title "Project Planning"
```

Cursor will automatically:
1. Identify the right MCP function to use
2. Get your credentials
3. Format the request correctly
4. Execute the action

### Method 2: Direct Function References

You can also reference MCP functions directly:

```
Use mcp_alloy_list_connectors_alloy to show available connectors
```

---

## 📚 Common Use Cases

### Use Case 1: Discover What's Available

```
List all connectors and show me what actions I can perform with Notion
```

This will:
- Show all available connectors
- List all Notion actions
- Help you understand what's possible

### Use Case 2: Check Your Connections

```
Get my Notion credentials and verify they're working
```

This will:
- List your Notion connections
- Show connection IDs
- Help you verify your setup

### Use Case 3: Create Content

```
Create a new Notion page with the title "Meeting Notes" and add some content
```

This will:
- Use your Notion credentials
- Create the page
- Return the page ID and URL

### Use Case 4: Read Data

```
Search for all pages in my Notion workspace and show me the first 5
```

This will:
- Search your Notion workspace
- Return page results
- Display them in a readable format

### Use Case 5: Update Data

```
Update the Notion page [page-id] to change the title to "Updated Title"
```

This will:
- Find the page
- Update its properties
- Confirm the changes

---

## 🔧 MCP Function Reference

### Core Functions

| Function | Purpose | Example Usage |
|----------|---------|--------------|
| `mcp_alloy_list_connectors_alloy` | List all available connectors | "List connectors" |
| `mcp_alloy_get_credentials_alloy` | Get credentials for a connector | "Get Notion credentials" |
| `mcp_alloy_get_connector_resources_alloy` | List actions for a connector | "What can I do with Notion?" |
| `mcp_alloy_get_action_details_alloy` | Get action parameters | "How do I create a page?" |
| `mcp_alloy_execute_action_alloy` | Execute an action | "Create a Notion page" |

### Workflow Pattern

1. **Discover:** `List connectors` → Choose a connector
2. **Check Credentials:** `Get credentials for [connector]` → Verify you have access
3. **Explore Actions:** `What actions are available for [connector]?` → See what you can do
4. **Get Details:** `What parameters do I need for [action]?` → Understand requirements
5. **Execute:** `[Do the action]` → Perform the operation

---

## ⚠️ Important Notes

### Allowlist Restrictions

Some actions may be restricted by an allowlist on your Alloy MCP server. If you get an "Access denied" error:

- The action is not allowed on your MCP server
- Use the REST API directly instead (see `src/notion-client.ts` examples)
- Contact Alloy support to update your allowlist

### Credential IDs

When executing actions, you need a `credentialId` (not the connector name). The MCP server will:
- Automatically use your credentials when available
- Or you can specify which credential to use

### Error Handling

If an MCP command fails:
- Check that your MCP server is configured correctly
- Verify your credentials exist
- Try using the REST API directly as a fallback

---

## 🎯 Examples

### Example 1: Complete Workflow

```
1. List all available connectors
2. Get my Notion credentials  
3. Show me what actions I can perform with Notion
4. Create a page titled "Test Page"
```

### Example 2: Search and Update

```
1. Search for pages in my Notion workspace
2. Show me the first page's details
3. Update that page's title to "Updated Title"
```

### Example 3: Multi-Step Operation

```
1. Create a new Notion page with title "Project Tasks"
2. Get the page ID
3. Add content to that page
```

---

## 🔍 Troubleshooting

### "MCP server not found"
- Restart Cursor IDE
- Check MCP configuration in Cursor Settings
- Verify `.mcp.json` is correct

### "Access denied: restricted by allowlist"
- The action isn't allowed on your MCP server
- Use REST API directly: `npm run create-page "Title"`

### "Credential not found"
- Run: `npm run list-connections notion`
- Verify your connection ID in `.env`
- Create a new connection: `npm run connect-notion`

---

## 📖 Additional Resources

- [Alloy Documentation](https://docs.runalloy.com)
- [MCP Protocol Specification](https://modelcontextprotocol.io)
- See `src/notion-client.ts` for REST API examples (works without MCP restrictions)

---

## 💬 Tips for Best Results

1. **Be Specific:** "Create a Notion page titled 'Meeting Notes'" is better than "create page"
2. **Ask Follow-ups:** "What parameters do I need?" if unsure
3. **Use Natural Language:** MCP understands plain English
4. **Combine Commands:** "List connectors, then create a Notion page"
5. **Check Results:** Always verify the action completed successfully

---

**Remember:** MCP commands work best when you describe what you want to accomplish, not just the technical function name!

