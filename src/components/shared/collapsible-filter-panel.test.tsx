import { fireEvent, render, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it } from 'vitest';

import { CollapsibleFilterPanel } from '@/components/shared/collapsible-filter-panel';
import i18next from '@/lib/i18n';

describe('CollapsibleFilterPanel', () => {
  beforeAll(async () => {
    await i18next.changeLanguage('en');
  });

  function renderPanel(defaultExpanded?: boolean) {
    return render(
      <CollapsibleFilterPanel
        searchSlot={<input aria-label="Search" />}
        gridClassName="md:grid-cols-2"
        hasActiveFilters={false}
        defaultExpanded={defaultExpanded}
      >
        <span>Extra filter field</span>
      </CollapsibleFilterPanel>,
    );
  }

  it('starts collapsed — only the search slot is visible, the rest is hidden', () => {
    renderPanel();

    expect(screen.getByLabelText('Search')).toBeInTheDocument();
    expect(screen.queryByText('Extra filter field')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Filters' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  it('reveals the other filter fields when the "Filters" toggle is clicked, and hides them again on a second click', () => {
    renderPanel();

    fireEvent.click(screen.getByRole('button', { name: 'Filters' }));
    expect(screen.getByText('Extra filter field')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Filters' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Filters' }));
    expect(screen.queryByText('Extra filter field')).not.toBeInTheDocument();
  });

  it('starts expanded when defaultExpanded is true', () => {
    renderPanel(true);

    expect(screen.getByText('Extra filter field')).toBeInTheDocument();
  });

  it('shows an indicator dot on the toggle when there are active filters', () => {
    render(
      <CollapsibleFilterPanel
        searchSlot={<input aria-label="Search" />}
        gridClassName="md:grid-cols-2"
        hasActiveFilters
      >
        <span>Extra filter field</span>
      </CollapsibleFilterPanel>,
    );

    const toggle = screen.getByRole('button', { name: 'Filters' });
    expect(toggle.querySelector('.bg-primary')).toBeInTheDocument();
  });
});
