# ADR-001 — ORM: Drizzle vs Prisma

**Data:** 2026-04-05
**Status:** Aceito

---

## Contexto

PostoInsight precisa de um ORM para TypeScript que suporte:
- Queries analíticas complexas (GROUP BY, window functions, CTEs, joins multi-tabela)
- 4 schemas PostgreSQL separados (`app`, `raw`, `canonical`, `analytics`)
- Materialized views com REFRESH
- Type safety end-to-end sem sacrificar controle sobre o SQL gerado

Prisma é o ORM dominante no ecossistema TypeScript/Node.js e seria a escolha padrão de qualquer desenvolvedor entrando no projeto.

---

## Decisão

**Drizzle ORM**

---

## Justificativa

Prisma é fraco para casos de uso analíticos:

1. **Queries complexas viram raw SQL no Prisma.** Qualquer GROUP BY não trivial, window function ou CTE exige `prisma.$queryRaw` — que devolve `any`, perdendo todo o type safety. Drizzle mantém type safety em queries complexas nativamente.

2. **Prisma não suporta múltiplos schemas PostgreSQL.** O modelo de dados do PostoInsight depende de 4 schemas (`app`, `raw`, `canonical`, `analytics`). Drizzle suporta schemas múltiplos com type safety completo.

3. **Drizzle é SQL-first.** O desenvolvedor escreve queries que parecem SQL — sem um sistema de query builder proprietário para aprender. O SQL gerado é previsível e otimizável.

4. **Materialized views.** Drizzle suporta definição e refresh de materialized views. Prisma não tem suporte nativo.

5. **Performance.** Drizzle tem overhead mínimo — é basicamente um type-safe query builder, não um ORM com cache e grafos de objetos. Para analytics, isso importa.

---

## Alternativas descartadas

| Alternativa | Motivo da rejeição |
|------------|-------------------|
| Prisma | Fraco para queries analíticas, sem suporte a múltiplos schemas |
| TypeORM | Maduro mas verboso, menos type-safe que Drizzle, overhead maior |
| Knex | Query builder sem type safety nativo |
| SQL puro (pg) | Viável mas perde as migrations e o schema-as-code |

---

## Consequências

- Curva de aprendizado para devs vindos de Prisma — Drizzle tem API diferente
- Migrations gerenciadas pelo Drizzle (`drizzle-kit`) — nenhuma alteração de schema sem migration versionada
- Schema definido em TypeScript em `packages/db/`