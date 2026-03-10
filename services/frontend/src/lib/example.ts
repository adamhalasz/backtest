import { TradingBacktester } from './backtest';

async function runExampleBacktest() {
  const config = {
    symbol: 'EUR/USD',
    exchange: 'london',
    timeframe: '1d' as const,
    startDate: '2023-01-01',
    endDate: '2024-01-01',
    initialBalance: 10000,
    riskPerTrade: 2, // 2% risk per trade
  };

  const backtester = new TradingBacktester(config);
  const results = await backtester.runBacktest();

  console.log('Backtest Results:', {
    finalBalance: results.finalBalance,
    totalTrades: results.trades.length,
    metrics: results.metrics,
  });
}

// Only run if this file is executed directly
if (require.main === module) {
  runExampleBacktest().catch(console.error);
}