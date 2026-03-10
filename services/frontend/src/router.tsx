import { Route, Switch } from 'wouter';
import { AuthPage } from '@/routes/auth/AuthPage';
import { BacktestDetailPage } from '@/routes/backtests/BacktestDetailPage';
import { BacktestTimelinePage } from '@/routes/backtests/BacktestTimelinePage';
import { BacktestsPage } from '@/routes/backtests/BacktestsPage';
import { CreateBacktestPage } from '@/routes/backtests/CreateBacktestPage';
import { BotsPage } from '@/routes/bots/BotsPage';
import { CreateBotPage } from '@/routes/bots/CreateBotPage';
import { DataExplorerPage } from '@/routes/data-explorer/DataExplorerPage';
import { NotFoundPage } from '@/routes/not-found/NotFoundPage';
import { StrategiesPage } from '@/routes/strategies/StrategiesPage';
import { StrategyDetailsPage } from '@/routes/strategies/StrategyDetailsPage';

export function AppRouter() {
  return (
    <Switch>
      <Route path="/auth">
        <AuthPage />
      </Route>
      <Route path="/">
        <BacktestsPage />
      </Route>
      <Route path="/backtest/new">
        <CreateBacktestPage />
      </Route>
      <Route path="/backtest/:id">
        <BacktestDetailPage />
      </Route>
      <Route path="/backtest/:id/timeline">
        <BacktestTimelinePage />
      </Route>
      <Route path="/bots">
        <BotsPage />
      </Route>
      <Route path="/bots/new">
        <CreateBotPage />
      </Route>
      <Route path="/strategies">
        <StrategiesPage />
      </Route>
      <Route path="/strategies/:name">
        <StrategyDetailsPage />
      </Route>
      <Route path="/explorer">
        <DataExplorerPage />
      </Route>
      <Route>
        <NotFoundPage />
      </Route>
    </Switch>
  );
}