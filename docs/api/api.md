# PostoInsight — Design da API

> REST. Versionado em `/api/v1`. Fastify + TypeScript.
> Dois contextos separados: `/api` (frontend) e `/agent` (agente Windows Service).

---

## Autenticação

### Frontend (`/api`)
JWT via cookie `httpOnly` + `sameSite: strict`.
Refresh token em cookie separado. Nunca exposto ao JavaScript.

```
Access token:   15 min
Refresh token:  30 dias
```

Middleware valida `tenant_id` do token em toda rota `/api` — garante isolamento.

### Agente (`/agent`)
API Key estática por conector, gerada no setup.
Enviada no header: `X-Agent-Key: <key>`

A API Key é vinculada a um `connector_id` + `tenant_id` — o agente só pode
operar dentro do seu tenant.

---

## /api/v1/auth

### POST /api/v1/auth/login
```json
// Request
{
  "email": "joao@redejoao.com.br",
  "senha": "..."
}

// Response 200
{
  "user": {
    "id": "uuid",
    "nome": "João Silva",
    "email": "joao@redejoao.com.br"
  },
  "tenant": {
    "id": "uuid",
    "nome": "Rede João",
    "slug": "rede-joao"
  },
  "role": "dono"
}
// access_token e refresh_token setados em cookies httpOnly
```

### POST /api/v1/auth/logout
```
// Response 200 — limpa os cookies
```

### POST /api/v1/auth/refresh
```json
// Lê refresh_token do cookie
// Response 200 — novo access_token no cookie
```

### GET /api/v1/auth/me
```json
// Response 200
{
  "id": "uuid",
  "nome": "João Silva",
  "email": "joao@redejoao.com.br",
  "role": "dono",
  "tenant": {
    "id": "uuid",
    "nome": "Rede João",
    "slug": "rede-joao",
    "plano": "mvp"
  },
  "postos": [           // postos acessíveis pelo usuário
    { "id": "uuid", "nome_fantasia": "Posto Centro" }
  ]
}
```

---

## /api/v1/postos

### GET /api/v1/postos
Lista postos do tenant autenticado.

```json
// Response 200
{
  "data": [
    {
      "id": "uuid",
      "nome_fantasia": "Posto Centro",
      "cidade": "São Paulo",
      "uf": "SP",
      "ativo": true,
      "ultimo_sync_em": "2026-03-29T03:00:00Z"
    }
  ]
}
```

### GET /api/v1/postos/:id
```json
// Response 200
{
  "id": "uuid",
  "nome_fantasia": "Posto Centro",
  "razao_social": "Posto Centro Ltda",
  "cnpj": "00.000.000/0001-00",
  "cidade": "São Paulo",
  "uf": "SP",
  "latitude": -23.5505,
  "longitude": -46.6333,
  "source": "status",
  "source_posto_id": "1",
  "ativo": true
}
```

---

## /api/v1/connectors

### GET /api/v1/connectors
```json
// Response 200
{
  "data": [
    {
      "id": "uuid",
      "tipo": "status",
      "ativo": true,
      "ultimo_sync_em": "2026-03-29T03:00:00Z",
      "status_conexao": "ok"   // derivado do último sync_job
    }
  ]
}
```

### POST /api/v1/connectors
Cria novo conector e gera API Key para o agente.

```json
// Request
{
  "tipo": "status",
  "config": {
    "host": "192.168.1.10",
    "database": "SMB_BI",
    "username": "postoinsight_ro",
    "password": "..."
  }
}

// Response 201
{
  "id": "uuid",
  "tipo": "status",
  "agent_key": "pi_live_xxxxxxxxxxxx"  // exibido UMA VEZ — salvar antes de fechar
}
```

### PATCH /api/v1/connectors/:id
Atualiza config ou ativa/desativa.

```json
// Request
{
  "ativo": false
}
// Response 200
```

### DELETE /api/v1/connectors/:id
```
// Response 204
```

---

## /api/v1/sync

### POST /api/v1/sync/trigger
Dispara sync manual (on-demand).

```json
// Request
{
  "connector_id": "uuid",
  "entidade": "vendas"       // "vendas" | "produtos" | "pagamentos"
}

// Response 202 — job criado, execução assíncrona
{
  "job_id": "uuid",
  "status": "pending"
}
```

### GET /api/v1/sync/jobs
Histórico de execuções do tenant.

```json
// Query params: ?connector_id=&status=&limit=20&offset=0

// Response 200
{
  "data": [
    {
      "id": "uuid",
      "connector_id": "uuid",
      "trigger": "scheduled",
      "entidade": "vendas",
      "status": "success",
      "watermark_inicio": "2026-03-28",
      "watermark_fim": "2026-03-29",
      "linhas_inseridas": 1847,
      "linhas_erro": 0,
      "iniciado_em": "2026-03-29T03:00:00Z",
      "finalizado_em": "2026-03-29T03:01:23Z"
    }
  ],
  "total": 42
}
```

