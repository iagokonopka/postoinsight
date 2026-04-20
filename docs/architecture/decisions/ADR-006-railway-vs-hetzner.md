# ADR-006 — Deploy MVP: Railway vs Hetzner VPSeu qui

**Data:** 2026-04-05
**Status:** Aceito

---

## Contexto

PostoInsight precisa de infraestrutura de produção para o MVP. As opções principais são:

- **Railway:** PaaS managed (similar ao Heroku moderno) — zero configuração de servidor
- **Hetzner VPS:** servidor virtual dedicado na Europa — custo baixo, controle total, mas ops manual

---

## Decisão

**Railway para o MVP**

---

## Justificativa

1. **Foco no produto, não em ops.** No MVP o objetivo é validar o produto com o primeiro cliente real. Cada hora gasta configurando Nginx, SSL, systemd, backups e monitoramento em VPS é uma hora a menos de produto. Railway abstrai toda essa camada.

2. **Deploy em minutos.** Push no repositório → Railway faz build e deploy automaticamente. Sem pipeline de CI/CD para configurar, sem Dockerfile de produção para afinar, sem DNS para gerenciar além do básico.

3. **PostgreSQL managed incluído.** Railway oferece PostgreSQL com backups automáticos, métricas e connection pooling. Em Hetzner, isso exigiria configurar PostgreSQL manualmente ou contratar um RDS separado.

4. **Custo aceitável para MVP.** O custo do Railway no volume do MVP (1-3 clientes, sync diária) é de ~$20-50/mês — irrelevante comparado ao custo de desenvolvimento para afinar infra.

5. **Migração é simples quando necessário.** Railway usa containers padrão. Migrar para Hetzner (ou qualquer VPS) no futuro é uma operação de infraestrutura sem mudanças no código.

---

## Quando migrar do Railway

A migração para Hetzner faz sentido quando:
- Custo do Railway superar ~$100/mês (muitos tenants, alto volume de dados)
- Necessidade de controle fino sobre localização dos dados (compliance LGPD)
- Latência para clientes brasileiros se tornar um problema (Railway tem regiões US/EU — sem região BR)

---

## Alternativas descartadas

| Alternativa | Motivo da rejeição |
|------------|-------------------|
| Hetzner VPS | Ops manual consome tempo de desenvolvimento no MVP |
| AWS / GCP / Azure | Custo e complexidade excessivos para MVP de estágio inicial |
| Render | Similar ao Railway, Railway tem melhor DX e suporte a PostgreSQL |
| Fly.io | Boa opção, mas Railway é mais simples para começar |
| Vercel (só frontend) | Não resolve o backend — exigiria outra plataforma para API |

---

## Consequências

- Sem controle sobre a região exata dos dados — relevante para LGPD no futuro
- Sem acesso SSH ao servidor de produção — debugging via logs do Railway
- Vendor lock-in leve: variáveis de ambiente e connection strings são padrão, migração é baixo risco