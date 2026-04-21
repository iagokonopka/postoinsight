# ADR-008 — Nomenclatura Neutra de Domínio

**Data:** 2026-04-20  
**Status:** Aceito  
**Contexto:** Refatoração pré-produção

---

## Contexto

O projeto foi iniciado com o domínio de postos de combustível em mente. Isso vazou para dentro da infraestrutura — schema do banco, variáveis de ambiente, código da API e do agente usam termos como `postos`, `posto_id`, `sourcePostoId`.

O produto é uma plataforma de BI multi-tenant. O domínio do cliente (postos, clínicas, restaurantes) não deve aparecer na camada de infraestrutura.

---

## Decisão

Renomear todos os conceitos de infraestrutura para termos neutros:

| Antes | Depois | Motivo |
|-------|--------|--------|
| `postos` (tabela) | `locations` | Uma "localização" existe em qualquer nicho |
| `posto_id` (FK) | `location_id` | |
| `sourcePostoId` | `sourceLocationId` | |
| `app.postos` | `app.locations` | |
| `POSTOS=...` (env) | `LOCATIONS=...` | |
| `postoId` (código) | `locationId` | |
| `CD_ESTAB` mapeado como "posto" | mapeado como "location" | |

**O que NÃO muda:**
- `tenants` → mantém (termo padrão SaaS, amplamente reconhecido)
- `connectors` → mantém (correto e neutro)
- `organizations` → não adotado (tenants já é o padrão da indústria)
- Nomes de campos ERP (`CD_ESTAB`, `DATA_EMISSAO`) → mantém, são da fonte

---

## Roles de Acesso (ADR complementar)

Junto a esta refatoração, definimos o modelo de roles da plataforma:

### Roles por tenant (já existia parcialmente)
| Role | Acesso |
|------|--------|
| `owner` | Tudo dentro do tenant — configurações, usuários, dados |
| `manager` | Dashboards + relatórios, sem configurações de conta |
| `viewer` | Somente leitura dos dashboards |

### Roles de plataforma (novo)
| Role | Acesso |
|------|--------|
| `superadmin` | Acesso total a todos os tenants — impersonation, gestão de plano, suporte |
| `support` | Leitura de dados de qualquer tenant para suporte (sem escrita) |

**Casos de uso do `superadmin`:**
- Ver todos os tenants e seu status de sync
- Acessar o dashboard de qualquer tenant (impersonation)
- Forçar re-sync / backfill de qualquer conector
- Gerenciar planos e limites por tenant
- Ver logs de pipeline e erros de ingestão
- Criar/desativar tenants
- Auditar acessos

**Casos de uso do `support`:**
- Ver dados de um tenant específico para investigar problema reportado
- Ler logs de sync sem poder alterar nada

### Implementação
- Nova tabela `app.platform_users` com `user_id` + `platform_role`
- Middleware na API verifica `platform_role` antes de `tenant_role`
- Rotas `/admin/*` protegidas por `superadmin`
- Rotas `/support/*` protegidas por `support` ou `superadmin`

---

## Consequências

**Positivo:**
- Código desacoplado do domínio do cliente
- Onboarding de novo nicho não exige renomear nada
- Roles de plataforma permitem operar o SaaS sem acesso direto ao banco

**Negativo:**
- Refatoração considerável: schema + migration + API + agente + shared
- Deve ser feito antes de qualquer dado de produção no banco canônico

---

## Alternativas Descartadas

- `sites` — muito associado a web
- `branches` — confunde com git
- `units` — ambíguo
- `stores` — domínio específico (varejo)
