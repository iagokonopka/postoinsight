# PostoInsight — Product Requirements Document

> Versão 1.0 · 2025

---

## 1. Visão Geral do Produto

O PostoInsight é uma plataforma SaaS de Business Intelligence desenvolvida especificamente para redes de postos de combustível. O produto centraliza dados operacionais provenientes dos ERPs utilizados pelos postos, transforma esses dados em um modelo analítico consistente e os apresenta através de dashboards e relatórios que permitem decisões rápidas e fundamentadas.

O cliente do PostoInsight é o dono ou gestor da rede — não o posto individualmente. A plataforma oferece visibilidade consolidada de toda a operação, com a capacidade de aprofundar a análise por posto, período, categoria e produto.

---

## 2. Problema que o Produto Resolve

### 2.1 Situação Atual

Donos e gestores de redes de postos não têm visibilidade consolidada da operação. Hoje, o processo típico de análise consiste em:

- Exportar dados dos ERPs em formato Excel, manualmente, por posto
- Consolidar múltiplas planilhas para construir uma visão geral
- Montar KPIs artesanalmente, sem padronização entre postos
- Utilizar BIs genéricos que não conhecem a linguagem do negócio de postos

### 2.2 Consequências

- Análise lenta e sujeita a erros humanos
- Impossibilidade de comparar postos em tempo real
- Dificuldade em identificar problemas operacionais rapidamente
- DRE montado de forma manual e trabalhosa
- Decisões baseadas em intuição, não em dados

### 2.3 A Pergunta que o Produto Responde

Quando um gestor abre o PostoInsight pela manhã, ele precisa responder em menos de 30 segundos:

> *Como estão minhas vendas hoje, nesta semana e neste mês — por posto, por categoria, por produto?*

---

## 3. Usuários e Perfis de Acesso

| Perfil | Quem é | O que acessa | Escopo de dados |
|--------|--------|--------------|-----------------|
| Dono da rede | Proprietário ou sócio da rede de postos | Visão consolidada de todos os postos, DRE da rede | Todos os postos do tenant |
| Gestor de posto | Gerente responsável por uma unidade específica | Dados operacionais do seu posto, análises de vendas | Somente o seu posto |
| Consultor externo | Consultor que presta serviços à rede (ex: WM) | Acesso configurável conforme contrato com a rede | Configurável por tenant |

**Observações:**

- O consultor externo acessa o sistema para realizar análises junto ao cliente, presencialmente ou remotamente
- Cada tenant (rede) gerencia seus próprios usuários e permissões
- Um usuário pode ter perfis diferentes em tenants diferentes

---

## 4. Capacidades do Produto — MVP

### 4.1 Sincronização de Dados

- Sincronização agendada: execução diária automática, em horário de baixo movimento
- Sincronização on-demand: botão disponível na interface para o cliente iniciar uma sync manualmente
- Indicação visual do status da última sincronização e horário
- Suporte inicial a dois ERPs: Status (via agente RDP) e WebPosto (via API REST)

### 4.2 Visão Geral de Vendas

- Painel principal com totais de vendas do período selecionado
- Filtros por: período (dia, semana, mês, intervalo customizado) e posto da rede
- Breakdown de vendas por segmento: Combustível / Lubrificantes / Conveniência
- Análise por grupo e subgrupo de produtos
- Evolução temporal das vendas (gráfico de linha ou barra por período)

### 4.3 Análise de Vendas por Categoria

- Combustível: volume vendido por bico, receita, margem
- Lubrificantes: receita, custo, margem bruta
- Conveniência: receita por grupo, produtos mais vendidos, margem
- Comparativo entre postos da rede

### 4.4 DRE Mensal

- Demonstrativo de Resultado por mês, por posto ou consolidado da rede
- Estrutura: Receita Bruta → Descontos → Receita Líquida → CMV → Margem Bruta
- Filtros por mês, período e posto
- Possibilidade de navegar entre meses e comparar períodos

