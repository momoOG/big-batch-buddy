// @ts-nocheck
"use client"
import { useEffect, useState } from "react"
import { usePublicClient } from "wagmi"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatEther } from "viem"
import { CONTRACT_ADDRESS, TOKEN_LOCKER_ABI, ERC20_ABI } from "@/config"
import { TokenAvatar } from "@/components/TokenAvatar"

interface LockDetail {
  user: `0x${string}`
  token: `0x${string}`
  name: string
  symbol: string
  amount: bigint
  unlockTime: bigint
  claimed: boolean
  index: number
}

export function AllLocks() {
  const publicClient = usePublicClient()
  const [locks, setLocks] = useState<LockDetail[]>([])
  const [now, setNow] = useState<number>(Math.floor(Date.now() / 1000))

  // ⏱ update countdown setiap detik
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Math.floor(Date.now() / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // 🔄 fetch data on-chain
  useEffect(() => {
    const fetchAllLocks = async () => {
      try {
        // Ambil semua event untuk tahu user unik
        const logs = await publicClient.getLogs({
          address: CONTRACT_ADDRESS as `0x${string}`,
          event: {
            type: "event",
            name: "TokensLocked",
            inputs: [
              { indexed: true, name: "user", type: "address" },
              { indexed: true, name: "token", type: "address" },
              { indexed: false, name: "amount", type: "uint256" },
              { indexed: false, name: "unlockTime", type: "uint256" },
            ],
          },
          fromBlock: 0n,
          toBlock: "latest",
        })

        const uniqueUsers = Array.from(
          new Set(logs.map((log) => log.args.user as `0x${string}`))
        )

        const detailedLocks: LockDetail[] = []

        // Loop semua user yang pernah lock
        for (const user of uniqueUsers) {
          const userLockCount = (await publicClient.readContract({
            address: CONTRACT_ADDRESS as `0x${string}`,
            abi: TOKEN_LOCKER_ABI,
            functionName: "getUserLockCount",
            args: [user],
          })) as bigint

          // Loop semua lock milik user
          for (let i = 0; i < Number(userLockCount); i++) {
            const [token, amount, unlockTime, claimed] =
              (await publicClient.readContract({
                address: CONTRACT_ADDRESS as `0x${string}`,
                abi: TOKEN_LOCKER_ABI,
                functionName: "getLock",
                args: [user, BigInt(i)],
              })) as [string, bigint, bigint, boolean]

            // Metadata token
            let name = "Unknown"
            let symbol = "???"
            
            try {
              name = (await publicClient.readContract({
                address: token as `0x${string}`,
                abi: ERC20_ABI,
                functionName: "name",
              })) as string

              symbol = (await publicClient.readContract({
                address: token as `0x${string}`,
                abi: ERC20_ABI,
                functionName: "symbol",
              })) as string
            } catch {}

            detailedLocks.push({
              user,
              token: token as `0x${string}`,
              name,
              symbol,
              amount,
              unlockTime,
              claimed,
              index: i,
            })
          }
        }

        // Sort dari terbaru ke lama
        setLocks(
          detailedLocks.sort((a, b) => Number(b.unlockTime - a.unlockTime))
        )
      } catch (err) {
        console.error("❌ Error fetching locks:", err)
      }
    }

    // jalankan pertama kali
    fetchAllLocks()

    // refresh setiap 30 detik
    const interval = setInterval(fetchAllLocks, 30000)
    return () => clearInterval(interval)
  }, [publicClient])

  const formatCountdown = (unlockTime: bigint) => {
    const diff = Number(unlockTime) - now
    if (diff <= 0) return "Unlocked"
    const days = Math.floor(diff / 86400)
    const hours = Math.floor((diff % 86400) / 3600)
    const minutes = Math.floor((diff % 3600) / 60)
    const seconds = diff % 60
    return `${days}d ${hours}h ${minutes}m ${seconds}s`
  }

  const formatDate = (ts: bigint) =>
    new Date(Number(ts) * 1000).toLocaleString()

  return (
    <div className="space-y-6">
      {locks.map((lock, idx) => {
        const isUnlocked = Number(lock.unlockTime) <= now
        return (
          <Card key={`${lock.user}-${lock.index}`} className="bg-card/50 backdrop-blur border-border shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex gap-6 items-start">
                {/* Token Logo - Large on the left */}
                <div className="flex-shrink-0">
                  <TokenAvatar 
                    address={lock.token}
                    symbol={lock.symbol}
                    name={lock.name}
                    size="xl"
                  />
                </div>
                
                {/* Lock Details - Right side */}
                <div className="flex-1 min-w-0">
                  {/* Header with title and status */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-2xl font-bold text-foreground mb-1">
                        Lock #{lock.index + 1}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        User: {lock.user.slice(0, 6)}...{lock.user.slice(-4)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Token: {lock.name} ({lock.symbol})
                      </p>
                    </div>
                    <Badge
                      className={`text-sm px-3 py-1 ${
                        lock.claimed
                          ? "bg-gray-500 hover:bg-gray-600"
                          : isUnlocked
                          ? "bg-green-500 hover:bg-green-600"
                          : "bg-blue-500 hover:bg-blue-600"
                      }`}
                    >
                      {lock.claimed
                        ? "✅ Claimed"
                        : isUnlocked
                        ? "🎯 Ready"
                        : "🔒 Locked"}
                    </Badge>
                  </div>
                  
                  {/* Lock Info Grid */}
                  <div className="space-y-3">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm text-muted-foreground font-medium">Amount:</span>
                      <span className="text-lg font-bold text-foreground">
                        {formatEther(lock.amount)} {lock.symbol}
                      </span>
                    </div>
                    
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm text-muted-foreground font-medium">Unlocks in:</span>
                      <span className="text-lg font-mono font-semibold text-primary">
                        {formatCountdown(lock.unlockTime)}
                      </span>
                    </div>
                    
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm text-muted-foreground font-medium">Unlock Date:</span>
                      <span className="text-base text-foreground">
                        {formatDate(lock.unlockTime)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
