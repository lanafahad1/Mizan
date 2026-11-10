import { test } from 'node:test';
import assert from 'node:assert/strict';
import { INGREDIENTS, INGREDIENT_LOOKUP } from '../data/ingredients.js';
import { INGREDIENT_NUTRIENTS } from '../data/ingredient-nutrients.js';
import { DISHES } from '../data/dishes.js';
import { SFCT_LIBRARY } from '../data/sfct-dishes.js';
import { PACKAGED_FOODS } from '../data/packaged-foods.js';
import { EXCHANGE_FOODS, exchangeNutrients } from '../data/moh-calorie-guide.js';
import { dishNutrition } from '../domain/nutrition.js';
import {
  FOODS, FOODS_WITHOUT_VALUES, MOH_PORTION_MATCHES, searchFoods, getFood, findByBarcode, nutrientsFor, servingsFor,
  canLogByGrams, customFoodFromLabel, sfctAllergens, normalizeText,
} from '../domain/food-db.js';

// Ingredients USDA SR Legacy has no adequate entry for; they are never estimated.
const NO_USDA = ['zaatar', 'loomi', 'harissa', 'mastic', 'citric-acid', 'kadi-water', 'galangal', 'shiba', 'nigella', 'mixed-spices'];

test('every ingredient has a USDA entry with kcal, protein, carbohydrate and fat, except the listed unmatched ones', () => {
  for (const ing of INGREDIENTS) {
    const n = INGREDIENT_NUTRIENTS[ing.id];
    assert.ok(n, `${ing.id} has an entry`);
    if (NO_USDA.includes(ing.id)) { assert.equal(n.per100g, null, `${ing.id} is not estimated`); assert.ok(n.note); continue; }
    assert.ok(Number.isInteger(n.fdcId), `${ing.id} fdcId`);
    for (const k of ['kcal', 'protein', 'carbs', 'fat']) assert.equal(typeof n.per100g[k], 'number', `${ing.id} ${k}`);
    for (const p of n.portions) assert.ok(p.label && p.g > 0, `${ing.id} portion ${p.label}`);
  }
  assert.deepEqual(FOODS_WITHOUT_VALUES.ingredients.sort(), [...NO_USDA].sort());
  // Ingredients of the SFCT hospital dishes are covered too.
  const used = new Set(DISHES.flatMap((d) => d.ingredients.map((l) => l.ing)));
  for (const id of used) assert.ok(INGREDIENT_LOOKUP[id] && INGREDIENT_NUTRIENTS[id], `${id} used in a dish`);
  // Spot checks against USDA SR Legacy.
  assert.equal(INGREDIENT_NUTRIENTS.banana.per100g.kcal, 89);
  assert.equal(INGREDIENT_NUTRIENTS.quinoa.usdaName, 'Quinoa, cooked');
  assert.equal(INGREDIENT_NUTRIENTS.salt.per100g.sodium, 38800);
});

test('every dish has energy: SFCT laboratory values or calculated from USDA ingredients', () => {
  const partialOnly = [];
  for (const d of DISHES) {
    const n = dishNutrition(d, SFCT_LIBRARY);
    assert.ok(n.available, `${d.id} has nutrient values`);
    if (d.nutrition.source === 'sfct') { assert.equal(n.basis, 'lab'); assert.equal(n.source.id, 'SFDA-SFCT'); } else {
      assert.equal(d.nutrition.source, 'ingredients', d.id);
      assert.equal(n.basis, 'calculated');
      assert.equal(n.source.id, 'USDA-FDC');
    }
    if (n.perPortion.kcal == null) { partialOnly.push(d.id); assert.ok(n.partialPortion.kcal > 0, `${d.id} shows a partial value`); } else assert.ok(n.perPortion.kcal > 0, d.id);
  }
  // Only the recipes with an ingredient USDA does not cover (za'atar, harissa) lack a complete energy value.
  assert.deepEqual(partialOnly.sort(), ['harissa-fish-vegetables', 'yogurt-cucumber-zaatar-bowl']);
});

