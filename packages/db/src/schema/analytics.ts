import {
  pgSchema, uuid, text, date, numeric, integer, smallint, boolean, bigint,
} from 'drizzle-orm/pg-core'

export const analyticsSchema = pgSchema('analytics')

/**
 * Materialized views criadas via migration SQL custom
 * (drizzle-kit não emite DDL de MV — declaramos aqui só os tipos).
 *
 * Convenção de naming: campos em snake_case no banco → camelCase em TS.
 * Todas as MVs filtram categorias internas (segment IS NOT NULL).
 */

// ---------------------------------------------------------------------------
// mv_sales_daily — Dashboard Vendas
// Grão: 1 linha = 1 dia × 1 location × 1 segmento × 1 grupo
// ---------------------------------------------------------------------------
export const mvSalesDaily = analyticsSchema.materializedView('mv_sales_daily', {
  tenantId:           uuid('tenant_id').notNull(),
  locationId:         uuid('location_id').notNull(),
  saleDate:           date('sale_date').notNull(),
  year:               smallint('year').notNull(),
  month:              smallint('month').notNull(),
  yearMonth:          text('year_month').notNull(),
  weekOfYear:         smallint('week_of_year').notNull(),
  dayOfWeek:          smallint('day_of_week').notNull(),
  isWeekend:          boolean('is_weekend').notNull(),
  segment:            text('segment').notNull(),
  categoryCode:       text('category_code').notNull(),
  categoryName:       text('category_name'),
  groupId:            integer('group_id').notNull(),
  groupName:          text('group_name'),
  itemCount:          bigint('item_count', { mode: 'number' }).notNull(),
  totalQuantity:      numeric('total_quantity', { precision: 18, scale: 4 }).notNull(),
  grossRevenue:       numeric('gross_revenue', { precision: 18, scale: 4 }).notNull(),
  discounts:          numeric('discounts', { precision: 18, scale: 4 }).notNull(),
  netRevenue:         numeric('net_revenue', { precision: 18, scale: 4 }).notNull(),
  cogs:               numeric('cogs', { precision: 18, scale: 4 }).notNull(),
  grossMargin:        numeric('gross_margin', { precision: 18, scale: 4 }).notNull(),
}).existing()

// ---------------------------------------------------------------------------
// mv_fuel_daily — Dashboard Combustível
// Grão: 1 linha = 1 dia × 1 location × 1 produto combustível
// Filtro: segment = 'combustivel'
// ---------------------------------------------------------------------------
export const mvFuelDaily = analyticsSchema.materializedView('mv_fuel_daily', {
  tenantId:           uuid('tenant_id').notNull(),
  locationId:         uuid('location_id').notNull(),
  saleDate:           date('sale_date').notNull(),
  year:               smallint('year').notNull(),
  month:              smallint('month').notNull(),
  yearMonth:          text('year_month').notNull(),
  weekOfYear:         smallint('week_of_year').notNull(),
  dayOfWeek:          smallint('day_of_week').notNull(),
  isWeekend:          boolean('is_weekend').notNull(),
  categoryCode:       text('category_code').notNull(),
  groupId:            integer('group_id').notNull(),
  groupName:          text('group_name'),
  refuelCount:        bigint('refuel_count', { mode: 'number' }).notNull(),
  volumeLiters:       numeric('volume_liters', { precision: 18, scale: 4 }).notNull(),
  grossRevenue:       numeric('gross_revenue', { precision: 18, scale: 4 }).notNull(),
  discounts:          numeric('discounts', { precision: 18, scale: 4 }).notNull(),
  netRevenue:         numeric('net_revenue', { precision: 18, scale: 4 }).notNull(),
  cogs:               numeric('cogs', { precision: 18, scale: 4 }).notNull(),
  grossMargin:        numeric('gross_margin', { precision: 18, scale: 4 }).notNull(),
  avgPriceLiter:      numeric('avg_price_liter', { precision: 18, scale: 4 }),
  avgCostLiter:       numeric('avg_cost_liter', { precision: 18, scale: 4 }),
}).existing()

