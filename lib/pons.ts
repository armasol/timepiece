import { createPublicClient, http, parseAbi, zeroAddress, Address, formatEther } from 'viem';
import { robinhoodChain } from './robinhood';

export const PONS_FACTORY = (process.env.PONS_FACTORY_ADDRESS || '0x7eD598BcEf8bd9Edd8C97A195C6d13f40801EC7e') as Address;
export const DEFAULT_LAUNCH_CONFIG_ID = BigInt(process.env.PONS_DEFAULT_LAUNCH_CONFIG_ID || '0');
export const NATIVE_PAIR = zeroAddress;

export const publicClient = createPublicClient({
  chain: robinhoodChain,
  transport: http(process.env.NEXT_PUBLIC_ROBINHOOD_RPC_URL || 'https://rpc.mainnet.chain.robinhood.com')
});

export const ponsFactoryAbi = parseAbi([
  'struct LaunchConfig { uint256 supply; uint256 curveFeeBps; uint256 phantomQuote; uint256 graduationThreshold; uint24 poolFee; int24 tickSpacing; bool enabled; }',
  'struct Socials { string twitter; string telegram; string discord; string website; string farcaster; }',
  'struct TokenParams { string name; string symbol; string logo; string description; Socials socials; address creatorFeeRecipient; uint16 creatorTaxBps; bool buybackEnabled; bytes32 expectedEconomics; bytes32 salt; }',
  'function launchConfigCount() view returns (uint256)',
  'function getLaunchConfig(uint256 id) view returns (LaunchConfig)',
  'function previewLaunchEconomics(uint256 launchConfigId, address pairToken) view returns (bytes32)',
  'function launchFee() view returns (uint256)',
  'function maxCreatorTaxBps() view returns (uint16)',
  'function canLaunch(address launcher) view returns (bool)',
  'function launchToken(TokenParams params, uint256 launchConfigId, address pairToken) payable returns (address token, address curve)'
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
  'event CurveBuy(address indexed buyer, address indexed recipient, uint256 quoteIn, uint256 tokensOut, uint256 fee, uint256 creatorTax)',
  'event CurveSell(address indexed seller, address indexed recipient, uint256 tokensIn, uint256 quoteOut, uint256 fee, uint256 creatorTax)'
]);

export async function getPonsStatus(launcher?: Address) {
  const [count, launchFee, maxCreatorTaxBps, economics] = await Promise.all([
    publicClient.readContract({ address: PONS_FACTORY, abi: ponsFactoryAbi, functionName: 'launchConfigCount' }),
    publicClient.readContract({ address: PONS_FACTORY, abi: ponsFactoryAbi, functionName: 'launchFee' }),
    publicClient.readContract({ address: PONS_FACTORY, abi: ponsFactoryAbi, functionName: 'maxCreatorTaxBps' }),
    publicClient.readContract({ address: PONS_FACTORY, abi: ponsFactoryAbi, functionName: 'previewLaunchEconomics', args: [DEFAULT_LAUNCH_CONFIG_ID, NATIVE_PAIR] })
  ]);
  const config = await publicClient.readContract({ address: PONS_FACTORY, abi: ponsFactoryAbi, functionName: 'getLaunchConfig', args: [DEFAULT_LAUNCH_CONFIG_ID] });
  const canLaunch = launcher ? await publicClient.readContract({ address: PONS_FACTORY, abi: ponsFactoryAbi, functionName: 'canLaunch', args: [launcher] }) : null;
  return { factory: PONS_FACTORY, launchConfigCount: Number(count), launchFeeWei: launchFee.toString(), launchFeeEth: formatEther(launchFee), maxCreatorTaxBps: Number(maxCreatorTaxBps), expectedEconomics: economics, config, canLaunch };
}

export function makeSymbol(brand: string, reference?: string | null) {
  const base = `${brand}${reference || ''}`.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 9);
  return base || 'TIME';
}
