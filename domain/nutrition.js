// Meal nutrition. Dish values come from one of two sources, and every value
// says which:
//   basis 'lab'        – SFDA Saudi Food Composition Tables (SFCT): laboratory-
//                        analysed values per 100 g of whole traditional dishes.
//                        A dish is linked to an SFCT entry only when the kitchen
//                        prepares it to that standard recipe. Lab values win.
//   basis 'calculated' – recipes the SFCT does not cover: calculated from the
//                        ingredient grams of the recipe × USDA FoodData Central
//                        (SR Legacy) values per 100 g of each ingredient
//                        (data/ingredient-nutrients.js). Not laboratory-analysed:
//                        cooking losses and water changes are not modelled.
// Missing values are never estimated or treated as zero: if an ingredient has
// no USDA value for a nutrient, the dish has no complete value for it, and
// rules that need it send the meal to admin review.
//
// A complete meal sums its components. A total is shown as complete only when
// every component reports that nutrient; otherwise the known part is shown as a
// partial total with the components it leaves out.

import { INGREDIENT_NUTRIENTS } from '../data/ingredient-nutrients.js';
import { INGREDIENT_LOOKUP } from '../data/ingredients.js';

/**
 * Consistency check of a published SFCT table: energy must agree with protein,
 * fat, available carbohydrate and fibre (4/9/4/2 kcal per g), kJ with kcal, and
 * total with available carbohydrate plus fibre. Values are never corrected;
 * an entry that fails is shown as published and cannot be linked to a dish.
 */
export function sfctConsistencyIssue(entry) {
  const p = entry?.per100g;
  if (!p || p.kcal == null || p.protein == null || p.fat == null || p.availableCarbs == null) return null;
  const issues = [];
  const calc = 4 * p.protein + 9 * p.fat + 4 * p.availableCarbs + 2 * (p.fiber ?? 0);
  if (Math.abs(calc - p.kcal) > Math.max(8, p.kcal * 0.06)) issues.push(`energy ${p.kcal} kcal vs about ${Math.round(calc)} kcal from its macronutrients`);
  if (p.energyKj != null && Math.abs(p.kcal * 4.184 - p.energyKj) > 15) issues.push(`${p.energyKj} kJ does not match ${p.kcal} kcal`);
  if (p.totalCarbs != null && Math.abs(p.availableCarbs + (p.fiber ?? 0) - p.totalCarbs) > 0.6) issues.push(`total carbohydrate ${p.totalCarbs} g vs available carbohydrate plus fibre ${Math.round((p.availableCarbs + (p.fiber ?? 0)) * 10) / 10} g`);
  return issues.length ? `The published table is internally inconsistent (per 100 g: ${issues.join('; ')}).` : null;
}

export const NUTRIENTS = [
  { key: 'kcal', label: 'Energy', unit: 'kcal', decimals: 0, sfct: 'kcal' },
  { key: 'protein', label: 'Protein', unit: 'g', decimals: 1, sfct: 'protein' },
  { key: 'carbs', label: 'Total carbohydrate', unit: 'g', decimals: 1, sfct: 'totalCarbs' },
  { key: 'availableCarbs', label: 'Available carbohydrate', unit: 'g', decimals: 1, sfct: 'availableCarbs' },
  { key: 'fiber', label: 'Dietary fibre', unit: 'g', decimals: 1, sfct: 'fiber' },
  { key: 'sugar', label: 'Total sugars', unit: 'g', decimals: 1, sfct: 'totalSugars' },
  { key: 'addedSugar', label: 'Added sugar', unit: 'g', decimals: 1, sfct: 'addedSugar' },
  { key: 'fat', label: 'Total fat', unit: 'g', decimals: 1, sfct: 'fat' },
  { key: 'satFat', label: 'Saturated fat', unit: 'g', decimals: 1, sfct: 'satFat' },
  { key: 'cholesterol', label: 'Cholesterol', unit: 'mg', decimals: 0, sfct: 'cholesterol' },
  { key: 'sodium', label: 'Sodium', unit: 'mg', decimals: 0, sfct: 'sodium' },
  { key: 'potassium', label: 'Potassium', unit: 'mg', decimals: 0, sfct: 'potassium' },
  { key: 'phosphorus', label: 'Phosphorus', unit: 'mg', decimals: 0, sfct: 'phosphorus' },
  { key: 'calcium', label: 'Calcium', unit: 'mg', decimals: 0, sfct: 'calcium' },
  { key: 'iron', label: 'Iron', unit: 'mg', decimals: 1, sfct: 'iron' },
];

const round = (v, d) => (v == null ? null : Math.round(v * 10 ** d) / 10 ** d);
const empty = (v = null) => Object.fromEntries(NUTRIENTS.map((n) => [n.key, v]));

