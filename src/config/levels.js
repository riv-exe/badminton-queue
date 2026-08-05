/**
 * Single source of truth for player skill levels and their associated colors.
 *
 * Any change to level names, display order, or colors should be made ONLY here.
 * Components throughout the app import from this module so the UI stays consistent.
 */
const LEVELS = [
  {
    name: "Beginner",
    emoji: "🟡",
    color: "#EAB308", // yellow
    badge: "bg-yellow-100 text-yellow-700",
    dot: "bg-yellow-500",
    hex: "#EAB308",
  },
  {
    name: "Intermediate",
    emoji: "🟢",
    color: "#22C55E", // green
    badge: "bg-green-100 text-green-700",
    dot: "bg-green-500",
    hex: "#22C55E",
  },
  {
    name: "Upper-Intermediate",
    emoji: "🔵",
    color: "#3B82F6", // blue
    badge: "bg-blue-100 text-blue-700",
    dot: "bg-blue-500",
    hex: "#3B82F6",
  },
  {
    name: "Advanced",
    emoji: "🔴",
    color: "#EF4444", // red
    badge: "bg-red-100 text-red-700",
    dot: "bg-red-500",
    hex: "#EF4444",
  },
];

/** Ordered array of just the level names (for dropdowns, options, filters). */
const LEVEL_NAMES = LEVELS.map((l) => l.name);

/**
 * Look up level config by name. Returns a safe fallback if the level is unknown
 * (e.g. legacy data not yet migrated).
 */
function getLevelConfig(level) {
  return LEVELS.find((l) => l.name === level) || {
    name: level,
    emoji: "⚪",
    color: "#9CA3AF",
    badge: "bg-[var(--surface-hover)] text-[var(--text)]",
    dot: "bg-[var(--text)]",
    hex: "#9CA3AF",
  };
}

/** Tailwind badge classes for a level (for colored pills / badges). */
function getLevelBadge(level) {
  return getLevelConfig(level).badge;
}

/** Tailwind dot color classes for a level. */
function getLevelDot(level) {
  return getLevelConfig(level).dot;
}

/** Hex color for a level (for inline styles / chart accents). */
function getLevelColor(level) {
  return getLevelConfig(level).hex;
}

export {
  LEVELS,
  LEVEL_NAMES,
  getLevelConfig,
  getLevelBadge,
  getLevelDot,
  getLevelColor,
};
