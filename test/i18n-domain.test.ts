// Arabic for texts the domain layer builds: real engine output for demo patients
// is matched by the sentence patterns in lib/i18n/ar/patterns.ts.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { translate } from '../lib/i18n/index.ts';
import { PATTERNS } from '../lib/i18n/ar/patterns.ts';
import { DISHES } from '../data/dishes.js';
import { MEALS } from '../data/meals.js';
import { INGREDIENT_LOOKUP } from '../data/ingredients.js';
import { SFCT_LIBRARY } from '../data/sfct-dishes.js';
import { buildCatalog } from '../domain/catalog.js';
import { evaluateMeal } from '../domain/engine.js';
import { normalizeNewPatient } from '../domain/patient.js';

const catalog = buildCatalog({ dishes: DISHES, meals: MEALS, ingredients: INGREDIENT_LOOKUP, sfct: SFCT_LIBRARY });
const ARABIC = /[\u0600-\u06FF]/;
const ar = (s: string) => translate('ar', s);

function patient(over: Record<string, any> = {}) {
  const base: Record<string, any> = {
    demoId: 'MZ-0001', ageRange: '45-59', ward: '3A', bed: '1',
    conditions: { selected: ['none'] },
    dietOrder: { categories: ['regular'], portionsPermitted: ['small', 'regular', 'large'] },
    allergies: { status: 'nka' },
    preferences: {},
  };
  const merged = { ...base };
  for (const [k, v] of Object.entries(over)) merged[k] = v && typeof v === 'object' && !Array.isArray(v) ? { ...(base[k] ?? {}), ...v } : v;
  const { value, errors } = normalizeNewPatient(merged);
  assert.deepEqual(errors, {}, 'test patient should be valid');
  return value;
}
const evaluate = (mealId: string, p: unknown, period = 'lunch') => evaluateMeal(catalog.byId[mealId], p, { catalog, period });

test('every pattern is anchored and uses only groups it captures', () => {
  for (const [re, tpl] of PATTERNS) {
    assert.ok(re.source.startsWith('^') && re.source.endsWith('$'), `not anchored: ${re}`);
    const groups = new RegExp(`${re.source}|`).exec('')!.length - 1;
    for (const [, n] of tpl.matchAll(/\$(\d+)/g)) assert.ok(Number(n) <= groups, `${re} uses $${n} but has ${groups} groups`);
    assert.ok(ARABIC.test(tpl) || tpl.includes('{t:'), `no Arabic in template for ${re}`);
  }
});

test('a low-sodium patient gets Arabic reasons, checks and kitchen instructions', () => {
  const p = patient({ dietOrder: { categories: ['low-sodium'] } });
  const results = catalog.list.map((m: { id: string }) => evaluate(m.id, p));
  const passing = results.find((e: any) => e.status === 'eligible' && e.checks.some((c: any) => c.ruleId === 'DIET-NA'));
  assert.ok(passing, 'some meal passes the sodium limit');
  const sodium = passing.checks.find((c: any) => c.ruleId === 'DIET-NA');
  assert.match(ar(sodium.detail), /^الصوديوم في الحصة بحجم .+ ملجم، ضمن حد الغداء البالغ 600 ملجم \(30% من 2,000 ملجم يوميًا، .+\)\.$/);
  assert.equal(ar(sodium.label), 'حد الصوديوم لكل وجبة');
  for (const r of passing.reasons) assert.ok(ARABIC.test(ar(r.text)), `reason not translated: ${r.text}`);
  assert.ok(passing.kitchenInstructions.includes('No added salt at plating.'));
  for (const k of passing.kitchenInstructions) assert.ok(ARABIC.test(ar(k)), `kitchen instruction not translated: ${k}`);
  const salty = results.find((e: any) => e.status === 'excluded' && e.exclusions.some((x: any) => x.ruleId === 'DIET-NA'));
  assert.ok(salty, 'some meal is above the sodium limit');
  const msg = salty.exclusions.find((x: any) => x.ruleId === 'DIET-NA').message;
  assert.match(ar(msg), /^الصوديوم في الحصة بحجم .+، وهذا أعلى من حد الغداء/);
});

test('the lower-salt ranking reason from the brief translates', () => {
  assert.equal(
    ar('Lower in salt: 410 mg sodium, within the lunch share of the MOH and SFDA limit of 5 g salt (2,000 mg sodium) a day.'),
    'أقل ملحًا: 410 ملجم صوديوم، ضمن حصة الغداء من حد وزارة الصحة والهيئة العامة للغذاء والدواء البالغ 5 جم ملح (2,000 ملجم صوديوم) يوميًا.',
  );
});

test('allergy exclusions, portion suggestions and review reasons translate', () => {
  const allergic = patient({ allergies: { status: 'recorded', confirmed: ['milk'] } });
  const ex = evaluate('laban-dates', allergic, 'snack');
  assert.equal(ex.status, 'excluded');
  const text = ar(ex.exclusions[0].message);
  assert.ok(text.startsWith('يحتوي على الحليب ('), text);
  assert.ok(text.endsWith('لدى المريض حساسية مؤكدة من الحليب.'), text);

  const unknown = patient({ allergies: { status: 'unknown' }, appetite: { level: 'poor' } });
  const rv = evaluate('chicken-kabsa', unknown);
  assert.equal(ar(rv.reviewReasons[0].message), 'لم تُقيَّم الحساسية الغذائية لهذا المريض.');
  assert.ok(ARABIC.test(ar(rv.portion.explanation)), rv.portion.explanation);
  assert.ok(ar(rv.portion.explanation).includes('شهية المريض حاليًا ضعيفة'));
});

test('workflow and validation messages translate; English stays unchanged', () => {
  // Simple standard Arabic: translated, and free of dialect words.
  const DIALECT = /(^|\s)(عشان|بالكثير|يبي|تبي|وش|وين|مو|اللي|هذي)(\s|$|[.،])/;
  for (const en of ['Choose your lunch.', 'Offer at most 4 options so the choice stays simple for the patient.']) {
    const out = ar(en);
    assert.ok(ARABIC.test(out) && out !== en, `translated: ${en}`);
    assert.ok(!DIALECT.test(out), `no dialect: ${out}`);
  }
  assert.ok(ARABIC.test(ar('Chicken Kabsa needs admin review before it can be offered or confirmed.')));
  assert.equal(ar('Chicken Kabsa'), 'كبسة بالدجاج');
  assert.equal(translate('en', 'Chicken Kabsa needs admin review before it can be offered or confirmed.'), 'Chicken Kabsa needs admin review before it can be offered or confirmed.');
});
