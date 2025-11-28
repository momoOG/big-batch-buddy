import { useReadContract } from 'wagmi';
import { CONTRACTS, PRESALE_ABI } from '@/config/contracts';

const presaleAddress = CONTRACTS.PRESALE as `0x${string}`;

export function usePresaleData() {
  const { data: saleActive } = useReadContract({
    address: presaleAddress,
    abi: PRESALE_ABI,
    functionName: 'saleActive',
  });

  const { data: totalRaisedRaw, refetch: refetchRaised } = useReadContract({
    address: presaleAddress,
    abi: PRESALE_ABI,
    functionName: 'totalRaised',
  });

  const { data: hardCapRaw } = useReadContract({
    address: presaleAddress,
    abi: PRESALE_ABI,
    functionName: 'HARD_CAP',
  });

  const { data: tokensSoldRaw, refetch: refetchSold } = useReadContract({
    address: presaleAddress,
    abi: PRESALE_ABI,
    functionName: 'tokensSold',
  });

  const { data: maxPresaleTokensRaw } = useReadContract({
    address: presaleAddress,
    abi: PRESALE_ABI,
    functionName: 'MAX_PRESALE_TOKENS',
  });

  const { data: tokensPerUsdRaw } = useReadContract({
    address: presaleAddress,
    abi: PRESALE_ABI,
    functionName: 'TOKENS_PER_USD',
  });

  const { data: stableDecimalsRaw } = useReadContract({
    address: presaleAddress,
    abi: PRESALE_ABI,
    functionName: 'STABLE_DECIMALS',
  });

  const stableDecimals = stableDecimalsRaw ?? 6;
  const stableDivisor = Math.pow(10, stableDecimals);
  const tokenDivisor = Math.pow(10, 18);

  const totalRaised = totalRaisedRaw ? Number(totalRaisedRaw) / stableDivisor : 0;
  const hardCap = hardCapRaw ? Number(hardCapRaw) / stableDivisor : 7000;
  const tokensSold = tokensSoldRaw ? Number(tokensSoldRaw) / tokenDivisor : 0;
  const maxPresaleTokens = maxPresaleTokensRaw ? Number(maxPresaleTokensRaw) / tokenDivisor : 50000000;
  const tokensPerUsdNum = tokensPerUsdRaw ? Number(tokensPerUsdRaw) : 7142;

  const pricePerToken = tokensPerUsdNum > 0 ? 1 / tokensPerUsdNum : 0;
  const raisedPercent = hardCap > 0 ? (totalRaised / hardCap) * 100 : 0;
  const tokensSoldPercent = maxPresaleTokens > 0 ? (tokensSold / maxPresaleTokens) * 100 : 0;
  const isSoldOut = totalRaised >= hardCap || tokensSold >= maxPresaleTokens;

  const refetch = () => {
    refetchRaised();
    refetchSold();
  };

  return {
    saleActive: saleActive ?? false,
    totalRaised,
    hardCap,
    tokensSold,
    maxPresaleTokens,
    tokensPerUsd: tokensPerUsdNum,
    stableDecimals,
    pricePerToken,
    raisedPercent,
    tokensSoldPercent,
    isSoldOut,
    isLoading: false,
    refetch,
  };
}
