// @ts-nocheck
import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { usePublicClient, useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, ExternalLink, Share2 } from "lucide-react"
import { formatEther } from "viem"
import { CONTRACT_ADDRESS, TOKEN_LOCKER_ABI, ERC20_ABI } from "@/config"
import { TokenAvatar } from "@/components/TokenAvatar"
import { useToast } from "@/hooks/use-toast"

interface LockDetail {
  user: `0x${string}`
  token: `0x${string}`
  name: string
  symbol: string
  amount: bigint
  unlockTime: bigint
  claimed: boolean
}

const LockDetailPage = () => {
  const { user, index } = useParams<{ user: string; index: string }>()
  const navigate = useNavigate()
  const publicClient = usePublicClient()
  const { address } = useAccount()
  const { toast } = useToast()
  const [lock, setLock] = useState<LockDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [now, setNow] = useState<number>(Math.floor(Date.now() / 1000))

  const { writeContract, data: hash } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  // Update countdown every second
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Math.floor(Date.now() / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Fetch lock details
  useEffect(() => {
    const fetchLockDetail = async () => {
      if (!user || !index) return
      
      try {
        setLoading(true)
        const [token, amount, unlockTime, claimed] = await publicClient.readContract({
          address: CONTRACT_ADDRESS as `0x${string}`,
          abi: TOKEN_LOCKER_ABI,
          functionName: "getLock",
          args: [user as `0x${string}`, BigInt(index)],
        }) as [string, bigint, bigint, boolean]

        // Get token metadata
        let name = "Unknown"
        let symbol = "???"
        
        try {
          name = await publicClient.readContract({
            address: token as `0x${string}`,
            abi: ERC20_ABI,
            functionName: "name",
          }) as string

          symbol = await publicClient.readContract({
            address: token as `0x${string}`,
            abi: ERC20_ABI,
            functionName: "symbol",
          }) as string
        } catch {}

        setLock({
          user: user as `0x${string}`,
          token: token as `0x${string}`,
          name,
          symbol,
          amount,
          unlockTime,
          claimed,
        })
      } catch (err) {
        console.error("Error fetching lock:", err)
        toast({
          title: "Error",
          description: "Failed to load lock details",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchLockDetail()
  }, [user, index, publicClient, isSuccess])

  const formatCountdown = (unlockTime: bigint) => {
    const diff = Number(unlockTime) - now
    if (diff <= 0) return "Unlocked"
    const days = Math.floor(diff / 86400)
    const hours = Math.floor((diff % 86400) / 3600)
    const minutes = Math.floor((diff % 3600) / 60)
    const seconds = diff % 60
    return `${days}d ${hours}h ${minutes}m ${seconds}s`
  }

  const formatDate = (ts: bigint) => new Date(Number(ts) * 1000).toLocaleString()

  const handleClaim = () => {
    if (!user || !index) return
    writeContract({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: TOKEN_LOCKER_ABI,
      functionName: "claimTokens",
      args: [BigInt(index)],
    })
  }

  const handleShare = () => {
    const shareUrl = window.location.href
    navigator.clipboard.writeText(shareUrl)
    toast({
      title: "Link copied!",
      description: "Share link has been copied to clipboard",
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background py-8 px-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate("/")}
              className="border-border"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
          <Card className="bg-card border-border shadow-xl">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Loading lock details...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!lock) {
    return (
      <div className="min-h-screen bg-background py-8 px-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate("/")}
              className="border-border"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
          <Card className="bg-card border-border shadow-xl">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Lock not found</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const isUnlocked = Number(lock.unlockTime) <= now
  const isOwner = address?.toLowerCase() === lock.user.toLowerCase()

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate("/")}
              className="border-border"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              🔒 Lock Details
            </h1>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleShare}
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>

        <Card className="bg-card/50 backdrop-blur border-border shadow-xl">
          <CardHeader>
            <div className="flex items-center gap-6">
              <TokenAvatar 
                address={lock.token}
                symbol={lock.symbol}
                name={lock.name}
                size="xl"
              />
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <CardTitle className="text-3xl font-bold">{lock.name}</CardTitle>
                  <Badge
                    className={`${
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
                      ? "✓ Ready to Claim"
                      : "🔒 Locked"}
                  </Badge>
                </div>
                <CardDescription className="text-lg">{lock.symbol}</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <Separator />
            
            {/* Amount */}
            <div>
              <p className="text-sm text-muted-foreground uppercase tracking-wide mb-2">Locked Amount</p>
              <p className="text-3xl font-bold text-foreground">
                {Number(formatEther(lock.amount)).toLocaleString()} {lock.symbol}
              </p>
            </div>

            <Separator />

            {/* Unlock Time */}
            <div>
              <p className="text-sm text-muted-foreground uppercase tracking-wide mb-2">
                {isUnlocked ? "Unlocked At" : "Unlocks In"}
              </p>
              <p className="text-2xl font-mono font-bold text-primary mb-1">
                {formatCountdown(lock.unlockTime)}
              </p>
              <p className="text-sm text-muted-foreground">
                {formatDate(lock.unlockTime)}
              </p>
            </div>

            <Separator />

            {/* Owner Address */}
            <div>
              <p className="text-sm text-muted-foreground uppercase tracking-wide mb-2">Locked By</p>
              <a 
                href={`https://scan.mypinata.cloud/ipfs/bafybeidn64pd2u525lmoipjl4nh3ooa2imd7huionjsdepdsphl5slfowy/#/address/${lock.user}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-400 hover:underline font-mono flex items-center gap-2"
              >
                {lock.user}
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            <Separator />

            {/* Token Address */}
            <div>
              <p className="text-sm text-muted-foreground uppercase tracking-wide mb-2">Token Contract</p>
              <a 
                href={`https://scan.mypinata.cloud/ipfs/bafybeidn64pd2u525lmoipjl4nh3ooa2imd7huionjsdepdsphl5slfowy/#/address/${lock.token}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-400 hover:underline font-mono flex items-center gap-2"
              >
                {lock.token}
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            {/* Claim Button */}
            {isOwner && !lock.claimed && isUnlocked && (
              <>
                <Separator />
                <Button
                  onClick={handleClaim}
                  disabled={isConfirming}
                  className="w-full"
                  size="lg"
                >
                  {isConfirming ? "Claiming..." : "🎉 Claim Tokens"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default LockDetailPage