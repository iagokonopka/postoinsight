# Mapa de Telas — PostoInsight

> Este documento define a estrutura de navegação completa do frontend.
> O Claude Design deve usar este arquivo como referência única para saber quais telas existem, o que cada uma mostra e como navegam entre si.
> Para o conteúdo detalhado de cada tela (KPIs, endpoints, regras), consultar as specs em `docs/specs/`.

---

## 1. Estrutura de Navegação

```
/login                          ← Pública
/                               ← Redireciona para /dashboard
/dashboard                      ← Dashboard de Vendas (tela principal)
/combustivel                    ← Dashboard de Combustível (apenas combustíveis, sem Arla)
/arla                           ← Dashboard de Arla 32 (novo)
/lubrificantes                  ← Dashboard de Lubrificantes (novo)
/conveniencia                   ← Dashboard de Conveniência (apenas loja, sem lubrificantes)
/dre                            ← DRE Mensal
/sync                           ← Status de Sincronização
/settings                       ← Configurações
  /settings/profile             ← Perfil do usuário
  /settings/locations           ← Gerenciar unidades (owner)
  /settings/users               ← Gerenciar usuários do tenant (owner)
  /settings/integrations        ← Conectores e ERP (owner)
```

> Área de superadmin (`/admin/*`) é separada — fora do escopo desta fase.

---

## 2. Layout Principal

Todas as telas autenticadas compartilham o mesmo shell:

```
┌──────────────────────────────────────────────────────────┐
│  SIDEBAR (fixa, 240px)          │  CONTEÚDO PRINCIPAL    │
│                                 │                        │
│  [Logo / APP_NAME]              │  [Breadcrumb]          │
│                                 │  [Título da página]    │
│  ── Análise ──                  │                        │
│  > Visão Geral                  │  [Conteúdo da rota]    │
│    Combustível                  │                        │
│    Arla 32                      │                        │
│    Lubrificantes                │                        │
│    Conveniência                 │                        │
│    DRE Mensal                   │                        │
│                                 │                        │
│  ── Operação ──                 │                        │
│    Sincronização                │                        │
│                                 │                        │
│  ── ────────── ──               │                        │
│    Configurações                │                        │
│                                 │                        │
│  [Avatar + nome do usuário]     │                        │
│  [Tenant ativo]                 │                        │
└──────────────────────────────────────────────────────────┘
```

**Header global (dentro do conteúdo principal):**
- Seletor de location (todas ou individual) — persiste entre telas
- Indicador de última sync (`synced_at` — ícone + timestamp)
- Botão "Sincronizar agora"
- Toggle dark/light mode
- Menu do usuário (perfil, logout)

---

## 3. Telas

### 3.1 Login — `/login`

**Objetivo:** autenticar o usuário.

**Elementos:**
- Logo / APP_NAME
- Campo e-mail
- Campo senha
- Botão "Entrar"
- Link "Esqueci minha senha" (pós-MVP)

**Comportamento:**
- Após login: redireciona para `/dashboard`
- Autenticação via `POST /auth/login` → cookie HttpOnly JWE gerenciado pelo Fastify

---

### 3.2 Dashboard de Vendas — `/dashboard`

**Objetivo:** visão geral da operação — a pergunta que o gestor faz toda manhã.

**Spec detalhada:** `docs/specs/dashboard-vendas.md`

**Elementos:**
- Seletor de período (Hoje / Esta semana / Este mês / Mês anterior / Personalizado)
- Seletor de location (herdado do header)
- 5 KPI cards: Receita Bruta, CMV, Margem Bruta, Margem %, Qtd Itens
- Gráfico de evolução temporal (linha/barra) — granularidade: dia / semana / mês
- Breakdown por segmento (Combustível, Lubrificantes, Serviços, Conveniência) com barras de participação
- Drill-down de grupos ao clicar em um segmento (expande inline, não modal)
- Banner de aviso se dados ainda em sincronização (backfill pendente)

**Navegação:**
- Clicar em "Combustível" no breakdown → pode navegar para `/combustivel` (link, não drill-down)
- Clicar em "Conveniência" → pode navegar para `/conveniencia`

