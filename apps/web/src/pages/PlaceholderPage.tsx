// Placeholder genérico — substituído pelas páginas reais nas fases seguintes
interface Props {
  name: string
}

export default function PlaceholderPage({ name }: Props) {
  return (
    <div style={{ color: 'hsl(var(--muted-foreground))', fontSize: '13px' }}>
      <span style={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}>{name}</span> — em implementação
    </div>
  )
}
