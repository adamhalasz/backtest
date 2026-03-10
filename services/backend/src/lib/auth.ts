import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { authSchema } from '../db/auth-schema';
import { getDb, type BackendEnv } from './db';
import { getAuthBaseUrl, getTrustedOrigins } from '../auth/auth-env';

export const createAuth = (env: BackendEnv, request?: Request) => betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  baseURL: getAuthBaseUrl(env, request),
  trustedOrigins: (currentRequest) => getTrustedOrigins(env, currentRequest),
  database: drizzleAdapter(getDb(env), {
    provider: 'pg',
    schema: authSchema,
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 6,
  },
});