test('calculated dish nutrition = Σ ingredient grams × USDA per 100 g', () => {
  const salad = DISHES.find((d) => d.id === 'garden-salad');
  const n = dishNutrition(salad, SFCT_LIBRARY);
  const kcal = salad.ingredients.reduce((s, l) => s + (INGREDIENT_NUTRIENTS[l.ing].per100g.kcal * l.g) / 100, 0);
  assert.equal(n.perPortion.kcal, Math.round(kcal));
  // added sugar counts only ingredients flagged added_sugar (honey here)
  const parfait = dishNutrition(DISHES.find((d) => d.id === 'yogurt-parfait-pomegranate'), SFCT_LIBRARY);
  const honey = DISHES.find((d) => d.id === 'yogurt-parfait-pomegranate').ingredients.find((l) => l.ing === 'honey');
  assert.equal(parfait.perPortion.addedSugar, Math.round(((INGREDIENT_NUTRIENTS.honey.per100g.sugar * honey.g) / 100) * 10) / 10);
});

test('the food database holds MOH portions, all SFCT dishes, ingredients, recipes and packaged products', () => {
  const count = (k) => FOODS.filter((f) => f.kind === k).length;
  assert.equal(count('moh-portion'), EXCHANGE_FOODS.length);
  assert.equal(count('saudi-dish'), 130);
  assert.equal(count('ingredient'), INGREDIENTS.length - NO_USDA.length);
  assert.ok(count('recipe') >= 30);
  assert.equal(count('packaged'), PACKAGED_FOODS.length);
  assert.ok(PACKAGED_FOODS.length >= 300 && PACKAGED_FOODS.length <= 600);
  assert.equal(new Set(FOODS.map((f) => f.id)).size, FOODS.length, 'ids are unique');
  const SOURCE = { 'moh-portion': 'MOH-GUIDE', 'saudi-dish': 'SFDA-SFCT', ingredient: 'USDA-FDC', recipe: 'USDA-FDC', packaged: 'OFF' };
  const BASIS = { 'moh-portion': 'moh-exchange', 'saudi-dish': 'lab', ingredient: 'lab', recipe: 'calculated', packaged: 'community' };
  for (const f of FOODS) {
    assert.equal(f.sourceId, SOURCE[f.kind], f.id);
    assert.equal(f.basis, BASIS[f.kind], f.id);
    assert.ok(f.servings.length > 0, `${f.id} has a serving`);
    if (f.kind !== 'moh-portion') {
      assert.equal(f.perPortion, undefined);
      for (const k of ['kcal', 'protein', 'carbs', 'fat']) if (f.kind !== 'saudi-dish') assert.equal(typeof f.per100g[k], 'number', `${f.id} ${k}`);
      for (const s of f.servings) assert.ok(s.g > 0 && s.display, `${f.id} serving ${s.label} has grams`);
    }
  }
  for (const p of PACKAGED_FOODS) {
    assert.equal(p.source, 'OFF'); assert.equal(p.checkLabel, true); assert.equal(p.id, `off-${p.barcode}`);
    assert.ok(p.per100g.kcal <= 900 && p.per100g.protein + p.per100g.carbs + p.per100g.fat <= 101, p.id);
  }
  assert.equal(new Set(PACKAGED_FOODS.map((p) => p.barcode)).size, PACKAGED_FOODS.length, 'de-duplicated by barcode');
});

test('SFCT dish servings: cooked recipe weight ÷ adults, plus 100 g and the hospital portion', () => {
  const k = getFood('sfct:chicken-kabsa');
  const e = SFCT_LIBRARY['chicken-kabsa'];
  assert.equal(k.servings[0].g, Math.round((e.recipeGrams / 4) * 10) / 10);
  assert.match(k.servings[0].display, /^1 serving \(≈\d+ g\)$/);
  assert.ok(k.servings.some((s) => s.label === '100 g' && s.g === 100));
  assert.ok(k.servings.some((s) => s.dishId === 'chicken-kabsa' && s.g === 350));
  assert.equal(k.per100g.kcal, 187);
  assert.equal(k.allergensDerived, true);
});

