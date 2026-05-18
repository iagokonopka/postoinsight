/**
 * SyncStatus Widget — topbar
 * Spec: FRONTEND_SPEC.md seção 9.1
 */
import { RefreshCw, CheckCircle, AlertTriangle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useSyncStatus } from '@/hooks/useSyncStatus';
import { cn } from '@/lib/utils';

export function SyncStatus() {
  const { status, label, lastSyncAt, trigger, triggering } = useSyncStatus();

  const icon = {
    ok:           <span className="h-2 w-2 rounded-full bg-green-500" />,
    warning:      <span className="h-2 w-2 rounded-full bg-amber-500" />,
    critical:     <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />,
    syncing:      <Loader2 size={14} className="animate-spin text-slate-400" />,
    error:        <span className="h-2 w-2 rounded-full bg-red-500" />,
  }[status] ?? <span className="h-2 w-2 rounded-full bg-slate-400" />;

  const buttonLabel = {
    ok:       '↻ Sincronizar',
    warning:  '↻ Sincronizar',
    critical: '↻ Sincronizar',
    syncing:  'Sincronizando...',
    error:    'Tentar novamente',
  }[status] ?? '↻ Sincronizar';

  return (
    <div className="flex items-center gap-3">
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 text-sm text-slate-300">
            {icon}
            <span>{label}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          {lastSyncAt
            ? `Última sync: ${lastSyncAt.toLocaleString('pt-BR')}`
            : 'Nenhuma sync realizada ainda'}
        </TooltipContent>
      </Tooltip>

      <Button
        size="sm"
        variant="outline"
        onClick={trigger}
        disabled={triggering || status === 'syncing'}
        className={cn(
          'border-slate-600 bg-transparent text-slate-300 hover:bg-slate-700 hover:text-white',
          status === 'critical' && 'animate-pulse border-red-500 text-red-400',
        )}
      >
        {status === 'syncing' ? (
          <Loader2 size={12} className="mr-1 animate-spin" />
        ) : (
          <RefreshCw size={12} className="mr-1" />
        )}
        {buttonLabel}
      </Button>
    </div>
  );
}
