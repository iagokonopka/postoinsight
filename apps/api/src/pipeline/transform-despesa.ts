/**
 * Transforma uma linha de TMPBI_DOCUMENTOS_BAIXADOS (Status ERP) em um registro
 * canônico de despesa. Grão: 1 linha = 1 baixa. Spec: docs/specs/despesas.md
 *
 * O valor é normalizado para positivo. O filtro de lixo/rateio (CD_TIPTIT='RB'
 * + DESCONTO ADIANT.CLIENTES) é aplicado na origem (agente), e reforçado aqui.
 */

export interface StatusDespesaRow {
  CD_ESTAB: string
  DATA_MOV: string
  ID_DOCUM: string
  SQ_DOCUM: string | null
  SQ_BAIXA_MOV: number | string | null
  CD_TIPTIT: string | null
  VALOR_MOV: string | number | null
  DESCR_LOP: string | null
  TIPO_MOVTO: string | null
  CD_GRPFOPER: number | string | null
  DESCR_GF: string | null
  CD_CENTRO: string | null
  DESCR_CENTRO: string | null
  OPERACAO: string | null
  TIPO_LANCAMENTO: string | null
  DESCR_MODPAG: string | null
  NOME: string | null
  CGC: string | null
}

export interface FatoDespesaInsert {
  tenantId:                  string
  locationId:                string
  sourceLocationId:          string
  dataDespesa:               string
  descricao:                 string | null
  grupoFinanceiroCodigo:     string | null
  grupoFinanceiroDescricao:  string | null
  centroCustoCodigo:         string | null
  centroCustoDescricao:      string | null
  operacao:                  string | null
  tipoLancamento:            string | null
  fornecedorNome:            string | null
  fornecedorDoc:             string | null
  valor:                     string
  source:                    'status'
  sourceId:                  string
}

function clean(v: string | null | undefined): string | null {
  const s = v?.trim()
  return s && s !== '0' ? s : null
}

/** true quando a linha é lixo de rateio/template (não é despesa real). */
export function isRateioNoise(row: StatusDespesaRow): boolean {
  return row.CD_TIPTIT?.trim() === 'RB'
    && row.DESCR_MODPAG?.trim() === 'DESCONTO ADIANT.CLIENTES'
}

export function transformStatusDespesa(
  row: StatusDespesaRow,
  tenantId: string,
  locationId: string,
): FatoDespesaInsert {
  const grupoCodigo = row.CD_GRPFOPER !== null && row.CD_GRPFOPER !== undefined
    ? String(row.CD_GRPFOPER).trim()
    : null

  const sourceId = [
    row.ID_DOCUM?.trim() ?? '',
    row.SQ_DOCUM?.trim() ?? '',
    String(row.SQ_BAIXA_MOV ?? ''),
  ].join('-')

  // VALOR_MOV pode vir negativo (estorno/sinal). Normaliza para positivo.
  const valorNum = Math.abs(Number(row.VALOR_MOV ?? 0))

  return {
    tenantId,
    locationId,
    sourceLocationId:         row.CD_ESTAB.trim(),
    dataDespesa:              row.DATA_MOV.split('T')[0] ?? row.DATA_MOV,
    descricao:                clean(row.DESCR_LOP) ?? clean(row.TIPO_MOVTO),
    grupoFinanceiroCodigo:    grupoCodigo && grupoCodigo !== '0' ? grupoCodigo : null,
    grupoFinanceiroDescricao: clean(row.DESCR_GF),
    centroCustoCodigo:        clean(row.CD_CENTRO),
    centroCustoDescricao:     clean(row.DESCR_CENTRO),
    operacao:                 clean(row.OPERACAO),
    tipoLancamento:           clean(row.TIPO_LANCAMENTO),
    fornecedorNome:           clean(row.NOME),
    fornecedorDoc:            clean(row.CGC),
    valor:                    valorNum.toFixed(2),
    source:                   'status',
    sourceId,
  }
}
