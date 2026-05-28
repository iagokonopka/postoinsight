// ExpandableTable — generic multi-level expandable table (up to 4 levels)
// Level 1: rows   (always visible)
// Level 2: children  (lazy, fetched on first expand)
// Level 3: grandchildren (lazy, optional)
// Level 4: leaves  (lazy, optional — no expand, triggers onLeafClick)
import { useState, useCallback, type ReactNode } from 'react'
import { ChevronRight, ChevronDown } from 'lucide-react'
import { Spinner } from '@/components/ui/Spinner'
import { BarCell } from '@/components/ui/Table'

// ─── Column definition ────────────────────────────────────────────────────────

export interface ExpandableColumn<R> {
  key: string
  header: ReactNode
  /** If true, renders the expand toggle + color dot in this cell */
  first?: boolean
  right?: boolean
  last?: boolean
  /** Custom render — receives the row and level (0=root, 1=child, 2=grandchild, 3=leaf) */
  render?: (row: R, level: number) => ReactNode
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ExpandableTableProps<
  R extends object,
  C extends object = R,
  G extends object = C,
  L extends object = G,
> {
  columns: ExpandableColumn<R>[]
  rows: R[]
  rowKey: keyof R
  /** Color dot on the first column of root rows */
  rowColor?: (row: R, index: number) => string
  /** Max receita for BarCell width reference (optional) */
  recMax?: number

  // Level 2 — children
  getChildren?: (row: R) => Promise<C[]>
  childColumns?: ExpandableColumn<C>[]
  childRowKey?: keyof C

  // Level 3 — grandchildren
  getGrandchildren?: (child: C) => Promise<G[]>
  grandchildColumns?: ExpandableColumn<G>[]
  grandchildRowKey?: keyof G

  // Level 3 click — if no getLeaves, grandchild rows become clickable leaves
  onGrandchildClick?: (grandchild: G) => void

  // Level 4 — leaves (no expand)
  getLeaves?: (grandchild: G) => Promise<L[]>
  leafColumns?: ExpandableColumn<L>[]
  leafRowKey?: keyof L
  onLeafClick?: (leaf: L) => void

  footer?: ReactNode
}

// ─── Indent widths per level ─────────────────────────────────────────────────

const INDENT = [0, 20, 40, 56] // px left padding added per level

// ─── Loading state cell ───────────────────────────────────────────────────────

function LoadingRow({ colSpan }: { colSpan: number }) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        style={{
          padding: '8px 20px',
          borderBottom: '1px solid hsl(var(--border))',
        }}
      >
        <Spinner />
      </td>
    </tr>
  )
}

// ─── Generic row renderer ─────────────────────────────────────────────────────

interface RowProps<R extends object> {
  row: R
  rowKey: keyof R
  columns: ExpandableColumn<R>[]
  level: number
  color?: string
  parentColor?: string  // inherited color from parent to show mini dot on sub-levels
  expandable: boolean
  expanded: boolean
  loading: boolean
  clickable?: boolean
  onToggle?: () => void
  onClick?: () => void
}

