import "server-only";

interface ManagementTokenResponse {
  access_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
  message?: string;
}

interface Auth0UserResponse {
  app_metadata?: Record<string, unknown>;
  message?: string;
}

let cachedAccessToken: string | null = null;
let cachedAccessTokenExpiresAt = 0;

function getAuth0BaseUrl() {
  const configuredDomain =
    process.env.AUTH0_ISSUER_BASE_URL ||
    (process.env.AUTH0_DOMAIN
      ? `https://${process.env.AUTH0_DOMAIN}`
      : undefined);

  if (!configuredDomain) {
    throw new Error("Auth0 domain is not configured.");
  }

  try {
    return new URL(configuredDomain).origin;
  } catch {
    throw new Error("Auth0 domain must be a valid URL.");
  }
}

async function getManagementApiToken() {
  if (cachedAccessToken && Date.now() < cachedAccessTokenExpiresAt) {
    return cachedAccessToken;
  }

  const clientId = process.env.AUTH0_CLIENT_ID;
  const clientSecret = process.env.AUTH0_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Auth0 Management API client credentials are not configured.");
  }

  const baseUrl = getAuth0BaseUrl();
  const tokenResponse = await fetch(`${baseUrl}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      audience: `${baseUrl}/api/v2/`,
      grant_type: "client_credentials",
    }),
    cache: "no-store",
  });
  const tokenData = (await tokenResponse.json()) as ManagementTokenResponse;

  if (!tokenResponse.ok || !tokenData.access_token) {
    throw new Error(
      `Auth0 Management API token request failed: ${tokenData.error_description || tokenData.message || tokenData.error || tokenResponse.statusText}`,
    );
  }

  cachedAccessToken = tokenData.access_token;
  cachedAccessTokenExpiresAt =
    Date.now() + Math.max(0, (tokenData.expires_in ?? 60) - 60) * 1000;
  return cachedAccessToken;
}

async function auth0UserRequest(
  userId: string,
  init: RequestInit,
): Promise<Response> {
  if (!userId.trim()) {
    throw new Error("Auth0 user ID is required.");
  }

  const token = await getManagementApiToken();
  const baseUrl = getAuth0BaseUrl();
  return fetch(
    `${baseUrl}/api/v2/users/${encodeURIComponent(userId)}`,
    {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...init.headers,
      },
      cache: "no-store",
    },
  );
}

export async function getUserPoints(userId: string): Promise<number> {
  const response = await auth0UserRequest(userId, { method: "GET" });
  const userData = (await response.json()) as Auth0UserResponse;

  if (!response.ok) {
    throw new Error(
      `Failed to read Auth0 user app_metadata: ${userData.message || response.statusText}`,
    );
  }

  const points = userData.app_metadata?.pantrypulse_points;
  return typeof points === "number" && Number.isSafeInteger(points) && points >= 0
    ? points
    : 0;
}

export async function updateUserPoints(
  userId: string,
  newPoints: number,
): Promise<void> {
  if (!Number.isSafeInteger(newPoints) || newPoints < 0) {
    throw new Error("SpreadTheLoaf points must be a non-negative integer.");
  }

  const response = await auth0UserRequest(userId, {
    method: "PATCH",
    body: JSON.stringify({
      app_metadata: {
        pantrypulse_points: newPoints,
      },
    }),
  });

  if (!response.ok) {
    const errorData = (await response.json()) as Auth0UserResponse;
    throw new Error(
      `Failed to update Auth0 app_metadata: ${errorData.message || response.statusText}`,
    );
  }
}