test('search: English, Arabic, brands; MOH first, then SFCT, then USDA on ties', () => {
  const tomato = searchFoods('tomato');
  assert.ok(tomato.length > 0);
  assert.equal(tomato[0].id, 'ing:tomato');
  const kabsa = searchFoods('kabsa');
  assert.ok(kabsa.some((f) => f.id === 'sfct:chicken-kabsa'));
  assert.ok(kabsa.every((f) => /kabsa/i.test(f.name)));
  assert.ok(searchFoods('كبسة').some((f) => f.id === 'sfct:chicken-kabsa'), 'Arabic search');
  assert.ok(searchFoods('كبسه').some((f) => f.id === 'sfct:chicken-kabsa'), 'taa marbuta normalised');
  const rice = searchFoods('rice');
  assert.equal(rice[0].id, 'moh:rice-cooked', 'the MOH portion comes first');
  const firstSfct = rice.findIndex((f) => f.kind === 'saudi-dish');
  const firstPackaged = rice.findIndex((f) => f.kind === 'packaged');
  assert.ok(firstSfct > 0 && (firstPackaged === -1 || firstPackaged > firstSfct));
  const almarai = searchFoods('almarai', { kinds: ['packaged'] });
  assert.ok(almarai.length > 5 && almarai.every((f) => f.kind === 'packaged' && /almarai|المراعي/i.test(`${f.brand} ${f.name}`)));
  assert.ok(searchFoods("lay's").length > 0 && searchFoods('lays').length > 0);
  assert.ok(searchFoods('Tomatoes', { kinds: ['ingredient'] }).every((f) => f.kind === 'ingredient'));
  assert.equal(searchFoods('tomato', { limit: 3 }).length, 3);
  assert.deepEqual(searchFoods('   '), []);
  assert.equal(normalizeText('Café  Laté'), 'cafe late');
});

test('nutrientsFor scales per 100 g by grams or by serving, and rounds', () => {
  const banana = getFood('ing:banana');
  const v = nutrientsFor(banana, 50);
  assert.equal(v.kcal, Math.round(89 / 2));
  assert.equal(v.protein, Math.round((1.09 / 2) * 10) / 10);
  assert.equal(v.potassium, 179);
  assert.deepEqual(nutrientsFor(banana, { grams: 50 }), v);
  assert.equal(nutrientsFor(banana, 0).kcal, 0);
  const medium = servingsFor(banana).findIndex((s) => s.label.startsWith('1 medium'));
  assert.equal(servingsFor(banana)[medium].g, 118);
  assert.equal(servingsFor(banana)[medium].display, '1 medium (7" to 7-7/8" long) (≈118 g)');
  assert.deepEqual(nutrientsFor(banana, { servingIndex: medium, quantity: 2 }), nutrientsFor(banana, 236));
  const kabsa = getFood('sfct:chicken-kabsa');
  assert.equal(nutrientsFor(kabsa, 350).kcal, Math.round(187 * 3.5));
  assert.equal(nutrientsFor(kabsa, 100).sugar, kabsa.per100g.sugar, 'null stays null');
  assert.throws(() => nutrientsFor(banana, -1), RangeError);
  assert.throws(() => nutrientsFor(banana, { servingIndex: 99 }), RangeError);
  assert.ok(canLogByGrams(banana));
});

test('MOH exchange portions: MOH values per portion, grams only as stated or matched to USDA', () => {
  const beans = getFood('moh:beans-lentils-cooked');
  assert.deepEqual(exchangeNutrients(EXCHANGE_FOODS.find((f) => f.id === 'beans-lentils-cooked')), { kcal: 155, carbs: 15, protein: 10, fat: 5 });
  assert.deepEqual(beans.perPortion, { kcal: 155, carbs: 15, protein: 10, fat: 5 });
  assert.equal(getFood('moh:peanut-butter').perPortion.kcal, 120);
  assert.equal(beans.per100g, null, 'no per-100 g values are invented');
  const rice = getFood('moh:rice-cooked');
  assert.equal(rice.basis, 'moh-exchange');
  assert.equal(rice.approxSource, 'USDA-FDC');
  assert.equal(rice.approxG, Math.round((158 / 3) * 10) / 10);
  assert.equal(rice.matchFoodId, 'ing:white-rice');
  assert.ok(getFood(rice.matchFoodId));
  assert.equal(getFood('moh:lean-meat').servings[0].g, 30);
  assert.equal(getFood('moh:lean-meat').approxG, null);
  assert.equal(getFood('moh:milk-powder').servings[0].g, null);
  // every matched USDA measure exists
  for (const [id, m] of Object.entries(MOH_PORTION_MATCHES)) assert.ok(getFood(`moh:${id}`).approxG > 0, id);
  // by portion: MOH values × number of portions; by grams: directed to the matching food
  assert.deepEqual(nutrientsFor(rice, { servingIndex: 0, quantity: 2 }), { kcal: 160, carbs: 30, protein: 6, fat: null });
  assert.throws(() => nutrientsFor(rice, { grams: 100 }), (e) => e.code === 'PORTION_ONLY' && e.matchFoodId === 'ing:white-rice');
  assert.equal(canLogByGrams(rice), false);
});

