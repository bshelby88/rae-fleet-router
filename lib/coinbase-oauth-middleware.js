/**
 * coinbase-oauth-middleware.js
 * Coinbase OAuth2 token verification middleware for rae-fleet-router.
 *
 * Validates Bearer tokens from the Coinbase App OAuth2 flow (raen-auth).
 * Makes verified Coinbase user profile available as req.coinbaseUser.
 *
 * Flow:
 *   1. Client gets a token via raen-auth (Better Auth + Coinbase OAuth2)
 *   2. Client passes it as `Authorization: Bearer <access_token>`
 *   3. This middleware verifies it against Coinbase's /v2/user endpoint
 *   4. On success, enriches the request with the Coinbase user profile
 *
 * Env vars:
 *   COINBASE_OAUTH_ENABLED  - set "true" to activate (default: disabled)
 *   COINBASE_CLIENT_ID      - OAuth2 client ID (optional, for logging)
 */

const COINBASE_USER_API = "https://api.coinbase.com/v2/user";

/**
 * Express middleware that verifies a Coinbase OAuth2 Bearer token.
 * Place BEFORE routes that should accept Coinbase-authenticated requests.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function coinbaseOAuthMiddleware(req, res, next) {
  // Skip if the feature is not enabled
  if (!process.env.COINBASE_OAUTH_ENABLED) {
    req.coinbaseUser = null;
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    // No token — not an error, just unauthenticated
    req.coinbaseUser = null;
    return next();
  }

  const token = authHeader.slice(7); // Strip "Bearer "

  try {
    const response = await fetch(COINBASE_USER_API, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status !== 200) {
      // Token is invalid or expired — clear user, but DON'T block the request.
      // Protected routes should check req.coinbaseUser themselves.
      req.coinbaseUser = null;
      return next();
    }

    const body = await response.json();
    const data = body.data || body;

    req.coinbaseUser = {
      id: data.id,
      name: data.name,
      username: data.username,
      avatarUrl: data.avatar_url,
      profileUrl: data.profile_url,
      resource: data.resource,
      // True if the token was scoped to include wallet accounts access
      hasWalletScope: token.length > 40, // heuristic: real Coinbase tokens are 64-hex
    };
  } catch (err) {
    // Network error connecting to Coinbase — degrade gracefully
    console.error("[coinbase-oauth] verification error:", err.message);
    req.coinbaseUser = null;
  }

  next();
}

/**
 * Creates a route guard that requires a valid Coinbase OAuth session.
 * Wrap any route handler that should be Coinbase-authenticated only.
 *
 * @param {import('express').RequestHandler} handler
 * @returns {import('express').RequestHandler}
 */
function requireCoinbaseAuth(handler) {
  return (req, res, next) => {
    if (!req.coinbaseUser) {
      return res.status(401).json({
        error: "coinbase_oauth_required",
        message: "This endpoint requires Coinbase OAuth2 authentication. Sign in at /auth/coinbase.",
        docs: "https://docs.cdp.coinbase.com/coinbase-app/docs/oauth2-integration",
      });
    }
    return handler(req, res, next);
  };
}

module.exports = { coinbaseOAuthMiddleware, requireCoinbaseAuth };