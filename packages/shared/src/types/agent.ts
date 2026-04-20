export type AgentEntity = 'fato_venda' | 'dim_produto_titem' | 'dim_produto_tcati' | 'dim_produto_tgrpi' | 'dim_produto_tsgri'

export type AgentCommand =
  | { command: 'sync';     job_id: string; entity: 'fato_venda' | 'dim_produto'; watermark: string }
  | { command: 'backfill'; job_id: string; entity: 'fato_venda'; from: string; to: string; batch_size: number; delay_ms: number }
  | { command: 'ping' }

export type AgentMessage =
  | { type: 'batch'; job_id: string; entity: AgentEntity; batch: number; total_rows: number; rows: unknown[] }
  | { type: 'done';  job_id: string; entity: AgentEntity; total_rows: number }
  | { type: 'error'; job_id: string; message: string }
  | { type: 'pong' }
