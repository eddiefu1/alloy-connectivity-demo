import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export interface Config {
  alloyApiKey: string;
  alloyUserId: string;
  alloyBaseUrl: string;
  environment: 'development' | 'production';
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

  return {
    alloyApiKey: apiKey,
    alloyUserId: userId,
    alloyBaseUrl: baseUrl,
    environment: environment,
  };
}
