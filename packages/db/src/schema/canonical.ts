import {
  pgSchema, uuid, text, boolean, date, time, numeric, integer,
  timestamp, smallint, unique, index, check
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const canonicalSchema = pgSchema('canonical')

export const dimDate = canonicalSchema.table('dim_date', {
  date:          date('date').primaryKey(),
  year:          smallint('year').notNull(),
  month:         smallint('month').notNull(),
  day:           smallint('day').notNull(),
  yearMonth:     text('year_month').notNull(),
  quarter:       smallint('quarter').notNull(),
  weekOfYear:    smallint('week_of_year').notNull(),
  dayOfWeek:     smallint('day_of_week').notNull(),
  dayOfWeekName: text('day_of_week_name').notNull(),
  monthName:     text('month_name').notNull(),
  isWeekend:     boolean('is_weekend').notNull(),
  isHoliday:     boolean('is_holiday').notNull().default(false),
})

export const dimProduct = canonicalSchema.table('dim_product', {
  id:                uuid('id').primaryKey().defaultRandom(),
  tenantId:          uuid('tenant_id').notNull(),
  source:            text('source').notNull(),
  sourceLocationId:  text('source_location_id').notNull(),
  sourceProductId:   text('source_product_id').notNull(),
  name:              text('name').notNull(),
  shortName:         text('short_name'),
  categoryCode:      text('category_code').notNull(),
  categoryName:      text('category_name'),
  groupId:           integer('group_id').notNull(),
  groupName:         text('group_name'),
  subgroupId:        integer('subgroup_id'),
  subgroupName:      text('subgroup_name'),
  productType:       text('product_type'),
  saleUnit:          text('sale_unit'),
  locationId:        uuid('location_id'),
  isFuel:            boolean('is_fuel').notNull(),
  segment:           text('segment'),
  active:            boolean('active').notNull().default(true),
  validFrom:         date('valid_from').notNull(),
  validTo:           date('valid_to'),
  isCurrent:         boolean('is_current').notNull().default(true),
  syncedAt:          timestamp('synced_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  idxDimProductCurrent: index('idx_dim_product_current')
    .on(t.tenantId, t.source, t.sourceProductId)
    .where(sql`${t.isCurrent} = true`),
  idxDimProductLookup: index('idx_dim_product_lookup').on(t.tenantId, t.source, t.sourceProductId),
  chkSegment: check('chk_segment', sql`${t.segment} IN ('combustivel','lubrificantes','servicos','conveniencia') OR ${t.segment} IS NULL`),
}))

export const factSale = canonicalSchema.table('fact_sale', {
  id:                   uuid('id').primaryKey().defaultRandom(),
  tenantId:             uuid('tenant_id').notNull(),
  locationId:           uuid('location_id').notNull(),
  sourceLocationId:     text('source_location_id').notNull(),
  saleDate:             date('sale_date').notNull(),
  saleTime:             time('sale_time'),
  shift:                text('shift'),
  invoiceNumber:        text('invoice_number'),
  sourceProductId:      text('source_product_id').notNull(),
  productName:          text('product_name').notNull(),
  categoryCode:         text('category_code').notNull(),
  categoryName:         text('category_name'),
  groupId:              integer('group_id').notNull(),
  groupName:            text('group_name'),
  subgroupId:           integer('subgroup_id'),
  subgroupName:         text('subgroup_name'),
  isFuel:               boolean('is_fuel').notNull(),
  segment:              text('segment'),
  quantity:             numeric('quantity', { precision: 15, scale: 4 }).notNull(),
  unitValue:            numeric('unit_value', { precision: 15, scale: 4 }).notNull(),
  totalValue:           numeric('total_value', { precision: 15, scale: 4 }).notNull(),
  unitCost:             numeric('unit_cost', { precision: 15, scale: 4 }),
  discountTotal:        numeric('discount_total', { precision: 15, scale: 4 }),
  surchargeTotal:       numeric('surcharge_total', { precision: 15, scale: 4 }),
  nozzleCode:           integer('nozzle_code'),
  nozzleName:           text('nozzle_name'),
  tankCode:             text('tank_code'),
  tankName:             text('tank_name'),
  sourceCustomerId:     text('source_customer_id'),
  sourceEmployeeId:     text('source_employee_id'),
  paymentMethodType:    text('payment_method_type'),
  source:               text('source').notNull(),
  sourceId:             text('source_id').notNull(),
  syncedAt:             timestamp('synced_at', { withTimezone: true }).notNull().defaultNow(),
  rawIngestId:          uuid('raw_ingest_id'),
  reprocessedAt:        timestamp('reprocessed_at', { withTimezone: true }),
  reprocessCount:       integer('reprocess_count').notNull().default(0),
}, (t) => ({
  uqFactSale: unique('uq_fact_sale').on(t.tenantId, t.locationId, t.source, t.sourceId),
  idxFactSaleTenantDate: index('idx_fact_sale_tenant_date').on(t.tenantId, t.saleDate),
  idxFactSaleLocationDate: index('idx_fact_sale_location_date').on(t.locationId, t.saleDate),
  idxFactSaleSegment: index('idx_fact_sale_segment').on(t.tenantId, t.segment, t.saleDate),
  chkFactSaleSegment: check('chk_fact_sale_segment', sql`${t.segment} IN ('combustivel','lubrificantes','servicos','conveniencia') OR ${t.segment} IS NULL`),
}))

// ---------------------------------------------------------------------------
// fact_expense — despesas (baixas financeiras) do Status ERP
// Fonte: TMPBI_DOCUMENTOS_BAIXADOS. Grão: 1 linha = 1 baixa.
// Sem segmento — despesas não são segmentadas. A classificação contábil por
// grupo financeiro (operacional/CMV/imposto/...) é feita na camada de mapping
// (Plano 2). Spec: docs/specs/despesas.md
// ---------------------------------------------------------------------------
export const factExpense = canonicalSchema.table('fact_expense', {
  id:                        uuid('id').primaryKey().defaultRandom(),
  tenantId:                  uuid('tenant_id').notNull(),
  locationId:                uuid('location_id').notNull(),
  sourceLocationId:          text('source_location_id').notNull(),
  expenseDate:               date('expense_date').notNull(),
  description:               text('description'),
  financialGroupCode:        text('financial_group_code'),
  financialGroupName:        text('financial_group_name'),
  costCenterCode:            text('cost_center_code'),
  costCenterName:            text('cost_center_name'),
  operation:                 text('operation'),
  entryType:                 text('entry_type'),
  supplierName:              text('supplier_name'),
  supplierDoc:               text('supplier_doc'),
  amount:                    numeric('amount', { precision: 15, scale: 2 }).notNull(),
  source:                    text('source').notNull(),
  sourceId:                  text('source_id').notNull(),
  rawIngestId:               uuid('raw_ingest_id'),
  syncedAt:                  timestamp('synced_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  uqFactExpense: unique('uq_fact_expense').on(t.tenantId, t.locationId, t.source, t.sourceId),
  idxFactExpenseTenantDate: index('idx_fact_expense_tenant_date').on(t.tenantId, t.expenseDate),
  idxFactExpenseLocationDate: index('idx_fact_expense_location_date').on(t.locationId, t.expenseDate),
  idxFactExpenseGroup: index('idx_fact_expense_group').on(t.tenantId, t.financialGroupCode, t.expenseDate),
}))
