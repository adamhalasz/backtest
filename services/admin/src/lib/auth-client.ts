import { createAuthClient } from 'better-auth/react';

// Use VITE_API_URL as the base and append /api/auth for the auth endpoint
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8787';
const baseURL = `${apiUrl}/api/auth`;

export const authClient = createAuthClient({
  baseURL,
});

export const { useSession, signIn, signOut } = authClient;
