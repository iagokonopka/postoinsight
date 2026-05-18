# PostoInsight — Product Requirements Document

> Versão 1.4 · 2026-05-17
> Atualizado para refletir o estado atual do protótipo HTML interativo (PostoInsight.html).

---

## 1. Visão Geral do Produto

O PostoInsight é uma plataforma SaaS de Business Intelligence para redes multi-unidade. O produto inicia com foco em redes de postos de combustível, mas é projetado com nomenclatura e arquitetura neutras de domínio — permitindo expansão para qualquer segmento sem reescrita.

O cliente é o **dono ou gestor da rede** — não a unidade individualmente. A plataforma oferece visibilidade consolidada de toda a operação, com a capacidade de aprofundar a análise por unidade, período, categoria e produto.

---

## 2. Problema que o Produto Resolve

### 2.1 Situação Atual

- Exportação manual dos ERPs em Excel, posto a posto
- Consolidação artesanal de planilhas
- KPIs sem padronização
- BIs genéricos que não conhecem a linguagem de postos

### 2.2 A Pergunta-Chave

Em menos de 30 segundos pela manhã: *"Como estão minhas vendas hoje, nesta semana e neste mês — por posto, categoria, produto?"*

---

## 3. Roles e Permissões

| Perfil | Quem é | Escopo |
|--------|--------|--------|
| `superadmin` | Equipe PostoInsight | Todos os tenants |
| `support` | Suporte técnico | Todos os tenants (read-only) |
| `owner` | Proprietário da rede | Todas as locations do tenant |
| `manager` | Gerente da unidade | Somente a sua location |
| `viewer` | Consultor externo (ex: WM) | Configurável por tenant |

---

## 4. Estado do Protótipo (PostoInsight.html)

### 4.1 Shell da aplicação

- **Sidebar escura** (240px) com gradient logo + tenant card no rodapé
- **Navegação em duas seções**: Análise (Visão Geral, Combustível, Conveniência, DRE Mensal) e Operação (Sincronização, Configurações). A seção Operação fica fixada na base via `margin-top: auto`
- **Topbar** com:
  - Segmented control de período: **[ Hoje · Semana · Mês · Mês ant. ]** (oculto em Sincronização/Configurações/DRE)
  - Na aba DRE Mensal o segmented vira **toolbar de mês/ano**: `[ ‹ · Select Mês · Select Ano · › ]`
  - Select de location (Todas as unidades / JAM Centro / Rodovia / Norte / Sul)
  - Botão **Sincronizar** com feedback de spinner + toast
  - Avatar do usuário (gradient)

### 4.2 Visão Geral

- **5 KPI cards**: Receita Bruta, CMV, Margem Bruta, Margem %, Itens vendidos
  - Cada card: valor grande + 2 deltas (`vs mês ant.` e `vs ano ant.`) com setas coloridas + **sparkline SVG** ocupando o card de borda a borda (toggle via tweak)
- **Gráfico "Evolução de Receita & Margem"**:
  - **Receita Bruta** — curva azul com gradient fill (50% top → 6% base)
  - **Margem Bruta** — curva verde com gradient fill, desenhada na frente
  - **Margem %** — linha **tracejada laranja** no eixo direito, **desativada por padrão** (toggle pela legenda)
  - Eixo direito (`y2`) com `display: 'auto'` — só aparece quando a série é ativada
- **Donut Mix por Segmento** com legenda em grid 2-col e total no centro
- **Tabela "Breakdown por Segmento"**:
  - Categorias com seg-dot colorido, barra de peso, Receita, CMV, Margem, Margem %, linha TOTAL
  - **Cada linha é clicável** → abre o **drawer lateral** com composição + receita por unidade
- **Top 10 produtos** com sort toggle (Receita / Margem %), badge de categoria, barra de peso
- **Heatmap semanal** (4 semanas × 7 dias) com legenda gradiente

### 4.3 Combustível

- Cabeçalho com **2 segmented controls**:
  - **[ Volume · Receita ]** — modo (afeta gráfico e donut)
  - **[ Sem Arla 32 · Com Arla 32 ]** — inclui/exclui Arla 32
