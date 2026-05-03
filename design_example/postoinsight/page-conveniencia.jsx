// page-conveniencia.jsx
function PageConveniencia() {
  var expSeg = React.useState(null); var setExpSeg = expSeg[1]; expSeg = expSeg[0];
  var expCat = React.useState(null); var setExpCat = expCat[1]; expCat = expCat[0];
  var d = window.MOCK.conveniencia;
  var r = d.resumo;

  return React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', padding: 'var(--space-6) var(--space-8)' } },
    React.createElement('div', { style: { display: 'flex', gap: 'var(--space-4)' } },
      React.createElement(KpiCard, { label: 'Receita Bruta',  value: r.totais.receita_bruta,  delta: 8.6 }),
      React.createElement(KpiCard, { label: 'CMV',            value: r.totais.cmv }),
      React.createElement(KpiCard, { label: 'Margem Bruta',   value: r.totais.margem_bruta,   delta: 5.1 }),
      React.createElement(KpiCard, { label: 'Margem %',       value: r.totais.margem_pct,     format: 'pct' }),
      React.createElement(KpiCard, { label: 'Itens vendidos', value: r.totais.qtd_itens,      format: 'num' })
    ),
    React.createElement(SectionCard, { title: 'Evolução — Receita de Loja' },
      React.createElement('div', { style: { padding: 'var(--space-4) var(--space-5) var(--space-2)' } },
        React.createElement(LineChart, {
          data: d.evolucao, xKey: 'label',
          yKeys: ['receita_bruta','margem_bruta'],
          colors: ['#D97706','#16A34A'], height: 200, formatY: fBRL,
        }),
        React.createElement(ChartLegend, { items: [{ color: '#D97706', label: 'Receita Bruta' }, { color: '#16A34A', label: 'Margem Bruta' }] })
      )
    ),
    React.createElement(SectionCard, { title: 'Breakdown por Segmento' },
      r.por_segmento.map(function(seg) {
        var color = SEG_COLORS[seg.segmento];
        var segExp = expSeg === seg.segmento;
        return React.createElement('div', { key: seg.segmento },
          // Segment row
          React.createElement('button', {
            onClick: function() { setExpSeg(segExp ? null : seg.segmento); setExpCat(null); },
            style: {
              width: '100%', display: 'grid', gridTemplateColumns: '160px 1fr 110px 90px 90px 28px',
              alignItems: 'center', gap: 14, padding: '0 var(--space-5)', height: 'var(--table-row-height)',
              background: segExp ? 'var(--color-bg-subtle)' : 'transparent',
              border: 'none', borderBottom: '1px solid var(--color-border)', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
            }
          },
            React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 8 } },
              React.createElement('span', { style: { width: 10, height: 10, borderRadius: 3, background: color, flexShrink: 0 } }),
              React.createElement('span', { style: { fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text)' } }, seg.label)
            ),
            React.createElement(HorizBar, { pct: seg.participacao_pct, color: color }),
            React.createElement('div', { style: { textAlign: 'right' } },
              React.createElement('div', { style: { fontSize: 'var(--text-sm)', fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--color-text)' } }, fBRL(seg.receita_bruta)),
              React.createElement('div', { style: { fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' } }, fPct(seg.participacao_pct))
            ),
            React.createElement('div', { style: { textAlign: 'right', fontSize: 'var(--text-sm)', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-success)' } }, fPct(seg.margem_pct)),
            React.createElement('div', { style: { textAlign: 'right', fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' } }, fBRL(seg.cmv)),
            React.createElement('svg', { width: 13, height: 13, fill: 'none', stroke: 'var(--color-text-muted)', strokeWidth: 2, viewBox: '0 0 24 24', style: { transform: segExp ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', justifySelf: 'center' } },
              React.createElement('path', { strokeLinecap: 'round', strokeLinejoin: 'round', d: 'M19 9l-7 7-7-7' })
            )
          ),
          // Categories
          segExp && seg.categorias && seg.categorias.map(function(cat) {
            var catExp = expCat === cat.codigo;
            return React.createElement('div', { key: cat.codigo, style: { background: 'var(--color-bg-subtle)' } },
              React.createElement('button', {
                onClick: function() { setExpCat(catExp ? null : cat.codigo); },
                style: {
                  width: '100%', display: 'grid', gridTemplateColumns: '160px 1fr 110px 90px 90px 28px',
                  alignItems: 'center', gap: 14, padding: '0 var(--space-5) 0 44px', height: 40,
                  background: catExp ? 'var(--color-bg-muted)' : 'transparent',
                  border: 'none', borderBottom: '1px solid var(--color-border)', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                }
              },
                React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 7 } },
                  React.createElement('span', { style: { fontSize: 9, fontWeight: 700, color: color, background: color + '22', padding: '1px 5px', borderRadius: 3 } }, cat.codigo),
                  React.createElement('span', { style: { fontSize: 12, color: 'var(--color-text)' } }, cat.descricao)
                ),
                React.createElement(HorizBar, { pct: cat.participacao_pct, color: color }),
                React.createElement('div', { style: { textAlign: 'right', fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--color-text)', fontWeight: 600 } }, fBRL(cat.receita_bruta)),
                React.createElement('div', { style: { textAlign: 'right', fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--color-success)', fontWeight: 600 } }, fPct(cat.margem_pct)),
                React.createElement('div', { style: { textAlign: 'right', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' } }, fPct(cat.participacao_pct)),
                React.createElement('svg', { width: 12, height: 12, fill: 'none', stroke: 'var(--color-text-muted)', strokeWidth: 2, viewBox: '0 0 24 24', style: { transform: catExp ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', justifySelf: 'center' } },
                  React.createElement('path', { strokeLinecap: 'round', strokeLinejoin: 'round', d: 'M19 9l-7 7-7-7' })
                )
              ),
              catExp && React.createElement('div', { style: { padding: '8px 20px 8px 60px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-muted)' } },
                [['Produto A', 4200, 91],['Produto B', 3800, 89],['Produto C', 2600, 88]].map(function(row, i) {
                  return React.createElement('div', { key: i, style: { display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: i < 2 ? '1px solid var(--color-border)' : 'none' } },
                    React.createElement('span', { style: { fontSize: 11, color: 'var(--color-text-muted)' } }, row[0]),
                    React.createElement('div', { style: { display: 'flex', gap: 20 } },
                      React.createElement('span', { style: { fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-text)' } }, fBRL(row[1])),
                      React.createElement('span', { style: { fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-success)' } }, row[2] + '%')
                    )
                  );
                })
              )
            );
          })
        );
      }),
      React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '160px 1fr 110px 90px 90px 28px', alignItems: 'center', gap: 14, padding: '0 var(--space-5)', height: 'var(--table-row-height)', background: 'var(--color-bg-subtle)' } },
        React.createElement('div', { style: { fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' } }, 'Total Loja'),
        React.createElement('div'),
        React.createElement('div', { style: { textAlign: 'right', fontSize: 'var(--text-sm)', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-text)' } }, fBRL(r.totais.receita_bruta)),
        React.createElement('div', { style: { textAlign: 'right', fontSize: 'var(--text-sm)', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-success)' } }, fPct(r.totais.margem_pct)),
        React.createElement('div'),
        React.createElement('div')
      )
    )
  );
}
Object.assign(window, { PageConveniencia });
