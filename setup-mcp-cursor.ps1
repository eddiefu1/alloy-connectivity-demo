# Setup MCP Configuration for Cursor IDE (Windows PowerShell)
# This script helps you set up the Alloy MCP server in Cursor

Write-Host "🔧 Setting up MCP configuration for Cursor IDE..." -ForegroundColor Cyan

# Check if .env file exists
if (-not (Test-Path .env)) {
    Write-Host "⚠️  Warning: .env file not found!" -ForegroundColor Yellow
    Write-Host "   Please create a .env file with ALLOY_API_KEY and ALLOY_USER_ID" -ForegroundColor Yellow
    Write-Host ""
    $continue = Read-Host "Continue anyway? (y/n)"
    if ($continue -ne "y") {
        exit 1
    }
}

# Load environment variables from .env if it exists
if (Test-Path .env) {
    Get-Content .env | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]*)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
}

# Get API key and User ID
$apiKey = $env:ALLOY_API_KEY
$userId = $env:ALLOY_USER_ID

if (-not $apiKey) {
    Write-Host "❌ ALLOY_API_KEY not found in environment" -ForegroundColor Red
    Write-Host "   Please set it in your .env file or as a system environment variable" -ForegroundColor Yellow
    exit 1
}

if (-not $userId) {
    Write-Host "❌ ALLOY_USER_ID not found in environment" -ForegroundColor Red
    Write-Host "   Please set it in your .env file or as a system environment variable" -ForegroundColor Yellow
    exit 1
}

# Cursor MCP config path
$cursorConfigPath = "$env:APPDATA\Cursor\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json"
$configDir = Split-Path -Parent $cursorConfigPath

# Create directory if it doesn't exist
if (-not (Test-Path $configDir)) {
    Write-Host "📁 Creating config directory: $configDir" -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $configDir -Force | Out-Null
}

# Read existing config or create new one
$config = @{}
if (Test-Path $cursorConfigPath) {
    Write-Host "📖 Reading existing MCP config..." -ForegroundColor Cyan
    try {
        $existingConfig = Get-Content $cursorConfigPath -Raw | ConvertFrom-Json
        if ($existingConfig.mcpServers) {
            $config.mcpServers = $existingConfig.mcpServers
        }
    } catch {
        Write-Host "⚠️  Could not parse existing config, creating new one" -ForegroundColor Yellow
    }
}

# Add or update Alloy MCP server config
if (-not $config.mcpServers) {
    $config.mcpServers = @{}
}

$config.mcpServers.alloy = @{
    command = "npx"
    args = @("-y", "@runalloy/mcp-server-alloy")
    env = @{
        ALLOY_API_KEY = $apiKey
        ALLOY_USER_ID = $userId
    }
}

# Write config file
Write-Host "💾 Writing MCP configuration to: $cursorConfigPath" -ForegroundColor Cyan
$config | ConvertTo-Json -Depth 10 | Set-Content $cursorConfigPath -Encoding UTF8

Write-Host ""
Write-Host "✅ MCP configuration set up successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Restart Cursor IDE" -ForegroundColor White
Write-Host "   2. Verify MCP servers are active in Cursor Settings" -ForegroundColor White
Write-Host "   3. You can now use MCP functions like:" -ForegroundColor White
Write-Host "      - mcp_alloy_list_connectors_alloy" -ForegroundColor Gray
Write-Host "      - mcp_alloy_get_credentials_alloy" -ForegroundColor Gray
Write-Host "      - mcp_alloy_create_credential_alloy" -ForegroundColor Gray
Write-Host "      - mcp_alloy_execute_action_alloy" -ForegroundColor Gray
Write-Host ""
Write-Host "⚠️  Security Note: The config file contains your API key." -ForegroundColor Yellow
Write-Host "   Make sure it's not committed to git!" -ForegroundColor Yellow

