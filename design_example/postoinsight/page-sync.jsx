// page-sync.jsx
function PageSync() {
  var d = window.MOCK.sync;
  var expandedErr = React.useState(null); var setExpandedErr = expandedErr[1]; expandedErr = expandedErr[0];
  var syncing = React.useState(null); var setSyncing = syncing[1]; syncing = syncing[0];

  function doSync(id) {
    setSyncing(id);
    setTimeout(function() { setSyncing(null); }, 2500);
  }

  function fTime(iso) {
    if (!iso) return '—';
    var d = new Date(iso);
    return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' });
  }

  return React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', padding: 'var(--space-6) var(--space-8)' } },
    // Status cards per location
    React.createElement('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-4)' } },
      d.locations.map(function(loc) {
        var isSyncing = syncing === loc.id;
        var statusColor = loc.status === 'success' ? 'var(--color-success)' : loc.status === 'failed' ? 'var(--color-danger)' : 'var(--color-warning)';
        return React.createElement('div', { key: loc.id, style: {
          background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-5)', boxShadow: 'var(--shadow-xs)',
          borderTop: '3px solid ' + statusColor,
        }},
          React.createElement('div', { style: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 } },
            React.createElement('div', null,
              React.createElement('div', { style: { fontSize: 14, fontWeight: 600, color: 'var(--color-text)', marginBottom: 4 } }, loc.nome),
              React.createElement(StatusBadge, { status: loc.status === 'success' ? 'online' : loc.status === 'failed' ? 'offline' : 'warning' })
            ),
            React.createElement('button', {
              onClick: function() { doSync(loc.id); },
              disabled: isSyncing,
              style: {
                display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px',
                borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)',
                background: 'var(--color-bg)', color: 'var(--color-text-muted)', fontFamily: 'inherit',
                fontSize: 11, cursor: isSyncing ? 'not-allowed' : 'pointer', opacity: isSyncing ? 0.6 : 1,
              }
            },
              React.createElement('svg', { width: 11, height: 11, fill: 'none', stroke: 'currentColor', strokeWidth: 2, viewBox: '0 0 24 24', style: { animation: isSyncing ? 'spin 1s linear infinite' : 'none' } },
                React.createElement('path', { strokeLinecap: 'round', strokeLinejoin: 'round', d: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' })
              ),
              isSyncing ? 'Sincronizando…' : 'Sync'
            )
          ),
          React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 6 } },
            React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between' } },
              React.createElement('span', { style: { fontSize: 11, color: 'var(--color-text-muted)' } }, 'Última sync'),
              React.createElement('span', { style: { fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-text)' } }, fTime(loc.ultima_sync))
            ),
            React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between' } },
              React.createElement('span', { style: { fontSize: 11, color: 'var(--color-text-muted)' } }, 'Próxima sync'),
              React.createElement('span', { style: { fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-text)' } }, fTime(loc.proxima_sync))
            ),
            React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between' } },
              React.createElement('span', { style: { fontSize: 11, color: 'var(--color-text-muted)' } }, 'Registros'),
              React.createElement('span', { style: { fontSize: 11, fontFamily: 'var(--font-mono)', color: loc.registros > 0 ? 'var(--color-text)' : 'var(--color-danger)', fontWeight: 600 } }, fNum(loc.registros))
            ),
            loc.erro && React.createElement('div', { style: { marginTop: 4, fontSize: 11, color: 'var(--color-danger)', background: 'var(--color-danger-subtle)', borderRadius: 'var(--radius-sm)', padding: '4px 8px', lineHeight: 1.4 } }, loc.erro)
          )
        );
      })
    ),
    // History table
    React.createElement(SectionCard, { title: 'Histórico de Sincronizações' },
      // Header
      React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '1fr 160px 160px 80px 90px 100px 24px', gap: 12, padding: '0 var(--space-5)', height: 36, alignItems: 'center', background: 'var(--color-bg-subtle)', borderBottom: '1px solid var(--color-border)' } },
        ['Unidade','Início','Fim','Duração','Registros','Status',''].map(function(h, i) {
          return React.createElement('div', { key: h+i, style: { fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: i >= 3 ? 'right' : 'left' } }, h);
        })
      ),
      d.historico.map(function(row, idx) {
        var hasErr = row.status === 'failed' && row.erro;
        var isExp = expandedErr === row.id;
        return React.createElement('div', { key: row.id },
          React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '1fr 160px 160px 80px 90px 100px 24px', gap: 12, padding: '0 var(--space-5)', height: 'var(--table-row-height)', alignItems: 'center', borderBottom: '1px solid var(--color-border)', background: isExp ? 'var(--color-bg-subtle)' : 'transparent' } },
            React.createElement('div', { style: { fontSize: 13, color: 'var(--color-text)', fontWeight: 500 } }, row.location),
            React.createElement('div', { style: { fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', textAlign: 'right' } }, fTime(row.inicio)),
            React.createElement('div', { style: { fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', textAlign: 'right' } }, fTime(row.fim)),
            React.createElement('div', { style: { fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', textAlign: 'right' } }, row.duracao),
            React.createElement('div', { style: { fontSize: 12, fontFamily: 'var(--font-mono)', color: row.registros > 0 ? 'var(--color-text)' : 'var(--color-danger)', textAlign: 'right', fontWeight: row.registros > 0 ? 500 : 700 } }, fNum(row.registros)),
            React.createElement('div', { style: { textAlign: 'right' } }, React.createElement(StatusBadge, { status: row.status })),
            hasErr ? React.createElement('button', {
              onClick: function() { setExpandedErr(isExp ? null : row.id); },
              style: { background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-danger)', padding: 2 }
            },
              React.createElement('svg', { width: 13, height: 13, fill: 'none', stroke: 'currentColor', strokeWidth: 2, viewBox: '0 0 24 24', style: { transform: isExp ? 'rotate(180deg)' : 'none' } },
                React.createElement('path', { strokeLinecap: 'round', strokeLinejoin: 'round', d: 'M19 9l-7 7-7-7' })
              )
            ) : React.createElement('div')
          ),
          isExp && hasErr && React.createElement('div', { style: { padding: '10px var(--space-5)', background: 'var(--color-danger-subtle)', borderBottom: '1px solid var(--color-border)' } },
            React.createElement('span', { style: { fontSize: 12, color: 'var(--color-danger)', fontFamily: 'var(--font-mono)' } }, row.erro)
          )
        );
      })
    )
  );
}
Object.assign(window, { PageSync });
