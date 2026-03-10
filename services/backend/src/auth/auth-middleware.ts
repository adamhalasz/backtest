import type { MiddlewareHandler } from 'hono';
import { createAuth } from './auth-config';
import { AppError } from '../lib/errors';
import type { AppEnv, AuthUser } from '../worker-types';

const publicApiPrefixes = ['/api/auth/', '/api/health', '/api/market-data/'];
const ingestionAdminHeader = 'x-ingestion-admin-secret';

export const sessionMiddleware: MiddlewareHandler<AppEnv> = async (c, next) => {
  if (publicApiPrefixes.some((prefix) => c.req.path.startsWith(prefix))) {
    await next();
    return;
  }

  const auth = createAuth(c.env, c.req.raw);
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  c.set('session', (session?.session as AppEnv['Variables']['session']) ?? null);
  c.set('user', (session?.user as AppEnv['Variables']['user']) ?? null);

  await next();
};

export const requireAuth: MiddlewareHandler<AppEnv> = async (c, next) => {
  if (!c.get('user')) {
    throw new AppError('Unauthorized', 401);
  }

  await next();
};

export const hasIngestionAdminAccess = (c: { env: AppEnv['Bindings']; req: { header(name: string): string | undefined }; get(key: 'user'): AuthUser | null }) => {
  if (c.get('user')) {
    return true;
  }

  const expected = c.env.INGESTION_ADMIN_SECRET;
  const provided = c.req.header(ingestionAdminHeader);

  return Boolean(expected && provided && expected === provided);
};

export const requireIngestionAccess: MiddlewareHandler<AppEnv> = async (c, next) => {
  if (!hasIngestionAdminAccess(c)) {
    throw new AppError('Unauthorized', 401);
  }

  await next();
};

export const getRequiredUser = (user: AuthUser | null): AuthUser => {
  if (!user) {
    throw new AppError('Unauthorized', 401);
  }

  return user;
};

export const isAdmin = (user: AuthUser | null): boolean => {
  return user?.role === 'admin';
};

export const requireAdmin: MiddlewareHandler<AppEnv> = async (c, next) => {
  const user = c.get('user');
  
  if (!isAdmin(user)) {
    throw new AppError('Forbidden: Admin access required', 403);
  }

  await next();
};