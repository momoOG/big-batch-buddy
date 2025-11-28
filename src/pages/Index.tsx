import { useState } from "react"
import { ConnectButton } from "@/components/ConnectButton"
import { Navbar } from "@/components/Navbar" 
import { SimpleLockForm } from "@/components/SimpleLockForm"
import { MyLockedTokens } from "@/components/MyLockedTokens"
import { ClaimedTokens } from "@/components/ClaimedTokens"
import { AllLocks } from "@/components/AllLocks"

import instagramIcon from "@/assets/instagram.png"
import telegramIcon from "@/assets/telegram.png"
import tiktokIcon from "@/assets/tiktok.png"
import xIcon from "@/assets/x.png"

const Index = () => {
  const [activeTab, setActiveTab] = useState<"lock" | "locker" | "claimed" | "allLocks">("lock")
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [showTipModal, setShowTipModal] = useState(false)

  const handleLocked = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  const copyCA = () => {
    navigator.clipboard.writeText("0xa2193d3a129e97be8858769631b9fd1487e5bfb3")
    alert("✅ Address copied to clipboard!")
  }

  const renderContent = () => {
    switch (activeTab) {
      case "lock":
        return (
          <div className="space-y-4">
            <SimpleLockForm onLocked={handleLocked} />

            {/* Tombol Tip a Coffee */}
            <div className="text-center mt-4">
              <button
                onClick={() => setShowTipModal(true)}
                className="px-4 py-2 text-sm rounded-lg bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow hover:opacity-90"
              >
                ☕ Tip a Coffee
              </button>
            </div>
          </div>
        )
      case "locker":
        return (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-6 bg-gradient-to-r from-accent to-accent-glow bg-clip-text text-transparent">
              My Locked Tokens
            </h2>
            <MyLockedTokens />
          </div>
        )
      case "claimed":
        return (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-6 bg-gradient-to-r from-accent to-accent-glow bg-clip-text text-transparent">
              Claimed Tokens
            </h2>
            <ClaimedTokens />
          </div>
        )
      case "allLocks":
        return (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-6 bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
              🌍 All Locks
            </h2>
            <AllLocks />
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                🔒 Lockify
              </h1>
              <p className="text-sm text-muted-foreground">Secure Token Locker on PulseChain</p>
            </div>
            <ConnectButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Navigation */}
          <Navbar onChange={setActiveTab} />

          {/* Content Area */}
          <div className="mt-8">
            {renderContent()}
          </div>

          {/* Features Section */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-card border-border rounded-xl p-6 shadow-lg">
              <div className="text-3xl mb-4">🛡️</div>
              <h3 className="font-semibold text-foreground mb-2">Secure Locking</h3>
              <p className="text-sm text-muted-foreground">
                Your tokens are secured by smart contracts on PulseChain, ensuring complete safety and transparency.
              </p>
            </div>

            <div className="bg-card border-border rounded-xl p-6 shadow-lg">
              <div className="text-3xl mb-4">⏰</div>
              <h3 className="font-semibold text-foreground mb-2">Flexible Durations</h3>
              <p className="text-sm text-muted-foreground">
                Choose from multiple lock durations, from minutes to years, to suit your investment strategy.
              </p>
            </div>

            <div className="bg-card border-border rounded-xl p-6 shadow-lg">
              <div className="text-3xl mb-4">🌟</div>
              <h3 className="font-semibold text-foreground mb-2">Build Trust</h3>
              <p className="text-sm text-muted-foreground">
                Demonstrate commitment to your project by locking tokens, building confidence in your community.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/30 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="flex justify-center items-center gap-4 mb-4">
              <a href="https://instagram.com/" target="_blank" className="p-2 rounded-lg hover:bg-muted transition-colors">
                <img src={instagramIcon} alt="Instagram" className="w-6 h-6" />
              </a>
              <a href="https://t.me/Lockify_pulse/" target="_blank" className="p-2 rounded-lg hover:bg-muted transition-colors">
                <img src={telegramIcon} alt="Telegram" className="w-6 h-6" />
              </a>
              <a href="https://tiktok.com/" target="_blank" className="p-2 rounded-lg hover:bg-muted transition-colors">
                <img src={tiktokIcon} alt="TikTok" className="w-6 h-6" />
              </a>
              <a href="https://x.com/Lockify_Pulse" target="_blank" className="p-2 rounded-lg hover:bg-muted transition-colors">
                <img src={xIcon} alt="X (Twitter)" className="w-6 h-6" />
              </a>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 Lockify. Secure token locking on PulseChain.
            </p>
          </div>
        </div>
      </footer>

      {/* Modal Tip a Coffee */}
      {showTipModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-card rounded-xl p-6 max-w-sm w-full shadow-lg">
            <h2 className="text-lg font-semibold mb-4">☕ Support Lockify</h2>
            <p className="text-sm mb-2">Send a small tip to support development:</p>
            <div className="bg-muted p-2 rounded font-mono text-xs break-all">
              0xa2193d3a129e97be8858769631b9fd1487e5bfb3
            </div>
            <button
              onClick={copyCA}
              className="mt-3 px-4 py-2 rounded-lg bg-gradient-to-r from-pink-500 to-purple-500 text-white w-full shadow hover:opacity-90"
            >
              📋 Copy Address
            </button>
            <button
              onClick={() => setShowTipModal(false)}
              className="mt-2 px-4 py-2 rounded-lg bg-muted text-foreground w-full"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Index
