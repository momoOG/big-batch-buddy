import { useEffect, useState } from "react"
import { useAccount } from "wagmi"
import { supabase } from "@/integrations/supabase/client"
import { Card } from "./ui/card"
import { Trophy } from "lucide-react"

interface UserPointsData {
  total_points: number
  updated_at: string
}

export const UserPoints = () => {
  const { address } = useAccount()
  const [points, setPoints] = useState<UserPointsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!address) {
      setPoints(null)
      setLoading(false)
      return
    }

    const fetchPoints = async () => {
      try {
        const { data, error } = await supabase
          .from('user_points')
          .select('total_points, updated_at')
          .eq('user_address', address.toLowerCase())
          .single()

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching points:', error)
        } else if (data) {
          setPoints(data)
        }
      } catch (error) {
        console.error('Error fetching points:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPoints()

    // Subscribe to realtime updates
    const channel = supabase
      .channel('user-points-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_points',
          filter: `user_address=eq.${address.toLowerCase()}`
        },
        (payload) => {
          console.log('Points updated:', payload)
          if (payload.new && 'total_points' in payload.new) {
            setPoints(payload.new as UserPointsData)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [address])

  if (!address || loading) return null

  return (
    <Card className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-full bg-primary/20">
          <Trophy className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Your Points</p>
          <p className="text-2xl font-bold text-primary">
            {points ? Number(points.total_points).toLocaleString() : '0'}
          </p>
        </div>
      </div>
    </Card>
  )
}