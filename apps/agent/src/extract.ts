import { getPool } from './db.js'

const FATO_VENDA_SYNC_QUERY = `
  SELECT
    CD_ESTAB, DATA_EMISSAO, HORA_COMPLETA_EMISSAO, TURNO,
    NR_NOTA, NR_VENDA_INTERNO, CODIGO_ITEM, DESCRICAO_ITEM,
    CODIGO_CATEGORIA_ITEM, DESCRICAO_CATEGORIA_ITEM,
    CODIGO_GRUPO_ITEM, DESCRICAO_GRUPO_ITEM,
    CODIGO_SUBGRUPO_ITEM, DESCRICAO_SUBGRUPO_ITEM,
    QTD_VENDA, VLR_UNIT, TOT_VLRITEM,
    CUSTO_UNIT, TOT_DESCONTO_UNIT, TOT_ACRESCIMO_UNIT,
    BICO, BICO_COMBUSTIVEL, TANQUE,
    CODIGO_CLIENTE, CODIGO_VENDEDOR, FormasRecebimento
  FROM TMPBI_VENDA_DETALHADA
  WHERE CD_ESTAB = @cdEstab AND DATA_EMISSAO >= @watermark
  ORDER BY DATA_EMISSAO ASC
`

const FATO_VENDA_BACKFILL_QUERY = `
  SELECT
    CD_ESTAB, DATA_EMISSAO, HORA_COMPLETA_EMISSAO, TURNO,
    NR_NOTA, NR_VENDA_INTERNO, CODIGO_ITEM, DESCRICAO_ITEM,
    CODIGO_CATEGORIA_ITEM, DESCRICAO_CATEGORIA_ITEM,
    CODIGO_GRUPO_ITEM, DESCRICAO_GRUPO_ITEM,
    CODIGO_SUBGRUPO_ITEM, DESCRICAO_SUBGRUPO_ITEM,
    QTD_VENDA, VLR_UNIT, TOT_VLRITEM,
    CUSTO_UNIT, TOT_DESCONTO_UNIT, TOT_ACRESCIMO_UNIT,
    BICO, BICO_COMBUSTIVEL, TANQUE,
    CODIGO_CLIENTE, CODIGO_VENDEDOR, FormasRecebimento
  FROM TMPBI_VENDA_DETALHADA
  WHERE CD_ESTAB = @cdEstab AND DATA_EMISSAO >= @from AND DATA_EMISSAO <= @to
  ORDER BY DATA_EMISSAO ASC
`

export async function* extractFatoVenda(params: {
  sourceLocationId: string
} & ({
  mode: 'sync'
  watermark: string
  batchSize: number
} | {
  mode: 'backfill'
  from: string
  to: string
  batchSize: number
  delayMs: number
})): AsyncGenerator<unknown[]> {
  const pool = await getPool()
  const request = pool.request()
  request.input('cdEstab', params.sourceLocationId)

  let query: string
  if (params.mode === 'sync') {
    request.input('watermark', params.watermark)
    query = FATO_VENDA_SYNC_QUERY
  } else {
    request.input('from', params.from)
    request.input('to', params.to)
    query = FATO_VENDA_BACKFILL_QUERY
  }

  const result = await request.query(query)
  const rows = result.recordset as unknown[]

  for (let i = 0; i < rows.length; i += params.batchSize) {
    yield rows.slice(i, i + params.batchSize)

    if (params.mode === 'backfill' && params.delayMs > 0 && i + params.batchSize < rows.length) {
      await new Promise((r) => setTimeout(r, params.delayMs))
    }
  }
}

export async function extractDimProduto(): Promise<{
  titem: unknown[]
  tcati: unknown[]
  tgrpi: unknown[]
  tsgri: unknown[]
}> {
  const pool = await getPool()

  const [titem, tcati, tgrpi, tsgri] = await Promise.all([
    pool.request().query(`SELECT Cd_Item, Descricao, DescrRes, Cd_CatItem, Cd_GrpItem, Cd_SGrItem, Cd_TipItem, Unidade, DtCadastro FROM TITEM`),
    pool.request().query(`SELECT Cd_CatItem, Descricao FROM TCATI`),
    pool.request().query(`SELECT Cd_GrpItem, Descricao FROM TGRPI`),
    pool.request().query(`SELECT Cd_SGrItem, Descricao FROM TSGrI`),
  ])

  return {
    titem: titem.recordset,
    tcati: tcati.recordset,
    tgrpi: tgrpi.recordset,
    tsgri: tsgri.recordset,
  }
}
