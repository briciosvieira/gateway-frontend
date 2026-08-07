import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { DashboardEmptyState } from '@/components/dashboard/dashboard-empty-state';

describe('DashboardEmptyState', () => {
  it('renders the provided message', () => {
    render(<DashboardEmptyState message="No records found." />);
    expect(screen.getByText('No records found.')).toBeInTheDocument();
  });
});
