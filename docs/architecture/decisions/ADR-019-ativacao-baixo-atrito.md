# ADR-019 — Ativação de baixo atrito: token único + caminhos compatíveis com email/senha

**Data:** 2026-06-27
**Status:** Aceito (2026-06-29)

---

## Adendo (2026-06-29) — decisões de implementação

Revisado contra o estado real do repositório. Ajustes acordados antes de codar:

1. **Migration `0010`** (não `0009`): `0009_create_product_classification.sql` já existe.
2. **`issueSessionToken` e `setSessionCookie`** passam a aceitar `maxAge` opcional — hoje
   ambos usam o fixo `SESSION_MAX_AGE` (8h). `rememberMe` estende para 30 dias.
3. **Escopo da 1ª leva:** ativação + reset + login-link (passkeys seguem em fase 2).
4. **Provider de e-mail:** **Resend** (`resend`). Requer `RESEND_API_KEY` + domínio
   verificado. Decisão de dependência aprovada pelo founder.
5. **Seed:** padrão = owner sem senha + token de ativação no console. Env opcional
   `SEED_DEV_PASSWORD` cria senha direta apenas em dev (paridade com prod por default).
6. *(doc)* CLAUDE.md cita `/api/v1/vendas`; o path real é `/api/v1/sales` — follow-up
   de documentação, fora do escopo deste ADR.

---

## Contexto

A conta do dono (`role = owner`) é provisionada por venda assistida
(admin-provisioning): o tenant, as locations, os connectors e os dados já entram
carregados antes do primeiro acesso. Hoje o seed (`packages/db/src/seed.ts`)
cria o owner **já com uma senha** (`bcrypt` de um valor padrão) — o que obriga a
comunicar uma senha provisória fora de banda e não é aceitável para clientes
reais.

O ADR-003 fixou **login por email/senha** (Auth.js v5, hash `bcryptjs`) e o
ADR-012 fixou a sessão como **cookie HttpOnly + JWE** emitido pelo Fastify. Essas
duas decisões **permanecem**. Não há migração para magic link como método
primário, nem mudança no formato dos claims ou no `requireTenantSession`.

O que falta é o **fluxo de ativação**: como o owner define a primeira senha com
esforço mínimo no dia 1, e como reduzir o atrito nos acessos seguintes — tudo
isso mantendo email/senha como base.

Estado atual relevante do repositório (lido antes desta proposta):

- `apps/api/src/routes/auth.ts` — `POST /auth/login`, `GET /auth/me`,
  `POST /auth/logout`, `POST /auth/change-password`. Já existem os helpers
  `issueSessionToken(claims)`, `setSessionCookie(reply, token)` e `getClientIp(req)`.
  `SESSION_MAX_AGE` é fixo em 8h.
- `apps/api/src/lib/auth.ts` — `requireTenantSession` decodifica o JWE direto dos
  claims (sem hit no banco). **Não muda.**
- `packages/db/src/schema/app.ts` — `users.passwordHash` é **nullable**;
  existem `users.active`, `failedLoginAttempts`, `lockedUntil`,
  `passwordChangedAt`. Já existe a tabela `invitations` (token de uso único, mas
  guardado em **texto puro**) e `verification_tokens` (Auth.js, também texto
  puro). Existem `usage_events` e `tenants.onboardingCompletedAt`, ambos **ainda
  não usados** por nenhuma rota.
- `apps/web/src/pages/LoginPage.tsx` — já usa `autocomplete="email"` e
  `autocomplete="current-password"` (autofill de login correto). O link
  "Esqueci a senha" é um **stub** (`onClick = preventDefault`). Não há
  "manter conectado".
- **Não há infraestrutura de envio de e-mail** no repositório, e `env.ts` não
  expõe a URL pública do SPA.

---

## Decisão

Adotar um **mecanismo único de token de uso único** (hash do token + expiração +
consumo atômico) que serve três propósitos, e quatro caminhos de baixo atrito
sobre a base email/senha já em produção.

### 1. Primeiro acesso = link único de ativação

O provisionamento cria o owner com `passwordHash = NULL` e gera um **token de
ativação**. O e-mail de boas-vindas leva um link único e de expiração curta.
Ao clicar, o owner cai numa tela "criar senha" (email e nome da rede já
preenchidos via endpoint de contexto não-consumidor), define a senha **uma vez**
e **entra logado, direto no painel** — sem digitar email+senha, sem código.

### 2. Quatro caminhos de baixo atrito nos acessos seguintes

