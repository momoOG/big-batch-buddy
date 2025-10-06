// Utility functions untuk fetch token logo dari berbagai sumber

/**
 * Generate gradient avatar berdasarkan address
 * Setiap address akan memiliki kombinasi warna yang unik
 */
const generateGradientAvatar = (address: string): string => {
  // Hash address untuk mendapatkan nilai numerik
  const hash = address.toLowerCase().slice(2, 8)
  const num = parseInt(hash, 16)
  
  // Generate 2 warna untuk gradient
  const hue1 = num % 360
  const hue2 = (num * 7) % 360
  const saturation = 60 + (num % 40)
  const lightness = 45 + (num % 20)
  
  const color1 = `hsl(${hue1}, ${saturation}%, ${lightness}%)`
  const color2 = `hsl(${hue2}, ${saturation}%, ${lightness}%)`
  
  // Buat SVG gradient avatar
  const svg = `
    <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad-${hash}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${color1};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${color2};stop-opacity:1" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="50" fill="url(#grad-${hash})" />
      <text x="50" y="65" font-family="Arial, sans-serif" font-size="40" font-weight="bold" 
            fill="white" text-anchor="middle" opacity="0.9">
        ${address.slice(2, 4).toUpperCase()}
      </text>
    </svg>
  `.trim()
  
  return `data:image/svg+xml;base64,${btoa(svg)}`
}

/**
 * Mencoba fetch logo token dari TrustWallet assets (PulseChain)
 */
const getTrustWalletLogo = async (tokenAddress: string): Promise<string | null> => {
  try {
    const url = `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/pulsechain/assets/${tokenAddress}/logo.png`
    const response = await fetch(url, { method: 'HEAD' })
    if (response.ok) return url
  } catch {}
  return null
}

/**
 * Mencoba fetch dari PulseChain Beacon (PulseChain specific assets)
 */
const getPulseChainBeaconLogo = async (tokenAddress: string): Promise<string | null> => {
  try {
    // Try various PulseChain-specific sources
    const sources = [
      `https://tokens.app.pulsex.com/images/tokens/${tokenAddress}.png`,
      `https://beacon.pulsechain.com/token/${tokenAddress}/logo.png`,
    ]
    
    for (const url of sources) {
      try {
        const response = await fetch(url, { method: 'HEAD' })
        if (response.ok) return url
      } catch {}
    }
  } catch {}
  return null
}

/**
 * Mencoba fetch logo dari Ethereum TrustWallet (untuk forked tokens)
 */
const getEthereumTrustWalletLogo = async (tokenAddress: string): Promise<string | null> => {
  try {
    const url = `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${tokenAddress}/logo.png`
    const response = await fetch(url, { method: 'HEAD' })
    if (response.ok) return url
  } catch {}
  return null
}

/**
 * Mencoba fetch dari CoinGecko API
 */
const getCoinGeckoLogo = async (tokenAddress: string): Promise<string | null> => {
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/pulsechain/contract/${tokenAddress}`,
      { method: 'GET' }
    )
    if (response.ok) {
      const data = await response.json()
      return data?.image?.small || data?.image?.thumb || null
    }
  } catch {}
  return null
}

/**
 * Main function: Mencoba fetch logo dari berbagai sumber
 * Returns logo URL (dari API atau generated avatar)
 */
export const getTokenLogo = async (tokenAddress: string): Promise<string> => {
  // Normalize address
  const checksumAddress = tokenAddress.toLowerCase()
  
  // Try PulseChain-specific sources first
  const pulseChainLogo = await getPulseChainBeaconLogo(checksumAddress)
  if (pulseChainLogo) return pulseChainLogo
  
  // Try CoinGecko
  const coinGeckoLogo = await getCoinGeckoLogo(checksumAddress)
  if (coinGeckoLogo) return coinGeckoLogo
  
  // Try TrustWallet PulseChain
  const trustWalletLogo = await getTrustWalletLogo(checksumAddress)
  if (trustWalletLogo) return trustWalletLogo
  
  // Try Ethereum TrustWallet (for forked tokens)
  const ethLogo = await getEthereumTrustWalletLogo(checksumAddress)
  if (ethLogo) return ethLogo
  
  // Fallback: Generate unique gradient avatar
  return generateGradientAvatar(checksumAddress)
}

/**
 * Batch fetch logos untuk multiple tokens
 */
export const getTokenLogos = async (tokenAddresses: string[]): Promise<Record<string, string>> => {
  const results: Record<string, string> = {}
  
  await Promise.all(
    tokenAddresses.map(async (address) => {
      results[address] = await getTokenLogo(address)
    })
  )
  
  return results
}
