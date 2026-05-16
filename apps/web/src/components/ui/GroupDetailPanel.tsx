import { fBRL, fPct, fNum } from '@/lib/formatters';

/**
 * Painel lateral de detalhes para grupos e subgrupos.
 * Mais simples que o ProductDetailPanel — exibe KPIs financeiros
 * sem evolução temporal (pois não há endpoint de evolução por grupo_id ainda).
 */

interface GroupInfo {
  nome: string;
  nivel: 'grupo' | 'subgrupo';
  receita_bruta: number;
  receita_liquida?: number;
  cmv: number;
  margem_bruta: number;
  margem_pct: number;
  participacao_pct: number;
  qtd_itens?: number;
  qtd_venda?: number;
}

interface GroupDetailPanelProps {
  item: GroupInfo;
  onClose: () => void;
}

export function GroupDetailPanel({ item, onClose }: GroupDetailPanelProps) {
  const nivelLabel = item.nivel === 'grupo' ? 'Grupo' : 'Subgrupo';

  const kpis = [
    { label: 'Receita Bruta',   value: fBRL(item.receita_bruta),   color: 'var(--color-text)' },
    { label: 'CMV',             value: fBRL(item.cmv),              color: 'var(--color-text-muted)' },
    { label: 'Margem Bruta',    value: fBRL(item.margem_bruta),     color: 'var(--color-success)' },
    { label: 'Margem %',        value: fPct(item.margem_pct),       color: 'var(--color-success)' },
    { label: 'Participação',    value: fPct(item.participacao_pct), color: 'var(--color-text-muted)' },
    ...(item.qtd_itens != null
      ? [{ label: 'Itens',      value: fNum(item.qtd_itens),        color: 'var(--color-text-muted)' }]
      : []),
    ...(item.qtd_venda != null
      ? [{ label: 'Qtd vendida', value: fNum(item.qtd_venda),       color: 'var(--color-text-muted)' }]
      : []),
  ];

  return (
    <div style={{
      position: 'fixed',
      top: 'var(--topbar-height)',
      right: 0,
      bottom: 0,
      width: 320,
      background: 'var(--color-bg)',
      borderLeft: '1px solid var(--color-border)',
      boxShadow: '-4px 0 24px rgba(0,0,0,0.08)',
      zIndex: 100,
      display: 'flex',
      flexDirection: 'column',
      overflowY: 'auto',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px var(--space-5)',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 8,
      }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>
            {nivelLabel}
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)', lineHeight: 1.3 }}>
            {item.nome}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'transparent', border: 'none',
            cursor: 'pointer', color: 'var(--color-text-muted)',
            padding: 4, borderRadius: 'var(--radius-sm)', flexShrink: 0,
          }}
        >
          <svg width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* KPIs */}
      <div style={{ padding: 'var(--space-5)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {kpis.map((k) => (
            <div
              key={k.label}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px var(--space-4)',
                background: 'var(--color-bg-subtle)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border-subtle)',
              }}
            >
              <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 500 }}>
                {k.label}
              </span>
              <span style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-mono)', color: k.color }}>
                {k.value}
              </span>
            </div>
          ))}
        </div>

        {/* Barra de participação */}
        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>
            Participação na receita
          </div>
          <div style={{ height: 8, background: 'var(--color-bg-muted)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${Math.min(item.participacao_pct, 100)}%`,
              background: 'var(--color-primary)',
              borderRadius: 4,
              transition: 'width 400ms ease',
            }} />
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4, textAlign: 'right' }}>
            {fPct(item.participacao_pct)} do total
          </div>
        </div>

        {/* Nota */}
        <div style={{
          marginTop: 20,
          padding: '10px var(--space-4)',
          background: 'var(--color-info-subtle)',
          borderRadius: 'var(--radius-sm)',
          fontSize: 11,
          color: 'var(--color-info)',
          lineHeight: 1.5,
        }}>
          Expanda o {nivelLabel.toLowerCase()} na tabela para ver produtos individuais com detalhes completos.
        </div>
      </div>
    </div>
  );
}
