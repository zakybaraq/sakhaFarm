import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { UnitsPage } from '../../pages/units/Units';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../../contexts/AuthContext';

const mockUser = { id: '1', email: 'test@test.com', name: 'Test', role: 'admin' };

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: mockUser }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>{children}</AuthProvider>
  </QueryClientProvider>
);

describe('DataGrid', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders DataGrid component', () => {
    render(<UnitsPage />, { wrapper });
    expect(document.body.innerHTML).toContain('MuiDataGrid');
  });

  it('renders page container', () => {
    render(<UnitsPage />, { wrapper });
    expect(document.body.innerHTML).toContain('MuiBox');
  });
});
