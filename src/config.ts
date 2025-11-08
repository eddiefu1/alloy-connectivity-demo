import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export interface Config {
  alloyApiKey: string;
  alloyUserId: string;
  alloyBaseUrl: string;
}

export function getConfig(): Config {
  const apiKey = process.env.ALLOY_API_KEY;
  const userId = process.env.ALLOY_USER_ID;
  const baseUrl = process.env.ALLOY_BASE_URL || 'https://api.runalloy.com';

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
  };
}
