export interface DukascopyTick {
  timestamp: string;
  bid: number;
  ask: number;
  bidVolume: number;
  askVolume: number;
}

const timeframeToIncrement = (timeframe: string): number => {
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  switch (timeframe) {
    case '1m':
    case 'M1':
      return minute;
    case '5m':
    case 'M5':
      return 5 * minute;
    case '15m':
    case 'M15':
      return 15 * minute;
    case '1h':
    case 'H1':
      return hour;
    case '4h':
    case 'H4':
      return 4 * hour;
    case '1d':
    case 'D1':
      return day;
    default:
      return minute;
  }
};

export const generateTicks = (
  startTime: Date,
  endTime: Date,
  timeframe: string,
): DukascopyTick[] => {
  const ticks: DukascopyTick[] = [];
  let currentTime = new Date(startTime);
  let currentPrice = 1.15;

  while (currentTime <= endTime) {
    if (currentTime.getDay() !== 0 && currentTime.getDay() !== 6) {
      const noise = (Math.random() - 0.5) * 0.0002;
      currentPrice *= 1 + noise;
      const spread = 0.0001 + Math.random() * 0.0001;

      ticks.push({
        timestamp: currentTime.toISOString(),
        bid: currentPrice,
        ask: currentPrice + spread,
        bidVolume: Math.floor(5000 + Math.random() * 45000),
        askVolume: Math.floor(5000 + Math.random() * 45000),
      });
    }

    currentTime = new Date(currentTime.getTime() + timeframeToIncrement(timeframe));
  }

  return ticks;
};