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
import { Button } from "@/components/ui/button"
import { formatEther } from "viem"
import { CONTRACT_ADDRESS, TOKEN_LOCKER_ABI, ERC20_ABI } from "@/config"
import { TokenAvatar } from "@/components/TokenAvatar"
import { useToast } from "@/hooks/use-toast"
import { Share2 } from "lucide-react"

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
  const { toast } = useToast()

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

  const handleShareLock = (lock: LockDetail) => {
    const shareUrl = `${window.location.origin}/lock/${lock.user}/${lock.index}`
    navigator.clipboard.writeText(shareUrl)
    toast({
      title: "Link copied!",
      description: "Share link has been copied to clipboard",
    })
  }

  return (
    <div className="space-y-6">
      {locks.filter(lock => !lock.claimed).map((lock, idx) => {
        const isUnlocked = Number(lock.unlockTime) <= now
        return (
          <Card key={`${lock.user}-${lock.index}`} className="bg-card/50 backdrop-blur border-border shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex gap-6 items-center">
                {/* Token Logo - Medium size */}
                <div className="flex-shrink-0">
                  <TokenAvatar 
                    address={lock.token}
                    symbol={lock.symbol}
                    name={lock.name}
                    size="lg"
                  />
                </div>
                
                {/* Lock Details - Right side, compact */}
                <div className="flex-1 min-w-0 space-y-1">
                  {/* Title and Badge */}
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-lg font-bold text-foreground leading-tight">
                      {lock.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <Badge
                        className={`text-[10px] px-2 py-0.5 flex-shrink-0 ${
                          lock.claimed
                            ? "bg-gray-500 hover:bg-gray-600"
                            : isUnlocked
                            ? "bg-green-500 hover:bg-green-600"
                            : "bg-blue-500 hover:bg-blue-600"
                        }`}
                      >
                        {lock.claimed
                          ? "🔓 Claimed"
                          : isUnlocked
                          ? "✓ Ready"
                          : "🔒 Locked"}
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={() => handleShareLock(lock)}
                      >
                        <Share2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Amount */}
                  <div>
                    <div className="text-[9px] text-muted-foreground uppercase tracking-wide">AMOUNT:</div>
                    <div className="text-base font-bold text-foreground leading-tight">
                      {Number(formatEther(lock.amount)).toLocaleString()} {lock.symbol}
                    </div>
                  </div>
                  
                  {/* Countdown */}
                  <div>
                    <div className="text-[9px] text-muted-foreground uppercase tracking-wide">UNLOCKS IN:</div>
                    <div className="text-sm font-mono font-semibold text-primary leading-tight">
                      {formatCountdown(lock.unlockTime)}
                    </div>
                  </div>
                  
                  {/* User Address */}
                  <div>
                    <div className="text-[9px] text-muted-foreground uppercase tracking-wide">LOCKED BY:</div>
                    <a 
                      href={`https://scan.mypinata.cloud/ipfs/bafybeidn64pd2u525lmoipjl4nh3ooa2imd7huionjsdepdsphl5slfowy/#/address/${lock.user}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-mono text-blue-500 hover:text-blue-400 hover:underline leading-tight"
                    >
                      {lock.user.slice(0, 6)}...{lock.user.slice(-4)}
                    </a>
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
