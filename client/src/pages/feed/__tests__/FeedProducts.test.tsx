import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../test-utils';
import { FeedProductsPage } from '../FeedProducts';

describe('FeedProductsPage integration', () => {
  it('renders page title', () => {
    renderWithProviders(<FeedProductsPage />);
    expect(screen.getByText('Manajemen Produk Pakan')).toBeTruthy();
  });

  it('renders feed products from MSW mock data', async () => {
    renderWithProviders(<FeedProductsPage />);
    const productName = await screen.findByText('Super Start 511');
    expect(productName).toBeTruthy();
  });
});