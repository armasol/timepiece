import {
  createPublicClient,
  http,
  parseAbi,
  parseAbiItem,
  zeroAddress,
  type Address,
  formatEther,
  formatUnits
} from 'viem';
import { robinhoodChain } from './robinhood';

export const PONS_FACTORY = (process.env.NEXT_PUBLIC_PONS_FACTORY_ADDRESS || process.env.PONS_FACTORY_ADDRESS || '0x7eD598BcEf8bd9Edd8C97A195C6d13f40801EC7e') as Address;
export const NATIVE_PAIR = zeroAddress;

export const publicClient = createPublicClient({
  chain: robinhoodChain,
  transport: http(process.env.NEXT_PUBLIC_ROBINHOOD_RPC_URL || 'https://rpc.mainnet.chain.robinhood.com', { timeout: 20_000 })
});

export const ponsFactoryAbi = parseAbi([
  'struct LaunchConfig { uint256 supply; uint256 curveFeeBps; uint256 phantomQuote; uint256 graduationThreshold; uint24 poolFee; int24 tickSpacing; bool enabled; }',
  'struct Socials { string twitter; string telegram; string discord; string website; string farcaster; }',
  'struct TokenParams { string name; string symbol; string logo; string description; Socials socials; address creatorFeeRecipient; uint16 creatorTaxBps; bool buybackEnabled; bytes32 expectedEconomics; bytes32 salt; }',
  'struct LaunchedToken { address token; address curve; address deployer; address creatorFeeRecipient; address pairToken; uint256 graduationThreshold; uint24 poolFee; int24 tickSpacing; uint16 creatorTaxBps; bool buybackEnabled; uint8 phase; uint256 sweptQuote; uint256 sweptTokens; uint256 sweptAt; bool exists; }',
  'function launchConfigCount() view returns (uint256)',
  'function getLaunchConfig(uint256 id) view returns (LaunchConfig)',
  'function previewLaunchEconomics(uint256 launchConfigId, address pairToken) view returns (bytes32)',
  'function launchFee() view returns (uint256)',
  'function maxCreatorTaxBps() view returns (uint16)',
  'function canLaunch(address launcher) view returns (bool)',
  'function getLaunchedToken(address token) view returns (LaunchedToken)',
  'function launchToken(TokenParams params, uint256 launchConfigId, address pairToken) payable returns (address token, address curve)',
  'event TokenLaunched(address indexed token, address indexed curve, address indexed deployer, address pairToken, uint256 launchConfigId, uint256 graduationThreshold)'
]);

export const ponsCurveAbi = parseAbi([
  'function buy(uint256 quoteIn, uint256 minTokensOut, address recipient) payable returns (uint256 tokensOut)',
  'function sell(uint256 tokensIn, uint256 minQuoteOut, address recipient) returns (uint256 quoteOut)',
  'function getReserves() view returns (uint256 quoteReserve, uint256 tokenReserve)',
  'function sellableTokens() view returns (uint256)',
  'function feeBps() view returns (uint256)',
  'function creatorTaxBps() view returns (uint256)',
  'function currentSnipeTaxBps(address recipient) view returns (uint256)',
  'function isNativeQuote() view returns (bool)',
  'function pairToken() view returns (address)',
  'event CurveBuy(address indexed buyer, address indexed recipient, uint256 quoteIn, uint256 tokensOut, uint256 fee, uint256 tax)',
  'event CurveSell(address indexed seller, address indexed recipient, uint256 tokensIn, uint256 quoteOut, uint256 fee, uint256 tax)'
]);

export const curveBuyEvent = parseAbiItem('event CurveBuy(address indexed buyer, address indexed recipient, uint256 quoteIn, uint256 tokensOut, uint256 fee, uint256 tax)');
export const curveSellEvent = parseAbiItem('event CurveSell(address indexed seller, address indexed recipient, uint256 tokensIn, uint256 quoteOut, uint256 fee, uint256 tax)');

export const erc20Abi = parseAbi([
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)'
]);

function serializeConfig(config: any) {
  return {
    supply: config.supply.toString(),
    curveFeeBps: config.curveFeeBps.toString(),
    phantomQuote: config.phantomQuote.toString(),
    graduationThreshold: config.graduationThreshold.toString(),
    poolFee: Number(config.poolFee),
    tickSpacing: Number(config.tickSpacing),
    enabled: Boolean(config.enabled)
  };
}

export async function getEnabledLaunchConfig(preferredId?: bigint) {
  const count = await publicClient.readContract({ address: PONS_FACTORY, abi: ponsFactoryAbi, functionName: 'launchConfigCount' });
  const ids = Array.from({ length: Number(count) }, (_, i) => BigInt(i));
  if (!ids.length) throw new Error('Pons currently exposes no launch configs.');

  const configs = await Promise.all(ids.map(async (id) => ({
    id,
    config: await publicClient.readContract({ address: PONS_FACTORY, abi: ponsFactoryAbi, functionName: 'getLaunchConfig', args: [id] })
  })));

  if (preferredId != null) {
    const preferred = configs.find((item) => item.id === preferredId && item.config.enabled);
    if (preferred) return preferred;
  }
  const firstEnabled = configs.find((item) => item.config.enabled);
  if (!firstEnabled) throw new Error('Pons has no enabled launch config right now.');
  return firstEnabled;
}

