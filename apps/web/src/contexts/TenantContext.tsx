/**
 * TenantContext — dados do tenant e suas locations
 * Spec: FRONTEND_SPEC.md seção 15.3 e seção 4
 *
 * - Carregado via GET /api/v1/locations no boot (após auth)
 * - Controla se UI exibe componentes comparativos multi-location
 */
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { api } from '@/lib/api';
import { useAuth } from './AuthContext';

export interface Location {
  id: string;
  name: string;
  source_location_id?: string;
}

interface TenantState {
  locations: Location[];
  locationCount: number;
  /** true se tenant tem 2+ locations E owner não desabilitou */
  multiLocationEnabled: boolean;
  loading: boolean;
  /** Owner pode desabilitar a visão multi-unidade em Settings */
  setMultiLocationEnabled: (enabled: boolean) => void;
}

const TenantContext = createContext<TenantState | null>(null);

export function TenantProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  // multiLocationEnabled começa como true — ajustado após carregar locations
  const [multiLocationEnabled, setMultiLocationEnabledState] = useState(true);

  useEffect(() => {
    if (!user?.tenantId) {
      setLoading(false);
      return;
    }

    api
      .get<Location[]>('/api/v1/locations')
      .then((data) => {
        setLocations(data);
        // Desabilita automaticamente se só tem 1 location
        if (data.length <= 1) setMultiLocationEnabledState(false);
      })
      .catch(() => setLocations([]))
      .finally(() => setLoading(false));
  }, [user?.tenantId]);

  const setMultiLocationEnabled = useCallback((enabled: boolean) => {
    // Só faz sentido habilitar se houver 2+ locations
    setMultiLocationEnabledState(locations.length > 1 ? enabled : false);
  }, [locations.length]);

  const locationCount = locations.length;

  return (
    <TenantContext.Provider
      value={{
        locations,
        locationCount,
        multiLocationEnabled: locationCount > 1 && multiLocationEnabled,
        loading,
        setMultiLocationEnabled,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant(): TenantState {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error('useTenant deve ser usado dentro de <TenantProvider>');
  return ctx;
}
