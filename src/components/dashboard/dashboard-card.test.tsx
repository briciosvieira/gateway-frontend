import { render, screen } from '@testing-library/react';
import { Building2 } from 'lucide-react';
import { describe, expect, it } from 'vitest';

import { DashboardCard } from '@/components/dashboard/dashboard-card';

describe('DashboardCard', () => {
  it('renders the label and value with an accessible label', () => {
    render(<DashboardCard icon={Building2} label="Clients" value="42" />);

    expect(screen.getByLabelText('Clients')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('renders the description when provided', () => {
    render(
      <DashboardCard icon={Building2} label="Clients" value="42" description="Active clients" />,
    );
    expect(screen.getByText('Active clients')).toBeInTheDocument();
  });

  it('shows a skeleton instead of the value while loading', () => {
    render(<DashboardCard icon={Building2} label="Clients" value="42" isLoading />);

    expect(screen.queryByText('42')).not.toBeInTheDocument();
  });
});
