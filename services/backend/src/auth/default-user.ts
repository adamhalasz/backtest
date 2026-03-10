import type { MiddlewareHandler } from 'hono';
import { createAuth } from './auth-config';
import { getAuthBaseUrl } from './auth-env';
import type { AppEnv, BackendEnv } from '../worker-types';

// Default user seeding is opt-in and intended only for local development.
const getDefaultUser = (env: BackendEnv) => ({
  email: env.DEFAULT_ADMIN_EMAIL || 'admin@example.com',
  password: env.DEFAULT_ADMIN_PASSWORD || 'changeme',
  name: env.DEFAULT_ADMIN_NAME || 'Admin User',
  role: 'admin' as const,
});

const shouldSeedDefaultUser = (env: BackendEnv) => env.ENABLE_DEFAULT_ADMIN_SEED === 'true';

const seedRuns = new Map<string, Promise<void>>();

const getSeedKey = (env: BackendEnv) => `${env.DATABASE_URL}:${getAuthBaseUrl(env)}`;

const createDefaultUser = async (env: BackendEnv) => {
  const DEFAULT_USER = getDefaultUser(env);
  const auth = createAuth(env);
  const context = await auth.$context;
  const existingUser = await context.internalAdapter.findUserByEmail(DEFAULT_USER.email);

  if (existingUser?.user) {
    return;
  }

  try {
    await auth.api.signUpEmail({
      body: DEFAULT_USER,
    });
  } catch (error) {
    const userAfterFailure = await context.internalAdapter.findUserByEmail(DEFAULT_USER.email);

    if (userAfterFailure?.user) {
      return;
    }

    throw error;
  }
};

export const ensureDefaultUser = (env: BackendEnv) => {
  const seedKey = getSeedKey(env);
  const existingRun = seedRuns.get(seedKey);

  if (existingRun) {
    return existingRun;
  }

  const run = createDefaultUser(env).catch((error) => {
    seedRuns.delete(seedKey);
    throw error;
  });

  seedRuns.set(seedKey, run);
  return run;
};

export const defaultUserSeedMiddleware: MiddlewareHandler<AppEnv> = async (c, next) => {
  if (shouldSeedDefaultUser(c.env)) {
    try {
      await ensureDefaultUser(c.env);
    } catch (error) {
      console.error('Failed to ensure default auth user', error);
    }
  }

  await next();
};