/**
 * Value per 100 g of an ingredient for one CareBite nutrient, from its USDA
 * entry. availableCarbs = carbohydrate by difference − fibre (USDA's
 * carbohydrate includes fibre). addedSugar = the ingredient's total sugars when
 * the ingredient is flagged added_sugar (sugar, honey, syrups), otherwise 0.
 * Returns null when USDA does not report what is needed.
 */
export function ingredientValue(key, per100g, ingredient) {
  if (!per100g) return null;
  if (key === 'availableCarbs') return per100g.carbs == null || per100g.fiber == null ? null : Math.max(0, per100g.carbs - per100g.fiber);
  if (key === 'addedSugar') return (ingredient?.flags ?? []).includes('added_sugar') ? per100g.sugar ?? null : 0;
  return per100g[key] ?? null;
}

function sfctNutrition(dish, sfct) {
  const entry = sfct[dish.nutrition.sfctId];
  if (!entry) return { available: false, perPortion: empty(), complete: empty(false), partialPortion: empty(), missing: empty([]), source: null, basis: null, reason: `the linked SFCT entry “${dish.nutrition.sfctId}” was not found`, entry: null };
  const perPortion = {};
  const complete = {};
  const missing = {};
  for (const n of NUTRIENTS) {
    const v = entry.per100g?.[n.sfct];
    complete[n.key] = v != null;
    missing[n.key] = v == null ? ['not reported by the SFCT'] : [];
    perPortion[n.key] = v == null ? null : round((v * dish.portionG) / 100, n.decimals);
  }
  return {
    available: true, basis: 'lab', perPortion, complete, partialPortion: empty(), missing, reason: null,
    source: { id: 'SFDA-SFCT', basis: 'lab', sfctId: dish.nutrition.sfctId, dish: entry.name, nameAr: entry.nameAr ?? null, region: entry.region, page: entry.tablePage, grams: dish.portionG },
    entry,
  };
}

function calculatedNutrition(dish, ingredientNutrients, ingredients) {
  // Optional lines (garnishes, aromatics removed before serving) are left out of the calculation.
  const lines = (dish.ingredients ?? []).filter((l) => !l.optional && l.g > 0);
  if (!lines.length) return { available: false, perPortion: empty(), complete: empty(false), partialPortion: empty(), missing: empty([]), source: null, basis: null, reason: 'the recipe has no ingredient quantities', entry: null };
  const perPortion = {};
  const partialPortion = {};
  const complete = {};
  const missing = {};
  for (const n of NUTRIENTS) {
    let sum = 0;
    const lacking = [];
    for (const l of lines) {
      const v = ingredientValue(n.key, ingredientNutrients[l.ing]?.per100g, ingredients[l.ing]);
      if (v == null) lacking.push(ingredients[l.ing]?.name ?? l.ing);
      else sum += (v * l.g) / 100;
    }
    complete[n.key] = lacking.length === 0;
    missing[n.key] = [...new Set(lacking)];
    perPortion[n.key] = lacking.length ? null : round(sum, n.decimals);
    partialPortion[n.key] = lacking.length && lacking.length < lines.length ? round(sum, n.decimals) : null;
  }
  const known = lines.filter((l) => ingredientNutrients[l.ing]?.per100g);
  return {
    available: known.length > 0, basis: 'calculated', perPortion, complete, partialPortion, missing,
    reason: known.length ? null : 'none of the recipe’s ingredients has USDA values',
    source: {
      id: 'USDA-FDC', basis: 'calculated', grams: dish.portionG,
      method: 'Calculated from the recipe’s ingredient grams × USDA FoodData Central (SR Legacy) values per 100 g. Not laboratory-analysed.',
      ingredients: lines.map((l) => ({ ing: l.ing, g: l.g, fdcId: ingredientNutrients[l.ing]?.fdcId ?? null })),
      withoutValues: lines.filter((l) => !ingredientNutrients[l.ing]?.per100g).map((l) => ingredients[l.ing]?.name ?? l.ing),
    },
    entry: null,
  };
}

/**
 * Nutrition of one standard portion of a dish.
 * @param {object} dish  { name, portionG, ingredients, nutrition: { source: 'sfct'|'ingredients'|'none', sfctId } }
 * @param {object} sfct  the SFCT library ({ [id]: entry })
 * @param {object} ingredientNutrients  { [ingredientId]: { per100g } } (USDA values)
 * @param {object} ingredients  { [ingredientId]: ingredient } (for the added_sugar flag and names)
 * Returns { available, basis: 'lab'|'calculated'|null, perPortion, complete, partialPortion, missing, source, reason, entry }.
 */
