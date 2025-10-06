"use client"
import { useAccount, useConnect, useDisconnect } from "wagmi"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function ConnectButton() {
  const { address, isConnected } = useAccount()
  const { connect, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()

  return (
    <div className="flex items-center gap-3">
      {isConnected ? (
        <div className="flex items-center gap-3 bg-card border border-border rounded-lg px-4 py-2">
          <span className="text-sm font-mono text-foreground">
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => disconnect()}
            className="hover:bg-destructive hover:text-destructive-foreground border-border"
          >
            Disconnect
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Select onValueChange={(value) => {
            const connector = connectors.find(c => c.id === value)
            if (connector) connect({ connector })
          }}>
            <SelectTrigger className="w-48 bg-input border-border">
              <SelectValue placeholder="Select Wallet" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              {connectors.map((connector) => (
                <SelectItem key={connector.id} value={connector.id}>
                  {connector.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={() => connect({ connector: connectors[0] })}
            disabled={isPending}
            variant="default"
            className="bg-gradient-to-r from-primary to-primary-glow hover:opacity-90 text-primary-foreground font-semibold px-6 py-2 shadow-lg"
          >
            {isPending ? "Connecting..." : "🔗 Connect"}
          </Button>
        </div>
      )}
    </div>
  )
}