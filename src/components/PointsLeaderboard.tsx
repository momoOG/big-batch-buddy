import { useEffect, useState } from "react"
import { supabase } from "@/integrations/supabase/client"
import { Card } from "./ui/card"
import { Trophy, Medal } from "lucide-react"

interface LeaderboardEntry {
  user_address: string
  total_points: number
  updated_at: string
}

export const PointsLeaderboard = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const { data, error } = await supabase
          .from('user_points')
          .select('user_address, total_points, updated_at')
          .order('total_points', { ascending: false })
          .limit(10)

        if (error) {
          console.error('Error fetching leaderboard:', error)
        } else if (data) {
          setLeaderboard(data)
        }
      } catch (error) {
        console.error('Error fetching leaderboard:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchLeaderboard()

    // Subscribe to realtime updates
    const channel = supabase
      .channel('leaderboard-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_points'
        },
        () => {
          fetchLeaderboard()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-muted rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    )
  }

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="w-5 h-5 text-yellow-500" />
    if (index === 1) return <Medal className="w-5 h-5 text-gray-400" />
    if (index === 2) return <Medal className="w-5 h-5 text-orange-600" />
    return <span className="text-muted-foreground font-bold">{index + 1}</span>
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Trophy className="w-6 h-6 text-primary" />
        <h3 className="text-xl font-bold">Top Lockers</h3>
      </div>

      {leaderboard.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">
          No leaderboard data yet. Be the first to lock tokens and earn points!
        </p>
      ) : (
        <div className="space-y-3">
          {leaderboard.map((entry, index) => (
            <div
              key={entry.user_address}
              className={`flex items-center gap-4 p-3 rounded-lg ${
                index < 3 ? 'bg-primary/5 border border-primary/20' : 'bg-muted/50'
              }`}
            >
              <div className="flex items-center justify-center w-8 h-8">
                {getRankIcon(index)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-mono text-sm truncate">
                  {entry.user_address.slice(0, 6)}...{entry.user_address.slice(-4)}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg">
                  {Number(entry.total_points).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">points</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}