import { createAuthClient } from 'better-auth/react';

// In development, use the Vite proxy by default (no baseURL = relative paths)
// In production, set VITE_AUTH_BASE_URL to your backend URL
const baseURL = import.meta.env.VITE_AUTH_BASE_URL;

export const authClient = createAuthClient({
  baseURL: baseURL || '/api/auth',
});

export const { signIn, signUp, signOut, useSession } = authClient;