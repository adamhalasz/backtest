import { Hono } from 'hono';
import { authRouter } from './auth/auth-config';
import { defaultUserSeedMiddleware } from './auth/default-user';
import { sessionMiddleware } from './auth/auth-middleware';
import { createCorsMiddleware } from './middleware/cors';
import { errorHandler } from './middleware/error-handler';
import { requestLogger } from './middleware/logger';
import { backtestsRouter } from './routes/backtests/backtests-router';
import { botsRouter } from './routes/bots/bots-router';
import { healthRouter } from './routes/health/health-router';
import { marketDataRouter } from './routes/market-data/market-data-router';
import { sessionRouter } from './routes/session/session-router';
import type { AppEnv } from './worker-types';

const app = new Hono<AppEnv>();

app.use('*', createCorsMiddleware());
app.use('*', requestLogger());
app.use('*', defaultUserSeedMiddleware);
app.use('/api/*', sessionMiddleware);
app.onError(errorHandler);

app.route('/api/auth', authRouter);
app.route('/api/health', healthRouter);
app.route('/api/session', sessionRouter);
app.route('/api/market-data', marketDataRouter);
app.route('/api/backtests', backtestsRouter);
app.route('/api/bots', botsRouter);

export default app;