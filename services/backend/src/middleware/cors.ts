import { cors } from 'hono/cors';
import type { MiddlewareHandler } from 'hono';
import type { AppEnv } from '../worker-types';
import { getFrontendOrigin, isAllowedCorsOrigin } from '../auth/auth-env';

export const createCorsMiddleware = (): MiddlewareHandler<AppEnv> => {
  return async (c, next) => {
    return cors({
      origin: (origin) => {
        if (!origin) {
          return getFrontendOrigin(c.env);
        }

        return isAllowedCorsOrigin(origin, c.env, c.req.raw) ? origin : null;
      },
      allowHeaders: ['Content-Type', 'Authorization'],
      allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      credentials: true,
    })(c, next);
  };
};