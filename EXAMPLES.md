# Examples - Alloy Connectivity API Demo

This document lists all available examples and scripts you can run with this demo.

## 🚀 Quick Start Examples

### 1. Complete Demo (Recommended First Run)
**Command:** `npm run dev` or `npm start`

**What it does:**
- Authenticates with Alloy API
- Verifies connection to Notion
- Reads existing pages from Notion
- Creates a new page in Notion
- Updates the newly created page

**Best for:** Seeing the full workflow in action

---

### 2. Create a Single Page
**Command:** `npm run create-page "Your Page Title"`

**What it does:**
- Creates a single Notion page with your specified title
- Shows the page ID and URL

**Examples:**
```bash
npm run create-page "Meeting Notes"
npm run create-page "Project Planning"
npm run create-page                    # Uses default title "New Page"
```

**Best for:** Quick page creation

---

### 3. Quick Write & Update
**Command:** `npm run write-update`

**What it does:**
- Creates a new page with timestamp in title
- Updates the page title immediately after creation
- Demonstrates write + update workflow

**Best for:** Testing create and update operations together

---

### 4. Easy Helper Functions Example
**Command:** `npm run easy-example`

**What it does:**
- Demonstrates simplified helper functions from `notion-helpers.ts`
- Shows `createSimplePage()`, `updatePageTitle()`, `createPageSimple()`
- Uses `NotionProps` helper for cleaner code
- Creates multiple pages with different methods

**Best for:** Learning the easier way to work with Notion API

---

### 5. Comprehensive Read/Write/Update Example
**Command:** `npm run notion-example`

**What it does:**
- Searches and reads pages from Notion
- Creates a new page with detailed properties
- Updates page properties
- Demonstrates database querying (if databases exist)
- Shows comprehensive error handling

**Best for:** Full-featured example with all operations

---

## 🔧 Utility Scripts

### 6. Connect Notion (OAuth Flow)
**Command:** `npm run connect-notion`

**What it does:**
- Initiates OAuth flow for Notion
- Opens browser for authorization
- Creates a new connection
- Returns Connection ID for your `.env` file

**Best for:** Setting up your first connection or creating new connections

---

### 7. List All Connections
**Command:** `npm run list-connections [connectorId]`

**What it does:**
- Lists all your Alloy connections
- Optionally filter by connector (e.g., `npm run list-connections notion`)
- Shows connection IDs, types, and creation dates

**Examples:**
```bash
npm run list-connections              # List all connections
npm run list-connections notion       # List only Notion connections
```

**Best for:** Finding existing connection IDs

---

### 8. Verify and Set Connection
**Command:** `npm run verify-connection`

**What it does:**
- Tests all your Notion connections
- Finds working connections
- Updates your `.env` file with a working Connection ID
- Verifies API calls work

**Best for:** Troubleshooting connection issues or finding a working connection

---

### 9. Show Token Information
**Command:** `npm run show-tokens [connectionId]`

**What it does:**
- Shows token information for a connection
- Displays connection details and status
- Useful for debugging authentication issues

**Examples:**
```bash
npm run show-tokens                    # Shows tokens for CONNECTION_ID from .env
npm run show-tokens 6911017b4d2bcbfd4ce727fe  # Shows tokens for specific connection
```

**Best for:** Debugging authentication or token issues

---

## 🌐 Server Examples

### 10. Start Development Server
**Command:** `npm run server`

**What it does:**
- Starts Express server on `http://localhost:3000`
- Provides web interface for connecting Notion
- Offers REST API endpoints for OAuth and connection management
- Includes diagnostic endpoints

**Endpoints:**
- `GET /` - Server info
- `GET /connect-notion-frontend.html` - Web UI for connecting Notion
- `POST /api/oauth/initiate` - Initiate OAuth flow
- `GET /oauth/callback` - OAuth callback handler
- `GET /api/connections` - List connections
- `GET /api/connections/:id` - Get connection details

**Best for:** Web-based OAuth flow or API testing

---

## 📋 Example Comparison

| Example | Read | Write | Update | OAuth | Best For |
|---------|------|-------|--------|-------|----------|
| `npm run dev` | ✅ | ✅ | ✅ | ✅ | Complete demo |
| `npm run create-page` | ❌ | ✅ | ❌ | ❌ | Quick page creation |
| `npm run write-update` | ❌ | ✅ | ✅ | ❌ | Write + update |
| `npm run easy-example` | ❌ | ✅ | ✅ | ❌ | Learning helpers |
| `npm run notion-example` | ✅ | ✅ | ✅ | ❌ | Full operations |
| `npm run connect-notion` | ❌ | ❌ | ❌ | ✅ | OAuth setup |
| `npm run list-connections` | ✅ | ❌ | ❌ | ❌ | Connection management |
| `npm run verify-connection` | ✅ | ❌ | ❌ | ❌ | Troubleshooting |
| `npm run show-tokens` | ✅ | ❌ | ❌ | ❌ | Debugging |
| `npm run server` | ✅ | ✅ | ✅ | ✅ | Web interface |

---

## 🎯 Recommended Learning Path

1. **Start Here:** `npm run dev` - See everything working
2. **Create Pages:** `npm run create-page "Test Page"` - Simple creation
3. **Learn Helpers:** `npm run easy-example` - See easier methods
4. **Full Example:** `npm run notion-example` - Comprehensive operations
5. **Web Interface:** `npm run server` - Try the web UI

---

## 📝 Prerequisites

All examples require:
- ✅ Node.js 18+ installed
- ✅ `.env` file configured with:
  - `ALLOY_API_KEY`
  - `ALLOY_USER_ID`
  - `CONNECTION_ID` (for data operations)

**Get Connection ID:**
```bash
npm run connect-notion        # Create new connection
npm run list-connections      # Find existing connection
npm run verify-connection     # Auto-find and set working connection
```

---

## 💡 Tips

- **First time?** Run `npm run verify-connection` to ensure everything is set up correctly
- **No connection?** Run `npm run connect-notion` to create one
- **Want to see code?** Check `src/demo.ts` for the main example
- **Need help?** See [SETUP.md](SETUP.md) for troubleshooting

---

## 🔗 Related Documentation

- [Setup Guide](SETUP.md) - Initial setup and configuration
- [Developer Guide](docs/developer-guide.md) - Architecture and development details
- [Endpoint Pattern Summary](docs/endpoint-pattern-summary.md) - API endpoint details

