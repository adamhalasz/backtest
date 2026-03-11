import React from 'react';
import { createAuthClient } from 'better-auth/react';
import { getAuthBaseUrl } from '@/lib/runtime-config';

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