### GET /api/v1/sync/jobs/:id
Detalhes de um job específico (usado para polling de status no frontend).

```json
// Response 200
{
  "id": "uuid",
  "status": "running",
  "linhas_recebidas": 950,
  "linhas_inseridas": 948,
  "linhas_erro": 2,
  "erro_mensagem": null,
  "iniciado_em": "2026-03-29T03:00:00Z",
  "finalizado_em": null
}
```

---

## /api/v1/analytics

Todas as rotas de analytics aceitam os mesmos filtros base:

```
?posto_id=uuid          — filtra por posto (opcional, sem = todos os postos)
&data_inicio=2026-01-01
&data_fim=2026-03-31
&comparar_com=periodo_anterior   — opcional, habilita comparativo
```

O middleware valida que `posto_id` pertence ao tenant do usuário autenticado.

---

### GET /api/v1/analytics/vendas/resumo
Visão geral — card do topo do dashboard.

```json
// Response 200
{
  "periodo": { "inicio": "2026-03-01", "fim": "2026-03-31" },
  "receita_bruta": 1250000.00,
  "total_desconto": 12500.00,
  "qtd_vendas": 4832,
  "ticket_medio": 258.65,
  "comparativo": {            // presente se ?comparar_com=periodo_anterior
    "receita_bruta": 1180000.00,
    "variacao_percentual": 5.93
  }
}
```

### GET /api/v1/analytics/vendas/evolucao
Série temporal — gráfico de linha/barra.

```json
// Query: ?granularidade=dia|semana|mes  (default: dia)

// Response 200
{
  "granularidade": "dia",
  "data": [
    {
      "data": "2026-03-01",
      "receita_bruta": 42000.00,
      "qtd_vendas": 158,
      "custo_total": 28000.00,
      "margem_bruta": 14000.00
    }
  ]
}
```

### GET /api/v1/analytics/vendas/por-categoria
Breakdown combustível vs conveniência + drill-down.

```json
// Query: ?nivel=categoria|grupo|subgrupo  (default: categoria)

// Response 200
{
  "data": [
    {
      "codigo": "CB",
      "descricao": "Combustíveis",
      "is_combustivel": true,
      "receita_bruta": 980000.00,
      "participacao_percentual": 78.4,
      "qtd_venda": 45230.5,
      "custo_total": 890000.00,
      "margem_bruta": 90000.00,
      "margem_percentual": 9.18
    },
    {
      "codigo": "BEB",
      "descricao": "Bebidas",
      "is_combustivel": false,
      "receita_bruta": 85000.00,
      "participacao_percentual": 6.8,
      "qtd_venda": 3200.0,
      "custo_total": 52000.00,
      "margem_bruta": 33000.00,
      "margem_percentual": 38.82
    }
  ]
}
```

### GET /api/v1/analytics/vendas/por-posto
Comparativo entre postos da rede.

```json
// Response 200
{
  "data": [
    {
      "posto_id": "uuid",
      "nome_fantasia": "Posto Centro",
      "receita_bruta": 650000.00,
      "participacao_percentual": 52.0,
      "qtd_vendas": 2500,
      "margem_bruta": 95000.00,
      "margem_percentual": 14.6
    }
  ]
}
```

### GET /api/v1/analytics/margem/produtos
Ranking de produtos por margem.

```json
// Query: ?limit=20&ordem=margem_bruta|margem_percentual  (default: margem_bruta)

// Response 200
{
  "data": [
    {
      "produto_id": "uuid",
      "nome": "Red Bull 250ml",
      "categoria_descricao": "Bebidas",
      "grupo_descricao": "Energéticos",
      "qtd_venda": 320.0,
      "receita_bruta": 3200.00,
      "custo_total": 1600.00,
      "margem_bruta": 1600.00,
      "margem_percentual": 50.00
    }
  ]
}
```

### GET /api/v1/analytics/pagamentos
Breakdown por forma de pagamento.

```json
// Response 200
{
  "data": [
    {
      "forma_pagamento_id": "uuid",
      "descricao": "Cartão Crédito",
      "tipo": "credito",
      "total": 520000.00,
      "participacao_percentual": 41.6,
      "qtd_transacoes": 1820
    }
  ]
}
```

---

## /agent/v1 — Agente Windows Service

Autenticação via header: `X-Agent-Key: pi_live_xxxxxxxxxxxx`
O tenant_id e connector_id são derivados da API Key — agente não precisa informar.

