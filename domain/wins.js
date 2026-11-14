// Small wins: gentle habit badges worked out from data the person already keeps
// (food diary, daily trackers, weekly check-ins). Nothing is stored. Badges are about
// habits only: never about weight, never a ranking, and nothing is ever taken away
// (a badge stays earned once the history shows it).
//
// Goals come from MOH (Calorie Guide for Weight Loss, MOH-GUIDE): at least 6 cups of
// water a day, more than 7,500 steps a day, and 7–8 hours of sleep a night for adults.

import { addDays } from './dates.js';

export const WIN_GOALS = { water: 6, steps: 7500, sleep: 7 };

/** Every badge, in display order. `patientOnly`: weekly check-ins exist only for hospital patients. */
export const WINS = [
  { id: 'logged-7', label: '7 days logged', hint: 'Log your food on 7 days.', of: 7 },
  { id: 'logged-30', label: '30 days logged', hint: 'Log your food on 30 days.', of: 30 },
  { id: 'water-5', label: 'Water goal 5 days in a row', hint: 'Drink 6 cups or more on 5 days in a row.', of: 5 },
  { id: 'steps-goal', label: 'Steps goal reached', hint: 'Walk more than 7,500 steps in a day.', of: 1 },
  { id: 'sleep-5', label: '5 nights of 7+ hours’ sleep', hint: 'Sleep 7 hours or more on 5 nights.', of: 5 },
  { id: 'checkin-1', label: 'First check-in', hint: 'Answer your weekly check-in.', of: 1, patientOnly: true },
  { id: 'checkin-4', label: '4 check-ins', hint: 'Answer your weekly check-in 4 times.', of: 4, patientOnly: true },
];

/** The longest run of consecutive days (YYYY-MM-DD) in a list. */
export function longestRun(dates) {
  const set = new Set(dates);
  let best = 0;
  for (const d of set) {
    if (set.has(addDays(d, -1))) continue; // not the start of a run
    let n = 1;
    let x = d;
    while (set.has((x = addDays(x, 1)))) n += 1;
    best = Math.max(best, n);
  }
  return best;
}

/**
 * Work out the badges.
 *   loggedDates: dates with any food logged
 *   daily:       { water: {date: cups}, steps: {date: n}, sleep: {date: hours} }
 *   checkins:    number of weekly check-ins answered, or null (members: no check-ins)
 * Returns { earned, total, wins: [{ id, label, hint, earned, n, of }] }.
 */
export function computeWins({ loggedDates = [], daily = {}, checkins = null } = {}) {
  const days = (map, ok) => Object.entries(map ?? {}).filter(([, v]) => v != null && ok(Number(v))).map(([d]) => d);
  const logged = new Set(loggedDates).size;
  const waterRun = longestRun(days(daily.water, (v) => v >= WIN_GOALS.water));
  const stepDays = days(daily.steps, (v) => v > WIN_GOALS.steps).length;
  const sleepNights = days(daily.sleep, (v) => v >= WIN_GOALS.sleep).length;
  const counts = {
    'logged-7': logged, 'logged-30': logged, 'water-5': waterRun, 'steps-goal': stepDays, 'sleep-5': sleepNights,
    'checkin-1': checkins ?? 0, 'checkin-4': checkins ?? 0,
  };
  const wins = WINS.filter((w) => !w.patientOnly || checkins != null).map((w) => {
    const n = Math.min(w.of, counts[w.id] ?? 0);
    return { id: w.id, label: w.label, hint: w.hint, of: w.of, n, earned: n >= w.of };
  });
  return { earned: wins.filter((w) => w.earned).length, total: wins.length, wins };
}
