-- =============================================================================
-- PostoInsight — DDL completo
-- PostgreSQL 16+
-- =============================================================================
-- Schemas: app | raw | canonical | analytics
-- Última atualização: 2026-04-05
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Extensões
-- -----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- Schemas
-- -----------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS app;
CREATE SCHEMA IF NOT EXISTS raw;
CREATE SCHEMA IF NOT EXISTS canonical;
CREATE SCHEMA IF NOT EXISTS analytics;

-- =============================================================================
-- SCHEMA: app
-- Operacional: tenants, usuários, postos, conectores, sync
-- =============================================================================

-- -----------------------------------------------------------------------------
-- app.tenants
-- Cada rede de postos é um tenant isolado
-- -----------------------------------------------------------------------------
CREATE TABLE app.tenants (
    id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            text NOT NULL,                          -- nome da rede ex: "Rede Petroil"
    slug            text NOT NULL UNIQUE,                   -- identificador URL-friendly ex: "petroil"
    plan            text NOT NULL DEFAULT 'mvp',            -- plano atual — para analytics de plataforma futura
    active          boolean NOT NULL DEFAULT true,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- app.postos
-- Postos físicos dentro de cada tenant
-- -----------------------------------------------------------------------------
CREATE TABLE app.postos (
    id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       uuid NOT NULL REFERENCES app.tenants(id),
    name            text NOT NULL,                          -- nome do posto ex: "Posto Centro"
    erp_source      text NOT NULL CHECK (erp_source IN ('status', 'webposto')),
    source_posto_id text NOT NULL,                          -- ID do posto no ERP (CD_ESTAB no Status, empresaCodigo no WebPosto)
    active          boolean NOT NULL DEFAULT true,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),

    UNIQUE (tenant_id, erp_source, source_posto_id)
);

CREATE INDEX idx_postos_tenant_id ON app.postos(tenant_id);

-- -----------------------------------------------------------------------------
-- app.users
-- Auth.js v5 exige esta estrutura exata
-- -----------------------------------------------------------------------------
CREATE TABLE app.users (
    id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            text,
    email           text NOT NULL UNIQUE,
    email_verified  timestamptz,
    image           text,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- app.accounts
-- Auth.js v5 — provedores OAuth (se usado no futuro)
-- -----------------------------------------------------------------------------
CREATE TABLE app.accounts (
    id                   uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id              uuid NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
    type                 text NOT NULL,
    provider             text NOT NULL,
    provider_account_id  text NOT NULL,
    refresh_token        text,
    access_token         text,
    expires_at           integer,
    token_type           text,
    scope                text,
    id_token             text,
    session_state        text,

    UNIQUE (provider, provider_account_id)
);

CREATE INDEX idx_accounts_user_id ON app.accounts(user_id);

-- -----------------------------------------------------------------------------
-- app.sessions
-- Auth.js v5 — sessões de usuário
-- -----------------------------------------------------------------------------
CREATE TABLE app.sessions (
    id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_token   text NOT NULL UNIQUE,
    user_id         uuid NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
    expires         timestamptz NOT NULL
);

CREATE INDEX idx_sessions_user_id ON app.sessions(user_id);

-- -----------------------------------------------------------------------------
-- app.verification_tokens
-- Auth.js v5 — tokens de verificação de email / magic link
-- -----------------------------------------------------------------------------
CREATE TABLE app.verification_tokens (
    identifier      text NOT NULL,
    token           text NOT NULL UNIQUE,
    expires         timestamptz NOT NULL,

    PRIMARY KEY (identifier, token)
);

-- -----------------------------------------------------------------------------
-- app.tenant_users
-- Relacionamento usuário ↔ tenant com role
-- Um usuário pode ter roles diferentes em tenants diferentes
-- -----------------------------------------------------------------------------
CREATE TABLE app.tenant_users (
    id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       uuid NOT NULL REFERENCES app.tenants(id) ON DELETE CASCADE,
    user_id         uuid NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
    role            text NOT NULL CHECK (role IN ('owner', 'manager', 'consultant')),
    posto_id        uuid REFERENCES app.postos(id),         -- NULL = acesso a todos os postos do tenant
    created_at      timestamptz NOT NULL DEFAULT now(),

    UNIQUE (tenant_id, user_id)
);

CREATE INDEX idx_tenant_users_tenant_id ON app.tenant_users(tenant_id);
CREATE INDEX idx_tenant_users_user_id ON app.tenant_users(user_id);

-- -----------------------------------------------------------------------------
-- app.connectors
-- Configuração de conexão do ERP por tenant+posto
-- credentials: JSONB — nunca expor na API pública
-- -----------------------------------------------------------------------------
CREATE TABLE app.connectors (
    id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       uuid NOT NULL REFERENCES app.tenants(id) ON DELETE CASCADE,
    posto_id        uuid NOT NULL REFERENCES app.postos(id) ON DELETE CASCADE,
    erp_source      text NOT NULL CHECK (erp_source IN ('status', 'webposto')),
    credentials     jsonb NOT NULL DEFAULT '{}',            -- SENSÍVEL: tokens, URLs, CNPJs do ERP
    active          boolean NOT NULL DEFAULT true,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),

    UNIQUE (posto_id)                                       -- 1 conector por posto
);

