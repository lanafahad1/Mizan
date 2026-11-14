// Shapes returned by the diary and food API (domain/health-service.js,
// domain/food-db.js) plus small helpers shared by the diary components.
import { ALLERGENS } from '@/domain/constants.js';
import { apiPath } from '@/lib/url';
import type { Lang, T } from '@/lib/i18n';
import { HEALTH_PATTERNS, MEAL_IN, SERVING_WORDS } from '@/lib/i18n/ar/health';

export type NutrientKey = 'kcal' | 'carbs' | 'protein' | 'fat' | 'sugar' | 'satFat' | 'fiber' | 'sodium';
export type Nutrients = Partial<Record<NutrientKey, number | null>>;
export type MealId = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export type DiaryEntry = {
  id: string; name: string; nameAr?: string | null; brand?: string | null; amountLabel: string;
  nutrients: Nutrients; basis: string | null; sourceId?: string | null; foodId?: string;
  hospital?: boolean; readOnly?: boolean;
  meal?: MealId;
  /** Who logged it: 'self' (the person) or 'staff' (the care team), and their name. */
  source?: 'self' | 'staff'; by?: string; byRole?: string;
  /** How the amount was entered (foods only; quick-add entries have none). */
  amount?: EntryAmount | null;
};
export type EntryAmount = { servingIndex: number; quantity: number; grams?: undefined } | { grams: number; servingIndex?: undefined; quantity?: undefined };
export type DiaryMeal = { id: MealId; label: string; entries: DiaryEntry[]; totals: Nutrients; missing: Partial<Record<NutrientKey, number>> };
export type RecentFood = { foodId: string; name: string; brand?: string | null; amountLabel: string; kcal: number | null; art?: unknown };
export type Diary = {
  date: string; today: string; owner: 'member' | 'patient'; meals: DiaryMeal[]; totals: Nutrients;
  missing: Partial<Record<NutrientKey, number>>; estimated: boolean;
  nutrients: { key: NutrientKey; label: string; unit: string; decimals: number }[];
  targets: Nutrients | null; targetsBasis: 'personal' | 'care-team' | null; recent: RecentFood[];
  /** Food ids the person starred (newest first). */
  favorites?: string[];
  /** That day's water (cups), steps and active minutes, or null when not recorded. */
  daily?: { water: number | null; steps: number | null; activity: number | null };
};

export type Serving = { label: string; labelAr?: string; g: number | null; display: string; approx?: boolean };
export type Food = {
  id: string; kind: string; name: string; nameAr?: string; brand?: string;
  per100g?: Nutrients | null; perPortion?: Nutrients; servings: Serving[];
  basis: string; sourceId: string | null; allergens?: string[]; allergensDerived?: boolean;
  checkLabel?: boolean; barcode?: string; approxG?: number | null; matchFoodId?: string | null; note?: string | null;
  /** MOH group (moh-portion) or ingredient group (ingredient). */
  group?: string; region?: string; createdAt?: string;
  /** Picture recipe for lists (lib/art.js foodArt); packaged and own foods may have none. */
  art?: unknown;
};

/** A product found on Open Food Facts, in pack-label shape (app/api/foods/online). */
export type OnlineProduct = {
  name: string; nameAr: string | null; brand: string | null; barcode: string; quantity: string | null;
  servingLabel: string | null; servingG: number | null; per100g: Nutrients; sodiumFromSalt: boolean; allergens: string[];
};

/** Pre-filled values for the pack-label form. */
export type LabelDraft = { name?: string; brand?: string; barcode?: string; servingG?: number | null; per100g?: Nutrients; fromOnline?: boolean };

export const MEAL_LABELS: Record<MealId, string> = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snacks' };
export const MEAL_IDS: MealId[] = ['breakfast', 'lunch', 'dinner', 'snack'];
export const isMealId = (v: unknown): v is MealId => typeof v === 'string' && (MEAL_IDS as string[]).includes(v);
/** The meal that fits the time of day (used when "add" has no meal). */
export function mealForNow(d = new Date()): MealId {
  const h = d.getHours();
  return h < 11 ? 'breakfast' : h < 16 ? 'lunch' : h < 21 ? 'dinner' : 'snack';
}

export const UNITS: Record<NutrientKey, string> = { kcal: 'kcal', carbs: 'g', protein: 'g', fat: 'g', sugar: 'g', satFat: 'g', fiber: 'g', sodium: 'mg' };
export const LABELS: Record<NutrientKey, string> = { kcal: 'Calories', carbs: 'Carbs', protein: 'Protein', fat: 'Fat', sugar: 'Sugar', satFat: 'Saturated fat', fiber: 'Fibre', sodium: 'Sodium' };
const DECIMALS: Record<NutrientKey, number> = { kcal: 0, carbs: 1, protein: 1, fat: 1, sugar: 1, satFat: 1, fiber: 1, sodium: 0 };

/** Format a nutrient value ("—" when not reported). */
export function fmt(v: number | null | undefined, key: NutrientKey = 'kcal') {
  if (v == null || !Number.isFinite(v)) return '—';
  const d = DECIMALS[key];
  return (Math.round(v * 10 ** d) / 10 ** d).toLocaleString('en-US', { maximumFractionDigits: d });
}
export const withUnit = (v: number | null | undefined, key: NutrientKey, t: T = (x) => x) => (v == null ? t('not reported') : `${fmt(v, key)} ${t(UNITS[key])}`);

/** A meal's name inside a sentence: the English label as given, or the Arabic name with its article ("الفطور"). */
export const mealIn = (id: string, english: string, lang: Lang) => (lang === 'ar' ? MEAL_IN[id] ?? english : english);