---

### 3.3 Dashboard de Combustível — `/combustivel`

**Objetivo:** análise detalhada das vendas de combustível por produto/bico.

**Spec detalhada:** `docs/specs/dashboard-combustivel.md`

**Escopo:** apenas combustíveis — Gasolina Comum, Gasolina Aditivada, Diesel S10, Diesel S500, Etanol. Arla 32 tem página própria em `/arla`.

**Elementos:**
- Seletor de período + location (herdado)
- KPI cards: Volume Total (litros), Receita Bruta, CMV, Margem Bruta, Margem %
- Breakdown por produto (Gasolina Comum, Gasolina Aditivada, Diesel S10, Diesel S500, Etanol)
- Evolução de volume por produto (gráfico de área empilhada ou linhas)
- Tabela por bico/bomba (se disponível no ERP)

---

### 3.4 Dashboard de Arla 32 — `/arla`

**Objetivo:** análise dedicada das vendas de Arla 32.

**Spec detalhada:** `docs/specs/dashboard-arla.md` ← a ser criada

**Endpoints:**
- `GET /api/v1/arla/resumo`
- `GET /api/v1/arla/evolucao`
- `GET /api/v1/arla/produtos`

**Elementos:**
- Seletor de período + location (herdado)
- KPI cards: Volume Total (litros), Receita Bruta, CMV, Margem Bruta, Margem %
- Gráfico de evolução de volume e receita no período
- Tabela de breakdown por produto Arla (caso haja mais de um SKU)

---

### 3.5 Dashboard de Lubrificantes — `/lubrificantes`

**Objetivo:** análise dedicada das vendas de lubrificantes, filtros, fluidos e acessórios.

**Spec detalhada:** `docs/specs/dashboard-lubrificantes.md` ← a ser criada

**Endpoints:**
- `GET /api/v1/lubrificantes/resumo`
- `GET /api/v1/lubrificantes/evolucao`
- `GET /api/v1/lubrificantes/grupos`

**Elementos:**
- Seletor de período + location (herdado)
- KPI cards: Receita Bruta, CMV, Margem Bruta, Margem %, Qtd Itens
- Gráfico de evolução de receita e margem no período
- Breakdown por grupo (Lubrificantes, Filtros, Fluidos e Aditivos, Acessórios)
- Ranking de top produtos por receita

---

### 3.6 Dashboard de Conveniência — `/conveniencia`

**Objetivo:** análise da loja de conveniência — top produtos, grupos, giro.

**Spec detalhada:** `docs/specs/dashboard-conveniencia.md`

**Escopo:** apenas loja de conveniência — Alimentos, Bebidas, Tabacaria, Embalagens, Lanchonete, etc. Lubrificantes têm página própria em `/lubrificantes`.

**Elementos:**
- Seletor de período + location (herdado)
- KPI cards: Receita Bruta, CMV, Margem Bruta, Margem %, Qtd Itens Vendidos
- Breakdown por grupo (Alimentos, Bebidas, Tabacaria, Embalagens, Lanchonete, etc.)
- Ranking de top produtos (tabela com receita, margem, quantidade)
- Evolução temporal de receita da conveniência

---

### 3.7 DRE Mensal — `/dre`

**Objetivo:** demonstração de resultado estruturada por mês.

**Spec detalhada:** `docs/specs/dre-mensal.md`

**Elementos:**
- Seletor de mês/ano (dropdown único — não range)
- Seletor de location (herdado)
- Tabela DRE estruturada:
  ```
  Receita Bruta
  (–) Descontos
  = Receita Líquida
  (–) CMV
  = Margem Bruta
      Margem Bruta %
  ```
- Coluna por segmento + coluna total consolidado
- Comparativo com mês anterior (delta em % e valor absoluto)
- Botão exportar PDF / Excel (pós-MVP — renderizar placeholder desabilitado)

---

### 3.8 Sincronização — `/sync`

**Objetivo:** monitorar a saúde da conexão e o histórico de syncs.

**Spec detalhada:** `docs/specs/sync-status.md`

**Elementos:**

