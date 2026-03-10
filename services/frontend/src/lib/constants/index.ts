export const CURRENCIES = [
  { code: 'EUR', name: 'Euro' },
  { code: 'USD', name: 'US Dollar' },
  { code: 'GBP', name: 'British Pound' },
  { code: 'JPY', name: 'Japanese Yen' },
  { code: 'CHF', name: 'Swiss Franc' },
  { code: 'AUD', name: 'Australian Dollar' },
  { code: 'CAD', name: 'Canadian Dollar' },
  { code: 'NZD', name: 'New Zealand Dollar' },
  { code: 'CNY', name: 'Chinese Yuan' },
  { code: 'HKD', name: 'Hong Kong Dollar' },
  { code: 'SGD', name: 'Singapore Dollar' },
  { code: 'INR', name: 'Indian Rupee' },
  { code: 'MXN', name: 'Mexican Peso' },
  { code: 'KRW', name: 'South Korean Won' },
  { code: 'BRL', name: 'Brazilian Real' },
]

export const ASSET_CLASSES = [
  { value: 'forex', label: 'Forex' },
  { value: 'crypto', label: 'Crypto' },
  { value: 'stock', label: 'Stocks' },
] as const;

export const MARKET_DATA_PROVIDERS = [
  { value: 'yahoo', label: 'Yahoo Finance' },
  { value: 'clickhouse', label: 'ClickHouse Archive' },
] as const;

export const CRYPTO_SYMBOLS = [
  { value: 'BTC-USD', label: 'Bitcoin (BTC-USD)' },
  { value: 'ETH-USD', label: 'Ethereum (ETH-USD)' },
  { value: 'SOL-USD', label: 'Solana (SOL-USD)' },
  { value: 'XRP-USD', label: 'XRP (XRP-USD)' },
] as const;

export const STOCK_SYMBOLS = [
  { value: 'AAPL', label: 'Apple (AAPL)' },
  { value: 'MSFT', label: 'Microsoft (MSFT)' },
  { value: 'NVDA', label: 'NVIDIA (NVDA)' },
  { value: 'TSLA', label: 'Tesla (TSLA)' },
] as const;

export const TIMEFRAMES = [
  { value: '1m', label: '1 Minute', description: 'One-minute intervals, ideal for scalping strategies' },
  { value: '5m', label: '5 Minutes', description: 'Short-term intraday trading and momentum strategies' },
  { value: '15m', label: '15 Minutes', description: 'Medium-term intraday trends and pattern recognition' },
  { value: '1h', label: '1 Hour', description: 'Swing trading and trend following strategies' },
  { value: '4h', label: '4 Hours', description: 'Major trend shifts and breakout strategies' },
  { value: '1d', label: '1 Day', description: 'Long-term analysis and position trading' }
] as const;

export const EXCHANGES = [
  { 
    id: 'london',
    name: 'London',
    timezone: 'Europe/London',
    hours: { open: 8, close: 16 }, // Local time
    assetClasses: ['forex'],
    isAlwaysOpen: false,
    description: 'Largest forex market, highest liquidity during European hours'
  },
  {
    id: 'newyork',
    name: 'New York',
    timezone: 'America/New_York',
    hours: { open: 8, close: 17 }, // Local time
    assetClasses: ['forex'],
    isAlwaysOpen: false,
    description: 'Second largest center, high volatility during US market hours'
  },
  {
    id: 'tokyo',
    name: 'Tokyo',
    timezone: 'Asia/Tokyo',
    hours: { open: 9, close: 18 }, // Local time
    assetClasses: ['forex'],
    isAlwaysOpen: false,
    description: 'Major Asian trading hub, important for JPY pairs'
  },
  {
    id: 'nasdaq',
    name: 'NASDAQ',
    timezone: 'America/New_York',
    hours: { open: 9, close: 16 },
    assetClasses: ['stock'],
    isAlwaysOpen: false,
    description: 'Primary venue for major US technology stocks during regular market hours'
  },
  {
    id: 'nyse',
    name: 'NYSE',
    timezone: 'America/New_York',
    hours: { open: 9, close: 16 },
    assetClasses: ['stock'],
    isAlwaysOpen: false,
    description: 'Primary venue for large-cap US equities during regular market hours'
  },
  {
    id: 'crypto',
    name: 'Global Crypto Market',
    timezone: 'Etc/UTC',
    hours: { open: 0, close: 24 },
    assetClasses: ['crypto'],
    isAlwaysOpen: true,
    description: '24/7 aggregated crypto market session'
  },
] as const;