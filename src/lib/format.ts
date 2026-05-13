export function formatCurrency(value: number, compact = true): string {
  if (!compact) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: value >= 1_000_000 ? 2 : 0
  }).format(value);
}

export function formatNumber(value: number, maximumFractionDigits = 1): string {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits
  }).format(value);
}

export function formatRatio(value: number): string {
  if (value >= 1_000_000) {
    return `${formatNumber(value / 1_000_000, 2)}M:1`;
  }

  return `${formatNumber(value, 0)}:1`;
}
