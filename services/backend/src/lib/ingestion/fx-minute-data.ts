import { strFromU8, unzipSync } from 'fflate';
import type { OHLCVRow } from './types';

const HISTDATA_DOWNLOAD_URL = 'https://www.histdata.com/get.php';
const HISTDATA_REFERER_PREFIX = 'https://www.histdata.com/download-free-forex-historical-data/?/ascii/1-minute-bar-quotes/';
const EST_TO_UTC_OFFSET_HOURS = 5;

const formatHistDataMonth = (year: number, month?: number) => month == null ? `${year}` : `${year}${String(month).padStart(2, '0')}`;

const buildReferer = (pair: string, year: number, month?: number) => {
  const suffix = month == null ? `${year}` : `${year}/${month}`;
  return `${HISTDATA_REFERER_PREFIX}${pair}/${suffix}`;
};

const extractToken = (html: string) => {
  const match = html.match(/id=["']tk["'][^>]*value=["']([^"']+)["']/i);
  if (!match?.[1]) {
    throw new Error('HistData token not found for requested pair and period');
  }

  return match[1];
};

const toUtcIso = (timestamp: string) => {
  const match = timestamp.match(/^(\d{4})(\d{2})(\d{2})\s(\d{2})(\d{2})(\d{2})$/);
  if (!match) {
    throw new Error(`Invalid HistData timestamp: ${timestamp}`);
  }

  const [, year, month, day, hour, minute, second] = match;
  const utcMs = Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour) + EST_TO_UTC_OFFSET_HOURS,
    Number(minute),
    Number(second),
  );

  return new Date(utcMs).toISOString();
};

const parseCsv = (content: string, symbol: string): OHLCVRow[] => {
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split(';'))
    .filter((parts) => parts.length >= 5)
    .map(([barTime, open, high, low, close, volume]) => ({
      symbol,
      asset_type: 'forex' as const,
      bar_time: toUtcIso(barTime),
      timeframe: '1m' as const,
      open: Number(open),
      high: Number(high),
      low: Number(low),
      close: Number(close),
      volume: Number(volume ?? 0),
    }))
    .filter((row) => [row.open, row.high, row.low, row.close].every((value) => Number.isFinite(value)));
};

const extractCsvFromZip = (zipBytes: Uint8Array) => {
  const entries = unzipSync(zipBytes);
  const csvEntry = Object.entries(entries).find(([fileName]) => fileName.toLowerCase().endsWith('.csv'));

  if (!csvEntry) {
    throw new Error('HistData archive did not include a CSV payload');
  }

  return strFromU8(csvEntry[1]);
};

const fetchZipForPeriod = async (pair: string, year: number, month?: number) => {
  const referer = buildReferer(pair, year, month);
  const pageResponse = await fetch(referer, {
    headers: {
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      Referer: referer,
      'User-Agent': 'Mozilla/5.0 (compatible; BacktestBot/1.0; +https://www.histdata.com)',
    },
  });

  if (!pageResponse.ok) {
    throw new Error(`HistData page fetch failed: ${pageResponse.status}`);
  }

  const token = extractToken(await pageResponse.text());
  const body = new URLSearchParams({
    tk: token,
    date: String(year),
    datemonth: formatHistDataMonth(year, month),
    platform: 'ASCII',
    timeframe: 'M1',
    fxpair: pair.toUpperCase(),
  });

  const downloadResponse = await fetch(HISTDATA_DOWNLOAD_URL, {
    method: 'POST',
    headers: {
      Origin: 'https://www.histdata.com',
      Referer: referer,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Mozilla/5.0 (compatible; BacktestBot/1.0; +https://www.histdata.com)',
    },
    body: body.toString(),
  });

  if (!downloadResponse.ok) {
    throw new Error(`HistData download failed: ${downloadResponse.status}`);
  }

  return new Uint8Array(await downloadResponse.arrayBuffer());
};

export const fetchFxMinuteRows = async (input: {
  symbol: string;
  pairCode: string;
  year: number;
  month?: number;
  fromTime?: string;
  toTime?: string;
}): Promise<OHLCVRow[]> => {
  const zipBytes = await fetchZipForPeriod(input.pairCode, input.year, input.month);
  const csvContent = extractCsvFromZip(zipBytes);
  const rows = parseCsv(csvContent, input.symbol);
  const fromMs = input.fromTime ? new Date(input.fromTime).getTime() : Number.NEGATIVE_INFINITY;
  const toMs = input.toTime ? new Date(input.toTime).getTime() : Number.POSITIVE_INFINITY;

  return rows.filter((row) => {
    const barMs = new Date(row.bar_time).getTime();
    return barMs >= fromMs && barMs <= toMs;
  });
};