import { WatchListing } from './types';

export const topBrands = [
  'Rolex', 'Patek Philippe', 'Audemars Piguet', 'Omega', 'Cartier',
  'Richard Mille', 'Vacheron Constantin', 'Tudor', 'IWC', 'Breitling'
];

export const demoWatches: WatchListing[] = [
  {
    id: 'demo-1', slug: 'rolex-gmt-master-ii-126710blro', brand: 'Rolex', model: 'GMT-Master II Pepsi', reference_number: '126710BLRO', year: 2021,
    condition: 'Excellent', appraised_value_usd: 19500, tokenized_percent: 40, verification_status: 'authenticated', owner_wallet: '0x0000000000000000000000000000000000000000',
    primary_image_url: null, verification_image_url: null, verification_code: 'TP-7419-K', pons_token_address: null, pons_curve_address: null,
    description: 'A verified stainless-steel travel watch with box, papers and recent appraisal.', box_papers: true, serial_verified: true, published: true,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString()
  },
  {
    id: 'demo-2', slug: 'patek-philippe-nautilus-5711', brand: 'Patek Philippe', model: 'Nautilus', reference_number: '5711/1A', year: 2019,
    condition: 'Very Good', appraised_value_usd: 96500, tokenized_percent: 25, verification_status: 'owner_verified', owner_wallet: '0x0000000000000000000000000000000000000000',
    primary_image_url: null, verification_image_url: null, verification_code: 'TP-2218-N', pons_token_address: null, pons_curve_address: null,
    description: 'An iconic integrated-bracelet sports watch listed for fractional market access.', box_papers: true, serial_verified: false, published: true,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString()
  },
  {
    id: 'demo-3', slug: 'audemars-piguet-royal-oak-15500st', brand: 'Audemars Piguet', model: 'Royal Oak', reference_number: '15500ST', year: 2020,
    condition: 'Excellent', appraised_value_usd: 43800, tokenized_percent: 35, verification_status: 'authenticated', owner_wallet: '0x0000000000000000000000000000000000000000',
    primary_image_url: null, verification_image_url: null, verification_code: 'TP-9041-A', pons_token_address: null, pons_curve_address: null,
    description: 'A steel Royal Oak with visible provenance, appraised and prepared for token trading.', box_papers: true, serial_verified: true, published: true,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString()
  }
];
