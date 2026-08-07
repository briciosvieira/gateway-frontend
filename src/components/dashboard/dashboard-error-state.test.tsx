import { fireEvent, render, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { DashboardErrorState } from '@/components/dashboard/dashboard-error-state';
import i18next from '@/lib/i18n';

describe('DashboardErrorState', () => {
  beforeAll(async () => {
    await i18next.changeLanguage('en');
  });

  it('renders the provided message', () => {
    render(<DashboardErrorState message="Unable to load dashboard data." />);
    expect(screen.getByText('Unable to load dashboard data.')).toBeInTheDocument();
  });

  it('does not render a retry button when onRetry is not provided', () => {
    render(<DashboardErrorState message="Unable to load dashboard data." />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('calls onRetry when the retry button is clicked', () => {
    const onRetry = vi.fn();
    render(<DashboardErrorState message="Unable to load dashboard data." onRetry={onRetry} />);

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
