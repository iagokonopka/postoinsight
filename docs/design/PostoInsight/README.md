# PostoInsight — Protótipo HTML

Protótipo hi-fi interativo da plataforma PostoInsight.

## Como abrir

1. Descompacte o `.zip`
2. Abra **`PostoInsight.html`** em qualquer navegador moderno (Chrome, Edge, Firefox, Safari)
3. Os assets (Chart.js, Geist Sans, React/Babel) são carregados via CDN — precisa de internet na primeira abertura

## Arquivos

| Arquivo | O que é |
|---------|---------|
| `PostoInsight.html` | Shell da aplicação, CSS completo, estrutura de todas as 6 abas |
| `data.js` | Mock data layer (seeded RNG · period × location aware) |
| `charts.js` | Builders de Chart.js + SVG sparkline hand-rolled |
| `app.js` | Lógica da aplicação: navegação, re-render, drill-down, sync |
| `tweaks-panel.jsx` | Shell do painel de Tweaks (React) |
| `tweaks-app.jsx` | Conteúdo dos Tweaks específicos do projeto |
| `PRD.md` | Product Requirements Document v1.4 |
| `design-tokens.md` | Design tokens v1.4 (cores, espaçamento, padrões de chart) |

## Abas do protótipo

- **Visão Geral** — Receita, CMV, margem, top produtos, heatmap
- **Combustível** — Volumes por produto, mix, breakdown com tendência 14d
- **Conveniência & Serviços** — Loja, serviços, lubrificantes (3 views), scatter matrix
- **DRE Mensal** — Waterfall, evolução de margem, detalhamento 6 meses
- **Sincronização** — Status dos ERPs, histórico de execuções
- **Configurações** — Tenant, locations, usuários, integrações

## Tweaks

O painel de Tweaks (canto inferior direito do preview) controla tema (claro/escuro), densidade, cor de marca, sparklines e estilo dos gráficos.

---

*PostoInsight · Rede JAM (mock) · 2026-05-17*
