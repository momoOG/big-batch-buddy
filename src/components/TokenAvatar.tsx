import { useState, useEffect } from "react"
import { Coins } from "lucide-react"

interface TokenAvatarProps {
  address: string
  symbol: string
  name: string
  size?: "sm" | "md" | "lg" | "xl"
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
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [logoError, setLogoError] = useState(false)
  const [logoLoading, setLogoLoading] = useState(true)
  
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-32 h-32 text-2xl"
  }

  const colors = getColorFromAddress(address, symbol)
  
  // Fetch logo dari DexScreener API
  useEffect(() => {
    const fetchDexScreenerLogo = async () => {
      try {
        const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${address}`)
        const data = await response.json()
        
        if (data.pairs && data.pairs.length > 0) {
          const tokenInfo = data.pairs[0].info
          if (tokenInfo?.imageUrl) {
            setLogoUrl(tokenInfo.imageUrl)
            setLogoLoading(false)
            return
          }
        }
      } catch (error) {
        console.log("DexScreener fetch failed, trying other sources")
      }
      
      // Fallback ke sumber lain jika DexScreener gagal
      const fallbackUrls = [
        `https://tokens.app.pulsex.com/images/tokens/${address.toLowerCase()}.png`,
        `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/pulsechain/assets/${address.toLowerCase()}/logo.png`,
        `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${address.toLowerCase()}/logo.png`,
      ]
      
      setLogoUrl(fallbackUrls[0])
    }
    
    fetchDexScreenerLogo()
  }, [address])

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
        background: logoError || logoLoading ? colors.gradient : 'transparent',
        imageRendering: 'crisp-edges'
      }}
      title={`${name} (${symbol})`}
    >
      {/* Try loading real logo */}
      {!logoError && logoUrl && (
        <img 
          src={logoUrl}
          alt={symbol}
          className="w-full h-full object-contain absolute inset-0"
          onError={handleImageError}
          onLoad={handleImageLoad}
          style={{ 
            display: logoLoading || logoError ? 'none' : 'block',
            imageRendering: '-webkit-optimize-contrast',
            backfaceVisibility: 'hidden'
          }}
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
