import { deriveSegmento } from '@postoinsight/shared'

export interface StatusVendaRow {
  CD_ESTAB: string
  DATA_EMISSAO: string
  HORA_COMPLETA_EMISSAO: string | null
  TURNO: string | null
  NR_NOTA: string | null
  NR_VENDA_INTERNO: string
  CODIGO_ITEM: string
  DESCRICAO_ITEM: string
  CODIGO_CATEGORIA_ITEM: string
  DESCRICAO_CATEGORIA_ITEM: string | null
  CODIGO_GRUPO_ITEM: number
  DESCRICAO_GRUPO_ITEM: string | null
  CODIGO_SUBGRUPO_ITEM: number | null
  DESCRICAO_SUBGRUPO_ITEM: string | null
  QTD_VENDA: string
  VLR_UNIT: string
  TOT_VLRITEM: string
  CUSTO_UNIT: string | null
  TOT_DESCONTO_UNIT: string | null
  TOT_ACRESCIMO_UNIT: string | null
  BICO: number | null
  BICO_COMBUSTIVEL: string | null
  TANQUE: string | null
  CODIGO_CLIENTE: number | null
  CODIGO_VENDEDOR: number | null
  FormasRecebimento: number | null
}

export interface FatoVendaInsert {
  tenantId:            string
  postoId:             string
  sourcePostoId:       string
  dataVenda:           string
  horaVenda:           string | null
  turno:               string | null
  nrNota:              string | null
  sourceProdutoId:     string
  descricaoProduto:    string
  categoriaCodigo:     string
  categoriaDescricao:  string | null
  grupoId:             number
  grupoDescricao:      string | null
  subgrupoId:          number | null
  subgrupoDescricao:   string | null
  isCombustivel:       boolean
  segmento:            string | null
  qtdVenda:            string
  vlrUnitario:         string
  vlrTotal:            string
  custoUnitario:       string | null
  descontoTotal:       string | null
  acrescimoTotal:      string | null
  bicoCodigo:          number | null
  bicoDescricao:       string | null
  tanqueCodigo:        string | null
  tanqueDescricao:     string | null
  sourceClienteId:     string | null
  sourceFuncionarioId: string | null
  formaPagamentoTipo:  null
  source:              'status'
  sourceId:            string
}

export function transformStatusVenda(
  row: StatusVendaRow,
  tenantId: string,
  postoId: string,
): FatoVendaInsert {
  const categoriaCodigo = row.CODIGO_CATEGORIA_ITEM.trim().toUpperCase()

  // Tanque: "03 - GASOLINA" → codigo="03", descricao="03 - GASOLINA"
  const tanqueRaw = row.TANQUE?.trim() || null
  const tanqueCodigo = tanqueRaw ? tanqueRaw.split(' - ')[0]?.trim() ?? null : null

  // source_id: FormasRecebimento se > 0, senão composto
  const sourceId = (row.FormasRecebimento && row.FormasRecebimento > 0)
    ? String(row.FormasRecebimento)
    : `${row.NR_VENDA_INTERNO}-${row.CODIGO_ITEM.trim()}`

  return {
    tenantId,
    postoId,
    sourcePostoId:       row.CD_ESTAB.trim(),
    dataVenda:           row.DATA_EMISSAO.split('T')[0] ?? row.DATA_EMISSAO,
    horaVenda:           row.HORA_COMPLETA_EMISSAO?.trim() || null,
    turno:               row.TURNO?.trim() || null,
    nrNota:              row.NR_NOTA && Number(row.NR_NOTA) !== 0 ? row.NR_NOTA : null,
    sourceProdutoId:     row.CODIGO_ITEM.trim().toUpperCase(),
    descricaoProduto:    row.DESCRICAO_ITEM.trim(),
    categoriaCodigo,
    categoriaDescricao:  row.DESCRICAO_CATEGORIA_ITEM?.trim() || null,
    grupoId:             row.CODIGO_GRUPO_ITEM,
    grupoDescricao:      row.DESCRICAO_GRUPO_ITEM?.trim() || null,
    subgrupoId:          row.CODIGO_SUBGRUPO_ITEM || null,
    subgrupoDescricao:   row.DESCRICAO_SUBGRUPO_ITEM?.trim() || null,
    isCombustivel:       categoriaCodigo === 'CB' || categoriaCodigo === 'ARL',
    segmento:            deriveSegmento(categoriaCodigo),
    qtdVenda:            row.QTD_VENDA,
    vlrUnitario:         row.VLR_UNIT,
    vlrTotal:            row.TOT_VLRITEM,
    custoUnitario:       row.CUSTO_UNIT && Number(row.CUSTO_UNIT) !== 0 ? row.CUSTO_UNIT : null,
    descontoTotal:       row.TOT_DESCONTO_UNIT && Number(row.TOT_DESCONTO_UNIT) !== 0 ? row.TOT_DESCONTO_UNIT : null,
    acrescimoTotal:      row.TOT_ACRESCIMO_UNIT && Number(row.TOT_ACRESCIMO_UNIT) !== 0 ? row.TOT_ACRESCIMO_UNIT : null,
    bicoCodigo:          row.BICO && row.BICO !== 0 ? row.BICO : null,
    bicoDescricao:       (row.BICO && row.BICO !== 0 && row.BICO_COMBUSTIVEL?.trim()) ? row.BICO_COMBUSTIVEL.trim() : null,
    tanqueCodigo,
    tanqueDescricao:     tanqueRaw,
    sourceClienteId:     row.CODIGO_CLIENTE && row.CODIGO_CLIENTE !== 1 ? String(row.CODIGO_CLIENTE) : null,
    sourceFuncionarioId: row.CODIGO_VENDEDOR && row.CODIGO_VENDEDOR !== 0 ? String(row.CODIGO_VENDEDOR) : null,
    formaPagamentoTipo:  null,
    source:              'status',
    sourceId,
  }
}
