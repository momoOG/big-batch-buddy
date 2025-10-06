// @ts-nocheck
"use client"
import { useState, useEffect } from "react"
import { useAccount, useReadContract, useReadContracts } from "wagmi"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatEther } from "viem"
import { CONTRACT_ADDRESS, TOKEN_LOCKER_ABI, ERC20_ABI } from "@/config"
import { TokenAvatar } from "@/components/TokenAvatar"

interface ClaimedLock {
  token: string
  name: string
  symbol: string
  amount: bigint
  unlockTime: bigint
  claimedAt: bigint
  index: number
}

export function ClaimedTokens() {
  const { address } = useAccount()
  const [claimedLocks, setClaimedLocks] = useState<ClaimedLock[]>([])

  // 🔹 Ambil jumlah lock user
  const { data: lockCount } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: TOKEN_LOCKER_ABI,
    functionName: "getUserLockCount",
    args: address ? [address] : undefined,
  })

  // 🔹 Ambil semua lock user
  const { data: lockData } = useReadContracts({
    contracts: lockCount
      ? Array.from({ length: Number(lockCount) }, (_, i) => ({
          address: CONTRACT_ADDRESS as `0x${string}`,
          abi: TOKEN_LOCKER_ABI,
          functionName: "getLock",
          args: [address as `0x${string}`, BigInt(i)],
        }))
      : [],
  })

  // 🔹 Ambil metadata token (name & symbol)
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

  // 🔹 Proses lock yang sudah diklaim
  useEffect(() => {
    if (!address || !lockCount || lockCount === 0n) {
      setClaimedLocks([])
      return
    }

    const processed: ClaimedLock[] = []

    lockData?.forEach((res, index) => {
      if (res.result && Array.isArray(res.result)) {
        const [token, amount, unlockTime, claimed] = res.result as [
          string,
          bigint,
          bigint,
          boolean
        ]

        if (claimed) {
          const metaIndex = index * 2
          const tokenName = tokenMeta?.[metaIndex]?.result as string | undefined
          const tokenSymbol = tokenMeta?.[metaIndex + 1]?.result as string | undefined

          processed.push({
            token,
            name: tokenName || "Unknown",
            symbol: tokenSymbol || "???",
            amount,
            unlockTime,
            claimedAt: unlockTime, // pakai unlockTime sebagai timestamp
            index,
          })
        }
      }
    })

    setClaimedLocks(processed)
  }, [address, lockCount, lockData, tokenMeta])

  const formatDate = (timestamp: bigint) => {
    return new Date(Number(timestamp) * 1000).toLocaleString()
  }

  if (!address) {
    return (
      <Card className="w-full bg-card border-border">
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">
            Please connect your wallet to view your claimed tokens
          </p>
        </CardContent>
      </Card>
    )
  }

  if (claimedLocks.length === 0) {
    return (
      <Card className="w-full bg-card border-border">
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">
            {lockCount === 0n ? "No claimed tokens found" : "No claimed tokens yet"}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {claimedLocks.map((lock, index) => (
        <Card key={index} className="bg-card/50 backdrop-blur border-border shadow-xl hover:shadow-2xl transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex gap-6 items-center">
              {/* Token Logo */}
              <div className="flex-shrink-0">
                <TokenAvatar 
                  address={lock.token as `0x${string}`}
                  symbol={lock.symbol}
                  name={lock.name}
                  size="lg"
                />
              </div>
              
              {/* Lock Details */}
              <div className="flex-1 min-w-0 space-y-1">
                {/* Title and Badge */}
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-lg font-bold text-foreground leading-tight">
                    {lock.name}
                  </h3>
                  <Badge className="text-[10px] px-2 py-0.5 flex-shrink-0 bg-green-500 hover:bg-green-600">
                    ✅ Claimed
                  </Badge>
                </div>
                
                {/* Amount */}
                <div>
                  <div className="text-[9px] text-muted-foreground uppercase tracking-wide">AMOUNT:</div>
                  <div className="text-base font-bold text-foreground leading-tight">
                    {Number(formatEther(lock.amount)).toLocaleString()} {lock.symbol}
                  </div>
                </div>
                
                {/* Claimed At */}
                <div>
                  <div className="text-[9px] text-muted-foreground uppercase tracking-wide">CLAIMED AT:</div>
                  <div className="text-sm font-mono font-semibold text-primary leading-tight">
                    {formatDate(lock.claimedAt)}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
