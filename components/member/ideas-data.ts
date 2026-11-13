// Meal ideas data (server only): Saudi dishes (SFDA SFCT) and Mizan recipes
// with values for one serving, minus foods with the person's allergens. Used by
// Eat well (Meal ideas tab) and by Home (one idea for the next meal).
import 'server-only';
import { FOODS, nutrientsFor } from '@/domain/food-db.js';
import { MEAL_SHARE, SOURCES } from '@/domain/rules.js';
import { ALLERGENS } from '@/domain/constants.js';
import { DISHES } from '@/data/dishes.js';
import type { Idea, IdeaSource } from '@/app/meal-ideas/ideas-view';
import type { MealId } from './meal-time';

const DISH_PERIOD: Record<string, string> = Object.fromEntries(DISHES.map((d: { id: string; category?: string }) => [d.id, d.category ?? '']));
/** The recipe's own meal picture (lib/art.js); Saudi dishes have none and show a spot illustration. */
const DISH_ART: Record<string, unknown> = Object.fromEntries(DISHES.map((d: { id: string; art?: unknown }) => [d.id, d.art ?? null]));
const PERIOD_IDS = ['breakfast', 'lunch', 'dinner', 'snack'];
export const allergenLabel = (id: string) => ALLERGENS.find((a: { id: string }) => a.id === id)?.label ?? id;
const MAX_IDEAS = 200;

type Food = (typeof FOODS)[number] & Record<string, unknown>;

/** Saudi dishes (SFDA SFCT) and Mizan recipes, with values per serving, minus foods with the person's allergens. Pure. */
export function buildIdeas(allergies: string[]): { ideas: Idea[]; hidden: number } {
  const avoid = new Set(allergies);
  let hidden = 0;
  const ideas: Idea[] = [];
  for (const raw of FOODS) {
    const f = raw as Food;
    if (f.kind !== 'saudi-dish' && f.kind !== 'recipe') continue;
    const contains = (f.allergens as string[] | undefined) ?? [];
    const may = (f.mayContain as string[] | undefined) ?? [];
    if ([...contains, ...may].some((a) => avoid.has(a))) { hidden++; continue; }
    const s = (f.servings as { label: string; g: number | null; display: string; basis?: string; note?: string | null }[])[0];
    if (!s) continue;
    let n: Record<string, number | null>;
    try { n = nutrientsFor(f, { servingIndex: 0, quantity: 1 }); } catch { continue; }
    if (n.kcal == null) continue;
    const period = f.kind === 'recipe' ? DISH_PERIOD[String(f.dishId)] : '';
    ideas.push({
      id: String(f.id), kind: f.kind as Idea['kind'], name: String(f.name), nameAr: (f.nameAr as string | undefined) ?? null,
      origin: f.kind === 'saudi-dish' ? String(f.region ?? '') : String(f.cuisine ?? ''),
      period: PERIOD_IDS.includes(period) ? period : null,
      serving: s.display, servingNote: s.basis ?? s.note ?? null, grams: s.g ?? null,
      kcal: n.kcal, carbs: n.carbs ?? null, protein: n.protein ?? null, fat: n.fat ?? null, sodium: n.sodium ?? null,
      contains: contains.map(allergenLabel), mayContain: may.map(allergenLabel),
      allergensDerived: Boolean(f.allergensDerived), labelCheck: Boolean(f.labelCheck),
      art: f.kind === 'recipe' ? (DISH_ART[String(f.dishId)] ?? null) : null, artId: f.kind === 'recipe' ? String(f.dishId) : null,
    });
    if (ideas.length >= MAX_IDEAS) break;
  }
  return { ideas, hidden };
}

const pickSource = (id: string): IdeaSource => {
  const s = (SOURCES as Record<string, { title: string; publisher: string; url: string | null; summary: string }>)[id];
  return { id, title: s.title, publisher: s.publisher, url: s.url, summary: s.summary };
};
/** The sources shown under the meal ideas. */
export const ideaSources = () => ['SFDA-SFCT', 'USDA-FDC', 'MOH-SALT', 'CAREBITE-ALLOC'].map(pickSource);
export const MEAL_SHARES: Record<string, number> = MEAL_SHARE;

/**
 * One idea for a meal: ideas made for that meal (or Saudi dishes, which the SFCT
 * does not tie to a meal) that fit the meal's share of the daily target, closest
 * fit first; `seed` (e.g. the day number) rotates through the best five.
 */
export function ideaForMeal(ideas: Idea[], meal: MealId, targetKcal: number | null, seed: number): (Idea & { mealKcal: number | null }) | null {
  const mealKcal = targetKcal ? Math.round(targetKcal * (MEAL_SHARE[meal] ?? 0)) : null;
  const own = ideas.filter((i) => i.period === meal);
  const pool = (own.length >= 3 ? own : [...own, ...ideas.filter((i) => i.period == null)]);
  const fits = mealKcal ? pool.filter((i) => i.kcal <= mealKcal).sort((a, b) => (mealKcal - a.kcal) - (mealKcal - b.kcal)) : [...pool].sort((a, b) => a.kcal - b.kcal);
  const best = fits.slice(0, 5);
  if (!best.length) return null;
  return { ...best[Math.abs(seed) % best.length], mealKcal };
}
