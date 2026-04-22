import { deriveSegmento } from '@postoinsight/shared'

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

export interface DimProdutoInsert {
  tenantId:           string
  source:             'status'
  sourceLocationId:   string
  sourceProdutoId:    string
  nome:               string
  nomeResumido:       string | null
  categoriaCodigo:    string
  categoriaDescricao: string | null
  grupoId:            number
  grupoDescricao:     string | null
  subgrupoId:         number | null
  subgrupoDescricao:  string | null
  tipoProduto:        string | null
  unidadeVenda:       string | null
  isCombustivel:      boolean
  segmento:           string | null
  ativo:              boolean
  validFrom:          string
}

export function transformDimProduto(
  payload: DimProdutoPayload,
  tenantId: string,
  sourceLocationId: string,
  today: string,
): DimProdutoInsert[] {
  const catMap = new Map(payload.tcati.map((r) => [r.Cd_CatItem.trim().toUpperCase(), r.Descricao.trim()]))
  const grpMap = new Map(payload.tgrpi.map((r) => [r.Cd_GrpItem, r.Descricao.trim()]))
  const sgrMap = new Map(payload.tsgri.map((r) => [r.Cd_SGrItem, r.Descricao.trim()]))

  return payload.titem.map((row) => {
    const categoriaCodigo = row.Cd_CatItem.trim().toUpperCase()
    const ativo = categoriaCodigo !== 'INA' && !row.Descricao.toUpperCase().includes('INATIVO')

    return {
      tenantId,
      source:             'status',
      sourceLocationId,
      sourceProdutoId:    row.Cd_Item.trim().toUpperCase(),
      nome:               row.Descricao.trim(),
      nomeResumido:       row.DescrRes?.trim() || null,
      categoriaCodigo,
      categoriaDescricao: catMap.get(categoriaCodigo) ?? null,
      grupoId:            row.Cd_GrpItem,
      grupoDescricao:     grpMap.get(row.Cd_GrpItem) ?? null,
      subgrupoId:         row.Cd_SGrItem || null,
      subgrupoDescricao:  row.Cd_SGrItem ? (sgrMap.get(row.Cd_SGrItem) ?? null) : null,
      tipoProduto:        row.Cd_TipItem != null ? String(row.Cd_TipItem) : null,
      unidadeVenda:       row.Unidade?.trim() || null,
      isCombustivel:      categoriaCodigo === 'CB' || categoriaCodigo === 'ARL',
      segmento:           deriveSegmento(categoriaCodigo),
      ativo,
      validFrom:          row.DtCadastro ? row.DtCadastro.split('T')[0]! : today,
    }
  })
}
