// page-vendas.jsx
function PageVendas() {
  var expandedSeg = React.useState(null);
  var setExpandedSeg = expandedSeg[1]; expandedSeg = expandedSeg[0];
  var gran = React.useState('dia');
  var setGran = gran[1]; gran = gran[0];
  var d = window.MOCK.vendas;
  var r = d.resumo;

  return React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', padding: 'var(--space-6) var(--space-8)' } },
    // KPIs
    React.createElement('div', { style: { display: 'flex', gap: 'var(--space-4)' } },
      React.createElement(KpiCard, { label: 'Receita Bruta',  value: r.totais.receita_bruta,  delta: 8.7 }),
      React.createElement(KpiCard, { label: 'CMV',            value: r.totais.cmv,             sub: 'custo das mercadorias' }),
      React.createElement(KpiCard, { label: 'Margem Bruta',   value: r.totais.margem_bruta,   delta: 9.1 }),
      React.createElement(KpiCard, { label: 'Margem %',       value: r.totais.margem_pct,      format: 'pct' }),
      React.createElement(KpiCard, { label: 'Itens vendidos', value: r.totais.qtd_itens,       format: 'num', sub: 'transações' })
    ),
    // Evolução
    React.createElement(SectionCard, {
      title: 'Evolução de Receita',
      action: React.createElement('div', { style: { display: 'flex', background: 'var(--color-bg-muted)', borderRadius: 'var(--radius-sm)', padding: 2, gap: 2 } },
        ['dia','semana','mês'].map(function(g) {
          return React.createElement('button', {
            key: g, onClick: function() { setGran(g); },
            style: {
              padding: '3px 9px', borderRadius: 4, border: 'none', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: 11,
              background: gran === g ? 'var(--color-bg)' : 'transparent',
              color: gran === g ? 'var(--color-text)' : 'var(--color-text-muted)',
              fontWeight: gran === g ? 600 : 400, boxShadow: gran === g ? 'var(--shadow-xs)' : 'none',
            }
          }, g.charAt(0).toUpperCase() + g.slice(1));
        })
      )
    },
      React.createElement('div', { style: { padding: 'var(--space-4) var(--space-5) var(--space-2)' } },
        React.createElement(LineChart, {
          data: d.evolucao, xKey: 'label',
          yKeys: ['receita_bruta','margem_bruta'],
          colors: ['var(--color-primary)','var(--color-success)'],
          height: 220, formatY: fBRL,
        }),
        React.createElement(ChartLegend, { items: [{ color: 'var(--color-primary)', label: 'Receita Bruta' }, { color: 'var(--color-success)', label: 'Margem Bruta' }] })
      )
    ),
    // Breakdown
    React.createElement(SectionCard, { title: 'Breakdown por Segmento' },
      r.por_segmento.map(function(seg) {
        var color = SEG_COLORS[seg.segmento];
        var exp = expandedSeg === seg.segmento;
        return React.createElement('div', { key: seg.segmento },
          React.createElement('button', {
            onClick: function() { setExpandedSeg(exp ? null : seg.segmento); },
            style: {
              width: '100%', display: 'grid',
              gridTemplateColumns: '160px 1fr 110px 110px 90px 90px 28px',
              alignItems: 'center', gap: 14,
              padding: '0 var(--space-5)', height: 'var(--table-row-height)',
              background: exp ? 'var(--color-bg-subtle)' : 'transparent',
              border: 'none', borderBottom: '1px solid var(--color-border)',
              cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
            }
          },
            React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 8 } },
              React.createElement('span', { style: { width: 10, height: 10, borderRadius: 3, background: color, flexShrink: 0 } }),
              React.createElement('span', { style: { fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text)' } }, seg.label)
            ),
            React.createElement(HorizBar, { pct: seg.participacao_pct, color: color }),
            React.createElement('div', { style: { textAlign: 'right' } },
              React.createElement('div', { style: { fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text)', fontFamily: 'var(--font-mono)' } }, fBRL(seg.receita_bruta)),
              React.createElement('div', { style: { fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' } }, fPct(seg.participacao_pct) + ' do total')
            ),
            React.createElement('div', { style: { textAlign: 'right', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' } }, fBRL(seg.cmv)),
            React.createElement('div', { style: { textAlign: 'right', fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-success)', fontFamily: 'var(--font-mono)' } }, fPct(seg.margem_pct)),
            React.createElement('div', { style: { textAlign: 'right', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' } }, fBRL(seg.margem_bruta)),
            React.createElement('svg', { width: 13, height: 13, fill: 'none', stroke: 'var(--color-text-muted)', strokeWidth: 2, viewBox: '0 0 24 24', style: { transform: exp ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', justifySelf: 'center' } },
              React.createElement('path', { strokeLinecap: 'round', strokeLinejoin: 'round', d: 'M19 9l-7 7-7-7' })
            )
          ),
          exp && seg.segmento === 'combustivel' && React.createElement('div', { style: { background: 'var(--color-bg-subtle)', borderBottom: '1px solid var(--color-border)' } },
            React.createElement('div', { style: { padding: '8px var(--space-5) 4px 46px', fontSize: 10, color: 'var(--color-text-subtle)', textTransform: 'uppercase', letterSpacing: '0.06em' } }, 'Grupos — Combustível'),
            d.grupos_combustivel.map(function(g) {
              return React.createElement('div', { key: g.grupo_descricao,
                style: { display: 'grid', gridTemplateColumns: '160px 1fr 110px 110px 90px 90px 28px', alignItems: 'center', gap: 14, padding: '8px var(--space-5) 8px 46px', borderBottom: '1px solid var(--color-border)' }
              },
                React.createElement('div', { style: { fontSize: 12, color: 'var(--color-text)', paddingLeft: 18 } }, g.grupo_descricao),
                React.createElement(HorizBar, { pct: g.participacao_pct, color: color }),
                React.createElement('div', { style: { textAlign: 'right', fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--color-text)' } }, fBRL(g.receita_bruta)),
                React.createElement('div', { style: { textAlign: 'right', fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' } }, fBRL(g.cmv)),
                React.createElement('div', { style: { textAlign: 'right', fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--color-success)', fontWeight: 600 } }, fPct(g.margem_pct)),
                React.createElement('div', { style: { textAlign: 'right', fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' } }, fBRL(g.margem_bruta)),
                React.createElement('div')
              );
            })
          ),
          exp && seg.segmento !== 'combustivel' && React.createElement('div', { style: { background: 'var(--color-bg-subtle)', borderBottom: '1px solid var(--color-border)', padding: '14px 46px' } },
            React.createElement('span', { style: { fontSize: 12, color: 'var(--color-text-muted)' } }, 'Ver detalhes em Dashboard de ' + seg.label + '.')
          )
        );
      }),
      // Total row
      React.createElement('div', {
        style: { display: 'grid', gridTemplateColumns: '160px 1fr 110px 110px 90px 90px 28px', alignItems: 'center', gap: 14, padding: '0 var(--space-5)', height: 'var(--table-row-height)', background: 'var(--color-bg-subtle)' }
      },
        React.createElement('div', { style: { fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' } }, 'Total'),
        React.createElement('div'),
        React.createElement('div', { style: { textAlign: 'right', fontSize: 'var(--text-sm)', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-text)' } }, fBRL(r.totais.receita_bruta)),
        React.createElement('div', { style: { textAlign: 'right', fontSize: 'var(--text-sm)', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' } }, fBRL(r.totais.cmv)),
        React.createElement('div', { style: { textAlign: 'right', fontSize: 'var(--text-sm)', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-success)' } }, fPct(r.totais.margem_pct)),
        React.createElement('div', { style: { textAlign: 'right', fontSize: 'var(--text-sm)', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-text)' } }, fBRL(r.totais.margem_bruta)),
        React.createElement('div')
      )
    )
  );
}
Object.assign(window, { PageVendas });
