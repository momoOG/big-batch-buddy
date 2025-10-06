// Utility functions untuk fetch token logo dari berbagai sumber

/**
 * Mencoba fetch logo token dari TrustWallet assets (PulseChain)
 * TrustWallet memiliki database logo untuk berbagai chain
 */
const getTrustWalletLogo = async (tokenAddress: string): Promise<string | null> => {
  try {
    // PulseChain chain ID = 369
    const url = `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/pulsechain/assets/${tokenAddress}/logo.png`
    const response = await fetch(url, { method: 'HEAD' })
    if (response.ok) return url
  } catch {}
  return null
}

/**
 * Mencoba fetch logo dari GitHub trustwallet assets (Ethereum fallback)
 * Karena banyak token PulseChain adalah fork dari Ethereum
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
 * Mencoba fetch dari Uniswap token list
 */
const getUniswapLogo = async (tokenAddress: string): Promise<string | null> => {
  try {
    const url = `https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/${tokenAddress}/logo.png`
    const response = await fetch(url, { method: 'HEAD' })
    if (response.ok) return url
  } catch {}
  return null
}

/**
 * Main function: Mencoba fetch logo dari berbagai sumber
 * Returns logo URL atau null jika tidak ditemukan
 */
export const getTokenLogo = async (tokenAddress: string): Promise<string | null> => {
  // Normalize address
  const checksumAddress = tokenAddress.toLowerCase()
  
  // Try TrustWallet PulseChain first
  const trustWalletLogo = await getTrustWalletLogo(checksumAddress)
  if (trustWalletLogo) return trustWalletLogo
  
  // Try Ethereum TrustWallet (for forked tokens)
  const ethLogo = await getEthereumTrustWalletLogo(checksumAddress)
  if (ethLogo) return ethLogo
  
  // Try Uniswap
  const uniswapLogo = await getUniswapLogo(checksumAddress)
  if (uniswapLogo) return uniswapLogo
  
  return null
}

/**
 * Batch fetch logos untuk multiple tokens
 */
export const getTokenLogos = async (tokenAddresses: string[]): Promise<Record<string, string | null>> => {
  const results: Record<string, string | null> = {}
  
  await Promise.all(
    tokenAddresses.map(async (address) => {
      results[address] = await getTokenLogo(address)
    })
  )
  
  return results
}
