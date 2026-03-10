import type { MiddlewareHandler } from 'hono';
import type { AppEnv } from '../worker-types';

export const requestLogger = (): MiddlewareHandler<AppEnv> => {
  return async (c, next) => {
    const start = Date.now();
    await next();
    console.log(`${c.req.method} ${c.req.path} ${c.res.status} ${Date.now() - start}ms`);
  };
};