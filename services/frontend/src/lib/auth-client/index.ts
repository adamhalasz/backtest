import React from 'react';
import { createAuthClient } from 'better-auth/react';

const normalizeBaseUrl = (value: string) => value.replace(/\/$/, '');

const getAuthBaseUrl = () => {
  const explicitAuthUrl = import.meta.env.VITE_AUTH_BASE_URL;

  if (explicitAuthUrl) {
    return normalizeBaseUrl(explicitAuthUrl);
  }

  const apiUrl = import.meta.env.VITE_API_URL;

  if (apiUrl) {
    return `${normalizeBaseUrl(apiUrl)}/api/auth`;
  }

  if (typeof window !== 'undefined') {
    return `${normalizeBaseUrl(window.location.origin)}/api/auth`;
  }

  return 'http://localhost:5173/api/auth';
};

export const authClient = createAuthClient({
  baseURL: getAuthBaseUrl(),
  fetchOptions: {
    credentials: 'include',
  },
});

export const { signIn, signUp, signOut, useSession } = authClient;

export function useSafeSession(timeoutMs = 6000) {
  const session = useSession();
  const [hasTimedOut, setHasTimedOut] = React.useState(false);

  React.useEffect(() => {
    if (!session.isPending) {
      setHasTimedOut(false);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setHasTimedOut(true);
    }, timeoutMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [session.isPending, timeoutMs]);

  return {
    ...session,
    isPending: session.isPending && !hasTimedOut,
    hasTimedOut,
  };
}