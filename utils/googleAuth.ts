import { GoogleAuth } from 'google-auth-library';

// Cache for access tokens to avoid repeated authentication
const tokenCache = {
  token: null as string | null,
  expires: 0
};

const TOKEN_CACHE_DURATION = 50 * 60 * 1000; // 50 minutes (tokens usually expire in 60 minutes)

/**
 * Get authenticated Google API access token with caching
 * @returns Promise<string> - Access token
 * @throws Error if authentication fails
 */
export async function getGoogleAccessToken(): Promise<string> {
  // Check if we have a valid cached token
  if (tokenCache.token && Date.now() < tokenCache.expires) {
    return tokenCache.token;
  }

  try {
    const auth = new GoogleAuth({
      keyFile: `./${process.env.GCP_KEY_FILE}`,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();

    if (!accessToken.token) {
      throw new Error('Failed to get access token from service account');
    }

    // Cache the token
    tokenCache.token = accessToken.token;
    tokenCache.expires = Date.now() + TOKEN_CACHE_DURATION;

    return accessToken.token;
  } catch (error) {
    // Clear cache on error
    tokenCache.token = null;
    tokenCache.expires = 0;
    
    throw new Error(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Clear the cached access token (useful for testing or when token expires)
 */
export function clearTokenCache(): void {
  tokenCache.token = null;
  tokenCache.expires = 0;
}

/**
 * Check if we have a valid cached token
 */
export function hasValidToken(): boolean {
  return tokenCache.token !== null && Date.now() < tokenCache.expires;
}