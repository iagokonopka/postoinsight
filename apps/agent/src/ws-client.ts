import WebSocket from 'ws'
import { env } from './env.js'
import type { AgentCommand, AgentMessage } from '@postoinsight/shared'
import { extractFatoVenda, extractDimProduto } from './extract.js'

const BATCH_SIZE_SYNC     = 500
const BATCH_SIZE_BACKFILL = 200
const HEARTBEAT_MS        = 30_000
const RECONNECT_INITIAL   = 1_000
const RECONNECT_MAX       = 60_000

let ws: WebSocket | null = null
let reconnectDelay = RECONNECT_INITIAL
let heartbeatTimer: ReturnType<typeof setInterval> | null = null

export function connect(): void {
  ws = new WebSocket(env.POSTOINSIGHT_API_URL + '/agent/v1/connect', {
    headers: { Authorization: `Bearer ${env.AGENT_TOKEN}` },
  })

  ws.on('open', () => {
    console.log('Connected to PostoInsight API')
    reconnectDelay = RECONNECT_INITIAL

    heartbeatTimer = setInterval(() => {
      if (ws?.readyState === WebSocket.OPEN) ws.ping()
    }, HEARTBEAT_MS)
  })

  ws.on('message', async (data) => {
    try {
      const command: AgentCommand = JSON.parse(data.toString())
      await handleCommand(command)
    } catch (err) {
      console.error('Failed to handle command:', err)
    }
  })

  ws.on('pong', () => {
    // Conexão viva
  })

  ws.on('close', (code, reason) => {
    if (heartbeatTimer) clearInterval(heartbeatTimer)
    console.log(`Disconnected (${code}: ${reason}). Reconnecting in ${reconnectDelay}ms...`)
    setTimeout(() => {
      reconnectDelay = Math.min(reconnectDelay * 2, RECONNECT_MAX)
      connect()
    }, reconnectDelay)
  })

  ws.on('error', (err) => {
    console.error('WebSocket error:', err.message)
  })
}

function send(msg: AgentMessage): void {
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg))
  }
}

async function handleCommand(cmd: AgentCommand): Promise<void> {
  if (cmd.command === 'ping') {
    send({ type: 'pong' })
    return
  }

  if (cmd.command === 'sync' && cmd.entity === 'fato_venda') {
    console.log(`Sync fato_venda from watermark ${cmd.watermark}`)
    let batch = 0
    let total = 0
    try {
      for await (const rows of extractFatoVenda({ mode: 'sync', watermark: cmd.watermark, batchSize: BATCH_SIZE_SYNC })) {
        batch++
        total += rows.length
        send({ type: 'batch', job_id: cmd.job_id, entity: 'fato_venda', batch, total_rows: rows.length, rows })
      }
      send({ type: 'done', job_id: cmd.job_id, entity: 'fato_venda', total_rows: total })
      console.log(`Sync done — ${total} rows in ${batch} batches`)
    } catch (err) {
      send({ type: 'error', job_id: cmd.job_id, message: String(err) })
    }
    return
  }

  if (cmd.command === 'backfill') {
    console.log(`Backfill fato_venda ${cmd.from} → ${cmd.to}`)
    let batch = 0
    let total = 0
    try {
      for await (const rows of extractFatoVenda({
        mode:      'backfill',
        from:      cmd.from,
        to:        cmd.to,
        batchSize: cmd.batch_size ?? BATCH_SIZE_BACKFILL,
        delayMs:   cmd.delay_ms ?? 200,
      })) {
        batch++
        total += rows.length
        send({ type: 'batch', job_id: cmd.job_id, entity: 'fato_venda', batch, total_rows: rows.length, rows })
      }
      send({ type: 'done', job_id: cmd.job_id, entity: 'fato_venda', total_rows: total })
      console.log(`Backfill done — ${total} rows in ${batch} batches`)
    } catch (err) {
      send({ type: 'error', job_id: cmd.job_id, message: String(err) })
    }
    return
  }

  if (cmd.command === 'sync' && cmd.entity === 'dim_produto') {
    console.log('Sync dim_produto (full)')
    try {
      const payload = await extractDimProduto()
      // Envia como batch único (dim_produto é menor)
      send({ type: 'batch', job_id: cmd.job_id, entity: 'dim_produto_titem', batch: 1, total_rows: payload.titem.length, rows: [payload] })
      send({ type: 'done', job_id: cmd.job_id, entity: 'dim_produto_titem', total_rows: payload.titem.length })
      console.log(`dim_produto done — ${payload.titem.length} produtos`)
    } catch (err) {
      send({ type: 'error', job_id: cmd.job_id, message: String(err) })
    }
    return
  }
}
