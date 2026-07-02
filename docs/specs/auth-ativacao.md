# SPEC — Ativação de baixo atrito (token único + email/senha)

**Versão:** 1.0
**Data:** 2026-06-29
**Status:** Pronto para implementação
**ADR base:** ADR-019 (Aceito) · não altera ADR-003 nem ADR-012

---

## 1. Visão Geral

Fluxo de **ativação de conta** e **recuperação de acesso** sobre a base email/senha
já em produção. O owner é provisionado por venda assistida com `passwordHash = NULL`
e recebe um **link único de ativação** para definir a primeira senha e cair logado.
Acessos seguintes ganham: sessão persistente (`rememberMe`), autofill correto,
reset de senha ("esqueci a senha") e login por link de e-mail.

Mecanismo central: **uma tabela** `app.one_time_tokens` (hash do token, consumo
atômico, TTL por propósito) servindo três propósitos: `activation | reset | login`.

**O que NÃO muda:** `requireTenantSession`, formato dos claims JWE, multitenancy,
impersonation, `POST /auth/login` (ganha só `rememberMe` opcional) e
`POST /auth/change-password`.

---

## 2. Escopo

### Nesta entrega
- Tabela `one_time_tokens` + enum `token_purpose` (migration `0010`).
- Núcleo `createOneTimeToken` / `consumeOneTimeToken` / preview.
- Endpoints: `set-password/context`, `set-password`, `forgot-password`,
  `login-link`, `login-link/consume`, `activation-token`; `rememberMe` no login.
- Provider de e-mail **Resend** (`sendAuthEmail`).
- Evento `dashboard_first_view` em `GET /api/v1/sales/summary`.
- Seed sem senha padrão + `SEED_DEV_PASSWORD`.
- Frontend: `LoginPage` (rememberMe + link), `DefinirSenhaPage`, `RecuperarSenhaPage`.

### Fora de escopo
- Passkeys / WebAuthn (fase 2 do ADR-019).
- Migrar `invitations`/`verification_tokens` para hash (follow-up).
- Revogação server-side de sessão (tabela `sessions` ociosa permanece).
- Job de purge de tokens expirados (follow-up, não bloqueante).

---

## 3. Mecanismo de Token

### 3.1 Tabela `app.one_time_tokens`

| Coluna | Tipo | Nota |
|--------|------|------|
| `id` | uuid PK `defaultRandom()` | — |
| `user_id` | uuid NOT NULL | FK → `users.id` `ON DELETE CASCADE` |
| `purpose` | enum `token_purpose` | `activation \| reset \| login` |
| `token_hash` | text NOT NULL UNIQUE | `sha256(raw)` em hex |
| `expires_at` | timestamptz NOT NULL | — |
| `consumed_at` | timestamptz NULL | NULL = não consumido (uso único) |
| `created_by` | uuid NULL | superadmin que emitiu; NULL = self |
| `request_ip` | text NULL | anti-abuso |
| `request_user_agent` | text NULL | — |
| `created_at` | timestamptz NOT NULL `defaultNow()` | — |

Índices: `unique(token_hash)`, `index(user_id, purpose)`, `index(expires_at)`.

### 3.2 TTL por propósito
| Propósito | TTL | Origem |
|-----------|-----|--------|
| `activation` | 72h | provisionamento / superadmin |
| `reset` | 60min | forgot-password |
| `login` | 15min | login-link |

### 3.3 Regras
- Token bruto = 32 bytes aleatórios em **base64url**; existe **apenas no link**.
  No banco grava-se só `sha256(raw)` hex.
- **Uso único** garantido por `UPDATE ... SET consumed_at = now() WHERE
  token_hash = $1 AND purpose = $2 AND consumed_at IS NULL AND expires_at > now()`
  → consome se e somente se `rowCount === 1`. À prova de replay/corrida.
- Ao (re)emitir um token, **invalidar** (consumir/expirar) os anteriores não
  consumidos do mesmo `(user_id, purpose)`.
- Preview (`context`) **nunca** consome — só lê validade + dados de exibição.

---

## 4. Endpoints (`/auth`)

| Método + path | Auth | Resumo |
|---|---|---|
| `GET /auth/set-password/context?token=` | público | preview não-consumidor |
| `POST /auth/set-password` | público (token) | consome `activation\|reset`, grava senha, loga |
| `POST /auth/forgot-password` | público | `{email}` → token `reset` + e-mail (sempre 200) |
| `POST /auth/login-link` | público | `{email}` → token `login` + e-mail (sempre 200) |
| `GET /auth/login-link/consume?token=` | público (token) | consome `login`, emite sessão |
| `POST /auth/activation-token` | superadmin | (re)emite link de ativação, **retorna o link** |
| `POST /auth/login` | público | ganha `rememberMe?: boolean` |

### 4.1 `GET /auth/set-password/context?token=`
- `200: { valid: true, email, name, tenantName, purpose }` (purpose `activation|reset`).
- `200: { valid: false }` para token inexistente/expirado/consumido (genérico, sem 4xx,
  para a tela renderizar estado neutro). Não consome.

### 4.2 `POST /auth/set-password`
```
Body: { token: string, password: string }   // password ≥ 8
200:  { user: { id, name, email, role, platformRole, tenantId, locationId } } + Set-Cookie
400:  { error: "token e password são obrigatórios" } | senha < 8
410:  { error: "Link expirado ou já utilizado" }   // genérico p/ qualquer falha de token
```
**Handler:** hash do token → consumo atômico (`activation` ou `reset`; rowCount=1 senão 410)
→ `bcrypt.hash(password, 12)` → `users.set({ passwordHash, passwordChangedAt: now,
active: true, failedLoginAttempts: 0, lockedUntil: null })` → invalida demais tokens do par
→ resolve tenant/role/locationId (mesma lógica do login) → `issueSessionToken(claims, maxAge)`
+ `setSessionCookie(reply, token, maxAge)` → `login_history(success=true)` +
`audit_log(action='user.password_set_via_token')`. Usa `maxAge` padrão (8h).

