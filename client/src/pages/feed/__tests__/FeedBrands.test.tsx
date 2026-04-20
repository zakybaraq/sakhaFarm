import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../test-utils';
import { FeedBrandsPage } from '../FeedBrands';

describe('FeedBrandsPage integration', () => {
  it('renders page title', () => {
    renderWithProviders(<FeedBrandsPage />);
    expect(screen.getByText('Manajemen Merek Pakan')).toBeTruthy();
  });

  it('renders feed brands from MSW mock data', async () => {
    renderWithProviders(<FeedBrandsPage />);
    const brandName = await screen.findByText('Charoen Pokphand');
    expect(brandName).toBeTruthy();
  });
});