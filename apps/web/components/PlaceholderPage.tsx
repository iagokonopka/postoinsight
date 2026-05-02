export function PlaceholderPage({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <h1
        style={{
          margin: 0,
          fontSize: 'var(--text-heading)',
          fontWeight: 600,
        }}
      >
        {title}
      </h1>
      <div
        style={{
          padding: 'var(--space-5)',
          background: 'var(--color-bg)',
          border: '1px dashed var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          color: 'var(--color-text-muted)',
        }}
      >
        {description}
      </div>
    </div>
  )
}
