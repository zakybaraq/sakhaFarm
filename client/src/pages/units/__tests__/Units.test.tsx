import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../test-utils';
import { UnitsPage } from '../Units';

describe('UnitsPage integration', () => {
  it('renders page title', () => {
    renderWithProviders(<UnitsPage />);
    expect(screen.getByText('Manajemen Unit')).toBeTruthy();
  });

  it('renders units from MSW mock data', async () => {
    renderWithProviders(<UnitsPage />);
    const unitName = await screen.findByText('Unit Kuningan');
    expect(unitName).toBeTruthy();
  });
});