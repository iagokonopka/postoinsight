export type ErpSource = 'status' | 'webposto'

export type Segmento = 'combustivel' | 'lubrificantes' | 'servicos' | 'conveniencia'

const SEGMENTO_MAP: Record<string, Segmento> = {
  CB:  'combustivel',
  ARL: 'combustivel',
  LUB: 'lubrificantes',
  FLT: 'lubrificantes',
  FLF: 'lubrificantes',
  ASS: 'lubrificantes',
  LV:  'servicos',
  LU:  'servicos',
  BAN: 'servicos',
  MAQ: 'servicos',
  CV:  'conveniencia',
  TAB: 'conveniencia',
  BEB: 'conveniencia',
  EMP: 'conveniencia',
  LAN: 'conveniencia',
  PAT: 'conveniencia',
  op:  'conveniencia',
  LIV: 'conveniencia',
}

export function deriveSegmento(categoriaCodigo: string): Segmento | null {
  return SEGMENTO_MAP[categoriaCodigo] ?? null
}
