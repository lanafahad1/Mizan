// CareBite food database: one searchable list of everything a person can log,
// MyFitnessPal-style. Pure and synchronous; persistence of custom foods is the
// caller's job.
//
// Sources, in order of preference (Saudi government first). Every food says
// which one its values come from (sourceId) and what kind of value it is (basis):
//   kind 'moh-portion'  MOH-GUIDE  basis 'moh-exchange'  Saudi MOH Calorie Guide
//                       exchange portions (data/moh-calorie-guide.js). Values are
//                       MOH's average per stated portion, never per 100 g, and are
//                       never rescaled by grams.
//   kind 'saudi-dish'   SFDA-SFCT  basis 'lab'           SFDA Saudi Food Composition
//                       Tables, laboratory values per 100 g (data/sfct-dishes.js).
//   kind 'ingredient'   USDA-FDC   basis 'lab'           USDA SR Legacy values per
//                       100 g of single ingredients (data/ingredient-nutrients.js).
//   kind 'recipe'       USDA-FDC   basis 'calculated'    CareBite recipes the SFCT does
//                       not cover, calculated from ingredient grams × USDA values.
//   kind 'packaged'     OFF        basis 'community'     Open Food Facts label data for
//                       products sold in Saudi Arabia (data/packaged-foods.js, ODbL).
//   custom foods        —          basis 'label'         typed in from a product label.
// null always means "not reported"; nothing is estimated.

import { INGREDIENTS, INGREDIENT_LOOKUP } from '../data/ingredients.js';
import { INGREDIENT_NUTRIENTS } from '../data/ingredient-nutrients.js';
import { SFCT_LIBRARY } from '../data/sfct-dishes.js';
import { DISHES } from '../data/dishes.js';
import { PACKAGED_FOODS } from '../data/packaged-foods.js';
import { EXCHANGE_FOODS, exchangeNutrients } from '../data/moh-calorie-guide.js';
import { NUTRIENTS, ingredientValue } from './nutrition.js';

export const FOOD_KINDS = ['moh-portion', 'saudi-dish', 'ingredient', 'recipe', 'packaged', 'custom'];
/** Tie-break order in search: MOH > SFCT > USDA ingredient > USDA-calculated recipe > Open Food Facts > custom. */
const KIND_RANK = Object.fromEntries(FOOD_KINDS.map((k, i) => [k, i]));
const NUTRIENT_KEYS = NUTRIENTS.map((n) => n.key);
const DECIMALS = Object.fromEntries(NUTRIENTS.map((n) => [n.key, n.decimals]));
const round = (v, d) => (v == null ? null : Math.round(v * 10 ** d) / 10 ** d);
const fmtG = (g) => (g >= 10 ? String(Math.round(g)) : String(round(g, 1)));

/** A serving option; `display` shows its gram weight, e.g. "1 medium (≈118 g)". */
function serving(label, g, extra = {}) {
  const grams = g == null ? null : round(g, 1);
  const states = grams != null && new RegExp(`\\b${fmtG(grams).replace('.', '\\.')}\\s*(g|ml)\\b`, 'i').test(label);
  const display = grams == null ? label : label === `${fmtG(grams)} g` || states ? label : `${label} (≈${fmtG(grams)} g)`;
  return { label, g: grams, display, ...extra };
}
const HUNDRED = () => serving('100 g', 100);

// ---------------------------------------------------------------------------
// Allergens of SFCT dishes, derived from the recipe's ingredient text.
// Keyword matches only: the UI must say "derived from the SFCT recipe — check".
const NOT_GLUTEN_FLOUR = /\b(sorghum|millet|samh|corn|rice|chickpea|maize)\s+flour\b/;
const SFCT_ALLERGEN_KEYWORDS = [
  ['gluten', /\b(wheat|flour|bread|burghul|bulgur|freekeh|semolina|vermicelli|noodles?|pasta|couscous|barley|rye|oats?|kunafah|jareesh|qursan|saj|malla|jamri|shurak|biscuits?)\b/],
  ['milk', /\b(milk|laban|yogh?urt|ghee|butter|cheese|cream|iqt|baqal|baql|marees|mrees|jameed|samn)\b/],
  ['egg', /\beggs?\b/],
  ['fish', /\b(fish|tuna|sardines?|anchov\w*|salmon|mackerel|kingfish|hamour|hammour|grouper|najel|shaour)\b/],
  ['shellfish', /\b(shrimps?|prawns?|crabs?|lobsters?)\b/],
  ['sesame', /\b(sesame|tahini|tahina)\b/],
  ['tree_nut', /\b(almonds?|pistachios?|walnuts?|cashews?|hazelnuts?|pine nuts?|pecans?)\b/],
  ['peanut', /\bpeanuts?\b/],
  ['soy', /\bsoy\w*\b/],
  ['mustard', /\bmustard\b/],
];
export function sfctAllergens(ingredients) {
  const found = new Set();
  for (const { name } of ingredients ?? []) {
    const text = String(name).toLowerCase().replace(/peanut butter/g, 'peanut');
    for (const [code, re] of SFCT_ALLERGEN_KEYWORDS) {
      if (!re.test(text)) continue;
      // "sorghum flour", "millet flour" alone are not gluten sources.
      if (code === 'gluten' && NOT_GLUTEN_FLOUR.test(text) && !/\b(wheat|bread|semolina|barley|rye)\b/.test(text)) continue;
      found.add(code);
    }
  }
  return [...found];
}

