"use client"
import { useState, useEffect } from "react"
import { useAccount, useReadContract, useReadContracts } from "wagmi"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatEther } from "viem"
import { CONTRACT_ADDRESS, TOKEN_LOCKER_ABI, ERC20_ABI } from "@/config"

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
    <div className="space-y-4">
      {claimedLocks.map((lock, index) => (
        <Card key={index} className="bg-card border-border shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-foreground">
                Claimed Lock #{lock.index + 1}
              </CardTitle>
              <Badge variant="default" className="bg-success text-success-foreground">
                ✅ Claimed
              </Badge>
            </div>
            <CardDescription className="text-muted-foreground">
              Token: {lock.name} ({lock.symbol}) <br />
              Address: {lock.token.slice(0, 10)}...{lock.token.slice(-8)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Amount</p>
                <p className="font-semibold text-foreground">
                  {formatEther(lock.amount)} {lock.symbol}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Claimed At</p>
                <p className="font-semibold text-foreground">
                  {formatDate(lock.claimedAt)}
                </p>
              </div>
            </div>
            <div className="text-center p-4 bg-success/10 rounded-lg border border-success/20">
              <p className="text-success font-semibold">
                🎉 Successfully claimed {formatEther(lock.amount)} {lock.symbol}!
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
