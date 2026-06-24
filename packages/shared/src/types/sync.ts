export type ErpSource = 'status' | 'webposto'

export type Segment = 'combustivel' | 'lubrificantes' | 'servicos' | 'conveniencia'

const SEGMENT_MAP: Record<string, Segment> = {
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

export function deriveSegment(categoryCode: string): Segment | null {
  // Normaliza para maiúsculo para evitar bugs de cadastro no ERP (ex: 'op' vs 'OP')
  return SEGMENT_MAP[categoryCode.toUpperCase()] ?? null
}
