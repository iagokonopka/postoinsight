interface LegendItem {
  color: string;
  label: string;
}

interface ChartLegendProps {
  items: LegendItem[];
}

export function ChartLegend({ items }: ChartLegendProps) {
  return (
    <div style={{
      display: 'flex',
      gap: 14,
      justifyContent: 'flex-end',
      padding: '6px 0 2px',
      flexWrap: 'wrap',
    }}>
      {items.map((item, i) => (
        <div key={i} style={{
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          fontSize: 11,
          color: 'var(--color-text-muted)',
        }}>
          <span style={{
            width: 12,
            height: 2,
            borderRadius: 1,
            background: item.color,
            display: 'inline-block',
          }} />
          {item.label}
        </div>
      ))}
    </div>
  );
}