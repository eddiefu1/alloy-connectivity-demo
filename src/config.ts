import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export interface Config {
  alloyApiKey: string;
  alloyUserId: string;
  alloyBaseUrl: string;
  environment: 'development' | 'production';
  oauthRedirectUri?: string;
  notionInternalToken?: string;
}

/**
 * Get configuration from environment variables
 * Supports both development and production environments
 * 
 * Environment variables:
 * - ALLOY_API_KEY: Your Alloy API key (required)
 * - ALLOY_USER_ID: Your Alloy user ID (required)
 * - ALLOY_ENVIRONMENT: 'development' or 'production' (optional, defaults to production)
 * - ALLOY_BASE_URL: Custom base URL (optional, auto-detected based on environment)
 * - OAUTH_REDIRECT_URI: Custom OAuth redirect URI (optional, defaults to http://localhost:3000/oauth/callback for development)
 * - NOTION_INTERNAL_TOKEN: Notion internal integration token (optional, for direct Notion API access)
 */
export function getConfig(): Config {
  const apiKey = process.env.ALLOY_API_KEY;
  const userId = process.env.ALLOY_USER_ID;
  const environment = (process.env.ALLOY_ENVIRONMENT || 'production') as 'development' | 'production';
  
  // Determine base URL based on environment
  // Development and production use the same base URL (production.runalloy.com)
  // The difference is in the API key used
  let baseUrl = process.env.ALLOY_BASE_URL;
  if (!baseUrl) {
    // Default to production API URL
    // Both dev and prod API keys work with production.runalloy.com
    baseUrl = 'https://production.runalloy.com';
  }

  if (!apiKey) {
    throw new Error('ALLOY_API_KEY environment variable is required');
  }

  if (!userId) {
    throw new Error('ALLOY_USER_ID environment variable is required');
  }

  // Get OAuth redirect URI from environment (optional)
  const oauthRedirectUri = process.env.OAUTH_REDIRECT_URI;

  // Get Notion internal token from environment (optional)
  const notionInternalToken = process.env.NOTION_INTERNAL_TOKEN;

  return {
    alloyApiKey: apiKey,
    alloyUserId: userId,
    alloyBaseUrl: baseUrl,
    environment: environment,
    oauthRedirectUri: oauthRedirectUri,
    notionInternalToken: notionInternalToken,
  };
}