CREATE INDEX idx_connectors_tenant_id ON app.connectors(tenant_id);

-- -----------------------------------------------------------------------------
-- app.sync_state
-- Watermark atual por tenant + posto + entidade
-- Pipeline lê daqui para saber de onde continuar
-- -----------------------------------------------------------------------------
CREATE TABLE app.sync_state (
    id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       uuid NOT NULL REFERENCES app.tenants(id) ON DELETE CASCADE,
    posto_id        uuid NOT NULL REFERENCES app.postos(id) ON DELETE CASCADE,
    erp_source      text NOT NULL CHECK (erp_source IN ('status', 'webposto')),
    entity          text NOT NULL,                          -- ex: 'fato_venda', 'dim_produto'
    last_synced_at  timestamptz,                            -- watermark: última data sincronizada com sucesso
    backfill_completed_at timestamptz,                      -- NULL = backfill ainda em andamento. Worker só agenda sync incremental após preenchido.
    updated_at      timestamptz NOT NULL DEFAULT now(),

    UNIQUE (posto_id, entity)
);

CREATE INDEX idx_sync_state_posto_id ON app.sync_state(posto_id);

-- -----------------------------------------------------------------------------
-- app.sync_jobs
-- Log de execuções de sync — histórico, duração, erros
-- Fonte de verdade para o indicador visual de status no frontend
-- -----------------------------------------------------------------------------
CREATE TABLE app.sync_jobs (
    id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       uuid NOT NULL REFERENCES app.tenants(id),
    posto_id        uuid NOT NULL REFERENCES app.postos(id),
    erp_source      text NOT NULL CHECK (erp_source IN ('status', 'webposto')),
    entity          text NOT NULL,                          -- ex: 'fato_venda', 'dim_produto'
    triggered_by    text NOT NULL CHECK (triggered_by IN ('schedule', 'manual')),
    status          text NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'running', 'success', 'error')),
    started_at      timestamptz,
    finished_at     timestamptz,
    rows_ingested   integer,                                -- quantos registros foram inseridos/atualizados
    error_message   text,                                   -- NULL se success
    created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_sync_jobs_tenant_id ON app.sync_jobs(tenant_id);
CREATE INDEX idx_sync_jobs_posto_id ON app.sync_jobs(posto_id);
CREATE INDEX idx_sync_jobs_status ON app.sync_jobs(status);
CREATE INDEX idx_sync_jobs_created_at ON app.sync_jobs(created_at DESC);

-- =============================================================================
-- SCHEMA: raw
-- Bronze: payload intocado dos ERPs
-- Nunca modificado após inserção. Nunca lido pelo frontend ou API pública.
-- =============================================================================

CREATE TABLE raw.raw_ingest (
    id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       uuid NOT NULL,                          -- sem FK — raw é independente
    posto_id        uuid NOT NULL,
    erp_source      text NOT NULL CHECK (erp_source IN ('status', 'webposto')),
    entity          text NOT NULL,                          -- ex: 'fato_venda', 'dim_produto'
    payload         jsonb NOT NULL,                         -- payload original intocado
    received_at     timestamptz NOT NULL DEFAULT now(),
    processed_at    timestamptz,                            -- NULL = ainda não processado pelo pipeline
    processing_error text                                   -- NULL = sem erro
);

CREATE INDEX idx_raw_ingest_tenant_posto ON raw.raw_ingest(tenant_id, posto_id);
CREATE INDEX idx_raw_ingest_entity ON raw.raw_ingest(entity);
CREATE INDEX idx_raw_ingest_processed_at ON raw.raw_ingest(processed_at)
    WHERE processed_at IS NULL;                             -- índice parcial — agiliza fila de processamento

