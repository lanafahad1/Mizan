// Personal health space: member privacy, assessment flow, readings, food diary, calculator.
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createMemoryRepo } from '../domain/memory-repo.js';
import { createService } from '../domain/service.js';
import { seedCatalog, seedHospitalDemo } from '../domain/demo-data.js';
import { seedHealthDemo } from '../domain/health-demo.js';
import { searchFoods } from '../domain/food-db.js';
import { addDays } from '../domain/dates.js';
import { bmi, bmiCategory, estimatedEnergy, waistRisk, suggestedTargets } from '../domain/calculator.js';
import { MOH_MEAL_PLANS, EXCHANGE_GROUPS, exchangeNutrients, EXCHANGE_FOODS, nearestPlan } from '../data/moh-calorie-guide.js';

let repo; let service; let ids; let today;
const actor = (role, name, extra = {}) => ({ id: `${role}-1`, role, name, status: 'active', ...extra });
const admin = actor('admin', 'Test Admin');
const staff = actor('staff', 'Test Staff');
const member = actor('member', 'Mona Member', { id: 'u-member-1' });
const otherMember = actor('member', 'Other Member', { id: 'u-member-2' });
const asPatient = (demoId) => actor('patient', demoId, { patientId: ids[demoId] });
const status = (fn) => { try { fn(); return 200; } catch (e) { return e.status ?? 500; } };

beforeEach(() => {
  repo = createMemoryRepo();
  seedCatalog(repo, new Date().toISOString());
  service = createService({ repo });
  today = service.today();
  ids = seedHospitalDemo({ repo, service, today });
});

test('calculator follows the MOH method', () => {
  // 10×80 + 6.25×180 − 5×30 + 5 = 1780 ; × 1.55 = 2759
  assert.deepEqual(estimatedEnergy({ sex: 'male', weightKg: 80, heightCm: 180, age: 30, activity: 'moderate' }), { bmr: 1780, kcal: 2759, factor: 1.55 });
  // women: … − 161
  assert.equal(estimatedEnergy({ sex: 'female', weightKg: 70, heightCm: 160, age: 40, activity: 'sedentary' }).bmr, 1339);
  assert.equal(bmi(95, 170), 32.9);
  assert.equal(bmiCategory(32.9).id, 'obese-1');
  assert.equal(bmiCategory(24.9).id, 'healthy');
  assert.equal(bmiCategory(25).id, 'overweight');
  assert.ok(estimatedEnergy({ sex: 'female', weightKg: 70, heightCm: 160, age: 30, activity: 'light', pregnantOrBreastfeeding: true }).notApplicable);
  assert.ok(estimatedEnergy({ sex: 'female', weightKg: 50, heightCm: 160, age: 16, activity: 'light' }).notApplicable);
  assert.equal(waistRisk('male', 95).id, 'increased');
  assert.equal(waistRisk('male', 102).id, 'high');
  assert.equal(waistRisk('female', 79).id, 'normal');
  assert.equal(suggestedTargets({ kcal: 1490 }).planKcal, 1500);
});

test('MOH meal plans add up to their calorie level', () => {
  for (const plan of MOH_MEAL_PLANS) {
    const kcal = Object.entries(plan.day).reduce((s, [g, n]) => s + EXCHANGE_GROUPS.find((x) => x.id === g).kcal * n, 0);
    assert.ok(Math.abs(kcal - plan.kcal) <= 60, `${plan.kcal}: ${kcal}`);
    // The meal table matches the daily row (one plan is printed with a difference, which is noted).
    const sums = {};
    for (const lines of Object.values(plan.meals)) for (const l of lines) sums[l.group] = (sums[l.group] ?? 0) + l.n;
    if (!plan.note) assert.deepEqual(sums, plan.day, `${plan.kcal}`);
  }
  assert.deepEqual(exchangeNutrients(EXCHANGE_FOODS.find((f) => f.id === 'beans-lentils-cooked')), { kcal: 155, carbs: 15, protein: 10, fat: 5 });
  assert.equal(nearestPlan(1250).kcal, 1200);
});

