export interface BackendEnv {
  DATABASE_URL: string;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL?: string;
  FRONTEND_ORIGIN?: string;
}

export interface AuthSession {
  id: string;
  [key: string]: unknown;
}

export interface AuthUser {
  id: string;
  email?: string | null;
  [key: string]: unknown;
}

export type AppEnv = {
  Bindings: BackendEnv;
  Variables: {
    session: AuthSession | null;
    user: AuthUser | null;
  };
};