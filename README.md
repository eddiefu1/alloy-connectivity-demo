# Alloy Connectivity API Demo

A complete demonstration of Alloy's Connectivity API showcasing **OAuth authentication flows** and **data synchronization (read and write operations)** with Notion. This project uses both the **REST API** and **Node.js SDK** to interact with Alloy's Connectivity API.

## 🎯 Requirements Met

This demo fulfills all requirements:

- ✅ **Uses Alloy Connectivity API**: Demonstrates both REST API and Node.js SDK implementations
- ✅ **Authentication Flow**: Complete OAuth 2.0 flow for connecting Notion
- ✅ **Data Sync**: Full read and write operations to demonstrate data synchronization
- ✅ **GitHub Ready**: Complete setup instructions and documentation

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
   ```env
   ALLOY_API_KEY=your_api_key_here
   ALLOY_USER_ID=your_user_id_here
   ALLOY_BASE_URL=https://api.runalloy.com
   ```

   **Get your credentials:**
   - Log in to [Alloy Dashboard](https://app.runalloy.com)
   - Go to **Settings → API Keys**
   - Copy your **API Key** and **User ID**

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

#### Option C: Programmatic (API)

```bash
# Test OAuth flow programmatically
npm run test-oauth
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
2. **Read** existing pages from Notion
3. **Write** a new page to Notion
4. **Update** an existing page in Notion

#### Example Output

```
🚀 Starting Alloy Connectivity API Demo

==================================================
STEP 1: Authentication Flow
==================================================
Authenticating user 690674c276dcda35a40b242d...
✓ User authenticated successfully

==================================================
STEP 3: Read Data - Fetch Pages
==================================================
📖 Reading pages from integration notion...
✓ Successfully read 42 page records

==================================================
STEP 4: Write Data - Create New Page
==================================================
✍️  Creating new page in Notion...
Data to write: {
  "title": "Project Planning",
  "content": "This is a new page created via Alloy API",
  "author": "John Doe",
  "tags": ["project", "planning"],
  "status": "active"
}
✓ Successfully created page
✅ Page created successfully!
```

## 🏗️ Architecture

### Components

```
src/
├── config.ts              # Configuration management
├── alloy-client.ts        # Node.js SDK client wrapper
├── rest-api-example.ts    # REST API implementation
├── oauth-flow.ts          # OAuth 2.0 flow handler
├── server.ts              # Express server with API endpoints
└── demo.ts                # Main demo orchestration
```

### API Endpoints

The server provides the following endpoints:

- `GET /api/health` - Health check
- `GET /api/config/check` - Configuration status
- `POST /api/oauth/initiate` - Initiate OAuth flow
- `GET /oauth/callback` - OAuth callback handler
- `GET /api/connectors` - List available connectors
- `POST /api/alloy/token` - Generate JWT token (optional)

## 🔧 API Reference

### Using the Node.js SDK

```typescript
import { AlloyClient } from './src/alloy-client.js';
import { getConfig } from './src/config.js';

const config = getConfig();
const client = new AlloyClient(config);

// Authenticate user
await client.authenticateUser(config.alloyUserId);

// Read pages from Notion
const pages = await client.readPages();

// Create a new page
await client.createPage({
  title: 'New Page',
  content: 'Page content',
});

// Update an existing page
await client.updatePage(pageId, {
  title: 'Updated Title',
});
```

### Using the REST API

```typescript
import { AlloyRestClient } from './src/rest-api-example.js';
import { getConfig } from './src/config.js';

const config = getConfig();
const client = new AlloyRestClient(
  config.alloyApiKey,
  config.alloyBaseUrl,
  config.alloyUserId
);

// Read data
const pages = await client.readData(
  config.alloyUserId,
  'notion',
  'pages'
);

// Create data
await client.createData(
  config.alloyUserId,
  'notion',
  'pages',
  { title: 'New Page', content: 'Content' }
);

// Update data
await client.updateData(
  config.alloyUserId,
  'notion',
  'pages',
  pageId,
  { title: 'Updated Title' }
);
```

### OAuth Flow

```typescript
import { AlloyOAuthFlow } from './src/oauth-flow.js';

const oauthFlow = new AlloyOAuthFlow();

// Initiate OAuth flow
const { oauthUrl } = await oauthFlow.initiateOAuthFlow(
  'notion',
  'http://localhost:3000/oauth/callback'
);

// Redirect user to oauthUrl
// After authorization, handle callback
const { connectionId } = await oauthFlow.handleOAuthCallback(
  'notion',
  code,
  state
);
```

## 📋 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ALLOY_API_KEY` | Yes | Your Alloy API key |
| `ALLOY_USER_ID` | Yes | Your Alloy user ID |
| `CONNECTION_ID` | Yes* | Connection ID after OAuth flow |
| `ALLOY_BASE_URL` | No | API base URL (default: `https://api.runalloy.com`) |

\* Required for data operations. Get it after completing the OAuth flow.

## 🔌 Supported Integrations

This demo uses **Notion** as an example, but Alloy supports **200+ integrations**:

- **Productivity**: Notion, Airtable, Google Workspace
- **CRM**: Salesforce, HubSpot, Pipedrive
- **Marketing**: Mailchimp, SendGrid, Klaviyo
- **E-commerce**: Shopify, WooCommerce, BigCommerce
- And many more!

## 🛠️ Development

### Available Scripts

```bash
# Start development server
npm run server

# Run main demo
npm run dev

# Connect Notion via OAuth
npm run connect-notion

# List available connectors
npm run list-connectors

# List your connections
npm run list-connections

# Test OAuth flow
npm run test-oauth

# Build for production
npm run build
```

### Project Structure

```
alloy-connectivity-demo/
├── src/
│   ├── config.ts              # Configuration management
│   ├── alloy-client.ts        # SDK client wrapper
│   ├── rest-api-example.ts    # REST API client
│   ├── oauth-flow.ts          # OAuth flow handler
│   ├── server.ts              # Express server
│   ├── demo.ts                # Main demo
│   └── connect-notion-frontend.html  # Web interface
├── docs/                      # Documentation
├── .env.example              # Environment template
├── package.json              # Dependencies
└── README.md                 # This file
```

## 📚 Documentation

- [Backend Server Guide](docs/backend-server-guide.md) - Server setup and API endpoints
- [OAuth Flow Guide](docs/oauth-flow-guide.md) - Complete OAuth implementation
- [Getting Connection ID](docs/getting-connection-id.md) - How to get connection IDs
- [Troubleshooting](docs/troubleshooting.md) - Common issues and solutions

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
