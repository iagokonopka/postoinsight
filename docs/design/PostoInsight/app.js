/* PostoInsight — application logic.
 * Navigation, filter-driven re-rendering, drill-down drawer, sync flow.
 */
(function () {
  'use strict';

  const $  = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

  // ---------- Global state ----------
  const state = {
    page: 'visao-geral',
    period: 'mes',
    location: 'all',
    topSort: 'receita',
    combMode: 'volume',
    combStyle: 'line',
    convView: 'todos',
    includeArla: false,
    dre: { year: 2026, monthIdx: 4 },
    initedPages: new Set(),
  };
  const charts = {}; // store chart instances by key for destroy/re-create

  // ---------- Icons ----------
  const ICON = {
    money:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.7"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
    cmv:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.7"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>',
    margin:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.7"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
    pct:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.7"><line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>',
    items:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.7"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.29 7 12 12 20.71 7"/></svg>',
    volume:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.7"><path d="M12 2 4 14a8 8 0 0 0 16 0L12 2z"/></svg>',
    ticket:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.7"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/><line x1="13" y1="5" x2="13" y2="7"/><line x1="13" y1="11" x2="13" y2="13"/><line x1="13" y1="17" x2="13" y2="19"/></svg>',
    check:   '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>',
    arrowUp: '↑', arrowDown: '↓', arrowFlat: '→',
  };

  function deltaTag(v, isPP) {
    if (Math.abs(v) < 0.15) return `<span class="delta-neu">${ICON.arrowFlat} ${v.toFixed(1).replace('.',',')}${isPP?' p.p.':'%'}</span>`;
    const cls = v >= 0 ? 'delta-pos' : 'delta-neg';
    const ar  = v >= 0 ? ICON.arrowUp : ICON.arrowDown;
    return `<span class="${cls}">${ar} ${Math.abs(v).toFixed(1).replace('.',',')}${isPP?' p.p.':'%'}</span>`;
  }

  // ---------- KPI card builder ----------
  function kpiCard(opts) {
    // {id, label, value, dM, dY, deltaPP}
    return `
      <div class="kpi">
        <div class="kpi-label">${opts.label}</div>
        <div class="kpi-value" id="${opts.id}-v">${opts.value}</div>
        <div class="kpi-deltas">
          <div class="kpi-delta-row">${deltaTag(opts.dM, opts.deltaPP)}<span class="kpi-delta-label">vs mês ant.</span></div>
          ${opts.dY !== undefined ? `<div class="kpi-delta-row">${deltaTag(opts.dY, opts.deltaPP)}<span class="kpi-delta-label">vs ano ant.</span></div>` : ''}
        </div>
        <div class="kpi-spark" id="${opts.id}-s"></div>
      </div>
    `;
  }
  function paintKPISpark(id, data, color) {
    const el = document.getElementById(id + '-s');
    if (!el) return;
    el.innerHTML = window.PICharts.svgSpark(data, color);
  }

  // ---------- Render: Visão Geral ----------
  function renderVisaoGeral() {
    const D = window.PIData;
    const k = D.kpis(state.period, state.location);
    const c = window.PICharts.C;

    $('#kpi-row-vg').innerHTML = [
      kpiCard({id:'kpi-rec', label:'Receita Bruta', icon: ICON.money, value: k.receita.formatted, dM: k.receita.dM, dY: k.receita.dY}),
      kpiCard({id:'kpi-cmv', label:'CMV', icon: ICON.cmv, value: k.cmv.formatted, dM: k.cmv.dM, dY: k.cmv.dY}),
      kpiCard({id:'kpi-mg',  label:'Margem Bruta', icon: ICON.margin, value: k.margem.formatted, dM: k.margem.dM, dY: k.margem.dY}),
      kpiCard({id:'kpi-mp',  label:'Margem %', icon: ICON.pct, value: k.margemPct.formatted, dM: k.margemPct.dM, dY: k.margemPct.dY, deltaPP: true}),
      kpiCard({id:'kpi-it',  label:'Itens vendidos', icon: ICON.items, value: k.itens.formatted, dM: k.itens.dM, dY: k.itens.dY}),
    ].join('');
    paintKPISpark('kpi-rec', k.receita.spark, c.combustivel);
    paintKPISpark('kpi-cmv', k.cmv.spark,     '#dc2626');
    paintKPISpark('kpi-mg',  k.margem.spark,  '#16a34a');
    paintKPISpark('kpi-mp',  k.margemPct.spark, c.combustivel);
    paintKPISpark('kpi-it',  k.itens.spark,   c.lubrificantes);

    // Revenue chart
    const rev = D.revenueSeries(state.period, state.location);
    if (charts.revenue) charts.revenue.destroy();
    charts.revenue = window.PICharts.revenueDual($('#chart-revenue'), rev.labels, rev.receita, rev.margemPct, state.chartStyle || 'soft');

    // Donut
    const mix = D.segmentMix(state.period, state.location);
    $('#donut-total').textContent = D.fmtBRL(mix.total);
    if (charts.donut) charts.donut.destroy();
    charts.donut = window.PICharts.donut($('#chart-donut'),
      mix.rows.map(r => r.label),
      mix.rows.map(r => r.receita),
      mix.rows.map(r => r.color));
    $('#donut-legend').innerHTML = mix.rows.map(r => `
      <div class="dl-row">
        <div class="dl-dot" style="background:${r.color}"></div>
        <span class="dl-name">${r.label}</span>
        <span class="dl-pct">${(r.share * 100).toFixed(1).replace('.',',')}%</span>
      </div>`).join('');

    // Segment table
    $('#segment-tbody').innerHTML = mix.rows.map(r => `
      <tr class="clickable" data-segment="${r.key}">
        <td><div class="seg-cell"><div class="seg-dot" style="background:${r.color}"></div>${r.label}</div></td>
        <td><div class="bar-cell"><div class="bar-track"><div class="bar-fill" style="width:${r.share*100}%; background:${r.color}"></div></div><span class="bar-num">${(r.share*100).toFixed(1).replace('.',',')}%</span></div></td>
        <td class="r">${D.fmtBRLFull(r.receita)}</td>
        <td class="r">${D.fmtBRLFull(r.cmv)}</td>
        <td class="r">${D.fmtBRLFull(r.margem)}</td>
        <td class="r"><b>${r.margemPct.toFixed(1).replace('.',',')}%</b></td>
      </tr>`).join('');
    $('#segment-total-rec').textContent = D.fmtBRLFull(mix.total);
    const totCmv = mix.rows.reduce((s,r)=>s+r.cmv, 0);
    const totMg  = mix.rows.reduce((s,r)=>s+r.margem, 0);
    $('#segment-total-cmv').textContent = D.fmtBRLFull(totCmv);
    $('#segment-total-mg').textContent = D.fmtBRLFull(totMg);
    $('#segment-total-mgpct').textContent = (totMg/mix.total*100).toFixed(1).replace('.',',') + '%';

    $$('#segment-tbody tr').forEach(tr => {
      tr.addEventListener('click', () => openDrillDown(mix.rows.find(r => r.key === tr.dataset.segment)));
    });

    // Top products
    renderTop(D);

    // Heatmap
    renderHeatmap(D);
  }

  function renderTop(D) {
    const items = D.topProducts(state.period, state.location, state.topSort);
    const maxV = Math.max(...items.map(i => state.topSort === 'margem' ? i.margemPct : i.receita));
    $('#top-tbody').innerHTML = items.map((p, i) => {
      const metric = state.topSort === 'margem' ? p.margemPct : p.receita;
      return `<tr>
        <td><span class="row-rank">${String(i+1).padStart(2,'0')}</span></td>
        <td><b>${p.name}</b><div style="font-size:11px;color:hsl(var(--muted-foreground));margin-top:1px">${p.group}</div></td>
        <td><span class="badge badge-soft">${p.cat}</span></td>
        <td><div class="bar-cell"><div class="bar-track"><div class="bar-fill" style="width:${(metric/maxV*100).toFixed(1)}%; background:${D.colorOf(p.cat === 'Combustível' ? 'combustivel' : (p.cat === 'Bebidas' || p.cat === 'Tabacaria' || p.cat === 'Alimentos' ? 'conveniencia' : (p.cat === 'Serviços' ? 'servicos' : (p.cat === 'Arla' ? 'arla' : 'lubrificantes'))))}"></div></div></div></td>
        <td class="r"><b>${D.fmtBRL(p.receita)}</b></td>
        <td class="r">${p.margemPct.toFixed(1).replace('.',',')}%</td>
        <td class="r">${p.qtd.toLocaleString('pt-BR')}</td>
      </tr>`;
    }).join('');
  }

  function renderHeatmap(D) {
    const h = D.heatmap(state.period, state.location);
    $('#heat-days').innerHTML = h.cells.map(c => `<div class="heat-day">${c.day}</div>`).join('');
    $('#heat-grid').innerHTML = h.cells.map(c =>
      `<div class="heat-row">${c.values.map(v => {
        const t = (v - h.min) / (h.max - h.min);
        const alpha = 0.08 + t * 0.92;
        return `<div class="heat-cell" style="background: hsl(204 100% 37% / ${alpha}); color: ${t > 0.55 ? '#fff' : 'hsl(var(--foreground))'}" title="R$ ${Math.round(v).toLocaleString('pt-BR')}">${D.fmtBRL(v)}</div>`;
      }).join('')}</div>`
    ).join('');
    $('#heat-min').textContent = D.fmtBRL(h.min);
    $('#heat-max').textContent = D.fmtBRL(h.max);
  }

  // ---------- Drill-down ----------
  function openDrillDown(seg) {
    if (!seg) return;
    const D = window.PIData;
    $('#drawer-title').innerHTML = `<div class="seg-dot" style="background:${seg.color};width:14px;height:14px;border-radius:3px"></div> ${seg.label}`;
    // mock category breakdown per segment
    const breakdown = ({
      combustivel: [
        ['Gasolina Comum', 0.36], ['Diesel S-10', 0.30], ['Gasolina Aditivada', 0.18],
        ['Etanol Hidratado', 0.10], ['Diesel S-500', 0.06]
      ],
      lubrificantes: [['Motor', 0.62],['Transmissão', 0.21],['Aditivos', 0.10],['Outros', 0.07]],
      servicos: [['Troca de óleo', 0.48],['Lavagem', 0.32],['Calibragem', 0.12],['Outros', 0.08]],
      conveniencia: [['Bebidas', 0.34],['Tabacaria', 0.24],['Alimentos', 0.17],['Higiene', 0.13],['Outros', 0.12]]
    })[seg.key] || [];
    $('#drawer-body').innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:18px">
        <div style="background:hsl(var(--muted) / 0.5);padding:12px;border-radius:8px"><div style="font-size:10px;color:hsl(var(--muted-foreground));text-transform:uppercase;letter-spacing:1px">Receita</div><div style="font-size:18px;font-weight:600;margin-top:4px">${D.fmtBRLFull(seg.receita)}</div></div>
        <div style="background:hsl(var(--muted) / 0.5);padding:12px;border-radius:8px"><div style="font-size:10px;color:hsl(var(--muted-foreground));text-transform:uppercase;letter-spacing:1px">Margem %</div><div style="font-size:18px;font-weight:600;margin-top:4px">${seg.margemPct.toFixed(1).replace('.',',')}%</div></div>
      </div>
      <div style="font-size:12px;font-weight:600;color:hsl(var(--muted-foreground));text-transform:uppercase;letter-spacing:1px;margin-bottom:10px">Composição</div>
      ${breakdown.map(([n,p]) => `<div class="drawer-row"><span class="drawer-row-l">${n}</span><span class="drawer-row-v">${(p*100).toFixed(1).replace('.',',')}% <span style="color:hsl(var(--muted-foreground));font-weight:400">·</span> ${D.fmtBRL(seg.receita * p)}</span></div>`).join('')}
      <div style="margin-top:18px;font-size:12px;font-weight:600;color:hsl(var(--muted-foreground));text-transform:uppercase;letter-spacing:1px;margin-bottom:10px">Por unidade</div>
      ${['JAM Centro','JAM Rodovia','JAM Norte','JAM Sul'].map((loc,i) => {
        const w = [0.32,0.41,0.16,0.11][i];
        return `<div class="drawer-row"><span class="drawer-row-l">${loc}</span><span class="drawer-row-v">${D.fmtBRL(seg.receita * w)}</span></div>`;
      }).join('')}
    `;
    $('#drawer').classList.add('open');
    $('#drawer-overlay').classList.add('open');
  }
  function closeDrillDown() {
    $('#drawer').classList.remove('open');
    $('#drawer-overlay').classList.remove('open');
  }

  // ---------- Combustível ----------
  function renderCombustivel() {
    const D = window.PIData;
    const c = window.PICharts.C;
    const r = window.PIData.rng;
    // Period-modulated totals
    const ctxK = (() => {
      const p = D.PERIODS[state.period] || D.PERIODS.mes;
      const l = D.LOCATIONS[state.location] || D.LOCATIONS.all;
      return { mult: p.scale * l.mult };
    })();
    const rr = mk => mk * ctxK.mult;
    const k = {
      volume:   { v: rr(185420), label: 'Volume', unit: 'L' },
      receita:  { v: rr(980300), label: 'Receita Combustível' },
      cmv:      { v: rr(810200) },
      margem:   { v: rr(169300) },
      margemPct: 17.27,
    };
    $('#kpi-row-comb').innerHTML = [
      kpiCard({id:'kc-vol', label:'Volume Total', icon: ICON.volume, value: Math.round(k.volume.v).toLocaleString('pt-BR') + ' L', dM: 6.2, dY: 12.3}),
      kpiCard({id:'kc-rec', label:'Receita', icon: ICON.money, value: D.fmtBRL(k.receita.v), dM: 8.4, dY: 14.6}),
      kpiCard({id:'kc-cmv', label:'CMV', icon: ICON.cmv, value: D.fmtBRL(k.cmv.v), dM: 7.1, dY: 11.2}),
      kpiCard({id:'kc-mg',  label:'Margem Bruta', icon: ICON.margin, value: D.fmtBRL(k.margem.v), dM: 10.3, dY: 22.1}),
      kpiCard({id:'kc-mp',  label:'Margem %', icon: ICON.pct, value: k.margemPct.toFixed(2).replace('.',',') + '%', dM: 0.3, dY: 0.6, deltaPP: true}),
    ].join('');
    const sparkMaker = (seed, base) => {
      const r = window.PIData ? null : null;
      // simple deterministic spark
      let s = 0; const out = [];
      for (let i = 0; i < 16; i++) { s = (s*9301 + seed + i*49297) % 233280; out.push(base * (0.7 + (s/233280) * 0.6)); }
      return out;
    };
    paintKPISpark('kc-vol', sparkMaker(1, k.volume.v/16), c.combustivel);
    paintKPISpark('kc-rec', sparkMaker(2, k.receita.v/16), c.combustivel);
    paintKPISpark('kc-cmv', sparkMaker(3, k.cmv.v/16), '#dc2626');
    paintKPISpark('kc-mg',  sparkMaker(4, k.margem.v/16), '#16a34a');
    paintKPISpark('kc-mp',  Array.from({length:16},()=>k.margemPct+(Math.random()*1.5-0.75)), c.combustivel);

    // Evolution chart
    const ev = D.combEvolution(state.period, state.location, state.combMode, { includeArla: state.includeArla });
    if (charts.comb) charts.comb.destroy();
    charts.comb = window.PICharts.combLines($('#chart-comb'), ev.labels, ev.datasets, state.combMode, true);
    $('#comb-evo-desc').textContent =
      (state.combMode === 'volume' ? 'Volume' : 'Receita') + ' por produto · ' + D.PERIODS[state.period].label.toLowerCase();

    // Mix donut (volume ou receita conforme o modo)
    const prodsForDonut = D.combProducts(state.period, state.location, { includeArla: state.includeArla });
    const PROD_COLORS = ['#0073BB','#EC7211','#6B40C4','#1D8102','#0891b2','#db2777'];
    const donutMetric = state.combMode === 'volume' ? 'volume' : 'receita';
    const donutTotal = prodsForDonut.reduce((s,p) => s + p[donutMetric], 0);
    $('#comb-donut-total').textContent = state.combMode === 'volume'
      ? Math.round(donutTotal).toLocaleString('pt-BR') + ' L'
      : D.fmtBRL(donutTotal);
    if (charts.combDonut) charts.combDonut.destroy();
    charts.combDonut = window.PICharts.donut($('#chart-comb-donut'),
      prodsForDonut.map(p => p.name),
      prodsForDonut.map(p => p[donutMetric]),
      prodsForDonut.map((_, i) => PROD_COLORS[i % PROD_COLORS.length]));
    $('#comb-donut-legend').innerHTML = prodsForDonut.map((p, i) => `
      <div class="dl-row">
        <div class="dl-dot" style="background:${PROD_COLORS[i % PROD_COLORS.length]}"></div>
        <span class="dl-name">${p.name}</span>
        <span class="dl-pct">${(p[donutMetric]/donutTotal*100).toFixed(1).replace('.',',')}%</span>
      </div>`).join('');

    // Breakdown table
    const prods = D.combProducts(state.period, state.location, { includeArla: state.includeArla });
    const totVol = prods.reduce((s,p)=>s+p.volume,0);
    $('#comb-tbody').innerHTML = prods.map((p, i) => `
      <tr>
        <td><b>${p.name}</b></td>
        <td class="r">${Math.round(p.volume).toLocaleString('pt-BR')}</td>
        <td class="r">${(p.volume/totVol*100).toFixed(1).replace('.',',')}%</td>
        <td class="r">${D.fmtBRL(p.receita)}</td>
        <td class="r"><b>${p.margemPct.toFixed(1).replace('.',',')}%</b></td>
        <td class="r mono">${p.price.toFixed(2).replace('.',',')}</td>
        <td class="r mono">${p.cost.toFixed(2).replace('.',',')}</td>
        <td><div class="spark-cell"><canvas id="comb-spark-${i}"></canvas><span class="${p.trend>0.02?'trend-up':p.trend<-0.02?'trend-down':'trend-flat'}">${p.trend>0.02?'↑':p.trend<-0.02?'↓':'→'} ${(p.trend*100).toFixed(1).replace('.',',')}%</span></div></td>
      </tr>`).join('');
    prods.forEach((p, i) => {
      const el = document.getElementById('comb-spark-' + i);
      if (charts['cs'+i]) charts['cs'+i].destroy();
      charts['cs'+i] = window.PICharts.tinySpark(el, p.spark, p.trend > 0 ? '#16a34a' : (p.trend < 0 ? '#dc2626' : '#64748b'));
    });
  }

  // ---------- Conveniência ----------
  function renderConveniencia() {
    const D = window.PIData;
    const c = window.PICharts.C;
    const view = state.convView || 'todos';
    const isLoja = view === 'loja';
    const isServ = view === 'servicos';
    const isLub  = view === 'lub';
    const isAll  = view === 'todos';
    const ctxK = (() => {
      const p = D.PERIODS[state.period] || D.PERIODS.mes;
      const l = D.LOCATIONS[state.location] || D.LOCATIONS.all;
      return { mult: p.scale * l.mult };
    })();
    const rr = mk => mk * ctxK.mult;
    // Loja: BEB/TAB/LAN/CV  ·  Serviços: SRV/LUB
    const cats = D.convCategories(state.period, state.location);
    const filteredCats = cats.filter(g =>
      isAll  ? true :
      isLoja ? ['BEB','TAB','LAN','CV'].includes(g.cat) :
      isServ ? ['SRV'].includes(g.cat) :
      isLub  ? ['LUB'].includes(g.cat) : false);
    const totRec = filteredCats.reduce((s,g)=>s+g.receita, 0);
    const totMg  = filteredCats.reduce((s,g)=>s+g.margem, 0);
    const totCmv = filteredCats.reduce((s,g)=>s+g.cmv, 0);
    const totQtd = filteredCats.reduce((s,g)=>s+g.qtd, 0);
    const totMgPct = totRec ? totMg/totRec*100 : 0;
    const ticket = totRec / Math.max(1, totQtd);
    $('#kpi-row-conv').innerHTML = [
      kpiCard({id:'kv-rec', label: isAll ? 'Receita Conv. + Serv.' : (isLoja ? 'Receita Conveniência' : (isServ ? 'Receita Serviços' : 'Receita Lubrificantes')),  value: D.fmtBRL(totRec), dM: isLoja ? 11.2 : (isServ ? 8.6 : (isLub ? 7.4 : 10.4)), dY: 18.4}),
      kpiCard({id:'kv-mg',  label:'Margem Bruta', value: D.fmtBRL(totMg), dM: isLoja ? 12.8 : 9.4, dY: 21.2}),
      kpiCard({id:'kv-mp',  label:'Margem %', value: totMgPct.toFixed(1).replace('.',',')+'%', dM: 1.2, dY: 2.1, deltaPP: true}),
      kpiCard({id:'kv-tk',  label:'Ticket Médio', value: 'R$ ' + ticket.toFixed(2).replace('.',','), dM: 5.1, dY: 8.2}),
    ].join('');
    const sm = b => Array.from({length:16},(_,i)=>b*(0.7 + Math.abs(Math.sin((i+b)*0.4))*0.6));
    const accentColor = isLoja ? c.conveniencia : (isServ ? c.servicos : (isLub ? c.lubrificantes : c.combustivel));
    paintKPISpark('kv-rec', sm(totRec/16), accentColor);
    paintKPISpark('kv-mg',  sm(totMg/16), '#16a34a');
    paintKPISpark('kv-mp',  Array.from({length:16},()=>totMgPct+Math.random()*2-1), accentColor);
    paintKPISpark('kv-tk',  Array.from({length:16},()=>ticket+(Math.random()*2-1)), accentColor);

    const ev = D.convEvolution(state.period, state.location);
    if (charts.conv) charts.conv.destroy();
    const scaleEvo = isAll ? 1 : (isLoja ? 0.5 : (isServ ? 0.3 : 0.2));
    charts.conv = window.PICharts.convArea($('#chart-conv'), ev.labels, ev.receita.map(v => v * scaleEvo), ev.margem.map(v => v * scaleEvo));

    // Donut — categories normally; for serviços/lubrificantes use the products inside
    const useProducts = (isServ || isLub) && filteredCats.length === 1 && filteredCats[0].products.length;
    const PROD_PALETTE = ['#0073BB','#EC7211','#6B40C4','#1D8102','#0891b2','#db2777','#94a3b8'];
    const donutItems = useProducts
      ? filteredCats[0].products.map((p, i) => ({ label: p.name, value: p.receita, color: PROD_PALETTE[i % PROD_PALETTE.length] }))
      : filteredCats.map(g => ({ label: g.label, value: g.receita, color: g.color }));
    $('#conv-donut-total').textContent = D.fmtBRL(totRec);
    if (charts.convDonut) charts.convDonut.destroy();
    charts.convDonut = window.PICharts.donut($('#chart-conv-donut'),
      donutItems.map(i=>i.label), donutItems.map(i=>i.value), donutItems.map(i=>i.color));
    $('#conv-donut-legend').innerHTML = donutItems.map(i => `
      <div class="dl-row">
        <div class="dl-dot" style="background:${i.color}"></div>
        <span class="dl-name">${i.label}</span>
        <span class="dl-pct">${(i.value / totRec * 100).toFixed(1).replace('.',',')}%</span>
      </div>`).join('');

    // Scatter — filter to relevant points
    const allPts = D.convScatter(state.period, state.location);
    const lojaColors = ['#EC7211', '#6B40C4', '#1D8102', '#94a3b8'];
    const servColors = ['#0891b2'];
    const lubColors  = ['#db2777'];
    const pts = allPts.filter(p =>
      isAll  ? true :
      isLoja ? lojaColors.includes(p.color) :
      isServ ? servColors.includes(p.color) :
      isLub  ? lubColors.includes(p.color) : false);
    if (pts.length > 0) {
      const medianQty = median(pts.map(p=>p.qty));
      const medianMg  = median(pts.map(p=>p.mg));
      if (charts.scatter) charts.scatter.destroy();
      charts.scatter = window.PICharts.scatterQuadrants($('#chart-scatter'), pts, medianQty, medianMg);
    }

    // Breakdown table
    $('#conv-cat-tbody').innerHTML = filteredCats.map(g => `
      <tr class="clickable" data-conv-cat="${g.cat}">
        <td><div class="seg-cell"><div class="seg-dot" style="background:${g.color}"></div>${g.label}</div></td>
        <td><div class="bar-cell"><div class="bar-track"><div class="bar-fill" style="width:${g.receita/totRec*100}%; background:${g.color}"></div></div><span class="bar-num">${(g.receita/totRec*100).toFixed(1).replace('.',',')}%</span></div></td>
        <td class="r">${g.qtd.toLocaleString('pt-BR')}</td>
        <td class="r">${D.fmtBRLFull(g.receita)}</td>
        <td class="r">${D.fmtBRLFull(g.cmv)}</td>
        <td class="r">${D.fmtBRLFull(g.margem)}</td>
        <td class="r"><b>${g.margemPct.toFixed(1).replace('.',',')}%</b></td>
      </tr>`).join('');
    $('#conv-cat-tot-qtd').textContent = totQtd.toLocaleString('pt-BR');
    $('#conv-cat-tot-rec').textContent = D.fmtBRLFull(totRec);
    $('#conv-cat-tot-cmv').textContent = D.fmtBRLFull(totCmv);
    $('#conv-cat-tot-mg').textContent  = D.fmtBRLFull(totMg);
    $('#conv-cat-tot-mgpct').textContent = totMgPct.toFixed(1).replace('.',',') + '%';

    $$('#conv-cat-tbody tr').forEach(tr => {
      tr.addEventListener('click', () => openConvCatDrillDown(filteredCats.find(c => c.cat === tr.dataset.convCat)));
    });
  }

  function openConvCatDrillDown(g) {
    if (!g) return;
    const D = window.PIData;
    $('#drawer-title').innerHTML = `<div class="seg-dot" style="background:${g.color};width:14px;height:14px;border-radius:3px"></div> ${g.label}`;
    const maxRev = Math.max(...g.products.map(p => p.receita));
    $('#drawer-body').innerHTML = `
      <div style="font-size:12px;font-weight:600;color:hsl(var(--muted-foreground));text-transform:uppercase;letter-spacing:1px;margin-bottom:10px">Produtos (${g.products.length})</div>
      ${g.products.map(p => `
        <div style="display:flex;flex-direction:column;gap:6px;padding:12px 0;border-bottom:1px solid hsl(var(--border));">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:10px">
            <div style="font-size:13px;font-weight:500;color:hsl(var(--foreground))">${p.name}</div>
            <div style="font-size:13px;font-weight:600;font-variant-numeric:tabular-nums">${D.fmtBRL(p.receita)}</div>
          </div>
          <div style="display:flex;align-items:center;gap:10px;font-size:11px;color:hsl(var(--muted-foreground))">
            <div style="flex:1;height:4px;background:hsl(var(--muted));border-radius:99px;overflow:hidden"><div style="height:100%;width:${(p.receita/maxRev*100).toFixed(1)}%;background:${g.color};border-radius:99px"></div></div>
            <span style="min-width:50px;text-align:right">${p.qtd.toLocaleString('pt-BR')} un</span>
            <span style="min-width:50px;text-align:right;color:${p.margemPct >= 50 ? 'hsl(var(--success))' : 'hsl(var(--muted-foreground))'};font-weight:600">${p.margemPct.toFixed(1).replace('.',',')}%</span>
            <span class="${p.trend>0.02?'trend-up':p.trend<-0.02?'trend-down':'trend-flat'}" style="min-width:42px;text-align:right">${p.trend>0.02?'↑':p.trend<-0.02?'↓':'→'} ${(p.trend*100).toFixed(1).replace('.',',')}%</span>
          </div>
        </div>`).join('')}
    `;
    $('#drawer').classList.add('open');
    $('#drawer-overlay').classList.add('open');
  }
  function median(arr) { const s = [...arr].sort((a,b)=>a-b); const m = Math.floor(s.length/2); return s.length%2 ? s[m] : (s[m-1]+s[m])/2; }

  // ---------- DRE ----------
  function renderDRE() {
    const D = window.PIData;
    const c = window.PICharts.C;
    const series = D.dreSeries(state.dre.year, state.dre.monthIdx, state.location);
    const cur = series[series.length - 1];
    const prev = series[series.length - 2];

    $('#dre-label') && ($('#dre-label').textContent = cur.label);
    const ys = document.getElementById('dre-year');  if (ys) ys.value = String(state.dre.year);
    const ms = document.getElementById('dre-month'); if (ms) ms.value = String(state.dre.monthIdx);

    $('#kpi-row-dre').innerHTML = [
      kpiCard({id:'kd-rec', label:'Receita Bruta', icon: ICON.money, value: D.fmtBRL(cur.receita), dM: (cur.receita/prev.receita-1)*100, dY: 14.2}),
      kpiCard({id:'kd-cmv', label:'CMV', icon: ICON.cmv, value: D.fmtBRL(cur.cmv), dM: (cur.cmv/prev.cmv-1)*100, dY: 10.8}),
      kpiCard({id:'kd-mg',  label:'Margem Bruta', icon: ICON.margin, value: D.fmtBRL(cur.margem), dM: (cur.margem/prev.margem-1)*100, dY: 18.9}),
      kpiCard({id:'kd-mp',  label:'Margem %', icon: ICON.pct, value: cur.margemPct.toFixed(1).replace('.',',')+'%', dM: cur.margemPct - prev.margemPct, dY: 1.4, deltaPP: true}),
    ].join('');
    paintKPISpark('kd-rec', series.map(m=>m.receita), c.combustivel);
    paintKPISpark('kd-cmv', series.map(m=>m.cmv), '#dc2626');
    paintKPISpark('kd-mg',  series.map(m=>m.margem), '#16a34a');
    paintKPISpark('kd-mp',  series.map(m=>m.margemPct), c.combustivel);

    // Waterfall
    if (charts.waterfall) charts.waterfall.destroy();
    charts.waterfall = window.PICharts.waterfall($('#chart-waterfall'), [
      { label: 'Receita Bruta', type: 'start', value: cur.receita },
      { label: '(−) Descontos', type: 'minus', value: cur.desconto },
      { label: '(−) CMV',       type: 'minus', value: cur.cmv },
      { label: 'Margem Bruta',  type: 'total', value: cur.margem },
    ]);

    // Margin evolution last 6 months
    const segs = {
      combustivel:  series.map(m => m.segmentos.combustivel),
      conveniencia: series.map(m => m.segmentos.conveniencia),
      lubrificantes:series.map(m => m.segmentos.lubrificantes),
      servicos:     series.map(m => m.segmentos.servicos),
    };
    if (charts.marginEvo) charts.marginEvo.destroy();
    charts.marginEvo = window.PICharts.marginEvolution($('#chart-margin-evo'), series.map(m=>m.label), segs);

    // Table
    const lines = [
      { label: 'Receita Bruta', getter: m => m.receita },
      { label: '(−) Descontos', getter: m => m.desconto, neg: true },
      { label: 'Receita Líquida', getter: m => m.receitaLiq, total: true },
      { label: '(−) CMV', getter: m => m.cmv, neg: true },
      { label: 'Margem Bruta', getter: m => m.margem, result: true },
      { label: 'Margem %', getter: m => m.margemPct, pct: true, isPP: true },
    ];
    // update header months
    series.forEach((m, i) => {
      const th = document.getElementById('dre-th-m' + (6 - i));
      if (th) th.textContent = m.label;
    });
    $('#dre-tbody').innerHTML = lines.map(l => {
      const cells = series.map(m => l.pct ? l.getter(m).toFixed(1).replace('.',',') + '%' : D.fmtBRL(l.getter(m)));
      const cv = l.getter(cur), pv = l.getter(prev);
      const delta = l.pct ? (cv - pv) : ((cv/pv - 1) * 100);
      const ytd = series.reduce((s,m)=>s+l.getter(m),0);
      const cls = l.result ? 'dre-row dre-row-result' : (l.total ? 'dre-row dre-row-total' : 'dre-row');
      return `<tr class="${cls}">
        <td><b>${l.label}</b></td>
        ${cells.map((c, i) => `<td class="r mono" ${i===cells.length-1?'style="font-weight:600"':''}>${l.neg?'−':''}${c}</td>`).join('')}
        <td class="r">${deltaTag(delta, l.isPP)}</td>
        <td class="r mono">${l.pct ? '—' : D.fmtBRL(ytd)}</td>
      </tr>`;
    }).join('');
  }

  // ---------- Sincronização ----------
  function renderSync() {
    const list = [
      { time: '16/05 03:00:12', loc: 'JAM Centro', status: 'ok',    records: 1248 },
      { time: '16/05 03:00:08', loc: 'JAM Rodovia',status: 'ok',    records: 1612 },
      { time: '16/05 03:00:05', loc: 'JAM Norte',  status: 'ok',    records: 642  },
      { time: '16/05 03:00:02', loc: 'JAM Sul',    status: 'ok',    records: 411  },
      { time: '15/05 03:01:38', loc: 'JAM Centro', status: 'warn',  records: 1216, note: 'retry 1×' },
      { time: '15/05 03:00:14', loc: 'JAM Rodovia',status: 'ok',    records: 1588 },
      { time: '15/05 03:00:08', loc: 'JAM Norte',  status: 'ok',    records: 619  },
      { time: '15/05 03:00:05', loc: 'JAM Sul',    status: 'ok',    records: 402  },
    ];
    $('#sync-list').innerHTML = list.map(r => `
      <div class="sync-row">
        <div class="sync-dot ${r.status === 'ok' ? 'ok' : r.status === 'warn' ? 'warn' : 'err'}" style="width:8px;height:8px"></div>
        <div class="sync-time">${r.time}</div>
        <div class="sync-loc">${r.loc}</div>
        <span class="badge ${r.status==='ok'?'badge-success':r.status==='warn'?'badge-warning':'badge-danger'}">${r.status==='ok'?'OK':r.status==='warn'?'AVISO':'ERRO'}</span>
        ${r.note ? `<span style="font-size:11px;color:hsl(var(--muted-foreground))">${r.note}</span>` : ''}
        <div class="sync-recs">${r.records.toLocaleString('pt-BR')} registros</div>
      </div>
    `).join('');
  }

  // ---------- Configurações ----------
  function renderConfig() {
    const locs = [
      { code: 'JC', name: 'JAM Centro',  meta: 'CD_ESTAB 001 · 4 bombas · 2 ilhas',  status: 'OK' },
      { code: 'JR', name: 'JAM Rodovia', meta: 'CD_ESTAB 002 · 6 bombas · 3 ilhas',  status: 'OK' },
      { code: 'JN', name: 'JAM Norte',   meta: 'CD_ESTAB 003 · 3 bombas · 2 ilhas',  status: 'OK' },
      { code: 'JS', name: 'JAM Sul',     meta: 'CD_ESTAB 004 · 3 bombas · 1 ilha',   status: 'OK' },
    ];
    $('#cfg-loc-list').innerHTML = locs.map(l => `
      <div class="cfg-loc-row">
        <div class="cfg-loc-avatar">${l.code}</div>
        <div style="flex:1"><div class="cfg-loc-name">${l.name}</div><div class="cfg-loc-meta">${l.meta}</div></div>
        <span class="badge badge-success">${l.status}</span>
      </div>`).join('');
  }

  // ---------- Re-render router ----------
  function rerenderCurrent() {
    // Update crumb
    const pageNames = {
      'visao-geral': 'Visão Geral', 'combustivel': 'Combustível',
      'conveniencia': 'Conveniência', 'dre': 'DRE Mensal',
      'sincronizacao': 'Sincronização', 'configuracoes': 'Configurações'
    };
    $('#crumb-page').textContent = pageNames[state.page];
    const D = window.PIData;
    $('#crumb-context').textContent = (D.LOCATIONS[state.location].label) + ' · ' + (D.PERIODS[state.period].label);

    switch (state.page) {
      case 'visao-geral':    renderVisaoGeral(); break;
      case 'combustivel':    renderCombustivel(); break;
      case 'conveniencia':   renderConveniencia(); break;
      case 'dre':            renderDRE(); break;
      case 'sincronizacao':  renderSync(); break;
      case 'configuracoes':  renderConfig(); break;
    }
    state.initedPages.add(state.page);
  }

  // ---------- Navigation ----------
  function setPage(name) {
    state.page = name;
    $$('.sb-item').forEach(b => b.classList.toggle('active', b.dataset.page === name));
    $$('.page').forEach(p => p.classList.toggle('active', p.id === 'page-' + name));
    // Hide period selector on config/sync/DRE pages; show DRE toolbar on DRE
    const periodVisible = !['sincronizacao','configuracoes','dre'].includes(name);
    $('#period-tabs').style.display = periodVisible ? '' : 'none';
    const dreToolbar = document.getElementById('dre-date-toolbar');
    if (dreToolbar) dreToolbar.style.display = name === 'dre' ? 'flex' : 'none';
    const locVisible = !['sincronizacao','configuracoes'].includes(name);
    $('#location-select').style.display = locVisible ? '' : 'none';
    rerenderCurrent();
  }

  function setPeriod(p) {
    state.period = p;
    // Sync DRE: "Mês" → current month, "Mês ant." → previous, Hoje/Semana → current
    const cur = { year: 2026, monthIdx: 4 }; // current "real" month
    if (p === 'mes' || p === 'hoje' || p === 'semana') {
      state.dre.year = cur.year; state.dre.monthIdx = cur.monthIdx;
    } else if (p === 'mes-ant') {
      let y = cur.year, m = cur.monthIdx - 1;
      if (m < 0) { m = 11; y--; }
      state.dre.year = y; state.dre.monthIdx = m;
    }
    rerenderCurrent();
  }
  function setLocation(l) { state.location = l; rerenderCurrent(); }

  // ---------- Sync flow ----------
  function runSync(btn) {
    if (!btn) return;
    const original = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner"></div> Sincronizando…';
    setTimeout(() => {
      btn.innerHTML = original;
      btn.disabled = false;
      showToast('Sincronização concluída · 3.913 registros novos', 'success');
      if (state.page === state.page) rerenderCurrent();
    }, 1800);
  }
  function showToast(text, kind) {
    const t = $('#toast');
    $('#toast-text').textContent = text;
    t.className = 'toast ' + (kind || 'info');
    requestAnimationFrame(() => t.classList.add('show'));
    setTimeout(() => t.classList.remove('show'), 2800);
  }

  // ---------- DRE month nav ----------
  function dreShift(dir) {
    state.dre.monthIdx += dir;
    if (state.dre.monthIdx < 0) { state.dre.monthIdx = 11; state.dre.year--; }
    if (state.dre.monthIdx > 11) { state.dre.monthIdx = 0; state.dre.year++; }
    const yearSelect = document.getElementById('dre-year');
    if (yearSelect) yearSelect.value = String(state.dre.year);
    renderDRE();
  }

  // ---------- Boot ----------
  function boot() {
    // Sidebar nav
    $$('.sb-item').forEach(b => b.addEventListener('click', () => setPage(b.dataset.page)));

    // Period — single segmented selector with all options
    $$('#period-tabs button').forEach(b => b.addEventListener('click', () => {
      $$('#period-tabs button').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      setPeriod(b.dataset.period);
    }));

    // Location
    $('#location-select').addEventListener('change', e => setLocation(e.target.value));

    // Top sort
    $$('#top-sort button').forEach(b => b.addEventListener('click', () => {
      $$('#top-sort button').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      state.topSort = b.dataset.sort;
      renderTop(window.PIData);
    }));

    // Combustível mode/style/arla
    $$('#comb-mode button').forEach(b => b.addEventListener('click', () => {
      $$('#comb-mode button').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      state.combMode = b.dataset.mode;
      renderCombustivel();
    }));
    $$('#comb-style button').forEach(b => b.addEventListener('click', () => {
      $$('#comb-style button').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      state.combStyle = b.dataset.style;
      renderCombustivel();
    }));
        $$('#conv-view button').forEach(b => b.addEventListener('click', () => {
      $$('#conv-view button').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      state.convView = b.dataset.view;
      renderConveniencia();
    }));
    $('#comb-arla').addEventListener('click', e => {
      const b = e.target.closest('button[data-arla]');
      if (!b) return;
      $$('#comb-arla button').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      state.includeArla = b.dataset.arla === 'on';
      renderCombustivel();
    });

    // Sync buttons
    $('#btn-sync').addEventListener('click', () => runSync($('#btn-sync')));
    $('#btn-sync-2').addEventListener('click', () => runSync($('#btn-sync-2')));

    // DRE nav
    $('#dre-prev').addEventListener('click', () => dreShift(-1));
    $('#dre-next').addEventListener('click', () => dreShift(+1));
    $('#dre-year').addEventListener('change', e => {
      state.dre.year = parseInt(e.target.value, 10);
      renderDRE();
    });
    $('#dre-month').addEventListener('change', e => {
      state.dre.monthIdx = parseInt(e.target.value, 10);
      renderDRE();
    });

    // Drawer
    $('#drawer-close').addEventListener('click', closeDrillDown);
    $('#drawer-overlay').addEventListener('click', closeDrillDown);

    // Initial render
    rerenderCurrent();
  }

  // expose for tweaks panel
  window.PIApp = { rerenderCurrent, getState: () => state, setPage, runSync };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
