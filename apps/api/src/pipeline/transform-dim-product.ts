import { deriveSegment } from '@postoinsight/shared'

export interface StatusTitemRow {
  Cd_Item: string
  Descricao: string
  DescrRes: string | null
  Cd_CatItem: string
  Cd_GrpItem: number
  Cd_SGrItem: number | null
  Cd_TipItem: number | null
  Unidade: string | null
  DtCadastro: string | null
}

export interface StatusTcatiRow { Cd_CatItem: string; Descricao: string }
export interface StatusTgrpiRow { Cd_GrpItem: number; Descricao: string }
export interface StatusTsgriRow { Cd_SGrItem: number; Descricao: string }

export interface DimProdutoPayload {
  titem: StatusTitemRow[]
  tcati: StatusTcatiRow[]
  tgrpi: StatusTgrpiRow[]
  tsgri: StatusTsgriRow[]
}

export interface DimProductInsert {
  tenantId:         string
  source:           'status'
  sourceLocationId: string
  sourceProductId:  string
  name:             string
  shortName:        string | null
  categoryCode:     string
  categoryName:     string | null
  groupId:          number
  groupName:        string | null
  subgroupId:       number | null
  subgroupName:     string | null
  productType:      string | null
  saleUnit:         string | null
  isFuel:           boolean
  segment:          string | null
  active:           boolean
  validFrom:        string
}

export function transformDimProduto(
  payload: DimProdutoPayload,
  tenantId: string,
  sourceLocationId: string,
  today: string,
): DimProductInsert[] {
  const catMap = new Map(payload.tcati.map((r) => [r.Cd_CatItem.trim().toUpperCase(), r.Descricao.trim()]))
  const grpMap = new Map(payload.tgrpi.map((r) => [r.Cd_GrpItem, r.Descricao.trim()]))
  const sgrMap = new Map(payload.tsgri.map((r) => [r.Cd_SGrItem, r.Descricao.trim()]))

  return payload.titem.map((row) => {
    const categoryCode = row.Cd_CatItem.trim().toUpperCase()
    const active = categoryCode !== 'INA' && !row.Descricao.toUpperCase().includes('INATIVO')

    return {
      tenantId,
      source:           'status',
      sourceLocationId,
      sourceProductId:  row.Cd_Item.trim().toUpperCase(),
      name:             row.Descricao.trim(),
      shortName:        row.DescrRes?.trim() || null,
      categoryCode,
      categoryName:     catMap.get(categoryCode) ?? null,
      groupId:          row.Cd_GrpItem,
      groupName:        grpMap.get(row.Cd_GrpItem) ?? null,
      subgroupId:       row.Cd_SGrItem || null,
      subgroupName:     row.Cd_SGrItem ? (sgrMap.get(row.Cd_SGrItem) ?? null) : null,
      productType:      row.Cd_TipItem != null ? String(row.Cd_TipItem) : null,
      saleUnit:         row.Unidade?.trim() || null,
      isFuel:           categoryCode === 'CB' || categoryCode === 'ARL',
      segment:          deriveSegment(categoryCode),
      active,
      validFrom:        row.DtCadastro ? row.DtCadastro.split('T')[0]! : today,
    }
  })
}
