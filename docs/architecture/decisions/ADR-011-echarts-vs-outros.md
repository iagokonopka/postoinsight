# ADR-011 — Biblioteca de Charts: ECharts vs Alternativas

**Data:** 2026-05-03
**Status:** Aceito

---

## Contexto

PostoInsight precisa de uma biblioteca de gráficos para visualizar dados de BI:

- Evolução de vendas ao longo do tempo (line chart, bar chart)
- Comparativo entre locations (bar chart agrupado/stacked)
- Breakdown por segmento/categoria (pie chart, donut)
- DRE mensal com múltiplas séries (line + bar combinados)
- Volume potencialmente alto de pontos de dados (30–365 dias × múltiplas séries)

A escolha feita junto com a migração para Vite + React SPA.

---

## Decisão

**ECharts via `echarts-for-react`**

---

## Justificativa

| Critério | ECharts | Recharts | Tremor | Chart.js |
|----------|---------|----------|--------|----------|
| Performance (datasets grandes) | ✅ Excelente (canvas) | ⚠️ Degradação com > 1k pts | ⚠️ Wrapper Recharts | ✅ Bom |
| Tipos de gráfico | ✅ Mais completo do mercado | ✅ Bom para os básicos | ⚠️ Limitado | ✅ Bom |
| Customização | ✅ Total via option object | ⚠️ Via props/CSS | ❌ Opinado por design | ✅ Via config |
| Charts combinados (line+bar) | ✅ Nativo | ⚠️ ComposedChart funciona | ❌ Não suporta | ✅ Nativo |
| Responsividade | ✅ Automática | ✅ | ✅ | ⚠️ Manual |
| Tamanho do bundle | ⚠️ Grande (~900KB) com tree-shaking → ~200KB | ✅ Menor | ✅ Menor (mas menor poder) | ✅ ~200KB |
| Manutenção | ✅ Apache ECharts (Apache Foundation) | ✅ Ativo | ⚠️ Tremor v3 quebrou API | ✅ Ativo |
| Integração React | `echarts-for-react` (wrapper maduro) | Nativo React | Nativo React | `react-chartjs-2` |

**Por que ECharts vence:**

1. **Escala sem limites** — renderiza em canvas, não DOM. Para dashboards de BI com séries longas (1 ano diário = 365 pontos × 4 locations = 1460 pontos), Recharts começa a travar.

2. **Charts combinados** — o DRE mensal precisa de bar + line no mesmo eixo. ECharts suporta nativamente via `series[].type`. Em Recharts, o `ComposedChart` funciona mas tem limitações de eixo Y duplo.

3. **Flexibilidade total** — ECharts usa um `option` object declarativo. Qualquer visualização que o produto vier a precisar (heatmap, scatter, funnel) já está disponível sem trocar de lib.

4. **Sem dependência de design system** — Tremor foi descartado porque força seu design system próprio e sua API breaking change no v3 criou risco de manutenção.

---

## Alternativas descartadas

| Alternativa | Motivo da rejeição |
|------------|-------------------|
| Recharts | Performance degrada com datasets de BI; charts combinados limitados |
| Tremor | Design system opinado que limita customização; histórico de breaking changes (v3) |
| Chart.js | Funcional, mas API imperativa (menos React-friendly); ECharts tem mais poder para BI |
| Victory | Menor ecossistema, menos recursos para BI avançado |
| D3.js diretamente | Máximo poder, mas custo de implementação alto; ECharts já abstrai o suficiente |

---

## Consequências

- Dependência: `echarts` + `echarts-for-react`
- Bundle size: usar tree-shaking via import seletivo (`import { LineChart } from 'echarts/charts'`) para manter bundle razoável
- Padrão de uso: criar componentes wrapper (`VendasChart`, `DreChart`, etc.) em `apps/web/src/components/charts/` que encapsulam a config do ECharts — o resto da app nunca importa ECharts diretamente
- Tema: definir um tema ECharts global em `apps/web/src/lib/echarts-theme.ts` para consistência visual
