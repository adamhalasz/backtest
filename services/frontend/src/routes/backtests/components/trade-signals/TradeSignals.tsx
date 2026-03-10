import React from 'react';
import { LineChart, BarChart4, Target, Clock, Scale } from 'lucide-react';
import { CheckCircle2, XCircle } from 'lucide-react';

interface TradeSignalsProps {
  signals: {
    rsi?: { value: number; threshold: number };
    macd?: { value: number; signal: number };
    volatility?: number;
    session?: { hour: number; market: string };
    position?: { size: number; risk: number };
  };
}

interface SignalTooltipProps {
  children: React.ReactNode;
  content: string;
}

function SignalTooltip({ children, content }: SignalTooltipProps) {
  return (
    <div className="group relative">
      {children}
      <div className="invisible group-hover:visible absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-80 p-3 bg-gray-900 text-white text-sm rounded-lg shadow-lg z-10">
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
        {content}
      </div>
    </div>
  );
}

export function TradeSignals({ signals }: TradeSignalsProps) {
  if (!signals) return null;

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  return (
    <div className="border-t border-gray-200 pt-4">
      <h4 className="text-sm font-medium text-gray-700 mb-3">Applied Trading Signals</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* RSI Signal */}
        {signals.rsi && (
          <SignalTooltip content={
            `Current RSI: ${formatNumber(signals.rsi.value)}
             Threshold: ${signals.rsi.threshold}
             Status: ${signals.rsi.value < signals.rsi.threshold ? 'Oversold (Buy Signal)' : 'Overbought (Sell Signal)'}`
          }>
            <div className={`flex items-center justify-between p-2 ${
              signals.rsi.value < signals.rsi.threshold ? 'bg-green-50' : 'bg-red-50'
            } rounded-lg`}>
              <LineChart className="w-5 h-5 mr-2" />
              <span className="text-sm">RSI Signal</span>
              {signals.rsi.value < signals.rsi.threshold ? 
                <CheckCircle2 className="w-4 h-4 text-green-600" /> :
                <XCircle className="w-4 h-4 text-red-600" />
              }
            </div>
          </SignalTooltip>
        )}
        
        {/* MACD Signal */}
        {signals.macd && (
          <SignalTooltip content={
            `MACD Line: ${formatNumber(signals.macd.value)}
             Signal Line: ${formatNumber(signals.macd.signal)}
             Status: ${signals.macd.value > signals.macd.signal ? 'Bullish Crossover' : 'Bearish Crossover'}`
          }>
            <div className={`flex items-center justify-between p-2 ${
              signals.macd.value > signals.macd.signal ? 'bg-green-50' : 'bg-red-50'
            } rounded-lg`}>
              <BarChart4 className="w-5 h-5 mr-2" />
              <span className="text-sm">MACD Crossover</span>
              {signals.macd.value > signals.macd.signal ? 
                <CheckCircle2 className="w-4 h-4 text-green-600" /> :
                <XCircle className="w-4 h-4 text-red-600" />
              }
            </div>
          </SignalTooltip>
        )}
        
        {/* Position Sizing */}
        {signals.position && (
          <SignalTooltip content={
            `Position Size: ${formatNumber(signals.position.size)}
             Risk per Trade: ${formatNumber(signals.position.risk)}%
             Status: ${signals.position.risk <= 2 ? 'Within Risk Limits' : 'Exceeds Risk Limits'}`
          }>
            <div className={`flex items-center justify-between p-2 ${
              signals.position.risk <= 2 ? 'bg-green-50' : 'bg-red-50'
            } rounded-lg`}>
              <Target className="w-5 h-5 mr-2" />
              <span className="text-sm">Position Sizing</span>
              {signals.position.risk <= 2 ? 
                <CheckCircle2 className="w-4 h-4 text-green-600" /> :
                <XCircle className="w-4 h-4 text-red-600" />
              }
            </div>
          </SignalTooltip>
        )}
        
        {/* Trading Session */}
        {signals.session && (
          <SignalTooltip content={
            `Market: ${signals.session.market}
             Hour: ${signals.session.hour}:00
             Status: ${signals.session.hour >= 8 && signals.session.hour < 16 ? 'Active Trading Hours' : 'Outside Trading Hours'}`
          }>
            <div className={`flex items-center justify-between p-2 ${
              signals.session.hour >= 8 && signals.session.hour < 16 ? 'bg-green-50' : 'bg-red-50'
            } rounded-lg`}>
              <Clock className="w-5 h-5 mr-2" />
              <span className="text-sm">Trading Session</span>
              {signals.session.hour >= 8 && signals.session.hour < 16 ? 
                <CheckCircle2 className="w-4 h-4 text-green-600" /> :
                <XCircle className="w-4 h-4 text-red-600" />
              }
            </div>
          </SignalTooltip>
        )}
        
        {/* Volatility */}
        {signals.volatility && (
          <SignalTooltip content={
            `Current Volatility: ${(signals.volatility * 100).toFixed(2)}%
             Threshold: 2%
             Status: ${signals.volatility <= 0.02 ? 'Normal Volatility' : 'High Volatility'}`
          }>
            <div className={`flex items-center justify-between p-2 ${
              signals.volatility <= 0.02 ? 'bg-green-50' : 'bg-red-50'
            } rounded-lg`}>
              <Scale className="w-5 h-5 mr-2" />
              <span className="text-sm">Volatility</span>
              {signals.volatility <= 0.02 ? 
                <CheckCircle2 className="w-4 h-4 text-green-600" /> :
                <XCircle className="w-4 h-4 text-red-600" />
              }
            </div>
          </SignalTooltip>
        )}
      </div>
    </div>
  );
}