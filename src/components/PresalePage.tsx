import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { usePresaleData } from '@/hooks/usePresaleData';
import { useStableToken, StableType } from '@/hooks/useStableToken';
import { CONTRACTS, PRESALE_ABI, ERC20_ABI, PRESALE_START_TIME } from '@/config/contracts';
import { formatNumber, formatUsd, formatLock, parseTokenAmount } from '@/lib/formatters';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { PULSECHAIN_CONFIG } from '@/config';
import { CountdownTimer } from '@/components/CountdownTimer';
import { useCountdown } from '@/hooks/useCountdown';

const MaxUint256 = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');

export function PresalePage() {
  const { address, isConnected, chainId } = useAccount();
  const { toast } = useToast();
  const [selectedStable, setSelectedStable] = useState<StableType>('USDC');
  const [amount, setAmount] = useState('');

  const presaleData = usePresaleData();
  const stableToken = useStableToken(selectedStable);
  const countdown = useCountdown(PRESALE_START_TIME);
  const isPresaleOpen = countdown.isExpired;

  const { writeContract: approve, data: approveHash, isPending: isApproving } = useWriteContract();
  const { writeContract: buy, data: buyHash, isPending: isBuying } = useWriteContract();

  const { isLoading: isApproveConfirming, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({
    hash: approveHash,
  });

  const { isLoading: isBuyConfirming, isSuccess: isBuySuccess } = useWaitForTransactionReceipt({
    hash: buyHash,
  });

  const isWrongNetwork = isConnected && chainId !== PULSECHAIN_CONFIG.id;
  const inputAmount = parseFloat(amount) || 0;
  const inputAmountRaw = parseTokenAmount(amount, stableToken.decimals);
  const tokensToReceive = inputAmount * presaleData.tokensPerUsd;
  const needsApproval = stableToken.allowance < inputAmount && inputAmount > 0;
  const insufficientBalance = inputAmount > stableToken.balance;

  // Refetch after successful transactions
  if (isApproveSuccess) {
    stableToken.refetch();
    toast({ title: `${selectedStable} approved successfully!` });
  }

  if (isBuySuccess) {
    presaleData.refetch();
    stableToken.refetch();
    setAmount('');
    toast({ title: `Successfully purchased ${formatNumber(tokensToReceive, 0)} LOCK!` });
  }

  const handleApprove = () => {
    approve({
      address: stableToken.tokenAddress as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [CONTRACTS.PRESALE as `0x${string}`, MaxUint256],
    }, {
      onError: (error) => {
        toast({ title: 'Approval failed', description: error.message, variant: 'destructive' });
      },
    });
  };

  const handleBuy = () => {
    const functionName = selectedStable === 'USDC' ? 'buyWithUSDC' : 'buyWithUSDT';
    buy({
      address: CONTRACTS.PRESALE as `0x${string}`,
      abi: PRESALE_ABI,
      functionName,
      args: [inputAmountRaw],
    }, {
      onError: (error) => {
        toast({ title: 'Purchase failed', description: error.message, variant: 'destructive' });
      },
    });
  };

  const getStatusBadge = () => {
    if (!isPresaleOpen) {
      return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">Coming Soon</span>;
    }
    if (!presaleData.saleActive) {
      return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-muted text-muted-foreground">Not Active</span>;
    }
    if (presaleData.isSoldOut) {
      return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-purple-500 to-cyan-500 text-white">Sold Out</span>;
    }
    return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-400 border border-green-500/30">Live</span>;
  };

  const isProcessing = isApproving || isApproveConfirming || isBuying || isBuyConfirming;

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Presale Info Card */}
        <div className="bg-card border border-border rounded-2xl p-6 lg:p-8 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Lockify Presale
            </h2>
            {getStatusBadge()}
          </div>
          <p className="text-muted-foreground mb-6">
            Secure your allocation of LOCK before launch.
          </p>

          {/* Countdown Timer */}
          {!isPresaleOpen && (
            <div className="mb-6 p-4 bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 rounded-xl">
              <CountdownTimer targetTime={PRESALE_START_TIME} />
            </div>
          )}

          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <span className="text-muted-foreground">Price per LOCK</span>
              <span className="font-mono text-foreground">~${presaleData.pricePerToken.toFixed(6)}</span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <span className="text-muted-foreground">Hardcap</span>
              <span className="font-mono text-foreground">{formatUsd(presaleData.hardCap)}</span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <span className="text-muted-foreground">Total Raised</span>
              <span className="font-mono text-foreground">
                {formatUsd(presaleData.totalRaised)} / {formatUsd(presaleData.hardCap)}
              </span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <span className="text-muted-foreground">Tokens Sold</span>
              <span className="font-mono text-foreground">
                {formatNumber(presaleData.tokensSold, 0)} / {formatNumber(presaleData.maxPresaleTokens, 0)}
              </span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <span className="text-muted-foreground">Rate</span>
              <span className="font-mono text-foreground">1 USD = {formatNumber(presaleData.tokensPerUsd, 0)} LOCK</span>
            </div>

            {/* Progress Bar */}
            <div className="pt-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Progress</span>
                <span className="text-foreground font-semibold">{formatNumber(presaleData.raisedPercent, 1)}%</span>
              </div>
              <div className="h-3 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
                  style={{ width: `${Math.min(presaleData.raisedPercent, 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {formatNumber(presaleData.raisedPercent, 1)}% of hardcap reached
              </p>
            </div>

            {/* Estimated FDV */}
            <div className="pt-4 border-t border-border/50">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Estimated FDV</span>
                <span className="font-mono text-foreground">
                  {formatUsd(100000000 * presaleData.pricePerToken)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Buy Card */}
        <div className="bg-card border border-border rounded-2xl p-6 lg:p-8 shadow-lg">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
            Buy LOCK
          </h2>
          <p className="text-muted-foreground mb-6">
            Pay with USDC or USDT. Tokens are sent to your wallet instantly.
          </p>

          {/* Wallet Info */}
          <div className="flex items-center gap-2 mb-6">
            {isConnected && (
              <span className="text-sm font-mono bg-muted px-3 py-1 rounded-lg">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </span>
            )}
            <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary border border-primary/30">
              PulseChain
            </span>
          </div>

          {/* Stablecoin Selector */}
          <div className="flex gap-2 mb-6">
            <Button
              variant={selectedStable === 'USDC' ? 'default' : 'outline'}
              onClick={() => setSelectedStable('USDC')}
              className={selectedStable === 'USDC' ? 'bg-gradient-to-r from-primary to-accent' : ''}
            >
              USDC
            </Button>
            <Button
              variant={selectedStable === 'USDT' ? 'default' : 'outline'}
              onClick={() => setSelectedStable('USDT')}
              className={selectedStable === 'USDT' ? 'bg-gradient-to-r from-primary to-accent' : ''}
            >
              USDT
            </Button>
          </div>

          {/* Amount Input */}
          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">
                Amount to pay ({selectedStable})
              </label>
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={isProcessing}
                className="bg-input border-border"
              />
              {isConnected && (
                <p className="text-xs text-muted-foreground mt-1">
                  Balance: {formatNumber(stableToken.balance, 2)} {selectedStable}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-2 block">
                You will receive (LOCK)
              </label>
              <Input
                type="text"
                value={inputAmount > 0 ? formatNumber(tokensToReceive, 0) : '0'}
                readOnly
                className="bg-muted border-border"
              />
            </div>

            {inputAmount > 0 && (
              <p className="text-sm text-muted-foreground">
                You pay <span className="text-foreground font-semibold">{formatNumber(inputAmount, 2)} {selectedStable}</span> and receive{' '}
                <span className="text-foreground font-semibold">{formatNumber(tokensToReceive, 0)} LOCK</span> at a rate of{' '}
                <span className="text-foreground">1 {selectedStable} = {formatNumber(presaleData.tokensPerUsd, 0)} LOCK</span>
              </p>
            )}
          </div>

          {/* Warnings */}
          {isWrongNetwork && (
            <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
              <p className="text-sm text-destructive">Please switch to PulseChain to participate in the presale.</p>
            </div>
          )}

          {insufficientBalance && inputAmount > 0 && (
            <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
              <p className="text-sm text-destructive">Insufficient {selectedStable} balance.</p>
            </div>
          )}

          {/* Action Button */}
          <div className="mt-6">
            {!isPresaleOpen ? (
              <div className="text-center">
                <CountdownTimer targetTime={PRESALE_START_TIME} />
                <p className="text-sm text-muted-foreground mt-3">
                  Presale will open automatically when countdown ends
                </p>
              </div>
            ) : !isConnected ? (
              <p className="text-center text-muted-foreground py-4">
                Connect your wallet to participate
              </p>
            ) : !presaleData.saleActive ? (
              <Button disabled className="w-full">
                Presale is not active
              </Button>
            ) : presaleData.isSoldOut ? (
              <Button disabled className="w-full">
                Presale is sold out
              </Button>
            ) : isWrongNetwork ? (
              <Button disabled className="w-full">
                Switch to PulseChain
              </Button>
            ) : needsApproval ? (
              <Button
                onClick={handleApprove}
                disabled={isProcessing || inputAmount <= 0 || insufficientBalance}
                className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90"
              >
                {isApproving || isApproveConfirming ? 'Approving...' : `Approve ${selectedStable}`}
              </Button>
            ) : (
              <Button
                onClick={handleBuy}
                disabled={isProcessing || inputAmount <= 0 || insufficientBalance}
                className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90"
              >
                {isBuying || isBuyConfirming ? 'Processing purchase...' : `Buy LOCK with ${selectedStable}`}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
