import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { TradeSignals } from '@/routes/backtests/components/trade-signals';
import { Trade } from '@/lib/types';

interface TradeHistoryItemProps {
  trade: Trade;
}

export function TradeHistoryItem({ trade }: TradeHistoryItemProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const calculateProfitPercentage = () => {
    const entryValue = trade.signals?.position?.size 
      ? trade.signals.position.size * trade.entryPrice
      : trade.entryPrice;
    return (trade.profit / entryValue);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Trade Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              trade.type === 'BUY' ? 'bg-green-100' : 'bg-red-100'
            }`}>
              {trade.type === 'BUY' ? 
                <TrendingUp className="w-6 h-6 text-green-600" /> : 
                <TrendingDown className="w-6 h-6 text-red-600" />
              }
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {trade.type} Signal
              </h3>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-xl font-mono text-gray-900">
                {new Date(trade.entryTime).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </p>
            </div>
            <div className="flex flex-col items-center justify-center bg-gray-100 rounded-lg p-2 min-w-[80px]">
              <span className="text-xs font-bold text-gray-600">{new Date(trade.entryTime).getFullYear()}</span>
              <span className="text-lg font-bold text-gray-900">{new Date(trade.entryTime).toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}</span>
              <span className="text-2xl font-bold text-gray-800">{new Date(trade.entryTime).getDate()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Trade Content */}
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-600">Entry Price</p>
            <div>
              <p className="text-lg font-semibold text-gray-900">{formatCurrency(trade.entryPrice)}</p>
              <p className="text-sm text-gray-500">
                {new Date(trade.entryTime).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })} at {new Date(trade.entryTime).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: true
                })}
              </p>
            </div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-600">Exit Price</p>
            <div>
              <p className="text-lg font-semibold text-gray-900">{formatCurrency(trade.exitPrice)}</p>
              <p className="text-sm text-gray-500">
                {new Date(trade.exitTime).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })} at {new Date(trade.exitTime).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: true
                })}
              </p>
            </div>
          </div>
        </div>

        {trade.signals?.position?.size && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Entry Amount</span>
              <span className="text-lg font-semibold text-gray-900">
                {formatCurrency(trade.signals.position.size * trade.entryPrice)}
              </span>
            </div>
          </div>
        )}

        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Profit/Loss</span>
            <div className="group relative">
              <span className={`text-lg font-bold ${
                trade.profit > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatCurrency(trade.profit)}
                <span className="ml-1 text-sm">
                  ({calculateProfitPercentage() > 0 ? '+' : ''}{formatPercent(calculateProfitPercentage())})
                </span>
              </span>
              <div className="invisible group-hover:visible absolute bottom-full right-0 mb-2 w-60 p-2 bg-gray-900 text-white text-sm rounded-lg z-10">
                <div className="absolute -bottom-1 right-4 w-2 h-2 bg-gray-900 rotate-45"></div>
                <div className="space-y-1">
                  <p>Target {trade.profit > 0 ? 'Profit' : 'Loss'}: {
                    trade.profit > 0 
                      ? formatPercent(trade.signals?.position?.takeProfitLevel || 0.015)
                      : formatPercent(trade.signals?.position?.stopLossLevel || 0.008)
                  }</p>
                  <p>Actual: {formatPercent(Math.abs(calculateProfitPercentage()))}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {calculateProfitPercentage() > 0
                      ? `${formatPercent(calculateProfitPercentage() / (trade.signals?.position?.takeProfitLevel || 0.015))} of target reached`
                      : `${formatPercent(Math.abs(calculateProfitPercentage()) / (trade.signals?.position?.stopLossLevel || 0.008))} of stop loss`
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trading Signals */}
        {trade.signals && <TradeSignals signals={trade.signals} />}
      </div>
    </div>
  );
}