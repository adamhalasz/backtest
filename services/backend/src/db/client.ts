import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import type { BackendEnv } from '../worker-types';

export const getSql = (env: BackendEnv) => neon(env.DATABASE_URL);

export const getDb = (env: BackendEnv) => drizzle({ client: getSql(env) });