// PostoInsight — Mock Data v2

const APP_NAME = 'PostoInsight';
const APP_TAGLINE = 'Inteligência para sua rede';

const LOCATIONS = [
  { id: 'loc-1', nome: 'JAM Centro',  erp: 'Status', status: 'online'  },
  { id: 'loc-2', nome: 'JAM Rodovia', erp: 'Status', status: 'online'  },
  { id: 'loc-3', nome: 'JAM Norte',   erp: 'Status', status: 'online'  },
  { id: 'loc-4', nome: 'JAM Sul',     erp: 'Status', status: 'warning' },
];

function serie28(base, v) {
  v = v || 0.12;
  return Array.from({ length: 28 }, function(_, i) {
    var d = i + 1;
    var wknd = [0, 6].indexOf(new Date(2026, 3, d).getDay()) > -1;
    var m = 1 + Math.sin(d * 0.7) * v;
    return { dia: d, label: d + '/04', valor: Math.round(base * m * (wknd ? 0.84 : 1)) };
  });
}

var sB = serie28(38772);

var vendas_resumo = {
  totais: { receita_bruta: 1085620, descontos: 1230, receita_liquida: 1084390, cmv: 825620, margem_bruta: 258770, margem_pct: 23.86, qtd_itens: 18420 },
  por_segmento: [
    { segmento: 'combustivel',   label: 'Combustível',   receita_bruta: 980300, receita_liquida: 979500, cmv: 810200, margem_bruta: 169300, margem_pct: 17.28, participacao_pct: 78.4 },
    { segmento: 'lubrificantes', label: 'Lubrificantes', receita_bruta:  42000, receita_liquida:  42000, cmv:   8500, margem_bruta:  33500, margem_pct: 79.76, participacao_pct:  8.7 },
    { segmento: 'servicos',      label: 'Serviços',      receita_bruta:  18000, receita_liquida:  18000, cmv:   2100, margem_bruta:  15900, margem_pct: 88.33, participacao_pct:  3.7 },
    { segmento: 'conveniencia',  label: 'Conveniência',  receita_bruta:  45320, receita_liquida:  44590, cmv:   4820, margem_bruta:  39770, margem_pct: 89.19, participacao_pct:  9.2 },
  ],
};

var vendas_evolucao = sB.map(function(p) {
  return { label: p.label, receita_bruta: p.valor, margem_bruta: Math.round(p.valor * 0.2386) };
});

var vendas_grupos_combustivel = [
  { grupo_descricao: 'Gasolina Comum', receita_bruta: 432000, cmv: 362880, margem_bruta:  69120, margem_pct: 16.0, participacao_pct: 44.1 },
  { grupo_descricao: 'Diesel S-10',    receita_bruta: 395000, cmv: 331800, margem_bruta:  63200, margem_pct: 16.0, participacao_pct: 40.3 },
  { grupo_descricao: 'Etanol',         receita_bruta: 116800, cmv:  93440, margem_bruta:  23360, margem_pct: 20.0, participacao_pct: 11.9 },
  { grupo_descricao: 'Arla 32',        receita_bruta:  36500, cmv:  22080, margem_bruta:  14420, margem_pct: 39.5, participacao_pct:  3.7 },
];

var combustivel_resumo = {
  totais: { volume_litros: 185420, receita_bruta: 980300, receita_liquida: 979500, cmv: 810200, margem_bruta: 169300, margem_pct: 17.28 },
  por_produto: [
    { grupo_descricao: 'Gasolina Comum', volume_litros:  72000, receita_bruta: 432000, cmv: 362880, margem_bruta:  69120, margem_pct: 16.0, preco_medio_litro: 6.00, custo_medio_litro: 5.04, participacao_volume_pct: 38.8 },
    { grupo_descricao: 'Diesel S-10',    volume_litros:  85000, receita_bruta: 425000, cmv: 357000, margem_bruta:  68000, margem_pct: 16.0, preco_medio_litro: 5.00, custo_medio_litro: 4.20, participacao_volume_pct: 45.8 },
    { grupo_descricao: 'Etanol',         volume_litros:  18420, receita_bruta:  88416, cmv:  70004, margem_bruta:  18412, margem_pct: 20.8, preco_medio_litro: 4.80, custo_medio_litro: 3.80, participacao_volume_pct:  9.9 },
    { grupo_descricao: 'Arla 32',        volume_litros:  10000, receita_bruta:  34884, cmv:  20316, margem_bruta:  14568, margem_pct: 41.8, preco_medio_litro: 3.49, custo_medio_litro: 2.03, participacao_volume_pct:  5.4 },
  ],
};

