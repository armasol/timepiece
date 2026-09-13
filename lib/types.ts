export type VerificationStatus = 'draft' | 'submitted' | 'owner_verified' | 'authenticated' | 'rejected';
export type WatchCondition = 'Unworn' | 'Excellent' | 'Very Good' | 'Good' | 'Fair';

export type TokenSnapshot = {
  holder_count?: number | null;
  market_cap_usd?: number | null;
  price_usd?: number | null;
  price_eth?: number | null;
  volume_24h_usd?: number | null;
  phase?: string | null;
};

export type WatchListing = {
  id: string;
  slug: string;
  brand: string;
  model: string;
  reference_number: string | null;
  year: number | null;
  condition: WatchCondition;
  appraised_value_usd: number;
  tokenized_percent: number;
  verification_status: VerificationStatus;
  owner_wallet: `0x${string}` | string | null;
  primary_image_url: string | null;
  verification_image_url: string | null;
  verification_code: string | null;
  pons_token_address: `0x${string}` | string | null;
  pons_curve_address: `0x${string}` | string | null;
  pons_launch_tx_hash?: string | null;
  pons_launch_block?: number | null;
  market_synced_block?: number | null;
  description: string | null;
  box_papers: boolean;
  serial_verified: boolean;
  published: boolean;
  signature?: string | null;
  market?: TokenSnapshot | null;
  images?: Array<{ id?: string; image_url: string; image_type: string }> | null;
  created_at: string;
  updated_at: string;
};

export type TokenMarket = {
  tokenAddress: string;
  name?: string;
  symbol?: string;
  holders?: number;
  marketCapUsd?: number | null;
  priceUsd?: number | null;
  priceEth?: number | null;
  volume24hUsd?: number | null;
  curveAddress?: string | null;
  phase?: string | null;
  phaseCode?: number | null;
  creatorTaxBps?: number | null;
  buybackEnabled?: boolean | null;
  candles?: Array<{ time: number; open: number; high: number; low: number; close: number }>;
};
