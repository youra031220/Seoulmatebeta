// Meal time windows
export const MEAL_WINDOWS = {
  breakfast: { start: "07:30", end: "09:30" },
  lunch: { start: "11:30", end: "13:30" },
  dinner: { start: "17:30", end: "19:30" },
  cafe: { start: "14:00", end: "16:00" }
};

// Stay time by category (in minutes)
export const STAY_TIME_BY_CATEGORY = {
  // Attractions
  palace: 90,
  museum: 90,
  attraction: 90,
  poi: 90,
  
  // Food & Drink
  restaurant: 60,
  cafe: 40,
  
  // Other categories
  required: 60,
  spot: 60,
  default: 60
};

// Pace multipliers
export const PACE_MULTIPLIER = {
  relaxed: 1.3,
  normal: 1.0,
  tight: 0.7
};

// Utility functions

/**
 * Round minutes to nearest 10-minute interval
 */
export function roundToTen(minutes) {
  return Math.round(minutes / 10) * 10;
}

/**
 * Convert "HH:MM" time string to total minutes
 */
export function toMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

/**
 * Convert total minutes to "HH:MM" time string
 */
export function toTimeString(totalMinutes) {
  const m = Math.max(0, Math.round(totalMinutes));
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

/**
 * Calculate stay time for a category with pace adjustment
 */
export function calculateStayTime(category, pace = "normal") {
  const baseTime = STAY_TIME_BY_CATEGORY[category] || STAY_TIME_BY_CATEGORY.default;
  const multiplier = PACE_MULTIPLIER[pace] || PACE_MULTIPLIER.normal;
  const adjustedTime = baseTime * multiplier;
  return roundToTen(adjustedTime);
}