var sBC = serie28(6607);
var combustivel_evolucao = sBC.map(function(p, i) {
  return {
    label: p.label,
    'Gasolina Comum': Math.round(2571 * (1 + Math.sin(p.dia * 0.7) * 0.1)),
    'Diesel S-10':    Math.round(3035 * (1 + Math.cos(p.dia * 0.5) * 0.08)),
    'Etanol':         Math.round( 657 * (1 + Math.sin(p.dia * 1.2) * 0.15)),
    'Arla 32':        Math.round( 357 * (1 + Math.sin(p.dia * 0.9) * 0.2)),
  };
});

var conveniencia_resumo = {
  totais: { receita_bruta: 105320, descontos: 730, receita_liquida: 104590, cmv: 15420, margem_bruta: 89170, margem_pct: 85.26, qtd_itens: 4820 },
  por_segmento: [
    { segmento: 'conveniencia',  label: 'Conveniência',  receita_bruta: 45320, cmv: 4820, margem_bruta: 39770, margem_pct: 89.19, participacao_pct: 43.0,
      categorias: [
        { codigo: 'BEB', descricao: 'Bebidas',            receita_bruta: 18200, cmv: 1820, margem_bruta: 16380, margem_pct: 90.0, participacao_pct: 40.2 },
        { codigo: 'LAN', descricao: 'Lanchonete',         receita_bruta: 12400, cmv: 1240, margem_bruta: 11160, margem_pct: 90.0, participacao_pct: 27.4 },
        { codigo: 'TAB', descricao: 'Tabacaria',          receita_bruta:  8920, cmv:  980, margem_bruta:  7940, margem_pct: 89.0, participacao_pct: 19.7 },
        { codigo: 'CV',  descricao: 'Conv. Geral',        receita_bruta:  5800, cmv:  780, margem_bruta:  5020, margem_pct: 86.6, participacao_pct: 12.8 },
      ]},
    { segmento: 'lubrificantes', label: 'Lubrificantes', receita_bruta: 42000, cmv: 8500, margem_bruta: 33500, margem_pct: 79.76, participacao_pct: 39.9,
      categorias: [
        { codigo: 'LUB', descricao: 'Lubrificantes',      receita_bruta: 28000, cmv: 5800, margem_bruta: 22200, margem_pct: 79.3, participacao_pct: 66.7 },
        { codigo: 'FLT', descricao: 'Filtros',            receita_bruta:  9200, cmv: 1840, margem_bruta:  7360, margem_pct: 80.0, participacao_pct: 21.9 },
        { codigo: 'FLF', descricao: 'Fluidos e Aditivos', receita_bruta:  4800, cmv:  860, margem_bruta:  3940, margem_pct: 82.1, participacao_pct: 11.4 },
      ]},
    { segmento: 'servicos',      label: 'Serviços',      receita_bruta: 18000, cmv: 2100, margem_bruta: 15900, margem_pct: 88.33, participacao_pct: 17.1,
      categorias: [
        { codigo: 'LV',  descricao: 'Lavagem',            receita_bruta: 10800, cmv: 1100, margem_bruta:  9700, margem_pct: 89.8, participacao_pct: 60.0 },
        { codigo: 'LU',  descricao: 'Lubrificação',       receita_bruta:  5400, cmv:  700, margem_bruta:  4700, margem_pct: 87.0, participacao_pct: 30.0 },
        { codigo: 'BAN', descricao: 'Borracharia',        receita_bruta:  1800, cmv:  300, margem_bruta:  1500, margem_pct: 83.3, participacao_pct: 10.0 },
      ]},
  ],
};

var conveniencia_evolucao = sB.map(function(p) {
  return {
    label: p.label,
    receita_bruta: Math.round(3761 * (1 + Math.sin(p.dia * 0.8) * 0.15)),
    margem_bruta:  Math.round(3208 * (1 + Math.sin(p.dia * 0.8) * 0.15)),
  };
});