export function dishNutrition(dish, sfct = {}, ingredientNutrients = INGREDIENT_NUTRIENTS, ingredients = INGREDIENT_LOOKUP) {
  const src = dish.nutrition?.source;
  if (src === 'sfct') return sfctNutrition(dish, sfct);
  if (src === 'ingredients') return calculatedNutrition(dish, ingredientNutrients, ingredients);
  return { available: false, perPortion: empty(), complete: empty(false), partialPortion: empty(), missing: empty([]), source: null, basis: null, reason: 'no SFDA Saudi Food Composition Table entry is linked and no ingredient calculation is set', entry: null };
}

/**
 * Nutrition of one standard serving of a meal (all components).
 * @param {Array<{name, grams, factor, nutrition}>} components  enriched components; `nutrition` is dishNutrition()
 */
export function mealNutrition(components) {
  const perServing = {};
  const partial = {};
  const complete = {};
  const missing = {};
  const why = (c, key) => {
    if (!c.nutrition.available) return `${c.name} (no SFCT values)`; // wording matched by engine.js
    if (c.nutrition.basis === 'lab') return `${c.name} (not reported by the SFCT)`;
    const ings = c.nutrition.missing?.[key] ?? [];
    return `${c.name} (no USDA value for ${ings.join(', ') || 'an ingredient'})`;
  };
  for (const n of NUTRIENTS) {
    const known = [];
    const lacking = [];
    for (const c of components) {
      const v = c.nutrition.perPortion[n.key];
      if (v == null) {
        lacking.push(why(c, n.key));
        const part = c.nutrition.partialPortion?.[n.key];
        if (part != null) known.push(part * c.factor);
      } else known.push(v * c.factor);
    }
    const sum = known.length ? round(known.reduce((s, v) => s + v, 0), n.decimals) : null;
    complete[n.key] = lacking.length === 0;
    missing[n.key] = lacking;
    perServing[n.key] = lacking.length ? null : sum;
    partial[n.key] = lacking.length && known.length ? sum : null;
  }
  const withData = components.filter((c) => c.nutrition.available);
  const available = withData.length > 0;
  const allComplete = Object.values(complete).every(Boolean);
  const sources = withData.map((c) => ({ component: c.name, ...c.nutrition.source, grams: c.grams }));
  const bases = [...new Set(withData.map((c) => c.nutrition.basis))];
  const basis = !available ? null : bases.length === 1 ? bases[0] : 'mixed';
  const sourceIds = [...new Set(withData.map((c) => c.nutrition.source?.id).filter(Boolean))];
  const describe = (list) => list.map((c) => c.name).join(', ');
  const lab = withData.filter((c) => c.nutrition.basis === 'lab');
  const calc = withData.filter((c) => c.nutrition.basis === 'calculated');
  const parts = [];
  if (lab.length) parts.push(`laboratory-analysed values from the SFDA Saudi Food Composition Tables${components.length > 1 ? ` for ${describe(lab)}` : ''}`);
  if (calc.length) parts.push(`values calculated from recipe ingredients with USDA FoodData Central data${components.length > 1 ? ` for ${describe(calc)}` : ''} (not laboratory-analysed)`);
  let method;
  if (!available) method = 'No nutrient values are available for this meal’s dishes. Values are never estimated.';
  else {
    method = `${parts.join('; ')}.`;
    method = method[0].toUpperCase() + method.slice(1);
    if (withData.length < components.length) method += ` ${describe(components.filter((c) => !c.nutrition.available))} ${components.length - withData.length === 1 ? 'has' : 'have'} no nutrient values, so totals that need ${components.length - withData.length === 1 ? 'it' : 'them'} are not shown.`;
    else if (components.length > 1) method += ' Values are added across the components.';
  }
  return {
    perServing, partial, complete, missing, available, allComplete,
    allAvailable: available && withData.length === components.length,
    source: !available ? null : sourceIds.length === 1 ? sourceIds[0] : 'mixed', sourceIds, basis, sources, method,
    byComponent: components.map((c) => ({ name: c.name, dishId: c.dishId, kind: c.kind, grams: c.grams, available: c.nutrition.available, basis: c.nutrition.basis ?? null, values: scaleNutrition(c.nutrition.perPortion, c.factor), source: c.nutrition.source })),
  };
}

/** Scale per-serving nutrition by a portion factor (null stays null). */
export function scaleNutrition(perServing, factor) {
  const out = {};
  for (const n of NUTRIENTS) out[n.key] = perServing?.[n.key] == null ? null : round(perServing[n.key] * factor, n.decimals);
  return out;
}

/** Share of a serving's energy that comes from a nutrient (kcal per g: fat 9, carbohydrate and sugar 4). */
export function energyShare(perServing, key) {
  const kcalPerGram = key === 'satFat' || key === 'fat' ? 9 : 4;
  if (perServing[key] == null || !perServing.kcal) return null;
  return (perServing[key] * kcalPerGram) / perServing.kcal;
}
