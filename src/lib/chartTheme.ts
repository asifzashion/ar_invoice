// ── Mannai Brand Chart Theme ─────────────────────────────
// Primary palette derived from sidebar/active menu #2c4070
export const BRAND_COLORS = [
  '#2c4070', // darkest — primary brand
  '#3d5490', // slightly lighter
  '#4e68b0', // mid
  '#6b85b0', // lighter
  '#8fa5c8', // light
  '#a8bbd4', // lightest
];

// Status colours — all in brand palette tones
export const STATUS_COLORS: Record<string, string> = {
  pending_verification: '#8fa5c8', // light brand — pending
  rejected:             '#1a2a4a', // very dark brand — rejected
  verified:             '#2c4070', // primary brand
  submitted:            '#3d5490', // mid-dark brand
  in_followup:          '#4e68b0', // mid brand
  resolved:             '#6b85b0', // lighter brand
  on_hold:              '#a8bbd4', // lightest brand
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