test('a member has a private space that no hospital role can reach', () => {
  service.updateHealthProfile(member, 'me', { about: { sex: 'female', age: 30, heightCm: 165, activity: 'light' }, conditions: ['obesity'] });
  service.addReading(member, 'me', { type: 'weight', value: 82, date: today });
  const o = service.getHealthOverview(member, 'me');
  assert.equal(o.kind, 'member');
  assert.equal(o.body.bmi, 30.1);
  assert.ok(o.body.energy.kcal > 1500);
  // Another member sees an empty space of their own, never Mona's.
  assert.equal(service.getHealthOverview(otherMember, 'me').latest.weight, null);
  // Staff and admin cannot list or open member records; members hold no hospital permission.
  assert.equal(service.healthWorklist(admin).waiting.length, 0);
  assert.equal(status(() => service.getHealthOverview(admin, `m:${member.id}`)), 404);
  assert.equal(status(() => service.listPatients(member)), 403);
  assert.equal(status(() => service.getHealthOverview(member, ids['CB-1001'])), 403);
  // Every record lives under the member's own owner key.
  assert.ok(repo.listHealth({ ownerPrefix: 'm:' }).every((r) => r.owner === `m:${member.id}`));
});

test('patients reach only their own health record; the care team reaches patients', () => {
  assert.equal(service.getHealthOverview(asPatient('CB-1001'), 'me').kind, 'patient');
  assert.equal(status(() => service.getHealthOverview(asPatient('CB-1001'), ids['CB-1004'])), 403);
  assert.equal(service.getHealthOverview(staff, ids['CB-1001']).kind, 'patient');
  service.addReading(staff, ids['CB-1001'], { type: 'bp', value: 140, value2: 90, date: today });
  assert.equal(service.getHealthOverview(asPatient('CB-1001'), 'me').latest.bp.value2, 90);
});

test('readings are validated', () => {
  assert.equal(status(() => service.addReading(member, 'me', { type: 'weight', value: 5 })), 422);
  assert.equal(status(() => service.addReading(member, 'me', { type: 'bp', value: 120, value2: 130 })), 422);
  assert.equal(status(() => service.addReading(member, 'me', { type: 'weight', value: 80, date: '2999-01-01' })), 422);
  assert.equal(service.addReading(member, 'me', { type: 'glucose', value: 6.1, unit: 'mmol/L', context: 'fasting' }).unit, 'mmol/L');
});

test('assessment: members complete it themselves; patients send it to the care team', () => {
  const draft = service.saveAssessment(member, 'me', { answers: { age: 30, sex: 'female', heightCm: 165, weightKg: 82, conditions: ['obesity', 'none'] } });
  assert.deepEqual(draft.answers.conditions, ['none'], '"None" excludes other choices');
  assert.equal(service.submitAssessment(member, 'me', draft.id).status, 'completed');
  assert.equal(service.getHealthOverview(member, 'me').latest.weight.value, 82);

  const pa = service.saveAssessment(asPatient('CB-1003'), 'me', { answers: { weightKg: 70, heightCm: 170 } });
  assert.equal(service.submitAssessment(asPatient('CB-1003'), 'me', pa.id).status, 'awaiting-review');
  assert.equal(status(() => service.reviewAssessment(staff, ids['CB-1003'], pa.id, { decision: 'approved', review: { kcal: 1800 } })), 403);
  assert.equal(status(() => service.reviewAssessment(admin, ids['CB-1003'], pa.id, { decision: 'more-info' })), 422, 'a note is required');
  service.reviewAssessment(admin, ids['CB-1003'], pa.id, { decision: 'approved', review: { kcal: 1800, sodium: 2000, nextReviewOn: today } });
  const o = service.getHealthOverview(asPatient('CB-1003'), 'me');
  assert.equal(o.targets.kcal, 1800);
  assert.equal(o.targetsBasis, 'care-team');
  assert.equal(service.healthWorklist(staff).due.length, 1);
  // A patient cannot set their own targets.
  assert.equal(status(() => service.setHealthTargets(asPatient('CB-1003'), 'me', { kcal: 3000 })), 403);
});

test('food diary: foods, grams, quick add and daily totals', () => {
  const rice = searchFoods('rice')[0];
  assert.ok(rice, 'food search returns results');
  service.setHealthTargets(member, 'me', { kcal: 1700 });
  const e1 = service.addDiaryEntry(member, 'me', { meal: 'lunch', foodId: rice.id, servingIndex: 0, quantity: 2 });
  assert.ok(e1.nutrients.kcal > 0);
  const grams = searchFoods('tomato', { kinds: ['ingredient'] })[0];
  const e2 = service.addDiaryEntry(member, 'me', { meal: 'dinner', foodId: grams.id, grams: 150 });
  assert.equal(e2.amountLabel, '150 g');
  service.addDiaryEntry(member, 'me', { meal: 'snack', quick: true, name: 'Juice', values: { kcal: 110 } });
  assert.equal(status(() => service.addDiaryEntry(member, 'me', { meal: 'snack', quick: true, values: {} })), 422);
  const d = service.getDiary(member, 'me');
  assert.equal(d.targets.kcal, 1700);
  assert.equal(Math.round(d.totals.kcal), Math.round(e1.nutrients.kcal + e2.nutrients.kcal + 110));
  assert.equal(d.meals.find((m) => m.id === 'snack').entries.length, 1);
  service.deleteDiaryEntry(member, 'me', e1.id);
  assert.equal(status(() => service.deleteDiaryEntry(otherMember, 'me', e2.id)), 404);
});

