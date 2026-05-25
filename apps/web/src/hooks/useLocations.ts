import { useQuery } from '@tanstack/react-query'
import { apiUrl } from '@/lib/api'

interface Location {
  id: string
  name: string
  sourceLocationId: string
}

async function fetchLocations(): Promise<Location[]> {
  const res = await fetch(apiUrl('/api/v1/locations'), { credentials: 'include' })
  if (!res.ok) throw new Error('Failed to fetch locations')
  const data = await res.json()
  // API returns { locations: [...] }
  return data.locations ?? data
}

export function useLocations() {
  return useQuery({
    queryKey: ['locations'],
    queryFn: fetchLocations,
    staleTime: 5 * 60 * 1000, // 5 min — locations don't change often
  })
}
