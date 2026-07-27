/**
 * Pin fills for the map. Shared with the legend on the about page so the two can
 * never drift apart: green means visited, orange pending, and the lighter shade
 * of each is a bar added from the app rather than one of the original 100.
 */
export const MARKER_FILLS = {
  original: { visited: "#15803d", pending: "#b45309" },
  extra: { visited: "#34d399", pending: "#fb923c" },
} as const;

/** Ring and drop shadow every pin shares, reused by the legend swatches. */
export const MARKER_RING = "border-2 border-white shadow-[0_1px_3px_rgba(41,37,36,0.45)]";
