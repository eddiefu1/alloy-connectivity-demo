#!/bin/bash
# Setup MCP Configuration for Cursor IDE (Mac/Linux)
# This script helps you set up the Alloy MCP server in Cursor

echo "🔧 Setting up MCP configuration for Cursor IDE..."

# Detect OS and set config path
if [[ "$OSTYPE" == "darwin"* ]]; then
    CONFIG_PATH="$HOME/Library/Application Support/Cursor/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    CONFIG_PATH="$HOME/.config/Cursor/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json"
else
    echo "❌ Unsupported OS: $OSTYPE"
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  Warning: .env file not found!"
    echo "   Please create a .env file with ALLOY_API_KEY and ALLOY_USER_ID"
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Load environment variables from .env if it exists
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Get API key and User ID
API_KEY="${ALLOY_API_KEY}"
USER_ID="${ALLOY_USER_ID}"

if [ -z "$API_KEY" ]; then
    echo "❌ ALLOY_API_KEY not found in environment"
    echo "   Please set it in your .env file or as a system environment variable"
    exit 1
fi

if [ -z "$USER_ID" ]; then
    echo "❌ ALLOY_USER_ID not found in environment"
    echo "   Please set it in your .env file or as a system environment variable"
    exit 1
fi

# Create directory if it doesn't exist
CONFIG_DIR=$(dirname "$CONFIG_PATH")
mkdir -p "$CONFIG_DIR"

# Read existing config or create new one
if [ -f "$CONFIG_PATH" ]; then
    echo "📖 Reading existing MCP config..."
    CONFIG=$(cat "$CONFIG_PATH")
else
    CONFIG='{"mcpServers":{}}'
fi

# Add or update Alloy MCP server config using jq if available, otherwise use sed
if command -v jq &> /dev/null; then
    echo "💾 Writing MCP configuration using jq..."
    echo "$CONFIG" | jq --arg api_key "$API_KEY" --arg user_id "$USER_ID" \
        '.mcpServers.alloy = {
            command: "npx",
            args: ["-y", "@runalloy/mcp-server-alloy"],
            env: {
                ALLOY_API_KEY: $api_key,
                ALLOY_USER_ID: $user_id
            }
        }' > "$CONFIG_PATH"
else
    echo "⚠️  jq not found. Creating config manually..."
    cat > "$CONFIG_PATH" <<EOF
{
  "mcpServers": {
    "alloy": {
      "command": "npx",
      "args": ["-y", "@runalloy/mcp-server-alloy"],
      "env": {
        "ALLOY_API_KEY": "$API_KEY",
        "ALLOY_USER_ID": "$USER_ID"
      }
    }
  }
}
EOF
fi

echo ""
echo "✅ MCP configuration set up successfully!"
echo ""
echo "📋 Next steps:"
echo "   1. Restart Cursor IDE"
echo "   2. Verify MCP servers are active in Cursor Settings"
echo "   3. You can now use MCP functions like:"
echo "      - mcp_alloy_list_connectors_alloy"
echo "      - mcp_alloy_get_credentials_alloy"
echo "      - mcp_alloy_create_credential_alloy"
echo "      - mcp_alloy_execute_action_alloy"
echo ""
echo "⚠️  Security Note: The config file contains your API key."
echo "   Make sure it's not committed to git!"

