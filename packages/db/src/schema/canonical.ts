import {
  pgSchema, uuid, text, boolean, date, time, numeric, integer,
  timestamp, smallint, unique, index, foreignKey, check
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
  isCombustivel:     boolean('is_combustivel').notNull(),
  segmento:          text('segmento'),
  ativo:             boolean('ativo').notNull().default(true),
  validFrom:         date('valid_from').notNull(),
  validTo:           date('valid_to'),
  isCurrent:         boolean('is_current').notNull().default(true),
  syncedAt:          timestamp('synced_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  // Unique index: só uma versão atual por produto por tenant
  index('idx_dim_produto_current')
    .on(t.tenantId, t.source, t.sourceProdutoId)
    .where(sql`${t.isCurrent} = true`),
  index('idx_dim_produto_lookup').on(t.tenantId, t.source, t.sourceProdutoId),
  check('chk_segmento', sql`${t.segmento} IN ('combustivel','lubrificantes','servicos','conveniencia') OR ${t.segmento} IS NULL`),
])

export const fatoVenda = canonicalSchema.table('fato_venda', {
  id:                  uuid('id').primaryKey().defaultRandom(),
  tenantId:            uuid('tenant_id').notNull(),
  postoId:             uuid('posto_id').notNull(),
  sourcePostoId:       text('source_posto_id').notNull(),
  dataVenda:           date('data_venda').notNull(),
  horaVenda:           time('hora_venda'),
  turno:               text('turno'),
  nrNota:              text('nr_nota'),
  sourceProdutoId:     text('source_produto_id').notNull(),
  descricaoProduto:    text('descricao_produto').notNull(),
  categoriaCodigo:     text('categoria_codigo').notNull(),
  categoriaDescricao:  text('categoria_descricao'),
  grupoId:             integer('grupo_id').notNull(),
  grupoDescricao:      text('grupo_descricao'),
  subgrupoId:          integer('subgrupo_id'),
  subgrupoDescricao:   text('subgrupo_descricao'),
  isCombustivel:       boolean('is_combustivel').notNull(),
  segmento:            text('segmento'),
  qtdVenda:            numeric('qtd_venda', { precision: 15, scale: 4 }).notNull(),
  vlrUnitario:         numeric('vlr_unitario', { precision: 15, scale: 4 }).notNull(),
  vlrTotal:            numeric('vlr_total', { precision: 15, scale: 4 }).notNull(),
  custoUnitario:       numeric('custo_unitario', { precision: 15, scale: 4 }),
  descontoTotal:       numeric('desconto_total', { precision: 15, scale: 4 }),
  acrescimoTotal:      numeric('acrescimo_total', { precision: 15, scale: 4 }),
  bicoCodigo:          integer('bico_codigo'),
  bicoDescricao:       text('bico_descricao'),
  tanqueCodigo:        text('tanque_codigo'),
  tanqueDescricao:     text('tanque_descricao'),
  sourceClienteId:     text('source_cliente_id'),
  sourceFuncionarioId: text('source_funcionario_id'),
  formaPagamentoTipo:  text('forma_pagamento_tipo'),
  source:              text('source').notNull(),
  sourceId:            text('source_id').notNull(),
  syncedAt:            timestamp('synced_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  unique('uq_fato_venda').on(t.tenantId, t.postoId, t.source, t.sourceId),
  index('idx_fato_venda_tenant_data').on(t.tenantId, t.dataVenda),
  index('idx_fato_venda_posto_data').on(t.postoId, t.dataVenda),
  index('idx_fato_venda_segmento').on(t.tenantId, t.segmento, t.dataVenda),
  check('chk_fato_segmento', sql`${t.segmento} IN ('combustivel','lubrificantes','servicos','conveniencia') OR ${t.segmento} IS NULL`),
])
