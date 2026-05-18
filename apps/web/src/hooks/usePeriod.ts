import { useState, useMemo } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────────

export type Period = 'today' | 'yesterday' | '7d' | 'this_week' | 'this_month' | 'custom';

export interface DateRange {
  from: Date;
  to: Date;
}

export interface UsePeriodResult {
  period: Period;
  setPeriod: (p: Period) => void;
  dateRange: DateRange;
  customRange: DateRange | null;
  setCustomRange: (r: DateRange | null) => void;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function startOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

function endOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(23, 59, 59, 999);
  return r;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function deriveRange(period: Period, customRange: DateRange | null): DateRange {
  const today = new Date();
  switch (period) {
    case 'today':
      return { from: startOfDay(today), to: endOfDay(today) };
    case 'yesterday': {
      const y = addDays(today, -1);
      return { from: startOfDay(y), to: endOfDay(y) };
    }
    case '7d':
      return { from: startOfDay(addDays(today, -6)), to: endOfDay(today) };
    case 'this_week': {
      const dow = today.getDay(); // 0=Sun
      const monday = addDays(today, -(dow === 0 ? 6 : dow - 1));
      return { from: startOfDay(monday), to: endOfDay(today) };
    }
    case 'this_month': {
      const first = new Date(today.getFullYear(), today.getMonth(), 1);
      return { from: startOfDay(first), to: endOfDay(today) };
    }
    case 'custom':
      return customRange ?? { from: startOfDay(addDays(today, -29)), to: endOfDay(today) };
  }
}

// ── Hook ───────────────────────────────────────────────────────────────────────

export function usePeriod(defaultPeriod: Period = 'this_month'): UsePeriodResult {
  const [period, setPeriod] = useState<Period>(defaultPeriod);
  const [customRange, setCustomRange] = useState<DateRange | null>(null);

  const dateRange = useMemo(() => deriveRange(period, customRange), [period, customRange]);

  return { period, setPeriod, dateRange, customRange, setCustomRange };
}
