import { useQuery } from '@tanstack/react-query'
import { listActiveCycles } from '../api/cycles'
import { useAuth } from '../contexts/AuthContext'

export function useActiveCycles() {
  const { user } = useAuth()
  const tenantId = user?.tenantId

  return useQuery({
    queryKey: ['cycles', 'active', tenantId],
    queryFn: () => listActiveCycles(tenantId!),
    enabled: !!user && tenantId !== undefined,
    staleTime: 1000 * 60 * 5,
  })
}