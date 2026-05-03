# ADR-010 — Frontend: Vite + React SPA vs Next.js App Router

**Data:** 2026-05-03
**Status:** Aceito

---

## Contexto

O frontend `apps/web` foi inicialmente implementado com Next.js 14 App Router, mas nunca chegou a ser deployado em produção. Antes do primeiro deploy, o founder revisou a decisão original e identificou uma desalinhamento entre as características do Next.js e as necessidades reais do produto.

PostoInsight é um painel de BI com as seguintes características:

- **100% atrás de autenticação** — nenhuma página é pública. Não há conteúdo indexável por motores de busca.
- **SPA por natureza** — o produto é um dashboard interativo, com navegação client-side, filtros reativos e atualizações de estado frequentes.
- **Sem necessidade de SSR** — os dados vêm todos da API Fastify via fetch autenticado. Server Components não trazem benefício algum: o usuário precisa estar autenticado para ver qualquer coisa, e os dados são dinâmicos por sessão.
- **DX degradada com App Router** — cada componente interativo exige `'use client'`, tornando o modelo mental mais complexo sem ganho real. O App Router foi projetado para sites públicos com SSR; para um SPA fechado, é overhead puro.

---

## Decisão

**Vite + React (SPA puro)**

---

## Justificativa

| Critério | Next.js App Router | Vite + React SPA |
|----------|-------------------|-----------------|
| SSR/SEO | ✅ (irrelevante para nós) | ❌ (irrelevante para nós) |
| Dev server cold start | ~3–8s | < 300ms |
| Build | Next.js bundler (lento) | Vite (esbuild/rollup, rápido) |
| Modelo mental | Server/Client Components, RSC, streaming | React puro — um modelo só |
| `'use client'` obrigatório | Em todo componente interativo | Não existe |
| Auth | Auth.js (acoplado ao Next.js) | Bearer token via header — simples |
| Deploy | Railway (funciona) | Railway (funciona igual) |
| Tamanho do bundle | Maior (Next.js runtime) | Menor |

O App Router introduz complexidade real (Server Components, Suspense boundaries, client/server boundary management) que só vale a pena quando há benefício de SSR ou SSG. Para um dashboard autenticado, essa complexidade é custo sem retorno.

Vite entrega DX superior: dev server instantâneo, hot reload imediato, build simples e previsível.

---

## Alternativas descartadas

| Alternativa | Motivo da rejeição |
|------------|-------------------|
| Next.js 14 App Router (original) | SSR irrelevante, complexidade de Server Components sem benefício, Auth.js acoplado |
| Next.js com Pages Router | Melhor que App Router para SPAs, mas ainda carrega o runtime do Next.js sem necessidade |
| Remix | SSR-first, mesmo problema do Next.js |
| SvelteKit | Fora da stack TypeScript/React estabelecida — risco de onboarding |

---

## Consequências

- `apps/web` deletado e recriado do zero com Vite + React + TypeScript
- Auth.js v5 removido do frontend — autenticação passa a ser gerenciada via Bearer token (ver ADR-012)
- Backend `apps/api/src/lib/auth.ts` não precisa de alterações — já suporta `Authorization: Bearer`
- Deploy no Railway: servir o build estático de `dist/` via um servidor estático (ex: `serve`) ou Railway Static Sites
- Toda lógica de negócio permanece no backend — regra já existente, não muda

---

## Impacto em outros ADRs

- ADR-003 (Auth.js vs Clerk): a escolha de Auth.js permanece válida para o **backend** (tokens JWE compatíveis). A integração Next.js-específica do Auth.js é removida. Ver ADR-012.