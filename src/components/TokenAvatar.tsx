import { useState } from "react"
import { Coins } from "lucide-react"

interface TokenAvatarProps {
  address: string
  symbol: string
  name: string
  size?: "sm" | "md" | "lg"
}

/**
 * Generate consistent color dari token address
 */
const getColorFromAddress = (address: string, tokenSymbol: string) => {
  const hash = address.toLowerCase().slice(2, 8)
  const num = parseInt(hash, 16)
  
  const hue1 = num % 360
  const hue2 = (num * 7) % 360
  const saturation = 65
  const lightness = 55
  
  return {
    gradient: `linear-gradient(135deg, hsl(${hue1}, ${saturation}%, ${lightness}%), hsl(${hue2}, ${saturation}%, ${lightness}%))`,
    initial: tokenSymbol.slice(0, 2).toUpperCase() || address.slice(2, 4).toUpperCase()
  }
}

export function TokenAvatar({ address, symbol, name, size = "md" }: TokenAvatarProps) {
  const [logoError, setLogoError] = useState(false)
  const [logoLoading, setLogoLoading] = useState(true)
  
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base"
  }

  const colors = getColorFromAddress(address, symbol)
  
  // URLs untuk coba fetch logo
  const logoUrls = [
    `https://tokens.app.pulsex.com/images/tokens/${address.toLowerCase()}.png`,
    `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/pulsechain/assets/${address.toLowerCase()}/logo.png`,
    `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${address.toLowerCase()}/logo.png`,
  ]

  const tryNextLogo = (urls: string[], index: number = 0): string | null => {
    if (index >= urls.length) return null
    return urls[index]
  }

  const handleImageError = () => {
    setLogoError(true)
    setLogoLoading(false)
  }

  const handleImageLoad = () => {
    setLogoLoading(false)
  }

  return (
    <div 
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center overflow-hidden border-2 border-border shadow-md relative`}
      style={{ 
        background: logoError || logoLoading ? colors.gradient : 'transparent'
      }}
      title={`${name} (${symbol})`}
    >
      {/* Try loading real logo */}
      {!logoError && (
        <img 
          src={logoUrls[0]}
          alt={symbol}
          className="w-full h-full object-cover absolute inset-0"
          onError={handleImageError}
          onLoad={handleImageLoad}
          style={{ display: logoLoading || logoError ? 'none' : 'block' }}
        />
      )}
      
      {/* Fallback: Show initial letters */}
      {(logoError || logoLoading) && (
        <div className="flex items-center justify-center w-full h-full">
          <span className="font-bold text-white drop-shadow-md">
            {colors.initial}
          </span>
        </div>
      )}
    </div>
  )
}
