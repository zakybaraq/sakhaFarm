import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../test-utils';
import { UsersPage } from '../Users';

describe('UsersPage integration', () => {
  it('renders users page title', () => {
    renderWithProviders(<UsersPage />);
    expect(screen.getByText('Manajemen Pengguna')).toBeTruthy();
  });

  it('renders users from MSW mock data', async () => {
    renderWithProviders(<UsersPage />);
    const userName = await screen.findByText('Admin User');
    expect(userName).toBeTruthy();
  });

  it('renders toggle switches for user status', async () => {
    renderWithProviders(<UsersPage />);
    const switches = await screen.findAllByRole('switch');
    expect(switches.length).toBeGreaterThanOrEqual(1);
  });
});