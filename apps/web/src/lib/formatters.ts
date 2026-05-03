// Formatadores de valores — portados do layout.jsx do design

export function fBRL(v: number | null | undefined): string {
  if (v == null) return '—';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(v);
}

export function fNum(v: number | null | undefined, decimals = 0): string {
  if (v == null) return '—';
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(v);
}

export function fPct(v: number | null | undefined, decimals = 1): string {
  if (v == null) return '—';
  return fNum(v, decimals) + '%';
}

export function fLitros(v: number | null | undefined): string {
  return fNum(v) + ' L';
}

// Formata preço por litro com 2 casas decimais
export function fLitroPreco(v: number | null | undefined): string {
  if (v == null) return '—';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v);
}