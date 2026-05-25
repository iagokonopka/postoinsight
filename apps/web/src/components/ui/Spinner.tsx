interface SpinnerProps {
  size?: 'sm' | 'lg'
  style?: React.CSSProperties
}

export function Spinner({ size, style }: SpinnerProps) {
  const isLg = size === 'lg'
  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <span style={{
        display: 'inline-block',
        width:  isLg ? '32px' : '14px',
        height: isLg ? '32px' : '14px',
        border: `${isLg ? 3 : 2}px solid hsl(var(--muted))`,
        borderTopColor: 'hsl(var(--primary))',
        borderRadius: '999px',
        animation: 'spin 0.7s linear infinite',
        flexShrink: 0,
        ...style,
      }} />
    </>
  )
}
