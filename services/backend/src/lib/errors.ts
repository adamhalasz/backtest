import type { ContentfulStatusCode } from 'hono/utils/http-status';

export class AppError extends Error {
  constructor(
    message: string,
    public status: ContentfulStatusCode = 500,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}