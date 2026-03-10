import type { MarketAssetClass } from '../market-data-types';
import type { IngestionSource, IngestionSymbolDefinition, IngestionTimeframe } from './types';

const DEFAULT_CCXT_EXCHANGE_ID = 'binance';

const toDefaultCryptoSourceSymbol = (symbol: string) => {
  const normalized = symbol.trim().toUpperCase();
  const [base, rawQuote] = normalized.split('-');

  if (!base || !rawQuote) {
    return normalized.replace('-', '/');
  }

  const quote = rawQuote === 'USD' ? 'USDT' : rawQuote;
  return `${base}/${quote}`;
};

export const getDefaultIngestionSource = (assetType: MarketAssetClass): IngestionSource => {
  if (assetType === 'forex') {
    return 'histdata';
  }

  if (assetType === 'crypto') {
    return 'ccxt';
  }

  return 'yahoo';
};

const forexSymbols: IngestionSymbolDefinition[] = [
  ['EUR/USD', '2000-05'], ['GBP/USD', '2000-05'], ['USD/JPY', '2000-05'], ['USD/CHF', '2000-05'],
  ['AUD/USD', '2000-06'], ['USD/CAD', '2000-06'], ['NZD/USD', '2005-08'], ['EUR/GBP', '2002-03'],
  ['EUR/JPY', '2002-03'], ['GBP/JPY', '2002-05'], ['EUR/CHF', '2002-03'], ['AUD/JPY', '2002-08'],
  ['EUR/AUD', '2002-08'], ['EUR/CAD', '2007-03'], ['GBP/CHF', '2002-08'], ['GBP/AUD', '2007-09'],
  ['GBP/CAD', '2007-09'], ['GBP/NZD', '2008-03'], ['AUD/CAD', '2007-07'], ['AUD/CHF', '2008-03'],
  ['AUD/NZD', '2007-09'], ['CAD/JPY', '2007-03'], ['CHF/JPY', '2002-08'], ['NZD/JPY', '2006-09'],
  ['NZD/CAD', '2008-03'], ['NZD/CHF', '2008-03'], ['CAD/CHF', '2008-03'], ['EUR/NZD', '2008-03'],
].map(([symbol, availableFrom]) => ({
  symbol,
  assetType: 'forex' as const,
  source: 'histdata' as const,
  availableFrom,
  sourceSymbol: symbol.replace('/', '').toLowerCase(),
  supportedTimeframes: ['1m'] as IngestionTimeframe[],
}));

const cryptoSymbols: IngestionSymbolDefinition[] = [
  ['BTC-USD', '2017-09-01'],
  ['ETH-USD', '2017-09-01'],
  ['BNB-USD', '2017-11-01'],
  ['SOL-USD', '2020-08-11'],
  ['XRP-USD', '2017-09-01'],
  ['ADA-USD', '2017-11-01'],
  ['DOGE-USD', '2019-07-05'],
  ['AVAX-USD', '2020-09-22'],
  ['DOT-USD', '2020-08-19'],
  ['MATIC-USD', '2019-04-30'],
].map(([symbol, availableFrom]) => ({
  symbol,
  assetType: 'crypto' as const,
  source: 'ccxt' as const,
  availableFrom,
  sourceSymbol: toDefaultCryptoSourceSymbol(symbol),
  supportedTimeframes: ['1m', '1h', '1d'] as IngestionTimeframe[],
  exchangeId: DEFAULT_CCXT_EXCHANGE_ID,
}));

const stockSymbols: IngestionSymbolDefinition[] = [
  'AAPL', 'MSFT', 'NVDA', 'TSLA',
].map((symbol) => ({
  symbol,
  assetType: 'stock' as const,
  source: 'yahoo' as const,
  availableFrom: '1980-01-01',
  sourceSymbol: symbol,
  supportedTimeframes: ['1d', '1h'] as IngestionTimeframe[],
}));

const defaultSymbols = [...forexSymbols, ...cryptoSymbols, ...stockSymbols];

export const listDefaultIngestionSymbols = (assetType?: MarketAssetClass, timeframe?: IngestionTimeframe) => {
  return defaultSymbols.filter((entry) => {
    if (assetType && entry.assetType !== assetType) {
      return false;
    }

    if (timeframe && !entry.supportedTimeframes.includes(timeframe)) {
      return false;
    }

    return true;
  });
};

export const resolveDefaultIngestionSymbol = (
  symbol: string,
  assetType: MarketAssetClass,
  timeframe?: IngestionTimeframe,
): IngestionSymbolDefinition | undefined => {
  const normalized = symbol.trim().toUpperCase();
  return listDefaultIngestionSymbols(assetType, timeframe).find((entry) => entry.symbol.toUpperCase() === normalized);
};

export const buildFallbackSymbolDefinition = (
  symbol: string,
  assetType: MarketAssetClass,
  source: IngestionSource,
  timeframe: IngestionTimeframe,
): IngestionSymbolDefinition => ({
  symbol,
  assetType,
  source,
  availableFrom: assetType === 'stock' ? '1980-01-01' : assetType === 'crypto' ? '2017-09-01' : '2000-01-01',
  sourceSymbol: assetType === 'forex'
    ? symbol.replace('/', '').toLowerCase()
    : assetType === 'crypto'
      ? toDefaultCryptoSourceSymbol(symbol)
      : symbol.toUpperCase(),
  supportedTimeframes: [timeframe],
  exchangeId: assetType === 'crypto' && source === 'ccxt' ? DEFAULT_CCXT_EXCHANGE_ID : undefined,
});