// Food pictures (lib/art.js foodArt): every food a person can see has its own
// picture, and no two foods share one. Pictures only; no values are involved.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { foodArt, foodArtSpec, artProblems, mealArt } from '../lib/art.js';
import { SAUDI_ART, INGREDIENT_ART, MOH_ART } from '../data/food-art.js';
import { SFCT_LIBRARY } from '../data/sfct-dishes.js';
import { INGREDIENTS } from '../data/ingredients.js';
import { EXCHANGE_FOODS } from '../data/moh-calorie-guide.js';
import { PACKAGED_FOODS } from '../data/packaged-foods.js';
import { SFCT_HOSPITAL_DISHES } from '../data/sfct-hospital-dishes.js';
import { DISHES } from '../data/dishes.js';
import { MEALS } from '../data/meals.js';
import { FOODS, getFood } from '../domain/food-db.js';

// Everything that can show up in a food list: the database (MOH portions, SFCT
// dishes, ingredients with values, recipes, packaged products), the ingredients
// without USDA values (shown on recipes), and some of a person's own foods.
const OWN = ['Grandma’s date cake', 'Homemade laban', 'Protein bar', 'Chicken shawarma wrap', 'Spicy chips', 'Fresh orange juice', 'Laban', 'Laban']
  .map((name, i) => ({ id: `custom-${i + 1}`, kind: 'custom', name }));
const ALL = [
  ...FOODS,
  ...INGREDIENTS.filter((i) => !getFood(`ing:${i.id}`)).map((i) => ({ id: `ing:${i.id}`, kind: 'ingredient', name: i.name, art: INGREDIENT_ART[i.id] })),
  ...OWN,
];

test('every Saudi dish, ingredient and MOH portion has its own drawn recipe (no generic picture)', () => {
  assert.deepEqual(Object.keys(SAUDI_ART).sort(), Object.keys(SFCT_LIBRARY).sort());
  assert.deepEqual(Object.keys(INGREDIENT_ART).sort(), INGREDIENTS.map((i) => i.id).sort());
  assert.deepEqual(Object.keys(MOH_ART).sort(), EXCHANGE_FOODS.map((f) => f.id).sort());
  for (const f of ALL) {
    const spec = foodArtSpec(f);
    assert.deepEqual(artProblems(spec), [], `${f.id}: everything in its picture is drawn`);
    if (['saudi-dish', 'ingredient', 'moh-portion', 'recipe'].includes(f.kind)) assert.ok(spec.vessel && !spec.pack, `${f.id} has its own picture, not a package`);
  }
  for (const [kind, n] of [['saudi-dish', 130], ['moh-portion', 44], ['packaged', 600]]) assert.equal(FOODS.filter((f) => f.kind === kind && f.art).length, n, `${kind} foods carry their recipe`);
});

test('no two foods share a picture', () => {
  const bySvg = new Map(); const bySpec = new Map();
  for (const f of ALL) {
    const svg = foodArt(f);
    assert.match(svg, /^<svg viewBox="12 12 136 136"[^>]*aria-hidden="true"/, `${f.id} is a decorative square svg`);
    assert.equal(foodArt(f), svg, `${f.id} is the same every time`);
    assert.ok(!bySvg.has(svg), `${f.id} looks exactly like ${bySvg.get(svg)}`);
    bySvg.set(svg, f.id);
    const key = JSON.stringify(foodArtSpec(f));
    assert.ok(!bySpec.has(key), `${f.id} has the same picture recipe as ${bySpec.get(key)}`);
    bySpec.set(key, f.id);
  }
  assert.ok(bySvg.size >= 130 + 150 + 44 + 600, `${bySvg.size} different pictures`);
});

test('packaged products and own foods get a plain package that fits the product, different for each', () => {
  const shape = (name, category = null) => foodArtSpec({ id: `off-${name}`, kind: 'packaged', name, category }).pack;
  assert.equal(shape('Fresh Laban'), 'carton');
  assert.equal(shape('Cola', 'soft-drinks'), 'can');
  assert.equal(shape('Greek Yoghurt'), 'cup');
  assert.equal(shape('Chili & Lime Chips'), 'bag');
  assert.equal(shape('Tomato ketchup'), 'squeeze');
  assert.equal(shape('Natural Honey'), 'jar');
  // the same product name from two brands, or two own foods with one name, still differ
  const a = foodArt({ id: 'off-1', kind: 'packaged', name: 'Laban', brand: 'A' });
  const b = foodArt({ id: 'off-2', kind: 'packaged', name: 'Laban', brand: 'B' });
  assert.notEqual(a, b);
  assert.ok(!/<text/.test(a), 'no lettering or logos on packages');
  // a recent row knows only the id and name: an own food still gets its package
  assert.match(foodArt({ id: 'custom-9', name: 'Date cake' }), /^<svg/);
});

test('hospital dishes use the same picture recipe as their SFCT dish, and menu meals all differ', () => {
  for (const d of SFCT_HOSPITAL_DISHES) assert.deepEqual(d.art, SAUDI_ART[d.nutrition.sfctId], d.id);
  const byId = Object.fromEntries(DISHES.map((d) => [d.id, d]));
  const seen = new Map();
  for (const m of MEALS) {
    const art = byId[m.components[0].dish]?.art;
    assert.deepEqual(artProblems(art), [], `${m.id} art is drawn`);
    const svg = mealArt({ ...m, art });
    assert.ok(!seen.has(svg), `${m.id} looks like ${seen.get(svg)}`);
    seen.set(svg, m.id);
    // same-looking recipes are not allowed either
    const others = MEALS.filter((o) => o.id !== m.id && o.components.length === 1 && m.components.length === 1 && JSON.stringify(byId[o.components[0].dish]?.art) === JSON.stringify(art));
    assert.deepEqual(others.map((o) => o.id), [], `${m.id} has its own recipe`);
  }
  assert.equal(PACKAGED_FOODS.length, 600);
});
