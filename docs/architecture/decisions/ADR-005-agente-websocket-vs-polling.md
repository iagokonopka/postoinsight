# ADR-005 — Agente Status: WebSocket persistente vs Polling HTTP

**Data:** 2026-04-05
**Status:** Aceito

---

## Contexto

O agente Status roda no servidor RDP do cliente (Windows) e precisa se comunicar com os servidores PostoInsight para:
- Receber comandos de sync (agendado ou on-demand disparado pelo usuário)
- Enviar os dados extraídos do SQL Server

O agente está dentro da rede do cliente, atrás do firewall/NAT. Os servidores PostoInsight estão na nuvem.

Duas arquiteturas são possíveis:

- **Polling HTTP:** agente faz requisições periódicas ao servidor para verificar se há comandos pendentes. Comunicação de saída apenas.
- **WebSocket persistente:** agente abre uma conexão persistente de saída para o servidor. Servidor empurra comandos via WebSocket. Agente responde na mesma conexão.

---

## Decisão

**WebSocket persistente de saída** — o agente inicia a conexão, o servidor empurra comandos

---

## Justificativa

1. **Sem exposição de porta no cliente — o motivo principal.** Para o servidor contactar o agente via HTTP, o cliente precisaria abrir uma porta no firewall e configurar o roteamento. Isso é inaceitável: requer intervenção da TI do cliente, cria risco de segurança e é um bloqueador de vendas. WebSocket de saída passa por qualquer firewall corporativo sem configuração adicional (usa porta 443/HTTPS).

2. **Sync on-demand em tempo real.** Com polling, há latência entre o usuário clicar "Sincronizar" e o agente receber o comando — proporcional ao intervalo de polling. Com WebSocket, o comando chega em milissegundos.

3. **Footprint mínimo no cliente.** O agente não expõe nenhuma superfície de ataque — não escuta em nenhuma porta, não tem servidor HTTP. Só inicia conexões de saída.

4. **Watermark no servidor.** O estado do sync (último watermark por tabela) fica nos servidores PostoInsight, não no cliente. Se o agente for reinstalado ou o servidor RDP formatado, o sync retoma do ponto correto sem intervenção.

---

## Arquitetura do agente

```
[Agente no RDP do cliente]
    └─ WebSocket (saída, porta 443) ──→ [PostoInsight API /agent/v1]
         ← push: { command: "sync", tables: [...], watermark: ... }
         → push: { status: "ok", payload: [...] }
```

- Dois contextos de API separados: `/api/v1` (frontend) e `/agent/v1` (agente)
- Autenticação do agente por token estático gerado no onboarding (não credenciais do usuário)
- Reconexão automática com backoff exponencial em caso de queda

---

## Alternativas descartadas

| Alternativa | Motivo da rejeição |
|------------|-------------------|
| Polling HTTP (agente → servidor) | Latência no on-demand, desperdício de requests, sem push real |
| HTTP reverso (servidor → agente) | Requer abertura de porta no firewall do cliente — bloqueador de vendas |
| SSH tunnel | Complexidade operacional, difícil de manter em Windows Service |
| VPN | Requer infraestrutura adicional no cliente, muito invasivo |

---

## Consequências

- Agente distribuído como `.exe` via `pkg` + NSSM como Windows Service — sem dependências no servidor do cliente
- Servidor precisa gerenciar conexões WebSocket abertas (uma por agente conectado)
- Reconexão deve ser robusta — implementar heartbeat e reconexão automática