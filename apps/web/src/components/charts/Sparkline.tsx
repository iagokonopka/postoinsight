/**
 * Sparkline — SVG inline puro, sem Recharts.
 * Dois usos: fundo do KpiCard (opacity=0.25, showArea) e inline em tabelas (opacity=1, sem área).
 */

interface SparklineProps {
  data: number[];
  color: string;
  width?: number;
  height?: number;
  opacity?: number;
  showArea?: boolean;
  /** Passado direto para o <svg> — ex: className para absolute inset-0 */
  className?: string;
  'aria-hidden'?: boolean | 'true' | 'false';
}

function buildSmoothPath(xs: number[], ys: number[]): string {
  if (xs.length < 2) return '';
  const points = xs.map((x, i) => ({ x, y: ys[i] }));
  let d = `M ${points[0].x} ${points[0].y}`;

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpx = (prev.x + curr.x) / 2;
    d += ` C ${cpx} ${prev.y}, ${cpx} ${curr.y}, ${curr.x} ${curr.y}`;
  }

  return d;
}

export function Sparkline({
  data,
  color,
  width = 80,
  height = 32,
  opacity = 1,
  showArea = false,
  className,
  'aria-hidden': ariaHidden = true,
}: SparklineProps) {
  if (!data || data.length < 2) return null;

  const pad = 2;
  const w = width;
  const h = height;

  const minVal = Math.min(...data);
  const maxVal = Math.max(...data);
  const range = maxVal - minVal || 1;

  const xs = data.map((_, i) => pad + (i / (data.length - 1)) * (w - pad * 2));
  const ys = data.map((v) => h - pad - ((v - minVal) / range) * (h - pad * 2));

  const linePath = buildSmoothPath(xs, ys);

  const areaPath = showArea
    ? `${linePath} L ${xs[xs.length - 1]} ${h - pad} L ${xs[0]} ${h - pad} Z`
    : '';

  const gradientId = `sparkline-grad-${color.replace(/[^a-z0-9]/gi, '')}`;

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      vectorEffect="non-scaling-stroke"
      aria-hidden={ariaHidden === true || ariaHidden === 'true' ? true : undefined}
      className={className}
      style={{ opacity }}
    >
      {showArea && (
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.5} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
      )}
      {showArea && (
        <path d={areaPath} fill={`url(#${gradientId})`} />
      )}
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}