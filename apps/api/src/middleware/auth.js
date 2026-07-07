import PocketBase from 'pocketbase';
import logger from '../utils/logger.js';

const POCKETBASE_HOST = 'http://localhost:8090';

/**
 * Pull the bearer token out of an Authorization header value.
 * Accepts both "Bearer <token>" and a bare "<token>" for tolerance.
 * Returns null when nothing usable is present. Kept pure for unit testing.
 */
export function extractBearerToken(headerValue) {
	if (!headerValue || typeof headerValue !== 'string') return null;
	const trimmed = headerValue.trim();
	if (!trimmed) return null;
	const lower = trimmed.toLowerCase();
	if (lower.startsWith('bearer ')) {
		return trimmed.slice(7).trim() || null;
	}
	// A bare "Bearer" with no token is not a usable credential.
	if (lower === 'bearer') return null;
	return trimmed;
}

/**
 * Require a valid PocketBase *user* session on the request.
 *
 * The API otherwise talks to PocketBase as a superuser service account and has
 * no idea who the caller is, which is why record ownership (userId) could never
 * be set correctly. Here we verify the user's own PB token — forwarded by the
 * browser as `Authorization: Bearer <token>` — against PocketBase, and attach
 * the resolved identity to the request. Downstream routes use req.userId to set
 * and check ownership.
 *
 * A throwaway PocketBase client is used per request so verifying a user token
 * never disturbs the shared superuser client's auth state.
 */
export async function requireAuth(req, res, next) {
	const token = extractBearerToken(req.headers.authorization);

	if (!token) {
		return res.status(401).json({ error: 'Authentication required' });
	}

	try {
		const client = new PocketBase(POCKETBASE_HOST);
		client.authStore.save(token, null);

		// authRefresh validates the token server-side and returns the fresh
		// user record; it throws (401) if the token is invalid or expired.
		const authData = await client.collection('users').authRefresh();

		if (!authData?.record?.id) {
			return res.status(401).json({ error: 'Invalid or expired session' });
		}

		req.user = authData.record;
		req.userId = authData.record.id;
		return next();
	} catch (err) {
		logger.warn('Auth verification failed:', err.message);
		return res.status(401).json({ error: 'Invalid or expired session' });
	}
}
