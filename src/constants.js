/** Tailwind classes for each FDR bucket on our 1–11 scale. */
export const FDR_COLORS = {
  1: 'bg-[#016D2F]',
  2: 'bg-[#1E9A45]',
  3: 'bg-[#62C051]',
  4: 'bg-[#A3D869]',
  5: 'bg-[#E1F296]',
  6: 'bg-[#FFFFFF] text-black',
  7: 'bg-[#FBD176]',
  8: 'bg-[#FA9C56]',
  9: 'bg-[#F47137]',
  10: 'bg-[#DB2726]',
  11: 'bg-[#900613]',
};

/** FPL's own 1–5 difficulty mapped onto our 1–11 scale. */
export const OFFICIAL_FDR_MAP = { 1: 1, 2: 3, 3: 6, 4: 9, 5: 11 };

/** Position code -> short label. */
export const POSITION_LABELS = { 1: 'GKP', 2: 'DEF', 3: 'MID', 4: 'FWD' };

export const SORT_ORDERS = /** @type {const} */ (['default', 'easiest', 'hardest']);
export const FDR_MODES = /** @type {const} */ (['overall', 'attack', 'defence']);
export const FDR_ALGORITHMS = /** @type {const} */ (['official', 'linear', 'strength', 'form']);

export const ALGORITHM_LABELS = {
  official: 'Official FPL (1–5)',
  linear: 'Linear 1–11',
  strength: 'Data-driven (strength)',
  form: 'Form-adjusted',
};

export const MODE_LABELS = {
  overall: 'Overall',
  attack: 'Attack (vs opp defence)',
  defence: 'Defence (vs opp attack)',
};
