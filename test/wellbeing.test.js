// Ramadan mode (Umm al-Qura dates, meal relabelling), the healthy plate builder,
// the sleep tracker and small wins.
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createMemoryRepo } from '../domain/memory-repo.js';
import { createService } from '../domain/service.js';
import { seedCatalog, seedHospitalDemo } from '../domain/demo-data.js';
import { searchFoods, getFood } from '../domain/food-db.js';
import { addDays } from '../domain/dates.js';
import { SOURCES } from '../domain/rules.js';
import { hijriDate, isRamadan, ramadanActive, ramadanMeals, cleanRamadanMode, hasDiabetes, RAMADAN_LABELS } from '../domain/ramadan.js';
import { comparePlate, plateGroupOf, plateFromEntries, PLATE_GROUPS, PLATE_CLOSE } from '../domain/plate.js';
import { computeWins, longestRun, WINS } from '../domain/wins.js';
import { RAMADAN_TIPS, RAMADAN_BP_TIPS, RAMADAN_DIABETES } from '../data/moh-ramadan.js';
import { HEALTHY_PLATE } from '../data/moh-calorie-guide.js';

let repo; let service; let ids; let today;
const actor = (role, name, extra = {}) => ({ id: `${role}-1`, role, name, status: 'active', ...extra });
const staff = actor('staff', 'Test Staff');
const member = actor('member', 'Mona Member', { id: 'u-member-1' });
const asPatient = (demoId) => actor('patient', demoId, { patientId: ids[demoId] });
const status = (fn) => { try { fn(); return 200; } catch (e) { return e.status ?? 500; } };

beforeEach(() => {
  repo = createMemoryRepo();
  seedCatalog(repo, new Date().toISOString());
  service = createService({ repo });
  today = service.today();
  ids = seedHospitalDemo({ repo, service, today });
});

// ---------------------------------------------------------------- Ramadan dates
test('Umm al-Qura dates: Ramadan is Hijri month 9', () => {
  assert.deepEqual(hijriDate('2026-02-18'), { year: 1447, month: 9, day: 1 });
  assert.deepEqual(hijriDate('2026-03-19'), { year: 1447, month: 9, day: 30 });
  assert.deepEqual(hijriDate('2027-02-08'), { year: 1448, month: 9, day: 1 });
  // the days around Ramadan 1447 and 1448
  assert.equal(isRamadan('2026-02-17'), false);
  assert.equal(isRamadan('2026-02-18'), true);
  assert.equal(isRamadan('2026-03-01'), true);
  assert.equal(isRamadan('2026-03-19'), true);
  assert.equal(isRamadan('2026-03-20'), false);
  assert.equal(isRamadan('2027-02-07'), false);
  assert.equal(isRamadan('2027-03-08'), true);
  assert.equal(isRamadan('2027-03-09'), false);
  assert.equal(isRamadan('2026-11-14'), false);
  // bad input never throws
  assert.equal(hijriDate('not a date'), null);
  assert.equal(hijriDate(null), null);
  assert.equal(isRamadan(''), false);
});

test('Ramadan mode: Auto follows the calendar, On and Off override it', () => {
  assert.equal(ramadanActive('auto', '2026-03-01'), true);
  assert.equal(ramadanActive('auto', '2026-11-14'), false);
  assert.equal(ramadanActive('on', '2026-11-14'), true);
  assert.equal(ramadanActive('off', '2026-03-01'), false);
  assert.equal(cleanRamadanMode('nonsense'), 'auto');
  assert.equal(ramadanActive(undefined, '2026-03-01'), true, 'no setting means Auto');
  assert.ok(hasDiabetes(['t2d']) && hasDiabetes(['t1d']) && !hasDiabetes(['hypertension']));
});

test('Ramadan relabelling keeps meal ids; lunch is hidden only when empty', () => {
  const meals = ['breakfast', 'lunch', 'dinner', 'snack'].map((id) => ({ id, label: id, entries: [] }));
  const out = ramadanMeals(meals);
  assert.deepEqual(out.map((m) => m.id), ['breakfast', 'dinner', 'snack']);
  assert.deepEqual(out.map((m) => m.label), ['Suhoor', 'Iftar', 'Snacks after Iftar']);
  const withLunch = ramadanMeals(meals.map((m) => (m.id === 'lunch' ? { ...m, entries: [{ id: 'x' }] } : m)));
  assert.deepEqual(withLunch.map((m) => m.id), ['breakfast', 'lunch', 'dinner', 'snack']);
  assert.equal(withLunch[1].label, 'Lunch');
  assert.equal(RAMADAN_LABELS.breakfast, 'Suhoor');
});

