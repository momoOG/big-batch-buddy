// @ts-nocheck
"use client"
import { useState, useEffect } from "react"
import { 
  useAccount, 
  useReadContract, 
  useReadContracts, 
  useWriteContract, 
  useWaitForTransactionReceipt 
} from "wagmi"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { CONTRACT_ADDRESS, TOKEN_LOCKER_ABI, ERC20_ABI } from "@/config"
import { formatEther } from "viem"

interface Lock {
  token: string
  amount: bigint
  unlockTime: bigint
  claimed: boolean
  index: number
  name?: string
  symbol?: string
}

// Hook untuk countdown real-time
const useCountdown = (unlockTime: bigint) => {
  const [timeLeft, setTimeLeft] = useState<number>(
    Number(unlockTime) - Math.floor(Date.now() / 1000)
  )

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000)
      setTimeLeft(Number(unlockTime) - now)
    }, 1000)
    return () => clearInterval(interval)
  }, [unlockTime])

  if (timeLeft <= 0) return "Unlocked"

  const days = Math.floor(timeLeft / 86400)
  const hours = Math.floor((timeLeft % 86400) / 3600)
  const minutes = Math.floor((timeLeft % 3600) / 60)
  const seconds = timeLeft % 60

  if (days > 0) return `${days} days ${hours}h ${minutes}m ${seconds}s`
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`
  if (minutes > 0) return `${minutes}m ${seconds}s`
  return `${seconds}s`
}

// Komponen child agar bisa pakai hook dalam map
const LockCard = ({
  lock,
  onClaim,
  isPending,
  isConfirming,
}: {
  lock: Lock
  onClaim: (index: number) => void
  isPending: boolean
  isConfirming: boolean
}) => {
  const isUnlocked = lock.unlockTime <= BigInt(Math.floor(Date.now() / 1000))
  const countdown = useCountdown(lock.unlockTime)

  return (
    <Card className="bg-card border-border shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-foreground">Lock #{lock.index + 1}</CardTitle>
          <Badge
            variant={isUnlocked ? "default" : "secondary"}
            className={isUnlocked ? "bg-success" : "bg-muted"}
          >
            {lock.claimed ? "Claimed" : isUnlocked ? "Ready to Claim" : "Locked"}
          </Badge>
        </div>
        <CardDescription className="text-muted-foreground">
          Token:{" "}
          {lock.name && lock.symbol
            ? `${lock.name} (${lock.symbol})`
            : `${lock.token.slice(0, 10)}...${lock.token.slice(-8)}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Amount</p>
            <p className="font-semibold text-foreground">{formatEther(lock.amount)} Tokens</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <p className="font-semibold text-foreground">{countdown}</p>
          </div>
        </div>

        <Button
          onClick={() => onClaim(lock.index)}
          disabled={!isUnlocked || lock.claimed || isPending || isConfirming}
          className="w-full bg-gradient-to-r from-accent to-accent-glow text-accent-foreground font-semibold py-2 shadow-lg hover:opacity-90 disabled:opacity-50"
        >
          {isPending || isConfirming
            ? "🔄 Claiming..."
            : lock.claimed
            ? "✅ Claimed"
            : isUnlocked
            ? "🎯 Claim Tokens"
            : "⏳ Locked"}
        </Button>
      </CardContent>
    </Card>
  )
}

export function MyLockedTokens() {
  const { address } = useAccount()
  const { toast } = useToast()
  const [locks, setLocks] = useState<Lock[]>([])
  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  // Get user's lock count
  const { data: lockCount, refetch: refetchCount } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: TOKEN_LOCKER_ABI,
    functionName: "getUserLockCount",
    args: address ? [address] : undefined,
  })

  // Read all locks
  const { data: lockData, refetch: refetchLocks } = useReadContracts({
    contracts: lockCount
      ? Array.from({ length: Number(lockCount) }, (_, i) => ({
          address: CONTRACT_ADDRESS as `0x${string}`,
          abi: TOKEN_LOCKER_ABI,
          functionName: "getLock",
          args: [address as `0x${string}`, BigInt(i)],
        }))
      : [],
  })

  // Read token metadata (symbol + name)
  const { data: tokenMeta } = useReadContracts({
    contracts: lockData
      ? lockData
          .map((res) => (res.result && Array.isArray(res.result) ? res.result[0] : null))
          .filter(Boolean)
          .flatMap((tokenAddr: string) => [
            {
              address: tokenAddr as `0x${string}`,
              abi: ERC20_ABI,
              functionName: "name",
            },
            {
              address: tokenAddr as `0x${string}`,
              abi: ERC20_ABI,
              functionName: "symbol",
            },
          ])
      : [],
  })

  // Process lock data
  useEffect(() => {
    if (!address || !lockCount || lockCount === 0n) {
      setLocks([])
      return
    }

    const processedLocks: Lock[] = []
    lockData?.forEach((res, index) => {
      if (res.result && Array.isArray(res.result)) {
        const [token, amount, unlockTime, claimed] = res.result as [string, bigint, bigint, boolean]

        if (!claimed) {
          const metaIndex = index * 2
          const tokenName = tokenMeta?.[metaIndex]?.result as string | undefined
          const tokenSymbol = tokenMeta?.[metaIndex + 1]?.result as string | undefined

          processedLocks.push({
            token,
            amount,
            unlockTime,
            claimed,
            index,
            name: tokenName,
            symbol: tokenSymbol,
          })
        }
      }
    })

    setLocks(processedLocks)
  }, [address, lockCount, lockData, tokenMeta])

  const handleClaim = async (lockIndex: number) => {
    if (!address) return
    try {
      writeContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: TOKEN_LOCKER_ABI,
        functionName: "claimTokens",
        args: [BigInt(lockIndex)],
        account: address as `0x${string}`,
      })
    } catch (err) {
      console.error(err)
      toast({
        title: "❌ Claim Failed",
        description: "Failed to claim tokens. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Handle successful claim
  useEffect(() => {
    if (isSuccess && hash) {
      toast({
        title: "✅ Tokens Claimed!",
        description: "Your tokens have been successfully claimed.",
      })
      refetchCount()
      refetchLocks()
    }
  }, [isSuccess, hash, toast, refetchCount, refetchLocks])

  if (!address) {
    return (
      <Card className="w-full bg-card border-border">
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Please connect your wallet to view your locked tokens</p>
        </CardContent>
      </Card>
    )
  }

  if (locks.length === 0) {
    return (
      <Card className="w-full bg-card border-border">
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">
            {lockCount === 0n ? "No locked tokens found" : "Loading locked tokens..."}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {locks.map((lock, index) => (
        <LockCard
          key={index}
          lock={lock}
          onClaim={handleClaim}
          isPending={isPending}
          isConfirming={isConfirming}
        />
      ))}
    </div>
  )
}