-- =============================================================================
-- SCHEMA: canonical
-- Silver: modelo canônico validado — fonte de verdade analítica
-- =============================================================================

-- -----------------------------------------------------------------------------
-- canonical.dim_tempo
-- Gerada pelo pipeline uma vez (ex: 2015–2035). Sem fonte ERP.
-- -----------------------------------------------------------------------------
CREATE TABLE canonical.dim_tempo (
    data                date PRIMARY KEY,
    ano                 integer NOT NULL,
    trimestre           integer NOT NULL CHECK (trimestre BETWEEN 1 AND 4),
    mes                 integer NOT NULL CHECK (mes BETWEEN 1 AND 12),
    mes_nome            text NOT NULL,
    semana_ano          integer NOT NULL,
    dia_mes             integer NOT NULL CHECK (dia_mes BETWEEN 1 AND 31),
    dia_semana          integer NOT NULL CHECK (dia_semana BETWEEN 1 AND 7),  -- 1=Segunda ISO
    dia_semana_nome     text NOT NULL,
    is_fim_de_semana    boolean NOT NULL,
    is_feriado_nacional boolean NOT NULL DEFAULT false,
    ano_mes             text NOT NULL                       -- ex: '2026-03' — para agrupamentos mensais
);

-- -----------------------------------------------------------------------------
-- canonical.dim_produto
-- SCD2: mudanças criam nova versão. Chave natural: (tenant_id, source, source_produto_id)
-- -----------------------------------------------------------------------------
CREATE TABLE canonical.dim_produto (
    id                  uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id           uuid NOT NULL,
    source              text NOT NULL CHECK (source IN ('status', 'webposto')),
    source_produto_id   text NOT NULL,
    nome                text NOT NULL,
    nome_resumido       text,
    categoria_codigo    text NOT NULL,
    categoria_descricao text,
    grupo_id            integer NOT NULL,
    grupo_descricao     text,
    subgrupo_id         integer,
    subgrupo_descricao  text,
    tipo_produto        text,
    unidade_venda       text,
    is_combustivel      boolean NOT NULL,
    segmento            text CHECK (segmento IN ('combustivel', 'lubrificantes', 'servicos', 'conveniencia')),
                                                        -- derivado via categoria_codigo. NULL = categoria interna
    ativo               boolean NOT NULL DEFAULT true,
    valid_from          date NOT NULL,
    valid_to            date,                               -- NULL = versão atual
    is_current          boolean NOT NULL DEFAULT true,
    synced_at           timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT chk_dim_produto_valid_range CHECK (valid_to IS NULL OR valid_to > valid_from)
);

-- Chave natural SCD2 — apenas uma versão atual por produto
CREATE UNIQUE INDEX idx_dim_produto_current
    ON canonical.dim_produto(tenant_id, source, source_produto_id)
    WHERE is_current = true;

CREATE INDEX idx_dim_produto_tenant ON canonical.dim_produto(tenant_id);
CREATE INDEX idx_dim_produto_lookup ON canonical.dim_produto(tenant_id, source, source_produto_id);

-- -----------------------------------------------------------------------------
-- canonical.fato_venda
-- Grão: 1 linha = 1 produto em 1 venda (item de nota ou abastecimento)
-- -----------------------------------------------------------------------------
CREATE TABLE canonical.fato_venda (
    id                      uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id               uuid NOT NULL,
    posto_id                uuid NOT NULL,                  -- FK lógica para app.postos (sem FK física para performance)
    source_posto_id         text NOT NULL,
    data_venda              date NOT NULL,
    hora_venda              time,
    turno                   text,
    nr_nota                 text,
    source_produto_id       text NOT NULL,
    descricao_produto       text NOT NULL,
    categoria_codigo        text NOT NULL,
    categoria_descricao     text,
    grupo_id                integer NOT NULL,
    grupo_descricao         text,
    subgrupo_id             integer,
    subgrupo_descricao      text,
    is_combustivel          boolean NOT NULL,
    qtd_venda               numeric(15,4) NOT NULL,
    vlr_unitario            numeric(15,4) NOT NULL,
    vlr_total               numeric(15,4) NOT NULL,
    custo_unitario          numeric(15,4),
    desconto_total          numeric(15,4),
    acrescimo_total         numeric(15,4),
    bico_codigo             integer,
    bico_descricao          text,
    tanque_codigo           text,
    tanque_descricao        text,
    source_cliente_id       text,
    source_funcionario_id   text,
    forma_pagamento_tipo    text,                           -- fora do escopo MVP — NULL
    source                  text NOT NULL CHECK (source IN ('status', 'webposto')),
    source_id               text NOT NULL,
    segmento                text CHECK (segmento IN ('combustivel', 'lubrificantes', 'servicos', 'conveniencia')),
                                                             -- derivado pelo pipeline via categoria_codigo. NULL = categoria interna (excluída das views)
    synced_at               timestamptz NOT NULL DEFAULT now(),

    -- Idempotência: garante que o mesmo item nunca seja inserido duas vezes
    UNIQUE (tenant_id, posto_id, source, source_id)
);

