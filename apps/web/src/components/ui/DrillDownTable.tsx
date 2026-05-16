import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { fBRL, fPct, fNum } from '@/lib/formatters';

// ── Tipos ──────────────────────────────────────────────────────────────────────

export interface DrillGrupo {
  grupo_id: number;
  grupo_descricao: string | null;
  receita_bruta: number;
  receita_liquida: number;
  cmv: number;
  margem_bruta: number;
  margem_pct: number;
  qtd_itens?: number;
  participacao_pct: number;
}

interface SubgrupoRow {
  subgrupo_id: number | null;
  subgrupo_descricao: string;
  receita_bruta: number;
  receita_liquida: number;
  cmv: number;
  margem_bruta: number;
  margem_pct: number;
  qtd_itens: number;
  participacao_pct: number;
}

interface ProdutoRow {
  source_produto_id: string;
  descricao_produto: string;
  receita_bruta: number;
  receita_liquida: number;
  cmv: number;
  margem_bruta: number;
  margem_pct: number;
  qtd_venda: number;
  qtd_itens: number;
  participacao_pct: number;
}

interface DrillDownTableProps {
  /** Lista de grupos a exibir no nível raiz. */
  grupos: DrillGrupo[];
  /** Segmento a passar para o endpoint de drill/subgrupos. */
  segmento: string;
  /** Query string já montada (data_inicio, data_fim, location_id). */
  qs: string;
  /** Callback quando um grupo é clicado para "ver detalhes" (opcional). */
  onSelectGrupo?: (grupo: DrillGrupo) => void;
  /** Callback quando um subgrupo é clicado para "ver detalhes" (opcional). */
  onSelectSubgrupo?: (subgrupo: SubgrupoRow) => void;
  /** Callback quando um produto é clicado. */
  onSelectProduto?: (produto: ProdutoRow) => void;
}

export type { SubgrupoRow, ProdutoRow };

// ── Componente principal ───────────────────────────────────────────────────────

export function DrillDownTable({ grupos, segmento, qs, onSelectGrupo, onSelectSubgrupo, onSelectProduto }: DrillDownTableProps) {
  const totalReceita = grupos.reduce((acc, g) => acc + g.receita_bruta, 0);

  return (
    <div>
      {/* Cabeçalho */}
      <TableHeader columns={['Grupo / Produto', 'Receita', 'Margem %', 'CMV', 'Part. %', '']} />

      {/* Linhas */}
      {grupos.map((g) => (
        <GrupoRow
          key={g.grupo_id}
          grupo={g}
          totalReceita={totalReceita}
          segmento={segmento}
          qs={qs}
          onSelectGrupo={onSelectGrupo}
          onSelectSubgrupo={onSelectSubgrupo}
          onSelectProduto={onSelectProduto}
        />
      ))}
    </div>
  );
}

// ── GrupoRow ───────────────────────────────────────────────────────────────────