test('a patient’s day counts hospital meals they ate plus food from outside', () => {
  const d = service.getDiary(asPatient('CB-1001'), 'me');
  const breakfast = d.meals.find((m) => m.id === 'breakfast').entries;
  assert.ok(breakfast.some((e) => e.hospital), 'the delivered breakfast is counted from intake');
});

test('custom foods from a pack label are validated and private', () => {
  assert.equal(status(() => service.addCustomFood(member, 'me', { name: 'Bad', per100g: { kcal: 2000, protein: 1, carbs: 1, fat: 1 } })), 422);
  const f = service.addCustomFood(member, 'me', { name: 'Date bar', brand: 'Local', servingG: 40, per100g: { kcal: 380, protein: 6, carbs: 70, fat: 8, sugar: 50, sodium: 30 } });
  assert.ok(service.findFoods(member, { q: 'date bar' }).some((x) => x.id === f.id));
  assert.ok(!service.findFoods(otherMember, { q: 'date bar' }).some((x) => x.id === f.id));
  const e = service.addDiaryEntry(member, 'me', { meal: 'snack', foodId: f.id, grams: 40 });
  assert.equal(e.nutrients.kcal, 152);
});

test('demo health data seeds without errors and clearing the hospital keeps members', () => {
  repo.createUser({ username: 'sara.member', name: 'Sara', role: 'member', email: 'sara@carebite.test' });
  seedHealthDemo({ repo, service, today, patientIds: ids });
  const sara = repo.getUserByUsername('sara.member');
  assert.ok(repo.listHealth({ owner: `m:${sara.id}`, kind: 'reading' }).length >= 9);
  assert.ok(repo.listHealth({ owner: `m:${sara.id}`, kind: 'food' }).length > 0);
  assert.equal(service.healthWorklist(admin).waiting.length, 1);
  repo.clearHospitalData();
  assert.equal(repo.listHealth({ ownerPrefix: 'p:' }).length, 0);
  assert.ok(repo.listHealth({ ownerPrefix: 'm:' }).length > 0);
});

test('MOH portions cannot be logged by grams (422, not a crash); Open Food Facts copies keep their source', () => {
  const moh = searchFoods('rice')[0];
  assert.equal(moh.kind, 'moh-portion');
  assert.equal(status(() => service.addDiaryEntry(member, 'me', { meal: 'lunch', foodId: moh.id, grams: 100 })), 422);
  const f = service.addCustomFood(member, 'me', { origin: 'OFF', name: 'Biscuits', barcode: '6281000000000', per100g: { kcal: 480, protein: 6, carbs: 65, fat: 21 } });
  assert.equal(f.basis, 'community');
  assert.equal(f.sourceId, 'OFF');
});

test('daily trackers: water adds up, steps replace, values stay in range, goals cite MOH', () => {
  service.setDaily(member, 'me', { type: 'water', add: 1 });
  const w = service.setDaily(member, 'me', { type: 'water', add: 1 });
  assert.equal(w.value, 2);
  assert.equal(service.setDaily(member, 'me', { type: 'steps', value: 8200 }).value, 8200);
  assert.equal(service.setDaily(member, 'me', { type: 'steps', value: 6000 }).value, 6000, 'steps replace the day value');
  assert.equal(status(() => service.setDaily(member, 'me', { type: 'steps', value: 500000 })), 422);
  assert.equal(status(() => service.setDaily(member, 'me', { type: 'sleep', value: 1 })), 422);
  const d = service.getDiary(member, 'me');
  assert.deepEqual(d.daily, { water: 2, steps: 6000, activity: null });
  assert.ok(service.healthReference().dailyTrackers.every((t) => t.source === 'MOH-GUIDE'));
});

test('week view counts logged days, calories and active minutes', () => {
  service.setHealthTargets(member, 'me', { kcal: 1700 });
  const rice = searchFoods('rice')[0];
  service.addDiaryEntry(member, 'me', { meal: 'lunch', foodId: rice.id, servingIndex: 0, quantity: 3 });
  service.setDaily(member, 'me', { type: 'activity', value: 30 });
  const wk = service.getWeek(member, 'me');
  assert.equal(wk.days.length, 7);
  assert.equal(wk.days.at(-1).date, today);
  assert.equal(wk.daysLogged, 1);
  assert.equal(wk.activityMinutes, 30);
  assert.equal(wk.target, 1700);
  assert.equal(wk.goals.activity.weeklyGoal, 150);
});

