import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

// 'all' = todas as unidades do tenant; UUID = filtra por location específica
export type LocationFilter = 'all' | string;

// Hook — sincroniza a location selecionada com o searchParam `location` da URL
export function useLocationFilter() {
  const [searchParams, setSearchParams] = useSearchParams();

  const locationId = searchParams.get('location') ?? 'all';

  const setLocationId = useCallback(
    (id: LocationFilter) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (id === 'all') {
            next.delete('location');
          } else {
            next.set('location', id);
          }
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  // Retorna o parâmetro pronto para a API (undefined quando 'all')
  const locationParam = locationId === 'all' ? undefined : locationId;

  return { locationId, locationParam, setLocationId };
}