// ---------------------------------------------------------------------------
// Builders

function ingredientFood(ing) {
  const usda = INGREDIENT_NUTRIENTS[ing.id];
  if (!usda?.per100g) return null;
  const per100g = Object.fromEntries(NUTRIENT_KEYS.map((k) => [k, ingredientValue(k, usda.per100g, ing)]));
  const servings = [HUNDRED(), ...usda.portions.map((p) => serving(p.label.replace(/^1 NLEA serving$/i, '1 serving (NLEA)'), p.g, { sourceId: 'USDA-FDC' }))];
  return {
    id: `ing:${ing.id}`, kind: 'ingredient', name: ing.name, ingredientId: ing.id, group: ing.group,
    per100g, servings, basis: 'lab', sourceId: 'USDA-FDC',
    source: { fdcId: usda.fdcId, usdaName: usda.usdaName, note: usda.note ?? null },
    allergens: ing.allergens ?? [], mayContain: ing.mayContain ?? [], labelCheck: Boolean(ing.labelCheck),
  };
}

/** Cooked weight of a whole SFCT recipe: full recipe ÷ per 100 g, from the first analyte both report. */
export function sfctRecipeGrams(entry) {
  if (entry.recipeGrams) return entry.recipeGrams;
  for (const k of ['energyKj', 'kcal', 'moisture', 'protein', 'fat', 'totalCarbs', 'ash']) {
    const a = entry.fullRecipe?.[k]; const b = entry.per100g?.[k];
    if (a != null && b) return Math.round((a / b) * 100);
  }
  return null;
}
const adultsIn = (yieldText) => Number(/(\d+)\s*adults?/i.exec(yieldText ?? '')?.[1]) || null;

function sfctFood(id, entry, hospitalDishes) {
  const per100g = Object.fromEntries(NUTRIENTS.map((n) => [n.key, entry.per100g?.[n.sfct] ?? null]));
  const recipeG = sfctRecipeGrams(entry);
  const adults = adultsIn(entry.yield);
  const servings = [];
  if (recipeG && adults) servings.push(serving('1 serving', recipeG / adults, { basis: `SFCT recipe ${recipeG} g ÷ ${adults} adults` }));
  for (const d of hospitalDishes) servings.push(serving(`1 hospital portion`, d.portionG, { dishId: d.id }));
  servings.push(HUNDRED());
  return {
    id: `sfct:${id}`, kind: 'saudi-dish', name: entry.name, nameAr: entry.nameAr ?? undefined, region: entry.region,
    per100g, servings, basis: 'lab', sourceId: 'SFDA-SFCT',
    source: { sfctId: id, tablePage: entry.tablePage, recipePage: entry.recipePage, yield: entry.yield, recipeGrams: recipeG },
    allergens: sfctAllergens(entry.ingredients), allergensDerived: true, mayContain: [],
  };
}

