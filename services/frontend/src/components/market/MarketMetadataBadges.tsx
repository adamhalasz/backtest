import { Badge } from '@/components/ui/badge';
import { ASSET_CLASSES, EXCHANGES, MARKET_DATA_PROVIDERS } from '@/lib/constants';
import { resolveStoredAssetClass, resolveStoredProvider } from '@/lib/market';
import type { MarketAssetClass, MarketDataProviderId } from '@/lib/market';

type MarketMetadataParameters = {
  assetClass?: MarketAssetClass;
  provider?: MarketDataProviderId;
};

type MarketMetadataBadgesProps = {
  symbol: string;
  exchange: string;
  parameters?: MarketMetadataParameters;
  className?: string;
};

const getAssetClassLabel = (assetClass: MarketAssetClass) => {
  return ASSET_CLASSES.find((item) => item.value === assetClass)?.label ?? assetClass;
};

const getProviderLabel = (provider: MarketDataProviderId) => {
  return MARKET_DATA_PROVIDERS.find((item) => item.value === provider)?.label ?? provider;
};

const getExchangeLabel = (exchangeId: string) => {
  return EXCHANGES.find((item) => item.id === exchangeId)?.name ?? exchangeId;
};

export function MarketMetadataBadges({ symbol, exchange, parameters, className }: MarketMetadataBadgesProps) {
  const assetClass = resolveStoredAssetClass(parameters, symbol);
  const provider = resolveStoredProvider(parameters, symbol);

  return (
    <div className={className ?? 'flex flex-wrap gap-2'}>
      <Badge variant="secondary">{getAssetClassLabel(assetClass)}</Badge>
      <Badge variant="outline">{getProviderLabel(provider)}</Badge>
      <Badge variant="outline">{getExchangeLabel(exchange)}</Badge>
    </div>
  );
}
