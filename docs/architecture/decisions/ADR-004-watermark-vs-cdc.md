# ADR-004 — Estratégia de sync Status: Watermark vs CDC

**Data:** 2026-04-05
**Status:** Aceito

---

## Contexto

O agente Status precisa extrair dados incrementais do SQL Server do cliente — apenas registros novos ou alterados desde o último sync, sem re-extrair o histórico completo a cada execução.

Duas estratégias são viáveis para extração incremental de SQL Server:

- **Watermark:** filtra por coluna de data/timestamp — `WHERE DATA_EMISSAO >= :last_sync`
- **CDC (Change Data Capture):** lê o transaction log do SQL Server para capturar inserções, updates e deletes

---

## Decisão

**Watermark** baseado em `DATA_EMISSAO`

---

## Justificativa

1. **CDC requer privilégios administrativos no banco do cliente.** Para habilitar CDC é preciso executar `sp_cdc_enable_db` e `sp_cdc_enable_table` — operações que exigem permissão de `sysadmin` ou `db_owner`. O agente opera com uma conta de leitura (`SELECT` only). Pedir ao cliente para conceder permissões administrativas ao agente é inaceitável do ponto de vista de segurança e vendas.

2. **CDC pode não estar disponível na edição do SQL Server do cliente.** CDC tem limitações dependendo da edição (Express não suporta, Standard tem restrições). Não podemos controlar qual versão/edição o cliente usa.

3. **As tabelas fonte têm coluna de data adequada.** `TMPBI_VENDA_DETALHADA.DATA_EMISSAO` é um datetime confiável para watermark — representa quando a venda foi emitida. O risco de registros chegarem fora de ordem é baixo para o caso de uso (sync diário/on-demand de vendas fechadas).

4. **Simplicidade operacional.** Watermark é um `SELECT` simples. O watermark fica armazenado no nosso servidor — o cliente não precisa configurar nada adicional além do acesso de leitura já concedido.

---

## Alternativas descartadas

| Alternativa | Motivo da rejeição |
|------------|-------------------|
| CDC (Change Data Capture) | Requer privilégios administrativos, dependente da edição SQL Server |
| Full sync a cada execução | Inviável para tabelas com anos de histórico |
| Polling por PK (MAX id) | `TMPBI_VENDA_DETALHADA` não tem PK sequencial confiável para este uso |

---

## Consequências

- Watermark armazenado em `app.sync_jobs` — por tenant, por posto, por tabela
- Risco residual: se um registro for inserido com `DATA_EMISSAO` retroativa (ex: lançamento tardio), pode ser perdido. Aceitável para MVP — mitigação futura com janela de overlap (ex: re-extrair últimas 24h)
- Re-sync completo disponível como operação manual de administração
