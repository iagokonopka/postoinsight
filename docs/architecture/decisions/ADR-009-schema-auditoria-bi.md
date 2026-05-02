# ADR-009 — Auditoria, Rastreabilidade e BI no Schema

**Data:** 2026-05-02
**Status:** Aceito

---

## Contexto

Com o pipeline em produção e a Rede JAM conectada, identificamos três lacunas no schema original:

1. **Auditoria e segurança:** não havia registro de quem fez o quê no sistema. Em um produto SaaS multi-tenant onde platform users têm acesso de impersonation, a ausência de trilha de auditoria é um risco operacional e de compliance.

2. **Rastreabilidade raw→canonical:** quando um registro em `canonical.fato_venda` apresentava anomalia, não era possível rastrear de volta ao payload bruto em `raw.raw_ingest` que o originou. O reprocessamento também não tinha controle.

3. **Gestão de usuários incompleta:** o modelo original de `tenant_users` não suportava restrição de acesso por location (necessária para o role `manager`), nem o ciclo de vida completo de um usuário (convites, desativação, soft-delete).

4. **Observabilidade do pipeline:** rejeições de registros eram contabilizadas só como número em `sync_jobs.rows_rejected`, sem detalhes para diagnóstico. Eventos de conexão do agente também não eram persistidos.

---

## Decisão

Aplicar migration `0003_little_zaladane` com 47 alterações cobrindo quatro áreas:

### 1. Tabelas de auditoria
- **`app.audit_log`** — trilha imutável de ações: qual usuário, qual ação, em qual entidade, antes/depois (JSONB), IP de origem.
- **`app.login_history`** — histórico de logins com timestamp, IP e user-agent. Separado do audit_log para facilitar queries de segurança.

### 2. Rastreabilidade raw→canonical
- **`canonical.fato_venda.raw_ingest_id`** — FK nullable para `raw.raw_ingest`, preenchida pelo pipeline no momento do insert. Permite navegar do dado canônico ao payload bruto original.
- **`canonical.fato_venda.reprocessed_at`** e **`reprocess_count`** — controle de reprocessamento: quando e quantas vezes uma linha foi reprocessada.
- **`app.sync_rejections`** — registros rejeitados pelo pipeline gravados com `source_id`, `raw_payload` e `rejection_reason`. Substitui o simples contador `rows_rejected` em `sync_jobs`.

### 3. Gestão de usuários e tenants
- **`app.invitations`** — convites de acesso com token único, expiração e rastreamento de quem convidou.
- **`app.tenant_users.location_id`** — restrição de acesso por location para roles `manager` e `viewer`.
- **`app.tenant_users`** — campos de ciclo de vida: `created_by`, `updated_by`, `deactivated_at`, `deactivated_by`, `deleted_at`.
- **`app.tenants`** — campos de gestão de plano: `plan`, `trial_ends_at`, `cancelled_at`, `cancel_reason`, `onboarding_completed_at`.
- **`app.users`** — campos de segurança: `password_hash`, `active`, `last_login_at`, `failed_login_attempts`, `locked_until`.
- **Soft-delete** em `tenants`, `locations`, `connectors`, `tenant_users` via coluna `deleted_at`.

### 4. Observabilidade e enums
- **`app.connector_events`** — eventos de conexão/desconexão/erro por agente, com `event_type` e `metadata`.
- **`app.usage_events`** — eventos de uso da plataforma para analytics de produto (quais dashboards são mais acessados).
- **`app.sync_jobs`** — novos campos: `triggered_by` (enum: scheduler/user/backfill), `triggered_by_user_id`, `period_from`, `period_to`, `retry_count`, `metadata`.
- **Enums Drizzle** para `erp_source`, `sync_job_status`, `sync_job_type`, `sync_job_trigger` — substituem colunas `text` puras com validação no banco.

---

## Consequências

**Positivas:**
- Rastreabilidade completa: qualquer linha em `fato_venda` pode ser rastreada até o payload raw original.
- Diagnóstico de rejeições: `sync_rejections` permite identificar exatamente quais registros falharam e por quê.
- Segurança auditável: todas as ações administrativas ficam registradas em `audit_log`.
- Gestão de acesso granular: `tenant_users.location_id` habilita o controle de acesso por unidade para managers.
- Enums no banco: erros de valor inválido são detectados na camada de dados, não só na aplicação.

**Atenção:**
- O pipeline precisa ser atualizado para gravar `raw_ingest_id` em `fato_venda` e rejeições em `sync_rejections`.
- Queries que listam `tenant_users` ou `locations` devem filtrar por `deleted_at IS NULL` para ignorar registros soft-deleted.
- `audit_log` cresce indefinidamente — implementar política de retenção antes de escalar (fora do escopo MVP).

---

## Alternativas descartadas

- **Manter só o contador `rows_rejected`:** insuficiente para diagnóstico em produção. Descartado.
- **Soft-delete via flag booleano `deleted`:** coluna `deleted_at` é preferível pois registra quando ocorreu a exclusão. Escolhido `deleted_at`.
- **Auditoria em serviço externo (Datadog, Sentry):** dependência de infra externa desnecessária no MVP. Descartado.
