import { useSession } from './auth-api';

export function useAuthSession() {
  const session = useSession();

  return {
    session: session.data,
    isPending: session.isPending,
  };
}
