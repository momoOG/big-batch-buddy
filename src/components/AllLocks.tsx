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
import { Coins } from "lucide-react"
import { formatEther } from "viem"
import { CONTRACT_ADDRESS, TOKEN_LOCKER_ABI, ERC20_ABI } from "@/config"
import { getTokenLogo } from "@/lib/tokenLogo"

interface LockDetail {
  user: `0x${string}`
  token: `0x${string}`
  name: string
  symbol: string
  logoUrl: string | null
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
            let logoUrl = null
            
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
              
              // Fetch token logo
              logoUrl = await getTokenLogo(token)
            } catch {}

            detailedLocks.push({
              user,
              token: token as `0x${string}`,
              name,
              symbol,
              logoUrl,
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
    <div className="space-y-4">
      {locks.map((lock, idx) => {
        const isUnlocked = Number(lock.unlockTime) <= now
        return (
          <Card key={`${lock.user}-${lock.index}`} className="bg-card border-border shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Token Logo */}
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden border border-border">
                    {lock.logoUrl ? (
                      <img 
                        src={lock.logoUrl} 
                        alt={lock.symbol}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback ke icon jika image error
                          e.currentTarget.style.display = 'none'
                          e.currentTarget.nextElementSibling.style.display = 'block'
                        }}
                      />
                    ) : null}
                    <Coins className="w-5 h-5 text-muted-foreground" style={{ display: lock.logoUrl ? 'none' : 'block' }} />
                  </div>
                  <CardTitle>Lock #{lock.index + 1}</CardTitle>
                </div>
                <Badge
                  className={
                    lock.claimed
                      ? "bg-gray-500"
                      : isUnlocked
                      ? "bg-green-500"
                      : "bg-blue-500"
                  }
                >
                  {lock.claimed
                    ? "✅ Claimed"
                    : isUnlocked
                    ? "🎯 Ready"
                    : "🔒 Locked"}
                </Badge>
              </div>
              <CardDescription>
                User: {lock.user.slice(0, 6)}...{lock.user.slice(-4)} <br />
                Token: {lock.name} ({lock.symbol})
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>
                <strong>Amount:</strong> {formatEther(lock.amount)}{" "}
                {lock.symbol}
              </p>
              <p>
                <strong>Unlocks in:</strong> {formatCountdown(lock.unlockTime)}
              </p>
              <p>
                <strong>Unlock Date:</strong> {formatDate(lock.unlockTime)}
              </p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
