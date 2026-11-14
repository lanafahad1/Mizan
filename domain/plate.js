// The healthy plate builder: compare what is on someone's plate with the Ministry of
// Health healthy plate (HEALTHY_PLATE in data/moh-calorie-guide.js: vegetables 30%,
// grains 25%, protein 25%, fruit 20%, milk beside the plate).
//
// The person says roughly how much of each group is on their plate (none, a little,
// medium, a lot). Mizan turns that into a share of the plate and says, in plain words,
// whether each group is about the same as, more than or less than the MOH plate.
// "About the same" means within 10 percentage points: a display choice of the Mizan
// team (source MIZAN-PLATE), not a health rule. There is no score.

import { HEALTHY_PLATE } from '../data/moh-calorie-guide.js';

/** The four groups that share the plate, in MOH order, with their MOH share (%). */
export const PLATE_GROUPS = HEALTHY_PLATE.filter((g) => g.share != null).map((g) => ({ id: g.group, label: g.label, share: g.share }));
/** Shown beside the plate (MOH gives it no share). */
export const PLATE_SIDE = HEALTHY_PLATE.filter((g) => g.share == null).map((g) => ({ id: g.group, label: g.label }));
export const PLATE_AMOUNTS = [
  { value: 0, label: 'None' },
  { value: 1, label: 'A little' },
  { value: 2, label: 'Medium' },
  { value: 3, label: 'A lot' },
];
/** Percentage points within which a share counts as "about the same" (MIZAN-PLATE). */
export const PLATE_CLOSE = 10;

const level = (v) => {
  const n = Number(v);
  return Number.isInteger(n) && n >= 0 && n <= 3 ? n : 0;
};

/**
 * Compare a plate with the MOH plate.
 * `amounts`: { vegetables, grains, protein, fruit } each 0–3; `milk`: true when there is
 * milk, laban or yogurt on the side.
 * Returns { empty, groups: [{ id, label, amount, share, moh, verdict }], milk }, where
 * verdict is 'missing' (none on the plate), 'close', 'more' or 'less'.
 */
export function comparePlate(amounts = {}, { milk = false } = {}) {
  const rows = PLATE_GROUPS.map((g) => ({ ...g, amount: level(amounts[g.id]) }));
  const total = rows.reduce((n, r) => n + r.amount, 0);
  if (!total) return { empty: true, groups: rows.map((r) => ({ id: r.id, label: r.label, amount: 0, share: 0, moh: r.share, verdict: 'missing' })), milk: Boolean(milk) };
  const groups = rows.map((r) => {
    const share = Math.round((r.amount / total) * 100);
    const diff = share - r.share;
    const verdict = r.amount === 0 ? 'missing' : Math.abs(diff) <= PLATE_CLOSE ? 'close' : diff > 0 ? 'more' : 'less';
    return { id: r.id, label: r.label, amount: r.amount, share, moh: r.share, verdict };
  });
  return { empty: false, groups, milk: Boolean(milk) };
}

/** The plate group of a food from the food list (MOH portion groups and ingredient groups), or null when it can't be told. */
export function plateGroupOf(food) {
  if (!food) return null;
  if (food.kind === 'moh-portion') return { starch: 'grains', vegetables: 'vegetables', protein: 'protein', fruit: 'fruit', milk: 'milk' }[food.group] ?? null;
  if (food.kind === 'ingredient') return { grains: 'grains', vegetables: 'vegetables', proteins: 'protein', fruits: 'fruit', dairy: 'milk' }[food.group] ?? null;
  return null;
}

/**
 * A starting plate from logged foods: each group with at least one food is marked
 * "Medium" (2), milk foods tick "milk on the side". Foods whose group can't be told
 * (Saudi dishes, packaged foods, quick adds) are listed so the person adds them by hand.
 */
export function plateFromEntries(entries = []) {
  const amounts = Object.fromEntries(PLATE_GROUPS.map((g) => [g.id, 0]));
  let milk = false;
  const unknown = [];
  for (const e of entries) {
    const g = e.plateGroup ?? null;
    if (g === 'milk') milk = true;
    else if (g && g in amounts) amounts[g] = 2;
    else unknown.push(e.name);
  }
  return { amounts, milk, unknown };
}
