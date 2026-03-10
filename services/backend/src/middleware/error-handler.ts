import type { ErrorHandler } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { AppError } from '../lib/errors';
import type { AppEnv } from '../worker-types';

export const errorHandler: ErrorHandler<AppEnv> = (error, c) => {
  if (error instanceof AppError) {
    return c.json(
      { message: error.message, details: error.details ?? null },
      error.status as ContentfulStatusCode,
    );
  }

  console.error(error);
  return c.json({ message: 'Internal server error' }, 500);
};