### 4.3 `POST /auth/forgot-password` e `POST /auth/login-link`
```
Body: { email: string }
200:  { ok: true }   // SEMPRE, exista ou não o e-mail (anti-enumeração)
```
Se o usuário existe e está `active`: emite token (`reset`/`login`) gravando `request_ip`
+ `request_user_agent` e chama `sendAuthEmail`. Se não existe: no-op silencioso.

### 4.4 `GET /auth/login-link/consume?token=`
Consome token `login` (rowCount=1 senão 410) → emite sessão (`maxAge` padrão 8h) →
`302` redirect para `WEB_APP_URL` (`/`). Em falha: redirect para `/recuperar?erro=link`.

### 4.5 `POST /auth/activation-token` (superadmin)
```
Body: { userId: string }
200:  { link: string, expiresAt: string }
```
`preHandler: requireTenantSession` + checagem `req.platformRole === 'superadmin'`
(senão 403). Emite/reemite token `activation`, monta `${WEB_APP_URL}/ativar?token=<raw>`,
retorna o link (entrega manual na venda assistida). `created_by = req.userId`.

### 4.6 `POST /auth/login` — `rememberMe`
Body ganha `rememberMe?: boolean` opcional. Se `true`, `maxAge = 30d`; senão `8h`.
Aplica em `issueSessionToken` (TTL do JWE) **e** `setSessionCookie` (TTL do cookie).
Nenhuma outra mudança no fluxo.

### 4.7 Refactor de helpers
- `issueSessionToken(claims, maxAge = SESSION_MAX_AGE)`.
- `setSessionCookie(reply, token, maxAge = SESSION_MAX_AGE)`.
- Constantes: `SESSION_MAX_AGE = 8*60*60`, `REMEMBER_ME_MAX_AGE = 30*24*60*60`.

---

## 5. Evento de Ativação `dashboard_first_view`

Em `GET /api/v1/sales/summary` (`apps/api/src/routes/sales.ts`): após autenticação,
se `!req.platformRole` (tenant user real, não impersonação) e o tenant ainda não
ativou:
```sql
UPDATE app.tenants SET onboarding_completed_at = now()
WHERE id = :tenantId AND onboarding_completed_at IS NULL
```
Se `rowCount === 1` → `INSERT app.usage_events { event_type:'dashboard_first_view',
user_id, tenant_id }`. Idempotente, **exatamente-uma-vez por tenant**, server-side,
não disparável por cliente nem por impersonação de platform user.

---

## 6. E-mail (Resend)

- Dependência nova: `resend`. Env: `RESEND_API_KEY`, `WEB_APP_URL`.
- `apps/api/src/lib/auth-email.ts`: `sendAuthEmail({ to, purpose, link, name, tenantName })`
  — ponto único. Templates pt-BR para `activation`, `reset`, `login`.
- Se `RESEND_API_KEY` ausente em dev: logar o link no console em vez de enviar (no-op
  gracioso), para não bloquear desenvolvimento.

---

## 7. Seed

- Owner provisionado com `passwordHash = NULL` + `createOneTimeToken(activation)`;
  imprimir `${WEB_APP_URL}/ativar?token=<raw>` no console.
- Env `SEED_DEV_PASSWORD`: se setado, criar senha bcrypt direta (atalho dev/local).
- Remover o default `admin123`.

---

## 8. Frontend (`apps/web`)

- `LoginPage.tsx`: checkbox "Manter conectado" (envia `rememberMe`) + "Esqueci a senha"
  → `/recuperar`.
- `DefinirSenhaPage.tsx` (rotas públicas `/ativar` e `/redefinir-senha`): lê `token`,
  chama `set-password/context` p/ pré-preencher email + rede; um campo senha
  `autocomplete="new-password"` + `username` oculto (`autocomplete="username"`);
  toggle mostrar/ocultar; **sem** confirmação; submit → `set-password` → `refetch()` → `/`.
  Estado neutro se `valid:false`.
- `RecuperarSenhaPage.tsx` (rota pública `/recuperar`): pede e-mail → `forgot-password`;
  mensagem **sempre genérica** ("Se houver conta, enviaremos um link").
- `App.tsx`: rotas públicas **fora** do `ProtectedShell`. Páginas de token enviam
  `Referrer-Policy: no-referrer`.

---

## 9. Segurança (checklist QA)

- [ ] Token nunca em texto puro no banco (só `sha256` hex).
- [ ] Consumo atômico: token reutilizado → 410 genérico.
- [ ] `forgot-password`/`login-link` sempre 200 (anti-enumeração).
- [ ] `set-password` 410 genérico para inexistente/expirado/consumido.
- [ ] TTLs corretos por propósito (72h / 60min / 15min).
- [ ] `set-password`/`activation-token` respeitam tenant; superadmin-only em activation-token.
- [ ] `dashboard_first_view` não dispara em impersonação; uma vez por tenant.
- [ ] `rememberMe` altera só `maxAge`; claims e `requireTenantSession` intactos.
- [ ] Token não logado; `Referrer-Policy: no-referrer` nas páginas de token.

---

## 10. Verificação end-to-end

Ver seção "Verificação" do plano de implementação (ADR-019 / plano aprovado).
