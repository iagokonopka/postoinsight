-- Índices nas materialized views analytics
-- Executar manualmente após cada REFRESH ou na primeira execução

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_vendas_diario_pk
  ON analytics.mv_vendas_diario (tenant_id, location_id, data_venda);

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_combustivel_diario_pk
  ON analytics.mv_combustivel_diario (tenant_id, location_id, data_venda, source_produto_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_conveniencia_diario_pk
  ON analytics.mv_conveniencia_diario (tenant_id, location_id, data_venda, grupo_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_dre_mensal_pk
  ON analytics.mv_dre_mensal (tenant_id, location_id, ano_mes, segmento);
