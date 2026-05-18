/**
 * Dashboard page — data hooks (TanStack Query v5)
 * Endpoints: GET /api/v1/vendas/{resumo,evolucao,segmentos,top-produtos}
 */
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { DateRange } from '@/hooks/usePeriod';

// ── Shared filter shape ────────────────────────────────────────────────────────

export interface VendasFilters {
  dateRange: DateRange;
  locationId: string | 'all';
}

function toParams(filters: VendasFilters): string {
  const p = new URLSearchParams();
  p.set('from', filters.dateRange.from.toISOString().slice(0, 10));
  p.set('to', filters.dateRange.to.toISOString().slice(0, 10));
  if (filters.locationId !== 'all') p.set('location_id', filters.locationId);
  return p.toString();
}

// ── Response types (shapes from API) ──────────────────────────────────────────

export interface VendasResumo {
  receita_bruta: number;
  receita_liquida: number;
  cmv: number;
  margem_bruta: number;
  margem_pct: number;
  cmv_pct: number;
  desconto: number;
  qtd_itens: number;
  ticket_medio: number;
  volume_combustivel: number;
  delta_receita_bruta?: number | null;
  delta_margem_pct?: number | null;
  delta_volume_combustivel?: number | null;
  delta_ticket_medio?: number | null;
  delta_cmv_pct?: number | null;
}

export interface VendasEvolucaoPonto {
  label: string;
  receita_bruta: number;
  margem_bruta: number;
  margem_pct: number;
  cmv: number;
  volume_combustivel: number;
}

export interface VendasEvolucao {
  dia: VendasEvolucaoPonto[];
}

export interface VendasSegmento {
  segmento: string;
  receita_bruta: number;
  margem_bruta: number;
  margem_pct: number;
}

export interface VendasTopProduto {
  grupo: string;
  receita_bruta: number;
  participacao_pct: number;
  margem_pct: number;
  qtd: number | null;
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

const STALE = 5 * 60 * 1000;

export function useVendasResumo(filters: VendasFilters) {
  return useQuery<VendasResumo>({
    queryKey: ['vendas', 'resumo', filters.dateRange.from, filters.dateRange.to, filters.locationId],
    queryFn: () => apiFetch<VendasResumo>(`/api/v1/vendas/resumo?${toParams(filters)}`),
    staleTime: STALE,
  });
}

export function useVendasEvolucao(filters: VendasFilters) {
  return useQuery<VendasEvolucao>({
    queryKey: ['vendas', 'evolucao', filters.dateRange.from, filters.dateRange.to, filters.locationId],
    queryFn: () => apiFetch<VendasEvolucao>(`/api/v1/vendas/evolucao?${toParams(filters)}`),
    staleTime: STALE,
  });
}

export function useVendasSegmentos(filters: VendasFilters) {
  return useQuery<VendasSegmento[]>({
    queryKey: ['vendas', 'segmentos', filters.dateRange.from, filters.dateRange.to, filters.locationId],
    queryFn: () => apiFetch<VendasSegmento[]>(`/api/v1/vendas/segmentos?${toParams(filters)}`),
    staleTime: STALE,
  });
}

export function useVendasTopProdutos(filters: VendasFilters, segmento?: string) {
  const params = toParams(filters);
  const q = segmento ? `${params}&segmento=${encodeURIComponent(segmento)}` : params;
  return useQuery<VendasTopProduto[]>({
    queryKey: ['vendas', 'top-produtos', filters.dateRange.from, filters.dateRange.to, filters.locationId, segmento ?? null],
    queryFn: () => apiFetch<VendasTopProduto[]>(`/api/v1/vendas/top-produtos?${q}`),
    staleTime: STALE,
  });
}
