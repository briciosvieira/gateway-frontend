import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SidebarProvider } from '@/contexts/sidebar-context';
import { useSidebar } from '@/hooks/use-sidebar';

const SIDEBAR_STORAGE_KEY = 'gateway-hub-lf-sidebar';

function mockMatchMedia(matches: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
}

function Probe() {
  const { isCollapsed } = useSidebar();
  return <span>{isCollapsed ? 'collapsed' : 'expanded'}</span>;
}

function renderProbe() {
  return render(
    <SidebarProvider>
      <Probe />
    </SidebarProvider>,
  );
}

describe('SidebarProvider', () => {
  beforeEach(() => {
    window.localStorage.removeItem(SIDEBAR_STORAGE_KEY);
  });

  it('defaults to collapsed (hover-only) on a hover-capable desktop with no stored preference', () => {
    mockMatchMedia(true);
    renderProbe();

    expect(screen.getByText('collapsed')).toBeInTheDocument();
  });

  it('defaults to expanded on a touch/coarse-pointer device with no stored preference, preserving the original behavior', () => {
    mockMatchMedia(false);
    renderProbe();

    expect(screen.getByText('expanded')).toBeInTheDocument();
  });

  it('respects an explicit stored "expanded" preference regardless of hover capability', () => {
    mockMatchMedia(true);
    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, 'expanded');
    renderProbe();

    expect(screen.getByText('expanded')).toBeInTheDocument();
  });

  it('respects an explicit stored "collapsed" preference regardless of hover capability', () => {
    mockMatchMedia(false);
    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, 'collapsed');
    renderProbe();

    expect(screen.getByText('collapsed')).toBeInTheDocument();
  });
});
