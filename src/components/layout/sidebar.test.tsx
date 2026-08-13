import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { Sidebar } from '@/components/layout/sidebar';
import { isInsideSidebarPopover } from '@/components/layout/sidebar-popover';
import { ThemeProvider } from '@/contexts/theme-context';
import i18next from '@/lib/i18n';

const HOVER_CLOSE_DELAY_MS = 300;

vi.mock('@/features/auth/use-auth', () => ({
  useAuth: () => ({
    user: { name: 'Ada Lovelace', role: { code: 'ADMIN' } },
    hasPermission: () => true,
    logout: vi.fn(),
    isLoggingOut: false,
  }),
}));

vi.mock('@/features/branding/branding.hooks', () => ({
  useBranding: () => ({
    branding: { applicationName: 'Gateway Hub LF', logoUrl: '/favicon.svg' },
  }),
}));

function mockMatchMedia(matches: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
}

function renderSidebar() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <ThemeProvider>
        <Sidebar />
      </ThemeProvider>
    </MemoryRouter>,
  );
}

function getAside() {
  return document.querySelector('aside') as HTMLElement;
}

describe('Sidebar', () => {
  beforeAll(async () => {
    await i18next.changeLanguage('en');
  });

  beforeEach(() => {
    mockMatchMedia(true); // hover-capable desktop by default
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts compact (icon-only rail) on a hover-capable desktop — visible, not hidden', () => {
    renderSidebar();

    expect(getAside().className).toMatch(/\bw-18\b/);
    expect(getAside().className).not.toMatch(/w-60/);
    // The icon is always there; the app name label only renders once expanded.
    const img = getAside().querySelector('img');
    expect(img).toBeInTheDocument();
    expect(screen.queryByText('Gateway Hub LF')).not.toBeInTheDocument();
  });

  it('expands to show labels when the pointer enters the Sidebar', () => {
    renderSidebar();

    fireEvent.mouseEnter(getAside());

    expect(getAside().className).toMatch(/\bw-60\b/);
    expect(screen.getByText('Gateway Hub LF')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Settings' })).toBeInTheDocument();
  });

  it('stays expanded while the pointer is over it, and collapses only after the delay once it leaves', () => {
    vi.useFakeTimers();
    renderSidebar();

    fireEvent.mouseEnter(getAside());
    expect(getAside().className).toMatch(/\bw-60\b/);

    fireEvent.mouseLeave(getAside());
    // Not immediately collapsed — the close is delayed.
    expect(getAside().className).toMatch(/\bw-60\b/);

    act(() => {
      vi.advanceTimersByTime(HOVER_CLOSE_DELAY_MS + 10);
    });
    expect(getAside().className).toMatch(/\bw-18\b/);
  });

  it('cancels the pending collapse if the pointer returns before the delay elapses', () => {
    vi.useFakeTimers();
    renderSidebar();

    fireEvent.mouseEnter(getAside());
    fireEvent.mouseLeave(getAside());
    act(() => {
      vi.advanceTimersByTime(HOVER_CLOSE_DELAY_MS - 50);
    });
    fireEvent.mouseEnter(getAside());
    act(() => {
      vi.advanceTimersByTime(HOVER_CLOSE_DELAY_MS - 50);
    });

    expect(getAside().className).toMatch(/\bw-60\b/);
  });

  it('recognizes a dropdown/tooltip portal node so leaving into one never starts the close timer', () => {
    const dropdownNode = document.createElement('div');
    dropdownNode.setAttribute('data-slot', 'dropdown-menu-content');

    const tooltipNode = document.createElement('div');
    tooltipNode.setAttribute('data-slot', 'tooltip-content');

    const unrelatedNode = document.createElement('div');

    expect(isInsideSidebarPopover(dropdownNode)).toBe(true);
    expect(isInsideSidebarPopover(tooltipNode)).toBe(true);
    expect(isInsideSidebarPopover(unrelatedNode)).toBe(false);
    expect(isInsideSidebarPopover(null)).toBe(false);
  });

  it('expands on keyboard focus within the Sidebar and collapses once focus moves elsewhere', () => {
    renderSidebar();

    // While compact, nav links have no visible label yet — query by `href`
    // instead of accessible name (which is only populated once expanded).
    const settingsLink = getAside().querySelector('a[href="/settings"]') as HTMLElement;
    fireEvent.focus(settingsLink);
    expect(getAside().className).toMatch(/\bw-60\b/);

    // Expanding swaps the compact Tooltip-wrapped link for a bare one, so the
    // pre-focus node is now detached — re-query the live one before blurring.
    const expandedSettingsLink = getAside().querySelector('a[href="/settings"]') as HTMLElement;
    fireEvent.blur(expandedSettingsLink, { relatedTarget: document.body });
    expect(getAside().className).toMatch(/\bw-18\b/);
  });

  it('keeps the active nav item visually identifiable while compact', () => {
    renderSidebar();

    const homeLink = getAside().querySelector('a[href="/"]') as HTMLElement;
    expect(homeLink.className).toMatch(/bg-primary\/15/);
  });

  it('renders no manual expand/collapse button on desktop — hover/focus is the only interaction', () => {
    renderSidebar();
    fireEvent.mouseEnter(getAside());

    expect(screen.queryByRole('button', { name: 'Expand menu' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Collapse menu' })).not.toBeInTheDocument();
  });

  it('is a real flex sibling (not a fixed/absolute overlay), so expanding it reflows the content instead of covering it', () => {
    renderSidebar();

    expect(getAside().className).toMatch(/shrink-0/);
    expect(getAside().className).not.toMatch(/\bfixed\b/);
    expect(getAside().className).not.toMatch(/\babsolute\b/);

    fireEvent.mouseEnter(getAside());
    // Still no overlay positioning once expanded — only the width class changes.
    expect(getAside().className).toMatch(/\bw-60\b/);
    expect(getAside().className).not.toMatch(/\bfixed\b/);
  });

  it('renders permanently expanded and docked (no compact rail) on touch/coarse-pointer devices', () => {
    mockMatchMedia(false);
    renderSidebar();

    expect(getAside().className).toMatch(/shrink-0/);
    expect(getAside().className).not.toMatch(/fixed/);
    expect(screen.getByText('Gateway Hub LF')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Settings' })).toBeInTheDocument();
  });

  it('uses the near-black nav-sidebar background token', () => {
    renderSidebar();

    expect(getAside().className).toMatch(/bg-nav-sidebar\b/);
  });

  it('cleans up the pending close timeout on unmount without throwing', () => {
    vi.useFakeTimers();
    const { unmount } = renderSidebar();

    fireEvent.mouseEnter(getAside());
    fireEvent.mouseLeave(getAside());

    expect(() => unmount()).not.toThrow();
    expect(() => act(() => vi.advanceTimersByTime(HOVER_CLOSE_DELAY_MS + 10))).not.toThrow();
  });

  it('keeps the scrollable nav and fixed footer structure', async () => {
    renderSidebar();
    fireEvent.mouseEnter(getAside());

    const nav = getAside().querySelector('nav')!;
    expect(nav.className).toMatch(/hide-scrollbar/);
    expect(nav.className).toMatch(/overflow-y-auto/);

    await waitFor(() => expect(getAside().querySelector('footer')).toBeInTheDocument());
  });
});
