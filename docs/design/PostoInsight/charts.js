/* PostoInsight — Chart.js builders following design-tokens.md spec.
 * Polaris-Viz-inspired: minimal grid, no axis line, circular legend dots, soft tooltips.
 */
(function () {
  'use strict';
  if (!window.Chart) { console.error('Chart.js not loaded'); return; }

  const C = {
    combustivel:  '#0073BB',
    conveniencia: '#EC7211',
    lubrificantes:'#6B40C4',
    arla:         '#1D8102',
    servicos:     '#0891b2',
    s1:'#0073BB', s2:'#EC7211', s3:'#6B40C4', s4:'#1D8102', s5:'#0891b2', s6:'#db2777',
    pos:'#16a34a', neg:'#dc2626', neutral:'#64748b',
  };

  function themeTokens() {
    const isDark = document.documentElement.classList.contains('dark');
    return isDark ? {
      grid: '#1f2937',
      tick: '#94a3b8',
      tooltipBg: '#0f172a',
      tooltipBorder: '#1f2937',
      titleColor: '#f1f5f9',
      bodyColor: '#94a3b8',
      surface: '#0f172a',
    } : {
      grid: '#e2e8f0',
      tick: '#64748b',
      tooltipBg: '#ffffff',
      tooltipBorder: '#e2e8f0',
      titleColor: '#0f172a',
      bodyColor: '#64748b',
      surface: '#ffffff',
    };
  }

  // Shared config factories — rebuilt on theme change
  function TT() {
    const t = themeTokens();
    return {
      backgroundColor: t.tooltipBg, borderColor: t.tooltipBorder, borderWidth: 1,
      titleColor: t.titleColor, bodyColor: t.bodyColor,
      padding: { x: 14, y: 10 }, cornerRadius: 8, boxPadding: 4,
      usePointStyle: true, titleFont: { size: 12, weight: '600' }, bodyFont: { size: 12 },
    };
  }
  function GRID() { return { color: themeTokens().grid, drawTicks: false }; }
  function TICK() { return { color: themeTokens().tick, font: { size: 11 }, padding: 8 }; }
  const NOBDR = { display: false };
  function LEG_B() {
    return {
      position: 'bottom',
      labels: { boxWidth: 8, boxHeight: 8, usePointStyle: true, pointStyle: 'circle', color: themeTokens().tick, padding: 16, font: { size: 11 } }
    };
  }

  const fmtBRLk = v => 'R$ ' + (v/1000).toFixed(0) + 'k';
  const fmtBRL = v => window.PIData ? window.PIData.fmtBRL(v) : v;

  // ---------- KPI sparkline (SVG, hand-rolled — no Chart.js layout to fight) ----------
  function svgSpark(data, color) {
    if (!data || !data.length) return '';
    const W = 200, H = 60;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = (max - min) || 1;
    // Map x linearly, y inverted (Chart.js-style: high values → top).
    // Compress to bottom half so curve sits low and the card breathes above.
    const xs = data.map((_, i) => (i / (data.length - 1)) * W);
    const ys = data.map(v => H - 4 - ((v - min) / range) * (H * 0.45)); // curve in bottom 45% of viewBox
    // Build smooth cubic-bezier path through the points
    const path = buildSmoothPath(xs, ys);
    // Closed area path for the fill (down to bottom edge)
    const area = `${path} L ${W},${H} L 0,${H} Z`;
    return `
      <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" width="100%" height="100%" style="display:block">
        <path d="${area}" fill="${color}" fill-opacity="0.22"/>
        <path d="${path}" fill="none" stroke="${color}" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>
      </svg>
    `;
  }
  function buildSmoothPath(xs, ys) {
    let d = `M ${xs[0]},${ys[0]}`;
    for (let i = 1; i < xs.length; i++) {
      const x0 = xs[i-1], y0 = ys[i-1];
      const x1 = xs[i],   y1 = ys[i];
      const cpx1 = x0 + (x1 - x0) * 0.5;
      const cpx2 = x0 + (x1 - x0) * 0.5;
      d += ` C ${cpx1},${y0} ${cpx2},${y1} ${x1},${y1}`;
    }
    return d;
  }

  // ---------- KPI sparkline (Chart.js — legacy, kept for compatibility) ----------
  function kpiSpark(canvas, data, color) {
    if (!canvas) return;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = (max - min) || 1;
    return new Chart(canvas, {
      type: 'line',
      data: { labels: data.map((_,i)=>i), datasets: [{
        data, borderColor: color, backgroundColor: color + '33',
        borderWidth: 1.5, tension: 0.35, pointRadius: 0, fill: 'start'
      }]},
      options: {
        responsive: true, maintainAspectRatio: false,
        layout: { padding: 0 },
        plugins: { legend:{display:false}, tooltip:{enabled:false} },
        scales: {
          x: { display: false, offset: false, bounds: 'data', min: 0, max: data.length - 1 },
          // Compress the curve to the bottom half so the line sits low and the fill
          // is mostly empty card area above — gives a clean "watermark" look.
          y: { display: false, min: min - range * 0.4, max: max + range * 1.6 }
        },
        elements: { line: { cubicInterpolationMode: 'monotone' } },
        animation: false,
      }
    });
  }

  // ---------- Inline trend sparkline (used in tables) ----------
  function tinySpark(canvas, data, color) {
    if (!canvas) return;
    return new Chart(canvas, {
      type: 'line',
      data: { labels: data.map((_,i)=>i), datasets: [{ data, borderColor: color, borderWidth: 1.4, tension: 0.35, pointRadius: 0, fill: false }]},
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins:{legend:{display:false},tooltip:{enabled:false}},
        scales:{x:{display:false},y:{display:false}},
        animation: false,
      }
    });
  }

  // ---------- Dual-axis revenue chart ----------
  function revenueDual(canvas, labels, receita, margemPct, style) {
    if (!canvas) return;
    style = style || 'soft';
    const margemBruta = receita.map((r, i) => r * (margemPct[i] / 100));
    const ctx = canvas.getContext('2d');
    const makeGrad = (color) => {
      const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
      g.addColorStop(0, color + '80');
      g.addColorStop(1, color + '10');
      return g;
    };
    return new Chart(canvas, {
      data: {
        labels,
        datasets: [
          { type:'line', label:'Receita Bruta', data: receita, yAxisID: 'y',
            borderColor: '#0073BB', backgroundColor: makeGrad('#0073BB'),
            borderWidth: 2, tension: 0.35, pointRadius: 0, pointHoverRadius: 4,
            fill: 'origin', order: 3 },
          { type:'line', label:'Margem Bruta', data: margemBruta, yAxisID: 'y',
            borderColor: '#16a34a', backgroundColor: makeGrad('#16a34a'),
            borderWidth: 2, tension: 0.35, pointRadius: 0, pointHoverRadius: 4,
            fill: 'origin', order: 2 },
          { type:'line', label:'Margem % (eixo dir.)', data: margemPct, yAxisID: 'y2',
            borderColor: '#EC7211', backgroundColor: '#EC7211',
            borderWidth: 2, borderDash: [6, 4],
            tension: 0.35, pointRadius: 0, pointHoverRadius: 4,
            fill: false, order: 0, hidden: true }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: { legend: { ...LEG_B(), reverse: true }, tooltip: { ...TT(),
          callbacks: { label: ctx => ctx.dataset.yAxisID === 'y2'
            ? ctx.dataset.label.replace(' (eixo dir.)', '') + ': ' + ctx.parsed.y.toFixed(1) + '%'
            : ctx.dataset.label + ': ' + fmtBRL(ctx.parsed.y) }
        }},
        scales: {
          x: { grid:{...GRID(), display:false}, border: NOBDR, ticks: TICK() },
          y: { position:'left', grid: GRID(), border: NOBDR, ticks: { ...TICK(), callback: fmtBRLk } },
          y2:{ position:'right', grid:{display:false}, border: NOBDR, ticks: { ...TICK(), callback: v => v + '%' }, display: 'auto' }
        }
      }
    });
  }

  // ---------- Donut ----------
  function donut(canvas, labels, data, colors) {
    if (!canvas) return;
    return new Chart(canvas, {
      type: 'doughnut',
      data: { labels, datasets: [{ data, backgroundColor: colors, borderColor: themeTokens().surface, borderWidth: 2, hoverOffset: 6 }]},
      options: {
        responsive: true, maintainAspectRatio: false,
        cutout: '72%',
        plugins: {
          legend: { display: false },
          tooltip: { ...TT(), callbacks: { label: ctx => ctx.label + ': ' + fmtBRL(ctx.parsed) }}
        }
      }
    });
  }

  // ---------- Combustível evolution (stacked area / line) ----------
  function combLines(canvas, labels, datasets, mode, fill) {
    if (!canvas) return;
    const palette = [C.s1, C.s2, C.s3, C.s4, C.s5, C.s6];
    const ctx = canvas.getContext('2d');
    const makeGrad = (color) => {
      const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
      g.addColorStop(0, color + '80');
      g.addColorStop(1, color + '10');
      return g;
    };
    return new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: datasets.map((d, i) => {
          const color = palette[i % palette.length];
          return {
            label: d.name, data: d.data,
            borderColor: color,
            backgroundColor: fill ? makeGrad(color) : color + '00',
            borderWidth: 1.8, tension: 0.35, pointRadius: 0, pointHoverRadius: 4,
            fill: fill ? (i === 0 ? 'origin' : '-1') : false
          };
        })
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction:{mode:'index',intersect:false},
        plugins: { legend: LEG_B(), tooltip: { ...TT(),
          callbacks: { label: ctx => ctx.dataset.label + ': ' + (mode==='receita' ? fmtBRL(ctx.parsed.y) : ctx.parsed.y.toLocaleString('pt-BR') + ' L') }
        }},
        scales: {
          x: { grid:{...GRID(), display:false}, border: NOBDR, ticks: TICK(), stacked: !!fill },
          y: { grid: GRID(), border: NOBDR, ticks: { ...TICK(), callback: v => mode==='receita' ? fmtBRLk(v) : (v/1000).toFixed(1)+'k L' }, stacked: !!fill }
        }
      }
    });
  }

  // ---------- Conveniência: stacked area ----------
  function convArea(canvas, labels, receita, margem) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const g1 = ctx.createLinearGradient(0,0,0,canvas.height);
    g1.addColorStop(0,'#EC721180'); g1.addColorStop(1,'#EC721110');
    const g2 = ctx.createLinearGradient(0,0,0,canvas.height);
    g2.addColorStop(0,'#16a34a80'); g2.addColorStop(1,'#16a34a10');
    return new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [
          { label:'Receita',       data: receita, borderColor:'#EC7211', backgroundColor:g1, borderWidth:1.8, tension:.35, pointRadius:0, fill:'origin'},
          { label:'Margem Bruta',  data: margem,  borderColor:'#16a34a', backgroundColor:g2, borderWidth:1.8, tension:.35, pointRadius:0, fill:'origin'}
        ]
      },
      options: {
        responsive:true, maintainAspectRatio:false,
        interaction:{mode:'index',intersect:false},
        plugins:{legend:LEG_B(),tooltip:{...TT(),callbacks:{label:c=>c.dataset.label+': '+fmtBRL(c.parsed.y)}}},
        scales:{
          x:{grid:{...GRID(),display:false},border:NOBDR,ticks:TICK()},
          y:{grid:GRID(),border:NOBDR,ticks:{...TICK(),callback:fmtBRLk}}
        }
      }
    });
  }

  // ---------- Scatter w/ quadrants ----------
  function scatterQuadrants(canvas, points, medianX, medianY) {
    if (!canvas) return;
    const colorMap = c => c;
    const quadrantPlugin = {
      id: 'quadrants',
      beforeDraw(chart) {
        const { ctx, chartArea, scales } = chart;
        if (!chartArea) return;
        const mx = scales.x.getPixelForValue(medianX);
        const my = scales.y.getPixelForValue(medianY);
        ctx.save();
        // quadrant tint — top-right (winners)
        ctx.fillStyle = 'rgba(22,163,74,0.04)';
        ctx.fillRect(mx, chartArea.top, chartArea.right - mx, my - chartArea.top);
        // bottom-left (losers)
        ctx.fillStyle = 'rgba(220,38,38,0.04)';
        ctx.fillRect(chartArea.left, my, mx - chartArea.left, chartArea.bottom - my);
        // median lines
        ctx.strokeStyle = themeTokens().tick + '66';
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(mx, chartArea.top); ctx.lineTo(mx, chartArea.bottom);
        ctx.moveTo(chartArea.left, my); ctx.lineTo(chartArea.right, my);
        ctx.stroke();
        ctx.setLineDash([]);
        // labels
        ctx.fillStyle = themeTokens().tick;
        ctx.font = '600 9.5px Geist Sans, system-ui';
        ctx.textBaseline = 'top';
        ctx.fillText('ESTRELAS', mx + 8, chartArea.top + 6);
        ctx.fillText('QUESTIONÁVEIS', chartArea.left + 8, chartArea.top + 6);
        ctx.fillText('CAIXA', chartArea.left + 8, my + 6);
        ctx.fillText('VOLUME', mx + 8, my + 6);
        ctx.restore();
      }
    };
    return new Chart(canvas, {
      type: 'bubble',
      data: { datasets: points.map(p => ({
        label: p.name,
        data: [{ x: p.qty, y: p.mg, r: Math.max(5, Math.sqrt(p.rev / 200)) }],
        backgroundColor: colorMap(p.color) + 'cc',
        borderColor: colorMap(p.color),
        borderWidth: 1
      }))},
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { ...TT(),
            callbacks: {
              title: items => items[0].dataset.label,
              label: ctx => {
                const p = points.find(p => p.name === ctx.dataset.label);
                return [
                  'Qtd: ' + p.qty.toLocaleString('pt-BR'),
                  'Margem: ' + p.mg.toFixed(1) + '%',
                  'Receita: ' + fmtBRL(p.rev)
                ];
              }
            }
          }
        },
        scales: {
          x: { grid: GRID(), border: NOBDR, ticks: { ...TICK(), callback: v => v.toLocaleString('pt-BR') }, title: { display:true, text:'Quantidade vendida', color: themeTokens().tick, font:{size:10,weight:'600'} } },
          y: { grid: GRID(), border: NOBDR, ticks: { ...TICK(), callback: v => v+'%' }, title: { display:true, text:'Margem %', color: themeTokens().tick, font:{size:10,weight:'600'} } }
        }
      },
      plugins: [quadrantPlugin]
    });
  }

  // ---------- Waterfall ----------
  function waterfall(canvas, items) {
    // items: [{label, type:'start'|'plus'|'minus'|'total', value}]
    if (!canvas) return;
    let running = 0;
    const offsets = [], positives = [], negatives = [], colors = [];
    items.forEach(it => {
      if (it.type === 'start' || it.type === 'total') {
        offsets.push(0); positives.push(it.value); negatives.push(null);
        colors.push(it.type === 'total' ? '#16a34a' : '#0073BB');
        running = it.type === 'total' ? running : it.value;
      } else if (it.type === 'plus') {
        offsets.push(running); positives.push(it.value); negatives.push(null); colors.push('#0073BB');
        running += it.value;
      } else { // minus
        const v = Math.abs(it.value);
        offsets.push(running - v); positives.push(null); negatives.push(v); colors.push('#dc2626');
        running -= v;
      }
    });
    return new Chart(canvas, {
      type: 'bar',
      data: {
        labels: items.map(i => i.label),
        datasets: [
          { label:'_helper', data: offsets, backgroundColor:'rgba(0,0,0,0)', stack:'wf', borderWidth:0 },
          { label:'Resultado', data: positives, backgroundColor: colors, stack:'wf', borderRadius: 4, borderSkipped: false, maxBarThickness: 28, minBarLength: 4 },
          { label:'Deduções', data: negatives, backgroundColor:'#dc2626', stack:'wf', borderRadius: 4, borderSkipped: false, maxBarThickness: 28, minBarLength: 10 }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: { ...TT(),
            filter: item => item.dataset.label !== '_helper' && item.parsed.y !== 0,
            callbacks: {
              title: ctxs => ctxs[0] ? items[ctxs[0].dataIndex].label : '',
              label: ctx => {
                const it = items[ctx.dataIndex];
                const prefix = it.type === 'minus' ? '−' : (it.type === 'plus' ? '+' : '');
                return prefix + fmtBRL(Math.abs(it.value));
              }
            }
          }
        },
        scales: {
          x: { grid:{...GRID(), display:false}, border: NOBDR, ticks: TICK(), stacked: true },
          y: { grid: GRID(), border: NOBDR, ticks:{...TICK(), callback: fmtBRLk}, stacked: true }
        }
      }
    });
  }

  // ---------- 6-month margin evolution (multi-line) ----------
  function marginEvolution(canvas, labels, segments) {
    if (!canvas) return;
    const palette = { combustivel: C.combustivel, conveniencia: C.conveniencia, lubrificantes: C.lubrificantes, servicos: C.servicos };
    return new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: Object.keys(segments).map(k => ({
          label: window.PIData.labelOf(k),
          data: segments[k],
          borderColor: palette[k],
          backgroundColor: palette[k],
          borderWidth: 2, tension: 0.35, pointRadius: 3, pointHoverRadius: 5, fill: false
        }))
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: { legend: LEG_B(), tooltip: { ...TT(), callbacks: { label: c => c.dataset.label + ': ' + c.parsed.y.toFixed(1) + '%' }}},
        scales: {
          x: { grid:{...GRID(), display:false}, border: NOBDR, ticks: TICK() },
          y: { grid: GRID(), border: NOBDR, ticks: { ...TICK(), callback: v => v+'%' } }
        }
      }
    });
  }

  window.PICharts = {
    kpiSpark, svgSpark, tinySpark, revenueDual, donut, combLines, convArea,
    scatterQuadrants, waterfall, marginEvolution, themeTokens, C
  };
})();