### 4.5 Exportação

- Exportação de análises em formato Excel ou PDF
- Escopo inicial: tabelas de vendas e DRE

---

## 5. Fora do Escopo do MVP

| Funcionalidade | Motivo da exclusão |
|---------------|-------------------|
| Lançamento manual de despesas operacionais | Requer interface de entrada de dados e nova fonte — complexidade fora do MVP |
| Alertas e notificações automáticas | Depende de definição de KPIs de referência — fase futura |
| Perguntas em linguagem natural (IA) | Feature estratégica de diferenciação — roadmap futuro |
| Multi-ERP por rede (postos com ERPs mistos) | Complexidade de mapeamento — validar demanda primeiro |
| App mobile nativo | Web responsivo é suficiente para o MVP |
| Integração com fornecedores / NF-e | Fora do escopo de dados atual |

---

## 6. Fontes de Dados

### 6.1 Status ERP

- Acesso via agente instalado no servidor RDP do cliente
- Extração por leitura direta (SELECT read-only) em views de BI do SQL Server
- Custo unitário já embutido na view `TMPBI_VENDA_DETALHADA` (campo `CUSTO_UNIT`)
- Estratégia de extração: incremental por watermark (data de emissão)

### 6.2 WebPosto ERP

- Acesso via API REST (Quality Automação)
- Conector rodando no servidor PostoInsight — sem instalação no cliente
- Dados equivalentes ao Status: vendas, abastecimentos, produtos
- Mesma estratégia de extração incremental

---

## 7. Modelo de Dados — Visão de Negócio

### 7.1 Hierarquia de Produtos

O PostoInsight adota um modelo canônico de três níveis para classificação de produtos, independente do ERP de origem:

| Nível | Nome canônico | Exemplos |
|-------|--------------|---------|
| 1 | Categoria | Combustível (CB), Bebidas (BEB), Tabacaria (TAB) |
| 2 | Grupo | Gasolina, Diesel, Cerveja, Cigarro |
| 3 | Subgrupo | Gasolina Comum, Gasolina Aditivada, Diesel S-10 |

### 7.2 Identificação de Combustível

Um item de venda é classificado como combustível quando possui `bico_codigo` preenchido. Vendas de loja convencional têm `bico_codigo` nulo. Essa distinção é fundamental para separar os segmentos no DRE e nos dashboards.

### 7.3 Estrutura do DRE

| Linha | Cálculo | Fonte |
|-------|---------|-------|
| Receita Bruta | Σ vlr_total por período | fato_venda |
| (−) Descontos | Σ desconto_total | fato_venda |
| = Receita Líquida | Receita Bruta − Descontos | Calculado |
| (−) CMV | Σ (custo_unitario × qtd_venda) | fato_venda |
| = Margem Bruta | Receita Líquida − CMV | Calculado |

---

## 8. Onboarding de Clientes

### 8.1 Modelo de entrega — Status ERP

O onboarding de um cliente Status é realizado pela equipe PostoInsight. O cliente fornece acesso ao banco — a equipe faz o restante.

**O que coletar do cliente:**

| Informação | Descrição |
|-----------|-----------|
| Nome da rede | Ex: "Rede JAM" |
| Nome de cada posto | Ex: "JAM Centro", "JAM Rodovia" |
| String de conexão ODBC | Host, porta, database, usuário read-only, senha |

Os `CD_ESTAB` (identificadores de cada posto no Status) são obtidos diretamente via SELECT na view `TMPBI_VENDA_DETALHADA` usando o acesso fornecido — não precisam ser informados pelo cliente.

**O que a equipe PostoInsight executa:**
1. Seed script cria tenant, postos, conector e usuário admin no banco
2. Agente `.exe` instalado no servidor RDP do cliente
3. Primeira sync disparada manualmente para validar o fluxo completo
4. Cliente recebe link de acesso com o usuário admin criado