-- Índices para as queries analíticas mais comuns
CREATE INDEX idx_fato_venda_tenant_data ON canonical.fato_venda(tenant_id, data_venda DESC);
CREATE INDEX idx_fato_venda_posto_data ON canonical.fato_venda(posto_id, data_venda DESC);
CREATE INDEX idx_fato_venda_categoria ON canonical.fato_venda(tenant_id, categoria_codigo, data_venda DESC);
CREATE INDEX idx_fato_venda_combustivel ON canonical.fato_venda(tenant_id, is_combustivel, data_venda DESC);
CREATE INDEX idx_fato_venda_segmento ON canonical.fato_venda(tenant_id, segmento, data_venda DESC);
CREATE INDEX idx_fato_venda_data ON canonical.fato_venda(data_venda DESC);

-- Join com dim_tempo (analytics)
ALTER TABLE canonical.fato_venda
    ADD CONSTRAINT fk_fato_venda_dim_tempo
    FOREIGN KEY (data_venda) REFERENCES canonical.dim_tempo(data);

-- =============================================================================
-- SCHEMA: analytics
-- Gold: materialized views pré-agregadas para o frontend
-- Definidas spec a spec — este schema existe mas as MVs são criadas após as specs
-- =============================================================================

-- -----------------------------------------------------------------------------
-- analytics.mv_vendas_diario
-- Spec: docs/specs/dashboard-vendas.md
-- Grão: 1 linha = 1 dia × 1 posto × 1 segmento × 1 grupo de produto
-- -----------------------------------------------------------------------------
CREATE MATERIALIZED VIEW analytics.mv_vendas_diario AS
SELECT
    fv.tenant_id,
    fv.posto_id,
    fv.data_venda,
    dt.ano,
    dt.mes,
    dt.ano_mes,
    dt.semana_ano,
    dt.dia_semana,
    dt.is_fim_de_semana,
    fv.segmento,
    fv.categoria_codigo,
    fv.categoria_descricao,
    fv.grupo_id,
    fv.grupo_descricao,
    COUNT(*)                                                            AS qtd_itens,
    SUM(fv.qtd_venda)                                                   AS qtd_total,
    SUM(fv.vlr_total)                                                   AS receita_bruta,
    SUM(COALESCE(fv.desconto_total, 0))                                 AS descontos,
    SUM(fv.vlr_total) - SUM(COALESCE(fv.desconto_total, 0))            AS receita_liquida,
    SUM(COALESCE(fv.custo_unitario, 0) * fv.qtd_venda)                 AS cmv,
    SUM(fv.vlr_total)
        - SUM(COALESCE(fv.desconto_total, 0))
        - SUM(COALESCE(fv.custo_unitario, 0) * fv.qtd_venda)           AS margem_bruta
FROM canonical.fato_venda fv
JOIN canonical.dim_tempo dt ON dt.data = fv.data_venda
WHERE fv.segmento IS NOT NULL                                           -- exclui categorias internas
GROUP BY
    fv.tenant_id, fv.posto_id, fv.data_venda,
    dt.ano, dt.mes, dt.ano_mes, dt.semana_ano, dt.dia_semana, dt.is_fim_de_semana,
    fv.segmento, fv.categoria_codigo, fv.categoria_descricao,
    fv.grupo_id, fv.grupo_descricao
WITH NO DATA;

-- Unique index obrigatório para REFRESH CONCURRENTLY
CREATE UNIQUE INDEX idx_mv_vendas_diario_pk
    ON analytics.mv_vendas_diario(tenant_id, posto_id, data_venda, segmento, categoria_codigo, grupo_id);

CREATE INDEX idx_mv_vendas_diario_tenant_data
    ON analytics.mv_vendas_diario(tenant_id, data_venda DESC);

CREATE INDEX idx_mv_vendas_diario_posto_data
    ON analytics.mv_vendas_diario(tenant_id, posto_id, data_venda DESC);