function GenericRow<R extends object>({
  row,
  columns,
  level,
  color,
  parentColor,
  expandable,
  expanded,
  loading,
  clickable,
  onToggle,
  onClick,
}: RowProps<R>) {
  const [hovered, setHovered] = useState(false)

  const handleClick = () => {
    if (expandable) onToggle?.()
    else onClick?.()
  }

  // C1 — background with real contrast between levels
  const bgColor = hovered
    ? 'hsl(var(--muted) / 0.65)'
    : level === 0 ? ''
    : level === 1 ? 'hsl(var(--muted) / 0.45)'
    : level === 2 ? 'hsl(var(--muted) / 0.7)'
    : 'hsl(var(--muted) / 0.85)'

  return (
    <tr
      style={{ cursor: expandable || clickable ? 'pointer' : undefined, background: bgColor }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleClick}
    >
      {columns.map((col, ci) => {
        const isFirst = col.first || ci === 0
        const extraLeft = isFirst ? INDENT[level] : 0
        const basePadLeft = isFirst ? 20 : 14
        const basePadRight = col.last ? 20 : 14

        let cellContent: ReactNode

        if (col.render) {
          cellContent = col.render(row, level)
        } else {
          cellContent = (row as Record<string, unknown>)[col.key] as ReactNode
        }

        const inner = isFirst ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {/* Expand chevron or leaf spacer */}
            {expandable ? (
              loading ? (
                <Spinner style={{ flexShrink: 0 }} />
              ) : expanded ? (
                <ChevronDown size={13} style={{ flexShrink: 0, color: 'hsl(var(--muted-foreground))' }} />
              ) : (
                <ChevronRight size={13} style={{ flexShrink: 0, color: 'hsl(var(--muted-foreground))' }} />
              )
            ) : (
              // leaf or non-expandable: small dot spacer for alignment
              <span style={{ width: '13px', flexShrink: 0 }} />
            )}

            {/* C5 — Color dot: square 9px on root; circle 6px with opacity on sub-levels */}
            {color && <span style={{ width: '9px', height: '9px', borderRadius: '2px', background: color, flexShrink: 0 }} />}
            {!color && parentColor && level > 0 && (
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: parentColor, opacity: 0.5, flexShrink: 0 }} />
            )}

            {cellContent}
          </div>
        ) : cellContent

        // C2 — left border based on hierarchy level (tree line)
        const borderLeft = !isFirst ? undefined
          : level === 0 ? undefined
          : level === 1 ? '2px solid hsl(var(--border))'
          : level === 2 ? '2px solid hsl(var(--muted-foreground) / 0.35)'
          : '2px solid hsl(var(--primary) / 0.3)'

        // Subtract 2px from paddingLeft when borderLeft is present
        const adjustedPadLeft = isFirst && level > 0
          ? basePadLeft + extraLeft - 2
          : basePadLeft + extraLeft

        return (
          <td
            key={col.key}
            style={{
              paddingLeft: `${adjustedPadLeft}px`,
              paddingRight: `${basePadRight}px`,
              // C4 — reduced vertical padding on sub-levels
              paddingTop: level === 0 ? 'var(--row-pad-y)' : '7px',
              paddingBottom: level === 0 ? 'var(--row-pad-y)' : '7px',
              // C3 — typography with differentiated weight per level
              fontSize: level === 0 ? '13px' : '12px',
              fontWeight: level === 0 ? 600 : level === 1 ? 500 : 400,
              color: level >= 3 ? 'hsl(var(--muted-foreground))' : 'hsl(var(--foreground))',
              borderBottom: '1px solid hsl(var(--border))',
              // C2 — tree line border on first column
              borderLeft: isFirst ? borderLeft : undefined,
              verticalAlign: 'middle',
              fontVariantNumeric: col.right ? 'tabular-nums' : undefined,
              textAlign: col.right ? 'right' : undefined,
            }}
          >
            {inner}
          </td>
        )
      })}
    </tr>
  )
}

// ─── Cache type helpers ───────────────────────────────────────────────────────

type FetchState<T> = { status: 'idle' } | { status: 'loading' } | { status: 'done'; data: T[] } | { status: 'error' }

// ─── Main component ───────────────────────────────────────────────────────────

export function ExpandableTable<
  R extends object,
  C extends object = R,
  G extends object = C,
  L extends object = G,