### 8.2 Escopo do MVP de onboarding

No MVP o onboarding é manual — sem tela de self-service. O processo é executado pela equipe PostoInsight a cada novo cliente.

Self-service de onboarding é feature futura, a implementar quando o volume de clientes justificar.

---

## 9. Critérios de Sucesso do MVP

| Critério | Métrica | Meta |
|----------|---------|------|
| Sincronização funcional | Dados do ERP chegam ao dashboard sem intervenção manual | 100% das syncs programadas bem-sucedidas |
| Performance dos dashboards | Tempo de carregamento das views analíticas | < 3 segundos para consultas do período atual |
| DRE correto | Valores do DRE batem com exportação manual do ERP | Variação < 0,1% |
| Adoção inicial | Primeiro cliente real usando em produção | Validado até o fim do MVP |
| Sync on-demand | Cliente consegue sincronizar manualmente pelo botão | Feedback visual em < 5 segundos de iniciado |

---

## 9. Stack Tecnológica

| Camada | Tecnologia | Justificativa |
|--------|-----------|--------------|
| Frontend | Next.js + TypeScript | SSR nativo, ecossistema React, integração com Auth.js |
| Backend | Fastify + TypeScript | Performance, low overhead, type safety |
| ORM / Queries | Drizzle ORM | Type safety em queries analíticas complexas — Prisma é fraco para analytics |
| Jobs / Pipeline | pg-boss | Jobs persistidos no próprio PostgreSQL — sem Redis adicional |
| Autenticação | Auth.js | Self-hosted, sem custo, sem vendor lock-in |
| Banco de dados | PostgreSQL | Suporte nativo a JSONB, schemas múltiplos, materialized views |
| Agente (Status) | Node.js + TypeScript → .exe via pkg | Footprint mínimo, sem dependências no servidor do cliente |
| Ambiente local | WSL Ubuntu + Docker Compose | Paridade com produção, zero custo |
| Produção MVP | Railway | Zero ops — foco no produto. Migrar para Hetzner com tração |

---

## 10. Ambiente de Desenvolvimento

### 10.1 Infraestrutura Local

- WSL 2 com Ubuntu como ambiente principal de desenvolvimento
- Docker Compose para orquestrar os serviços locais
- PostgreSQL rodando em container com os quatro schemas: app, raw, canonical, analytics
- Backend (Fastify) e Frontend (Next.js) rodando em containers separados

### 10.2 Padrões de Projeto

- Repositório único (monorepo) com workspaces para frontend, backend e agente
- Todas as decisões técnicas documentadas em ADRs antes da implementação
- Todas as features documentadas em SPECs antes de codar
- Migrations gerenciadas pelo Drizzle — nenhuma alteração de schema sem migration
- Commits semânticos: `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`

---

## 11. Próximos Passos

| # | Etapa | Descrição |
|---|-------|-----------|
| 01 | Base documental | Definir e estruturar todos os documentos do projeto no repositório |
| 02 | Revisão da arquitetura | Fechar gaps do architecture.md (frontend/BI e tradeoffs) |
| 03 | Análise das fontes | Mapear schemas reais do Status (XLSX) e endpoints do WebPosto (DOCX) ✅ |
| 04 | Canonical model detalhado | Campo a campo: origem → destino → tipo → regra → por quê |
| 05 | ADRs | Documentar cada decisão técnica relevante com contexto e alternativas |
| 06 | Modelagem do banco | DDL final baseado no canonical model validado |
| 07 | Design da API | Contratos de endpoint por feature |
| 08 | Specs de feature | Uma SPEC por feature antes de qualquer implementação |
| 09 | Ambiente local | Setup do repositório, Docker Compose e estrutura de pastas |
| 10 | Implementação MVP | Agente → Pipeline → API → Frontend, nessa ordem |

---

*— fim do documento —*
