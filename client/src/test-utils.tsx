import { render, type RenderResult } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';

export function renderWithProviders(
  ui: React.ReactElement,
  options?: { route?: string },
): RenderResult {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

  document.cookie = 'csrf_token=test-csrf-token';

  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter initialEntries={[options?.route || '/']}>
          {ui}
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
}