**Status atual (por location):**
- Card por location com:
  - Nome da location
  - Status do conector (Online / Offline / Sem dados há X horas)
  - Data/hora da última sync bem-sucedida
  - Próxima sync agendada
  - Botão "Sincronizar agora" (individual por location)

**Histórico de syncs:**
- Tabela com colunas: Location, Início, Fim, Duração, Registros importados, Status (Success / Failed / Running)
- Paginação (20 por página)
- Filtro por location e por status
- Ao clicar em uma linha com erro → expande mensagem de erro

**Painel de backfill:**
- Visível enquanto `backfill_completed_at IS NULL`
- Progresso estimado ou indicador de "em andamento"
- Desaparece após backfill concluído

---

### 3.9 Configurações — `/settings`

**Objetivo:** gerenciar perfil, usuários, unidades e integrações do tenant.

Redireciona para `/settings/profile` por padrão.

---

#### 3.9.1 Perfil — `/settings/profile`

**Acesso:** todos os roles

**Elementos:**
- Nome completo
- E-mail (somente leitura)
- Alterar senha
- Preferência de tema (light / dark / sistema)
- Botão salvar

---

#### 3.9.2 Unidades — `/settings/locations`

**Acesso:** `owner` apenas

**Elementos:**
- Lista de locations do tenant (nome, ERP conectado, status)
- Nenhuma edição no MVP — somente visualização
- Placeholder para futura ação de adicionar location

---

#### 3.9.3 Usuários — `/settings/users`

**Acesso:** `owner` apenas

**Elementos:**
- Lista de usuários do tenant (nome, e-mail, role, locations com acesso)
- Botão convidar usuário (pós-MVP — renderizar desabilitado com tooltip "Em breve")
- Alterar role de usuário existente (pós-MVP — idem)

---

#### 3.9.4 Integrações — `/settings/integrations`

**Acesso:** `owner` apenas

**Elementos:**
- Lista de conectores por location (ERP, status, última sync)
- Nenhuma edição no MVP — somente visualização
- Placeholder para futura configuração de novo conector

---

## 4. Estados Globais

Toda tela deve tratar os seguintes estados:

| Estado | Como mostrar |
|--------|-------------|
| Carregando dados | Skeleton nos cards e tabelas — nunca spinner de página inteira |
| Sem dados no período | Ilustração + mensagem ("Nenhuma venda registrada neste período") |
| Backfill em andamento | Banner amarelo no topo da tela de análise |
| Conector offline | Badge vermelho no header + detalhe em `/sync` |
| Erro de API | Toast de erro (não quebra a página) |
| Sessão expirada | Redireciona para `/login` preservando a URL de retorno |

---

## 5. Roles e Visibilidade

| Tela | owner | manager | viewer |
|------|-------|---------|--------|
| Dashboard de Vendas | ✅ (todas locations) | ✅ (só sua location) | ✅ (configurável) |
| Dashboard Combustível | ✅ | ✅ | ✅ |
| Dashboard Arla 32 | ✅ | ✅ | ✅ |
| Dashboard Lubrificantes | ✅ | ✅ | ✅ |
| Dashboard Conveniência | ✅ | ✅ | ✅ |
| DRE Mensal | ✅ | ❌ | ❌ |
| Sincronização | ✅ (leitura + ação) | ✅ (leitura) | ❌ |
| Settings > Perfil | ✅ | ✅ | ✅ |
| Settings > Unidades | ✅ | ❌ | ❌ |
| Settings > Usuários | ✅ | ❌ | ❌ |
| Settings > Integrações | ✅ | ❌ | ❌ |

---

## 6. Rotas SPA (React Router v6)

```
/                           → redireciona para /dashboard
/login
/dashboard
/combustivel
/arla
/lubrificantes
/conveniencia
/dre
/sync
/settings                   → redireciona para /settings/profile
/settings/profile
/settings/locations
/settings/users
/settings/integrations
```

Todas as rotas exceto `/login` são protegidas por um componente `PrivateRoute` que chama `GET /auth/me`. Se a sessão não existir ou estiver expirada, redireciona para `/login` preservando a URL de retorno.

---

*Última atualização: 2026-05-18*
