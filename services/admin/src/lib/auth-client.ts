import { createAuthClient } from 'better-auth/react';
import { getApiBaseUrl, getAuthBaseUrl } from './runtime-config';

export const authClient = createAuthClient({
  baseURL: getAuthBaseUrl(),
  fetchOptions: {
    credentials: 'include',
  },
});

export const { useSession, signIn, signOut } = authClient;
export { getApiBaseUrl };
