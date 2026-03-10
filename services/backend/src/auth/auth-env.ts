import type { BackendEnv } from '../worker-types';

const DEFAULT_AUTH_ORIGIN = 'http://localhost:8787';
const DEFAULT_FRONTEND_ORIGIN = 'http://localhost:5173';
const LOOPBACK_ORIGIN_PATTERNS = ['http://localhost:*', 'http://127.0.0.1:*'] as const;
const DEFAULT_PAGES_ORIGIN_PATTERNS = [
	/^https:\/\/backtest-frontend(?:-[a-z0-9]+)?\.pages\.dev$/,
	/^https:\/\/backtest-admin(?:-[a-z0-9]+)?\.pages\.dev$/,
] as const;

const normalizeOrigin = (origin: string) => origin.replace(/\/$/, '');

const isLoopbackOrigin = (origin: string) => /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
const isDefaultPagesOrigin = (origin: string) => DEFAULT_PAGES_ORIGIN_PATTERNS.some((pattern) => pattern.test(origin));

const getAdminOrigin = (env: BackendEnv) => env.ADMIN_ORIGIN ? normalizeOrigin(env.ADMIN_ORIGIN) : '';

const getRequestOrigin = (request?: Request) => {
	const requestOrigin = request?.headers.get('origin');
	return requestOrigin ? normalizeOrigin(requestOrigin) : '';
};

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
	const origins = [getFrontendOrigin(env), getAdminOrigin(env), getAuthBaseUrl(env, request)];
	const requestOrigin = getRequestOrigin(request);

	if (requestOrigin && isDefaultPagesOrigin(requestOrigin)) {
		origins.push(requestOrigin);
	}

	if (origins.some(isLoopbackOrigin)) {
		origins.push(...LOOPBACK_ORIGIN_PATTERNS);
	}

	return [...new Set(origins.filter(Boolean))];
};

export const isAllowedCorsOrigin = (origin: string, env: BackendEnv, request?: Request) => {
	const normalizedOrigin = normalizeOrigin(origin);
	const trustedOrigins = getTrustedOrigins(env, request);

	if (trustedOrigins.includes(normalizedOrigin)) {
		return true;
	}

	if (isDefaultPagesOrigin(normalizedOrigin)) {
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