test('the diary reports Ramadan mode; the person switches it, the care team cannot', () => {
  const rice = searchFoods('rice')[0];
  service.addDiaryEntry(member, 'me', { meal: 'breakfast', foodId: rice.id, servingIndex: 0, quantity: 1 });
  const before = service.getDiary(member, 'me');
  assert.equal(before.ramadan.mode, 'auto');
  assert.equal(before.ramadan.patient, false);
  // Auto on a day in Ramadan 1447 (the diary can be read for any valid date).
  assert.equal(service.getDiary(member, 'me', { date: '2026-03-01' }).ramadan.active, true);
  assert.equal(service.setRamadanMode(member, 'me', { mode: 'on' }).active, true);
  const on = service.getDiary(member, 'me');
  assert.equal(on.ramadan.active, true);
  // stored data is unchanged: the entry is still the breakfast (Suhoor) meal
  assert.equal(on.meals.find((m) => m.id === 'breakfast').entries.length, 1);
  service.setRamadanMode(member, 'me', { mode: 'off' });
  assert.equal(service.getDiary(member, 'me', { date: '2026-03-01' }).ramadan.active, false);
  assert.equal(status(() => service.setRamadanMode(member, 'me', { mode: 'always' })), 422);
  // Hospital patient (type 2 diabetes and high blood pressure in the record): their own switch only.
  const noura = asPatient('MZ-1001');
  const info = service.setRamadanMode(noura, 'me', { mode: 'on' });
  assert.ok(info.active && info.patient && info.diabetes && info.hypertension);
  assert.equal(status(() => service.setRamadanMode(staff, ids['MZ-1001'], { mode: 'off' })), 403);
  assert.equal(service.getDiary(staff, ids['MZ-1001']).ramadan.active, true);
});

