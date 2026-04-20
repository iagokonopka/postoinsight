# ADR-002 — Jobs/Queue: pg-boss vs BullMQ

**Data:** 2026-04-05
**Status:** Aceito

---

## Contexto

PostoInsight precisa de um sistema de filas para:
- Jobs de sync agendados (diário, por tenant)
- Jobs de sync on-demand (disparados pelo usuário)
- Pipeline de processamento: ingest → transform → canonical → refresh MV

O volume é baixo: dezenas de jobs por dia por tenant, não milhares por segundo.

BullMQ + Redis é o padrão da indústria Node.js para filas e seria a escolha esperada por qualquer desenvolvedor entrando no projeto.

---

## Decisão

**pg-boss** (jobs persistidos no PostgreSQL)

---

## Justificativa

1. **Zero infra adicional.** PostgreSQL já é necessário. Redis seria mais um serviço para provisionar, monitorar, fazer backup e pagar. No Railway, isso representa custo e complexidade desnecessários para o MVP.

2. **Atomicidade entre dado e job — o motivo técnico mais importante.** Com pg-boss, inserir um registro no banco e enfileirar o job de processamento acontece na mesma transação:

   ```sql
   BEGIN;
     INSERT INTO raw.raw_ingest (...) VALUES (...);
     SELECT pgboss.send(...);  -- enfileira o job
   COMMIT;
   ```

   Se a transação falha, nem o dado nem o job existem. Com Redis, há sempre uma janela entre `INSERT` no Postgres e `LPUSH` no Redis onde um crash cria inconsistência — o dado existe mas o job nunca foi criado (ou vice-versa).

3. **Volume não justifica Redis.** BullMQ é otimizado para alta throughput (milhares de jobs/segundo). PostoInsight tem sync diária + on-demand por tenant — pg-boss suporta isso com larga margem.

4. **Durabilidade garantida pelo PostgreSQL.** Jobs sobrevivem a restarts sem configuração adicional de persistência (Redis exige configurar RDB/AOF explicitamente).

---

## Alternativas descartadas

| Alternativa | Motivo da rejeição |
|------------|-------------------|
| BullMQ + Redis | Infra extra, sem atomicidade com o banco, volume não justifica |
| Bull + Redis | Legado do BullMQ, mesmos problemas |
| Agenda (MongoDB) | Exigiria MongoDB — terceiro banco sem necessidade |
| Cron simples (node-cron) | Sem persistência, sem retry, sem visibilidade de estado |

---

## Consequências

- Jobs visíveis diretamente no PostgreSQL — fácil de inspecionar e debugar com qualquer cliente SQL
- pg-boss cria suas próprias tabelas no schema `public` (ou configurável) — não polui os schemas da aplicação
- Se no futuro o volume crescer muito (improvável no MVP), migrar para BullMQ é uma decisão reversível
