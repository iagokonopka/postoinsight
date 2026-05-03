// page-combustivel.jsx
function PageCombustivel() {
  var showArla = React.useState(false);
  var setShowArla = showArla[1]; showArla = showArla[0];
  var metric = React.useState('volume');
  var setMetric = metric[1]; metric = metric[0];
  var d = window.MOCK.combustivel;
  var r = d.resumo;
  var PCOLS = { 'Gasolina Comum': '#2563EB', 'Diesel S-10': '#7C3AED', 'Etanol': '#16A34A', 'Arla 32': '#0891B2' };
  var produtos = r.por_produto;
  var visiveis = showArla ? produtos : produtos.filter(function(p) { return p.grupo_descricao !== 'Arla 32'; });
  var maxVol = Math.max.apply(null, produtos.map(function(p) { return p.volume_litros; }));

  var evoData = d.evolucao.map(function(row) {
    var out = { label: row.label };
    visiveis.forEach(function(p) { out[p.grupo_descricao] = metric === 'volume' ? (row[p.grupo_descricao] || 0) : Math.round((row[p.grupo_descricao] || 0) * p.preco_medio_litro); });
    return out;
  });

  return React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', padding: 'var(--space-6) var(--space-8)' } },
    React.createElement('div', { style: { display: 'flex', gap: 'var(--space-4)' } },
      React.createElement(KpiCard, { label: 'Volume Total',   value: r.totais.volume_litros, format: 'litros', delta: 3.2, accent: '#2563EB' }),
      React.createElement(KpiCard, { label: 'Receita Bruta',  value: r.totais.receita_bruta, delta: 8.8 }),
      React.createElement(KpiCard, { label: 'CMV',            value: r.totais.cmv }),
      React.createElement(KpiCard, { label: 'Margem Bruta',   value: r.totais.margem_bruta,  delta: 9.6 }),
      React.createElement(KpiCard, { label: 'Margem %',       value: r.totais.margem_pct,    format: 'pct' })
    ),
    React.createElement(SectionCard, {
      title: 'Evolução por Produto',
      action: React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 8 } },
        React.createElement('div', { style: { display: 'flex', background: 'var(--color-bg-muted)', borderRadius: 'var(--radius-sm)', padding: 2, gap: 2 } },
          [['volume','Volume (L)'],['receita','Receita']].map(function(pair) {
            return React.createElement('button', { key: pair[0], onClick: function() { setMetric(pair[0]); },
              style: { padding: '3px 9px', borderRadius: 4, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 11, background: metric === pair[0] ? 'var(--color-bg)' : 'transparent', color: metric === pair[0] ? 'var(--color-text)' : 'var(--color-text-muted)', fontWeight: metric === pair[0] ? 600 : 400, boxShadow: metric === pair[0] ? 'var(--shadow-xs)' : 'none' } }, pair[1]);
          })
        ),
        React.createElement('button', { onClick: function() { setShowArla(function(v) { return !v; }); },
          style: { padding: '4px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: showArla ? 'var(--color-info-subtle)' : 'transparent', color: showArla ? 'var(--color-info)' : 'var(--color-text-muted)', fontFamily: 'inherit', fontSize: 11, cursor: 'pointer' }
        }, (showArla ? '✓ ' : '+ ') + 'Arla 32')
      )
    },
      React.createElement('div', { style: { padding: 'var(--space-4) var(--space-5) var(--space-2)' } },
        React.createElement(LineChart, { data: evoData, xKey: 'label', yKeys: visiveis.map(function(p) { return p.grupo_descricao; }), colors: visiveis.map(function(p) { return PCOLS[p.grupo_descricao]; }), height: 220, formatY: metric === 'volume' ? function(v) { return fNum(v) + ' L'; } : fBRL }),
        React.createElement(ChartLegend, { items: visiveis.map(function(p) { return { color: PCOLS[p.grupo_descricao], label: p.grupo_descricao }; }) })
      )
    ),
    React.createElement(SectionCard, { title: 'Breakdown por Produto' },
      React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '150px 100px 70px 110px 110px 90px 78px 78px', gap: 12, padding: '0 var(--space-5)', height: 36, alignItems: 'center', borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-subtle)' } },
        ['Produto','Volume (L)','Part. %','Receita','CMV','Mg %','R$/L','Cst/L'].map(function(h, i) {
          return React.createElement('div', { key: h, style: { fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: i > 0 ? 'right' : 'left' } }, h);
        })
      ),
      produtos.map(function(p, idx) {
        var color = PCOLS[p.grupo_descricao] || '#2563EB';
        return React.createElement('div', { key: p.grupo_descricao,
          style: { display: 'grid', gridTemplateColumns: '150px 100px 70px 110px 110px 90px 78px 78px', gap: 12, padding: '0 var(--space-5)', height: 'var(--table-row-height)', alignItems: 'center', borderBottom: idx < produtos.length-1 ? '1px solid var(--color-border)' : 'none' }
        },
          React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 8 } },
            React.createElement('span', { style: { width: 10, height: 10, borderRadius: 3, background: color, flexShrink: 0 } }),
            React.createElement('span', { style: { fontSize: 13, fontWeight: 600, color: 'var(--color-text)' } }, p.grupo_descricao)
          ),
          React.createElement('div', { style: { textAlign: 'right' } },
            React.createElement('div', { style: { fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--color-text)', fontWeight: 600 } }, fNum(p.volume_litros)),
            React.createElement('div', { style: { height: 3, background: 'var(--color-bg-muted)', borderRadius: 2, marginTop: 3 } },
              React.createElement('div', { style: { height: '100%', width: (p.volume_litros/maxVol*100) + '%', background: color, borderRadius: 2 } })
            )
          ),
          React.createElement('div', { style: { textAlign: 'right', fontSize: 12, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' } }, fPct(p.participacao_volume_pct)),
          React.createElement('div', { style: { textAlign: 'right', fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--color-text)' } }, fBRL(p.receita_bruta)),
          React.createElement('div', { style: { textAlign: 'right', fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' } }, fBRL(p.cmv)),
          React.createElement('div', { style: { textAlign: 'right', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-success)' } }, fPct(p.margem_pct)),
          React.createElement('div', { style: { textAlign: 'right', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-text)' } }, 'R$\u00a0' + p.preco_medio_litro.toFixed(2)),
          React.createElement('div', { style: { textAlign: 'right', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' } }, 'R$\u00a0' + p.custo_medio_litro.toFixed(2))
        );
      }),
      React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '150px 100px 70px 110px 110px 90px 78px 78px', gap: 12, padding: '0 var(--space-5)', height: 'var(--table-row-height)', alignItems: 'center', background: 'var(--color-bg-subtle)', borderTop: '2px solid var(--color-border)' } },
        React.createElement('div', { style: { fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' } }, 'Total'),
        React.createElement('div', { style: { textAlign: 'right', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-text)' } }, fLitros(r.totais.volume_litros)),
        React.createElement('div', { style: { textAlign: 'right', fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' } }, '100%'),
        React.createElement('div', { style: { textAlign: 'right', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-text)' } }, fBRL(r.totais.receita_bruta)),
        React.createElement('div', { style: { textAlign: 'right', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' } }, fBRL(r.totais.cmv)),
        React.createElement('div', { style: { textAlign: 'right', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-success)' } }, fPct(r.totais.margem_pct)),
        React.createElement('div'),
        React.createElement('div')
      )
    )
  );
}
Object.assign(window, { PageCombustivel });
