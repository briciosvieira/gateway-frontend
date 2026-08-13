import { useEffect, useState } from 'react';

const HOVER_CAPABLE_QUERY = '(hover: hover) and (pointer: fine)';

function getSupportsHover(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia(HOVER_CAPABLE_QUERY).matches;
}

/**
 * True only for a real mouse/trackpad — false for touch devices and coarse
 * pointers (tablets), even at desktop-sized viewports. The Sidebar's
 * hover-to-reveal behavior must never apply to those (see
 * `.ai/CURRENT_TASK.md`), since there's no hover to trigger it and no way
 * to reach the reveal zone by touch.
 */
export function useSupportsHover(): boolean {
  const [supportsHover, setSupportsHover] = useState(getSupportsHover);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;

    const mediaQueryList = window.matchMedia(HOVER_CAPABLE_QUERY);
    const handleChange = () => setSupportsHover(mediaQueryList.matches);

    mediaQueryList.addEventListener('change', handleChange);
    return () => mediaQueryList.removeEventListener('change', handleChange);
  }, []);

  return supportsHover;
}
