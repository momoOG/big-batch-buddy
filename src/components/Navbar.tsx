"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"

type MenuProps = {
  onChange: (menu: "lock" | "locker" | "claimed" | "allLocks" | "leaderboard") => void
}

export function Navbar({ onChange }: MenuProps) {
  const [active, setActive] = useState<"lock" | "locker" | "claimed" | "allLocks" | "leaderboard">("lock")

  const handleClick = (menu: "lock" | "locker" | "claimed" | "allLocks" | "leaderboard") => {
    setActive(menu)
    onChange(menu)
  }

  const getButtonVariant = (menu: string) =>
    active === menu ? "default" : "outline"

  return (
    <div className="flex flex-wrap justify-center gap-3 mb-8">
      {/* Lock Token */}
      <Button 
        variant={getButtonVariant("lock")}
        onClick={() => handleClick("lock")}
        className={active === "lock" 
          ? "bg-gradient-to-r from-primary to-primary-glow text-primary-foreground font-semibold shadow-lg" 
          : "border-border hover:bg-card hover:text-foreground"
        }
      >
        🔒 Lock Token
      </Button>

      {/* Token Locker */}
      <Button 
        variant={getButtonVariant("locker")}
        onClick={() => handleClick("locker")}
        className={active === "locker" 
          ? "bg-gradient-to-r from-secondary to-secondary-glow text-secondary-foreground font-semibold shadow-lg" 
          : "border-border hover:bg-card hover:text-foreground"
        }
      >
        📋 Token Locker
      </Button>

      {/* Token Claimed */}
      <Button 
        variant={getButtonVariant("claimed")}
        onClick={() => handleClick("claimed")}
        className={active === "claimed" 
          ? "bg-gradient-to-r from-accent to-accent-glow text-accent-foreground font-semibold shadow-lg" 
          : "border-border hover:bg-card hover:text-foreground"
        }
      >
        ✅ Token Claimed
      </Button>

      {/* All Locks */}
      <Button 
        variant={getButtonVariant("allLocks")}
        onClick={() => handleClick("allLocks")}
        className={active === "allLocks" 
          ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold shadow-lg" 
          : "border-border hover:bg-card hover:text-foreground"
        }
      >
        🌍 All Locks
      </Button>

      {/* Leaderboard */}
      <Button 
        variant={getButtonVariant("leaderboard")}
        onClick={() => handleClick("leaderboard")}
        className={active === "leaderboard" 
          ? "bg-gradient-to-r from-yellow-500 to-orange-600 text-white font-semibold shadow-lg" 
          : "border-border hover:bg-card hover:text-foreground"
        }
      >
        🏆 Leaderboard
      </Button>
    </div>
  )
}