---

### GET /agent/v1/watermark
Agente consulta o watermark antes de fazer o SELECT no SQL Server.

```json
// Query: ?entidade=vendas

// Response 200
{
  "entidade": "vendas",
  "ultimo_sync_em": "2026-03-28T00:00:00Z",
  "watermark": "2026-03-28"   // agente faz SELECT WHERE data >= watermark
}
```

### GET /agent/v1/jobs/pending
Agente verifica se há jobs manuais pendentes (complementa o WebSocket).

```json
// Response 200
{
  "jobs": [
    {
      "id": "uuid",
      "entidade": "vendas",
      "trigger": "manual"
    }
  ]
}
```

### POST /agent/v1/ingest
Agente envia os dados extraídos do SQL Server em batches.

```json
// Request
{
  "job_id": "uuid",
  "entidade": "vendas",
  "batch": 1,           // número do batch (para controle de progresso)
  "total_batches": 4,   // total esperado
  "rows": [
    {
      // payload bruto — exatamente o que veio do SELECT
      // persiste em raw.ingest sem transformação
      "Cd_Estab": "1",
      "Dt_Emissao": "2026-03-28",
      "Cd_Produto": "1234",
      "Ds_Produto": "Gasolina Comum",
      "CODIGO_CATEGORIA_ITEM": "CB",
      // ...
    }
  ]
}

// Response 202
{
  "batch": 1,
  "linhas_recebidas": 500,
  "job_id": "uuid"
}
```

### PATCH /agent/v1/jobs/:id
Agente atualiza status do job ao concluir ou falhar.

```json
// Request — sucesso
{
  "status": "success",
  "linhas_recebidas": 1847,
  "linhas_inseridas": 1847,
  "linhas_erro": 0
}

// Request — erro
{
  "status": "error",
  "erro_mensagem": "Connection timeout to SQL Server"
}

// Response 200
```

### WebSocket /agent/v1/connect
Conexão persistente do agente. Autenticado via API Key no header do upgrade.

```
// Agente conecta e aguarda eventos

// Servidor → Agente (trigger manual)
{
  "type": "sync",
  "job_id": "uuid",
  "entidade": "vendas"
}

// Agente → Servidor (heartbeat a cada 30s)
{
  "type": "ping"
}

// Servidor → Agente
{
  "type": "pong"
}

// Agente → Servidor (confirmação de recebimento)
{
  "type": "ack",
  "job_id": "uuid"
}
```

---

## Códigos de erro padrão

```json
// 400 — payload inválido
{ "error": "VALIDATION_ERROR", "message": "data_inicio é obrigatório", "field": "data_inicio" }

// 401 — não autenticado
{ "error": "UNAUTHORIZED", "message": "Token expirado ou inválido" }

// 403 — sem permissão
{ "error": "FORBIDDEN", "message": "Acesso negado a este posto" }

// 404
{ "error": "NOT_FOUND", "message": "Connector não encontrado" }

// 409 — conflito
{ "error": "CONFLICT", "message": "Já existe um sync em execução para este conector" }

// 500
{ "error": "INTERNAL_ERROR", "message": "Erro interno", "request_id": "uuid" }
```

---

## Resumo das rotas

| Método | Rota | Quem usa |
|---|---|---|
| POST | /api/v1/auth/login | Frontend |
| POST | /api/v1/auth/logout | Frontend |
| POST | /api/v1/auth/refresh | Frontend |
| GET | /api/v1/auth/me | Frontend |
| GET | /api/v1/postos | Frontend |
| GET | /api/v1/postos/:id | Frontend |
| GET | /api/v1/connectors | Frontend |
| POST | /api/v1/connectors | Frontend |
| PATCH | /api/v1/connectors/:id | Frontend |
| DELETE | /api/v1/connectors/:id | Frontend |
| POST | /api/v1/sync/trigger | Frontend |
| GET | /api/v1/sync/jobs | Frontend |
| GET | /api/v1/sync/jobs/:id | Frontend |
| GET | /api/v1/analytics/vendas/resumo | Frontend |
| GET | /api/v1/analytics/vendas/evolucao | Frontend |
| GET | /api/v1/analytics/vendas/por-categoria | Frontend |
| GET | /api/v1/analytics/vendas/por-posto | Frontend |
| GET | /api/v1/analytics/margem/produtos | Frontend |
| GET | /api/v1/analytics/pagamentos | Frontend |
| GET | /agent/v1/watermark | Agente |
| GET | /agent/v1/jobs/pending | Agente |
| POST | /agent/v1/ingest | Agente |
| PATCH | /agent/v1/jobs/:id | Agente |
| WS | /agent/v1/connect | Agente |