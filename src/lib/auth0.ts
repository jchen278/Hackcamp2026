import { Auth0Client, filterDefaultIdTokenClaims } from "@auth0/nextjs-auth0/server";
import { decodeJwt } from "jose";

const AUTH0_ROLES_CLAIM = "https://pantrypulse.com/roles";

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

export const auth0 = new Auth0Client({
  async beforeSessionSaved(session, idToken) {
    const user = filterDefaultIdTokenClaims(session.user);
    if (!idToken) {
      const existingRoles = (session.user as Record<string, unknown>)[AUTH0_ROLES_CLAIM];
      if (isStringArray(existingRoles)) {
        return { ...session, user: { ...user, [AUTH0_ROLES_CLAIM]: existingRoles } };
      }
      return { ...session, user };
    }

    try {
      const claims = decodeJwt(idToken);
      const roles = claims[AUTH0_ROLES_CLAIM];
      if (isStringArray(roles)) {
        return { ...session, user: { ...user, [AUTH0_ROLES_CLAIM]: roles } };
      }
    } catch {
      // The SDK has already validated the ID token; keep the standard claims if it cannot be decoded.
    }

    return { ...session, user };
  },
});