test('findByBarcode finds packaged products', () => {
  const p = PACKAGED_FOODS[0];
  assert.equal(findByBarcode(p.barcode).id, p.id);
  assert.equal(findByBarcode(` ${p.barcode} `).id, p.id);
  assert.equal(findByBarcode('0000000000000'), null);
  assert.equal(findByBarcode(''), null);
  assert.equal(getFood(p.id).kind, 'packaged');
});

test('custom food from a label: validated, converted to per 100 g, basis label', () => {
  const ok = customFoodFromLabel({ name: 'Date bar', brand: 'Test', servingG: 40, perServing: { kcal: 160, protein: 2, carbs: 30, fat: 4, sugar: 20, sodium: 40 } });
  assert.deepEqual(ok.errors, {});
  assert.equal(ok.value.basis, 'label');
  assert.equal(ok.value.per100g.kcal, 400);
  assert.equal(ok.value.per100g.sodium, 100);
  assert.equal(nutrientsFor(ok.value, { servingIndex: 0 }).kcal, 160);
  const per100 = customFoodFromLabel({ name: 'Oil', per100g: { kcal: 884, protein: 0, carbs: 0, fat: 100 } });
  assert.deepEqual(per100.errors, {});
  const bad = (input) => customFoodFromLabel(input).errors;
  assert.ok(bad({ per100g: { kcal: 100, protein: 1, carbs: 1, fat: 1 } }).name);
  assert.ok(bad({ name: 'x', per100g: { kcal: -1, protein: 1, carbs: 1, fat: 1 } }).kcal);
  assert.ok(bad({ name: 'x', per100g: { kcal: 950, protein: 1, carbs: 1, fat: 1 } }).kcal);
  assert.ok(bad({ name: 'x', per100g: { kcal: 400, protein: 101, carbs: 0, fat: 0 } }).protein);
  assert.ok(bad({ name: 'x', per100g: { kcal: 400, protein: 40, carbs: 40, fat: 30 } }).values);
  assert.ok(bad({ name: 'x', per100g: { kcal: 'lots', protein: 1, carbs: 1, fat: 1 } }).kcal);
  assert.ok(bad({ name: 'x', per100g: { protein: 1, carbs: 1, fat: 1 } }).kcal, 'kcal is required');
  assert.ok(bad({ name: 'x', perServing: { kcal: 100, protein: 1, carbs: 1, fat: 1 } }).servingG, 'per serving needs the serving size');
  assert.ok(bad({ name: 'x' }).values);
  assert.ok(bad({ name: 'x', per100g: { kcal: 100, protein: 1, carbs: 10, fat: 1, sugar: 20 } }).sugar);
  assert.ok(bad({ name: 'x', barcode: '12ab', per100g: { kcal: 100, protein: 1, carbs: 10, fat: 1 } }).barcode);
  assert.equal(customFoodFromLabel({ name: 'x', per100g: { kcal: 100, protein: 1, carbs: 10, fat: 1 } }).warnings.length, 1, 'energy mismatch warns');
});

test('SFCT allergens are derived from recipe ingredient text', () => {
  assert.deepEqual(sfctAllergens([{ name: 'Whole wheat flour' }, { name: 'Ghee' }]).sort(), ['gluten', 'milk']);
  assert.deepEqual(sfctAllergens([{ name: 'Eggplant, diced' }, { name: 'Red sorghum flour' }]), []);
  assert.deepEqual(sfctAllergens([{ name: 'Liquid tahini' }, { name: 'Shrimp, washed and peeled' }]).sort(), ['sesame', 'shellfish']);
  assert.deepEqual(sfctAllergens([{ name: 'Pine nuts' }, { name: 'Beaten eggs' }]).sort(), ['egg', 'tree_nut']);
});
