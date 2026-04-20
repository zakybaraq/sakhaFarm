import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../test-utils';
import { PlasmaModal } from '../PlasmaModal';

describe('PlasmaModal integration', () => {
  it('renders PlasmaModal with form fields', () => {
    renderWithProviders(<PlasmaModal open={true} onClose={() => {}} />);
    expect(screen.getByText('Tambah Plasma')).toBeTruthy();
  });

  it('renders unit dropdown field', () => {
    renderWithProviders(<PlasmaModal open={true} onClose={() => {}} />);
    // MUI Select renders "Unit" in both the label and notched outline legend
    expect(screen.getAllByText('Unit').length).toBeGreaterThanOrEqual(1);
  });
});