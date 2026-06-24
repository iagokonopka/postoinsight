import { deriveSegment } from '@postoinsight/shared'

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

export interface FactSaleInsert {
  tenantId:         string
  locationId:       string
  sourceLocationId: string
  saleDate:            string
  saleTime:            string | null
  shift:               string | null
  invoiceNumber:       string | null
  sourceProductId:     string
  productName:         string
  categoryCode:        string
  categoryName:        string | null
  groupId:             number
  groupName:           string | null
  subgroupId:          number | null
  subgroupName:        string | null
  isFuel:              boolean
  segment:             string | null
  quantity:            string
  unitValue:           string
  totalValue:          string
  unitCost:            string | null
  discountTotal:       string | null
  surchargeTotal:      string | null
  nozzleCode:          number | null
  nozzleName:          string | null
  tankCode:            string | null
  tankName:            string | null
  sourceCustomerId:    string | null
  sourceEmployeeId:    string | null
  paymentMethodType:   null
  source:              'status'
  sourceId:            string
}

export function transformStatusVenda(
  row: StatusVendaRow,
  tenantId: string,
  locationId: string,
): FactSaleInsert {
  const categoryCode = row.CODIGO_CATEGORIA_ITEM.trim().toUpperCase()

  // Tanque: "03 - GASOLINA" → codigo="03", descricao="03 - GASOLINA"
  const tanqueRaw = row.TANQUE?.trim() || null
  const tanqueCodigo = tanqueRaw ? tanqueRaw.split(' - ')[0]?.trim() ?? null : null

  // source_id: FormasRecebimento se > 0, senão composto
  const sourceId = (row.FormasRecebimento && row.FormasRecebimento > 0)
    ? String(row.FormasRecebimento)
    : `${row.NR_VENDA_INTERNO}-${row.CODIGO_ITEM.trim()}`

  return {
    tenantId,
    locationId,
    sourceLocationId:    row.CD_ESTAB.trim(),
    saleDate:            row.DATA_EMISSAO.split('T')[0] ?? row.DATA_EMISSAO,
    saleTime:            row.HORA_COMPLETA_EMISSAO?.trim() || null,
    shift:               row.TURNO?.trim() || null,
    invoiceNumber:       row.NR_NOTA && Number(row.NR_NOTA) !== 0 ? row.NR_NOTA : null,
    sourceProductId:     row.CODIGO_ITEM.trim().toUpperCase(),
    productName:         row.DESCRICAO_ITEM.trim(),
    categoryCode,
    categoryName:        row.DESCRICAO_CATEGORIA_ITEM?.trim() || null,
    groupId:             row.CODIGO_GRUPO_ITEM,
    groupName:           row.DESCRICAO_GRUPO_ITEM?.trim() || null,
    subgroupId:          row.CODIGO_SUBGRUPO_ITEM || null,
    subgroupName:        row.DESCRICAO_SUBGRUPO_ITEM?.trim() || null,
    isFuel:              categoryCode === 'CB' || categoryCode === 'ARL',
    segment:             deriveSegment(categoryCode),
    quantity:            row.QTD_VENDA,
    unitValue:           row.VLR_UNIT,
    totalValue:          row.TOT_VLRITEM,
    unitCost:            row.CUSTO_UNIT && Number(row.CUSTO_UNIT) !== 0 ? row.CUSTO_UNIT : null,
    discountTotal:       row.TOT_DESCONTO_UNIT && Number(row.TOT_DESCONTO_UNIT) !== 0 ? row.TOT_DESCONTO_UNIT : null,
    surchargeTotal:      row.TOT_ACRESCIMO_UNIT && Number(row.TOT_ACRESCIMO_UNIT) !== 0 ? row.TOT_ACRESCIMO_UNIT : null,
    nozzleCode:          row.BICO && row.BICO !== 0 ? row.BICO : null,
    nozzleName:          (row.BICO && row.BICO !== 0 && row.BICO_COMBUSTIVEL?.trim()) ? row.BICO_COMBUSTIVEL.trim() : null,
    tankCode:            tanqueCodigo,
    tankName:            tanqueRaw,
    sourceCustomerId:    row.CODIGO_CLIENTE && row.CODIGO_CLIENTE !== 1 ? String(row.CODIGO_CLIENTE) : null,
    sourceEmployeeId:    row.CODIGO_VENDEDOR && row.CODIGO_VENDEDOR !== 0 ? String(row.CODIGO_VENDEDOR) : null,
    paymentMethodType:   null,
    source:              'status',
    sourceId,
  }
}
