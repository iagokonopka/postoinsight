/**
 * FilterContext — filtros globais de período e location
 * Spec: FRONTEND_SPEC.md seção 3 e 15.2
 *
 * - Estado mantido em memória durante a sessão (não persiste)
 * - Sincronizado com searchParams da URL para permitir deep-link
 * - DRE usa seu próprio seletor de mês (não herda este filtro)
 */
import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { format, subDays, startOfWeek, startOfMonth, endOfMonth, subMonths } from 'date-fns';

export type PeriodKey =
  | 'today'
  | 'yesterday'
  | '7d'
  | 'this_week'
  | 'this_month'
  | 'last_month'
  | 'custom';

export interface FilterState {
  period: PeriodKey;
  customStart?: Date;
  customEnd?: Date;
  locationId: string | 'all';
}

interface FilterDates {
  data_inicio: string; // YYYY-MM-DD
  data_fim: string;    // YYYY-MM-DD
}

interface FilterContextValue extends FilterState {
  setPeriod: (period: PeriodKey, customStart?: Date, customEnd?: Date) => void;
  setLocationId: (id: string | 'all') => void;
  /** Retorna { data_inicio, data_fim } resolvidos para envio à API */
  resolveDates: () => FilterDates;
}

const FilterContext = createContext<FilterContextValue | null>(null);

function fmt(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

function resolvePeriod(
  period: PeriodKey,
  customStart?: Date,
  customEnd?: Date,
): FilterDates {
  const today = new Date();
  switch (period) {
    case 'today':
      return { data_inicio: fmt(today), data_fim: fmt(today) };
    case 'yesterday': {
      const y = subDays(today, 1);
      return { data_inicio: fmt(y), data_fim: fmt(y) };
    }
    case '7d':
      return { data_inicio: fmt(subDays(today, 7)), data_fim: fmt(today) };
    case 'this_week':
      return {
        data_inicio: fmt(startOfWeek(today, { weekStartsOn: 1 })),
        data_fim: fmt(today),
      };
    case 'this_month':
      return { data_inicio: fmt(startOfMonth(today)), data_fim: fmt(today) };
    case 'last_month': {
      const firstOfLastMonth = startOfMonth(subMonths(today, 1));
      return { data_inicio: fmt(firstOfLastMonth), data_fim: fmt(endOfMonth(firstOfLastMonth)) };
    }
    case 'custom':
      if (customStart && customEnd) {
        return { data_inicio: fmt(customStart), data_fim: fmt(customEnd) };
      }
      // fallback para mês atual se custom sem datas
      return { data_inicio: fmt(startOfMonth(today)), data_fim: fmt(today) };
    default:
      return { data_inicio: fmt(startOfMonth(today)), data_fim: fmt(today) };
  }
}

export function FilterProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<FilterState>({
    period: 'this_month',
    locationId: 'all',
  });

  const setPeriod = useCallback(
    (period: PeriodKey, customStart?: Date, customEnd?: Date) => {
      setState((prev) => ({ ...prev, period, customStart, customEnd }));
    },
    [],
  );

  const setLocationId = useCallback((locationId: string | 'all') => {
    setState((prev) => ({ ...prev, locationId }));
  }, []);

  const resolveDates = useCallback(
    () => resolvePeriod(state.period, state.customStart, state.customEnd),
    [state.period, state.customStart, state.customEnd],
  );

  return (
    <FilterContext.Provider
      value={{ ...state, setPeriod, setLocationId, resolveDates }}
    >
      {children}
    </FilterContext.Provider>
  );
}

export function useFilters(): FilterContextValue {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error('useFilters deve ser usado dentro de <FilterProvider>');
  return ctx;
}

/** Labels dos períodos para exibição no Select */
export const PERIOD_LABELS: Record<PeriodKey, string> = {
  today:      'Hoje',
  yesterday:  'Ontem',
  '7d':       'Últimos 7 dias',
  this_week:  'Semana atual',
  this_month: 'Mês atual',
  last_month: 'Mês anterior',
  custom:     'Personalizado',
};
