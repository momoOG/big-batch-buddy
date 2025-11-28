import { useAccount, useReadContract } from 'wagmi';
import { CONTRACTS, ERC20_ABI } from '@/config/contracts';

export type StableType = 'USDC' | 'USDT';

export function useStableToken(selected: StableType) {
  const { address: userAddress } = useAccount();

  const tokenAddress = (selected === 'USDC' ? CONTRACTS.USDC : CONTRACTS.USDT) as `0x${string}`;
  const presaleAddress = CONTRACTS.PRESALE as `0x${string}`;

  const { data: balanceRaw, refetch: refetchBalance } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: userAddress ? [userAddress] : undefined,
    query: { enabled: !!userAddress },
  });

  const { data: allowanceRaw, refetch: refetchAllowance } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: userAddress ? [userAddress, presaleAddress] : undefined,
    query: { enabled: !!userAddress },
  });

  const decimals = 6;
  const divisor = Math.pow(10, decimals);

  const balance = balanceRaw ? Number(balanceRaw) / divisor : 0;
  const allowance = allowanceRaw ? Number(allowanceRaw) / divisor : 0;

  const refetch = () => {
    refetchBalance();
    refetchAllowance();
  };

  return {
    tokenAddress,
    symbol: selected,
    decimals,
    balance,
    balanceRaw: balanceRaw ?? BigInt(0),
    allowance,
    allowanceRaw: allowanceRaw ?? BigInt(0),
    isLoading: false,
    refetch,
  };
}
