# Alloy Connectivity API Demo

A complete demonstration of Alloy's Connectivity API showcasing **OAuth authentication flows** and **data synchronization (read and write operations)** with Notion. This project uses both the **REST API** and **Node.js SDK** to interact with Alloy's Connectivity API.

## 📋 What This Application Does

This application demonstrates how to integrate with **Alloy Automation's Connectivity API** to:

1. **Connect Integrations via OAuth 2.0**: 
   - Initiate OAuth flows programmatically
   - Handle OAuth callbacks
   - Create authenticated connections with third-party services (e.g., Notion)
   - Manage connection lifecycle

2. **Synchronize Data**:
   - **Read operations**: Fetch data from connected integrations (e.g., read pages from Notion)
   - **Write operations**: Create new data in connected integrations (e.g., create pages in Notion)
   - **Update operations**: Modify existing data (e.g., update Notion pages)

3. **Manage Connections**:
   - List all connections
   - Check connection status
   - Use existing connections
   - Handle connection errors gracefully

### Key Features

- ✅ **Complete OAuth 2.0 Flow**: Full implementation of OAuth authentication with Alloy
- ✅ **REST API Integration**: Direct API calls to Alloy's Connectivity API
- ✅ **Node.js SDK Support**: Uses Alloy's official SDK for simplified integration
- ✅ **Web Interface**: User-friendly HTML interface for connecting integrations
- ✅ **Diagnostics Tools**: Comprehensive debugging and diagnostic endpoints
- ✅ **Error Handling**: Robust error handling with helpful error messages
- ✅ **Connection Management**: Tools to list, check, and manage connections
- ✅ **Production Ready**: Configured for production environment with proper security

### Use Cases

- **Integration Development**: Learn how to integrate Alloy's Connectivity API into your applications
- **OAuth Implementation**: Understand how to implement OAuth flows with Alloy
- **Data Synchronization**: See how to read and write data through Alloy's API
- **Connection Management**: Learn how to manage and monitor connections
- **Error Handling**: See best practices for handling OAuth and API errors

## 🎯 Requirements Met

This demo fulfills all requirements:

- ✅ **Uses Alloy Connectivity API**: Demonstrates both REST API and Node.js SDK implementations
- ✅ **Authentication Flow**: Complete OAuth 2.0 flow for connecting Notion
- ✅ **Data Sync**: Full read and write operations to demonstrate data synchronization
- ✅ **GitHub Ready**: Complete setup instructions and documentation

## 🔐 OAuth Connection Guide

**Quick Start**: See [OAUTH_GUIDE.md](./OAUTH_GUIDE.md) for detailed OAuth connection instructions.

