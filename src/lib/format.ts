export function formatNumber(n: number): string {
  if (n < 1000) return Math.floor(n).toString();

  const exponent = Math.floor(Math.log10(n) / 3);
  // 65 is 'A' in ASCII
  const suffix = String.fromCharCode(65 + exponent - 1);
  const value = n / Math.pow(1000, exponent);

  return value.toFixed(2) + suffix;
}

export function formatGold(n: number): string {
  return formatNumber(n);
}