function recipeFood(dish) {
  if (dish.nutrition?.source !== 'ingredients' || !dish.portionG) return null;
  const lines = (dish.ingredients ?? []).filter((l) => !l.optional && l.g > 0);
  const per100g = {};
  for (const k of NUTRIENT_KEYS) {
    let sum = 0; let ok = lines.length > 0;
    for (const l of lines) {
      const v = ingredientValue(k, INGREDIENT_NUTRIENTS[l.ing]?.per100g, INGREDIENT_LOOKUP[l.ing]);
      if (v == null) { ok = false; break; }
      sum += (v * l.g) / 100;
    }
    per100g[k] = ok ? round((sum / dish.portionG) * 100, 3) : null;
  }
  if (per100g.kcal == null) return null; // an ingredient without USDA values: not loggable by calculation
  const contains = new Set(); const may = new Set(); let labelCheck = false;
  for (const l of dish.ingredients ?? []) {
    const ing = INGREDIENT_LOOKUP[l.ing];
    (ing?.allergens ?? []).forEach((a) => contains.add(a));
    (ing?.mayContain ?? []).forEach((a) => may.add(a));
    if (ing?.labelCheck) labelCheck = true;
  }
  for (const a of contains) may.delete(a);
  return {
    id: `recipe:${dish.id}`, kind: 'recipe', name: dish.name, nameAr: dish.nameAr ?? undefined, dishId: dish.id, cuisine: dish.cuisine,
    per100g, servings: [serving('1 portion', dish.portionG, { note: dish.servingSize ?? null }), HUNDRED()],
    basis: 'calculated', sourceId: 'USDA-FDC',
    source: { method: 'Ingredient grams × USDA FoodData Central (SR Legacy) values per 100 g. Not laboratory-analysed.' },
    allergens: [...contains], mayContain: [...may], labelCheck,
  };
}

function packagedFood(p) {
  const per100g = Object.fromEntries(NUTRIENT_KEYS.map((k) => [k, p.per100g[k] ?? null]));
  const servings = [...(p.serving?.g ? [serving(p.serving.label, p.serving.g)] : []), HUNDRED()];
  return {
    id: p.id, kind: 'packaged', name: p.name, nameAr: p.nameAr ?? undefined, brand: p.brand ?? undefined, barcode: p.barcode,
    quantity: p.quantity, category: p.category ?? null, per100g, servings, basis: 'community', sourceId: 'OFF',
    sodiumFromSalt: Boolean(p.sodiumFromSalt), allergens: p.allergens ?? [], mayContain: p.mayContain ?? [], checkLabel: true,
  };
}

// MOH portions → matching USDA ingredient. `portion` is the USDA household
// measure (as stored in data/ingredient-nutrients.js) and `factor` converts it
// to the MOH portion; this gives an approximate gram weight only. MOH values
// are never rescaled by it.
const MOH_MATCH = {
  'milk-low-fat': { ing: 'milk', portion: '1 cup', factor: 1 },
  'laban-low-fat': { ing: 'laban', portion: '1 cup', factor: 1 },
  'yogurt-low-fat': { ing: 'yogurt', portion: '1 cup (8 fl oz)', factor: 1 },
  'rice-cooked': { ing: 'white-rice', portion: '1 cup', factor: 1 / 3 },
  'oats-dry': { ing: 'rolled-oats', portion: '1 cup', factor: 1 / 4 },
  potato: { ing: 'potato', portion: '1 Potato small (1-3/4" to 2-1/2" dia)', factor: 1 },
  corn: { ing: 'corn', portion: '1 cup', factor: 1 / 2 },
  'popcorn-plain': { ing: 'popcorn', portion: '1 cup', factor: 3 },
  'tuna-water': { ing: 'tuna', portion: '1 cup, solid or chunks', factor: 1 / 4 },
  egg: { ing: 'egg', portion: '1 large', factor: 1 },
  'peanut-butter': { ing: 'peanut-butter', portion: '2 tbsp', factor: 1 / 2 },
  banana: { ing: 'banana', portion: '1 medium (7" to 7-7/8" long)', factor: 1 / 2 },
  dates: { ing: 'dates', portion: '1 date, pitted', factor: 3 },
  strawberries: { ing: 'strawberries', portion: '1 cup, whole', factor: 1.25 },
  mango: { ing: 'mango', portion: '1 fruit without refuse', factor: 1 / 2 },
  pomegranate: { ing: 'pomegranate', portion: '0.5 cup arils (seed/juice sacs)', factor: 1 },
  'vegetable-oil': { ing: 'olive-oil', portion: '1 tsp', factor: 1 },
  olives: { ing: 'olives', portion: '1 large', factor: 5 },
  avocado: { ing: 'avocado', portion: '1 avocado, NS as to Florida or California', factor: 1 / 8 },
};
export const MOH_PORTION_MATCHES = MOH_MATCH;

