import { GoogleAuth } from "google-auth-library";

// Cache for access tokens to avoid repeated authentication
const tokenCache = {
  token: null as string | null,
  expires: 0,
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
    let auth: GoogleAuth;

    // Check if we have environment credentials (for production deployment)
    if (
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
      process.env.GOOGLE_PRIVATE_KEY
    ) {
      // Use environment variables for production (recommended for Vercel)
      auth = new GoogleAuth({
        credentials: {
          client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
          private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        },
        scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
      });
    } else if (process.env.GCP_SERVICE_ACCOUNT_SECRET_JSON) {
      // Use JSON credentials directly from environment variable
      try {
        // Handle escaped JSON string - try multiple strategies
        let jsonString = process.env.GCP_SERVICE_ACCOUNT_SECRET_JSON;

        JSON.parse(jsonString);

        const credentials = JSON.parse(jsonString);

        auth = new GoogleAuth({
          credentials: credentials,
          scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
        });
      } catch (parseError) {
        console.error("[googleAuth] JSON parsing error:", parseError);
        if (parseError instanceof SyntaxError) {
          throw new Error(
            `Invalid GCP_SERVICE_ACCOUNT_SECRET_JSON format. JSON syntax error: ${parseError.message}`
          );
        } else if (parseError instanceof Error) {
          throw new Error(
            `GCP credentials validation failed: ${parseError.message}`
          );
        } else {
          throw new Error(
            `GCP credentials validation failed: ${String(parseError)}`
          );
        }
      }
    } else if (process.env.GCP_KEY_FILE) {
      // Use key file for local development
      auth = new GoogleAuth({
        keyFile: `./${process.env.GCP_KEY_FILE}`,
        scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
      });
    } else {
      throw new Error(
        "No Google Cloud credentials configured. Set either GOOGLE_SERVICE_ACCOUNT_EMAIL/GOOGLE_PRIVATE_KEY, GCP_SERVICE_ACCOUNT_SECRET_JSON, or GCP_KEY_FILE"
      );
    }

    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();

    if (!accessToken.token) {
      throw new Error("Failed to get access token from service account");
    }

    // Cache the token
    tokenCache.token = accessToken.token;
    tokenCache.expires = Date.now() + TOKEN_CACHE_DURATION;

    return accessToken.token;
  } catch (error) {
    // Clear cache on error
    tokenCache.token = null;
    tokenCache.expires = 0;

    throw new Error(
      `Authentication failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
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