/** Nutrients for an amount of a food (same rules as food-db nutrientsFor). Returns null when it cannot be worked out. */
export function previewNutrients(food: Food, amount: { grams: number } | { servingIndex: number; quantity: number }): Nutrients | null {
  if ('grams' in amount) {
    if (!food.per100g || !(amount.grams > 0)) return null;
    return scale(food.per100g, amount.grams / 100);
  }
  const s = food.servings[amount.servingIndex];
  if (!s || !(amount.quantity > 0)) return null;
  if (!food.per100g) return food.perPortion ? scale(food.perPortion, amount.quantity) : null;
  if (s.g == null) return null;
  return scale(food.per100g, (s.g * amount.quantity) / 100);
}
function scale(values: Nutrients, factor: number): Nutrients {
  const out: Nutrients = {};
  for (const [k, v] of Object.entries(values)) out[k as NutrientKey] = v == null ? null : v * factor;
  return out;
}

/** Calories in the first serving, for search results. */
export const firstServingKcal = (food: Food) => (food.servings.length ? previewNutrients(food, { servingIndex: 0, quantity: 1 })?.kcal ?? null : null);

/** Human label for where a value comes from. */
export function sourceLabel(x: { basis?: string | null; sourceId?: string | null; hospital?: boolean }): { text: string; tone: 'mint' | 'sage' | 'warn' | 'rose' | 'neutral' } {
  // Hospital meals carry the meal's nutrition source id as `basis` ('SFDA-SFCT', 'USDA-FDC', 'mixed' or null).
  const { basis, sourceId } = x;
  if (basis === 'moh-exchange' || sourceId === 'MOH-GUIDE') return { text: 'MOH portion', tone: 'mint' };
  if (sourceId === 'SFDA-SFCT' || basis === 'SFDA-SFCT' || basis === 'sfct') return { text: 'SFDA lab values', tone: 'mint' };
  if (basis === 'mixed') return { text: 'SFDA lab values and calculated (USDA)', tone: 'sage' };
  if (basis === 'calculated' || basis === 'ingredients' || basis === 'USDA-FDC') return { text: 'Calculated (USDA)', tone: 'sage' };
  if (sourceId === 'USDA-FDC' || basis === 'lab') return { text: 'USDA lab values', tone: 'sage' };
  if (basis === 'community' || sourceId === 'OFF') return { text: 'Pack label (Open Food Facts) — check the label', tone: 'warn' };
  if (basis === 'label') return { text: 'Your entry (pack label)', tone: 'rose' };
  if (basis === 'self-entered') return { text: 'Your entry', tone: 'rose' };
  return { text: 'Source not recorded', tone: 'neutral' };
}

const ALLERGEN_LABEL = new Map((ALLERGENS as { id: string; label: string }[]).map((a) => [a.id, a.label]));
export const allergenNames = (codes: string[] = []) => codes.map((c) => ALLERGEN_LABEL.get(c) ?? c.replace(/[_-]/g, ' '));

/**
 * Translate a message or label from the server. Exact text first (the shared
 * dictionaries), then the health sentence patterns (messages built with numbers).
 */
export function tMsg(t: T, lang: Lang, s: string | null | undefined): string {
  if (!s) return s ?? '';
  const out = t(s);
  if (lang !== 'ar' || out !== s) return out;
  for (const [re, tpl] of HEALTH_PATTERNS) {
    const m = s.match(re);
    if (m) return tpl.replace(/\{t:\$(\d+)\}/g, (_, i) => t(m[Number(i)] ?? '')).replace(/\$(\d+)/g, (_, i) => m[Number(i)] ?? '');
  }
  return s;
}

const AMOUNT_RE = /^(\d+(?:\.\d+)?[¼½¾⅓⅔⅛]?|[¼½¾⅓⅔⅛])\s+(.+)$/;
/** A portion label ("1 cup", "100 g") in the page language; unknown labels stay as they are. */
function portionLabel(label: string, t: T): string {
  const exact = t(label);
  if (exact !== label) return exact;
  const m = AMOUNT_RE.exec(label);
  const word = m ? SERVING_WORDS[m[2]] ?? SERVING_WORDS[m[2].toLowerCase()] : undefined;
  return m && word ? `${m[1]} ${word}` : label;
}

/** A serving's display text ("1 medium (≈118 g)") in the page language. `labelAr` is MOH's Arabic portion when there is one. */
export function servingText(display: string, t: T, lang: Lang, labelAr?: string | null): string {
  if (lang !== 'ar' || !display) return display;
  const m = /^(.*?)(?: \(≈([\d.,]+) g\))?$/.exec(display);
  if (!m) return display;
  const label = labelAr || portionLabel(m[1], t);
  return m[2] ? `${label} (≈${m[2]} غ)` : label;
}

/** A diary entry's amount ("1 × 1 cup", "150 g", "All · regular portion") in the page language. */
export function amountText(label: string, t: T, lang: Lang): string {
  if (lang !== 'ar' || !label) return label;
  let m = /^(\d+(?:\.\d+)?) × (.+)$/.exec(label);
  if (m) return `${m[1]} × ${servingText(m[2], t, lang)}`;
  m = /^(.*) · (small|regular|large) portion$/.exec(label);
  if (m) return `${t(m[1])} · ${t(`${m[2]} portion`)}`;
  return servingText(label, t, lang);
}

/** The food's name in the page language (Arabic name when there is one). */
export const foodName = (f: { name: string; nameAr?: string | null }, lang: Lang) => (lang === 'ar' && f.nameAr ? f.nameAr : f.name);

export const diaryKey = (date: string) => apiPath('/api/health/me/diary', { date });
