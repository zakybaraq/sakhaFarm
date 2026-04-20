import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../test-utils';
import { FeedTypesPage } from '../FeedTypes';

describe('FeedTypesPage integration', () => {
  it('renders page title', () => {
    renderWithProviders(<FeedTypesPage />);
    expect(screen.getByText('Manajemen Jenis Pakan')).toBeTruthy();
  });

  it('renders feed types from MSW mock data', async () => {
    renderWithProviders(<FeedTypesPage />);
    const typeName = await screen.findByText('Starter');
    expect(typeName).toBeTruthy();
  });
});