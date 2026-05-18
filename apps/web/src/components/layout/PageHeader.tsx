import { type ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  children?: ReactNode; // actions / filters
}

export function PageHeader({ title, subtitle, children }: PageHeaderProps) {
  return (
    <div className="px-5 pt-5 pb-4 flex items-end justify-between gap-4 flex-wrap">
      <div>
        <h1 className="text-xl font-semibold text-foreground tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-2 flex-wrap">
          {children}
        </div>
      )}
    </div>
  );
}
