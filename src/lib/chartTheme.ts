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

// Status colours — kept distinct but harmonised
export const STATUS_COLORS: Record<string, string> = {
  pending_verification: '#f59e0b',
  rejected:             '#ef4444',
  verified:             '#2c4070',
  submitted:            '#3d5490',
  in_followup:          '#f97316',
  resolved:             '#10b981',
  on_hold:              '#94a3b8',
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
