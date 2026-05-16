import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Sparkline } from '@/components/charts/Sparkline';
import { LineAreaChart } from '@/components/charts/LineAreaChart';
import { fBRL, fPct, fNum } from '@/lib/formatters';

interface ProdutoBasic {
  source_produto_id: string;
  descricao_produto: string;
  segmento: string;
  receita_bruta: number;
  receita_liquida: number;
  cmv: number;
  margem_bruta: number;
  margem_pct: number;
  qtd_venda: number;
  qtd_itens: number;
  participacao_pct: number;
}

interface ProdutoEvolucao {
  serie: { periodo: string; receita_bruta: number; margem_bruta: number }[];
}

interface ProductDetailPanelProps {
  produto: ProdutoBasic;
  /** Query string já montada (data_inicio, data_fim, location_id). */
  qs: string;
  onClose: () => void;
}

/**
 * Painel lateral de detalhe de um produto individual.
 * Exibe KPIs + sparkline + evolução do produto no período.
 * A evolução é obtida via drill/subgrupos com filtro por source_produto_id — mas como
 * o endpoint de drill retorna por subgrupo, aqui mostramos os KPIs do período completo
 * já presentes no objeto `produto` e a evolução via /vendas/evolucao filtrada por segmento.
 */
export function ProductDetailPanel({ produto, qs, onClose }: ProductDetailPanelProps) {
  // Busca evolução do segmento para contextualizar o produto individualmente
  const { data: evolucao } = useQuery<ProdutoEvolucao>({
    queryKey: ['produto-evolucao-ctx', produto.segmento, qs],
    queryFn: () =>
      api.get(
        `/api/v1/vendas/evolucao?segmento=${encodeURIComponent(produto.segmento)}&granularidade=dia&${qs}`,
      ),
    staleTime: 60_000,
  });

  const serie = evolucao?.serie ?? [];
  const spReceita = serie.map((r) => r.receita_bruta);
  const evoData = serie.map((r) => ({ label: r.periodo, Receita: r.receita_bruta }));

  const cor = '#7C3AED';

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.3)',
          zIndex: 100,
          backdropFilter: 'blur(2px)',
        }}
      />

      {/* Painel */}
      <div style={{
        position: 'fixed',
        top: 0, right: 0,
        height: '100%',
        width: 380,
        background: 'var(--color-bg)',
        boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
        zIndex: 101,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: 'var(--space-5)',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 8,
        }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>
              {produto.segmento}
            </div>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text)', margin: 0, lineHeight: 1.3 }}>
              {produto.descricao_produto}
            </h2>
            <div style={{ fontSize: 10, color: 'var(--color-text-subtle)', marginTop: 2 }}>
              ID: {produto.source_produto_id}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontSize: 20,
              color: 'var(--color-text-muted)',
              lineHeight: 1,
              padding: 4,
              flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>

        {/* KPIs */}
        <div style={{ padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <KpiMini label="Receita Bruta" value={fBRL(produto.receita_bruta)} highlight />
            <KpiMini label="Margem Bruta" value={fBRL(produto.margem_bruta)} />
            <KpiMini label="CMV" value={fBRL(produto.cmv)} />
            <KpiMini label="Margem %" value={fPct(produto.margem_pct)} color={produto.margem_pct > 0 ? 'var(--color-success)' : 'var(--color-danger)'} />
            <KpiMini label="Qtd. Vendas" value={fNum(produto.qtd_venda, 0)} />
            <KpiMini label="Part. Receita" value={fPct(produto.participacao_pct)} />
          </div>
        </div>

        {/* Sparkline rápido */}
        {spReceita.length > 0 && (
          <div style={{ padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--color-border)' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>
              Tendência (segmento)
            </div>
            <Sparkline data={spReceita} color={cor} width={320} height={48} />
          </div>
        )}

        {/* Evolução do segmento */}
        {evoData.length > 0 && (
          <div style={{ padding: 'var(--space-4) var(--space-5)', flex: 1, overflow: 'auto' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>
              Evolução do segmento no período
            </div>
            <LineAreaChart
              data={evoData}
              xKey="label"
              series={[{ name: 'Receita', dataKey: 'Receita', color: cor, areaOpacity: 0.1 }]}
              height={180}
              formatY={fBRL}
            />
            <p style={{ fontSize: 10, color: 'var(--color-text-subtle)', marginTop: 8, lineHeight: 1.4 }}>
              * Evolução exibida para o segmento inteiro. Drill por produto individual disponível em breve.
            </p>
          </div>
        )}
      </div>
    </>
  );
}

// ── Helper interno ─────────────────────────────────────────────────────────────

function KpiMini({
  label,
  value,
  highlight = false,
  color,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  color?: string;
}) {
  return (
    <div style={{
      padding: '10px 12px',
      background: 'var(--color-bg-subtle)',
      borderRadius: 'var(--radius-sm)',
      border: '1px solid var(--color-border)',
    }}>
      <div style={{ fontSize: 10, color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>
        {label}
      </div>
      <div style={{
        fontSize: highlight ? 16 : 14,
        fontWeight: highlight ? 700 : 600,
        fontFamily: 'var(--font-mono)',
        color: color ?? 'var(--color-text)',
      }}>
        {value}
      </div>
    </div>
  );
}