- 5 KPI cards (Volume Total, Receita, CMV, Margem Bruta, Margem %)
- **Linha row-3-2**:
  - **Evolução por produto** — sempre área empilhada com gradient (Linha foi removido) — Gasolina Comum, Diesel S-10, Aditivada, Etanol, Diesel S-500 (+ Arla 32 opcional)
  - **Donut Mix de Combustível** — % por produto, métrica acompanha o modo (Volume L ou Receita R$)
- **Tabela "Breakdown por produto"** com colunas Volume, Part. %, Receita, Margem %, Preço/L, Custo/L e **sparkline SVG de tendência 14d** + seta colorida
- Placeholder "Ranking de Bicos" (feature futura)

### 4.4 Conveniência & Serviços

- Cabeçalho com segmented de **4 opções**:
  - **Todos** — view combinada (default)
  - **Conveniência** — BEB / TAB / LAN / CV
  - **Serviços** — só serviços (lavagem, troca de óleo)
  - **Lubrificantes** — categoria isolada
- 4 KPI cards (Receita / Margem Bruta / Margem % / Ticket Médio) com labels adaptáveis
- **Gráfico Receita × Margem Bruta** com gradient fill (laranja + verde)
- **Donut Mix da Loja**:
  - Em Todos/Conveniência: mostra **categorias** agregadas
  - Em Serviços/Lubrificantes: muda para mostrar **produtos da categoria** (Troca de Óleo + Lavagem, etc.) — evita redundância de mostrar 1 fatia só
- **Matriz de Categorias** (Scatter w/ quadrantes): Estrelas / Volume / Caixa / Questionáveis — bolha proporcional à receita, linhas medianas
- **Tabela "Breakdown por categoria"** clicável → drawer com a lista de produtos da categoria (sem mini-cards de Receita/Margem, só os produtos)

### 4.5 DRE Mensal

- Toolbar de **mês + ano** no topbar (substitui o período)
- 4 KPI cards (Receita Bruta, CMV, Margem Bruta, Margem %)
- **Waterfall do mês** — barras stacked com `maxBarThickness: 28` (mesma do gráfico da Visão Geral):
  - Receita Bruta (azul) → (−) Descontos (vermelho) → (−) CMV (vermelho) → Margem Bruta (verde)
  - `minBarLength: 10` garante visibilidade do Descontos (~1.8% da receita)
- **Margem % — últimos 6 meses** — multi-linha por segmento (Combustível, Conveniência, Lubrificantes, Serviços)
- **Tabela "Detalhamento mês a mês"** — 6 meses + δ + YTD, com linhas hierárquicas e linha "Margem Bruta" destacada em verde

### 4.6 Sincronização

- 2 cards de status: Status ERP (conectado, agente RDP v2.4.1) e WebPosto ERP (aguardando contrato)
- Indicador com pulse animation pro status OK
- **Histórico de execuções** — 8 últimas syncs com timestamp, location, badge e nº de registros
- Botão "Sincronizar agora" com feedback de progresso (~1.8s + toast)

### 4.7 Configurações

- 2 cards (Tenant + Integração Status ERP)
- Lista de **Locations** (4 unidades JAM com CD_ESTAB, bombas, ilhas)
- Lista de **Usuários** com role badges (owner, manager, viewer)

---

## 5. Tweaks Panel

Painel flutuante no canto inferior direito do preview:

| Tweak | Opções |
|-------|--------|
| Tema | Claro / Escuro |
| Densidade | Confortável / Compacta |
| Cor de marca | 4 swatches (azul, indigo, esmerald, rose) |
| Sparklines nos KPIs | toggle on/off |
| Estilo dos gráficos | Suave / Plano / Tracejado |
| Atalhos | Ir para DRE · Simular sincronização |

Defaults persistidos em bloco JSON `/*EDITMODE-BEGIN*/{...}/*EDITMODE-END*/` no próprio HTML, reescrito em disco a cada alteração.

---

## 6. Drill-down Drawer

Drawer lateral de 420px que entra com easing `cubic-bezier(0.16, 1, 0.3, 1)` em 220ms.

