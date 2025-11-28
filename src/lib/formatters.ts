// Formatting helpers for presale

export function formatNumber(value: number, decimals: number = 2): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatUsd(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatLock(value: number): string {
  return `${formatNumber(value, 0)} LOCK`;
}

export function formatTokenAmount(value: bigint, decimals: number): number {
  return Number(value) / Math.pow(10, decimals);
}

export function parseTokenAmount(value: string, decimals: number): bigint {
  const num = parseFloat(value);
  if (isNaN(num) || num <= 0) return BigInt(0);
  return BigInt(Math.round(num * Math.pow(10, decimals)));
}
