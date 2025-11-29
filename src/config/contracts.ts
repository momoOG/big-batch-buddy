// Contract addresses for PulseChain
export const CONTRACTS = {
  LOCK: "0x5fEb7cD0CC3cC56cAAA757aBB294428b6c24b847",
  PRESALE: "0x491c1A55eBc959781770DCAeF5b8e054e67C4f96",
  USDT: "0x0Cb6F5a34ad42ec934882A05265A7d5F59b51A2f",
  USDC: "0x15D38573d2feeb82e7ad5187aB8c1D52810B1f07",
} as const;

// Presale countdown - 2 days from now
export const PRESALE_START_TIME = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).getTime();

export const PRESALE_ABI = [
  { "inputs":[{"internalType":"uint256","name":"stableAmount","type":"uint256"}],"name":"buyWithUSDC","outputs":[],"stateMutability":"nonpayable","type":"function" },
  { "inputs":[{"internalType":"uint256","name":"stableAmount","type":"uint256"}],"name":"buyWithUSDT","outputs":[],"stateMutability":"nonpayable","type":"function" },
  { "inputs":[{"internalType":"address","name":"_saleToken","type":"address"},{"internalType":"address","name":"_usdc","type":"address"},{"internalType":"address","name":"_usdt","type":"address"},{"internalType":"address","name":"_fundsWallet","type":"address"}],"stateMutability":"nonpayable","type":"constructor" },
  { "inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"OwnableInvalidOwner","type":"error" },
  { "inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"OwnableUnauthorizedAccount","type":"error" },
  { "anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event" },
  { "inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function" },
  { "inputs":[{"internalType":"address","name":"_wallet","type":"address"}],"name":"setFundsWallet","outputs":[],"stateMutability":"nonpayable","type":"function" },
  { "anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"wallet","type":"address"}],"name":"SetFundsWallet","type":"event" },
  { "inputs":[{"internalType":"bool","name":"_active","type":"bool"}],"name":"setSaleActive","outputs":[],"stateMutability":"nonpayable","type":"function" },
  { "anonymous":false,"inputs":[{"indexed":false,"internalType":"bool","name":"active","type":"bool"}],"name":"SetSaleActive","type":"event" },
  { "anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"buyer","type":"address"},{"indexed":true,"internalType":"address","name":"stableToken","type":"address"},{"indexed":false,"internalType":"uint256","name":"stableAmount","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"tokenAmount","type":"uint256"}],"name":"TokensPurchased","type":"event" },
  { "inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function" },
  { "inputs":[{"internalType":"address","name":"to","type":"address"}],"name":"withdrawUnsoldTokens","outputs":[],"stateMutability":"nonpayable","type":"function" },
  { "inputs":[],"name":"fundsWallet","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function" },
  { "inputs":[],"name":"HARD_CAP","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function" },
  { "inputs":[],"name":"MAX_PRESALE_TOKENS","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function" },
  { "inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function" },
  { "inputs":[],"name":"saleActive","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function" },
  { "inputs":[],"name":"saleToken","outputs":[{"internalType":"contract IERC20","name":"","type":"address"}],"stateMutability":"view","type":"function" },
  { "inputs":[],"name":"STABLE_DECIMALS","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function" },
  { "inputs":[],"name":"TOKENS_PER_USD","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function" },
  { "inputs":[],"name":"tokensSold","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function" },
  { "inputs":[],"name":"totalRaised","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function" },
  { "inputs":[],"name":"usdc","outputs":[{"internalType":"contract IERC20","name":"","type":"address"}],"stateMutability":"view","type":"function" },
  { "inputs":[],"name":"usdt","outputs":[{"internalType":"contract IERC20","name":"","type":"address"}],"stateMutability":"view","type":"function" }
] as const;

export const ERC20_ABI = [
  {
    "inputs": [{ "name": "account", "type": "address" }],
    "name": "balanceOf",
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "owner", "type": "address" },
      { "name": "spender", "type": "address" }
    ],
    "name": "allowance",
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
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
    "inputs": [],
    "name": "decimals",
    "outputs": [{ "name": "", "type": "uint8" }],
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
] as const;
