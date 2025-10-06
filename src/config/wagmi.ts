import { http, createConfig } from 'wagmi'
import { mainnet, sepolia } from 'wagmi/chains'
import { metaMask, injected, walletConnect, coinbaseWallet } from 'wagmi/connectors'
import { PULSECHAIN_CONFIG } from './index'

// Create custom PulseChain chain definition
const pulsechain = {
  ...PULSECHAIN_CONFIG,
  testnet: false,
} as const

export const config = createConfig({
  chains: [pulsechain as any, mainnet, sepolia],
  connectors: [
    injected({
      target() {
        return {
          id: 'injected',
          name: 'Injected Wallet',
          icon: '',
          provider: typeof window !== 'undefined' ? window.ethereum : undefined,
        }
      },
    }),
    metaMask(),
    coinbaseWallet({
      appName: 'Lockify Token Locker',
    }),
    walletConnect({ 
      projectId: 'c84d9e9b0c2c4c8b9c5e1a9b8c7d6e5f4a3b2c1d' // Generic project ID
    }),
  ],
  transports: {
    [pulsechain.id]: http(),
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}