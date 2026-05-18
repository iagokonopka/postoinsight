/**
 * Formatadores de valores — PostoInsight
 * Uso: fBRL(1234.5) → "R$ 1.234,50"
 */

const BRL = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const BRL_COMPACT = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  notation: 'compact',
  maximumFractionDigits: 1,
});

const NUM = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const NUM_1 = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/** R$ 1.234,50 */
export function fBRL(value: number): string {
  return BRL.format(value);
}

/** R$ 1,2k / R$ 3,4M — para labels de gráfico */
export function fBRLCompact(value: number): string {
  return BRL_COMPACT.format(value);
}

/** 12,34% */
export function fPct(value: number, decimals = 1): string {
  return `${value.toFixed(decimals).replace('.', ',')}%`;
}

/** 1.234 L */
export function fLitros(value: number): string {
  return `${NUM.format(Math.round(value))} L`;
}

/** 1.234 (inteiro) ou 1.234,5 (1 decimal) */
export function fNum(value: number, decimals = 0): string {
  return decimals === 0 ? NUM.format(value) : NUM_1.format(value);
}

/**
 * Delta formatado com sinal e cor
 * Retorna { label: "+3,2%", positive: true }
 */
export function fDelta(value: number, format: 'pct' | 'brl' = 'pct'): {
  label: string;
  positive: boolean;
  neutral: boolean;
} {
  const neutral = Math.abs(value) < 0.005;
  const positive = value > 0;
  const sign = positive ? '+' : '';
  const label =
    format === 'pct'
      ? `${sign}${fPct(value)}`
      : `${sign}${fBRL(value)}`;
  return { label, positive, neutral };
}

/** R$/L com 3 decimais — preço de combustível */
export function fPrecoLitro(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });
}
