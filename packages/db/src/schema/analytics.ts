import {
  pgSchema, uuid, text, date, numeric, integer, smallint, boolean, bigint,
} from 'drizzle-orm/pg-core'

export const analyticsSchema = pgSchema('analytics')

/**
 * Materialized views criadas via migration SQL custom
 * (drizzle-kit não emite DDL de MV — declaramos aqui só os tipos).
 *
 * Convenção de naming: campos em snake_case no banco → camelCase em TS.
 * Todas as MVs filtram categorias internas (segmento IS NOT NULL).
 */

// ---------------------------------------------------------------------------
// mv_vendas_diario — Dashboard Vendas
// Grão: 1 linha = 1 dia × 1 location × 1 segmento × 1 grupo
// ---------------------------------------------------------------------------
export const mvVendasDiario = analyticsSchema.materializedView('mv_vendas_diario', {
  tenantId:           uuid('tenant_id').notNull(),
  locationId:         uuid('location_id').notNull(),
  dataVenda:          date('data_venda').notNull(),
  ano:                smallint('ano').notNull(),
  mes:                smallint('mes').notNull(),
  anoMes:             text('ano_mes').notNull(),
  semanaAno:          smallint('semana_ano').notNull(),
  diaSemana:          smallint('dia_semana').notNull(),
  isFimDeSemana:      boolean('is_fim_de_semana').notNull(),
  segmento:           text('segmento').notNull(),
  categoriaCodigo:    text('categoria_codigo').notNull(),
  categoriaDescricao: text('categoria_descricao'),
  grupoId:            integer('grupo_id').notNull(),
  grupoDescricao:     text('grupo_descricao'),
  qtdItens:           bigint('qtd_itens', { mode: 'number' }).notNull(),
  qtdTotal:           numeric('qtd_total', { precision: 18, scale: 4 }).notNull(),
  receitaBruta:       numeric('receita_bruta', { precision: 18, scale: 4 }).notNull(),
  descontos:          numeric('descontos', { precision: 18, scale: 4 }).notNull(),
  receitaLiquida:     numeric('receita_liquida', { precision: 18, scale: 4 }).notNull(),
  cmv:                numeric('cmv', { precision: 18, scale: 4 }).notNull(),
  margemBruta:        numeric('margem_bruta', { precision: 18, scale: 4 }).notNull(),
}).existing()

// ---------------------------------------------------------------------------
// mv_combustivel_diario — Dashboard Combustível
// Grão: 1 linha = 1 dia × 1 location × 1 produto combustível
// Filtro: segmento = 'combustivel'
// ---------------------------------------------------------------------------
export const mvCombustivelDiario = analyticsSchema.materializedView('mv_combustivel_diario', {
  tenantId:           uuid('tenant_id').notNull(),
  locationId:         uuid('location_id').notNull(),
  dataVenda:          date('data_venda').notNull(),
  ano:                smallint('ano').notNull(),
  mes:                smallint('mes').notNull(),
  anoMes:             text('ano_mes').notNull(),
  semanaAno:          smallint('semana_ano').notNull(),
  diaSemana:          smallint('dia_semana').notNull(),
  isFimDeSemana:      boolean('is_fim_de_semana').notNull(),
  categoriaCodigo:    text('categoria_codigo').notNull(),
  grupoId:            integer('grupo_id').notNull(),
  grupoDescricao:     text('grupo_descricao'),
  qtdAbastecimentos:  bigint('qtd_abastecimentos', { mode: 'number' }).notNull(),
  volumeLitros:       numeric('volume_litros', { precision: 18, scale: 4 }).notNull(),
  receitaBruta:       numeric('receita_bruta', { precision: 18, scale: 4 }).notNull(),
  descontos:          numeric('descontos', { precision: 18, scale: 4 }).notNull(),
  receitaLiquida:     numeric('receita_liquida', { precision: 18, scale: 4 }).notNull(),
  cmv:                numeric('cmv', { precision: 18, scale: 4 }).notNull(),
  margemBruta:        numeric('margem_bruta', { precision: 18, scale: 4 }).notNull(),
  precoMedioLitro:    numeric('preco_medio_litro', { precision: 18, scale: 4 }),
  custoMedioLitro:    numeric('custo_medio_litro', { precision: 18, scale: 4 }),
}).existing()

// ---------------------------------------------------------------------------
// mv_conveniencia_diario — Dashboard Conveniência (loja)
// Grão: 1 linha = 1 dia × 1 location × 1 segmento × 1 grupo
// Filtro: segmento IN ('conveniencia','lubrificantes','servicos')
// ---------------------------------------------------------------------------
export const mvConvenienciaDiario = analyticsSchema.materializedView('mv_conveniencia_diario', {
  tenantId:           uuid('tenant_id').notNull(),
  locationId:         uuid('location_id').notNull(),
  dataVenda:          date('data_venda').notNull(),
  ano:                smallint('ano').notNull(),
  mes:                smallint('mes').notNull(),
  anoMes:             text('ano_mes').notNull(),
  semanaAno:          smallint('semana_ano').notNull(),
  diaSemana:          smallint('dia_semana').notNull(),
  isFimDeSemana:      boolean('is_fim_de_semana').notNull(),
  segmento:           text('segmento').notNull(),
  categoriaCodigo:    text('categoria_codigo').notNull(),
  categoriaDescricao: text('categoria_descricao'),
  grupoId:            integer('grupo_id').notNull(),
  grupoDescricao:     text('grupo_descricao'),
  qtdItens:           bigint('qtd_itens', { mode: 'number' }).notNull(),
  qtdTotal:           numeric('qtd_total', { precision: 18, scale: 4 }).notNull(),
  receitaBruta:       numeric('receita_bruta', { precision: 18, scale: 4 }).notNull(),
  descontos:          numeric('descontos', { precision: 18, scale: 4 }).notNull(),
  receitaLiquida:     numeric('receita_liquida', { precision: 18, scale: 4 }).notNull(),
  cmv:                numeric('cmv', { precision: 18, scale: 4 }).notNull(),
  margemBruta:        numeric('margem_bruta', { precision: 18, scale: 4 }).notNull(),
}).existing()

// ---------------------------------------------------------------------------
// mv_dre_mensal — DRE Mensal
// Grão: 1 linha = 1 mês × 1 location × 1 segmento
// ---------------------------------------------------------------------------
export const mvDreMensal = analyticsSchema.materializedView('mv_dre_mensal', {
  tenantId:        uuid('tenant_id').notNull(),
  locationId:      uuid('location_id').notNull(),
  ano:             smallint('ano').notNull(),
  mes:             smallint('mes').notNull(),
  anoMes:          text('ano_mes').notNull(),
  segmento:        text('segmento').notNull(),
  qtdItens:        bigint('qtd_itens', { mode: 'number' }).notNull(),
  qtdTotal:        numeric('qtd_total', { precision: 18, scale: 4 }).notNull(),
  receitaBruta:    numeric('receita_bruta', { precision: 18, scale: 4 }).notNull(),
  descontos:       numeric('descontos', { precision: 18, scale: 4 }).notNull(),
  receitaLiquida:  numeric('receita_liquida', { precision: 18, scale: 4 }).notNull(),
  cmv:             numeric('cmv', { precision: 18, scale: 4 }).notNull(),
  margemBruta:     numeric('margem_bruta', { precision: 18, scale: 4 }).notNull(),
}).existing()
