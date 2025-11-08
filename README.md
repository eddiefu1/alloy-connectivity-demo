# Alloy Connectivity API Demo

A practical demonstration of Alloy's Connectivity API for iPaaS (Integration Platform as a Service) automation. This demo showcases real-world integration patterns including authentication flows and bidirectional data synchronization with CRM systems.

## 🎯 Features

This demo demonstrates:

- ✅ **Authentication Flow**: User authentication with Alloy's API using API keys
- ✅ **Read Operations**: Fetching contact data from connected CRM systems
- ✅ **Write Operations**: Creating new contacts in connected CRM systems
- ✅ **Update Operations**: Modifying existing contact records
- ✅ **Connection Management**: Checking integration connection status
- ✅ **Error Handling**: Robust error handling and logging

## 🏗️ Architecture

The application is structured into three main components:

```
src/
├── config.ts         # Configuration management and environment variables
├── alloy-client.ts   # Alloy API client wrapper with all CRUD operations
└── demo.ts          # Main demo orchestration showing real-world usage
```

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ and npm
- An Alloy account ([Sign up at runalloy.com](https://runalloy.com))
- API credentials from your Alloy dashboard

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
   INTEGRATION_ID=salesforce
   ```

   To get your credentials:
   - Log in to [Alloy Dashboard](https://app.runalloy.com)
   - Navigate to Settings → API Keys
   - Copy your API Key and User ID

### Running the Demo

**Development mode (with TypeScript):**
```bash
npm run dev
```

**Production mode (compile first):**
```bash
npm run build
npm start
```

## 📖 Usage

### Understanding the Demo Flow

The demo executes the following steps:

1. **Authentication**: Authenticates the user with Alloy API
2. **Connection Status**: Checks if the integration is properly connected
3. **List Integrations**: Shows available integrations (Salesforce, HubSpot, etc.)
4. **Read Data**: Fetches existing contacts from the CRM
5. **Write Data**: Creates a new contact in the CRM
6. **Update Data**: Updates an existing contact's information

### Example Output

```
🚀 Starting Alloy Connectivity API Demo

==================================================
STEP 1: Authentication Flow
==================================================
Authenticating user user_123 for integration salesforce...
✓ User authenticated successfully

==================================================
STEP 4: Read Data - Fetch Contacts
==================================================
📖 Reading contacts from integration salesforce...
✓ Successfully read 42 contacts records

==================================================
STEP 5: Write Data - Create New Contact
==================================================
✍️  Writing contacts to integration salesforce...
Data to write: {
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "phone": "+1-555-0123",
  "company": "Acme Corp"
}
✓ Successfully wrote contacts record
✅ Contact created successfully!
```

## 🔧 API Reference

### AlloyClient Class

The `AlloyClient` class provides a clean interface for interacting with Alloy's API:

```typescript
const client = new AlloyClient(config);

// Authenticate user
await client.authenticateUser(integrationId);

// Read data
const contacts = await client.readData(userId, integrationId, 'contacts');

// Write data
await client.writeData(userId, integrationId, 'contacts', contactData);

// Update data
await client.updateData(userId, integrationId, 'contacts', recordId, updates);

// Check connection status
await client.getConnectionStatus(userId, integrationId);
```

### Configuration

All configuration is managed through environment variables:

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `ALLOY_API_KEY` | Yes | Your Alloy API key | - |
| `ALLOY_USER_ID` | Yes | Your Alloy user ID | - |
| `ALLOY_BASE_URL` | No | Alloy API base URL | `https://api.runalloy.com` |
| `INTEGRATION_ID` | No | Integration to use | `salesforce` |
| `SAMPLE_RECORD_ID` | No | Record ID for updates | - |

## 🔌 Supported Integrations

Alloy supports 200+ integrations including:

- **CRM**: Salesforce, HubSpot, Pipedrive, Zoho CRM
- **Marketing**: Mailchimp, SendGrid, Klaviyo
- **E-commerce**: Shopify, WooCommerce, BigCommerce
- **Support**: Zendesk, Intercom, Freshdesk
- And many more!

## 📝 Real-World Use Cases

This demo can be adapted for various real-world scenarios:

1. **CRM Synchronization**: Keep contact data in sync across multiple CRMs
2. **Lead Management**: Automatically create leads in your CRM from web forms
3. **Customer Data Platform**: Aggregate customer data from multiple sources
4. **Marketing Automation**: Sync contacts between CRM and email marketing tools
5. **Support Ticket Integration**: Link support tickets with CRM contacts

## 🏗️ Project Structure

```
alloy-connectivity-demo/
├── src/
│   ├── config.ts           # Configuration and environment management
│   ├── alloy-client.ts     # Alloy API wrapper with all operations
│   └── demo.ts            # Main demo application
├── .env.example           # Environment variable template
├── .gitignore            # Git ignore rules
├── package.json          # Project dependencies and scripts
├── tsconfig.json         # TypeScript configuration
└── README.md            # This file
```

## 🛠️ Development

### Building

Compile TypeScript to JavaScript:
```bash
npm run build
```

Output will be in the `dist/` directory.

### Code Structure

- **config.ts**: Manages environment variables and validates configuration
- **alloy-client.ts**: Encapsulates all Alloy API interactions
- **demo.ts**: Orchestrates the demo workflow and provides examples

## 🔒 Security Best Practices

- Never commit `.env` files to version control
- Store API keys in environment variables or secure vault services
- Use different API keys for development and production
- Regularly rotate your API keys
- Implement rate limiting for production applications

## 🐛 Troubleshooting

### Common Issues

**"ALLOY_API_KEY environment variable is required"**
- Make sure you've created a `.env` file from `.env.example`
- Verify your API key is correctly set in `.env`

**"Authentication failed"**
- Check that your API key is valid and not expired
- Verify your User ID is correct
- Ensure you have internet connectivity

**"Could not read contacts"**
- Make sure you've set up at least one integration in the Alloy dashboard
- Verify the integration is properly authenticated
- Check that the integration ID matches your setup

**"Connection not yet established"**
- You need to authenticate the integration in the Alloy dashboard first
- Navigate to Integrations → [Your Integration] → Connect
- Follow the OAuth flow to grant access

## 📚 Resources

- [Alloy Documentation](https://docs.runalloy.com)
- [Alloy API Reference](https://docs.runalloy.com/api-reference)
- [Alloy Node.js SDK](https://github.com/alloy-automation/alloy-node)
- [Alloy Dashboard](https://app.runalloy.com)

## 🤝 Contributing

Contributions are welcome! Feel free to:

- Report bugs
- Suggest new features
- Submit pull requests
- Improve documentation

## 📄 License

This project is licensed under the MIT License.

## 👤 Author

Created as a demonstration of Alloy's Connectivity API capabilities.

---

**Note**: This is a demo application. For production use, implement additional security measures, error handling, logging, and monitoring as appropriate for your use case.