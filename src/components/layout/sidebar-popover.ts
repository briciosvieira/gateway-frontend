/**
 * Language/theme dropdowns and tooltips in the footer render via a Radix
 * Portal — outside the Sidebar's own DOM subtree, even though they appear
 * attached to it. Without this check, moving the pointer from the Sidebar
 * into one of them would read as "left the Sidebar" and start the close
 * timer right underneath an open popover.
 */
export function isInsideSidebarPopover(node: Node | null): boolean {
  return (
    node instanceof Element &&
    node.closest('[data-slot="dropdown-menu-content"], [data-slot="tooltip-content"]') !== null
  );
}
