# Developer Guide

Comprehensive guide for developing with the Alloy Connectivity API.

## Overview

The Alloy Connectivity API enables integration with 200+ third-party services (like Notion, Slack, HubSpot, etc.) through a unified API. This project demonstrates:

- **OAuth 2.0 Authentication**: Secure, user-authorized connections
- **Data Synchronization**: Read, write, and update operations
- **Connection Management**: Create, list, and manage connections
- **Unified Data Model**: Standardized API across all integrations

## Quick Start

1. **Setup**: See [SETUP.md](../SETUP.md) for installation and configuration
2. **Examples**: See [EXAMPLES.md](../EXAMPLES.md) for code examples
3. **API Reference**: See [Endpoint Pattern Summary](endpoint-pattern-summary.md) for API details

## Architecture

### Components

- **NotionClient** (`src/notion-client.ts`): Notion-specific client using Connectivity API
- **AlloyOAuthFlow** (`src/oauth-flow.ts`): OAuth 2.0 flow handler
- **Config** (`src/config.ts`): Configuration management
- **Demo** (`src/demo.ts`): Complete working example

### API Pattern

All operations use the Connectivity API endpoint pattern:

```
POST https://production.runalloy.com/connectors/{connectorId}/actions/{actionId}/execute
```

See [Endpoint Pattern Summary](endpoint-pattern-summary.md) for details.

## Key Concepts

### OAuth Flow

1. Initiate OAuth flow to get authorization URL
2. Redirect user to authorization URL
3. Handle callback with authorization code
4. Exchange code for connection ID
5. Use connection ID for API operations

### Connection Management

- Connections are created via OAuth flow
- Connection IDs are used for all API operations
- Verify connections with `npm run verify-connection`

### Data Operations

- **Read**: Search pages, get page by ID, query databases
- **Write**: Create pages, create databases
- **Update**: Update page properties, update database properties

## Development Workflow

1. **Setup Environment**: Configure `.env` with API key and user ID
2. **Create Connection**: Run `npm run connect-notion` to create OAuth connection
3. **Verify Connection**: Run `npm run verify-connection` to verify and set connection
4. **Develop**: Use `NotionClient` for API operations
5. **Test**: Run `npm run dev` to test your code

## Best Practices

1. **Error Handling**: Always wrap API calls in try-catch blocks
2. **Retry Logic**: Implement retry logic for transient failures
3. **Rate Limiting**: Respect API rate limits with proper throttling
4. **Connection Testing**: Test connections before using them
5. **Security**: Never commit `.env` files or API keys

## Troubleshooting

See [SETUP.md](../SETUP.md) for troubleshooting common issues.

## MCP (Model Context Protocol) Setup

MCP allows you to use Alloy's Connectivity API directly through Cursor's AI assistant using natural language commands.

### Setting Up MCP in Cursor

1. **Get your MCP server URL** from the Alloy dashboard (Settings → MCP Servers)

2. **Open Cursor Settings** (`Ctrl+,` or `Cmd+,`)

3. **Navigate to MCP Servers** settings

4. **Add the Alloy server configuration:**
   - Copy the configuration from `.mcp.json` in this project
   - Replace `YOUR_SERVER_ID/YOUR_TOKEN` with your actual MCP server URL
   - The URL format is: `https://mcp-api.runalloy.com/mcp/YOUR_SERVER_ID/YOUR_TOKEN`

5. **Restart Cursor** to load the new MCP configuration

**Example configuration:**
```json
{
  "mcpServers": {
    "alloy": {
      "url": "https://mcp-api.runalloy.com/mcp/YOUR_SERVER_ID/YOUR_TOKEN"
    }
  }
}
```

### Using MCP Commands

Once configured, you can use natural language commands in Cursor:

- **List connectors:** "List all available connectors in Alloy"
- **Check credentials:** "Get my Notion credentials"
- **Explore actions:** "What actions can I perform with Notion?"
- **Create content:** "Create a Notion page titled 'My New Page'"
- **Search data:** "Search for pages in my Notion workspace"
- **Update content:** "Update the Notion page [id] to have title 'Updated Title'"

### Important Notes

- Some actions may be restricted by an allowlist on your MCP server
- If you get "Access denied" errors, use the REST API directly instead
- MCP commands work best when you describe what you want in plain English
- The MCP server automatically uses your configured credentials

### Troubleshooting MCP

- **MCP server not found:** Restart Cursor and verify configuration
- **Access denied:** Action may be restricted - use REST API as fallback
- **Credential not found:** Verify your connections with `npm run list-connections`

## Additional Resources

- [Alloy Documentation](https://docs.runalloy.com)
- [Alloy API Reference](https://docs.runalloy.com/api-reference)
- [Notion API Documentation](https://developers.notion.com/reference)