- **Visão Geral · Breakdown por Segmento** → composição interna + receita por unidade
- **Conveniência · Breakdown por categoria** → lista de produtos da categoria com barra de participação relativa, qtd e tendência 14d (sem mini-cards de KPI no topo)

---

## 7. Fora do Escopo do MVP

| Funcionalidade | Motivo |
|---------------|--------|
| Lançamento manual de despesas | Complexidade fora do MVP |
| Alertas automáticos | Depende de KPIs de referência |
| IA em linguagem natural | Roadmap futuro |
| Multi-ERP por rede | Validar demanda |
| App mobile nativo | Web responsivo basta |
| Integração NF-e / fornecedores | Fora do escopo de dados |
| Self-service de onboarding | Manual no MVP |
| Views trimestral/semestral/anual no DRE | Testado e removido — feature futura |
| Export Excel/PDF | Botão placeholder na Visão Geral |

---

## 8. Fontes de Dados

### 8.1 Status ERP
Agente Node→.exe no RDP do cliente, SELECT read-only nas views BI do SQL Server (`TMPBI_VENDA_DETALHADA` traz `CUSTO_UNIT`). Extração incremental por watermark.

### 8.2 WebPosto ERP
API REST (Quality Automação). Conector roda no servidor PostoInsight — sem instalação no cliente.

---

## 9. Modelo de Dados — Visão de Negócio

### 9.1 Hierarquia de Produtos (3 níveis)

| Nível | Nome canônico | Exemplos |
|-------|--------------|---------|
| 1 | Categoria | Combustível (CB), Bebidas (BEB), Tabacaria (TAB) |
| 2 | Grupo | Gasolina, Diesel, Cerveja, Cigarro |
| 3 | Subgrupo | Gasolina Comum, Diesel S-10 |

### 9.2 Identificação de Combustível

`categoria_codigo IN ('CB', 'ARL')`. `bico_codigo` é metadado — não é critério de classificação.

### 9.3 DRE

| Linha | Cálculo | Fonte |
|-------|---------|-------|
| Receita Bruta | Σ vlr_total | fato_venda |
| (−) Descontos | Σ desconto_total | fato_venda |
| = Receita Líquida | Receita Bruta − Descontos | Calculado |
| (−) CMV | Σ (custo_unitario × qtd_venda) | fato_venda |
| = Margem Bruta | Receita Líquida − CMV | Calculado |

---

## 10. Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Frontend (prod) | Next.js + TypeScript + Recharts |
| Frontend (protótipo) | HTML estático + Chart.js 4 + SVG hand-rolled (sparklines) + React/Babel inline (Tweaks panel) |
| Backend | Fastify + TypeScript |
| ORM | Drizzle |
| Jobs | pg-boss |
| Auth | Auth.js |
| DB | PostgreSQL (schemas: app, raw, canonical, analytics) |
| Agente | Node → .exe via pkg |
| Ambiente local | WSL + Docker Compose |
| Produção MVP | Railway |

---

## 11. Estado de Implementação (2026-05-17)

| # | Etapa | Status |
|---|-------|--------|
| 01 | Base documental | ✅ Concluído |
| 02–05 | Arquitetura, canonical model, ADRs, DDL | ✅ Concluído |
| 06 | Specs de feature | ✅ 5 specs completas |
| 07 | packages/db — schema + migrations | ✅ Em produção |
| 08 | apps/agent — extração + WebSocket | ✅ Em produção (Rede JAM, 4 locations) |
| 09 | apps/api — server + pipeline workers | ✅ Em produção (Railway) |
| 10 | POST /admin/backfill | ✅ Implementado |
| 11 | Worker no Railway (segundo serviço) | ❌ Próxima tarefa |
| 12 | Backfill real + verificação em canonical.fato_venda | ❌ Aguardando worker |
| 13 | **Protótipo HTML (PostoInsight.html)** | ✅ **Concluído — 6 abas funcionais, tweakable** |
| 14 | apps/web — frontend Next.js | ❌ Não iniciado (protótipo serve de referência visual) |

---

*— fim do documento —*
