type Align = 'left' | 'right' | 'center'

export type Column<T> = {
  key: string
  header: string
  align?: Align
  /** Render a row to a string or React node. Defaults to (row as any)[key]. */
  render?: (row: T) => React.ReactNode
}

export function DataTable<T>({
  columns,
  rows,
  emptyMessage = 'Nenhum dado disponível.',
}: {
  columns: Column<T>[]
  rows: T[]
  emptyMessage?: string
}) {
  if (rows.length === 0) {
    return (
      <div
        style={{
          padding: 'var(--space-5)',
          background: 'var(--color-bg)',
          border: '1px dashed var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          color: 'var(--color-text-muted)',
          textAlign: 'center',
        }}
      >
        {emptyMessage}
      </div>
    )
  }

  return (
    <div
      style={{
        background: 'var(--color-bg)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
      }}
    >
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: 'var(--text-sm)',
        }}
      >
        <thead>
          <tr style={{ background: 'var(--color-bg-subtle)' }}>
            {columns.map((c) => (
              <th
                key={c.key}
                style={{
                  textAlign: c.align ?? 'left',
                  padding: '12px var(--space-4)',
                  fontWeight: 600,
                  fontSize: 'var(--text-xs)',
                  textTransform: 'uppercase',
                  letterSpacing: 0.4,
                  color: 'var(--color-text-muted)',
                  borderBottom: '1px solid var(--color-border)',
                }}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              style={{
                borderBottom:
                  i === rows.length - 1 ? 'none' : '1px solid var(--color-border-subtle)',
              }}
            >
              {columns.map((c) => {
                const value = c.render ? c.render(row) : (row as Record<string, unknown>)[c.key]
                const isMono = c.align === 'right'
                return (
                  <td
                    key={c.key}
                    style={{
                      textAlign: c.align ?? 'left',
                      padding: '12px var(--space-4)',
                      height: 44,
                      fontFamily: isMono ? 'var(--font-mono)' : 'inherit',
                    }}
                  >
                    {(value as React.ReactNode) ?? '—'}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