1. **Sessão persistente ("manter conectado")** — estende a validade do cookie
   HttpOnly + JWE. Maior redutor de atrito.
2. **Autofill / gerenciador de senha** — atributos `autocomplete` corretos na
   tela de login (já OK) e na tela nova de criar senha (`new-password` +
   `username` oculto).
3. **"Entrar com link por email"** — fallback que reaproveita o mesmo mecanismo
   de token único (purpose `login`): consome o token e emite a sessão direto, sem
   senha.
4. **Passkeys (WebAuthn)** — **fase 2**, aditivo, convive com email/senha. Não
   bloqueia a base.

### 3. Evento de ativação instrumentável único

`dashboard_first_view` — "primeira visualização do painel da rede" — emitido
server-side, idempotente por tenant, na primeira carga autenticada do resumo da
Visão Geral. É o sinal real que dispara os e-mails de ciclo de vida.

### Mecanismo de token (núcleo)

Tabela nova `app.one_time_tokens`, propósito (`activation | reset | login`):

- O token bruto (32 bytes aleatórios, base64url) só existe **no link**, nunca no
  banco. Guarda-se apenas `sha256(token)` em hex.
- **Uso único** garantido por `UPDATE ... WHERE consumed_at IS NULL` condicional
  (checagem de `rowCount`), à prova de corrida / replay.
- Expiração curta por propósito: ativação 72h, reset 60min, login-link 15min.
- Ao (re)emitir, invalida tokens não consumidos anteriores do mesmo
  `(user_id, purpose)`.

> Por que SHA-256 e não bcrypt para o token? O token é de **alta entropia**
> (256 bits aleatórios), então não precisa de hash lento contra força bruta — a
> ameaça que o bcrypt mitiga (senhas humanas fracas) não existe aqui. SHA-256
> dá lookup O(1) por índice único e é o padrão para tokens de e-mail. O bcrypt
> (custo 12) continua sendo usado para a **senha** do usuário.

---

## Justificativa

1. **Atrito mínimo no dia 1 sem abrir mão de email/senha.** O único esforço do
   owner é escolher a senha uma vez; ele já cai logado. Nenhuma senha provisória
   trafega fora de banda. A base de credenciais (ADR-003) fica intacta — o token
   só **autoriza definir** a senha, ele não é a credencial permanente.

2. **Um mecanismo, três usos.** Ativação, reset ("esqueci a senha") e login-link
   são o mesmo objeto: token único, hash, expiração, consumo atômico. Menos
   superfície, menos código, um só lugar para auditar e endurecer.

3. **Segurança superior ao precedente do repo.** `invitations` e
   `verification_tokens` guardam o token em texto puro — um dump de banco
   vazaria credenciais ativas. `one_time_tokens` guarda só o hash. (Migrar
   `invitations` para o mesmo padrão fica como follow-up sugerido, **fora do
   escopo deste ADR** para não reabrir decisão fechada.)

4. **Reuso total da infra de sessão.** `set-password` e `login-link` emitem a
   sessão pelo **mesmo** `issueSessionToken` + `setSessionCookie` do ADR-012.
   Nenhuma mudança em `requireTenantSession`, nos claims ou no multitenancy.

5. **Evento de ativação confiável.** Server-side e idempotente (guarda em
   `tenants.onboarding_completed_at IS NULL`), não pode ser pulado pelo cliente
   nem disparado por impersonação de platform user — base sólida para os e-mails
   de ciclo de vida.

---

## Alternativas descartadas

| Alternativa | Motivo da rejeição |
|------------|-------------------|
| Reusar `verification_tokens` (Auth.js) | Token em texto puro; formato Auth.js acoplado ao adapter; sem `purpose` nem consumo atômico nativo |
| Reusar `invitations` para ativação | Semântica de "convite de colaborador" ≠ ativação de owner; token em texto puro |
| Senha provisória comunicada fora de banda | Atrito e risco — senha em canal inseguro, troca obrigatória extra no dia 1 |
| Magic link como método **primário** | Conflita com ADR-003 (decisão fechada). Aqui é só **fallback** opcional |
| Hash bcrypt do token | Desnecessário para token de alta entropia; mais lento, sem ganho de segurança |
| Token em coluna na própria `users` | Não suporta múltiplos propósitos, reemissão, nem histórico/auditoria de tokens |

---

## Implementação

