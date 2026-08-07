import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton';

describe('DashboardSkeleton', () => {
  it('renders a decorative, non-interactive placeholder', () => {
    const { container } = render(<DashboardSkeleton className="h-10 w-20" />);
    const skeleton = container.firstElementChild;

    expect(skeleton).toHaveAttribute('aria-hidden', 'true');
    expect(skeleton).toHaveClass('animate-pulse');
    expect(skeleton).toHaveClass('h-10');
    expect(skeleton).toHaveClass('w-20');
  });
});
