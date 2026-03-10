import React from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { CURRENCIES, EXCHANGES, TIMEFRAMES } from '@/lib/constants';
import { STRATEGIES } from '@/lib/strategies';
import { EntryFrequency, type Bot } from '@/lib/types';
import { useCreateBot } from './bots-hooks';

type CreateBotFormData = {
	name: string;
	baseCurrency: string;
	strategy: string;
	targetCurrency: string;
	exchange: string;
	timeframe: string;
	entryFrequency: EntryFrequency;
	takeProfitLevel: number;
	stopLossLevel: number;
	rsiOverbought: number;
	rsiOversold: number;
	macdFastPeriod: number;
	macdSlowPeriod: number;
	macdSignalPeriod: number;
	bollingerPeriod: number;
	bollingerDeviation: number;
	emaPeriod: number;
	vwapPeriod: number;
	atrPeriod: number;
	atrMultiplier: number;
};

export function CreateBotPage() {
	const [, navigate] = useLocation();
	const createBot = useCreateBot();
	const defaultStrategy = STRATEGIES[0];
	const defaultConfig = defaultStrategy.getDefaultConfig();
	const [formData, setFormData] = React.useState<CreateBotFormData>({
		name: '',
		baseCurrency: 'EUR',
		strategy: defaultStrategy.name,
		targetCurrency: 'USD',
		exchange: EXCHANGES[0].id,
		timeframe: '1d',
		entryFrequency: defaultStrategy.defaultFrequency,
		takeProfitLevel: defaultConfig.takeProfitLevel,
		stopLossLevel: defaultConfig.stopLossLevel,
		rsiOverbought: 65,
		rsiOversold: 35,
		macdFastPeriod: 12,
		macdSlowPeriod: 26,
		macdSignalPeriod: 9,
		bollingerPeriod: 20,
		bollingerDeviation: 2,
		emaPeriod: 14,
		vwapPeriod: 14,
		atrPeriod: 14,
		atrMultiplier: 2,
	});

	const handleStrategyChange = (value: string) => {
		const strategy = STRATEGIES.find((item) => item.name === value);
		if (!strategy) {
			return;
		}

		const config = strategy.getDefaultConfig();
		setFormData((current) => ({
			...current,
			strategy: value,
			entryFrequency: strategy.defaultFrequency,
			takeProfitLevel: config.takeProfitLevel,
			stopLossLevel: config.stopLossLevel,
		}));
	};

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault();

		const payload: Omit<Bot, 'id' | 'created_at' | 'updated_at' | 'last_trade_at' | 'total_trades' | 'win_rate' | 'total_profit'> = {
			name: formData.name,
			strategy: formData.strategy,
			symbol: `${formData.baseCurrency}/${formData.targetCurrency}`,
			exchange: formData.exchange,
			status: 'paused',
			parameters: {
				entryFrequency: formData.entryFrequency,
				timeframe: formData.timeframe,
				takeProfitLevel: formData.takeProfitLevel,
				stopLossLevel: formData.stopLossLevel,
				rsiOverbought: formData.rsiOverbought,
				rsiOversold: formData.rsiOversold,
				macdFastPeriod: formData.macdFastPeriod,
				macdSlowPeriod: formData.macdSlowPeriod,
				macdSignalPeriod: formData.macdSignalPeriod,
				bollingerPeriod: formData.bollingerPeriod,
				bollingerDeviation: formData.bollingerDeviation,
				emaPeriod: formData.emaPeriod,
				vwapPeriod: formData.vwapPeriod,
				atrPeriod: formData.atrPeriod,
				atrMultiplier: formData.atrMultiplier,
			},
		};

		await createBot.run(payload);
		navigate('/bots');
	};

	return (
		<div className="max-w-4xl mx-auto">
			<div className="flex items-center gap-4 mb-6">
				<Button onClick={() => navigate('/bots')} variant="outline">
					<ArrowLeft className="w-4 h-4 mr-2" />
					Back
				</Button>
				<h1 className="text-2xl font-bold">Create New Bot</h1>
			</div>

			{createBot.error ? (
				<div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
					{createBot.error}
				</div>
			) : null}

			<form onSubmit={handleSubmit} className="space-y-8 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div className="col-span-2">
						<Label>Bot Name</Label>
						<input
							type="text"
							value={formData.name}
							onChange={(event) => setFormData((current) => ({ ...current, name: event.target.value }))}
							placeholder="Enter a name for your bot"
							className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
							required
						/>
					</div>

					<div>
						<Label>Strategy</Label>
						<Select value={formData.strategy} onValueChange={handleStrategyChange}>
							<SelectTrigger>
								<SelectValue placeholder="Select a strategy" />
							</SelectTrigger>
							<SelectContent>
								{STRATEGIES.map((strategy) => (
									<SelectItem key={strategy.name} value={strategy.name}>
										{strategy.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<p className="mt-1 text-sm text-gray-500">{STRATEGIES.find((item) => item.name === formData.strategy)?.description}</p>
					</div>

					<div>
						<Label>Base Currency</Label>
						<Select value={formData.baseCurrency} onValueChange={(value) => setFormData((current) => ({ ...current, baseCurrency: value }))}>
							<SelectTrigger>
								<SelectValue placeholder="Select base currency" />
							</SelectTrigger>
							<SelectContent>
								{CURRENCIES.map((currency) => (
									<SelectItem key={currency.code} value={currency.code}>
										{currency.name} ({currency.code})
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div>
						<Label>Target Currency</Label>
						<Select value={formData.targetCurrency} onValueChange={(value) => setFormData((current) => ({ ...current, targetCurrency: value }))}>
							<SelectTrigger>
								<SelectValue placeholder="Select target currency" />
							</SelectTrigger>
							<SelectContent>
								{CURRENCIES.map((currency) => (
									<SelectItem key={currency.code} value={currency.code} disabled={currency.code === formData.baseCurrency}>
										{currency.name} ({currency.code})
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div>
						<Label>Exchange</Label>
						<Select value={formData.exchange} onValueChange={(value) => setFormData((current) => ({ ...current, exchange: value }))}>
							<SelectTrigger>
								<SelectValue placeholder="Select exchange" />
							</SelectTrigger>
							<SelectContent>
								{EXCHANGES.map((exchange) => (
									<SelectItem key={exchange.id} value={exchange.id}>
										{exchange.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div>
						<Label>Timeframe</Label>
						<Select value={formData.timeframe} onValueChange={(value) => setFormData((current) => ({ ...current, timeframe: value }))}>
							<SelectTrigger>
								<SelectValue placeholder="Select timeframe" />
							</SelectTrigger>
							<SelectContent>
								{TIMEFRAMES.map((timeframe) => (
									<SelectItem key={timeframe.value} value={timeframe.value}>
										{timeframe.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div>
						<Label>Entry Frequency</Label>
						<Select
							value={formData.entryFrequency}
							onValueChange={(value) => setFormData((current) => ({ ...current, entryFrequency: value as EntryFrequency }))}
						>
							<SelectTrigger>
								<SelectValue placeholder="Select entry frequency" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value={EntryFrequency.SCALPING}>Scalping</SelectItem>
								<SelectItem value={EntryFrequency.DAILY}>Daily Trading</SelectItem>
								<SelectItem value={EntryFrequency.WEEKLY}>Weekly Trading</SelectItem>
								<SelectItem value={EntryFrequency.MONTHLY}>Monthly Trading</SelectItem>
								<SelectItem value={EntryFrequency.QUARTERLY}>Quarterly Trading</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="col-span-2">
						<Label>Strategy Parameters</Label>
						<div className="mt-4 space-y-6 bg-gray-50 p-6 rounded-lg">
							{STRATEGIES.find((strategy) => strategy.name === formData.strategy)?.indicators.map((indicator, index) => (
								<React.Fragment key={indicator}>
									{index > 0 ? <Separator /> : null}
									<div className="space-y-4">
										<h3 className="font-medium text-gray-900">{indicator} Parameters</h3>
										{indicator === 'RSI' ? (
											<>
												<div>
													<div className="flex justify-between mb-2">
														<Label>RSI Overbought Level</Label>
														<span className="text-sm text-gray-600">{formData.rsiOverbought}</span>
													</div>
													<Slider value={[formData.rsiOverbought]} onValueChange={([value]) => setFormData((current) => ({ ...current, rsiOverbought: value }))} min={50} max={80} step={1} className="w-full" />
												</div>
												<div>
													<div className="flex justify-between mb-2">
														<Label>RSI Oversold Level</Label>
														<span className="text-sm text-gray-600">{formData.rsiOversold}</span>
													</div>
													<Slider value={[formData.rsiOversold]} onValueChange={([value]) => setFormData((current) => ({ ...current, rsiOversold: value }))} min={20} max={50} step={1} className="w-full" />
												</div>
											</>
										) : null}
									</div>
								</React.Fragment>
							))}
						</div>
					</div>
				</div>

				<div className="flex justify-end">
					<Button type="submit" disabled={createBot.isLoading}>{createBot.isLoading ? 'Creating...' : 'Create Bot'}</Button>
				</div>
			</form>
		</div>
	);
}