# ADR-011 (rev. 2) — Biblioteca de Gráficos: Recharts + SVG inline

**Data original:** 2026-05-03  
**Revisão:** 2026-05-18  
**Status:** Aceito — substitui versão anterior  
**Autor:** Fundador + Claude  

---

## Contexto da Revisão

A decisão original escolheu ECharts com base em critérios de performance para "datasets grandes de BI". Após revisitar o escopo real do produto, essa premissa não se sustenta.

O PostoInsight é um **dashboard analítico focado e direto** — não um BI pesado. O conjunto de visualizações necessárias é fixo e de baixa complexidade técnica:

| Gráfico | Onde aparece |
|---------|-------------|
| Linha com área + gradiente | Visão Geral, Combustível, Conveniência |
| Linha multi-série | DRE, evolução de margem |
| Barra simples / barra + linha | Ranking de produtos, DRE waterfall |
| Donut | Breakdown por segmento |
| Sparkline inline | KPI cards, células de tabela |
| Heatmap semana × hora | Combustível — mapa de calor |

O heatmap é o único gráfico fora do comum — e é resolvido com CSS Grid puro, sem biblioteca.

---

## Decisão

**Recharts** para todos os gráficos da aplicação.  
**SVG inline manual** para sparklines (KPI cards e células de tabela).  
**CSS Grid** para o heatmap de horários.

---

## Justificativa

### Por que sair do ECharts

A escolha original superestimou a complexidade do produto. ECharts carrega ~900KB antes do tree-shaking e exige configuração via objeto imperativo — overhead real sem benefício proporcional para o PostoInsight.

O protótipo de referência (`design_example/postoinsight/PostoInsight.html`) usa **Chart.js** e entrega exatamente o nível de qualidade visual esperado. Recharts é superior ao Chart.js para React (declarativo, sem refs, sem `useEffect` para criar instâncias) e inferior ao ECharts apenas em cenários de alta volumetria — que não existem aqui.

### Por que Recharts

| Critério | Recharts | ECharts |
|----------|---------|---------|
| Modelo mental | Declarativo JSX — natural em React | Objeto imperativo — menos React-friendly |
| Todos os gráficos necessários | ✅ Linha, área, barra, donut, composedChart | ✅ |
| Bundle size | ~180KB (menor) | ~200KB pós tree-shaking |
| Exemplos no ecossistema React | ✅ Vastíssimos | ⚠️ Menos |
| Manutenção / comunidade | ✅ Ativo, bem mantido | ✅ |
| Animações de entrada | ✅ Suaves por padrão | ✅ |
| Charts combinados (linha+barra) | ✅ `ComposedChart` | ✅ |
| Necessidade de canvas (alta volumetria) | ❌ Não temos essa necessidade | ✅ canvas |

### Por que SVG inline para sparklines

Sparklines em KPI cards são elementos decorativos — linha suave com área, sem eixos, sem interação. O protótipo já resolve isso com ~30 linhas de SVG puro e o resultado visual é idêntico ao de qualquer biblioteca. Adicionar Recharts para isso seria overhead desnecessário.

### Por que CSS Grid para o heatmap

O heatmap de horários (semana × dia da semana) é uma grade fixa de células coloridas. Não há coordenadas, não há eixos, não há interpolação. CSS Grid + escala de cor via interpolação linear em JavaScript é mais simples, mais leve e mais controlável do que qualquer solução de biblioteca.

---

## Alternativas descartadas

| Alternativa | Motivo |
|------------|--------|
| ECharts (decisão anterior) | Superdimensionado para o escopo real; API imperativa menos adequada ao padrão React do projeto |
| Chart.js | Usado no protótipo com sucesso, mas API imperativa exige refs e useEffect — menos elegante em React que Recharts |
| Tremor | Design system opinado que conflita com identidade visual própria; histórico de breaking changes |
| Victory | Ecossistema menor, menos recursos |
| D3.js direto | Máximo poder, custo alto de implementação — desnecessário para o escopo |

---

## Padrão de implementação

Todos os gráficos ficam encapsulados em componentes wrapper em `apps/web/src/components/charts/`:

```
charts/
  LineAreaChart.tsx        ← linha com área e gradiente (Recharts AreaChart)
  MultiLineChart.tsx       ← múltiplas séries (Recharts LineChart)
  ComposedChart.tsx        ← linha + barra combinados (Recharts ComposedChart)
  DonutChart.tsx           ← rosca com centro customizável (Recharts PieChart)
  BarChart.tsx             ← barras simples e agrupadas (Recharts BarChart)
  Sparkline.tsx            ← SVG inline — sem dependência de biblioteca
  Heatmap.tsx              ← CSS Grid + lógica de cor em JS puro
```

O restante da aplicação **nunca importa Recharts diretamente** — apenas esses wrappers.

### Tema compartilhado

Criar `apps/web/src/lib/chart-theme.ts` com as constantes de cor, tipografia e grid derivadas dos design tokens — todos os gráficos importam deste arquivo.

```ts
// chart-theme.ts
export const CHART_COLORS = {
  combustivel:   '#0073BB',
  conveniencia:  '#EC7211',
  lubrificantes: '#6B40C4',
  servicos:      '#0891b2',
  arla:          '#1D8102',
  positive:      '#16a34a',
  negative:      '#dc2626',
};

export const CHART_GRID = { stroke: 'hsl(var(--border))', strokeDasharray: '0' };
export const CHART_TICK  = { fill: 'hsl(var(--muted-foreground))', fontSize: 11 };
export const CHART_TOOLTIP = {
  contentStyle: {
    background: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '8px',
    fontSize: '12px',
  },
};
```

---

## Consequências

- Remover `echarts` e `echarts-for-react` das dependências
- Instalar `recharts`
- Criar `apps/web/src/lib/chart-theme.ts`
- Criar os 7 componentes wrapper listados acima antes de implementar qualquer página
- Referências a ECharts em `CLAUDE.md`, `master-reference.md` e `prompt-frontend.md` devem ser atualizadas para Recharts
