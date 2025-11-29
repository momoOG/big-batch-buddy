"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ConnectButton } from "@/components/ConnectButton"
import { Menu, X } from "lucide-react"

type MenuType = "lock" | "locker" | "claimed" | "allLocks" | "presale"

type MenuProps = {
  onChange: (menu: MenuType) => void
}

export function Navbar({ onChange }: MenuProps) {
  const [active, setActive] = useState<MenuType>("lock")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleClick = (menu: MenuType) => {
    setActive(menu)
    onChange(menu)
    setMobileMenuOpen(false)
  }

  const menuItems: { key: MenuType; label: string; emoji: string; gradient: string }[] = [
    { key: "lock", label: "Lock Token", emoji: "🔒", gradient: "from-primary to-primary-glow" },
    { key: "locker", label: "Token Locker", emoji: "📋", gradient: "from-secondary to-secondary-glow" },
    { key: "claimed", label: "Token Claimed", emoji: "✅", gradient: "from-accent to-accent-glow" },
    { key: "allLocks", label: "All Locks", emoji: "🌍", gradient: "from-pink-500 to-purple-600" },
    { key: "presale", label: "Presale", emoji: "🚀", gradient: "from-purple-500 to-pink-500" },
  ]

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex-shrink-0">
            <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              🔒 Lockify
            </h1>
            <p className="text-xs text-muted-foreground hidden sm:block">Secure Token Locker on PulseChain</p>
          </div>

          {/* Desktop Menu */}
          <nav className="hidden lg:flex items-center gap-2">
            {menuItems.map((item) => (
              <Button
                key={item.key}
                variant={active === item.key ? "default" : "ghost"}
                size="sm"
                onClick={() => handleClick(item.key)}
                className={active === item.key
                  ? `bg-gradient-to-r ${item.gradient} text-white font-semibold shadow-lg`
                  : "text-muted-foreground hover:text-foreground hover:bg-card"
                }
              >
                {item.emoji} {item.label}
              </Button>
            ))}
          </nav>

          {/* Connect Button & Mobile Menu Toggle */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:block">
              <ConnectButton />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-4 pb-2 space-y-2">
            {menuItems.map((item) => (
              <Button
                key={item.key}
                variant={active === item.key ? "default" : "ghost"}
                size="sm"
                onClick={() => handleClick(item.key)}
                className={`w-full justify-start ${active === item.key
                  ? `bg-gradient-to-r ${item.gradient} text-white font-semibold`
                  : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.emoji} {item.label}
              </Button>
            ))}
            <div className="pt-2 sm:hidden">
              <ConnectButton />
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
