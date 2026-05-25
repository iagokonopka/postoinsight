# ADR-016 — Deploy do Frontend SPA no Railway: estratégia de serve

**Data:** 2026-05-24
**Status:** Aceito

---

## Contexto

O frontend (`apps/web`) é um SPA Vite + React. O build gera arquivos estáticos em `dist/`.
Precisa ser servido no Railway como um terceiro serviço (ao lado de `api` e `postoinsight` worker).

A questão central é: como servir `dist/` em produção no Railway?

---

## Decisão

**Nginx via Dockerfile** — adicionar `apps/web/Dockerfile` e `apps/web/nginx.conf`.

---

## Justificativa

1. **SPA routing correto.** O React Router usa client-side routing. Qualquer request para `/combustivel`, `/dre`, etc. precisa retornar `index.html` — não um 404. Nginx faz isso com `try_files $uri /index.html`. O `serve` npm também suporta, mas exige flag `--single` que nem sempre é lembrada.

2. **Headers de cache.** Com Nginx configuramos `Cache-Control: max-age=31536000, immutable` nos assets com hash (`/assets/*.js`) e `no-cache` no `index.html`. Isso garante que o browser não sirva JS desatualizado após um deploy. O `serve` npm não faz isso out-of-the-box.

3. **Sem dependência de runtime Node.js.** O `npx serve` exige Node instalado na imagem de produção. Nginx é uma imagem Alpine de ~20MB, sem Node. Menor superfície de ataque.

4. **Padrão da indústria para SPAs.** Nginx + `try_files` é a solução canônica para hospedar SPAs em containers. Documentação abundante, zero surpresas.

5. **Railway suporta Dockerfile nativamente.** Sem necessidade de Nixpacks ou buildpack customizado. O Railway detecta o `Dockerfile` e usa ele diretamente.

---

## Alternativas descartadas

| Alternativa | Motivo da rejeição |
|------------|-------------------|
| `npx serve dist/` | Sem controle de cache headers; depende de Node em runtime; flag `--single` é fácil de esquecer |
| Vercel (só frontend) | Adiciona um terceiro provider; cookie cross-domain complica auth |
| Railway Static Site (experimental) | Feature ainda instável no Railway; sem controle de headers |
| `caddy` | Boa opção, mas Nginx é mais familiar e amplamente documentado |

---

## Arquivos que esta ADR cria

- `apps/web/Dockerfile` — multi-stage: `node:20-alpine` para build + `nginx:alpine` para serve
- `apps/web/nginx.conf` — `try_files`, cache headers, gzip

## Variáveis de ambiente Railway (serviço `web`)

Nenhuma variável de runtime — o SPA é estático. A URL da API é embutida no build via `VITE_API_URL` (injetada no momento do build, não em runtime).

## Variável de ambiente Railway (serviço `api`)

- `WEB_ORIGIN` — domínio público do serviço `web` no Railway, para allowlist do CORS.

---

## Consequências

- Qualquer mudança na `VITE_API_URL` exige rebuild do frontend (não é runtime config).
- O cookie de auth (`SameSite=Lax`) funciona normalmente: frontend e API ficam em domínios distintos do Railway, mas ambos são `https` e o browser envia cookies em requisições de primeiro nível. Fetch com `credentials: 'include'` + CORS configurado na API é suficiente.