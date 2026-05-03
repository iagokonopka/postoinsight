# ADR-012 — Autenticação no Frontend SPA: Cookie HttpOnly

**Data:** 2026-05-03
**Status:** Aceito

---

## Contexto

Com a migração para Vite + React SPA (ADR-010), o Auth.js v5 foi removido do frontend — ele era a integração Next.js-específica responsável por emitir cookies de sessão JWE.

O backend em `apps/api/src/lib/auth.ts` usa `@auth/core/jwt` para decodificar tokens JWE (HKDF + A256GCM) e já suporta leitura de cookie (`authjs.session-token` / `__Secure-authjs.session-token`) e `Authorization: Bearer`.

A questão central: **como o SPA autentica após a remoção do Next.js/Auth.js?**

---

## Decisão

**Cookie HttpOnly gerenciado pelo Fastify.**

O Fastify passa a emitir e receber um cookie HttpOnly, Secure, SameSite=Strict contendo o token JWE. O JavaScript do SPA nunca toca no token — o browser o envia automaticamente em toda requisição para a API.

---

## Justificativa

### Comparativo das abordagens de mercado

| Abordagem | Segurança | Complexidade | Padrão de mercado |
|-----------|-----------|--------------|-------------------|
| **Cookie HttpOnly** (escolhida) | ✅ Alta — JS não acessa o token | ✅ Baixa | ✅ Sim — padrão SaaS B2B moderno |
| Token em memória + refresh cookie | ✅ Alta | ❌ Média-alta — dois tokens | Sim, para apps que precisam de refresh silencioso |
| Token no `sessionStorage` | ⚠️ Média — vulnerável a XSS na aba | ✅ Baixa | Não recomendado para dados sensíveis |
| Token no `localStorage` | ❌ Baixa — qualquer script rouba | ✅ Baixa | Não recomendado |

### Por que Cookie HttpOnly é o padrão correto para o PostoInsight

1. **Segurança máxima com menor complexidade.** Um script XSS injetado na página não consegue ler um cookie HttpOnly — o browser simplesmente não expõe esse cookie para o JavaScript. Com `localStorage` ou `sessionStorage`, o script roubaria o token em uma linha.

2. **O browser faz o trabalho.** O SPA não precisa gerenciar nenhum estado de token — não há `useEffect` para checar expiração, não há header para montar manualmente. O cookie vai automaticamente em toda requisição.

3. **Compatibilidade com a infra existente.** O `auth.ts` atual **já lê cookies** com os nomes `authjs.session-token` / `__Secure-authjs.session-token`. A única mudança é que agora o Fastify seta esse cookie no login — o código de decodificação não muda.

4. **Padrão de mercado.** Notion, Linear, Vercel Dashboard e a maioria dos SaaS B2B modernos usam cookies HttpOnly para autenticação de sessão.

---

## Configuração de domínio no Railway

Para cookies funcionarem entre domínios diferentes (ex: `app.postoinsight.com.br` e `api.postoinsight.com.br`), o cookie precisa ser setado com `domain=.postoinsight.com.br` (domínio raiz com ponto).

Configuração no Fastify:

```
Set-Cookie: authjs.session-token=<JWE>; HttpOnly; Secure; SameSite=Lax; Domain=.postoinsight.com.br; Path=/; Max-Age=28800
```

> **Por que `SameSite=Lax` e não `Strict`?** Com `Strict`, o browser não envia o cookie em nenhuma navegação cross-site — incluindo quando o usuário chega via link de e-mail ou bookmark externo, o que derrubaria a sessão. `Lax` permite o envio em navegações top-level (GET), bloqueando apenas em requests cross-site iniciados por terceiros (proteção CSRF mantida para POST/PUT/DELETE).

Em desenvolvimento local (localhost), omitir `Domain` e `Secure` — o Fastify detecta via `NODE_ENV`.

---

## Alternativas descartadas

| Alternativa | Motivo da rejeição |
|------------|-------------------|
| Token em `localStorage` | Vulnerável a XSS — inaceitável para dados financeiros de clientes |
| Token em `sessionStorage` | Melhor que localStorage, mas ainda acessível por JS; perda do token no reload de aba |
| Token em memória React + refresh cookie | Correto, mas mais complexo — o refresh silencioso não justifica a complexidade extra no MVP |
| Serviço de auth separado (Keycloak, Auth0) | Over-engineering para MVP solo founder |

---

## Implementação

### Novo endpoint: `POST /auth/login`

```
POST /auth/login
Body: { email: string, password: string }
Response 200: { user: { id, name, email, role, tenantId } }
  + Set-Cookie: authjs.session-token=<JWE>; HttpOnly; Secure; SameSite=Strict; ...
Response 401: { error: "Credenciais inválidas" }
```

O endpoint:
1. Valida credenciais contra `app.users` (bcrypt)
2. Busca `tenant_users` para resolver `tenantId` e `role`
3. Emite JWE via `encode()` do `@auth/core/jwt` com `AUTH_SECRET` + salt = `'authjs.session-token'`
4. Seta o cookie HttpOnly na resposta
5. Retorna apenas os dados do usuário (sem o token — o SPA não precisa)

### Novo endpoint: `POST /auth/logout`

```
POST /auth/logout
Response 200: { ok: true }
  + Set-Cookie: authjs.session-token=; HttpOnly; Secure; Max-Age=0 (apaga o cookie)
```

### O que o SPA faz

- No login: chama `POST /auth/login`, recebe os dados do usuário, armazena em React Context
- Em toda requisição à API: nada — o browser envia o cookie automaticamente
- No logout: chama `POST /auth/logout`, limpa o React Context, redireciona para `/login`
- No reload da página: chama `GET /auth/me` para verificar se a sessão ainda é válida e recarregar os dados do usuário

### Novo endpoint: `GET /auth/me`

```
GET /auth/me
Response 200: { user: { id, name, email, role, tenantId } }
Response 401: { error: "Não autenticado" }
```

Usado pelo SPA no carregamento inicial para restaurar a sessão sem pedir login de novo.

---

## Alterações necessárias

| Arquivo | Alteração |
|---------|-----------|
| `apps/api/src/lib/auth.ts` | **Nenhuma alteração necessária.** O código já lê `authjs.session-token` por cookie com o salt correto via `decodeWithFallback`. |
| `apps/api/src/routes/auth.ts` | **Novo arquivo** — implementa `/auth/login`, `/auth/logout`, `/auth/me` |
| `apps/web/src/lib/auth-context.tsx` | **Novo arquivo** — React Context com `user`, `login()`, `logout()` |

---

## O que NÃO muda

- Toda a lógica de autorização (`requireTenantSession`, roles, impersonation) permanece intacta
- Regras de multitenancy (`tenant_id` em toda query) não são afetadas
- O formato dos claims no token (estrutura `AuthClaims`) permanece o mesmo
- `AUTH_SECRET` continua sendo a única variável de ambiente sensível de auth
- O suporte a `Authorization: Bearer` no `auth.ts` permanece — útil para integrações futuras (API pública, mobile)