// ---------------------------------------------------------------------------
// mv_convenience_daily — Dashboard Conveniência (loja)
// Grão: 1 linha = 1 dia × 1 location × 1 segmento × 1 grupo
// Filtro: segment IN ('conveniencia','lubrificantes','servicos')
// ---------------------------------------------------------------------------
export const mvConvenienceDaily = analyticsSchema.materializedView('mv_convenience_daily', {
  tenantId:           uuid('tenant_id').notNull(),
  locationId:         uuid('location_id').notNull(),
  saleDate:           date('sale_date').notNull(),
  year:               smallint('year').notNull(),
  month:              smallint('month').notNull(),
  yearMonth:          text('year_month').notNull(),
  weekOfYear:         smallint('week_of_year').notNull(),
  dayOfWeek:          smallint('day_of_week').notNull(),
  isWeekend:          boolean('is_weekend').notNull(),
  segment:            text('segment').notNull(),
  categoryCode:       text('category_code').notNull(),
  categoryName:       text('category_name'),
  groupId:            integer('group_id').notNull(),
  groupName:          text('group_name'),
  itemCount:          bigint('item_count', { mode: 'number' }).notNull(),
  totalQuantity:      numeric('total_quantity', { precision: 18, scale: 4 }).notNull(),
  grossRevenue:       numeric('gross_revenue', { precision: 18, scale: 4 }).notNull(),
  discounts:          numeric('discounts', { precision: 18, scale: 4 }).notNull(),
  netRevenue:         numeric('net_revenue', { precision: 18, scale: 4 }).notNull(),
  cogs:               numeric('cogs', { precision: 18, scale: 4 }).notNull(),
  grossMargin:        numeric('gross_margin', { precision: 18, scale: 4 }).notNull(),
}).existing()

// ---------------------------------------------------------------------------
// mv_income_statement_monthly — DRE Mensal
// Grão: 1 linha = 1 mês × 1 location × 1 segmento
// ---------------------------------------------------------------------------
export const mvIncomeStatementMonthly = analyticsSchema.materializedView('mv_income_statement_monthly', {
  tenantId:        uuid('tenant_id').notNull(),
  locationId:      uuid('location_id').notNull(),
  year:            smallint('year').notNull(),
  month:           smallint('month').notNull(),
  yearMonth:       text('year_month').notNull(),
  segment:         text('segment').notNull(),
  itemCount:       bigint('item_count', { mode: 'number' }).notNull(),
  totalQuantity:   numeric('total_quantity', { precision: 18, scale: 4 }).notNull(),
  grossRevenue:    numeric('gross_revenue', { precision: 18, scale: 4 }).notNull(),
  discounts:       numeric('discounts', { precision: 18, scale: 4 }).notNull(),
  netRevenue:      numeric('net_revenue', { precision: 18, scale: 4 }).notNull(),
  cogs:            numeric('cogs', { precision: 18, scale: 4 }).notNull(),
  grossMargin:     numeric('gross_margin', { precision: 18, scale: 4 }).notNull(),
}).existing()

// ---------------------------------------------------------------------------
// mv_expense_monthly — total de despesas por mês (anexo do DRE)
// Grão: 1 linha = 1 mês × 1 location (sem segmento)
// ---------------------------------------------------------------------------
export const mvExpenseMonthly = analyticsSchema.materializedView('mv_expense_monthly', {
  tenantId:        uuid('tenant_id').notNull(),
  locationId:      uuid('location_id').notNull(),
  year:            smallint('year').notNull(),
  month:           smallint('month').notNull(),
  yearMonth:       text('year_month').notNull(),
  entryCount:      bigint('entry_count', { mode: 'number' }).notNull(),
  totalExpenses:   numeric('total_expenses', { precision: 18, scale: 2 }).notNull(),
}).existing()

// ---------------------------------------------------------------------------
// mv_expense_group_monthly — despesas por grupo financeiro (breakdown do DRE)
// Grão: 1 linha = 1 mês × 1 location × 1 grupo financeiro
// ---------------------------------------------------------------------------
export const mvExpenseGroupMonthly = analyticsSchema.materializedView('mv_expense_group_monthly', {
  tenantId:                  uuid('tenant_id').notNull(),
  locationId:                uuid('location_id').notNull(),
  year:                      smallint('year').notNull(),
  month:                     smallint('month').notNull(),
  yearMonth:                 text('year_month').notNull(),
  financialGroupCode:        text('financial_group_code').notNull(),
  financialGroupName:        text('financial_group_name'),
  entryCount:                bigint('entry_count', { mode: 'number' }).notNull(),
  totalExpenses:             numeric('total_expenses', { precision: 18, scale: 2 }).notNull(),
}).existing()
