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
  // op — categoria 'CAFES' cadastrada com código minúsculo no ERP da JAM (bug de cadastro)
  // normalizado para maiúsculo via deriveSegmento (case-insensitive)
  OP:  'conveniencia',
  // PRL — 'Produção Imbé': produção própria da lanchonete do posto (enroladinho, sanduíche)
  // economicamente é conveniência — separado no ERP apenas para controle interno da JAM Imbé
  PRL: 'conveniencia',
  LIV: 'conveniencia',
}

export function deriveSegmento(categoriaCodigo: string): Segmento | null {
  // Normaliza para maiúsculo para evitar bugs de cadastro no ERP (ex: 'op' vs 'OP')
  return SEGMENTO_MAP[categoriaCodigo.toUpperCase()] ?? null
}