function mohFood(f) {
  const v = exchangeNutrients(f);
  const m = MOH_MATCH[f.id];
  const usdaPortion = m ? INGREDIENT_NUTRIENTS[m.ing]?.portions.find((p) => p.label === m.portion) : null;
  const approxG = f.grams == null && usdaPortion ? round(usdaPortion.g * m.factor, 1) : null;
  const g = f.grams ?? approxG;
  const display = f.grams != null ? f.portion : approxG != null ? `${f.portion} (≈${fmtG(approxG)} g)` : f.portion;
  return {
    id: `moh:${f.id}`, kind: 'moh-portion', name: f.name, nameAr: f.nameAr, group: f.group,
    per100g: null, perPortion: { kcal: v.kcal, carbs: v.carbs, protein: v.protein, fat: v.fat },
    servings: [{ label: f.portion, labelAr: f.portionAr, g, display, ...(approxG != null ? { approx: true, approxSource: 'USDA-FDC' } : {}) }],
    grams: f.grams ?? null, approxG, approxSource: approxG != null ? 'USDA-FDC' : null,
    matchFoodId: m ? `ing:${m.ing}` : null,
    basis: 'moh-exchange', sourceId: 'MOH-GUIDE', note: f.note ?? null, allergens: [], mayContain: [],
  };
}

// ---------------------------------------------------------------------------
// The database

const hospitalBySfct = {};
for (const d of DISHES) if (d.nutrition?.source === 'sfct') (hospitalBySfct[d.nutrition.sfctId] ??= []).push(d);

export const FOODS = [
  ...EXCHANGE_FOODS.map(mohFood),
  ...Object.entries(SFCT_LIBRARY).map(([id, e]) => sfctFood(id, e, hospitalBySfct[id] ?? [])),
  ...INGREDIENTS.map(ingredientFood).filter(Boolean),
  ...DISHES.map(recipeFood).filter(Boolean),
  ...PACKAGED_FOODS.map(packagedFood),
];
const BY_ID = new Map(FOODS.map((f) => [f.id, f]));
const BY_BARCODE = new Map(FOODS.filter((f) => f.barcode).map((f) => [f.barcode, f]));

/** Foods that cannot be logged by calculation (no USDA value for an ingredient). */
export const FOODS_WITHOUT_VALUES = {
  ingredients: INGREDIENTS.filter((i) => !INGREDIENT_NUTRIENTS[i.id]?.per100g).map((i) => i.id),
  recipes: DISHES.filter((d) => d.nutrition?.source === 'ingredients' && !BY_ID.has(`recipe:${d.id}`)).map((d) => d.id),
};

export const getFood = (id) => BY_ID.get(id) ?? null;
export function findByBarcode(code) {
  const c = String(code ?? '').replace(/\D/g, '');
  if (!c) return null;
  return BY_BARCODE.get(c) ?? BY_BARCODE.get(c.replace(/^0+/, '')) ?? BY_BARCODE.get(c.padStart(13, '0')) ?? null;
}

// ---------------------------------------------------------------------------
// Search

