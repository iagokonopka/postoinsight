# Gaps de backend — redesign do frontend (ADR-017)

> Lacunas identificadas durante o re-layout do `apps/web` para o design "Executivo".
> O frontend renderiza estado **"em breve"** onde o dado não existe. Cada item abaixo
> precisa de spec própria antes de implementar no backend.

## Visão Geral

- **Insights "O que pede atenção"** — não há endpoint de insights.
  - Curto prazo: derivar 2-3 insights simples no client a partir de `vendas/resumo`
    (ex.: posto de menor margem, segmento abaixo da média).
  - Ideal: `GET /api/v1/vendas/insights` com regras server-side (severidade alerta/positivo/neutro).
- **Ranking "Postos da rede"** — `vendas/by-location` hoje retorna apenas
  `receita_bruta`, `margem_bruta`, `margem_pct`, `qtd_venda`.
  - Faltam **`volume`** (litros) e **`ticket_medio`** por posto para as colunas do ranking.

## Combustível

- **Spread por período** — não há série temporal de spread (R$/L) ao longo do tempo.
  - Necessário endpoint/agregação de spread médio por dia/semana.
- **Por turno** — não há agregação por turno (madrugada/manhã/tarde/noite); depende de
  granularidade horária do ERP, hoje não disponível no pipeline.
- **Spread por produto** — OK, derivável de `combustivel/resumo.por_produto`
  (`preco_medio_litro` − `custo_medio_litro`). Não é gap.

## Observações

- `usePadraoSemanal` (heatmap) já existe e pode ser reaproveitado.
- Nenhum dado mock do protótipo (POSTOS/PRESETS/etc.) deve ir para produção — apenas os
  hooks reais.
