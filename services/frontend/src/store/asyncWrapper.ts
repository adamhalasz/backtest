import { produce } from 'immer';

export async function withLoading<T extends unknown[]>(
  key: string,
  fn: (
    set: any,
    get: any,
    setKey: (path: string | string[], value: unknown) => void,
    setError: (message: string | null) => void,
    ...args: T
  ) => Promise<void>,
  set: any,
  get: any,
  ...args: T
) {
  set((state: any) => ({
    loading: { ...state.loading, [key]: true },
    errors: { ...state.errors, [key]: null },
  }));

  const setError = (message: string | null) => {
    set((state: any) => ({
      errors: { ...state.errors, [key]: message },
    }));
  };

  const setKey = (path: string | string[], value: unknown) => {
    set(
      produce((draft: any) => {
        const keys = Array.isArray(path) ? path : path.split('.');
        let current = draft;

        for (let index = 0; index < keys.length - 1; index += 1) {
          if (!current[keys[index]]) {
            current[keys[index]] = {};
          }

          current = current[keys[index]];
        }

        current[keys[keys.length - 1]] = value;
      }),
    );
  };

  try {
    await fn(set, get, setKey, setError, ...args);
    setError(null);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    setError(message);
    throw error;
  } finally {
    set((state: any) => ({
      loading: { ...state.loading, [key]: false },
    }));
  }
}