// DRE — coluna por segmento + total, comparativo mês anterior
var dreData = {
  meses: ['2026-04','2026-03','2026-02','2026-01','2025-12'],
  labels: { '2026-04':'Abr/26','2026-03':'Mar/26','2026-02':'Fev/26','2026-01':'Jan/26','2025-12':'Dez/25' },
  mes_atual: '2026-04',
  por_mes: {
    '2026-04': {
      combustivel:   { receita_bruta: 980300, descontos:  800, receita_liquida: 979500, cmv: 810200, margem_bruta: 169300, margem_pct: 17.28 },
      lubrificantes: { receita_bruta:  42000, descontos:    0, receita_liquida:  42000, cmv:   8500, margem_bruta:  33500, margem_pct: 79.76 },
      servicos:      { receita_bruta:  18000, descontos:    0, receita_liquida:  18000, cmv:   2100, margem_bruta:  15900, margem_pct: 88.33 },
      conveniencia:  { receita_bruta:  45320, descontos:  430, receita_liquida:  44890, cmv:   4820, margem_bruta:  40070, margem_pct: 89.27 },
    },
    '2026-03': {
      combustivel:   { receita_bruta: 901200, descontos:  720, receita_liquida: 900480, cmv: 746000, margem_bruta: 154480, margem_pct: 17.16 },
      lubrificantes: { receita_bruta:  38000, descontos:    0, receita_liquida:  38000, cmv:   7800, margem_bruta:  30200, margem_pct: 79.47 },
      servicos:      { receita_bruta:  17500, descontos:    0, receita_liquida:  17500, cmv:   2050, margem_bruta:  15450, margem_pct: 88.29 },
      conveniencia:  { receita_bruta:  41730, descontos:  380, receita_liquida:  41350, cmv:   4250, margem_bruta:  37100, margem_pct: 89.72 },
    },
  },
};
// Computa _total para cada mês disponível
['2026-04','2026-03'].forEach(function(mes) {
  var segs = ['combustivel','lubrificantes','servicos','conveniencia'];
  var t = segs.reduce(function(acc, s) {
    var p = dreData.por_mes[mes][s];
    return {
      receita_bruta:   acc.receita_bruta   + p.receita_bruta,
      descontos:       acc.descontos       + p.descontos,
      receita_liquida: acc.receita_liquida + p.receita_liquida,
      cmv:             acc.cmv             + p.cmv,
      margem_bruta:    acc.margem_bruta    + p.margem_bruta,
    };
  }, { receita_bruta:0, descontos:0, receita_liquida:0, cmv:0, margem_bruta:0 });
  t.margem_pct = parseFloat((t.margem_bruta / t.receita_liquida * 100).toFixed(2));
  dreData.por_mes[mes]._total = t;
});

// SYNC STATUS
var syncData = {
  ultima_sync_global: '2026-04-30T06:18:00Z',
  locations: [
    { id: 'loc-1', nome: 'JAM Centro',  status: 'success', ultima_sync: '2026-04-30T06:12:00Z', proxima_sync: '2026-05-01T03:00:00Z', registros: 842, duracao: '1m 12s'  },
    { id: 'loc-2', nome: 'JAM Rodovia', status: 'success', ultima_sync: '2026-04-30T06:14:00Z', proxima_sync: '2026-05-01T03:00:00Z', registros: 1024,duracao: '1m 38s'  },
    { id: 'loc-3', nome: 'JAM Norte',   status: 'success', ultima_sync: '2026-04-30T06:16:00Z', proxima_sync: '2026-05-01T03:00:00Z', registros: 688, duracao: '0m 58s'  },
    { id: 'loc-4', nome: 'JAM Sul',     status: 'failed',  ultima_sync: '2026-04-29T03:00:00Z', proxima_sync: '2026-04-30T03:00:00Z', registros: 0,   duracao: '0m 04s', erro: 'Conexão recusada — agente offline há 27h.' },
  ],
  historico: [
    { id: 1, location: 'JAM Centro',  inicio: '2026-04-30T06:12:00Z', fim: '2026-04-30T06:13:12Z', duracao: '1m 12s',  registros: 842,  status: 'success' },
    { id: 2, location: 'JAM Rodovia', inicio: '2026-04-30T06:14:00Z', fim: '2026-04-30T06:15:38Z', duracao: '1m 38s',  registros: 1024, status: 'success' },
    { id: 3, location: 'JAM Norte',   inicio: '2026-04-30T06:16:00Z', fim: '2026-04-30T06:16:58Z', duracao: '0m 58s',  registros: 688,  status: 'success' },
    { id: 4, location: 'JAM Sul',     inicio: '2026-04-29T03:00:00Z', fim: '2026-04-29T03:00:04Z', duracao: '0m 04s',  registros: 0,    status: 'failed', erro: 'Conexão recusada — agente offline.' },
    { id: 5, location: 'JAM Centro',  inicio: '2026-04-29T06:10:00Z', fim: '2026-04-29T06:11:08Z', duracao: '1m 08s',  registros: 798,  status: 'success' },
    { id: 6, location: 'JAM Rodovia', inicio: '2026-04-29T06:12:00Z', fim: '2026-04-29T06:13:41Z', duracao: '1m 41s',  registros: 992,  status: 'success' },
    { id: 7, location: 'JAM Norte',   inicio: '2026-04-29T06:14:00Z', fim: '2026-04-29T06:14:54Z', duracao: '0m 54s',  registros: 641,  status: 'success' },
    { id: 8, location: 'JAM Sul',     inicio: '2026-04-28T03:00:00Z', fim: '2026-04-28T03:01:22Z', duracao: '1m 22s',  registros: 721,  status: 'success' },
  ],
};

window.MOCK = {
  APP_NAME, APP_TAGLINE, LOCATIONS,
  vendas: { resumo: vendas_resumo, evolucao: vendas_evolucao, grupos_combustivel: vendas_grupos_combustivel },
  combustivel: { resumo: combustivel_resumo, evolucao: combustivel_evolucao },
  conveniencia: { resumo: conveniencia_resumo, evolucao: conveniencia_evolucao },
  dre: dreData,
  sync: syncData,
};
