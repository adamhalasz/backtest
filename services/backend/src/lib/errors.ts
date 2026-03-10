export class AppError extends Error {
  constructor(
    message: string,
    public status: number = 500,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}