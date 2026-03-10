import { EXCHANGES } from '@/lib/constants';

export type MarketAssetClass = 'forex' | 'crypto' | 'stock';

export type MarketDataProviderId = 'yahoo' | 'clickhouse';

type MarketParameters = {
  assetClass?: MarketAssetClass;
  provider?: MarketDataProviderId;
};

const knownFiatCurrencies = new Set([
  'AUD', 'BRL', 'CAD', 'CHF', 'CNY', 'EUR', 'GBP', 'HKD', 'INR', 'JPY', 'KRW', 'MXN', 'NZD', 'SGD', 'USD',
]);

const knownCryptoAssets = new Set([
  'ADA', 'AVAX', 'BCH', 'BNB', 'BTC', 'DOGE', 'DOT', 'ETH', 'LINK', 'LTC', 'MATIC', 'SOL', 'TRX', 'UNI', 'XLM', 'XRP',
]);

export const DEFAULT_MARKET_DATA_PROVIDER: MarketDataProviderId = 'yahoo';

export const getDefaultProviderForAssetClass = (assetClass: MarketAssetClass): MarketDataProviderId => {
  return assetClass === 'forex' ? 'clickhouse' : 'yahoo';
};

export const getDefaultSymbolForAssetClass = (assetClass: MarketAssetClass) => {
  switch (assetClass) {
    case 'crypto':
      return 'BTC-USD';
    case 'stock':
      return 'AAPL';
    case 'forex':
    default:
      return 'EUR/USD';
  }
};

export const inferMarketAssetClass = (symbol: string): MarketAssetClass => {
  const normalized = symbol.replace(/\s+/g, '').toUpperCase();

  if (normalized.includes('-')) {
    return 'crypto';
  }

  if (normalized.includes('/')) {
    const [base, quote] = normalized.split('/');

    if (knownFiatCurrencies.has(base) && knownFiatCurrencies.has(quote)) {
      return 'forex';
    }

    if (knownCryptoAssets.has(base) || knownCryptoAssets.has(quote)) {
      return 'crypto';
    }
  }

  if (/^[A-Z]{6}$/.test(normalized)) {
    const base = normalized.slice(0, 3);
    const quote = normalized.slice(3);

    if (knownFiatCurrencies.has(base) && knownFiatCurrencies.has(quote)) {
      return 'forex';
    }

    if (knownCryptoAssets.has(base) || knownCryptoAssets.has(quote)) {
      return 'crypto';
    }
  }

  return 'stock';
};

export const parseForexPair = (symbol: string) => {
  const normalized = symbol.replace(/\s+/g, '').toUpperCase();

  if (normalized.includes('/')) {
    const [baseCurrency, targetCurrency] = normalized.split('/');
    if (baseCurrency && targetCurrency) {
      return { baseCurrency, targetCurrency };
    }
  }

  if (/^[A-Z]{6}$/.test(normalized)) {
    return {
      baseCurrency: normalized.slice(0, 3),
      targetCurrency: normalized.slice(3),
    };
  }

  return null;
};

export const buildStoredSymbol = ({
  assetClass,
  symbol,
  baseCurrency,
  targetCurrency,
}: {
  assetClass: MarketAssetClass;
  symbol?: string;
  baseCurrency?: string;
  targetCurrency?: string;
}) => {
  if (assetClass === 'forex') {
    if (!baseCurrency || !targetCurrency) {
      throw new Error('A forex pair requires both a base currency and quote currency.');
    }

    return `${baseCurrency}/${targetCurrency}`;
  }

  const normalizedSymbol = symbol?.trim().toUpperCase();

  if (!normalizedSymbol) {
    throw new Error('A market symbol is required.');
  }

  return normalizedSymbol;
};

export const buildMarketDataRequestSymbol = (symbol: string, assetClass: MarketAssetClass) => {
  const normalized = symbol.replace(/\s+/g, '').toUpperCase();

  if (assetClass === 'forex') {
    return normalized.replace('/', '');
  }

  return normalized;
};

export const estimateTradingDays = (totalDays: number, assetClass: MarketAssetClass) => {
  if (assetClass === 'crypto') {
    return totalDays;
  }

  return Math.ceil(totalDays * 5 / 7);
};

export const resolveStoredAssetClass = (parameters: MarketParameters | undefined, symbol: string) => {
  return parameters?.assetClass ?? inferMarketAssetClass(symbol);
};

export const resolveStoredProvider = (parameters: MarketParameters | undefined, symbol?: string) => {
  if (parameters?.provider) {
    return parameters.provider;
  }

  if (parameters?.assetClass) {
    return getDefaultProviderForAssetClass(parameters.assetClass);
  }

  if (symbol) {
    return getDefaultProviderForAssetClass(inferMarketAssetClass(symbol));
  }

  return DEFAULT_MARKET_DATA_PROVIDER;
};

export const getAvailableExchanges = (assetClass: MarketAssetClass) => {
  return EXCHANGES.filter((exchange) => (exchange.assetClasses as readonly MarketAssetClass[]).includes(assetClass));
};

export const getDefaultExchangeForAssetClass = (assetClass: MarketAssetClass) => {
  return getAvailableExchanges(assetClass)[0]?.id ?? EXCHANGES[0].id;
};

export const isAlwaysOpenExchange = (exchangeId: string) => {
  return EXCHANGES.find((exchange) => exchange.id === exchangeId)?.isAlwaysOpen ?? false;
};
