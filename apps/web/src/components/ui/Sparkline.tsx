// SVG inline sparkline — spec: FRONTEND_TODO Bloco 6
// viewBox: 200×60, curve in bottom 45%, smooth cubic-bezier

interface SparklineProps {
  data: number[]
  color: string
  width?: string | number
  height?: string | number
}

function buildSmoothPath(xs: number[], ys: number[]): string {
  if (xs.length < 2) return ''
  let d = `M ${xs[0]},${ys[0]}`
  for (let i = 1; i < xs.length; i++) {
    const x0 = xs[i - 1], y0 = ys[i - 1]
    const x1 = xs[i],     y1 = ys[i]
    const cpx = x0 + (x1 - x0) * 0.5
    d += ` C ${cpx},${y0} ${cpx},${y1} ${x1},${y1}`
  }
  return d
}

export function Sparkline({ data, color, width = '100%', height = '100%' }: SparklineProps) {
  if (!data || data.length < 2) return null

  const W = 200, H = 60
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = (max - min) || 1

  const xs = data.map((_, i) => (i / (data.length - 1)) * W)
  // curve sits in bottom 45% of viewBox
  const ys = data.map(v => H - 4 - ((v - min) / range) * (H * 0.45))

  const path = buildSmoothPath(xs, ys)
  const area = `${path} L ${W},${H} L 0,${H} Z`

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      width={width}
      height={height}
      style={{ display: 'block' }}
    >
      <path d={area} fill={color} fillOpacity={0.22} />
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={1.4}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}
