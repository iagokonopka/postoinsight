/**
 * PageHeader — cabeçalho da página (dentro do conteúdo, não fixo)
 * Referência visual: design_example/postoinsight/PostoInsight.html (.page-head)
 *
 * Os filtros globais (período, location) foram movidos para a Topbar.
 * O PageHeader agora é apenas: título + subtítulo + slot opcional de ações/filtros de página.
 */
import { type ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  /** Subtítulo descritivo da página — 13px, muted-foreground */
  subtitle?: string;
  /** Slot para filtros específicos da página (ex: seletor de mês do DRE) */
  filterSlot?: ReactNode;
  /** Botões de ação (ex: Exportar — uso futuro) */
  actions?: ReactNode;
}

export function PageHeader({ title, subtitle, filterSlot, actions }: PageHeaderProps) {
  const hasRight = filterSlot || actions;

  return (
    <div
      className="flex items-end justify-between gap-4 flex-wrap"
      style={{ marginBottom: 'var(--gap-row)' }}
    >
      <div>
        <h1
          className="text-[22px] font-semibold text-foreground leading-tight"
          style={{ letterSpacing: '-0.3px' }}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-[13px] text-muted-foreground">{subtitle}</p>
        )}
      </div>

      {hasRight && (
        <div className="flex items-center gap-2">
          {filterSlot}
          {actions}
        </div>
      )}
    </div>
  );
}