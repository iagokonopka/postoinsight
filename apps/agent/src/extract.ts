import type sql from 'mssql'
import { getPool } from './db.js'

/**
 * Executa uma query em modo STREAMING e emite as linhas em lotes, com
 * backpressure: o stream é pausado enquanto o consumidor processa cada lote,
 * mantendo o uso de memória constante independente do tamanho do resultado.
 *
 * Substitui o padrão antigo (request.query carregava o recordset inteiro na
 * RAM → estourava o heap em sincronizações de histórico completo).
 */
export async function* streamQuery(
  pool: sql.ConnectionPool,
  query: string,
  inputs: Record<string, string>,
  batchSize: number,
): AsyncGenerator<unknown[]> {
  const request = pool.request()
  for (const [k, v] of Object.entries(inputs)) request.input(k, v)
  request.stream = true

  let batch: unknown[] = []
  const queue: unknown[][] = []
  let finished = false
  let failure: Error | null = null
  let wake: (() => void) | null = null

  const signal = () => { if (wake) { wake(); wake = null } }

  request.on('row', (row: unknown) => {
    batch.push(row)
    if (batch.length >= batchSize) {
      queue.push(batch)
      batch = []
      request.pause()   // backpressure: para até o consumidor drenar
      signal()
    }
  })
  request.on('error', (err: Error) => { failure = err; signal() })
  request.on('done', () => {
    if (batch.length > 0) { queue.push(batch); batch = [] }
    finished = true
    signal()
  })

  // Dispara a query (em stream mode os dados chegam pelos eventos acima).
  request.query(query).catch((err: Error) => { failure = err; signal() })

  while (true) {
    if (failure) throw failure
    const next = queue.shift()
    if (next) {
      yield next
      if (!finished) request.resume()   // retoma após o lote ser consumido
      continue
    }
    if (finished) return
    await new Promise<void>((r) => { wake = r })
  }
}

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
  console.log(`[extract] connecting to SQL Server...`)
  const pool = await getPool()
  console.log(`[extract] connected — streaming venda for ${params.sourceLocationId}`)

  const inputs: Record<string, string> = { cdEstab: params.sourceLocationId }
  let query: string
  if (params.mode === 'sync') {
    inputs.watermark = params.watermark
    query = FATO_VENDA_SYNC_QUERY
  } else {
    inputs.from = params.from
    inputs.to = params.to
    query = FATO_VENDA_BACKFILL_QUERY
  }

  const delayMs = params.mode === 'backfill' ? params.delayMs : 0
  for await (const rows of streamQuery(pool, query, inputs, params.batchSize)) {
    yield rows
    if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs))
  }
}

// ---------------------------------------------------------------------------
// Despesas — TMPBI_DOCUMENTOS_BAIXADOS (baixas financeiras)
// Watermark: DATA_MOV. Exclui o bloco de rateio/template (CD_TIPTIT='RB' +
// DESCONTO ADIANT.CLIENTES) já na origem. Spec: docs/specs/despesas.md
// O estab 080 (centro de distribuição) é excluído naturalmente: cada agente
// consulta apenas o seu próprio CD_ESTAB.
// ---------------------------------------------------------------------------
const DESPESA_COLUMNS = `
    CD_ESTAB, DATA_MOV, ID_DOCUM, SQ_DOCUM, SQ_BAIXA_MOV, CD_TIPTIT,
    VALOR_MOV, DESCR_LOP, TIPO_MOVTO,
    CD_GRPFOPER, DESCR_GF, CD_CENTRO, DESCR_CENTRO,
    OPERACAO, TIPO_LANCAMENTO, DESCR_MODPAG,
    NOME, CGC
`

const DESPESA_RATEIO_FILTER = `
  AND NOT (CD_TIPTIT = 'RB' AND DESCR_MODPAG = 'DESCONTO ADIANT.CLIENTES')
`

const DESPESA_SYNC_QUERY = `
  SELECT ${DESPESA_COLUMNS}
  FROM TMPBI_DOCUMENTOS_BAIXADOS
  WHERE CD_ESTAB = @cdEstab AND DATA_MOV >= @watermark
  ${DESPESA_RATEIO_FILTER}
  ORDER BY DATA_MOV ASC
`

const DESPESA_BACKFILL_QUERY = `
  SELECT ${DESPESA_COLUMNS}
  FROM TMPBI_DOCUMENTOS_BAIXADOS
  WHERE CD_ESTAB = @cdEstab AND DATA_MOV >= @from AND DATA_MOV <= @to
  ${DESPESA_RATEIO_FILTER}
  ORDER BY DATA_MOV ASC
`

export async function* extractDespesa(params: {
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

  const inputs: Record<string, string> = { cdEstab: params.sourceLocationId }
  let query: string
  if (params.mode === 'sync') {
    inputs.watermark = params.watermark
    query = DESPESA_SYNC_QUERY
  } else {
    inputs.from = params.from
    inputs.to = params.to
    query = DESPESA_BACKFILL_QUERY
  }

  const delayMs = params.mode === 'backfill' ? params.delayMs : 0
  for await (const rows of streamQuery(pool, query, inputs, params.batchSize)) {
    yield rows
    if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs))
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