**Quick Methods**:
1. **Web Interface** (Easiest): Start server → Visit `http://localhost:3000` → Click "Connect Notion"
2. **Command Line**: Run `npm run connect-notion` → Follow instructions
3. **API**: POST to `/api/oauth/initiate` → Open returned URL → Authorize

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** and npm
- **Alloy Account**: [Sign up at runalloy.com](https://runalloy.com)
- **API Credentials**: Get from [Alloy Dashboard](https://app.runalloy.com)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/eddiefu1/alloy-connectivity-demo.git
   cd alloy-connectivity-demo
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```

4. **Edit `.env` with your Alloy credentials**
   
   Create a `.env` file in the project root:
   ```env
   # Production API Key (recommended)
   ALLOY_ENVIRONMENT=production
   ALLOY_API_KEY=your_api_key_here
   
   # Development API Key (alternative)
   # ALLOY_ENVIRONMENT=development
   # ALLOY_API_KEY=your_dev_api_key_here
   
   # Your User ID (get from Alloy Dashboard)
   ALLOY_USER_ID=your_user_id_here
   
   # Base URL (both dev and prod use the same URL)
   ALLOY_BASE_URL=https://production.runalloy.com
   
   # Connection ID (obtained after OAuth flow)
   CONNECTION_ID=your_connection_id_here
   
   # Optional: Custom OAuth Redirect URI
   # If not set, defaults to http://localhost:3000/oauth/callback
   # Make sure this matches what's registered in your Alloy account
   OAUTH_REDIRECT_URI=http://localhost:3000/oauth/callback
   
   # Optional: Notion Internal Integration Token
   # For direct Notion API access (bypassing Alloy OAuth)
   NOTION_INTERNAL_TOKEN=your_notion_internal_token_here
   ```

   **Get your User ID:**
   - Log in to [Alloy Dashboard](https://app.runalloy.com)
   - Navigate to **Settings** → **API Keys**
   - Copy your User ID

   **Get your Connection ID:**
   - **Recommended:** Verify connection: `npm run verify-connection` (finds and sets working connection)
   - Complete OAuth flow: `npm run connect-notion` (creates new connection)
   - Or list connections: `npm run list-connections` (lists all connections)
   - Or get from Alloy Dashboard → Connections
   
   For detailed setup instructions, see [SETUP.md](SETUP.md).

## 📖 Usage

### Step 1: Authentication Flow (OAuth)

Connect Notion using OAuth 2.0 authentication:

#### Option A: Web Interface (Recommended)

1. **Start the server**
   ```bash
   npm run server
   ```

2. **Open the frontend**
   - Navigate to: `http://localhost:3000/connect-notion-frontend.html`
   - Click **"Connect Notion"**
   - Authorize the connection in your browser
   - Copy the **Connection ID** from the success page

3. **Add Connection ID to `.env`**
   ```env
   CONNECTION_ID=your_connection_id_here
   ```

#### Option B: Command Line

```bash
# Initiate OAuth flow via command line
npm run connect-notion
```

#### Option C: List Existing Connections

```bash
# List existing connections (use if you already have a connection)
npm run list-connections
```

### Step 2: Data Synchronization

Once connected, demonstrate read and write operations:

#### Run the Demo

```bash
# Run the complete demo (authentication + read + write)
npm run dev
```

This will:
1. **Authenticate** with Alloy API
2. **Verify Connection** to Notion (tests connection with real API call)
3. **Read** existing pages from Notion
4. **Write** a new page to Notion (with page ID and URL)
5. **Update** an existing page in Notion (using the created page ID)

#### Example Output

```
🚀 Starting Alloy Connectivity API Demo

==================================================
STEP 1: Authentication Flow
==================================================
✓ API Key configured: [REDACTED]
✓ User ID: [REDACTED]
✓ Connection ID: [REDACTED]

STEP 2: Connect to Integration
==================================================
   Testing connection: [REDACTED]
✓ Connection verified and working!
✓ Connection ID: [REDACTED]
✓ API calls are functional

STEP 3: Read Data - Fetch Pages
==================================================
✓ Successfully read 0 page records
   No pages found in your Notion workspace

STEP 4: Write Data - Create New Page
==================================================
✅ Page created successfully!
   Page ID: [REDACTED]
   URL: [REDACTED]

STEP 5: Update Data - Update Existing Page
==================================================
   Using newly created page: [REDACTED]
✅ Page updated successfully!
   Updated page ID: [REDACTED]
   Updated URL: [REDACTED]

   💡 Page ID saved: [REDACTED]
   💡 Page URL: [REDACTED]
```

## 🏗️ Architecture

### Key Components

- **NotionClient** (`src/notion-client.ts`) - Notion-specific client using Connectivity API
- **AlloyOAuthFlow** (`src/oauth-flow.ts`) - OAuth 2.0 flow handler
- **Config** (`src/config.ts`) - Configuration management
- **Demo** (`src/demo.ts`) - Complete working example

See [Developer Guide](docs/developer-guide.md) for architecture details.

## 🔧 API Reference & Examples

For complete API examples and all available scripts, see [EXAMPLES.md](EXAMPLES.md).

**Quick Examples:**
- `npm run dev` - Complete demo (read + write + update)
- `npm run create-page "Title"` - Create a single page
- `npm run easy-example` - Learn helper functions
- `npm run notion-example` - Comprehensive example

### Quick Example

```typescript
import { NotionClient } from './src/notion-client.js';
import { getConfig } from './src/config.js';

const config = getConfig();
const notionClient = new NotionClient(config, process.env.CONNECTION_ID!);

// Search pages
const pages = await notionClient.searchPages(undefined, { value: 'page', property: 'object' });

// Create page
const newPage = await notionClient.createPage({
  parent: { type: 'workspace', workspace: true },
  properties: {
    title: { type: 'title', title: [{ type: 'text', text: { content: 'New Page' } }] },
  },
});
```

## 📋 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ALLOY_API_KEY` | Yes | Your Alloy API key (get from [Alloy Dashboard](https://app.runalloy.com)) |
| `ALLOY_USER_ID` | Yes | Your Alloy user ID (get from [Alloy Dashboard](https://app.runalloy.com)) |
| `CONNECTION_ID` | Yes* | Connection ID after OAuth flow (obtained after connecting Notion) |
| `ALLOY_BASE_URL` | No | API base URL (default: `https://production.runalloy.com`) |
| `ALLOY_ENVIRONMENT` | No | Environment: `development` or `production` (default: `production`) |
| `OAUTH_REDIRECT_URI` | No | Custom OAuth redirect URI (default: `http://localhost:3000/oauth/callback`) |
| `NOTION_INTERNAL_TOKEN` | No | Notion internal integration token (for direct Notion API access) |

\* Required for data operations. Get it after completing the OAuth flow.

**⚠️ Security Note**: Never commit your `.env` file to version control. The `.env` file is already in `.gitignore` and will not be committed.

## 🤖 MCP (Model Context Protocol) Configuration

This project includes MCP server configuration for use with AI assistants like Cursor or Claude Desktop. The `.mcp.json` file configures the Alloy MCP server, which provides access to Alloy's Connectivity API through MCP functions.

### Setting Up MCP in Cursor IDE

1. **Get your MCP server URL** from the Alloy dashboard (Settings → MCP Servers)

2. **Open Cursor Settings:**
   - Press `Ctrl+,` (Windows/Linux) or `Cmd+,` (Mac) to open Settings
   - Navigate to MCP Servers settings

3. **Add the Alloy MCP Server:**
   - Copy the configuration from `.mcp.json` in this project
   - Replace `YOUR_SERVER_ID/YOUR_TOKEN` with your actual MCP server URL
   - The URL format is: `https://mcp-api.runalloy.com/mcp/YOUR_SERVER_ID/YOUR_TOKEN`

4. **Restart Cursor** to load the new MCP configuration

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

**Important Notes:**
- 🔄 **Restart Required**: Restart Cursor after configuring MCP
- ✅ **Verify**: Check that MCP servers are active in Cursor's MCP settings panel
- 📖 **Full Instructions**: See [Developer Guide](docs/developer-guide.md#mcp-model-context-protocol-setup) for detailed setup

### Setting Up MCP in Claude Desktop

1. **Locate Claude Desktop Config:**
   - Mac: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`
   - Linux: `~/.config/Claude/claude_desktop_config.json`

2. **Add the Alloy server configuration:**
   - Open the config file
   - Add the `mcpServers` section from `.mcp.json`
   - Replace environment variable placeholders with actual values

3. **Restart Claude Desktop**

### Environment Variables

- Ensure your `.env` file has `ALLOY_API_KEY` and `ALLOY_USER_ID` set
- For MCP, you can either:
  - Use actual values directly in the MCP config (less secure but simpler)
  - Use environment variable references if your system supports it
  - Set system environment variables that the MCP server can access

### MCP Functions Available

When using the Alloy MCP server, you'll have access to functions like:
- `mcp_alloy_list_connectors_alloy` - List available connectors
- `mcp_alloy_get_credentials_alloy` - Get credentials for a connector
- `mcp_alloy_create_credential_alloy` - Create OAuth credentials
- `mcp_alloy_execute_action_alloy` - Execute actions on connected services
- `mcp_alloy_get_connector_resources_alloy` - List available actions for a connector
- `mcp_alloy_get_action_details_alloy` - Get action parameters and requirements
- And more...

**📖 See [Developer Guide](docs/developer-guide.md#mcp-model-context-protocol-setup) for MCP setup and usage instructions.**

## 🔌 Supported Integrations

This demo focuses on **Notion** integration. Alloy supports 200+ integrations, and you can extend this demo to work with other connectors by following the same patterns.

## 🛠️ Development

### Available Scripts

```bash
# Run main demo (authentication + read + write + update)
npm run dev

# Start development server
npm run server

# Connect Notion via OAuth
npm run connect-notion

# Verify and set working connection (RECOMMENDED)
npm run verify-connection

# List your connections (add "notion" to filter for Notion only)
npm run list-connections

# Show token information
npm run show-tokens [connectionId]

# Build for production
npm run build
```

### Project Structure

```
alloy-connectivity-demo/
├── src/
│   ├── config.ts              # Configuration management
│   ├── oauth-flow.ts          # OAuth flow handler
│   ├── oauth-flow-mcp.ts     # MCP-based OAuth flow helper
│   ├── notion-client.ts       # Notion API client
│   ├── server.ts              # Express server
│   ├── demo.ts                # Main demo
│   ├── connect-notion.ts      # OAuth connection script
│   ├── list-connections.ts    # List connections utility
│   ├── show-tokens.ts         # Token information utility
│   ├── verify-and-set-connection.ts # Connection verification and setup utility
│   ├── connection-utils.ts # Shared connection utility functions
│   └── connect-notion-frontend.html  # Web interface
├── docs/                      # Documentation
├── .env.example              # Environment template
├── .mcp.json                 # MCP server configuration template
├── package.json              # Dependencies
└── README.md                 # This file
```

## 📚 Documentation

- [Setup Guide](SETUP.md) - Setup instructions and troubleshooting
- [Developer Guide](docs/developer-guide.md) - Development overview including MCP setup
- [Examples](EXAMPLES.md) - Complete code examples and usage patterns
- [Endpoint Pattern Summary](docs/endpoint-pattern-summary.md) - API endpoint patterns

## 🐛 Troubleshooting

### Common Issues

**"ALLOY_API_KEY environment variable is required"**
- Make sure you've created a `.env` file from `.env.example`
- Verify your API key is correctly set

**"Connection not yet established"**
- Complete the OAuth flow first (see Step 1 above)
- Add the Connection ID to your `.env` file

**"Authentication failed"**
- Check that your API key is valid
- Verify your User ID is correct
- Ensure you have internet connectivity

**"Could not read pages"**
- Make sure you've completed the OAuth flow
- Verify the Connection ID in your `.env` file
- Ensure you have pages in your Notion workspace

**"Credential not found" or "Invalid Authorization"**
- Verify your API key is correct and has Connectivity API permissions
- Verify your connection: `npm run verify-connection`
- See the [Setup Guide](SETUP.md) for detailed troubleshooting
- Ensure you're using the correct base URL: `https://production.runalloy.com`

**"Connection not found in list, but API calls work"**
- This is normal - some connections may work for API calls even if not in the list
- The connection verification step tests the connection with a real API call
- If API calls work, the connection is valid and functional

## 🔒 Security Best Practices

- ✅ Never commit `.env` files to version control
- ✅ Store API keys in environment variables
- ✅ Use different API keys for development and production
- ✅ Regularly rotate your API keys
- ✅ Implement rate limiting for production applications

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 🔗 Resources

- [Alloy Documentation](https://docs.runalloy.com)
- [Alloy API Reference](https://docs.runalloy.com/api-reference)
- [Alloy Node.js SDK](https://github.com/alloy-automation/alloy-node)
- [Alloy Dashboard](https://app.runalloy.com)

---

**Note**: This is a demonstration project. For production use, implement additional security measures, error handling, logging, and monitoring as appropriate for your use case.
