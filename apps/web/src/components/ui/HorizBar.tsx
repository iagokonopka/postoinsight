interface HorizBarProps {
  pct: number;   // 0–100
  color: string; // cor CSS
}

export function HorizBar({ pct, color }: HorizBarProps) {
  return (
    <div style={{
      height: 4,
      background: 'var(--color-bg-muted)',
      borderRadius: 2,
      overflow: 'hidden',
      flex: 1,
    }}>
      <div style={{
        height: '100%',
        width: `${Math.min(100, Math.max(0, pct))}%`,
        background: color,
        borderRadius: 2,
        transition: 'width 0.3s ease',
      }} />
    </div>
  );
}