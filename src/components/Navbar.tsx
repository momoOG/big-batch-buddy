"use client"
import { useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { ConnectButton } from "@/components/ConnectButton"
import { Menu, X } from "lucide-react"

const menuItems = [
  { key: "lock", path: "/lock", label: "Lock Token", emoji: "🔒", gradient: "from-primary to-primary-glow" },
  { key: "locker", path: "/locker", label: "Token Locker", emoji: "📋", gradient: "from-secondary to-secondary-glow" },
  { key: "claimed", path: "/claimed", label: "Token Claimed", emoji: "✅", gradient: "from-accent to-accent-glow" },
  { key: "allLocks", path: "/all-locks", label: "All Locks", emoji: "🌍", gradient: "from-pink-500 to-purple-600" },
  { key: "presale", path: "/presale", label: "Presale", emoji: "🚀", gradient: "from-purple-500 to-pink-500" },
]

export function Navbar() {
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isActive = (path: string) => location.pathname === path

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/lock" className="flex-shrink-0">
            <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              🔒 Lockify
            </h1>
            <p className="text-xs text-muted-foreground hidden sm:block">Secure Token Locker on PulseChain</p>
          </Link>

          {/* Desktop Menu */}
          <nav className="hidden lg:flex items-center gap-2">
            {menuItems.map((item) => (
              <Button
                key={item.key}
                variant={isActive(item.path) ? "default" : "ghost"}
                size="sm"
                asChild
                className={isActive(item.path)
                  ? `bg-gradient-to-r ${item.gradient} text-white font-semibold shadow-lg`
                  : "text-muted-foreground hover:text-foreground hover:bg-card"
                }
              >
                <Link to={item.path}>
                  {item.emoji} {item.label}
                </Link>
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
                variant={isActive(item.path) ? "default" : "ghost"}
                size="sm"
                asChild
                onClick={() => setMobileMenuOpen(false)}
                className={`w-full justify-start ${isActive(item.path)
                  ? `bg-gradient-to-r ${item.gradient} text-white font-semibold`
                  : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Link to={item.path}>
                  {item.emoji} {item.label}
                </Link>
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