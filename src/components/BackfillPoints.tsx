import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { Loader2, RefreshCw } from "lucide-react"

export function BackfillPoints() {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleBackfill = async () => {
    setIsLoading(true)
    try {
      toast({
        title: "🔄 Processing...",
        description: "Scanning blockchain for locked tokens...",
      })

      const { data, error } = await supabase.functions.invoke('backfill-lock-points', {
        body: {},
      })

      if (error) throw error

      toast({
        title: "✅ Backfill Complete!",
        description: `Processed: ${data.stats.processed} locks, Skipped: ${data.stats.skipped}, Errors: ${data.stats.errors}`,
      })
    } catch (error: any) {
      console.error("Error backfilling points:", error)
      toast({
        title: "❌ Error",
        description: error.message || "Failed to backfill points",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="bg-card/50 backdrop-blur border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Backfill Points
        </CardTitle>
        <CardDescription>
          Scan blockchain dan berikan points untuk semua token yang sudah dikunci
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          onClick={handleBackfill}
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-primary to-primary/80"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Scan & Award Points
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