> Detalhamento arquivo-por-arquivo em `PLANO_IMPLEMENTACAO_AUTH_ATIVACAO.md`.
> Antes de codar, criar a spec correspondente em `docs/specs/auth-ativacao.md`
> (regra do CLAUDE.md: nenhum código sem spec).

### Schema (Drizzle — migration `0010`)

`app.one_time_tokens`:

| Coluna | Tipo | Nota |
|--------|------|------|
| `id` | uuid PK | `defaultRandom()` |
| `user_id` | uuid NOT NULL | FK → `users.id` `ON DELETE CASCADE` |
| `purpose` | enum `token_purpose` | `activation \| reset \| login` |
| `token_hash` | text NOT NULL | `sha256(raw)` hex; **unique** |
| `expires_at` | timestamptz NOT NULL | — |
| `consumed_at` | timestamptz NULL | NULL = não consumido (uso único) |
| `created_by` | uuid NULL | superadmin que provisionou; NULL = self |
| `request_ip` | text NULL | anti-abuso em reset/login |
| `request_user_agent` | text NULL | — |
| `created_at` | timestamptz NOT NULL | `defaultNow()` |

Índices: `unique(token_hash)`, `index(user_id, purpose)`, `index(expires_at)`.

### Endpoints novos (em `apps/api/src/routes/auth.ts`, prefixo `/auth`)

| Método + path | O que faz | Auth |
|---|---|---|
| `GET /auth/set-password/context?token=` | Preview **não-consumidor**: retorna `{ valid, email, name, tenantName, purpose }` para pré-preencher a tela | público |
| `POST /auth/set-password` | Consome token `activation`/`reset`, valida e grava senha (`bcrypt` 12), ativa o usuário, emite sessão → cai logado | público (token) |
| `POST /auth/forgot-password` | `{ email }` → sempre 200; se existir, emite token `reset` + e-mail | público |
| `POST /auth/login-link` | `{ email }` → sempre 200; se existir, emite token `login` + e-mail | público |
| `GET /auth/login-link/consume?token=` | Consome token `login`, emite sessão, redireciona ao painel | público (token) |
| `POST /auth/activation-token` | (Re)emite link de ativação de um usuário; **retorna o link** (entrega manual na venda assistida) | platform (`superadmin`) |

`POST /auth/login` ganha um campo **opcional** `rememberMe: boolean` que estende
o `maxAge` da sessão (8h → 30 dias).

### Contrato de `POST /auth/set-password`

```
POST /auth/set-password
Body: { token: string, password: string }    // password ≥ 8 (regra do change-password)
200:  { user: { id, name, email, role, platformRole, tenantId, locationId } }
      + Set-Cookie: <cookie de sessão padrão do ADR-012>
400:  { error: "token e password são obrigatórios" } | senha curta
410:  { error: "Link expirado ou já utilizado" }     // não consumido / expirado / inexistente → resposta genérica
```

Passos do handler: hash do token → busca por `token_hash` → `UPDATE ... SET
consumed_at = now() WHERE id = ? AND consumed_at IS NULL AND expires_at > now()`
(rowCount = 1 senão 410) → `bcrypt.hash(password, 12)` → atualiza
`users.passwordHash`, `passwordChangedAt`, `active = true`, zera
`failedLoginAttempts`/`lockedUntil` → invalida demais tokens do par → resolve
tenant/role como no login → `issueSessionToken` + `setSessionCookie` →
`login_history (success=true)` + `audit_log (user.password_set_via_token)`.

### Frontend (`apps/web`)

- `LoginPage.tsx` — adicionar checkbox "Manter conectado" (`rememberMe` no body)
  e ligar "Esqueci a senha" → `/recuperar`.
- **Página nova** `DefinirSenhaPage.tsx` (rotas públicas `/ativar` e
  `/redefinir-senha`) — lê `token` da URL, chama o endpoint de contexto para
  pré-preencher email + nome da rede, um campo de senha com `autocomplete="new-password"`
  + campo `username` oculto/readonly (`autocomplete="username"`) para o
  gerenciador salvar a credencial certa; toggle mostrar/ocultar (sem campo de
  confirmação, para manter "definir uma vez"); ao enviar → `set-password` →
  `refetch()` → `/`.
- **Página nova** `RecuperarSenhaPage.tsx` (rota pública `/recuperar`) — pede
  e-mail e chama `forgot-password` (e, opcionalmente, `login-link`); mensagem
  sempre genérica.
- `App.tsx` — registrar as rotas novas **fora** do `ProtectedShell` (públicas).

### Evento de ativação

