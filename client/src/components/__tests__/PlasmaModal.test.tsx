import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { PlasmaModal } from '../../pages/plasmas/PlasmaModal'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
})

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
)

describe('PlasmaModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders modal component', () => {
    render(<PlasmaModal open={true} onClose={() => {}} />, { wrapper })
    expect(document.body.innerHTML).toContain('MuiDialog')
  })

  it('renders form fields', () => {
    render(<PlasmaModal open={true} onClose={() => {}} />, { wrapper })
    expect(document.body.innerHTML).toContain('MuiTextField')
  })
})