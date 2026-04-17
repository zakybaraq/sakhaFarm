import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { login as apiLogin, logout as apiLogout, getCurrentUser } from '../api/auth'
import { getUserPermissions } from '../api/rbac'
import type { User, Permission } from '../types'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  permissions: string[]
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient()
  const [permissions, setPermissions] = useState<string[]>([])

  const { data: meData, isLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: getCurrentUser,
    retry: false,
    staleTime: 1000 * 60 * 5,
    throwOnError: false,
  })

  const user = meData?.user ?? null
  const isAuthenticated = !!meData?.user

  useEffect(() => {
    if (isAuthenticated && user) {
      getUserPermissions()
        .then((data) => {
          setPermissions(data.permissions.map((p: Permission) => p.permissionName))
        })
        .catch(() => {
          setPermissions([])
        })
    } else {
      setPermissions([])
    }
  }, [isAuthenticated, user?.id])

  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      apiLogin(email, password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth'] })
    },
  })

  const logoutMutation = useMutation({
    mutationFn: apiLogout,
    onSuccess: () => {
      queryClient.clear()
      setPermissions([])
    },
  })

  const login = useCallback(
    async (email: string, password: string) => {
      await loginMutation.mutateAsync({ email, password })
    },
    [loginMutation],
  )

  const logout = useCallback(async () => {
    await logoutMutation.mutateAsync()
  }, [logoutMutation])

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        permissions,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}