/* PostoInsight — mock data layer.
 * Period × Location aware. Values shift deterministically across filters.
 */
(function () {
  'use strict';

  // ---------- Seeded RNG so re-renders stay stable per (period, location) ----------
  function seedFromString(s) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < s.length; i++) {
      h = (h ^ s.charCodeAt(i)) * 16777619 >>> 0;
    }
    return h >>> 0;
  }
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = a;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function rng(seed) {
    const s = typeof seed === 'string' ? seedFromString(seed) : seed >>> 0;
    return mulberry32(s);
  }
  const jitter = (r, base, pct) => base * (1 + (r() * 2 - 1) * pct);

  // ---------- Period & Location dimensions ----------
  const PERIODS = {
    'hoje':     { label: 'Hoje',         scale: 1 / 30,  bars: 24, barUnit: 'hora',  barFmt: i => String(i).padStart(2,'0') + 'h' },
    'semana':   { label: 'Esta semana',  scale: 7 / 30,  bars: 7,  barUnit: 'dia',   barFmt: i => ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'][i] },
    'mes':      { label: 'Este mês',     scale: 1,       bars: 30, barUnit: 'dia',   barFmt: i => String(i+1).padStart(2,'0') },
    'mes-ant':  { label: 'Mês anterior', scale: 0.94,    bars: 30, barUnit: 'dia',   barFmt: i => String(i+1).padStart(2,'0') },
  };

  const LOCATIONS = {
    'all':      { label: 'Todas as unidades', mult: 1.00 },
    'centro':   { label: 'JAM Centro',        mult: 0.32 },
    'rodovia':  { label: 'JAM Rodovia',       mult: 0.41 },
    'norte':    { label: 'JAM Norte',         mult: 0.16 },
    'sul':      { label: 'JAM Sul',           mult: 0.11 },
  };

  // ---------- Base monthly totals (rede inteira, mês atual) ----------
  const BASE = {
    receita:   1085620,
    cmv:        825620,
    margem:     258770,
    margemPct:  23.9,
    itens:       38420,
    volume:     185420,   // litros — combustível
    receitaComb: 980300,
    cmvComb:     810200,
    margemComb:  169300,
    margemCombPct: 17.27,
    receitaConv:  63320,
    margemConv:   55670,
    margemConvPct: 87.9,
    ticketConv:    18.40,
  };

  function ctx(period, location) {
    const p = PERIODS[period] || PERIODS.mes;
    const l = LOCATIONS[location] || LOCATIONS.all;
    return { period, location, p, l, mult: p.scale * l.mult };
  }

  // ---------- KPI generator ----------
  function kpis(period, location) {
    const c = ctx(period, location);
    const r = rng('kpi:' + period + ':' + location);
    const mk = (baseTotal, fmt, decimals) => {
      const value = baseTotal * c.mult;
      const dM = (r() * 22 - 6);   // -6% .. +16%
      const dY = (r() * 32 - 4);   // -4% .. +28%
      const spark = Array.from({ length: 16 }, () => jitter(r, value / c.p.bars, 0.35));
      return { value, formatted: fmt(value, decimals), dM, dY, spark };
    };
    return {
      receita:   mk(BASE.receita,  fmtBRL),
      cmv:       mk(BASE.cmv,      fmtBRL),
      margem:    mk(BASE.margem,   fmtBRL),
      margemPct: { value: BASE.margemPct + (r()*2-1)*1.6, formatted: fmtPct(BASE.margemPct + (r()*2-1)*1.6, 1),
                   dM: (r()*4-1), dY: (r()*5-1), spark: Array.from({length:16}, ()=> 22 + r()*4) },
      itens:     mk(BASE.itens,    fmtInt),
    };
  }

  // ---------- Revenue evolution ----------
  function revenueSeries(period, location) {
    const c = ctx(period, location);
    const r = rng('rev:' + period + ':' + location);
    const labels = Array.from({ length: c.p.bars }, (_, i) => c.p.barFmt(i));
    // weekday pattern weight
    const weekWeight = i => {
      if (c.p.bars === 7) return [1,1.05,1.1,1.15,1.4,1.6,0.9][i];
      if (c.p.bars === 30) return 0.85 + ((i%7) >= 4 ? 0.25 : 0) + (i%7===5 ? 0.15 : 0);
      if (c.p.bars === 24) return Math.max(0.1, Math.sin((i-6)/24*Math.PI*1.4) + 0.6);
      return 1;
    };
    const baseDaily = BASE.receita * c.l.mult / 30;
    const receita = labels.map((_, i) => Math.max(0, jitter(r, baseDaily * weekWeight(i) * (c.p.bars===24 ? 1/24*30 : c.p.bars===7 ? 1 : 1), 0.18)));
    const margemPct = labels.map(() => 21 + r() * 6);
    return { labels, receita, margemPct };
  }

  // ---------- Segment mix ----------
  function segmentMix(period, location) {
    const c = ctx(period, location);
    const r = rng('seg:' + period + ':' + location);
    const total = BASE.receita * c.mult;
    // base shares (vary slightly with location)
    const sCenter   = { combustivel: 0.870, lubrificantes: 0.045, servicos: 0.025, conveniencia: 0.060 };
    const sRodovia  = { combustivel: 0.925, lubrificantes: 0.035, servicos: 0.015, conveniencia: 0.025 };
    const sNorte    = { combustivel: 0.880, lubrificantes: 0.040, servicos: 0.020, conveniencia: 0.060 };
    const sSul      = { combustivel: 0.860, lubrificantes: 0.050, servicos: 0.030, conveniencia: 0.060 };
    const sAll      = { combustivel: 0.903, lubrificantes: 0.039, servicos: 0.017, conveniencia: 0.041 };
    const map = { all: sAll, centro: sCenter, rodovia: sRodovia, norte: sNorte, sul: sSul };
    const base = map[location] || sAll;
    const shares = Object.fromEntries(Object.entries(base).map(([k,v]) => [k, v * (1 + (r()*2-1)*0.04)]));
    const sum = Object.values(shares).reduce((a,b)=>a+b,0);
    Object.keys(shares).forEach(k => shares[k] /= sum);
    // CMV/margem ratios by segment
    const margemRatio = { combustivel: 0.17, lubrificantes: 0.42, servicos: 0.78, conveniencia: 0.88 };
    return {
      total,
      rows: ['combustivel','lubrificantes','servicos','conveniencia'].map(k => {
        const receita = total * shares[k];
        const margem = receita * margemRatio[k];
        return { key: k, label: labelOf(k), color: colorOf(k), share: shares[k], receita, cmv: receita - margem, margem, margemPct: margemRatio[k] * 100 };
      })
    };
  }

  // ---------- Top 10 products ----------
  const PRODUCT_CATALOG = [
    { name: 'Gasolina Comum',      cat: 'Combustível',   group: 'Gasolina', share: 0.32, mg: 0.155, price: 5.89 },
    { name: 'Diesel S-10',         cat: 'Combustível',   group: 'Diesel',   share: 0.28, mg: 0.182, price: 6.12 },
    { name: 'Gasolina Aditivada',  cat: 'Combustível',   group: 'Gasolina', share: 0.16, mg: 0.198, price: 6.21 },
    { name: 'Etanol Hidratado',    cat: 'Combustível',   group: 'Etanol',   share: 0.11, mg: 0.135, price: 4.39 },
    { name: 'Diesel S-500',        cat: 'Combustível',   group: 'Diesel',   share: 0.08, mg: 0.167, price: 5.78 },
    { name: 'Arla 32',             cat: 'Arla',          group: 'Arla 32',  share: 0.025, mg: 0.241, price: 3.49 },
    { name: 'Cerveja Long-Neck',   cat: 'Bebidas',       group: 'Cerveja',  share: 0.012, mg: 0.480, price: 6.50 },
    { name: 'Cigarro Marlboro',    cat: 'Tabacaria',     group: 'Cigarro',  share: 0.009, mg: 0.220, price: 9.90 },
    { name: 'Refrigerante 600ml',  cat: 'Bebidas',       group: 'Refri',    share: 0.007, mg: 0.510, price: 7.20 },
    { name: 'Troca de Óleo',       cat: 'Serviços',      group: 'Lavagem',  share: 0.006, mg: 0.860, price: 89.00 },
    { name: 'Lubrificante Mobil',  cat: 'Lubrificantes', group: 'Motor',    share: 0.006, mg: 0.420, price: 42.50 },
    { name: 'Salgado Quente',      cat: 'Alimentos',     group: 'Snacks',   share: 0.004, mg: 0.580, price: 8.00 },
  ];

  function topProducts(period, location, sort) {
    const c = ctx(period, location);
    const r = rng('top:' + period + ':' + location);
    const total = BASE.receita * c.mult;
    return PRODUCT_CATALOG.map(p => {
      const receita = total * p.share * (1 + (r()*2-1)*0.05);
      const mg = p.mg * (1 + (r()*2-1)*0.06);
      const qtd = receita / p.price;
      return { ...p, receita, margemPct: mg * 100, qtd: Math.round(qtd) };
    }).sort((a,b) => sort === 'margem' ? b.margemPct - a.margemPct : b.receita - a.receita).slice(0, 10);
  }

  // ---------- Combustível breakdown ----------
  function combProducts(period, location, opts) {
    opts = opts || {};
    const c = ctx(period, location);
    const r = rng('comb:' + period + ':' + location);
    const items = [
      { name: 'Gasolina Comum',     shareV: 0.35, mg: 0.155, price: 5.89, cost: 4.98 },
      { name: 'Diesel S-10',        shareV: 0.31, mg: 0.182, price: 6.12, cost: 5.01 },
      { name: 'Gasolina Aditivada', shareV: 0.17, mg: 0.198, price: 6.21, cost: 4.98 },
      { name: 'Etanol Hidratado',   shareV: 0.10, mg: 0.135, price: 4.39, cost: 3.80 },
      { name: 'Diesel S-500',       shareV: 0.05, mg: 0.167, price: 5.78, cost: 4.81 },
    ];
    if (opts.includeArla) {
      items.push({ name: 'Arla 32', shareV: 0.02, mg: 0.241, price: 3.49, cost: 2.65 });
      // renormalize
      const sum = items.reduce((s,i)=>s+i.shareV,0);
      items.forEach(i => i.shareV /= sum);
    }
    const volTotal = BASE.volume * c.mult;
    return items.map(p => {
      const volume = volTotal * p.shareV * (1 + (r()*2-1)*0.04);
      const receita = volume * p.price;
      const cmv = volume * p.cost;
      const sparkBase = volume / c.p.bars;
      const spark = Array.from({ length: 14 }, () => jitter(r, sparkBase, 0.25));
      const trend = spark.slice(-3).reduce((a,b)=>a+b,0) / spark.slice(-6,-3).reduce((a,b)=>a+b,0) - 1;
      return {
        name: p.name,
        volume, share: p.shareV * 100, receita, cmv,
        margem: receita - cmv, margemPct: (1 - p.cost/p.price) * 100,
        price: p.price, cost: p.cost, spark, trend
      };
    });
  }

  // ---------- Combustível evolution per product ----------
  function combEvolution(period, location, mode, opts) {
    opts = opts || {};
    const c = ctx(period, location);
    const r = rng('combev:' + period + ':' + location + ':' + mode);
    const products = ['Gasolina Comum','Diesel S-10','Gasolina Aditivada','Etanol Hidratado','Diesel S-500'];
    if (opts.includeArla) products.push('Arla 32');
    const labels = Array.from({ length: c.p.bars }, (_, i) => c.p.barFmt(i));
    const baseValues = { 'Gasolina Comum': 0.35, 'Diesel S-10': 0.31, 'Gasolina Aditivada': 0.17, 'Etanol Hidratado': 0.10, 'Diesel S-500': 0.05, 'Arla 32': 0.02 };
    const total = (mode === 'receita' ? BASE.receitaComb : BASE.volume) * c.mult;
    return {
      labels,
      datasets: products.map(name => ({
        name,
        data: labels.map(() => jitter(r, total * baseValues[name] / c.p.bars, 0.2))
      }))
    };
  }

  // ---------- Conveniência ----------
  // ---------- Conveniência ----------
  const CONV_PRODUCTS = [
    { name: 'Cerveja Heineken 350ml', cat: 'BEB', segment: 'conveniencia', share: 0.155, mg: 0.421, price: 5.39 },
    { name: 'Coca-Cola 600ml',        cat: 'BEB', segment: 'conveniencia', share: 0.101, mg: 0.388, price: 7.20 },
    { name: 'Cigarro Marlboro 20un',  cat: 'TAB', segment: 'conveniencia', share: 0.098, mg: 0.215, price: 9.90 },
    { name: 'Salgado Forneado',       cat: 'LAN', segment: 'conveniencia', share: 0.076, mg: 0.582, price: 8.00 },
    { name: 'Café Expresso',           cat: 'LAN', segment: 'servicos',     share: 0.066, mg: 0.792, price: 5.50 },
    { name: 'Água Mineral 500ml',     cat: 'BEB', segment: 'conveniencia', share: 0.051, mg: 0.512, price: 4.50 },
    { name: 'Sanduíche Natural',      cat: 'LAN', segment: 'conveniencia', share: 0.047, mg: 0.488, price: 9.80 },
    { name: 'Energético Red Bull',    cat: 'BEB', segment: 'conveniencia', share: 0.042, mg: 0.351, price: 12.50 },
    { name: 'Chocolate Lacta 90g',    cat: 'CV',  segment: 'conveniencia', share: 0.029, mg: 0.445, price: 6.80 },
    { name: 'Pastel de Carne',        cat: 'LAN', segment: 'conveniencia', share: 0.023, mg: 0.601, price: 9.50 },
    { name: 'Lavagem Simples',        cat: 'SRV', segment: 'servicos',     share: 0.085, mg: 0.825, price: 35.00 },
    { name: 'Troca de Óleo',          cat: 'SRV', segment: 'servicos',     share: 0.135, mg: 0.860, price: 89.00 },
    { name: 'Lubrificante Mobil 5W30',cat: 'LUB', segment: 'lubrificantes',share: 0.062, mg: 0.420, price: 42.50 },
  ];
  function convBreakdown(period, location) {
    const c = ctx(period, location);
    const r = rng('convbk:' + period + ':' + location);
    const total = (BASE.receitaConv + 41376 + 18450) * c.mult; // conv + lub + serv
    return CONV_PRODUCTS.map(p => {
      const receita = total * p.share * (1 + (r()*2-1)*0.05);
      const mg = p.mg + (r()*2-1)*0.02;
      const qtd = receita / p.price;
      const sparkBase = receita / c.p.bars;
      const spark = Array.from({ length: 14 }, () => jitter(r, sparkBase, 0.22));
      const trend = spark.slice(-3).reduce((a,b)=>a+b,0) / spark.slice(-6,-3).reduce((a,b)=>a+b,0) - 1;
      return { ...p, receita, margemPct: mg * 100, qtd: Math.round(qtd), spark, trend };
    }).sort((a,b) => b.receita - a.receita);
  }

  const CONV_CAT_META = {
    BEB: { label: 'Bebidas',       color: '#EC7211' },
    TAB: { label: 'Tabacaria',     color: '#6B40C4' },
    LAN: { label: 'Lanchonete',    color: '#1D8102' },
    CV:  { label: 'Outros',        color: '#94a3b8' },
    SRV: { label: 'Serviços',      color: '#0891b2' },
    LUB: { label: 'Lubrificantes', color: '#db2777' },
  };
  function convCategories(period, location) {
    const products = convBreakdown(period, location);
    const groups = {};
    products.forEach(p => {
      if (!groups[p.cat]) groups[p.cat] = { cat: p.cat, ...CONV_CAT_META[p.cat], products: [], receita: 0, margem: 0, cmv: 0, qtd: 0 };
      const g = groups[p.cat];
      g.products.push(p);
      g.receita += p.receita;
      g.margem  += p.receita * (p.margemPct / 100);
      g.cmv     += p.receita * (1 - p.margemPct / 100);
      g.qtd     += p.qtd;
    });
    const rows = Object.values(groups).map(g => ({ ...g, margemPct: g.margem / g.receita * 100 }));
    const total = rows.reduce((s, g) => s + g.receita, 0);
    rows.forEach(g => g.share = g.receita / total);
    return rows.sort((a, b) => b.receita - a.receita);
  }
  function convMix(period, location) {
    const c = ctx(period, location);
    const total = BASE.receitaConv * c.mult;
    return {
      total,
      rows: [
        { key:'bebidas',   label:'Bebidas',    share:0.284, color:'#EC7211' },
        { key:'servicos',  label:'Serviços',   share:0.285, color:'#0891b2' },
        { key:'tabacaria', label:'Tabacaria',  share:0.199, color:'#6B40C4' },
        { key:'alimentos', label:'Alimentos',  share:0.145, color:'#1D8102' },
        { key:'outros',    label:'Outros',     share:0.087, color:'#94a3b8' },
      ].map(s => ({ ...s, receita: total * s.share }))
    };
  }

  function convEvolution(period, location) {
    const c = ctx(period, location);
    const r = rng('convev:' + period + ':' + location);
    const labels = Array.from({ length: c.p.bars }, (_, i) => c.p.barFmt(i));
    const receitaBase = BASE.receitaConv * c.mult / c.p.bars;
    return {
      labels,
      receita: labels.map(() => jitter(r, receitaBase, 0.22)),
      margem:  labels.map(() => jitter(r, receitaBase * 0.879, 0.22))
    };
  }

  function convScatter(period, location) {
    const c = ctx(period, location);
    const r = rng('sc:' + period + ':' + location);
    const cats = [
      { name:'Cerveja',       color:'#EC7211', qty: 4200, mg: 48,  rev: 27300 },
      { name:'Refrigerantes', color:'#EC7211', qty: 3100, mg: 51,  rev: 18050 },
      { name:'Salgados',      color:'#1D8102', qty: 1800, mg: 58,  rev: 11200 },
      { name:'Cigarros',      color:'#6B40C4', qty: 1400, mg: 22,  rev: 12600 },
      { name:'Energéticos',   color:'#EC7211', qty: 980,  mg: 42,  rev: 6800  },
      { name:'Chocolates',    color:'#1D8102', qty: 720,  mg: 49,  rev: 3700  },
      { name:'Água Mineral',  color:'#EC7211', qty: 1850, mg: 38,  rev: 5500  },
      { name:'Troca Óleo',    color:'#0891b2', qty: 220,  mg: 86,  rev: 18000 },
      { name:'Lavagem',       color:'#0891b2', qty: 340,  mg: 78,  rev: 12200 },
      { name:'Suco',          color:'#EC7211', qty: 480,  mg: 55,  rev: 3200  },
      { name:'Cap. Gás',      color:'#0891b2', qty: 120,  mg: 32,  rev: 8400  },
      { name:'Doces',         color:'#1D8102', qty: 880,  mg: 62,  rev: 2800  },
    ];
    return cats.map(c0 => ({
      ...c0,
      qty: Math.round(c0.qty * c.mult * (1 + (r()*2-1)*0.06)),
      mg: c0.mg + (r()*2-1)*2,
      rev: c0.rev * c.mult * (1 + (r()*2-1)*0.06)
    }));
  }

  // ---------- DRE ----------
  const MONTHS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  function dreMonth(year, monthIdx, location) {
    const c = ctx('mes', location);
    const r = rng('dre:' + year + ':' + monthIdx + ':' + location);
    const seasonal = [0.95, 0.92, 1.0, 1.02, 1.05, 0.98, 0.95, 0.97, 1.04, 1.08, 1.12, 1.18][monthIdx];
    const yScale = year === 2026 ? 1 : 0.92;
    const m = c.l.mult * seasonal * yScale * (1 + (r()*2-1)*0.02);
    const receita = BASE.receita * m * 30 / 30;
    const desc = receita * 0.018;
    const cmv = receita * 0.762;
    const margem = receita - desc - cmv;
    return {
      year, monthIdx, label: MONTHS[monthIdx] + '/' + String(year).slice(-2),
      receita, desconto: desc, receitaLiq: receita - desc, cmv, margem,
      margemPct: margem / receita * 100,
      // Margem por segmento p/ gráfico 6 meses
      segmentos: {
        combustivel:  (16 + (r()*2-1)*1.5),
        conveniencia: (86 + (r()*2-1)*3),
        lubrificantes:(40 + (r()*2-1)*3),
        servicos:     (76 + (r()*2-1)*3),
      }
    };
  }

  function dreSeries(yearEnd, monthEnd, location, view) {
    view = view || 'mensal';
    const COUNT = 6;
    if (view === 'mensal') {
      const months = [];
      let y = yearEnd, m = monthEnd;
      for (let i = 0; i < COUNT; i++) {
        months.unshift(dreMonth(y, m, location));
        m--; if (m < 0) { m = 11; y--; }
      }
      return months;
    }
    if (view === 'trimestral') {
      const endQ = Math.floor(monthEnd / 3);
      let y = yearEnd, q = endQ;
      const out = [];
      for (let i = 0; i < COUNT; i++) {
        const ms = [0,1,2].map(off => dreMonth(y, q*3 + off, location));
        out.unshift(aggregateDRE(ms, `T${q+1}/${String(y).slice(-2)}`, y, q*3));
        q--; if (q < 0) { q = 3; y--; }
      }
      return out;
    }
    if (view === 'semestral') {
      const endS = monthEnd < 6 ? 0 : 1;
      let y = yearEnd, s = endS;
      const out = [];
      for (let i = 0; i < COUNT; i++) {
        const ms = Array.from({length:6}, (_, off) => dreMonth(y, s*6 + off, location));
        out.unshift(aggregateDRE(ms, `S${s+1}/${String(y).slice(-2)}`, y, s*6));
        s--; if (s < 0) { s = 1; y--; }
      }
      return out;
    }
    if (view === 'anual') {
      let y = yearEnd;
      const out = [];
      for (let i = 0; i < COUNT; i++) {
        const ms = Array.from({length:12}, (_, m) => dreMonth(y, m, location));
        out.unshift(aggregateDRE(ms, String(y), y, 0));
        y--;
      }
      return out;
    }
    return [];
  }

  function aggregateDRE(months, label, year, monthIdx) {
    const sum = k => months.reduce((s,m) => s + m[k], 0);
    const receita = sum('receita');
    const desconto = sum('desconto');
    const cmv = sum('cmv');
    const margem = receita - desconto - cmv;
    const avgSeg = k => months.reduce((s,m) => s + m.segmentos[k], 0) / months.length;
    return {
      year, monthIdx, label,
      receita, desconto, receitaLiq: receita - desconto, cmv, margem,
      margemPct: margem / receita * 100,
      segmentos: {
        combustivel:   avgSeg('combustivel'),
        conveniencia:  avgSeg('conveniencia'),
        lubrificantes: avgSeg('lubrificantes'),
        servicos:      avgSeg('servicos'),
      }
    };
  }

  // ---------- Heatmap (4 weeks × 7 days) ----------
  function heatmap(period, location) {
    const c = ctx('mes', location);
    const r = rng('heat:' + period + ':' + location);
    const base = BASE.receita * c.l.mult / 30;
    const days = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
    const dayMult = [0.65, 0.85, 0.95, 1.05, 1.15, 1.45, 1.55];
    const cells = days.map((d, di) => ({
      day: d,
      values: Array.from({length: 4}, () => jitter(r, base * dayMult[di], 0.15))
    }));
    const all = cells.flatMap(c => c.values);
    return { cells, min: Math.min(...all), max: Math.max(...all) };
  }

  // ---------- Helpers / formatting ----------
  function labelOf(k){
    return ({combustivel:'Combustível',lubrificantes:'Lubrificantes',servicos:'Serviços',conveniencia:'Conveniência',arla:'Arla 32'})[k] || k;
  }
  function colorOf(k){
    return ({combustivel:'#0073BB',lubrificantes:'#6B40C4',servicos:'#0891b2',conveniencia:'#EC7211',arla:'#1D8102'})[k] || '#64748b';
  }
  function fmtBRL(v) {
    if (v >= 1e6) return 'R$ ' + (v/1e6).toFixed(2).replace('.',',') + ' mi';
    if (v >= 1e3) return 'R$ ' + (Math.round(v/1e3)).toLocaleString('pt-BR') + 'k';
    return 'R$ ' + Math.round(v).toLocaleString('pt-BR');
  }
  function fmtBRLFull(v) { return 'R$ ' + Math.round(v).toLocaleString('pt-BR'); }
  function fmtInt(v) { return Math.round(v).toLocaleString('pt-BR'); }
  function fmtPct(v, d) { return (v).toFixed(d||1).replace('.',',') + '%'; }
  function fmtDelta(v, isPct) {
    const sign = v >= 0 ? '+' : '';
    return sign + v.toFixed(isPct ? 1 : 1).replace('.',',') + (isPct ? ' p.p.' : '%');
  }

  window.PIData = {
    PERIODS, LOCATIONS, MONTHS,
    kpis, revenueSeries, segmentMix, topProducts,
    combProducts, combEvolution, convMix, convEvolution, convScatter, convBreakdown, convCategories,
    dreMonth, dreSeries, heatmap,
    fmtBRL, fmtBRLFull, fmtInt, fmtPct, fmtDelta, colorOf, labelOf,
  };
})();
