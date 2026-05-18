const ptBR = 'pt-BR';

/** R$ 284.320,00 */
export function fmtBRL(value: number): string {
  return new Intl.NumberFormat(ptBR, {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/** R$ 284k / R$ 1,2M — para eixos de gráfico */
export function fmtBRLk(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    return `R$ ${(value / 1_000_000).toLocaleString(ptBR, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}M`;
  }
  if (Math.abs(value) >= 1_000) {
    return `R$ ${(value / 1_000).toLocaleString(ptBR, { minimumFractionDigits: 0, maximumFractionDigits: 1 })}k`;
  }
  return fmtBRL(value);
}

/** 28.400 L */
export function fmtLitros(value: number): string {
  const formatted = Number.isInteger(value)
    ? value.toLocaleString(ptBR, { minimumFractionDigits: 0, maximumFractionDigits: 0 })
    : value.toLocaleString(ptBR, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  return `${formatted} L`;
}

/** 8,7% */
export function fmtPct(value: number, decimals = 1): string {
  return value.toLocaleString(ptBR, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }) + '%';
}

/** 1.234 */
export function fmtNum(value: number): string {
  return value.toLocaleString(ptBR, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

/** 12k — para heatmap e contagens compactas */
export function fmtK(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    return `${(value / 1_000_000).toLocaleString(ptBR, { maximumFractionDigits: 1 })}M`;
  }
  if (Math.abs(value) >= 1_000) {
    return `${(value / 1_000).toLocaleString(ptBR, { maximumFractionDigits: 1 })}k`;
  }
  return String(value);
}

/** +8,7% / -3,2% — com sinal explícito */
export function fmtDelta(value: number, decimals = 1): string {
  const sign = value > 0 ? '+' : '';
  return sign + fmtPct(value, decimals);
}
