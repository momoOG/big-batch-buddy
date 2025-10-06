import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

const LockDetailPage = () => {
  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.history.back()}
            className="border-border"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            🔒 Lock Details
          </h1>
        </div>

        <Card className="bg-card border-border shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-xl font-bold text-foreground">
              Lock Details Coming Soon
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              This feature will be available once the smart contract integration is complete
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">
              The lock details page will show comprehensive information about individual token locks,
              including unlock countdowns, claimable status, and transaction history.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default LockDetailPage