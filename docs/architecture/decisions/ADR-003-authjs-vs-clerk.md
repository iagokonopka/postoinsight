# ADR-003 — Autenticação: Auth.js v5 vs Clerk

**Data:** 2026-04-05
**Status:** Aceito

---

## Contexto

PostoInsight precisa de autenticação com:
- Login por email/senha
- Suporte a múltiplos tenants (cada rede de postos é um tenant isolado)
- Controle de roles por tenant (dono da rede, gestor de posto, consultor externo)
- Um usuário pode ter acesso a múltiplos tenants com roles diferentes

Clerk é a solução managed mais popular atualmente — zero config, UI pronta, SDK TypeScript de primeira linha.

---

## Decisão

**Auth.js v5** (self-hosted, com adapter Drizzle + PostgreSQL)

---

## Justificativa

1. **Sem vendor lock-in.** Clerk armazena usuários, sessões e dados de autenticação nos servidores deles. Migrar significa exportar dados de usuários, reescrever integrações e comunicar mudança aos clientes. Auth.js guarda tudo no nosso banco — migrar de provedor é trocar uma linha de config.

2. **Custo previsível.** Clerk cobra por MAU (monthly active user). No modelo B2B do PostoInsight, cada usuário é de alto valor — não faz sentido pagar por usuário ativo quando Auth.js tem custo zero além da infra já existente.

3. **Multitenancy customizado.** O modelo de acesso do PostoInsight (um usuário, múltiplos tenants, roles diferentes por tenant) é específico o suficiente para que qualquer solução managed exija workarounds. Com Auth.js + Drizzle, o schema de `app.users`, `app.tenant_users` e roles fica totalmente sob controle.

4. **Dados de usuário no mesmo banco.** Joins entre dados operacionais e dados de usuário são diretos, sem chamadas de API externas.

---

## Alternativas descartadas

| Alternativa | Motivo da rejeição |
|------------|-------------------|
| Clerk | Vendor lock-in, custo por MAU, multitenancy customizado exige workarounds |
| NextAuth v4 | Versão anterior do Auth.js — v5 é o caminho correto para App Router |
| Supabase Auth | Acoplaria ao Supabase como plataforma — queremos controle total do banco |
| Implementação própria (JWT manual) | Risco de segurança, manutenção, reinventar a roda |

---

## Consequências

- Auth.js v5 + Drizzle Adapter: sessões e usuários persistidos no schema `app`
- Mais configuração inicial comparado ao Clerk — UI de login, email templates, etc.
- Controle total: qualquer política de acesso, auditoria ou customização é possível sem depender de um terceiro