import { useSafeSession } from '@/lib/auth-client';

export function useAuthSession() {
  const session = useSafeSession();

  return {
    session: session.data,
    isPending: session.isPending,
    hasTimedOut: session.hasTimedOut,
  };
}