export async function getPonsStatus(launcher?: Address) {
  const envPreferred = process.env.PONS_DEFAULT_LAUNCH_CONFIG_ID;
  const preferredId = envPreferred != null && /^\d+$/.test(envPreferred) ? BigInt(envPreferred) : undefined;
  const [{ id: launchConfigId, config }, launchFee, maxCreatorTaxBps] = await Promise.all([
    getEnabledLaunchConfig(preferredId),
    publicClient.readContract({ address: PONS_FACTORY, abi: ponsFactoryAbi, functionName: 'launchFee' }),
    publicClient.readContract({ address: PONS_FACTORY, abi: ponsFactoryAbi, functionName: 'maxCreatorTaxBps' })
  ]);
  const [economics, canLaunch] = await Promise.all([
    publicClient.readContract({ address: PONS_FACTORY, abi: ponsFactoryAbi, functionName: 'previewLaunchEconomics', args: [launchConfigId, NATIVE_PAIR] }),
    launcher ? publicClient.readContract({ address: PONS_FACTORY, abi: ponsFactoryAbi, functionName: 'canLaunch', args: [launcher] }) : Promise.resolve(null)
  ]);
  return {
    factory: PONS_FACTORY,
    launchConfigId: launchConfigId.toString(),
    launchFeeWei: launchFee.toString(),
    launchFeeEth: formatEther(launchFee),
    maxCreatorTaxBps: Number(maxCreatorTaxBps),
    expectedEconomics: economics,
    config: serializeConfig(config),
    canLaunch
  };
}

export async function getPonsLaunch(token: Address) {
  const launch = await publicClient.readContract({ address: PONS_FACTORY, abi: ponsFactoryAbi, functionName: 'getLaunchedToken', args: [token] });
  if (!launch.exists) return null;
  return {
    token: launch.token,
    curve: launch.curve,
    deployer: launch.deployer,
    creatorFeeRecipient: launch.creatorFeeRecipient,
    pairToken: launch.pairToken,
    graduationThreshold: launch.graduationThreshold.toString(),
    poolFee: Number(launch.poolFee),
    tickSpacing: Number(launch.tickSpacing),
    creatorTaxBps: Number(launch.creatorTaxBps),
    buybackEnabled: Boolean(launch.buybackEnabled),
    phase: Number(launch.phase),
    phaseLabel: ['curve', 'swept', 'pool', 'rescued'][Number(launch.phase)] || 'unknown',
    sweptQuote: launch.sweptQuote.toString(),
    sweptTokens: launch.sweptTokens.toString(),
    sweptAt: launch.sweptAt.toString()
  };
}

export async function getCurveSpotPriceEth(curve: Address) {
  const [quoteReserve, tokenReserve] = await publicClient.readContract({ address: curve, abi: ponsCurveAbi, functionName: 'getReserves' });
  if (tokenReserve === 0n) return null;
  const quote = Number(formatUnits(quoteReserve, 18));
  const tokens = Number(formatUnits(tokenReserve, 18));
  if (!Number.isFinite(quote) || !Number.isFinite(tokens) || tokens <= 0) return null;
  return quote / tokens;
}

export async function quoteCurveBuy(curve: Address, quoteIn: bigint, recipient: Address) {
  const [reserves, sellable, feeBps, creatorTaxBps, rawSnipeBps] = await Promise.all([
    publicClient.readContract({ address: curve, abi: ponsCurveAbi, functionName: 'getReserves' }),
    publicClient.readContract({ address: curve, abi: ponsCurveAbi, functionName: 'sellableTokens' }),
    publicClient.readContract({ address: curve, abi: ponsCurveAbi, functionName: 'feeBps' }),
    publicClient.readContract({ address: curve, abi: ponsCurveAbi, functionName: 'creatorTaxBps' }),
    publicClient.readContract({ address: curve, abi: ponsCurveAbi, functionName: 'currentSnipeTaxBps', args: [recipient] })
  ]);
  const [quoteReserve, tokenReserve] = reserves;
  const BPS = 10_000n;
  const ceilDiv = (a: bigint, b: bigint) => (a + b - 1n) / b;
  const fee = ceilDiv(quoteIn * feeBps, BPS);
  const creatorTax = ceilDiv(quoteIn * creatorTaxBps, BPS);
  const maxSnipe = BPS > feeBps + creatorTaxBps + 100n ? BPS - feeBps - creatorTaxBps - 100n : 0n;
  const snipeBps = rawSnipeBps > maxSnipe ? maxSnipe : rawSnipeBps;
  const snipeTax = ceilDiv(quoteIn * snipeBps, BPS);
  const netQuote = quoteIn > fee + creatorTax + snipeTax ? quoteIn - fee - creatorTax - snipeTax : 0n;
  const rawOut = netQuote === 0n ? 0n : (netQuote * tokenReserve) / (quoteReserve + netQuote);
  const tokensOut = rawOut > sellable ? sellable : rawOut;
  return { tokensOut, fee, creatorTax, snipeTax, feeBps, creatorTaxBps, snipeBps };
}

export function makeSymbol(brand: string, reference?: string | null) {
  const base = `${brand}${reference || ''}`.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 9);
  return base || 'TIME';
}