CREATE INDEX idx_mv_vendas_diario_segmento
    ON analytics.mv_vendas_diario(tenant_id, segmento, data_venda DESC);

-- -----------------------------------------------------------------------------
-- analytics.mv_combustivel_diario
-- Spec: docs/specs/dashboard-combustivel.md
-- Grão: 1 linha = 1 dia × 1 posto × 1 produto combustível (grupo)
-- -----------------------------------------------------------------------------
CREATE MATERIALIZED VIEW analytics.mv_combustivel_diario AS
SELECT
    fv.tenant_id,
    fv.posto_id,
    fv.data_venda,
    dt.ano,
    dt.mes,
    dt.ano_mes,
    dt.semana_ano,
    dt.dia_semana,
    dt.is_fim_de_semana,
    fv.categoria_codigo,
    fv.grupo_id,
    fv.grupo_descricao,
    COUNT(*)                                                            AS qtd_abastecimentos,
    SUM(fv.qtd_venda)                                                   AS volume_litros,
    SUM(fv.vlr_total)                                                   AS receita_bruta,
    SUM(COALESCE(fv.desconto_total, 0))                                 AS descontos,
    SUM(fv.vlr_total) - SUM(COALESCE(fv.desconto_total, 0))            AS receita_liquida,
    SUM(COALESCE(fv.custo_unitario, 0) * fv.qtd_venda)                 AS cmv,
    SUM(fv.vlr_total)
        - SUM(COALESCE(fv.desconto_total, 0))
        - SUM(COALESCE(fv.custo_unitario, 0) * fv.qtd_venda)           AS margem_bruta,
    CASE WHEN SUM(fv.qtd_venda) > 0
        THEN SUM(fv.vlr_total) / SUM(fv.qtd_venda)
        ELSE NULL
    END                                                                 AS preco_medio_litro,
    CASE WHEN SUM(fv.qtd_venda) > 0 AND SUM(COALESCE(fv.custo_unitario, 0) * fv.qtd_venda) > 0
        THEN SUM(COALESCE(fv.custo_unitario, 0) * fv.qtd_venda) / SUM(fv.qtd_venda)
        ELSE NULL
    END                                                                 AS custo_medio_litro
FROM canonical.fato_venda fv
JOIN canonical.dim_tempo dt ON dt.data = fv.data_venda
WHERE fv.segmento = 'combustivel'
GROUP BY
    fv.tenant_id, fv.posto_id, fv.data_venda,
    dt.ano, dt.mes, dt.ano_mes, dt.semana_ano, dt.dia_semana, dt.is_fim_de_semana,
    fv.categoria_codigo, fv.grupo_id, fv.grupo_descricao
WITH NO DATA;

CREATE UNIQUE INDEX idx_mv_combustivel_diario_pk
    ON analytics.mv_combustivel_diario(tenant_id, posto_id, data_venda, categoria_codigo, grupo_id);

CREATE INDEX idx_mv_combustivel_diario_tenant_data
    ON analytics.mv_combustivel_diario(tenant_id, data_venda DESC);

CREATE INDEX idx_mv_combustivel_diario_posto_data
    ON analytics.mv_combustivel_diario(tenant_id, posto_id, data_venda DESC);

-- -----------------------------------------------------------------------------
-- analytics.mv_conveniencia_diario
-- Spec: docs/specs/dashboard-conveniencia.md
-- Grão: 1 linha = 1 dia × 1 posto × 1 segmento (loja) × 1 grupo de produto
-- Cobre segmentos: conveniencia, lubrificantes, servicos
-- -----------------------------------------------------------------------------
CREATE MATERIALIZED VIEW analytics.mv_conveniencia_diario AS
SELECT
    fv.tenant_id,
    fv.posto_id,
    fv.data_venda,
    dt.ano,
    dt.mes,
    dt.ano_mes,
    dt.semana_ano,
    dt.dia_semana,
    dt.is_fim_de_semana,
    fv.segmento,
    fv.categoria_codigo,
    fv.categoria_descricao,
    fv.grupo_id,
    fv.grupo_descricao,
    COUNT(*)                                                            AS qtd_itens,
    SUM(fv.qtd_venda)                                                   AS qtd_total,
    SUM(fv.vlr_total)                                                   AS receita_bruta,
    SUM(COALESCE(fv.desconto_total, 0))                                 AS descontos,
    SUM(fv.vlr_total) - SUM(COALESCE(fv.desconto_total, 0))            AS receita_liquida,
    SUM(COALESCE(fv.custo_unitario, 0) * fv.qtd_venda)                 AS cmv,
    SUM(fv.vlr_total)
        - SUM(COALESCE(fv.desconto_total, 0))
        - SUM(COALESCE(fv.custo_unitario, 0) * fv.qtd_venda)           AS margem_bruta
