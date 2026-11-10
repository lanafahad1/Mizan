// The meal that fits the time of day (safe for server and client).
export type MealId = 'breakfast' | 'lunch' | 'dinner' | 'snack';

/** Breakfast until 11:00, lunch until 15:00, a snack until 18:00, dinner until 22:00, then a snack. */
export function mealForHour(hour: number): MealId {
  if (hour >= 4 && hour < 11) return 'breakfast';
  if (hour >= 11 && hour < 15) return 'lunch';
  if (hour >= 15 && hour < 18) return 'snack';
  if (hour >= 18 && hour < 22) return 'dinner';
  return 'snack';
}

/** "Good morning" until 12:00, "Good afternoon" until 17:00, then "Good evening". */
export function greetingForHour(hour: number): 'Good morning' | 'Good afternoon' | 'Good evening' {
  if (hour >= 4 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/** Days since 1970-01-01 for an ISO date: a stable number to rotate tips by date. */
export function dayNumber(iso: string): number {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
}
