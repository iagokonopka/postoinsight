// layout.jsx — PostoInsight design system v3
// DM Sans (UI) + Source Sans 3 (números) · Topbar escura · Sidebar retrátil

// ── Token helpers ──────────────────────────────────────────────────────────
const SEG_COLORS = {
  combustivel:   'var(--color-segment-combustivel)',
  lubrificantes: 'var(--color-segment-lubrificantes)',
  servicos:      'var(--color-segment-servicos)',
  conveniencia:  'var(--color-segment-conveniencia)',
};

const SEG_COLORS_HEX = {
  combustivel:   '#0073BB',
  lubrificantes: '#6B40C4',
  servicos:      '#1D8102',
  conveniencia:  '#EC7211',
};

function fBRL(v) {
  if (v == null) return '—';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);
}
function fNum(v, d) {
  if (v == null) return '—';
  d = d == null ? 0 : d;
  return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d }).format(v);
}
function fPct(v, d) {
  d = d == null ? 1 : d;
  if (v == null) return '—';
  return fNum(v, d) + '%';
}
function fLitros(v) { return fNum(v) + ' L'; }

// ── NAV ────────────────────────────────────────────────────────────────────
const NAV = [
  { section: 'Análise', items: [
    { id: 'dashboard',    label: 'Visão Geral',   icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { id: 'combustivel',  label: 'Combustível',   icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
    { id: 'conveniencia', label: 'Conveniência',  icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' },
    { id: 'dre',          label: 'DRE Mensal',    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  ]},
  { section: 'Operação', items: [
    { id: 'sync',         label: 'Sincronização', icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' },
  ]},
  { section: null, items: [
    { id: 'settings',     label: 'Configurações', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
  ]},
];

// ── TOPBAR ─────────────────────────────────────────────────────────────────
function Topbar({ periodo, onPeriodo, location, onLocation, onSyncNow, sidebarCollapsed, onToggleSidebar }) {
  var periodos = [
    { id: 'hoje', label: 'Hoje' },
    { id: 'semana', label: 'Semana' },
    { id: 'mes', label: 'Mês' },
    { id: 'mes_anterior', label: 'Mês anterior' },
  ];

  return React.createElement('header', {
    style: {
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 30,
      height: 'var(--topbar-height)',
      background: 'var(--color-topbar)',
      display: 'flex', alignItems: 'center',
      padding: '0 16px',
      gap: 8,
    }
  },
    // Sidebar toggle
    React.createElement('button', {
      onClick: onToggleSidebar,
      style: {
        background: 'transparent', border: 'none', cursor: 'pointer',
        color: 'var(--color-topbar-muted)', padding: '4px 6px',
        borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center',
        marginRight: 6,
      }
    },
      React.createElement('svg', { width: 16, height: 16, fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, viewBox: '0 0 24 24' },
        React.createElement('path', { strokeLinecap: 'round', strokeLinejoin: 'round', d: 'M4 6h16M4 12h16M4 18h16' })
      )
    ),

    // Logo
    React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 8, marginRight: 20 } },
      React.createElement('div', { style: {
        width: 26, height: 26, borderRadius: 'var(--radius-sm)',
        background: 'var(--color-cta)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }},
        React.createElement('svg', { width: 13, height: 13, fill: 'none', stroke: 'white', strokeWidth: 2.5, viewBox: '0 0 24 24' },
          React.createElement('path', { strokeLinecap: 'round', strokeLinejoin: 'round', d: 'M13 10V3L4 14h7v7l9-11h-7z' })
        )
      ),
      React.createElement('span', { style: { fontSize: 14, fontWeight: 600, color: '#fff', letterSpacing: '-0.01em' } }, window.MOCK.APP_NAME)
    ),

    // Period selector
    React.createElement('div', { style: { display: 'flex', gap: 2, alignItems: 'center' } },
      periodos.map(function(p) {
        var active = periodo === p.id;
        return React.createElement('button', {
          key: p.id, onClick: function() { onPeriodo(p.id); },
          style: {
            padding: '4px 12px', borderRadius: 'var(--radius-sm)',
            border: active ? '1px solid rgba(255,255,255,.3)' : '1px solid transparent',
            background: active ? 'rgba(255,255,255,.12)' : 'transparent',
            color: active ? '#fff' : 'var(--color-topbar-muted)',
            fontSize: 13, fontWeight: active ? 500 : 400,
            cursor: 'pointer', fontFamily: 'inherit',
            transition: 'all .1s',
          }
        }, p.label);
      })
    ),

    React.createElement('div', { style: { flex: 1 } }),

    // Location selector
    React.createElement('div', {
      style: {
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '4px 10px',
        border: '1px solid rgba(255,255,255,.15)',
        borderRadius: 'var(--radius-sm)',
        cursor: 'pointer',
      }
    },
      React.createElement('span', { style: { width: 6, height: 6, borderRadius: '50%', background: 'var(--color-success)', display: 'inline-block' } }),
      React.createElement('select', {
        value: location, onChange: function(e) { onLocation(e.target.value); },
        style: {
          background: 'transparent', border: 'none',
          color: '#fff', fontFamily: 'inherit', fontSize: 12,
          cursor: 'pointer', outline: 'none', appearance: 'none',
          paddingRight: 16,
        }
      },
        React.createElement('option', { value: 'all', style: { color: '#16191F', background: '#fff' } }, 'Todas as unidades'),
        window.MOCK.LOCATIONS.map(function(l) {
          return React.createElement('option', { key: l.id, value: l.id, style: { color: '#16191F', background: '#fff' } }, l.nome);
        })
      ),
      React.createElement('svg', { width: 10, height: 10, viewBox: '0 0 10 10', fill: 'none', stroke: 'rgba(255,255,255,.5)', strokeWidth: 1.8, style: { pointerEvents: 'none', marginLeft: -14 } },
        React.createElement('path', { strokeLinecap: 'round', d: 'M2 4l3 3 3-3' })
      )
    ),

    // Sync button — neutral, not orange
    React.createElement('button', {
      onClick: onSyncNow,
      style: {
        display: 'flex', alignItems: 'center', gap: 5,
        padding: '4px 12px',
        border: '1px solid rgba(255,255,255,.15)',
        borderRadius: 'var(--radius-sm)',
        background: 'transparent',
        color: 'rgba(255,255,255,.7)',
        fontSize: 12, cursor: 'pointer',
        fontFamily: 'inherit',
        transition: 'all .1s',
      }
    },
      React.createElement('svg', { width: 12, height: 12, fill: 'none', stroke: 'currentColor', strokeWidth: 2, viewBox: '0 0 24 24' },
        React.createElement('path', { strokeLinecap: 'round', strokeLinejoin: 'round', d: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' })
      ),
      'Sincronizar'
    ),

    // Avatar — orange CTA
    React.createElement('div', { style: {
      width: 30, height: 30, borderRadius: '50%',
      background: 'var(--color-cta)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 11, fontWeight: 700, color: '#fff', cursor: 'pointer',
      marginLeft: 4,
    }}, 'IK')
  );
}

// ── SIDEBAR ────────────────────────────────────────────────────────────────
function Sidebar({ page, onNavigate, theme, onThemeToggle, collapsed }) {
  var syncLoc = window.MOCK.sync.locations;
  var hasOffline = syncLoc.some(function(l) { return l.status === 'failed'; });

  if (collapsed) return null;

  return React.createElement('aside', {
    style: {
      width: 'var(--sidebar-width)', minHeight: '100vh',
      background: 'var(--color-bg)',
      borderRight: '1px solid var(--color-border)',
      display: 'flex', flexDirection: 'column',
      position: 'fixed',
      top: 'var(--topbar-height)', left: 0, bottom: 0,
      zIndex: 20, overflowY: 'auto',
    }
  },
    // App title in sidebar
    React.createElement('div', { style: { padding: '16px var(--space-4) 12px', borderBottom: '1px solid var(--color-border-subtle)' } },
      React.createElement('div', { style: { fontSize: 14, fontWeight: 600, color: 'var(--color-text)', letterSpacing: '-0.01em' } }, window.MOCK.APP_NAME),
      React.createElement('div', { style: { fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 } }, 'Rede JAM · 4 unidades')
    ),

    // Nav
    React.createElement('nav', { style: { flex: 1, padding: '8px 0' } },
      NAV.map(function(group, gi) {
        return React.createElement('div', { key: gi, style: { marginBottom: 2 } },
          group.section && React.createElement('div', {
            style: {
              fontSize: 10, fontWeight: 600,
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '.08em',
              padding: '10px 16px 4px',
            }
          }, group.section),
          group.items.map(function(item) {
            var active = page === item.id;
            return React.createElement('button', {
              key: item.id,
              onClick: function() { onNavigate(item.id); },
              style: {
                width: '100%', display: 'flex', alignItems: 'center', gap: 0,
                padding: '0 16px', height: 32,
                border: 'none', textAlign: 'left', fontFamily: 'inherit',
                fontSize: 13,
                fontWeight: active ? 500 : 400,
                background: active ? 'var(--color-primary-subtle)' : 'transparent',
                color: active ? 'var(--color-primary)' : 'var(--color-text-muted)',
                borderLeft: '3px solid ' + (active ? 'var(--color-primary)' : 'transparent'),
                cursor: 'pointer',
                transition: 'all .1s',
              }
            }, item.label);
          })
        );
      })
    ),

    // Footer
    React.createElement('div', { style: { padding: '12px 16px', borderTop: '1px solid var(--color-border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' } },
      React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 6 } },
        React.createElement('span', { style: { width: 6, height: 6, borderRadius: '50%', background: hasOffline ? 'var(--color-warning)' : 'var(--color-success)', display: 'inline-block' } }),
        React.createElement('span', { style: { fontSize: 11, color: 'var(--color-text-muted)' } }, hasOffline ? '1 offline' : 'Sync OK')
      ),
      React.createElement('button', {
        onClick: onThemeToggle,
        style: { background: 'transparent', border: 'none', color: 'var(--color-text-muted)', padding: 4, borderRadius: 'var(--radius-sm)', cursor: 'pointer' },
      },
        React.createElement('svg', { width: 14, height: 14, fill: 'none', stroke: 'currentColor', strokeWidth: 2, viewBox: '0 0 24 24' },
          theme === 'dark'
            ? React.createElement('path', { strokeLinecap: 'round', strokeLinejoin: 'round', d: 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z' })
            : React.createElement('path', { strokeLinecap: 'round', strokeLinejoin: 'round', d: 'M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z' })
        )
      )
    )
  );
}

// ── PAGE HEADER (breadcrumb + title) ───────────────────────────────────────
function Header({ title, subtitle }) {
  return React.createElement('div', {
    style: {
      padding: '20px var(--space-8) 0',
    }
  },
    React.createElement('h1', { style: { fontSize: 18, fontWeight: 500, color: 'var(--color-text)', margin: '0 0 2px', letterSpacing: '-0.01em' } }, title),
    subtitle && React.createElement('p', { style: { fontSize: 11, color: 'var(--color-text-muted)', margin: 0 } }, subtitle)
  );
}

// ── KPI CARD ───────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, delta, format, accent }) {
  var formatted = format === 'pct' ? fPct(value, 2)
    : format === 'num' ? fNum(value)
    : format === 'litros' ? fLitros(value)
    : fBRL(value);

  var deltaEl = null;
  if (delta != null) {
    var pos = delta >= 0;
    deltaEl = React.createElement('span', {
      style: {
        fontSize: 11, fontWeight: 600,
        color: pos ? 'var(--color-success)' : 'var(--color-danger)',
        background: pos ? 'var(--color-success-subtle)' : 'var(--color-danger-subtle)',
        padding: '2px 6px', borderRadius: 'var(--radius-sm)',
      }
    }, (pos ? '+' : '') + fNum(delta, 1) + '%');
  }

  return React.createElement('div', {
    style: {
      background: 'var(--color-bg)',
      borderRadius: 'var(--radius-md)',
      padding: 'var(--space-5)',
      flex: 1, minWidth: 0,
      boxShadow: 'var(--shadow-sm)',
      borderTop: accent ? '2px solid ' + accent : 'none',
    }
  },
    React.createElement('div', { style: { fontSize: 10, color: 'var(--color-text-muted)', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.08em' } }, label),
    React.createElement('div', { style: { fontSize: 30, fontWeight: 600, color: 'var(--color-text)', letterSpacing: '-0.02em', fontFamily: 'var(--font-mono)', marginBottom: 6, lineHeight: 1 } }, formatted),
    React.createElement('div', { style: { display: 'flex', gap: 8, alignItems: 'center' } },
      sub && React.createElement('span', { style: { fontSize: 11, color: 'var(--color-text-subtle)', fontWeight: 400 } }, sub),
      deltaEl
    )
  );
}

// ── SECTION CARD ───────────────────────────────────────────────────────────
function SectionCard({ title, action, children, style: s }) {
  return React.createElement('div', {
    style: Object.assign({
      background: 'var(--color-bg)',
      borderRadius: 'var(--radius-md)',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-sm)',
    }, s || {})
  },
    title && React.createElement('div', {
      style: {
        padding: '12px var(--space-5)',
        borderBottom: '1px solid var(--color-border-subtle)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--color-bg-subtle)',
      }
    },
      React.createElement('span', { style: { fontSize: 10, fontWeight: 600, color: 'var(--color-text)', textTransform: 'uppercase', letterSpacing: '.08em' } }, title),
      action || null
    ),
    children
  );
}

// ── LINE CHART ─────────────────────────────────────────────────────────────
function LineChart({ data, xKey, yKeys, colors, height, formatY, showArea }) {
  var H = height || 200;
  var W = 800;
  var P = { t: 14, r: 12, b: 28, l: 62 };
  var cW = W - P.l - P.r;
  var cH = H - P.t - P.b;
  var hoverState = React.useState(null);
  var setHover = hoverState[1];
  var hover = hoverState[0];

  if (!data || data.length === 0) return null;
  var allVals = data.reduce(function(a, d) {
    yKeys.forEach(function(k) { a.push(d[k] || 0); });
    return a;
  }, []);
  var maxVal = Math.max.apply(null, allVals) * 1.1 || 1;

  function xPos(i) { return P.l + (i / (data.length - 1)) * cW; }
  function yPos(v) { return P.t + cH - (v / maxVal) * cH; }

  var fmt = formatY || fBRL;
  var yTicks = [0, 0.25, 0.5, 0.75, 1].map(function(t) { return t * maxVal; });

  return React.createElement('div', { style: { position: 'relative' } },
    React.createElement('svg', {
      viewBox: '0 0 ' + W + ' ' + H,
      style: { width: '100%', height: H, display: 'block' },
      onMouseLeave: function() { setHover(null); }
    },
      React.createElement('defs', null,
        yKeys.map(function(k, ki) {
          return React.createElement('linearGradient', { key: k, id: 'pi-grad-' + ki, x1: '0', y1: '0', x2: '0', y2: '1' },
            React.createElement('stop', { offset: '0%', stopColor: colors[ki], stopOpacity: '0.15' }),
            React.createElement('stop', { offset: '100%', stopColor: colors[ki], stopOpacity: '0' })
          );
        })
      ),
      // Grid lines
      yTicks.map(function(t, i) {
        return React.createElement('g', { key: i },
          React.createElement('line', { x1: P.l, y1: yPos(t), x2: W - P.r, y2: yPos(t), stroke: 'var(--color-border-subtle)', strokeWidth: 1 }),
          React.createElement('text', { x: P.l - 6, y: yPos(t) + 4, textAnchor: 'end', fontSize: 9, fill: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }, fmt(t))
        );
      }),
      // Lines + areas
      yKeys.map(function(k, ki) {
        var pts = data.map(function(d, i) { return [xPos(i), yPos(d[k] || 0)]; });
        var lp = pts.map(function(p, i) { return (i === 0 ? 'M' : 'L') + p[0] + ',' + p[1]; }).join(' ');
        var ap = lp + ' L' + pts[pts.length - 1][0] + ',' + (P.t + cH) + ' L' + pts[0][0] + ',' + (P.t + cH) + ' Z';
        return React.createElement('g', { key: k },
          showArea !== false && React.createElement('path', { d: ap, fill: 'url(#pi-grad-' + ki + ')' }),
          React.createElement('path', { d: lp, fill: 'none', stroke: colors[ki], strokeWidth: 1.75, strokeLinecap: 'round', strokeLinejoin: 'round' })
        );
      }),
      // X labels
      data.map(function(d, i) {
        if (data.length > 14 && i % Math.ceil(data.length / 10) !== 0) return null;
        return React.createElement('text', { key: i, x: xPos(i), y: H - 4, textAnchor: 'middle', fontSize: 9, fill: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }, d[xKey]);
      }),
      // Hover zones
      data.map(function(d, i) {
        return React.createElement('rect', { key: 'h' + i, x: xPos(i) - (cW / data.length) / 2, y: P.t, width: cW / data.length, height: cH, fill: 'transparent', onMouseEnter: function() { setHover({ idx: i, x: xPos(i), d: d }); } });
      }),
      hover && React.createElement('g', null,
        React.createElement('line', { x1: hover.x, y1: P.t, x2: hover.x, y2: P.t + cH, stroke: 'var(--color-border)', strokeWidth: 1, strokeDasharray: '3 3' }),
        yKeys.map(function(k, ki) {
          return React.createElement('circle', { key: k, cx: hover.x, cy: yPos(hover.d[k] || 0), r: 3.5, fill: colors[ki], stroke: 'var(--color-bg)', strokeWidth: 2 });
        })
      )
    ),
    hover && React.createElement('div', {
      style: {
        position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
        background: 'var(--color-bg)', border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)', padding: '8px 12px', fontSize: 11,
        pointerEvents: 'none', whiteSpace: 'nowrap', zIndex: 10,
        boxShadow: 'var(--shadow-md)',
      }
    },
      React.createElement('div', { style: { fontWeight: 700, marginBottom: 4, color: 'var(--color-text)', fontSize: 11 } }, hover.d[xKey]),
      yKeys.map(function(k, ki) {
        return React.createElement('div', { key: k, style: { display: 'flex', gap: 8, alignItems: 'center', marginBottom: 2 } },
          React.createElement('span', { style: { width: 10, height: 2, borderRadius: 1, background: colors[ki], display: 'inline-block' } }),
          React.createElement('span', { style: { color: 'var(--color-text-muted)', fontSize: 10 } }, k + ':'),
          React.createElement('span', { style: { fontFamily: 'var(--font-mono)', color: 'var(--color-text)', fontWeight: 600 } }, fmt(hover.d[k]))
        );
      })
    )
  );
}

// ── HORIZ BAR ──────────────────────────────────────────────────────────────
function HorizBar({ pct, color }) {
  return React.createElement('div', { style: { height: 4, background: 'var(--color-bg-muted)', borderRadius: 2, overflow: 'hidden', flex: 1 } },
    React.createElement('div', { style: { height: '100%', width: pct + '%', background: color, borderRadius: 2 } })
  );
}

// ── STATUS BADGE ───────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  var cfg = {
    success: { label: 'Concluído', bg: 'var(--color-success-subtle)', color: 'var(--color-success)' },
    failed:  { label: 'Falhou',    bg: 'var(--color-danger-subtle)',   color: 'var(--color-danger)' },
    running: { label: 'Em andamento', bg: 'var(--color-info-subtle)', color: 'var(--color-info)' },
    warning: { label: 'Alerta',    bg: 'var(--color-warning-subtle)', color: 'var(--color-warning)' },
    online:  { label: 'Online',    bg: 'var(--color-success-subtle)', color: 'var(--color-success)' },
    offline: { label: 'Offline',   bg: 'var(--color-danger-subtle)',  color: 'var(--color-danger)' },
  };
  var c = cfg[status] || cfg.warning;
  return React.createElement('span', {
    style: {
      display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px',
      borderRadius: 100, fontSize: 11, fontWeight: 600,
      background: c.bg, color: c.color,
    }
  }, c.label);
}

function ChartLegend({ items }) {
  return React.createElement('div', { style: { display: 'flex', gap: 14, justifyContent: 'flex-end', padding: '6px 0 2px', flexWrap: 'wrap' } },
    items.map(function(item, i) {
      return React.createElement('div', { key: i, style: { display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--color-text-muted)' } },
        React.createElement('span', { style: { width: 12, height: 2, borderRadius: 1, background: item.color, display: 'inline-block' } }),
        item.label
      );
    })
  );
}

Object.assign(window, { SEG_COLORS, SEG_COLORS_HEX, fBRL, fNum, fPct, fLitros, Topbar, Sidebar, Header, KpiCard, SectionCard, LineChart, HorizBar, StatusBadge, ChartLegend });
