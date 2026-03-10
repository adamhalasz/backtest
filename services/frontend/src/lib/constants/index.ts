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
    description: 'Largest forex market, highest liquidity during European hours'
  },
  {
    id: 'newyork',
    name: 'New York',
    timezone: 'America/New_York',
    hours: { open: 8, close: 17 }, // Local time
    description: 'Second largest center, high volatility during US market hours'
  },
  {
    id: 'tokyo',
    name: 'Tokyo',
    timezone: 'Asia/Tokyo',
    hours: { open: 9, close: 18 }, // Local time
    description: 'Major Asian trading hub, important for JPY pairs'
  },
] as const;