import { createAuthClient } from 'better-auth/react';

const baseURL = import.meta.env.VITE_AUTH_BASE_URL || undefined;

export const authClient = createAuthClient({
  ...(baseURL ? { baseURL } : {}),
});

export const { signIn, signUp, signOut, useSession } = authClient;