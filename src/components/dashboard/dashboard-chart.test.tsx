import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { DashboardChart } from '@/components/dashboard/dashboard-chart';
import { ThemeProvider } from '@/contexts/theme-context';

describe('DashboardChart', () => {
  it('exposes an accessible description for the area chart', () => {
    render(
      <ThemeProvider>
        <DashboardChart
          type="area"
          data={[{ label: '2026-08-01', success: 9, error: 1 }]}
          xKey="label"
          description="Requests over time"
          series={[
            { key: 'success', label: 'Success', color: 'primary' },
            { key: 'error', label: 'Error', color: 'destructive' },
          ]}
        />
      </ThemeProvider>,
    );

    expect(screen.getByRole('img', { name: 'Requests over time' })).toBeInTheDocument();
    expect(screen.getByText('Requests over time', { selector: 'span' })).toBeInTheDocument();
  });

  it('exposes an accessible description for the bar chart', () => {
    render(
      <ThemeProvider>
        <DashboardChart
          type="bar"
          data={[{ statusCode: 200, total: 10 }]}
          xKey="statusCode"
          description="Status distribution"
          series={[{ key: 'total', label: 'Total', color: 'primary' }]}
        />
      </ThemeProvider>,
    );

    expect(screen.getByRole('img', { name: 'Status distribution' })).toBeInTheDocument();
  });
});
