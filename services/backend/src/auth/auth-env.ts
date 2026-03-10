import type { BackendEnv } from '../worker-types';

const DEFAULT_AUTH_ORIGIN = 'http://localhost:8787';
const DEFAULT_FRONTEND_ORIGIN = 'http://localhost:5173';
const LOOPBACK_ORIGIN_PATTERNS = ['http://localhost:*', 'http://127.0.0.1:*'] as const;

const normalizeOrigin = (origin: string) => origin.replace(/\/$/, '');

const isLoopbackOrigin = (origin: string) => /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

export const getAuthBaseUrl = (env: BackendEnv, request?: Request) => {
	if (request) {
		return normalizeOrigin(new URL(request.url).origin);
	}

	const configuredOrigin = env.BETTER_AUTH_URL ? normalizeOrigin(env.BETTER_AUTH_URL) : '';
	const frontendOrigin = getFrontendOrigin(env);

	if (configuredOrigin && configuredOrigin !== frontendOrigin) {
		return configuredOrigin;
	}

	return DEFAULT_AUTH_ORIGIN;
};

export const getFrontendOrigin = (env: BackendEnv) => normalizeOrigin(env.FRONTEND_ORIGIN || DEFAULT_FRONTEND_ORIGIN);

export const getTrustedOrigins = (env: BackendEnv, request?: Request) => {
	const origins = [getFrontendOrigin(env), getAuthBaseUrl(env, request)];

	if (origins.some(isLoopbackOrigin)) {
		origins.push(...LOOPBACK_ORIGIN_PATTERNS);
	}

	return [...new Set(origins)];
};

export const isAllowedCorsOrigin = (origin: string, env: BackendEnv, request?: Request) => {
	const normalizedOrigin = normalizeOrigin(origin);
	const trustedOrigins = getTrustedOrigins(env, request);

	if (trustedOrigins.includes(normalizedOrigin)) {
		return true;
	}

	return LOOPBACK_ORIGIN_PATTERNS.some((pattern) => {
		if (!pattern.endsWith(':*')) {
			return normalizedOrigin === pattern;
		}

		const baseOrigin = pattern.slice(0, -2);
		return new RegExp(`^${baseOrigin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}:\\d+$`).test(normalizedOrigin);
	});
};
