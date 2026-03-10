import type { MiddlewareHandler } from 'hono';
import { createAuth } from './auth-config';
import { AppError } from '../lib/errors';
import type { AppEnv, AuthUser } from '../worker-types';

const publicApiPrefixes = ['/api/auth/', '/api/health', '/api/market-data/'];

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

export const getRequiredUser = (user: AuthUser | null): AuthUser => {
  if (!user) {
    throw new AppError('Unauthorized', 401);
  }

  return user;
};