>({
  columns,
  rows,
  rowKey,
  rowColor,
  getChildren,
  childColumns,
  childRowKey,
  getGrandchildren,
  grandchildColumns,
  grandchildRowKey,
  getLeaves,
  leafColumns,
  leafRowKey,
  onLeafClick,
  onGrandchildClick,
  footer,
}: ExpandableTableProps<R, C, G, L>) {
  // expanded set: keys as strings
  const [expandedL1, setExpandedL1] = useState<Set<string>>(new Set())
  const [expandedL2, setExpandedL2] = useState<Set<string>>(new Set())
  const [expandedL3, setExpandedL3] = useState<Set<string>>(new Set())

  // child data cache: rowKey string → FetchState
  const [childCache, setChildCache] = useState<Record<string, FetchState<C>>>({})
  const [grandchildCache, setGrandchildCache] = useState<Record<string, FetchState<G>>>({})
  const [leafCache, setLeafCache] = useState<Record<string, FetchState<L>>>({})

  const colSpan = columns.length

  // Effective columns for each level — fall back to root columns if not provided
  const eCols2 = (childColumns ?? columns) as unknown as ExpandableColumn<C>[]
  const eCols3 = (grandchildColumns ?? eCols2) as unknown as ExpandableColumn<G>[]
  const eCols4 = (leafColumns ?? eCols3) as unknown as ExpandableColumn<L>[]

  // ── Toggle helpers ──────────────────────────────────────────────────────────

  const toggleL1 = useCallback((key: string, row: R) => {
    setExpandedL1(prev => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
        // Lazy fetch if not yet fetched
        if (getChildren && (!childCache[key] || childCache[key].status === 'idle')) {
          setChildCache(c => ({ ...c, [key]: { status: 'loading' } }))
          getChildren(row).then(data => {
            setChildCache(c => ({ ...c, [key]: { status: 'done', data } }))
          }).catch(() => {
            setChildCache(c => ({ ...c, [key]: { status: 'error' } }))
          })
        }
      }
      return next
    })
  }, [getChildren, childCache])

  const toggleL2 = useCallback((key: string, child: C) => {
    setExpandedL2(prev => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
        if (getGrandchildren && (!grandchildCache[key] || grandchildCache[key].status === 'idle')) {
          setGrandchildCache(c => ({ ...c, [key]: { status: 'loading' } }))
          getGrandchildren(child).then(data => {
            setGrandchildCache(c => ({ ...c, [key]: { status: 'done', data } }))
          }).catch(() => {
            setGrandchildCache(c => ({ ...c, [key]: { status: 'error' } }))
          })
        }
      }
      return next
    })
  }, [getGrandchildren, grandchildCache])

  const toggleL3 = useCallback((key: string, grandchild: G) => {
    setExpandedL3(prev => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
        if (getLeaves && (!leafCache[key] || leafCache[key].status === 'idle')) {
          setLeafCache(c => ({ ...c, [key]: { status: 'loading' } }))
          getLeaves(grandchild).then(data => {
            setLeafCache(c => ({ ...c, [key]: { status: 'done', data } }))
          }).catch(() => {
            setLeafCache(c => ({ ...c, [key]: { status: 'error' } }))
          })
        }
      }
      return next
    })
  }, [getLeaves, leafCache])

  // ── Render rows ─────────────────────────────────────────────────────────────

  const renderRows = () => {
    const result: ReactNode[] = []

    rows.forEach((row, ri) => {
      const rk = String((row as Record<string, unknown>)[rowKey as string])
      const color = rowColor ? rowColor(row, ri) : undefined
      const isExpanded = expandedL1.has(rk)
      const childState = childCache[rk]
      const isLoading = childState?.status === 'loading'
      const hasChildren = !!getChildren

      result.push(
        <GenericRow
          key={`l1-${rk}`}
          row={row}
          rowKey={rowKey}
          columns={columns}
          level={0}
          color={color}
          expandable={hasChildren}
          expanded={isExpanded}
          loading={isLoading}
          onToggle={() => toggleL1(rk, row)}
        />
      )

      if (isExpanded && childState) {
        if (childState.status === 'loading') {
          result.push(<LoadingRow key={`l1-loading-${rk}`} colSpan={colSpan} />)
        } else if (childState.status === 'done') {
          childState.data.forEach(child => {
            const ck = String((child as Record<string, unknown>)[childRowKey as string ?? 'id'])
            const childExpanded = expandedL2.has(ck)
            const grandchildState = grandchildCache[ck]
            const childLoading = grandchildState?.status === 'loading'
            const hasGrandchildren = !!getGrandchildren

            result.push(
              <GenericRow
                key={`l2-${ck}`}
                row={child as unknown as R}
                rowKey={(childRowKey as unknown as keyof R) ?? rowKey}
                columns={eCols2 as unknown as ExpandableColumn<R>[]}
                level={1}
                parentColor={color}
                expandable={hasGrandchildren}
                expanded={childExpanded}
                loading={childLoading}
                onToggle={() => toggleL2(ck, child)}
              />
            )

            if (childExpanded && grandchildState) {
              if (grandchildState.status === 'loading') {
                result.push(<LoadingRow key={`l2-loading-${ck}`} colSpan={colSpan} />)
              } else if (grandchildState.status === 'done') {
                grandchildState.data.forEach(gc => {
                  const gk = String((gc as Record<string, unknown>)[grandchildRowKey as string ?? 'id'])
                  const gcExpanded = expandedL3.has(gk)
                  const leafState = leafCache[gk]
                  const gcLoading = leafState?.status === 'loading'
                  const hasLeaves = !!getLeaves

                  // If no getLeaves but onGrandchildClick provided — grandchild is the leaf
                  const gcIsLeaf = !hasLeaves && !!onGrandchildClick

                  result.push(
                    <GenericRow
                      key={`l3-${gk}`}
                      row={gc as unknown as R}
                      rowKey={(grandchildRowKey as unknown as keyof R) ?? rowKey}
                      columns={eCols3 as unknown as ExpandableColumn<R>[]}
                      level={2}
                      parentColor={color}
                      expandable={hasLeaves}
                      expanded={gcExpanded}
                      loading={gcLoading}
                      clickable={gcIsLeaf}
                      onToggle={() => toggleL3(gk, gc)}
                      onClick={gcIsLeaf ? () => onGrandchildClick(gc) : undefined}
                    />
                  )

                  if (gcExpanded && leafState) {
                    if (leafState.status === 'loading') {
                      result.push(<LoadingRow key={`l3-loading-${gk}`} colSpan={colSpan} />)
                    } else if (leafState.status === 'done') {
                      leafState.data.forEach(leaf => {
                        const lk = String((leaf as Record<string, unknown>)[leafRowKey as string ?? 'id'])
                        result.push(
                          <GenericRow
                            key={`l4-${lk}`}
                            row={leaf as unknown as R}
                            rowKey={(leafRowKey as unknown as keyof R) ?? rowKey}
                            columns={eCols4 as unknown as ExpandableColumn<R>[]}
                            level={3}
                            parentColor={color}
                            expandable={false}
                            expanded={false}
                            loading={false}
                            clickable={!!onLeafClick}
                            onClick={() => onLeafClick?.(leaf)}
                          />
                        )
                      })
                    } else if (leafState.status === 'error') {
                      result.push(
                        <tr key={`l3-err-${gk}`}>
                          <td colSpan={colSpan} style={{ padding: '8px 20px', color: 'hsl(var(--danger))', fontSize: '12px', borderBottom: '1px solid hsl(var(--border))' }}>
                            Erro ao carregar produtos.
                          </td>
                        </tr>
                      )
                    }
                  }
                })
              } else if (grandchildState.status === 'error') {
                result.push(
                  <tr key={`l2-err-${ck}`}>
                    <td colSpan={colSpan} style={{ padding: '8px 20px', color: 'hsl(var(--danger))', fontSize: '12px', borderBottom: '1px solid hsl(var(--border))' }}>
                      Erro ao carregar subgrupos.
                    </td>
                  </tr>
                )
              }
            }
          })
        } else if (childState.status === 'error') {
          result.push(
            <tr key={`l1-err-${rk}`}>
              <td colSpan={colSpan} style={{ padding: '8px 20px', color: 'hsl(var(--danger))', fontSize: '12px', borderBottom: '1px solid hsl(var(--border))' }}>
                Erro ao carregar grupos.
              </td>
            </tr>
          )
        }
      }
    })

    return result
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid hsl(var(--border))' }}>
            {columns.map((col, i) => (
              <th
                key={col.key}
                style={{
                  padding: '10px 14px',
                  paddingLeft:  (col.first || i === 0) ? '20px' : '14px',
                  paddingRight: col.last ? '20px' : '14px',
                  textAlign: col.right ? 'right' : 'left',
                  fontSize: '11px',
                  fontWeight: 500,
                  color: 'hsl(var(--muted-foreground))',
                  whiteSpace: 'nowrap',
                  letterSpacing: '0.1px',
                }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {renderRows()}
        </tbody>
        {footer}
      </table>
    </div>
  )
}

// Re-export BarCell so callers don't need to import from two places
export { BarCell }