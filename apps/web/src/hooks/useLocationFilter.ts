import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

export interface UseLocationFilterResult {
  locationId: string | 'all';
  setLocationId: (id: string | 'all') => void;
  showFilter: boolean;
}

export function useLocationFilter(): UseLocationFilterResult {
  const { user } = useAuth();
  const [locationId, setLocationId] = useState<string | 'all'>('all');

  // Managers are locked to their own location — no filter shown
  const showFilter = user?.role !== 'manager';

  return { locationId, setLocationId, showFilter };
}
