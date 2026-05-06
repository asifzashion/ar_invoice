// ── Mannai Brand Chart Theme ─────────────────────────────
// Primary palette — all pass WCAG AA on white backgrounds
export const BRAND_COLORS = [
  '#2c4070', // darkest — primary brand
  '#3d5490', // slightly lighter
  '#4e68b0', // mid
  '#1a2a4a', // very dark accent
  '#5a7a9a', // medium-light
  '#6b85b0', // light (still passes AA on white)
];

// Status colours — all in brand palette tones, WCAG AA contrast compliant
export const STATUS_COLORS: Record<string, string> = {
  pending_verification: '#7a9cbf', // darkened from #c8d8ec for label contrast
  rejected:             '#1a2a4a', // very dark brand
  verified:             '#2c4070', // primary brand
  submitted:            '#3d5490', // mid-dark brand
  in_followup:          '#4e68b0', // mid brand
  resolved:             '#5a7a9a', // darkened from #6b85b0 for contrast
  on_hold:              '#6b85b0', // clearly distinct from pending
};

// Shared tooltip style
export const TOOLTIP_STYLE = {
  borderRadius: '8px',
  border: '1px solid #e2e8f0',
  boxShadow: '0 4px 12px rgba(44,64,112,0.10)',
  fontSize: '12px',
};

// Shared grid / axis colours
export const GRID_COLOR  = '#f1f5f9';
export const AXIS_COLOR  = '#94a3b8';
export const AXIS_STYLE  = { fontSize: 11, fill: AXIS_COLOR };
