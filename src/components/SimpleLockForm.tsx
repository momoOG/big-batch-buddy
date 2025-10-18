"use client"
import { useState, useEffect } from "react"
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { parseEther, parseUnits } from "viem"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { CONTRACT_ADDRESS, TOKEN_LOCKER_ABI, ERC20_ABI } from "@/config"

const DURATIONS: { label: string; seconds: number }[] = [
  { label: "1 minute", seconds: 60 },
  { label: "1 hour", seconds: 3600 },
  { label: "6 hours", seconds: 6 * 3600 },
  { label: "12 hours", seconds: 12 * 3600 },
  { label: "24 hours", seconds: 24 * 3600 },
  { label: "7 days", seconds: 7 * 24 * 3600 },
  { label: "30 days", seconds: 30 * 24 * 3600 },
  { label: "6 months", seconds: 180 * 24 * 3600 },
  { label: "1 year", seconds: 365 * 24 * 3600 },
  { label: "2 years", seconds: 2 * 365 * 24 * 3600 },
  { label: "3 years", seconds: 3 * 365 * 24 * 3600 },
]

export function SimpleLockForm({ onLocked }: { onLocked?: () => void }) {
  const { address } = useAccount()
  const { toast } = useToast()
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const [token, setToken] = useState("")
  const [amount, setAmount] = useState("")
  const [duration, setDuration] = useState<number>(60)
  const [needsApproval, setNeedsApproval] = useState(true)
  const [isApproving, setIsApproving] = useState(false)
  const [isLocking, setIsLocking] = useState(false)

  const handleApprove = async () => {
    if (!address || !token || !amount) return

    try {
      setIsApproving(true)
      const tokenAmount = parseUnits(amount, 18) // Assuming 18 decimals
      
      writeContract({
        address: token as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [CONTRACT_ADDRESS as `0x${string}`, tokenAmount],
        chain: undefined,
        account: address as `0x${string}`,
      })
    } catch (err) {
      console.error(err)
      setIsApproving(false)
      toast({
        title: "❌ Approval Failed",
        description: "Failed to approve tokens. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleLock = async () => {
    if (!address || !token || !amount || !duration) {
      toast({
        title: "⚠️ Missing Information",
        description: "Please complete all fields!",
        variant: "destructive",
      })
      return
    }
    if (Number(amount) <= 0) {
      toast({
        title: "⚠️ Invalid Amount", 
        description: "Amount must be greater than 0!",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLocking(true)
      const tokenAmount = parseUnits(amount, 18) // Assuming 18 decimals
      
      writeContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: TOKEN_LOCKER_ABI,
        functionName: 'lockTokens',
        args: [token as `0x${string}`, tokenAmount, BigInt(duration)],
        chain: undefined,
        account: address as `0x${string}`,
      })
    } catch (err) {
      console.error(err)
      setIsLocking(false)
      toast({
        title: "❌ Lock Failed",
        description: "Failed to lock tokens. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Handle transaction success
  useEffect(() => {
    if (isSuccess && hash) {
      if (isApproving) {
        // Approval successful - show lock button
        toast({
          title: "✅ Approval Successful!",
          description: "Tokens approved. Now you can lock them.",
        })
        setNeedsApproval(false)
        setIsApproving(false)
      } else if (isLocking) {
        // Lock successful - reset form and calculate points
        toast({
          title: "✅ Tokens Locked!",
          description: `${amount} tokens successfully locked. Calculating points...`,
        })
        
        // Calculate and award points
        const calculatePoints = async () => {
          if (!address) return
          
          try {
            // Get user's lock count to determine the correct lockIndex
            const lockCountResponse = await fetch(
              `https://rpc.pulsechain.com`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  jsonrpc: '2.0',
                  method: 'eth_call',
                  params: [{
                    to: CONTRACT_ADDRESS,
                    data: `0x7b18d2b2${address.slice(2).padStart(64, '0')}`
                  }, 'latest'],
                  id: 1
                })
              }
            )
            
            const lockCountData = await lockCountResponse.json()
            const lockCount = parseInt(lockCountData.result, 16)
            const lockIndex = Math.max(0, lockCount - 1)
            
            const response = await fetch(
              `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/calculate-lock-points`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
                },
                body: JSON.stringify({
                  userAddress: address,
                  lockIndex: lockIndex,
                  tokenAddress: token,
                  tokenAmount: amount,
                  tokenDecimals: 18,
                  durationInSeconds: duration
                })
              }
            )
            
            if (response.ok) {
              const result = await response.json()
              toast({
                title: "🎉 Points Earned!",
                description: `You earned ${Number(result.pointsEarned).toLocaleString()} points!`,
              })
            }
          } catch (error) {
            console.error('Error calculating points:', error)
          }
        }
        
        calculatePoints()
        
        setToken("")
        setAmount("")
        setDuration(60)
        setNeedsApproval(true)
        setIsLocking(false)
        
        if (onLocked) onLocked()
      }
    }
  }, [isSuccess, hash, isApproving, isLocking, amount, duration, toast, onLocked, address, token])

  // Handle transaction error
  useEffect(() => {
    if (error) {
      setIsApproving(false)
      setIsLocking(false)
      toast({
        title: "❌ Transaction Failed",
        description: error.message || "Transaction failed. Please try again.",
        variant: "destructive",
      })
    }
  }, [error, toast])

  return (
    <Card className="w-full max-w-md mx-auto bg-card border-border shadow-xl">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
          🔒 Lock Tokens
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Securely lock your tokens for a specified duration
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="token" className="text-sm font-medium text-foreground">
            Token Contract Address
          </Label>
          <Input
            id="token"
            placeholder="0x..."
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="bg-input border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount" className="text-sm font-medium text-foreground">
            Amount to Lock
          </Label>
          <Input
            id="amount"
            type="number"
            placeholder="Enter amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="bg-input border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="duration" className="text-sm font-medium text-foreground">
            Lock Duration
          </Label>
          <Select onValueChange={(value) => setDuration(Number(value))}>
            <SelectTrigger className="bg-input border-border text-foreground">
              <SelectValue placeholder="Select duration" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              {DURATIONS.map((dur) => (
                <SelectItem key={dur.seconds} value={dur.seconds.toString()}>
                  {dur.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {needsApproval ? (
          <Button
            onClick={handleApprove}
            disabled={isPending || isConfirming || !address}
            className="w-full bg-gradient-to-r from-secondary to-secondary-glow text-secondary-foreground font-semibold py-3 shadow-lg hover:opacity-90 disabled:opacity-50"
          >
            {(isPending && isApproving) || (isConfirming && isApproving) ? "🔄 Approving..." : "✅ Approve Tokens"}
          </Button>
        ) : (
          <Button
            onClick={handleLock}
            disabled={isPending || isConfirming || !address}
            className="w-full bg-gradient-to-r from-primary to-primary-glow text-primary-foreground font-semibold py-3 shadow-lg hover:opacity-90 disabled:opacity-50"
          >
            {(isPending && isLocking) || (isConfirming && isLocking) ? "🔄 Locking..." : "🔒 Lock Tokens"}
          </Button>
        )}

        {!address && (
          <p className="text-center text-sm text-muted-foreground">
            Please connect your wallet to lock tokens
          </p>
        )}
      </CardContent>
    </Card>
  )
}