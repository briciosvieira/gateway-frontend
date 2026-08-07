# UI Rules

## Scroll policy

- `html`, `body`, `#root`: `overflow: hidden`
- Sidebar: fixed and without vertical scroll
- Main Content: the only vertical scroll container
- Pages: do not use `h-screen`, `h-dvh`, `overflow-y-auto` or `overflow-scroll`
- Tables: horizontal scroll only when necessary
- Dialogs, Drawers and Sheets may use internal scroll when necessary
- Never create a second vertical scrollbar
- Never create global horizontal scroll

## Sidebar

- Must remain fixed
- Must not scroll
- Must keep footer actions visible
- Must preserve collapsed and expanded modes

## Theme

- Preserve current blue/navy identity
- Support light and dark themes
- Do not spread hardcoded colors when theme tokens exist

## Responsive behavior

- Desktop
- Notebook
- Tablet
- Mobile