test('favourites, repeating a meal and my foods', () => {
  const egg = searchFoods('egg', { kinds: ['moh-portion'] })[0];
  assert.equal(service.toggleFavorite(member, 'me', { foodId: egg.id }).on, true);
  assert.deepEqual(service.listFavorites(member, 'me').map((f) => f.id), [egg.id]);
  assert.equal(service.toggleFavorite(member, 'me', { foodId: egg.id }).on, false);
  const yesterday = addDays(today, -1);
  service.addDiaryEntry(member, 'me', { date: yesterday, meal: 'breakfast', foodId: egg.id, servingIndex: 0, quantity: 2 });
  const rep = service.repeatMeal(member, 'me', { meal: 'breakfast' });
  assert.equal(rep.added, 1);
  assert.equal(service.getDiary(member, 'me').meals.find((m) => m.id === 'breakfast').entries.length, 1);
  assert.equal(status(() => service.repeatMeal(member, 'me', { meal: 'dinner' })), 422);
  const mine = service.addCustomFood(member, 'me', { name: 'Date bar', per100g: { kcal: 380, protein: 6, carbs: 70, fat: 8 } });
  assert.equal(service.listCustomFoods(member, 'me').length, 1);
  assert.equal(service.updateCustomFood(member, 'me', mine.id, { name: 'Date bar (small)', per100g: { kcal: 360, protein: 6, carbs: 68, fat: 7 } }).name, 'Date bar (small)');
  assert.equal(status(() => service.deleteCustomFood(otherMember, 'me', mine.id)), 404);
  service.deleteCustomFood(member, 'me', mine.id);
  assert.equal(service.listCustomFoods(member, 'me').length, 0);
});

test('shelves can be browsed without typing', () => {
  const starch = service.findFoods(member, { kinds: ['moh-portion'], group: 'starch' });
  assert.ok(starch.length >= 10 && starch.every((f) => f.group === 'starch' && f.servings.length));
  assert.ok(service.findFoods(null, { kinds: ['saudi-dish'], limit: 100 }).length === 100);
});

test('the public menu can list all meals', () => {
  const all = service.getMenu({ view: 'all' });
  assert.equal(all.view, 'all');
  assert.ok(all.total >= 30);
  assert.equal(all.periods.reduce((n, p) => n + p.meals.length, 0), all.total);
  assert.ok(service.getMenu({ view: 'all', cuisine: 'Saudi' }).periods.every((p) => p.meals.every((m) => m.cuisine === 'Saudi')));
});

test('diary entries merge, can be edited, removed with undo; trackers can be cleared', () => {
  const egg = searchFoods('egg', { kinds: ['moh-portion'] })[0];
  const a = service.addDiaryEntry(member, 'me', { meal: 'breakfast', foodId: egg.id, servingIndex: 0, quantity: 1 });
  const b = service.addDiaryEntry(member, 'me', { meal: 'breakfast', foodId: egg.id, servingIndex: 0, quantity: 1 });
  assert.equal(b.id, a.id, 'the same food twice is one row');
  assert.equal(b.amount.quantity, 2);
  assert.equal(b.nutrients.kcal, a.nutrients.kcal * 2);
  const edited = service.updateDiaryEntry(member, 'me', a.id, { quantity: 3 });
  assert.equal(edited.amount.quantity, 3);
  assert.equal(service.updateDiaryEntry(member, 'me', a.id, { meal: 'snack' }).meal, 'snack');
  const removed = service.deleteDiaryEntry(member, 'me', a.id);
  assert.equal(service.getDiary(member, 'me').totals.kcal, 0);
  service.restoreDiaryEntry(member, 'me', { entry: removed.entry });
  assert.ok(service.getDiary(member, 'me').totals.kcal > 0, 'undo puts it back');
  assert.equal(status(() => service.restoreDiaryEntry(otherMember, 'me', { entry: removed.entry })), 422, 'cannot restore into another space');
  service.setDaily(member, 'me', { type: 'steps', value: 4000 });
  service.setDaily(member, 'me', { type: 'steps', clear: true });
  assert.equal(service.getDiary(member, 'me').daily.steps, null);
});

test('staff access lists only staff and admins, never members', () => {
  repo.createUser({ username: 'm1', name: 'M', role: 'member', email: 'm1@test.local', status: 'active' });
  assert.ok(!service.listStaff(admin).staff.some((u) => u.username === 'm1'));
});
