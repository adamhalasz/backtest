import axios from 'axios';
import moment from 'moment-timezone';

const API_BASE = 'https://api.frankfurter.app';

interface ECBResponse {
  amount: number;
  base: string;
  rates: {
    [date: string]: {
      [currency: string]: number;
    };
  };
}

export async function fetchECBData(
  startDate: string,
  endDate: string,
  baseCurrency: string,
  targetCurrency: string
): Promise<Array<{ date: Date; rate: number }>> {
  try {
    const response = await axios.get<ECBResponse>(
      `${API_BASE}/${startDate}..${endDate}?from=${baseCurrency}&to=${targetCurrency}`
    );

    if (!response.data?.rates) {
      throw new Error('Invalid response format from ECB API');
    }

    const data = Object.entries(response.data.rates)
      .map(([date, rates]) => ({
        date: new Date(date),
        rate: rates[targetCurrency]
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    if (data.length === 0) {
      throw new Error('No data available for the specified date range');
    }

    return data;

  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      } else if (error.response?.status === 404) {
        throw new Error('No data available for the specified date range');
      }
      throw new Error(`Failed to fetch forex data: ${error.message}`);
    }
    throw new Error('Failed to fetch forex data');
  }
}