import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  format,
  startOfDay,
  startOfWeek,
  startOfMonth,
  endOfMonth,
  subMonths,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

export type PeriodoId = 'hoje' | 'semana' | 'mes' | 'mes_anterior';

export interface PeriodoRange {
  data_inicio: string; // YYYY-MM-DD
  data_fim: string;    // YYYY-MM-DD
}

// Calcula os ranges automaticamente com date-fns em pt-BR
export function calcularPeriodo(id: PeriodoId): PeriodoRange {
  const today = new Date();
  const fmt = (d: Date) => format(d, 'yyyy-MM-dd');

  switch (id) {
    case 'hoje':
      return { data_inicio: fmt(startOfDay(today)), data_fim: fmt(today) };
    case 'semana':
      return {
        data_inicio: fmt(startOfWeek(today, { locale: ptBR })),
        data_fim: fmt(today),
      };
    case 'mes':
      return { data_inicio: fmt(startOfMonth(today)), data_fim: fmt(today) };
    case 'mes_anterior': {
      const prev = subMonths(today, 1);
      return {
        data_inicio: fmt(startOfMonth(prev)),
        data_fim: fmt(endOfMonth(prev)),
      };
    }
  }
}

// Labels para exibir na Topbar
export const PERIODOS: { id: PeriodoId; label: string }[] = [
  { id: 'hoje',         label: 'Hoje' },
  { id: 'semana',       label: 'Semana' },
  { id: 'mes',          label: 'Mês' },
  { id: 'mes_anterior', label: 'Mês anterior' },
];

// Hook — sincroniza o período ativo com o searchParam `periodo` da URL
export function usePeriodo() {
  const [searchParams, setSearchParams] = useSearchParams();

  const periodoId = (searchParams.get('periodo') as PeriodoId | null) ?? 'mes';

  const setPeriodo = useCallback(
    (id: PeriodoId) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set('periodo', id);
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const range = calcularPeriodo(periodoId);

  return { periodoId, range, setPeriodo };
}