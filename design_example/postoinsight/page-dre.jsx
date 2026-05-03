// page-dre.jsx — DRE Mensal com coluna por segmento + total + variação vs mês anterior
function PageDRE() {
  var dreData = window.MOCK.dre;
  var mes = React.useState(dreData.mes_atual); var setMes = mes[1]; mes = mes[0];
  var segs = ['combustivel','lubrificantes','servicos','conveniencia'];
  var segLabels = { combustivel:'Combustível', lubrificantes:'Lubrificantes', servicos:'Serviços', conveniencia:'Conveniência' };
  var segColors = window.SEG_COLORS;

  // Meses disponíveis para comparativo
  var mesIdx = dreData.meses.indexOf(mes);
  var mesAnterior = dreData.meses[mesIdx + 1] || null;

  var atual = dreData.por_mes[mes] || {};
  var anterior = mesAnterior ? (dreData.por_mes[mesAnterior] || {}) : null;

  function varPct(a, b) {
    if (!a || !b || b === 0) return null;
    return ((a - b) / Math.abs(b)) * 100;
  }

  function VarCell({ v, isCost }) {
    if (v == null) return React.createElement('span', { style: { color: 'var(--color-text-subtle)', fontSize: 11 } }, '—');
    var pos = v >= 0;
    // cost lines: positive variation is bad
    var good = isCost ? !pos : pos;
    return React.createElement('span', {
      style: { fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-mono)', color: good ? 'var(--color-success)' : 'var(--color-danger)' }
    }, (pos ? '+' : '') + fNum(v, 1) + '%');
  }

  // Column widths: label + 4 segs + total + var
  var cols = '180px repeat(4, 1fr) 1fr 72px';

  function HeaderRow() {
    return React.createElement('div', { style: { display: 'grid', gridTemplateColumns: cols, alignItems: 'center', gap: 12, padding: '0 var(--space-5)', height: 44, background: 'var(--color-bg-subtle)', borderBottom: '2px solid var(--color-border)' } },
      React.createElement('div', { style: { fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 } }, 'Linha'),
      segs.map(function(s) {
        return React.createElement('div', { key: s, style: { textAlign: 'right' } },
          React.createElement('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 5 } },
            React.createElement('span', { style: { width: 8, height: 8, borderRadius: 2, background: segColors[s], display: 'inline-block' } }),
            React.createElement('span', { style: { fontSize: 12, fontWeight: 700, color: 'var(--color-text)' } }, segLabels[s])
          )
        );
      }),
      React.createElement('div', { style: { textAlign: 'right' } },
        React.createElement('div', { style: { fontSize: 13, fontWeight: 700, color: 'var(--color-text)' } }, dreData.labels[mes]),
        mes === dreData.mes_atual && React.createElement('div', { style: { fontSize: 9, color: 'var(--color-warning)', fontWeight: 600 } }, 'PARCIAL')
      ),
      React.createElement('div', { style: { textAlign: 'right', fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' } }, anterior ? 'vs ' + dreData.labels[mesAnterior] : '—')
    );
  }

  function DataRow({ label, metric, indent, bold, highlight, isCost }) {
    var totalAtual = segs.reduce(function(a, s) { return a + ((atual[s] && atual[s][metric]) || 0); }, 0);
    var totalAnterior = anterior ? segs.reduce(function(a, s) { return a + ((anterior[s] && anterior[s][metric]) || 0); }, 0) : null;
    var v = anterior ? varPct(totalAtual, totalAnterior) : null;

    return React.createElement('div', { style: {
      display: 'grid', gridTemplateColumns: cols, alignItems: 'center', gap: 12,
      padding: indent ? '0 var(--space-5) 0 44px' : '0 var(--space-5)',
      height: bold ? 48 : 'var(--table-row-height)',
      background: bold ? 'var(--color-bg-subtle)' : highlight ? 'var(--color-success-subtle)' : 'transparent',
      borderBottom: '1px solid var(--color-border)',
      borderTop: bold ? '1px solid var(--color-border)' : 'none',
    }},
      React.createElement('div', { style: { fontSize: indent ? 12 : 13, fontWeight: bold ? 700 : 500, color: indent ? 'var(--color-text-muted)' : 'var(--color-text)', display: 'flex', alignItems: 'center', gap: indent ? 6 : 0 } },
        indent && segColors[metric.split('_')[0]] ? null : null,
        label
      ),
      segs.map(function(s) {
        var val = (atual[s] && atual[s][metric]) || 0;
        return React.createElement('div', { key: s, style: { textAlign: 'right', fontSize: bold ? 13 : 12, fontWeight: bold ? 700 : 500, fontFamily: 'var(--font-mono)', color: highlight ? 'var(--color-success)' : 'var(--color-text)' } }, fBRL(val));
      }),
      React.createElement('div', { style: { textAlign: 'right', fontSize: bold ? 14 : 13, fontWeight: 700, fontFamily: 'var(--font-mono)', color: highlight ? 'var(--color-success)' : 'var(--color-text)' } }, fBRL(totalAtual)),
      React.createElement('div', { style: { textAlign: 'right' } }, React.createElement(VarCell, { v: v, isCost: isCost }))
    );
  }

  function MargPctRow() {
    var rl = segs.reduce(function(a,s){ return a + ((atual[s] && atual[s].receita_liquida)||0); }, 0);
    var mb = segs.reduce(function(a,s){ return a + ((atual[s] && atual[s].margem_bruta)||0); }, 0);
    var pct = rl > 0 ? mb / rl * 100 : 0;
    var rlA = anterior ? segs.reduce(function(a,s){ return a + ((anterior[s] && anterior[s].receita_liquida)||0); }, 0) : null;
    var mbA = anterior ? segs.reduce(function(a,s){ return a + ((anterior[s] && anterior[s].margem_bruta)||0); }, 0) : null;
    var pctA = rlA && rlA > 0 ? mbA / rlA * 100 : null;
    var diff = pctA != null ? pct - pctA : null;
    return React.createElement('div', { style: { display: 'grid', gridTemplateColumns: cols, alignItems: 'center', gap: 12, padding: '0 var(--space-5)', height: 48, background: 'var(--color-bg-subtle)', borderTop: '2px solid var(--color-border)' } },
      React.createElement('div', { style: { fontSize: 13, fontWeight: 700, color: 'var(--color-text)' } }, 'Margem Bruta %'),
      segs.map(function(s) {
        var srl = (atual[s] && atual[s].receita_liquida) || 0;
        var smb = (atual[s] && atual[s].margem_bruta) || 0;
        var spct = srl > 0 ? smb/srl*100 : 0;
        return React.createElement('div', { key: s, style: { textAlign: 'right', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-success)' } }, fPct(spct, 2));
      }),
      React.createElement('div', { style: { textAlign: 'right', fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-success)' } }, fPct(pct, 2)),
      React.createElement('div', { style: { textAlign: 'right' } },
        diff != null ? React.createElement('span', { style: { fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-mono)', color: diff >= 0 ? 'var(--color-success)' : 'var(--color-danger)' } }, (diff >= 0 ? '+' : '') + fNum(diff, 2) + 'pp') : null
      )
    );
  }

  return React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', padding: 'var(--space-6) var(--space-8)' } },
    // Month selector
    React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 10 } },
      React.createElement('span', { style: { fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 500 } }, 'Mês:'),
      React.createElement('div', { style: { display: 'flex', gap: 6 } },
        dreData.meses.map(function(m) {
          var sel = mes === m;
          return React.createElement('button', { key: m, onClick: function() { setMes(m); },
            style: { padding: '5px 12px', borderRadius: 'var(--radius-md)', border: '1px solid ' + (sel ? 'var(--color-primary)' : 'var(--color-border)'), background: sel ? 'var(--color-primary-subtle)' : 'var(--color-bg)', color: sel ? 'var(--color-primary)' : 'var(--color-text-muted)', fontFamily: 'inherit', fontSize: 12, fontWeight: sel ? 600 : 400, cursor: 'pointer', transition: 'all 0.12s' }
          },
            dreData.labels[m],
            m === dreData.mes_atual ? React.createElement('span', { style: { fontSize: 9, marginLeft: 4, opacity: 0.6 } }, '(parcial)') : null
          );
        })
      ),
      anterior && React.createElement('span', { style: { fontSize: 11, color: 'var(--color-text-subtle)', marginLeft: 4 } }, 'Comparativo com ' + dreData.labels[mesAnterior])
    ),
    // DRE Table
    React.createElement(SectionCard, null,
      React.createElement(HeaderRow),
      React.createElement(DataRow, { label: 'RECEITA BRUTA', metric: 'receita_bruta', bold: true }),
      React.createElement(DataRow, { label: '(-) Descontos',      metric: 'descontos',       indent: false, isCost: true }),
      React.createElement(DataRow, { label: '(=) RECEITA LÍQUIDA',metric: 'receita_liquida', bold: true }),
      React.createElement(DataRow, { label: '(-) CMV',            metric: 'cmv',             bold: true, isCost: true }),
      React.createElement(DataRow, { label: '(=) MARGEM BRUTA',   metric: 'margem_bruta',    bold: true, highlight: true }),
      React.createElement(MargPctRow),
      // Disclaimer
      React.createElement('div', { style: { padding: '10px var(--space-5)', display: 'flex', alignItems: 'flex-start', gap: 7, borderTop: '1px solid var(--color-border)' } },
        React.createElement('svg', { width: 13, height: 13, fill: 'none', stroke: 'var(--color-warning)', strokeWidth: 2, viewBox: '0 0 24 24', style: { flexShrink: 0, marginTop: 1 } },
          React.createElement('circle', { cx: 12, cy: 12, r: 10 }),
          React.createElement('line', { x1: 12, y1: 8, x2: 12, y2: 12 }),
          React.createElement('line', { x1: 12, y1: 16, x2: '12.01', y2: 16 })
        ),
        React.createElement('p', { style: { margin: 0, fontSize: 11, color: 'var(--color-text-muted)', lineHeight: 1.5 } },
          'Este DRE vai até ',
          React.createElement('strong', { style: { color: 'var(--color-text)' } }, 'Margem Bruta'),
          '. Despesas operacionais (aluguel, folha, energia) não estão incluídas.'
        )
      )
    )
  );
}
Object.assign(window, { PageDRE });