FROM canonical.fato_venda fv
JOIN canonical.dim_tempo dt ON dt.data = fv.data_venda
WHERE fv.segmento IN ('conveniencia', 'lubrificantes', 'servicos')
GROUP BY
    fv.tenant_id, fv.posto_id, fv.data_venda,
    dt.ano, dt.mes, dt.ano_mes, dt.semana_ano, dt.dia_semana, dt.is_fim_de_semana,
    fv.segmento, fv.categoria_codigo, fv.categoria_descricao,
    fv.grupo_id, fv.grupo_descricao
WITH NO DATA;

CREATE UNIQUE INDEX idx_mv_conveniencia_diario_pk
    ON analytics.mv_conveniencia_diario(tenant_id, posto_id, data_venda, segmento, categoria_codigo, grupo_id);

CREATE INDEX idx_mv_conveniencia_diario_tenant_data
    ON analytics.mv_conveniencia_diario(tenant_id, data_venda DESC);

CREATE INDEX idx_mv_conveniencia_diario_posto_data
    ON analytics.mv_conveniencia_diario(tenant_id, posto_id, data_venda DESC);

CREATE INDEX idx_mv_conveniencia_diario_segmento
    ON analytics.mv_conveniencia_diario(tenant_id, segmento, data_venda DESC);

-- -----------------------------------------------------------------------------
-- analytics.mv_dre_mensal
-- Spec: docs/specs/dre-mensal.md
-- Grão: 1 linha = 1 mês × 1 posto × 1 segmento
-- -----------------------------------------------------------------------------
CREATE MATERIALIZED VIEW analytics.mv_dre_mensal AS
SELECT
    fv.tenant_id,
    fv.posto_id,
    dt.ano,
    dt.mes,
    dt.ano_mes,
    fv.segmento,
    COUNT(*)                                            AS qtd_itens,
    SUM(fv.qtd_venda)                                   AS qtd_total,
    SUM(fv.vlr_total)                                   AS receita_bruta,
    SUM(COALESCE(fv.desconto_total, 0))                 AS descontos,
    SUM(fv.vlr_total)
        - SUM(COALESCE(fv.desconto_total, 0))           AS receita_liquida,
    SUM(COALESCE(fv.custo_unitario, 0) * fv.qtd_venda)  AS cmv,
    SUM(fv.vlr_total)
        - SUM(COALESCE(fv.desconto_total, 0))
        - SUM(COALESCE(fv.custo_unitario, 0)
              * fv.qtd_venda)                           AS margem_bruta
FROM canonical.fato_venda fv
JOIN canonical.dim_tempo dt ON dt.data = fv.data_venda
WHERE fv.segmento IS NOT NULL
GROUP BY
    fv.tenant_id, fv.posto_id,
    dt.ano, dt.mes, dt.ano_mes,
    fv.segmento
WITH NO DATA;

CREATE UNIQUE INDEX idx_mv_dre_mensal_pk
    ON analytics.mv_dre_mensal(tenant_id, posto_id, ano_mes, segmento);

CREATE INDEX idx_mv_dre_mensal_tenant_periodo
    ON analytics.mv_dre_mensal(tenant_id, ano_mes DESC);

CREATE INDEX idx_mv_dre_mensal_posto_periodo
    ON analytics.mv_dre_mensal(tenant_id, posto_id, ano_mes DESC);

-- =============================================================================
-- Notas de implementação
-- =============================================================================
-- 1. FKs entre schemas (canonical → app) são intencionalmente ausentes.
--    O pipeline resolve IDs via lookup — FKs físicas entre schemas criam
--    acoplamento e complicam migrations independentes.
--
-- 2. tenant_id em canonical.* não tem FK para app.tenants pelo mesmo motivo.
--    O pipeline garante consistência antes de inserir.
--
-- 3. analytics.* é populado exclusivamente via REFRESH MATERIALIZED VIEW.
--    Nunca inserir diretamente.
--
-- 4. raw.raw_ingest nunca é deletado no MVP — é o audit trail completo.
--    Estratégia de retenção/particionamento a definir quando o volume crescer.