function GrupoRow({
  grupo,
  totalReceita,
  segmento,
  qs,
  onSelectGrupo,
  onSelectSubgrupo,
  onSelectProduto,
}: {
  grupo: DrillGrupo;
  totalReceita: number;
  segmento: string;
  qs: string;
  onSelectGrupo?: (g: DrillGrupo) => void;
  onSelectSubgrupo?: (sg: SubgrupoRow) => void;
  onSelectProduto?: (p: ProdutoRow) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const { data, isFetching } = useQuery<{ subgrupos: SubgrupoRow[] }>({
    queryKey: ['drill-subgrupos', segmento, grupo.grupo_id, qs],
    queryFn: () =>
      api.get(
        `/api/v1/vendas/drill/subgrupos?segmento=${encodeURIComponent(segmento)}&grupo_id=${grupo.grupo_id}&${qs}`,
      ),
    enabled: expanded,
    staleTime: 60_000,
  });

  const participacao = grupo.receita_bruta > 0 && totalReceita > 0
    ? (grupo.receita_bruta / totalReceita) * 100
    : grupo.participacao_pct;

  return (
    <>
      {/* Linha do grupo */}
      <div
        onClick={() => setExpanded((v) => !v)}
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 110px 80px 110px 70px 32px',
          gap: 10,
          padding: '0 var(--space-5)',
          height: 'var(--table-row-height)',
          alignItems: 'center',
          borderBottom: '1px solid var(--color-border)',
          cursor: 'pointer',
          background: expanded ? 'var(--color-bg-subtle)' : 'transparent',
          transition: 'background 120ms',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 9, color: 'var(--color-text-muted)',
            transform: expanded ? 'rotate(90deg)' : 'none',
            transition: 'transform 150ms',
            display: 'inline-block',
            userSelect: 'none',
          }}>▶</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>
            {grupo.grupo_descricao ?? `Grupo ${grupo.grupo_id}`}
          </span>
          {isFetching && (
            <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>...</span>
          )}
        </div>
        <MonoCell value={fBRL(grupo.receita_bruta)} />
        <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-success)' }}>
          {fPct(grupo.margem_pct)}
        </div>
        <MonoCell value={fBRL(grupo.cmv)} muted />
        <MonoCell value={fPct(participacao)} muted />
        {/* Botão "ver detalhes" para grupos — abre side panel */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          {onSelectGrupo && (
            <button
              onClick={(e) => { e.stopPropagation(); onSelectGrupo(grupo); }}
              title="Ver detalhes do grupo"
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: 'var(--color-text-subtle)', padding: '2px 4px',
                borderRadius: 'var(--radius-sm)', fontSize: 11,
                transition: 'color 120ms',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-primary)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-subtle)')}
            >
              ↗
            </button>
          )}
        </div>
      </div>

      {/* Subgrupos expandidos */}
      {expanded && data?.subgrupos.map((sg) => (
        <SubgrupoRow
          key={sg.subgrupo_id ?? 'null'}
          subgrupo={sg}
          qs={qs}
          onSelectSubgrupo={onSelectSubgrupo}
          onSelectProduto={onSelectProduto}
        />
      ))}
    </>
  );
}

// ── SubgrupoRow ────────────────────────────────────────────────────────────────