Em `GET /api/v1/sales/summary` (`apps/api/src/routes/sales.ts`): se o requester
for tenant user (`!platformRole`) e `tenants.onboarding_completed_at IS NULL`,
fazer `UPDATE app.tenants SET onboarding_completed_at = now() WHERE id = ? AND
onboarding_completed_at IS NULL`; se `rowCount = 1`, inserir
`usage_events { event_type: 'dashboard_first_view', user_id, tenant_id }`.
Idempotente e exatamente-uma-vez por rede.

### Configuração / dependência de e-mail

- `env.ts` — adicionar `WEB_APP_URL` (base pública do SPA) para montar os links.
- **Dependência:** o envio de e-mail (provider) **não existe no repo**. Definir
  um único ponto de integração `sendAuthEmail({ to, purpose, link, name, tenantName })`.
  `reset` e `login-link` **exigem** esse transporte. A **ativação** pode ir ao ar
  antes dele via `POST /auth/activation-token` (superadmin recebe o link e entrega
  na venda assistida). A escolha do provider é decisão à parte (não reabrir aqui).

---

## Alterações necessárias

| Arquivo | Alteração |
|---------|-----------|
| `packages/db/src/schema/app.ts` | **Adiciona** enum `token_purpose` e tabela `one_time_tokens` |
| `packages/db/migrations/0010_create_one_time_tokens.sql` | **Novo** — gerado via `drizzle-kit generate` |
| `apps/api/src/routes/auth.ts` | **Adiciona** os endpoints novos; `login` aceita `rememberMe`; helpers `issueSessionToken`/`setSessionCookie` passam a aceitar `maxAge` |
| `apps/api/src/lib/one-time-tokens.ts` | **Novo** — `createOneTimeToken()`, `consumeOneTimeToken()` (geração, hash, consumo atômico) |
| `apps/api/src/lib/auth-email.ts` | **Novo** — interface `sendAuthEmail()` (stub até o provider ser decidido) |
| `apps/api/src/routes/sales.ts` | Emite `dashboard_first_view` no `/summary` (idempotente) |
| `apps/api/src/env.ts` | **Adiciona** `WEB_APP_URL` |
| `packages/db/src/seed.ts` | Provisiona owner com `passwordHash = NULL` + token de ativação (em vez de senha padrão) |
| `apps/web/src/pages/LoginPage.tsx` | "Manter conectado" + ligar "Esqueci a senha" |
| `apps/web/src/pages/DefinirSenhaPage.tsx` | **Novo** |
| `apps/web/src/pages/RecuperarSenhaPage.tsx` | **Novo** |
| `apps/web/src/App.tsx` | Rotas públicas novas |
| `docs/specs/auth-ativacao.md` | **Novo** — spec exigida pelo CLAUDE.md antes do código |

---

## O que NÃO muda

- ADR-003 (email/senha, `bcryptjs`) e ADR-012 (cookie HttpOnly + JWE) — base intacta.
- `requireTenantSession`, formato dos claims, regras de multitenancy e impersonation.
- `POST /auth/login` e `POST /auth/change-password` continuam funcionando como hoje
  (login só ganha o campo opcional `rememberMe`).
- `AUTH_SECRET` segue como única variável sensível de auth para a **sessão**.
- Nome/atributos do cookie de sessão (ADR-012/016): `SameSite=None; Secure` em prod,
  `Lax` em dev. "Manter conectado" altera só o `maxAge`.

---

## Consequências

- **Sessão persistente em JWE stateless não é revogável server-side.** Com 30 dias,
  a janela de um cookie roubado é maior e os claims (role/tenant) podem ficar
  defasados (o middleware lê do token, sem hit no banco). Mitigação: manter a
  janela limitada (≤30d) e, se no futuro for preciso revogação, migrar para a
  tabela `sessions` (hoje ociosa) — **sem reabrir o ADR-012 agora**.
- **Token em URL (links de e-mail)** pode vazar por referer/logs. Mitigação:
  uso único + TTL curto + `Referrer-Policy: no-referrer` nas páginas de token +
  não logar o token.
- **Reset e login-link dependem do transporte de e-mail**, que ainda não existe.
  A ativação é desacoplada via entrega manual do link (superadmin) no interim.
- O seed deixa de criar senha padrão — qualquer fluxo/dev que dependia de
  `admin123` precisa usar o link de ativação (ou um override explícito de dev).
- Limpeza: tokens expirados/consumidos acumulam; recomenda-se um job pg-boss
  periódico de purge (follow-up, não bloqueante).
