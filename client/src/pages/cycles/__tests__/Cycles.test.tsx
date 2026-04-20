import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../test-utils';
import { CyclesPage } from '../Cycles';

describe('CyclesPage integration', () => {
  it('renders cycles page title', () => {
    renderWithProviders(<CyclesPage />);
    expect(screen.getByText('Manajemen Siklus')).toBeTruthy();
  });

  it('renders cycles from MSW mock data', async () => {
    renderWithProviders(<CyclesPage />);
    const cycleNumber = await screen.findByText('1');
    expect(cycleNumber).toBeTruthy();
  });

  it('renders toggle switches for cycle status', async () => {
    renderWithProviders(<CyclesPage />);
    const switches = await screen.findAllByRole('switch');
    expect(switches.length).toBeGreaterThanOrEqual(1);
  });
});