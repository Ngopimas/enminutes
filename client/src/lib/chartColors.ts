/**
 * Read chart color CSS variables at render time.
 * Chart.js needs resolved color strings, not CSS variable references.
 * Because components re-render when the theme changes, getComputedStyle
 * always returns the correct light/dark value.
 */
function read(n: 1 | 2 | 3 | 4 | 5): string {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(`--chart-${n}`)
    .trim();
}

export function chartColor(n: 1 | 2 | 3 | 4 | 5): string {
  return `hsl(${read(n)})`;
}

export function chartColorAlpha(n: 1 | 2 | 3 | 4 | 5, alpha: number): string {
  return `hsl(${read(n)} / ${alpha})`;
}