function SubgrupoRow({
  subgrupo,
  qs,
  onSelectSubgrupo,
  onSelectProduto,
}: {
  subgrupo: SubgrupoRow;
  qs: string;
  onSelectSubgrupo?: (sg: SubgrupoRow) => void;
  onSelectProduto?: (p: ProdutoRow) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const { data, isFetching } = useQuery<{ produtos: ProdutoRow[] }>({
    queryKey: ['drill-produtos', subgrupo.subgrupo_id, qs],
    queryFn: () =>
      api.get(
        `/api/v1/vendas/drill/produtos?subgrupo_id=${subgrupo.subgrupo_id}&${qs}`,
      ),
    enabled: expanded && subgrupo.subgrupo_id != null,
    staleTime: 60_000,
  });

  return (
    <>
      {/* Linha do subgrupo */}
      <div
        onClick={() => setExpanded((v) => !v)}
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 110px 80px 110px 70px 32px',
          gap: 10,
          padding: '0 var(--space-5)',
          height: 'var(--table-row-height)',
          alignItems: 'center',
          borderBottom: '1px solid var(--color-border)',
          cursor: subgrupo.subgrupo_id != null ? 'pointer' : 'default',
          background: 'var(--color-bg-muted)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 20 }}>
          {subgrupo.subgrupo_id != null && (
            <span style={{
              fontSize: 9, color: 'var(--color-text-muted)',
              transform: expanded ? 'rotate(90deg)' : 'none',
              transition: 'transform 150ms',
              display: 'inline-block',
              userSelect: 'none',
            }}>▶</span>
          )}
          <span style={{ fontSize: 12, color: 'var(--color-text)', fontWeight: 500 }}>
            {subgrupo.subgrupo_descricao}
          </span>
          {isFetching && (
            <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>...</span>
          )}
        </div>
        <MonoCell value={fBRL(subgrupo.receita_bruta)} small />
        <div style={{ textAlign: 'right', fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--color-success)' }}>
          {fPct(subgrupo.margem_pct)}
        </div>
        <MonoCell value={fBRL(subgrupo.cmv)} small muted />
        <MonoCell value={fPct(subgrupo.participacao_pct)} small muted />
        {/* Botão "ver detalhes" para subgrupos */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          {onSelectSubgrupo && (
            <button
              onClick={(e) => { e.stopPropagation(); onSelectSubgrupo(subgrupo); }}
              title="Ver detalhes do subgrupo"
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: 'var(--color-text-subtle)', padding: '2px 4px',
                borderRadius: 'var(--radius-sm)', fontSize: 11,
                transition: 'color 120ms',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-primary)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-subtle)')}
            >
              ↗
            </button>
          )}
        </div>
      </div>

      {/* Produtos expandidos */}
      {expanded && data?.produtos.map((p) => (
        <ProdutoRow
          key={p.source_produto_id}
          produto={p}
          onClick={onSelectProduto ? () => onSelectProduto(p) : undefined}
        />
      ))}

    </>
  );
}

// ── ProdutoRow ─────────────────────────────────────────────────────────────────

function ProdutoRow({
  produto,
  onClick,
}: {
  produto: ProdutoRow;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 110px 80px 110px 70px 32px',
        gap: 10,
        padding: '0 var(--space-5)',
        height: 'var(--table-row-height)',
        alignItems: 'center',
        borderBottom: '1px solid var(--color-border)',
        cursor: onClick ? 'pointer' : 'default',
        background: 'var(--color-bg)',
      }}
      onMouseEnter={(e) => {
        if (onClick) (e.currentTarget as HTMLDivElement).style.background = 'var(--color-bg-subtle)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.background = 'var(--color-bg)';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 40 }}>
        <span style={{ fontSize: 11, color: 'var(--color-text-muted)', userSelect: 'none' }}>•</span>
        <span style={{ fontSize: 12, color: 'var(--color-text)' }}>
          {produto.descricao_produto}
        </span>
        {onClick && (
          <span style={{ fontSize: 10, color: 'var(--color-info)', marginLeft: 4 }}>↗</span>
        )}
      </div>
      <MonoCell value={fBRL(produto.receita_bruta)} small />
      <div style={{ textAlign: 'right', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-success)' }}>
        {fPct(produto.margem_pct)}
      </div>
      <MonoCell value={fBRL(produto.cmv)} small muted />
      <MonoCell value={fPct(produto.participacao_pct)} small muted />
      <div style={{ textAlign: 'center' }}>
        {onClick && (
          <span style={{ fontSize: 10, color: 'var(--color-text-subtle)' }}>
            {fNum(produto.qtd_itens)}x
          </span>
        )}
      </div>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function TableHeader({ columns }: { columns: string[] }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 110px 80px 110px 70px 32px',
      gap: 10,
      padding: '0 var(--space-5)',
      height: 36,
      alignItems: 'center',
      background: 'var(--color-bg-subtle)',
      borderBottom: '1px solid var(--color-border)',
    }}>
      {columns.map((col, i) => (
        <div key={i} style={{
          fontSize: 10,
          fontWeight: 600,
          color: 'var(--color-text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          textAlign: i === 0 ? 'left' : 'right',
        }}>
          {col}
        </div>
      ))}
    </div>
  );
}

function MonoCell({
  value,
  small = false,
  muted = false,
}: {
  value: string;
  small?: boolean;
  muted?: boolean;
}) {
  return (
    <div style={{
      textAlign: 'right',
      fontSize: small ? 11 : 12,
      fontFamily: 'var(--font-mono)',
      color: muted ? 'var(--color-text-muted)' : 'var(--color-text)',
    }}>
      {value}
    </div>
  );
}