/** Lower-case, strip Latin accents and Arabic diacritics, unify Arabic letter forms. */
export function normalizeText(s) {
  return String(s ?? '').normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/[ً-ٰٟـ]/g, '') // tashkeel, superscript alef, tatweel
    .replace(/[أإآٱ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي')
    .replace(/[’'`ʼ]/g, '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}
const words = (s) => s.split(' ').filter(Boolean);
const index = new Map(FOODS.map((f) => [f.id, { name: normalizeText(f.name), nameAr: normalizeText(f.nameAr), brand: normalizeText(f.brand) }]));

function fieldScore(text, q, qWords) {
  if (!text) return 0;
  if (text.startsWith(q)) return 3;
  const ws = words(text);
  if (qWords.every((qw) => ws.some((w) => w.startsWith(qw)))) return 2;
  if (text.includes(q) || qWords.every((qw) => text.includes(qw))) return 1;
  return 0;
}

/**
 * Search foods by English or Arabic name, or brand. Ranking: name prefix >
 * word match > substring; brand matches rank just below the same name match;
 * ties go to MOH, then SFCT dishes, USDA ingredients, recipes and packaged foods.
 */
export function searchFoods(query, { kinds, limit = 20, foods } = {}) {
  const q = normalizeText(query);
  if (!q) return [];
  const qWords = words(q);
  const pool = foods ? foods : FOODS;
  const hits = [];
  for (const f of pool) {
    if (kinds && !kinds.includes(f.kind)) continue;
    const ix = index.get(f.id) ?? { name: normalizeText(f.name), nameAr: normalizeText(f.nameAr), brand: normalizeText(f.brand) };
    const score = Math.max(fieldScore(ix.name, q, qWords), fieldScore(ix.nameAr, q, qWords), fieldScore(ix.brand, q, qWords) - 0.5,
      // brand + product words together ("almarai laban")
      qWords.length > 1 ? fieldScore(`${ix.brand} ${ix.name}`, q, qWords) - 0.5 : 0);
    if (score > 0) hits.push({ f, score, len: ix.name.length });
  }
  hits.sort((a, b) => b.score - a.score || KIND_RANK[a.f.kind] - KIND_RANK[b.f.kind] || a.len - b.len || a.f.name.localeCompare(b.f.name));
  return hits.slice(0, limit).map((h) => h.f);
}

// ---------------------------------------------------------------------------
// Servings and nutrient values

/** Serving options of a food, each with its gram weight (g: null only for MOH portions without a stated or matched weight). */
export function servingsFor(food) {
  return (food?.servings ?? []).map((s) => ({ ...s }));
}

/** True when the food has a per-100 g basis and can be logged by weight. */
export const canLogByGrams = (food) => Boolean(food?.per100g);

const roundValues = (values) => Object.fromEntries(Object.entries(values).map(([k, v]) => [k, round(v, DECIMALS[k] ?? 1)]));

/**
 * Nutrient values for an amount of a food, rounded (kcal whole numbers, grams 1
 * decimal, mg whole numbers except iron at 1 decimal); null stays null.
 * @param amount  grams (number), { grams }, or { servingIndex, quantity = 1 }
 * MOH portions have values per portion only: they accept { servingIndex,
 * quantity } and throw a RangeError (code 'PORTION_ONLY', matchFoodId) for grams.
 */
export function nutrientsFor(food, amount) {
  if (!food) throw new TypeError('food is required');
  const a = typeof amount === 'number' ? { grams: amount } : amount ?? {};
  if (a.grams == null) {
    const s = food.servings?.[a.servingIndex ?? 0];
    if (!s) throw new RangeError(`no serving ${a.servingIndex} for ${food.id}`);
    const qty = a.quantity ?? 1;
    if (!(Number.isFinite(qty) && qty > 0)) throw new RangeError('quantity must be a positive number');
    if (!food.per100g) {
      return roundValues(Object.fromEntries(Object.entries(food.perPortion).map(([k, v]) => [k, v == null ? null : v * qty])));
    }
    if (s.g == null) throw new RangeError(`serving “${s.label}” has no gram weight`);
    return nutrientsFor(food, { grams: s.g * qty });
  }
  const g = Number(a.grams);
  if (!(Number.isFinite(g) && g >= 0)) throw new RangeError('grams must be a non-negative number');
  if (!food.per100g) {
    const err = new RangeError(`${food.name}: MOH gives values per portion only. ${food.matchFoodId ? `Log grams with ${getFood(food.matchFoodId)?.name ?? food.matchFoodId} instead.` : 'Log it by portion.'}`);
    err.code = 'PORTION_ONLY';
    err.matchFoodId = food.matchFoodId ?? null;
    throw err;
  }
  return roundValues(Object.fromEntries(Object.entries(food.per100g).map(([k, v]) => [k, v == null ? null : (v * g) / 100])));
}

// ---------------------------------------------------------------------------
// Custom foods from a nutrition label

const LABEL_KEYS = ['kcal', 'protein', 'carbs', 'fiber', 'sugar', 'addedSugar', 'fat', 'satFat', 'cholesterol', 'sodium', 'potassium', 'calcium', 'iron'];
const REQUIRED = ['kcal', 'protein', 'carbs', 'fat'];
const GRAM_KEYS = new Set(['protein', 'carbs', 'fiber', 'sugar', 'addedSugar', 'fat', 'satFat']);
const MG_LIMIT_PER_100G = { sodium: 40000, cholesterol: 3000, potassium: 10000, calcium: 5000, iron: 500 };

/**
 * Validate a food typed from a label and build it (basis 'label').
 * Input: { name, nameAr?, brand?, barcode?, servingG?, servingLabel?, per100g? | perServing? }
 * Values per serving need servingG and are converted to per 100 g.
 * Returns { value: food | null, errors: { field: message }, warnings: [] }.
 */
export function customFoodFromLabel(input = {}) {
  const errors = {};
  const warnings = [];
  const name = typeof input.name === 'string' ? input.name.trim() : '';
  if (!name) errors.name = 'Enter the product name.';
  else if (name.length > 120) errors.name = 'The name is too long (120 characters at most).';
  const brand = typeof input.brand === 'string' && input.brand.trim() ? input.brand.trim().slice(0, 80) : undefined;
  const barcode = input.barcode == null || input.barcode === '' ? undefined : String(input.barcode).replace(/\s/g, '');
  if (barcode !== undefined && !/^\d{8,14}$/.test(barcode)) errors.barcode = 'A barcode has 8 to 14 digits.';

  let servingG = null;
  if (input.servingG != null && input.servingG !== '') {
    servingG = Number(input.servingG);
    if (!(Number.isFinite(servingG) && servingG > 0 && servingG <= 5000)) { errors.servingG = 'Serving size must be between 0 and 5000 g.'; servingG = null; }
  }
  const basisIn = input.per100g ? 'per100g' : input.perServing ? 'perServing' : null;
  if (!basisIn) errors.values = 'Enter the label values per 100 g or per serving.';
  if (basisIn === 'perServing' && servingG == null && !errors.servingG) errors.servingG = 'Enter the serving size in grams to use values per serving.';

  const per100g = Object.fromEntries(NUTRIENT_KEYS.map((k) => [k, null]));
  if (basisIn) {
    const raw = input[basisIn];
    for (const k of LABEL_KEYS) {
      const v = raw[k];
      if (v == null || v === '') { if (REQUIRED.includes(k)) errors[k] = 'Required.'; continue; }
      const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN;
      if (!Number.isFinite(n)) { errors[k] = 'Must be a number.'; continue; }
      if (n < 0) { errors[k] = 'Cannot be negative.'; continue; }
      per100g[k] = basisIn === 'perServing' ? (servingG ? (n / servingG) * 100 : null) : n;
    }
    if (basisIn === 'perServing' && servingG == null) for (const k of LABEL_KEYS) per100g[k] = null;
    const p = per100g;
    const has = (k) => p[k] != null && !errors[k];
    if (has('kcal') && p.kcal > 900) errors.kcal = 'Energy cannot be above 900 kcal per 100 g.';
    for (const k of GRAM_KEYS) if (has(k) && p[k] > 100) errors[k] = 'Cannot be more than 100 g per 100 g.';
    if (REQUIRED.slice(1).every(has) && p.protein + p.carbs + p.fat > 100 + 1e-9) errors.values = 'Protein, carbohydrate and fat together cannot be more than 100 g per 100 g.';
    if (has('sugar') && has('carbs') && p.sugar > p.carbs + 0.5) errors.sugar = 'Sugars cannot be more than total carbohydrate.';
    if (has('addedSugar') && has('sugar') && p.addedSugar > p.sugar + 0.5) errors.addedSugar = 'Added sugars cannot be more than total sugars.';
    if (has('satFat') && has('fat') && p.satFat > p.fat + 0.5) errors.satFat = 'Saturated fat cannot be more than total fat.';
    for (const [k, max] of Object.entries(MG_LIMIT_PER_100G)) if (has(k) && p[k] > max) errors[k] = `Too high: check the unit (mg per 100 g, at most ${max}).`;
    if (REQUIRED.every(has) && p.kcal > 0) {
      const calc = 4 * p.protein + 4 * p.carbs + 9 * p.fat;
      if (Math.abs(calc - p.kcal) > Math.max(20, 0.25 * p.kcal)) warnings.push(`Energy (${Math.round(p.kcal)} kcal per 100 g) differs from about ${Math.round(calc)} kcal worked out from protein, carbohydrate and fat. Check the label.`);
    }
  }
  if (Object.keys(errors).length) return { value: null, errors, warnings };

  for (const k of NUTRIENT_KEYS) per100g[k] = round(per100g[k], 3);
  // availableCarbs stays null: labels differ on whether carbohydrate includes fibre.
  const slug = name.toLowerCase().normalize('NFKD').replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '').slice(0, 40);
  const servingLabel = typeof input.servingLabel === 'string' && input.servingLabel.trim() ? input.servingLabel.trim() : '1 serving';
  const value = {
    id: input.id ?? `custom:${barcode ?? slug}`, kind: 'custom', name, nameAr: input.nameAr?.trim() || undefined, brand, barcode,
    per100g, servings: [...(servingG ? [serving(servingLabel, servingG)] : []), HUNDRED()],
    basis: 'label', sourceId: null, enteredAs: basisIn, allergens: [], mayContain: [], checkLabel: true,
  };
  return { value, errors: {}, warnings };
}
