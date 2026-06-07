import {
  pgSchema, uuid, text, boolean, date, time, numeric, integer,
  timestamp, smallint, unique, index, check
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const canonicalSchema = pgSchema('canonical')

export const dimTempo = canonicalSchema.table('dim_tempo', {
  data:          date('data').primaryKey(),
  ano:           smallint('ano').notNull(),
  mes:           smallint('mes').notNull(),
  dia:           smallint('dia').notNull(),
  anoMes:        text('ano_mes').notNull(),
  trimestre:     smallint('trimestre').notNull(),
  semanaAno:     smallint('semana_ano').notNull(),
  diaSemana:     smallint('dia_semana').notNull(),
  nomeDiaSemana: text('nome_dia_semana').notNull(),
  nomeMes:       text('nome_mes').notNull(),
  isFimDeSemana: boolean('is_fim_de_semana').notNull(),
  isFeriado:     boolean('is_feriado').notNull().default(false),
})

export const dimProduto = canonicalSchema.table('dim_produto', {
  id:                uuid('id').primaryKey().defaultRandom(),
  tenantId:          uuid('tenant_id').notNull(),
  source:            text('source').notNull(),
  sourceLocationId:  text('source_location_id').notNull(),
  sourceProdutoId:   text('source_produto_id').notNull(),
  nome:              text('nome').notNull(),
  nomeResumido:      text('nome_resumido'),
  categoriaCodigo:   text('categoria_codigo').notNull(),
  categoriaDescricao: text('categoria_descricao'),
  grupoId:           integer('grupo_id').notNull(),
  grupoDescricao:    text('grupo_descricao'),
  subgrupoId:        integer('subgrupo_id'),
  subgrupoDescricao: text('subgrupo_descricao'),
  tipoProduto:       text('tipo_produto'),
  unidadeVenda:      text('unidade_venda'),
  locationId:        uuid('location_id'),
  isCombustivel:     boolean('is_combustivel').notNull(),
  segmento:          text('segmento'),
  ativo:             boolean('ativo').notNull().default(true),
  validFrom:         date('valid_from').notNull(),
  validTo:           date('valid_to'),
  isCurrent:         boolean('is_current').notNull().default(true),
  syncedAt:          timestamp('synced_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  idxDimProdutoCurrent: index('idx_dim_produto_current')
    .on(t.tenantId, t.source, t.sourceProdutoId)
    .where(sql`${t.isCurrent} = true`),
  idxDimProdutoLookup: index('idx_dim_produto_lookup').on(t.tenantId, t.source, t.sourceProdutoId),
  chkSegmento: check('chk_segmento', sql`${t.segmento} IN ('combustivel','lubrificantes','servicos','conveniencia') OR ${t.segmento} IS NULL`),
}))

export const fatoVenda = canonicalSchema.table('fato_venda', {
  id:                   uuid('id').primaryKey().defaultRandom(),
  tenantId:             uuid('tenant_id').notNull(),
  locationId:           uuid('location_id').notNull(),
  sourceLocationId:     text('source_location_id').notNull(),
  dataVenda:            date('data_venda').notNull(),
  horaVenda:            time('hora_venda'),
  turno:                text('turno'),
  nrNota:               text('nr_nota'),
  sourceProdutoId:      text('source_produto_id').notNull(),
  descricaoProduto:     text('descricao_produto').notNull(),
  categoriaCodigo:      text('categoria_codigo').notNull(),
  categoriaDescricao:   text('categoria_descricao'),
  grupoId:              integer('grupo_id').notNull(),
  grupoDescricao:       text('grupo_descricao'),
  subgrupoId:           integer('subgrupo_id'),
  subgrupoDescricao:    text('subgrupo_descricao'),
  isCombustivel:        boolean('is_combustivel').notNull(),
  segmento:             text('segmento'),
  qtdVenda:             numeric('qtd_venda', { precision: 15, scale: 4 }).notNull(),
  vlrUnitario:          numeric('vlr_unitario', { precision: 15, scale: 4 }).notNull(),
  vlrTotal:             numeric('vlr_total', { precision: 15, scale: 4 }).notNull(),
  custoUnitario:        numeric('custo_unitario', { precision: 15, scale: 4 }),
  descontoTotal:        numeric('desconto_total', { precision: 15, scale: 4 }),
  acrescimoTotal:       numeric('acrescimo_total', { precision: 15, scale: 4 }),
  bicoCodigo:           integer('bico_codigo'),
  bicoDescricao:        text('bico_descricao'),
  tanqueCodigo:         text('tanque_codigo'),
  tanqueDescricao:      text('tanque_descricao'),
  sourceClienteId:      text('source_cliente_id'),
  sourceFuncionarioId:  text('source_funcionario_id'),
  formaPagamentoTipo:   text('forma_pagamento_tipo'),
  source:               text('source').notNull(),
  sourceId:             text('source_id').notNull(),
  syncedAt:             timestamp('synced_at', { withTimezone: true }).notNull().defaultNow(),
  rawIngestId:          uuid('raw_ingest_id'),
  reprocessedAt:        timestamp('reprocessed_at', { withTimezone: true }),
  reprocessCount:       integer('reprocess_count').notNull().default(0),
}, (t) => ({
  uqFatoVenda: unique('uq_fato_venda').on(t.tenantId, t.locationId, t.source, t.sourceId),
  idxFatoVendaTenantData: index('idx_fato_venda_tenant_data').on(t.tenantId, t.dataVenda),
  idxFatoVendaLocationData: index('idx_fato_venda_location_data').on(t.locationId, t.dataVenda),
  idxFatoVendaSegmento: index('idx_fato_venda_segmento').on(t.tenantId, t.segmento, t.dataVenda),
  chkFatoSegmento: check('chk_fato_segmento', sql`${t.segmento} IN ('combustivel','lubrificantes','servicos','conveniencia') OR ${t.segmento} IS NULL`),
}))

// ---------------------------------------------------------------------------
// fato_despesa — despesas (baixas financeiras) do Status ERP
// Fonte: TMPBI_DOCUMENTOS_BAIXADOS. Grão: 1 linha = 1 baixa.
// Sem segmento — despesas não são segmentadas. A classificação contábil por
// grupo financeiro (operacional/CMV/imposto/...) é feita na camada de mapping
// (Plano 2). Spec: docs/specs/despesas.md
// ---------------------------------------------------------------------------
export const fatoDespesa = canonicalSchema.table('fato_despesa', {
  id:                        uuid('id').primaryKey().defaultRandom(),
  tenantId:                  uuid('tenant_id').notNull(),
  locationId:                uuid('location_id').notNull(),
  sourceLocationId:          text('source_location_id').notNull(),
  dataDespesa:               date('data_despesa').notNull(),
  descricao:                 text('descricao'),
  grupoFinanceiroCodigo:     text('grupo_financeiro_codigo'),
  grupoFinanceiroDescricao:  text('grupo_financeiro_descricao'),
  centroCustoCodigo:         text('centro_custo_codigo'),
  centroCustoDescricao:      text('centro_custo_descricao'),
  operacao:                  text('operacao'),
  tipoLancamento:            text('tipo_lancamento'),
  fornecedorNome:            text('fornecedor_nome'),
  fornecedorDoc:             text('fornecedor_doc'),
  valor:                     numeric('valor', { precision: 15, scale: 2 }).notNull(),
  source:                    text('source').notNull(),
  sourceId:                  text('source_id').notNull(),
  rawIngestId:               uuid('raw_ingest_id'),
  syncedAt:                  timestamp('synced_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  uqFatoDespesa: unique('uq_fato_despesa').on(t.tenantId, t.locationId, t.source, t.sourceId),
  idxFatoDespesaTenantData: index('idx_fato_despesa_tenant_data').on(t.tenantId, t.dataDespesa),
  idxFatoDespesaLocationData: index('idx_fato_despesa_location_data').on(t.locationId, t.dataDespesa),
  idxFatoDespesaGrupo: index('idx_fato_despesa_grupo').on(t.tenantId, t.grupoFinanceiroCodigo, t.dataDespesa),
}))
