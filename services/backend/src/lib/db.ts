import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

export interface BackendEnv {
  DATABASE_URL: string;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL?: string;
  FRONTEND_ORIGIN?: string;
}

export const getSql = (env: BackendEnv) => neon(env.DATABASE_URL);

export const getDb = (env: BackendEnv) => drizzle({ client: getSql(env) });