test('Ramadan tips cite MOH sources only and give no medicine advice', () => {
  const all = [...RAMADAN_TIPS, ...RAMADAN_BP_TIPS];
  for (const tip of all) {
    const s = SOURCES[tip.source];
    assert.ok(s && s.saudi && s.authority === 'MOH' && /^https:\/\/www\.moh\.gov\.sa\//.test(s.url), `${tip.id} cites a MOH page`);
    assert.ok(s.date, `${tip.source} has a date`);
  }
  assert.ok(SOURCES[RAMADAN_DIABETES.source]?.saudi);
  const text = [...all.map((x) => x.text), ...RAMADAN_DIABETES.checks, ...RAMADAN_DIABETES.breakFast].join(' ');
  assert.ok(!/\b(dose|doses|insulin|tablet|pill|metformin)\b/i.test(text), 'no medication advice');
  assert.match(RAMADAN_DIABETES.doctor, /doctor/);
});

// ---------------------------------------------------------------- healthy plate
test('the plate builder uses the MOH healthy plate shares', () => {
  assert.deepEqual(PLATE_GROUPS.map((g) => [g.id, g.share]), HEALTHY_PLATE.filter((g) => g.share != null).map((g) => [g.group, g.share]));
  assert.equal(PLATE_GROUPS.reduce((n, g) => n + g.share, 0), 100);
  assert.ok(SOURCES['MIZAN-PLATE'] && SOURCES['MIZAN-PLATE'].authority === 'Mizan');
});

test('plate comparison says more, less, about the same or missing, with no score', () => {
  assert.equal(comparePlate({}).empty, true);
  // 3 parts vegetables, 2 grains, 2 protein, 2 fruit ≈ 33/22/22/22: all within 10 points of 30/25/25/20
  const close = comparePlate({ vegetables: 3, grains: 2, protein: 2, fruit: 2 }, { milk: true });
  assert.ok(close.groups.every((g) => g.verdict === 'close'), JSON.stringify(close.groups));
  assert.equal(close.milk, true);
  const heavy = comparePlate({ vegetables: 1, grains: 3, protein: 2, fruit: 0 });
  const by = Object.fromEntries(heavy.groups.map((g) => [g.id, g]));
  assert.equal(by.grains.verdict, 'more');
  assert.equal(by.grains.share, 50);
  assert.equal(by.vegetables.verdict, 'less');
  assert.equal(by.protein.verdict, 'close');
  assert.equal(by.fruit.verdict, 'missing');
  assert.ok(heavy.groups.every((g) => !('score' in g)));
  // bad amounts count as none
  assert.equal(comparePlate({ vegetables: 9, grains: -1, protein: 'x' }).empty, true);
  assert.equal(PLATE_CLOSE, 10);
});

test('a logged meal gives a starting plate', () => {
  assert.equal(plateGroupOf(getFood('moh:rice-cooked')), 'grains');
  assert.equal(plateGroupOf(getFood('moh:milk-low-fat')), 'milk');
  assert.equal(plateGroupOf(getFood('moh:vegetable-oil')), null, 'fats are not on the plate');
  const start = plateFromEntries([{ name: 'Rice', plateGroup: 'grains' }, { name: 'Laban', plateGroup: 'milk' }, { name: 'Kabsa', plateGroup: null }]);
  assert.deepEqual(start.amounts, { vegetables: 0, grains: 2, protein: 0, fruit: 0 });
  assert.equal(start.milk, true);
  assert.deepEqual(start.unknown, ['Kabsa']);
  // the diary marks each own food with its plate group
  service.addDiaryEntry(member, 'me', { meal: 'lunch', foodId: 'moh:rice-cooked', servingIndex: 0, quantity: 1 });
  assert.equal(service.getDiary(member, 'me').meals.find((m) => m.id === 'lunch').entries[0].plateGroup, 'grains');
});

// ---------------------------------------------------------------- sleep
test('sleep tracker: hours to the nearest half hour, 0–24, shown in the week', () => {
  assert.equal(service.setDaily(member, 'me', { type: 'sleep', value: 7.5 }).value, 7.5);
  assert.equal(service.setDaily(member, 'me', { type: 'sleep', value: 6.8 }).value, 7, 'rounded to the half hour');
  assert.equal(service.setDaily(member, 'me', { type: 'sleep', value: 6.2 }).value, 6);
  assert.equal(status(() => service.setDaily(member, 'me', { type: 'sleep', value: 25 })), 422);
  assert.equal(status(() => service.setDaily(member, 'me', { type: 'sleep', value: -1 })), 422);
  assert.equal(status(() => service.setDaily(member, 'me', { type: 'sleep', value: 'lots' })), 422);
  assert.equal(status(() => service.setDaily(member, 'me', { type: 'sleep', value: 7, date: addDays(today, 1) })), 422);
  service.setDaily(member, 'me', { type: 'sleep', value: 8, date: addDays(today, -1) });
  assert.equal(service.getDiary(member, 'me').daily.sleep, 6);
  const wk = service.getWeek(member, 'me');
  assert.deepEqual(wk.days.slice(-2).map((d) => d.sleep), [8, 6]);
  assert.equal(wk.goals.sleep.goalMin, 7);
  assert.equal(wk.goals.sleep.goalMax, 8);
  const tr = service.healthReference().dailyTrackers.find((t) => t.id === 'sleep');
  assert.equal(tr.source, 'MOH-GUIDE');
  service.setDaily(member, 'me', { type: 'sleep', clear: true });
  assert.equal(service.getDiary(member, 'me').daily.sleep, null);
  // The care team sees a patient's sleep in Progress, and never a member's.
  service.setDaily(asPatient('MZ-1001'), 'me', { type: 'sleep', value: 7 });
  assert.equal(service.getProgress(staff, ids['MZ-1001']).week.days.at(-1).sleep, 7);
});

// ---------------------------------------------------------------- small wins
test('longest run of days', () => {
  assert.equal(longestRun([]), 0);
  assert.equal(longestRun(['2026-11-01', '2026-11-02', '2026-11-04', '2026-11-05', '2026-11-06']), 3);
  assert.equal(longestRun(['2026-10-31', '2026-11-01']), 2, 'across a month end');
});

test('small wins are habits only, from existing data, and stay earned', () => {
  const days = (n, from = '2026-10-01') => Array.from({ length: n }, (_, i) => addDays(from, i));
  const none = computeWins({});
  assert.equal(none.earned, 0);
  assert.ok(!none.wins.some((w) => w.id.startsWith('checkin')), 'members have no check-in badges');
  assert.ok(WINS.every((w) => !/weight|kg|bmi/i.test(`${w.label} ${w.hint}`)), 'never about weight');
  const water = Object.fromEntries(days(5).map((d) => [d, 6]));
  water['2026-10-03'] = 5; // a break in the run
  const r = computeWins({
    loggedDates: days(8), daily: { water, steps: { '2026-10-02': 7500, '2026-10-03': 7501 }, sleep: Object.fromEntries(days(5).map((d) => [d, 7])) }, checkins: 1,
  });
  const by = Object.fromEntries(r.wins.map((w) => [w.id, w]));
  assert.equal(by['logged-7'].earned, true);
  assert.deepEqual([by['logged-30'].earned, by['logged-30'].n], [false, 8]);
  assert.deepEqual([by['water-5'].earned, by['water-5'].n], [false, 2], 'best run is 2 days');
  assert.equal(by['steps-goal'].earned, true, 'more than 7,500 steps');
  assert.equal(by['sleep-5'].earned, true);
  assert.equal(by['checkin-1'].earned, true);
  assert.deepEqual([by['checkin-4'].earned, by['checkin-4'].n], [false, 1]);
  assert.equal(r.total, 7);
});

test('wins from the service: members see their own, the care team only patients', () => {
  for (let i = 0; i < 7; i++) service.addDiaryEntry(member, 'me', { meal: 'lunch', foodId: 'moh:rice-cooked', servingIndex: 0, quantity: 1, date: addDays(today, -i) });
  for (let i = 0; i < 5; i++) service.setDaily(member, 'me', { type: 'water', value: 7, date: addDays(today, -i) });
  const w = service.getWins(member, 'me');
  const by = Object.fromEntries(w.wins.map((x) => [x.id, x]));
  assert.ok(by['logged-7'].earned && by['water-5'].earned);
  assert.equal(by['checkin-1'], undefined);
  assert.equal(service.getProgress(member, 'me').wins.earned, w.earned);
  const noura = asPatient('MZ-1001');
  service.saveCheckin(noura, 'me', { hunger: 3, energy: 4, mood: 4 });
  const pw = service.getWins(staff, ids['MZ-1001']);
  assert.equal(pw.wins.find((x) => x.id === 'checkin-1').earned, true);
  assert.equal(status(() => service.getWins(staff, 'me')), 403);
});
