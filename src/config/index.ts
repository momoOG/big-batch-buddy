// Contract configuration for PulseChain Token Locker
export const CONTRACT_ADDRESS = "0x11D422b5467e430B0afA97858b47b0bD2661f12a"

export const TOKEN_LOCKER_ABI = [
  {
    "inputs": [
      { "name": "tokenAddress", "type": "address" },
      { "name": "amount", "type": "uint256" },
      { "name": "duration", "type": "uint256" }
    ],
    "name": "lockTokens",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "name": "index", "type": "uint256" }],
    "name": "claimTokens",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "name": "user", "type": "address" }],
    "name": "getUserLockCount",
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "user", "type": "address" },
      { "name": "index", "type": "uint256" }
    ],
    "name": "getLock",
    "outputs": [
      { "name": "token", "type": "address" },
      { "name": "amount", "type": "uint256" },
      { "name": "unlockTime", "type": "uint256" },
      { "name": "claimed", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const

export const ERC20_ABI = [
  {
    "inputs": [
      { "name": "spender", "type": "address" },
      { "name": "amount", "type": "uint256" }
    ],
    "name": "approve",
    "outputs": [{ "name": "", "type": "bool" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "name": "account", "type": "address" }],
    "name": "balanceOf",
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [{ "name": "", "type": "uint8" }],
    "stateMutability": "view",
    "type": "function"
  },
  // Tambahan biar bisa ambil info token
  {
    "inputs": [],
    "name": "name",
    "outputs": [{ "name": "", "type": "string" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "symbol",
    "outputs": [{ "name": "", "type": "string" }],
    "stateMutability": "view",
    "type": "function"
  }
] as const

// PulseChain configuration
export const PULSECHAIN_CONFIG = {
  id: 369,
  name: "PulseChain",
  network: "pulsechain",
  nativeCurrency: {
    decimals: 18,
    name: "Pulse",
    symbol: "PLS",
  },
  rpcUrls: {
    public: { http: ["https://rpc.pulsechain.com"] },
    default: { http: ["https://rpc.pulsechain.com"] },
  },
  blockExplorers: {
    default: { name: "PulseScan", url: "https://scan.pulsechain.com" },
  },
} as const
