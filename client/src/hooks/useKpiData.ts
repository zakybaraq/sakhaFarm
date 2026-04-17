import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { listActiveCycles } from '../api/cycles'
import { getPerformance } from '../api/reporting'
import { getFeedStock } from '../api/feed'

export interface KpiData {
  activeCycles: number
  avgFcr: number | null
  avgIp: number | null
  lowStockAlerts: number
  isLoading: boolean
  error: Error | null
  refetch: () => void
}

export function useKpiData(): KpiData {
  const { user } = useAuth()
  const tenantId = user?.tenantId
  const enabled = !!user && tenantId !== undefined

  const cyclesQuery = useQuery({
    queryKey: ['cycles', 'active', tenantId],
    queryFn: () => listActiveCycles(tenantId as number),
    enabled,
    staleTime: 1000 * 60 * 5,
  })

  const performanceQuery = useQuery({
    queryKey: ['reporting', 'performance', tenantId],
    queryFn: () => getPerformance(tenantId as number, { limit: 100 }),
    enabled,
    staleTime: 1000 * 60 * 5,
  })

  const stockQuery = useQuery({
    queryKey: ['feed', 'stock'],
    queryFn: () => getFeedStock(),
    enabled,
    staleTime: 1000 * 60 * 2,
  })

  const activeCycles = cyclesQuery.data?.cycles?.length ?? 0

  const avgFcr = performanceQuery.data?.data
    ? (() => {
        const valid = performanceQuery.data.data.filter((r) => r.fcr !== null)
        return valid.length > 0 ? valid.reduce((sum, r) => sum + r.fcr!, 0) / valid.length : null
      })()
    : null

  const avgIp = performanceQuery.data?.data
    ? (() => {
        const valid = performanceQuery.data.data.filter((r) => r.ip !== null)
        return valid.length > 0 ? valid.reduce((sum, r) => sum + r.ip!, 0) / valid.length : null
      })()
    : null

  const lowStockAlerts = Array.isArray(stockQuery.data?.stocks)
    ? stockQuery.data.stocks.filter((s: { isLow?: boolean }) => s.isLow).length
    : 0

  return {
    activeCycles,
    avgFcr: avgFcr !== null ? Math.round(avgFcr * 100) / 100 : null,
    avgIp: avgIp !== null ? Math.round(avgIp * 100) / 100 : null,
    lowStockAlerts,
    isLoading: cyclesQuery.isLoading || performanceQuery.isLoading || stockQuery.isLoading,
    error: cyclesQuery.error || performanceQuery.error || stockQuery.error,
    refetch: () => {
      cyclesQuery.refetch()
      performanceQuery.refetch()
      stockQuery.refetch()
    },
  }
}