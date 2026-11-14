// Personal health space: profile and targets, the assessment form, health
// readings, the food diary and custom foods. Used by two kinds of owner:
//   members  ('m:<user id>')    — private: only the member can read or change it
//   patients ('p:<patient id>') — the patient, plus the hospital care team
// Member records are never reachable by hospital staff or admins.
//
// Every value shown to the user names its source (see SOURCES in rules.js);
// targets a member sets are "personal estimates", targets from the care team
// are "care-team targets".

import { normalizeAnswers, normalizeReview, ASSESSMENT_SECTIONS } from './assessment.js';
import { bmi, bmiCategory, estimatedEnergy, suggestedTargets, waistRisk, ACTIVITY_LEVELS } from './calculator.js';
import { searchFoods, getFood, findByBarcode, nutrientsFor, servingsFor, customFoodFromLabel, FOODS } from './food-db.js';
import { scaleNutrition } from './nutrition.js';
import { PERIODS, PERIOD_IDS, INTAKE_AMOUNTS, portionFactor, ALLERGENS, CONDITIONS } from './constants.js';
import { addDays, isValidIso } from './dates.js';
import { nearestPlan } from '../data/moh-calorie-guide.js';

/** Nutrients tracked in the diary, in display order. */
export const DIARY_NUTRIENTS = [
  { key: 'kcal', label: 'Calories', unit: 'kcal', decimals: 0 },
  { key: 'carbs', label: 'Carbs', unit: 'g', decimals: 1 },
  { key: 'protein', label: 'Protein', unit: 'g', decimals: 1 },
  { key: 'fat', label: 'Fat', unit: 'g', decimals: 1 },
  { key: 'sugar', label: 'Sugar', unit: 'g', decimals: 1 },
  { key: 'satFat', label: 'Saturated fat', unit: 'g', decimals: 1 },
  { key: 'fiber', label: 'Fibre', unit: 'g', decimals: 1 },
  { key: 'sodium', label: 'Sodium', unit: 'mg', decimals: 0 },
];
const KEYS = DIARY_NUTRIENTS.map((n) => n.key);
const round = (v, d) => (v == null ? null : Math.round(v * 10 ** d) / 10 ** d);

export const READING_TYPES = [
  { id: 'weight', label: 'Weight', unit: 'kg', min: 20, max: 400, step: 0.1 },
  { id: 'height', label: 'Height', unit: 'cm', min: 50, max: 250, step: 0.5 },
  { id: 'waist', label: 'Waist', unit: 'cm', min: 30, max: 250, step: 0.5 },
  { id: 'bp', label: 'Blood pressure', unit: 'mmHg', min: 50, max: 260, min2: 30, max2: 160, step: 1 },
  { id: 'glucose', label: 'Blood sugar', unit: 'mg/dL', min: 20, max: 700, step: 1, units: ['mg/dL', 'mmol/L'], minMmol: 1, maxMmol: 40 },
];
/**
 * Daily trackers: one value per day, typed in by the person (a website cannot count
 * steps by itself). Goals come from the MOH Calorie Guide for Weight Loss (MOH-GUIDE):
 * 6–8 cups of water a day; more than 7,500 steps a day; at least 150 minutes of
 * moderate activity a week.
 */
export const DAILY_TRACKERS = [
  { id: 'water', label: 'Water', unit: 'cups', min: 0, max: 30, step: 1, goal: 8, goalMin: 6, goalText: 'MOH advises 6–8 cups of water a day.', source: 'MOH-GUIDE' },
  { id: 'steps', label: 'Steps', unit: 'steps', min: 0, max: 100000, step: 100, goal: 7500, goalText: 'MOH advises more than 7,500 steps a day.', source: 'MOH-GUIDE' },
  { id: 'activity', label: 'Active minutes', unit: 'min', min: 0, max: 600, step: 5, weeklyGoal: 150, goalText: 'MOH advises at least 150 minutes of moderate activity a week.', source: 'MOH-GUIDE' },
];
export const GLUCOSE_CONTEXT = [
  { id: 'fasting', label: 'Fasting' }, { id: 'before-meal', label: 'Before a meal' }, { id: 'after-meal', label: 'After a meal (2 h)' }, { id: 'random', label: 'Other time' },
];
export const TARGET_FIELDS = [
  { key: 'kcal', label: 'Calories', unit: 'kcal/day', min: 800, max: 5000 },
  { key: 'carbs', label: 'Carbohydrate', unit: 'g/day', min: 20, max: 700 },
  { key: 'protein', label: 'Protein', unit: 'g/day', min: 10, max: 400 },
  { key: 'fat', label: 'Fat', unit: 'g/day', min: 10, max: 300 },
  { key: 'sugar', label: 'Sugar', unit: 'g/day', min: 0, max: 300 },
  { key: 'satFat', label: 'Saturated fat', unit: 'g/day', min: 0, max: 150 },
  { key: 'fiber', label: 'Fibre', unit: 'g/day', min: 0, max: 100 },
  { key: 'sodium', label: 'Sodium', unit: 'mg/day', min: 300, max: 6000 },
];
const DIARY_MEALS = PERIOD_IDS; // breakfast, lunch, dinner, snack

export function createHealthService({ repo, today, stamp, requirePermission, accessPatient, invalid, deny, notFound, audit, catalog }) {
  // ------------------------------------------------------------ who owns the space
  /**
   * Resolve the health space addressed by `who`: 'me' (the signed-in member or
   * patient) or a hospital patient id (care team). Returns { owner, kind, patient }.
   */
  function space(actor, who, { write = false } = {}) {
    if (who === 'me' || who == null) {
      requirePermission(actor, 'health:own');
      if (actor.role === 'member') return { owner: `m:${actor.id}`, kind: 'member', patient: null, self: true };
      if (actor.role === 'patient' && actor.patientId) {
        const patient = accessPatient(actor, actor.patientId);
        return { owner: `p:${patient.id}`, kind: 'patient', patient, self: true };
      }
      deny('Your account is not linked to a health record yet.');
    }
    if (!/^\d{1,9}$/.test(String(who))) notFound('That health record does not exist.');
    requirePermission(actor, write ? 'health:team-record' : 'health:team-read');
    const patient = accessPatient(actor, who);
    return { owner: `p:${patient.id}`, kind: 'patient', patient, self: false };
  }
  const byWho = (actor) => ({ by: actor.name, byRole: actor.role });
  /**
   * Daily calories and carbs a healthcare provider set as goals (domain/care-service.js) are the
   * patient's targets for those two nutrients; other targets stay as reviewed.
   */
  function withGoals(sp, targets) {
    if (sp.kind !== 'patient') return targets ?? null;
    const g = repo.listHealth({ owner: sp.owner, kind: 'goal' }).at(-1);
    if (!g || (g.kcal == null && g.carbs == null)) return targets ?? null;
    return { ...(targets ?? {}), ...(g.kcal != null ? { kcal: g.kcal } : {}), ...(g.carbs != null ? { carbs: g.carbs } : {}) };
  }
  const auditIf = (sp, actor, action, detail) => { if (sp.kind === 'patient') audit(actor, sp.patient.id, action, detail); };

  // ------------------------------------------------------------ profile and targets
  const getProfileRec = (owner) => repo.listHealth({ owner, kind: 'profile' })[0] ?? null;
  function profileOf(sp) {
    const rec = getProfileRec(sp.owner);
    const p = rec ?? { about: {}, targets: null, targetsBasis: null };
    // Patients: conditions and allergies come from the hospital record (reviewed by the care team).
    if (sp.kind === 'patient') {
      p.conditions = sp.patient.conditions?.selected ?? [];
      p.allergies = sp.patient.allergies?.confirmed ?? [];
    }
    return p;
  }

  function cleanAbout(input = {}) {
    const out = {};
    const errors = {};
    if (input.sex != null && input.sex !== '') { if (['male', 'female'].includes(input.sex)) out.sex = input.sex; else errors.sex = 'Choose male or female.'; }
    if (input.age != null && input.age !== '') { const a = Number(input.age); if (Number.isInteger(a) && a >= 1 && a <= 120) out.age = a; else errors.age = 'Enter an age in years.'; }
    if (input.heightCm != null && input.heightCm !== '') { const h = Number(input.heightCm); if (h >= 100 && h <= 250) out.heightCm = h; else errors.heightCm = 'Enter a height between 100 and 250 cm.'; }
    if (input.activity != null && input.activity !== '') { if (ACTIVITY_LEVELS.some((l) => l.id === input.activity)) out.activity = input.activity; else errors.activity = 'Choose an activity level.'; }
    if (input.pregnant != null) out.pregnant = Boolean(input.pregnant);
    if (typeof input.goal === 'string' && input.goal.trim()) out.goal = input.goal.trim().slice(0, 200);
    return { about: out, errors };
  }
  const cleanCodes = (list, allowed) => [...new Set((Array.isArray(list) ? list : []).map(String))].filter((c) => allowed.some((a) => a.id === c));

  function cleanTargets(input = {}) {
    const out = {};
    const errors = {};
    for (const f of TARGET_FIELDS) {
      const raw = input[f.key];
      if (raw == null || raw === '') continue;
      const n = Number(raw);
      if (!Number.isFinite(n) || n < f.min || n > f.max) errors[f.key] = `Enter ${f.min}–${f.max} ${f.unit}.`;
      else out[f.key] = Math.round(n);
    }
    return { targets: out, errors };
  }

  function saveProfile(sp, actor, patch) {
    const old = getProfileRec(sp.owner);
    const next = { ...(old ?? { about: {}, targets: null, targetsBasis: null }), ...patch, updatedAt: stamp(), updatedBy: actor.name };
    if (old) return repo.updateHealth(old.id, next);
    return repo.addHealth({ owner: sp.owner, kind: 'profile', date: null, createdAt: stamp(), ...next });
  }

  function updateProfile(actor, who, body = {}) {
    const sp = space(actor, who, { write: true });
    const { about, errors } = cleanAbout(body.about ?? body);
    if (Object.keys(errors).length) invalid('Check the highlighted fields.', errors);
    const patch = { about: { ...(profileOf(sp).about ?? {}), ...about } };
    if (sp.kind === 'member') {
      if (body.conditions !== undefined) patch.conditions = cleanCodes(body.conditions, CONDITIONS);
      if (body.allergies !== undefined) patch.allergies = cleanCodes(body.allergies, ALLERGENS);
      if (typeof body.dislikes === 'string') patch.dislikes = body.dislikes.trim().slice(0, 200);
    }
    saveProfile(sp, actor, patch);
    auditIf(sp, actor, 'health.profile', 'Updated personal details');
    return getOverview(actor, who);
  }

  /** Members set their own targets; for hospital patients only the care team (admin) sets them. */
  function setTargets(actor, who, body = {}) {
    const sp = space(actor, who, { write: true });
    if (sp.kind === 'patient') requirePermission(actor, 'assessment:review', 'Only the care team (admin) can set a patient’s nutrition targets.');
    const { targets, errors } = cleanTargets(body.targets ?? body);
    if (Object.keys(errors).length) invalid('Check the highlighted targets.', errors);
    saveProfile(sp, actor, { targets, targetsBasis: sp.kind === 'member' ? 'personal' : 'care-team', targetsSetAt: stamp(), targetsSetBy: actor.name });
    auditIf(sp, actor, 'health.targets', `Set nutrition targets: ${Object.entries(targets).map(([k, v]) => `${k} ${v}`).join(', ') || 'cleared'}`);
    return getOverview(actor, who);
  }

  // ------------------------------------------------------------ readings
  function cleanReading(body = {}) {
    const type = READING_TYPES.find((t) => t.id === body.type);
    const errors = {};
    if (!type) invalid('Choose what you measured.', { type: 'Choose what you measured.' });
    const rec = { type: type.id, unit: type.unit };
    const v = Number(body.value);
    if (type.id === 'glucose' && body.unit === 'mmol/L') {
      rec.unit = 'mmol/L';
      if (!(v >= type.minMmol && v <= type.maxMmol)) errors.value = `Enter ${type.minMmol}–${type.maxMmol} mmol/L.`;
    } else if (!(v >= type.min && v <= type.max)) errors.value = `Enter ${type.min}–${type.max} ${type.unit}.`;
    rec.value = round(v, 1);
    if (type.id === 'bp') {
      const d = Number(body.value2);
      if (!(d >= type.min2 && d <= type.max2)) errors.value2 = `Enter the lower number (${type.min2}–${type.max2}).`;
      else if (d >= v) errors.value2 = 'The lower number must be smaller than the upper number.';
      rec.value2 = Math.round(d);
    }
    if (type.id === 'glucose' && body.context) {
      if (GLUCOSE_CONTEXT.some((c) => c.id === body.context)) rec.context = body.context; else errors.context = 'Choose when you measured.';
    }
    const date = body.date || today();
    if (!isValidIso(date) || date > today()) errors.date = 'Choose today or an earlier date.';
    if (typeof body.time === 'string' && /^\d{2}:\d{2}$/.test(body.time)) rec.time = body.time;
    if (typeof body.note === 'string' && body.note.trim()) rec.note = body.note.trim().slice(0, 200);
    if (Object.keys(errors).length) invalid('Check the reading.', errors);
    return { ...rec, date };
  }

  function addReading(actor, who, body) {
    const sp = space(actor, who, { write: true });
    const r = cleanReading(body);
    const rec = repo.addHealth({ owner: sp.owner, kind: 'reading', ...r, source: sp.self ? 'self' : 'staff', ...byWho(actor), createdAt: stamp() });
    auditIf(sp, actor, 'health.reading', `Recorded ${r.type}`);
    return rec;
  }
  function deleteReading(actor, who, id) {
    const sp = space(actor, who, { write: true });
    const rec = repo.getHealth(id);
    if (!rec || rec.owner !== sp.owner || rec.kind !== 'reading') notFound('We couldn’t find that reading. It may already be deleted.');
    if (sp.self && rec.source !== 'self') deny('Your care team added this reading, so only they can delete it.');
    repo.deleteHealth(rec.id);
    auditIf(sp, actor, 'health.reading-delete', `Deleted a ${rec.type} reading`);
    return { deleted: true };
  }
  function listReadings(actor, who, { type = null, days = 90 } = {}) {
    const sp = space(actor, who);
    const from = addDays(today(), -Math.min(365, Math.max(1, Number(days) || 90)));
    return repo.listHealth({ owner: sp.owner, kind: 'reading', from }).filter((r) => !type || r.type === type);
  }
  // ------------------------------------------------------------ daily trackers (water, steps, active minutes)
  const dailyOf = (owner, type, date) => repo.listHealth({ owner, kind: 'reading', date }).find((r) => r.type === type) ?? null;
  /** Set (replace) one day's value; `add` adds to it instead (e.g. +1 cup of water). */
  function setDaily(actor, who, body = {}) {
    const sp = space(actor, who, { write: true });
    const tr = DAILY_TRACKERS.find((x) => x.id === body.type);
    if (!tr) invalid('Choose water, steps or active minutes.', { type: 'Choose what to record.' });
    const date = body.date || today();
    if (!isValidIso(date) || date > today() || date < addDays(today(), -60)) invalid('Choose a date in the last 60 days.', { date: 'Out of range.' });
    const old = dailyOf(sp.owner, tr.id, date);
    // Clearing a day ("not logged" again).
    if (body.clear) { if (old) repo.deleteHealth(old.id); return { type: tr.id, value: null, date, goal: tr.goal ?? null }; }
    const raw = Number(body.add != null ? (old?.value ?? 0) + Number(body.add) : body.value);
    if (!Number.isFinite(raw)) invalid('Enter a number.', { value: 'Enter a number.' });
    const value = Math.max(tr.min, Math.min(tr.max, Math.round(raw)));
    if (body.add == null && (raw < tr.min || raw > tr.max)) invalid(`Enter ${tr.min}–${tr.max} ${tr.unit}.`, { value: `Enter ${tr.min}–${tr.max}.` });
    const rec = { type: tr.id, value, unit: tr.unit, date, source: sp.self ? 'self' : 'staff', ...byWho(actor) };
    const out = old ? repo.updateHealth(old.id, { ...old, ...rec, updatedAt: stamp() }) : repo.addHealth({ owner: sp.owner, kind: 'reading', ...rec, createdAt: stamp() });
    return { ...out, goal: tr.goal ?? null };
  }

  // ------------------------------------------------------------ week view
  /** Seven days ending on `to`: calories vs target, days logged, water, steps, active minutes, weight change. */
  function getWeek(actor, who, { to } = {}) {
    const sp = space(actor, who);
    const end = to && isValidIso(to) && to <= today() ? to : today();
    const from = addDays(end, -6);
    const target = withGoals(sp, profileOf(sp).targets)?.kcal ?? null;
    const days = [];
    for (let d = from; d <= end; d = addDays(d, 1)) {
      const own = repo.listHealth({ owner: sp.owner, kind: 'food', date: d });
      const entries = [...hospitalMeals(sp, d), ...own];
      const kcal = entries.reduce((n, e) => n + (e.nutrients?.kcal ?? 0), 0);
      days.push({
        date: d, kcal: Math.round(kcal), logged: entries.length > 0, target,
        water: dailyOf(sp.owner, 'water', d)?.value ?? null, steps: dailyOf(sp.owner, 'steps', d)?.value ?? null, activity: dailyOf(sp.owner, 'activity', d)?.value ?? null,
      });
    }
    const weights = repo.listHealth({ owner: sp.owner, kind: 'reading', from: addDays(end, -30), to: end }).filter((r) => r.type === 'weight');
    const inWeek = weights.filter((r) => r.date >= from);
    const before = weights.filter((r) => r.date < from).at(-1) ?? inWeek[0] ?? null;
    const last = weights.at(-1) ?? null;
    return {
      from, to: end, days, target,
      daysLogged: days.filter((x) => x.logged).length,
      activityMinutes: days.reduce((n, x) => n + (x.activity ?? 0), 0),
      weightChange: before && last && before.id !== last.id ? Math.round((last.value - before.value) * 10) / 10 : null,
      goals: Object.fromEntries(DAILY_TRACKERS.map((t) => [t.id, { goal: t.goal ?? null, goalMin: t.goalMin ?? null, weeklyGoal: t.weeklyGoal ?? null, text: t.goalText, unit: t.unit, label: t.label }])),
    };
  }

  // ------------------------------------------------------------ favourites and repeating a meal
  function toggleFavorite(actor, who, body = {}) {
    const sp = space(actor, who, { write: true });
    const id = String(body.foodId ?? '');
    if (!foodOrCustom(sp.owner, id)) notFound('We couldn’t find that food. Try searching for it again.');
    const list = profileOf(sp).favorites ?? [];
    const on = body.on ?? !list.includes(id);
    const favorites = on ? [...new Set([id, ...list])].slice(0, 100) : list.filter((x) => x !== id);
    saveProfile(sp, actor, { favorites });
    return { favorites, on };
  }
  function listFavorites(actor, who) {
    const sp = space(actor, who);
    return (profileOf(sp).favorites ?? []).map((id) => { const f = foodOrCustom(sp.owner, id); return f ? { ...f, id, servings: servingsFor(f) } : null; }).filter(Boolean);
  }
  /** Copy the foods logged for one meal of a day to another meal/day (hospital meals are not copied). */
  function repeatMeal(actor, who, body = {}) {
    const sp = space(actor, who, { write: true });
    const fromDate = body.fromDate || addDays(today(), -1);
    const toDate = body.toDate || today();
    for (const d of [fromDate, toDate]) if (!isValidIso(d) || d > addDays(today(), 1) || d < addDays(today(), -60)) invalid('Choose a date in the last 60 days.', { date: 'Out of range.' });
    if (!DIARY_MEALS.includes(body.meal)) invalid('Choose breakfast, lunch, dinner or a snack.', { meal: 'Choose a meal.' });
    const toMeal = DIARY_MEALS.includes(body.toMeal) ? body.toMeal : body.meal;
    const src = repo.listHealth({ owner: sp.owner, kind: 'food', date: fromDate }).filter((e) => e.meal === body.meal);
    if (!src.length) invalid('There’s nothing to copy from that meal.', { meal: 'Nothing to repeat.' });
    const added = src.map(({ id: _i, createdAt: _c, updatedAt: _u, owner: _o, kind: _k, date: _d, ...e }) => repo.addHealth({ ...e, owner: sp.owner, kind: 'food', date: toDate, meal: toMeal, ...byWho(actor), createdAt: stamp() }));
    auditIf(sp, actor, 'health.diary', `Repeated ${src.length} food(s) from ${fromDate} ${body.meal}`);
    return { added: added.length, entries: added };
  }

  // ------------------------------------------------------------ my foods (added from pack labels or barcodes)
  function listCustomFoods(actor, who) {
    const sp = space(actor, who);
    return repo.listHealth({ owner: sp.owner, kind: 'custom-food' }).map((r) => ({ ...r.food, id: `custom-${r.id}`, createdAt: r.createdAt }));
  }
  function customRecord(sp, id) {
    const rec = repo.getHealth(String(id).replace(/^custom-/, ''));
    if (!rec || rec.owner !== sp.owner || rec.kind !== 'custom-food') notFound('We couldn’t find that food in your foods. It may already be deleted.');
    return rec;
  }
  function updateCustomFood(actor, who, id, body = {}) {
    const sp = space(actor, who, { write: true });
    const rec = customRecord(sp, id);
    const { value: food, errors, warnings } = customFoodFromLabel(body);
    if (!food) invalid('Check the label values.', errors);
    const out = repo.updateHealth(rec.id, { ...rec, food: { ...food, basis: rec.food.basis, sourceId: rec.food.sourceId ?? null, checkLabel: rec.food.checkLabel, addedBy: rec.food.addedBy }, updatedAt: stamp() });
    return { ...out.food, id: `custom-${out.id}`, warnings };
  }
  function deleteCustomFood(actor, who, id) {
    const sp = space(actor, who, { write: true });
    const rec = customRecord(sp, id);
    repo.deleteHealth(rec.id);
    const favorites = (profileOf(sp).favorites ?? []).filter((x) => x !== `custom-${rec.id}`);
    saveProfile(sp, actor, { favorites });
    return { deleted: true };
  }

  const latest = (owner, type) => repo.listHealth({ owner, kind: 'reading' }).filter((r) => r.type === type).at(-1) ?? null;

  // ------------------------------------------------------------ assessment
  function listAssessments(actor, who) {
    const sp = space(actor, who);
    return repo.listHealth({ owner: sp.owner, kind: 'assessment' }).reverse();
  }

  function saveAssessment(actor, who, body = {}) {
    const sp = space(actor, who, { write: true });
    const { answers, errors } = normalizeAnswers(body.answers);
    if (Object.keys(errors).length) invalid('Check the highlighted answers.', errors);
    const open = repo.listHealth({ owner: sp.owner, kind: 'assessment' }).filter((a) => ['draft', 'more-info'].includes(a.status)).at(-1);
    if (open) return repo.updateHealth(open.id, { ...open, answers: { ...open.answers, ...answers }, updatedAt: stamp(), updatedBy: actor.name });
    return repo.addHealth({ owner: sp.owner, kind: 'assessment', date: today(), status: 'draft', answers, review: null, createdBy: actor.name, createdAt: stamp() });
  }

  /** Copy measured values and basic details from an assessment into the profile and readings. */
  function applyAnswers(sp, actor, a) {
    const ans = a.answers ?? {};
    const about = {};
    if (ans.sex) about.sex = ans.sex;
    if (ans.age) about.age = ans.age;
    if (ans.heightCm) about.heightCm = ans.heightCm;
    if (ans.activity) about.activity = ans.activity;
    if (ans.goal) about.goal = ans.goal;
    if (ans.pregnant) about.pregnant = ans.pregnant === 'yes';
    const patch = { about: { ...(profileOf(sp).about ?? {}), ...about } };
    if (sp.kind === 'member' && ans.conditions) patch.conditions = ans.conditions.filter((c) => CONDITIONS.some((x) => x.id === c) || c === 'obesity' || c === 'cvd');
    saveProfile(sp, actor, patch);
    const date = ans.weightDate && ans.weightDate <= today() ? ans.weightDate : today();
    const source = ans.measuredBy === 'staff' && !sp.self ? 'staff' : 'self';
    for (const [type, value] of [['weight', ans.weightKg], ['height', ans.heightCm], ['waist', ans.waistCm]]) {
      if (value == null) continue;
      const t = READING_TYPES.find((x) => x.id === type);
      repo.addHealth({ owner: sp.owner, kind: 'reading', type, value, unit: t.unit, date, source, note: 'From the assessment', ...byWho(actor), createdAt: stamp() });
    }
  }

  function submitAssessment(actor, who, id) {
    const sp = space(actor, who, { write: true });
    const a = repo.getHealth(id);
    if (!a || a.owner !== sp.owner || a.kind !== 'assessment') notFound('That assessment does not exist.');
    if (!['draft', 'more-info'].includes(a.status)) invalid('This assessment was already sent.');
    applyAnswers(sp, actor, a);
    const status = sp.kind === 'member' ? 'completed' : 'awaiting-review';
    const out = repo.updateHealth(a.id, { ...a, status, submittedAt: stamp(), submittedBy: actor.name });
    auditIf(sp, actor, 'health.assessment', 'Sent the nutrition assessment for care-team review');
    return out;
  }

  /** Care-team review (hospital only): approve with targets, or ask for more information. */
  function reviewAssessment(actor, who, id, body = {}) {
    const sp = space(actor, who, { write: true });
    requirePermission(actor, 'assessment:review', 'Only the care team (admin) can review assessments.');
    if (sp.kind !== 'patient') deny();
    const a = repo.getHealth(id);
    if (!a || a.owner !== sp.owner || a.kind !== 'assessment') notFound('That assessment does not exist.');
    if (!['awaiting-review', 'more-info', 'approved'].includes(a.status)) invalid('The patient has not sent this assessment yet.');
    const { answers: review, errors } = normalizeReview(body.review);
    if (Object.keys(errors).length) invalid('Check the highlighted fields.', errors);
    if (review.nextReviewOn && review.nextReviewOn < today()) invalid('The next review date cannot be in the past.', { nextReviewOn: 'Choose today or a later date.' });
    const decision = body.decision === 'more-info' ? 'more-info' : 'approved';
    const note = typeof body.note === 'string' ? body.note.trim().slice(0, 400) : '';
    if (decision === 'more-info' && !note) invalid('Tell the patient what information is needed.', { note: 'Required when asking for more information.' });
    const out = repo.updateHealth(a.id, { ...a, status: decision, review, reviewNote: note || null, reviewedAt: stamp(), reviewedBy: actor.name, nextReviewOn: review.nextReviewOn ?? null });
    if (decision === 'approved') {
      const targets = {};
      if (review.kcal) targets.kcal = review.kcal;
      if (review.carbs) targets.carbs = review.carbs;
      if (review.fat) targets.fat = review.fat;
      if (review.sodium) targets.sodium = review.sodium;
      if (review.sugar) targets.sugar = review.sugar;
      saveProfile(sp, actor, { targets, targetsBasis: 'care-team', targetsSetAt: stamp(), targetsSetBy: actor.name, sugarType: review.sugarType ?? null, nextReviewOn: review.nextReviewOn ?? null });
    }
    audit(actor, sp.patient.id, 'health.assessment-review', decision === 'approved' ? 'Approved the nutrition plan' : 'Asked for more information on the assessment');
    return out;
  }

  // ------------------------------------------------------------ food diary
  function foodOrCustom(owner, foodId) {
    if (String(foodId).startsWith('custom-')) {
      const rec = repo.getHealth(String(foodId).slice(7));
      if (!rec || rec.kind !== 'custom-food' || rec.owner !== owner) return null;
      return rec.food;
    }
    return getFood(foodId);
  }

  function addDiaryEntry(actor, who, body = {}) {
    const sp = space(actor, who, { write: true });
    const date = body.date || today();
    if (!isValidIso(date) || date > addDays(today(), 1) || date < addDays(today(), -60)) invalid('Choose a date in the last 60 days.', { date: 'Out of range.' });
    if (!DIARY_MEALS.includes(body.meal)) invalid('Choose breakfast, lunch, dinner or a snack.', { meal: 'Choose a meal.' });
    const base = { owner: sp.owner, kind: 'food', date, meal: body.meal, source: sp.self ? 'self' : 'staff', ...byWho(actor), createdAt: stamp() };
    let entry;
    if (body.quick) {
      // Quick add: the person types the values; marked as self-entered.
      const name = String(body.name ?? '').trim().slice(0, 80) || 'Quick add';
      const values = {};
      const errors = {};
      for (const n of DIARY_NUTRIENTS) {
        const raw = body.values?.[n.key];
        if (raw == null || raw === '') continue;
        const v = Number(raw);
        if (!Number.isFinite(v) || v < 0 || v > (n.key === 'kcal' ? 5000 : n.key === 'sodium' ? 20000 : 500)) errors[n.key] = 'Enter a realistic amount.';
        else values[n.key] = round(v, n.decimals);
      }
      if (values.kcal == null) errors.kcal = 'Enter the calories.';
      if (Object.keys(errors).length) invalid('Check the values.', errors);
      entry = { ...base, name, amountLabel: 'Quick add', nutrients: Object.fromEntries(KEYS.map((k) => [k, values[k] ?? null])), basis: 'self-entered', sourceId: null };
    } else {
      const food = foodOrCustom(sp.owner, body.foodId);
      if (!food) notFound('We couldn’t find that food. Try searching for it again.');
      const quantity = Number(body.quantity ?? 1);
      let n;
      let amountLabel;
      if (body.grams != null && body.grams !== '') {
        const g = Number(body.grams);
        if (!(g > 0 && g <= 3000)) invalid('Enter an amount between 1 and 3,000 g.', { grams: 'Enter 1–3,000 g.' });
        try { n = nutrientsFor(food, { grams: g }); } catch (e) {
          if (e?.code === 'PORTION_ONLY' || e instanceof RangeError) invalid('This food can only be logged by portion.', { grams: 'Choose a portion instead.' });
          throw e;
        }
        if (!n) invalid('This food can only be logged by portion.', { grams: 'Choose a portion instead.' });
        amountLabel = `${round(g, 1)} g`;
      } else {
        const servings = servingsFor(food);
        const i = Number(body.servingIndex ?? 0);
        if (!servings[i]) invalid('Choose a portion.', { servingIndex: 'Choose a portion.' });
        if (!(quantity > 0 && quantity <= 20)) invalid('Enter how many portions (up to 20).', { quantity: 'Enter 0.25–20.' });
        n = nutrientsFor(food, { servingIndex: i, quantity });
        amountLabel = `${quantity} × ${servings[i].label}`;
      }
      entry = {
        ...base, foodId: String(body.foodId), name: food.name, nameAr: food.nameAr ?? null, brand: food.brand ?? null, amountLabel,
        nutrients: Object.fromEntries(KEYS.map((k) => [k, n?.[k] ?? null])), basis: food.basis ?? null, sourceId: food.sourceId ?? null,
        amount: body.grams != null && body.grams !== '' ? { grams: Number(body.grams) } : { servingIndex: Number(body.servingIndex ?? 0), quantity },
      };
      // The same food added again to the same meal and day, by the same kind of amount, is merged into one row.
      const same = repo.listHealth({ owner: sp.owner, kind: 'food', date }).find((e) => e.meal === body.meal && e.foodId === entry.foodId && e.amount
        && ((e.amount.grams != null && entry.amount.grams != null) || (e.amount.servingIndex != null && e.amount.servingIndex === entry.amount.servingIndex)));
      if (same) {
        const merged = same.amount.grams != null ? { grams: same.amount.grams + entry.amount.grams } : { servingIndex: same.amount.servingIndex, quantity: same.amount.quantity + entry.amount.quantity };
        return updateDiaryAmount(sp, actor, same, merged);
      }
    }
    const rec = repo.addHealth(entry);
    auditIf(sp, actor, 'health.diary', `Logged ${entry.name} (${body.meal})`);
    return rec;
  }

  /** Recompute an entry for a new amount ({grams} or {servingIndex, quantity}). */
  function updateDiaryAmount(sp, actor, rec, amount) {
    const food = foodOrCustom(sp.owner, rec.foodId);
    if (!food) notFound('That food is no longer in our list. Try a similar one instead.');
    let n;
    let amountLabel;
    if (amount.grams != null) {
      const g = Number(amount.grams);
      if (!(g > 0 && g <= 3000)) invalid('Enter an amount between 1 and 3,000 g.', { grams: 'Enter 1–3,000 g.' });
      try { n = nutrientsFor(food, { grams: g }); } catch { invalid('This food can only be logged by portion.', { grams: 'Choose a portion instead.' }); }
      amountLabel = `${round(g, 1)} g`;
      amount = { grams: round(g, 1) };
    } else {
      const servings = servingsFor(food);
      const i = Number(amount.servingIndex ?? 0);
      const q = Number(amount.quantity ?? 1);
      if (!servings[i]) invalid('Choose a portion.', { servingIndex: 'Choose a portion.' });
      if (!(q > 0 && q <= 20)) invalid('Enter how many portions (up to 20).', { quantity: 'Enter 0.25–20.' });
      n = nutrientsFor(food, { servingIndex: i, quantity: q });
      amountLabel = `${q} × ${servings[i].label}`;
      amount = { servingIndex: i, quantity: q };
    }
    return repo.updateHealth(rec.id, { ...rec, amount, amountLabel, nutrients: Object.fromEntries(KEYS.map((k) => [k, n?.[k] ?? null])), updatedAt: stamp(), ...byWho(actor) });
  }

  /** Change the amount of a diary entry (or move it to another meal). */
  function updateDiaryEntry(actor, who, id, body = {}) {
    const sp = space(actor, who, { write: true });
    let rec = repo.getHealth(id);
    if (!rec || rec.owner !== sp.owner || rec.kind !== 'food') notFound('We couldn’t find that entry. It may already be removed.');
    if (body.meal != null) {
      if (!DIARY_MEALS.includes(body.meal)) invalid('Choose breakfast, lunch, dinner or a snack.', { meal: 'Choose a meal.' });
      rec = repo.updateHealth(rec.id, { ...rec, meal: body.meal, updatedAt: stamp() });
    }
    if (body.grams != null || body.quantity != null || body.servingIndex != null) {
      if (!rec.foodId) invalid('To change a quick add, remove it and add it again.', { quantity: 'Not editable.' });
      const amount = body.grams != null && body.grams !== '' ? { grams: body.grams } : { servingIndex: body.servingIndex ?? rec.amount?.servingIndex ?? 0, quantity: body.quantity ?? rec.amount?.quantity ?? 1 };
      rec = updateDiaryAmount(sp, actor, rec, amount);
    }
    return rec;
  }

  /** Put back a deleted entry (the "Undo" after removing). */
  function restoreDiaryEntry(actor, who, body = {}) {
    const sp = space(actor, who, { write: true });
    const e = body.entry;
    if (!e || e.kind !== 'food' || e.owner !== sp.owner) invalid('There’s nothing to put back.');
    const { id: _i, ...rest } = e;
    return repo.addHealth({ ...rest, owner: sp.owner, kind: 'food', createdAt: e.createdAt ?? stamp() });
  }

  function deleteDiaryEntry(actor, who, id) {
    const sp = space(actor, who, { write: true });
    const rec = repo.getHealth(id);
    if (!rec || rec.owner !== sp.owner || rec.kind !== 'food') notFound('We couldn’t find that entry. It may already be removed.');
    repo.deleteHealth(rec.id);
    return { deleted: true, entry: rec };
  }

  /** Hospital meals a patient ate on a date, from intake records (patient's own report first). */
  function hospitalMeals(sp, date) {
    if (sp.kind !== 'patient') return [];
    const rows = repo.listIntake({ patientId: sp.patient.id, date });
    const bySlot = new Map();
    for (const r of rows) if (!bySlot.has(r.period) || r.source === 'patient') bySlot.set(r.period, r);
    const out = [];
    for (const r of bySlot.values()) {
      const meal = catalog().byId[r.mealId];
      const share = INTAKE_AMOUNTS.find((x) => x.id === r.amount)?.share ?? null;
      const per = meal?.nutrition?.perServing ?? null;
      const scaled = per && share != null ? scaleNutrition(per, portionFactor(r.portion) * share) : null;
      out.push({
        id: `intake-${r.id}`, meal: r.period, name: r.mealName ?? meal?.name ?? 'Hospital meal', amountLabel: `${INTAKE_AMOUNTS.find((x) => x.id === r.amount)?.label ?? ''} · ${r.portion} portion`,
        nutrients: Object.fromEntries(KEYS.map((k) => [k, scaled?.[k] ?? null])), basis: meal?.nutrition?.source ?? null, hospital: true, readOnly: true,
      });
    }
    return out;
  }

  function sumEntries(entries) {
    const totals = {};
    const missing = {};
    for (const k of KEYS) {
      let s = 0;
      let lacking = 0;
      for (const e of entries) { if (e.nutrients?.[k] == null) lacking++; else s += e.nutrients[k]; }
      const d = DIARY_NUTRIENTS.find((n) => n.key === k).decimals;
      totals[k] = round(s, d);
      missing[k] = lacking;
    }
    return { totals, missing };
  }

  function getDiary(actor, who, { date } = {}) {
    const sp = space(actor, who);
    const day = date && isValidIso(date) ? date : today();
    const own = repo.listHealth({ owner: sp.owner, kind: 'food', date: day });
    const entries = [...hospitalMeals(sp, day), ...own];
    const meals = DIARY_MEALS.map((m) => {
      const list = entries.filter((e) => e.meal === m);
      return { id: m, label: PERIODS.find((p) => p.id === m)?.label ?? m, entries: list, ...sumEntries(list) };
    });
    const profile = profileOf(sp);
    const { totals, missing } = sumEntries(entries);
    const estimated = own.some((e) => e.basis === 'self-entered' || e.basis === 'community');
    return {
      date: day, today: today(), owner: sp.kind, meals, totals, missing, estimated, nutrients: DIARY_NUTRIENTS,
      targets: withGoals(sp, profile.targets), targetsBasis: withGoals(sp, profile.targets) !== (profile.targets ?? null) ? 'care-team' : profile.targetsBasis ?? null,
      recent: recentFoods(sp.owner),
      favorites: profile.favorites ?? [],
      daily: Object.fromEntries(DAILY_TRACKERS.map((t) => [t.id, dailyOf(sp.owner, t.id, day)?.value ?? null])),
    };
  }

  /** The person's most recently logged foods, for one-tap re-logging. */
  function recentFoods(owner) {
    const seen = new Set();
    const out = [];
    for (const e of repo.listHealth({ owner, kind: 'food', from: addDays(today(), -30) }).reverse()) {
      if (!e.foodId || seen.has(e.foodId)) continue;
      seen.add(e.foodId);
      // the food's picture recipe (lib/art.js foodArt), so the row shows the food itself
      out.push({ foodId: e.foodId, name: e.name, brand: e.brand, amountLabel: e.amountLabel, kcal: e.nutrients?.kcal ?? null, art: getFood(e.foodId)?.art ?? null });
      if (out.length >= 8) break;
    }
    return out;
  }

  // ------------------------------------------------------------ foods
  function findFoods(actor, { q = '', kinds = null, who = null, group = null, limit = 25 } = {}) {
    const max = Math.min(200, Math.max(1, Number(limit) || 25));
    // Browsing a shelf (no search text): the foods of that kind/group, Saudi sources first.
    if (!String(q).trim() && (kinds || group)) {
      return FOODS.filter((f) => (!kinds || kinds.includes(f.kind)) && (!group || f.group === group)).slice(0, max).map((f) => ({ ...f, servings: servingsFor(f) }));
    }
    const list = searchFoods(String(q).slice(0, 60), { kinds, limit: max });
    if (!actor || !q) return list;
    // A signed-in member or patient also searches their own custom foods.
    try {
      const sp = space(actor, who ?? 'me');
      const term = String(q).toLowerCase();
      const mine = repo.listHealth({ owner: sp.owner, kind: 'custom-food' })
        .filter((r) => `${r.food.name} ${r.food.brand ?? ''}`.toLowerCase().includes(term))
        .map((r) => ({ ...r.food, id: `custom-${r.id}` }));
      return [...mine, ...list].slice(0, 25);
    } catch { return list; }
  }
  function getFoodDetail(actor, id, who = 'me') {
    let food = null;
    if (String(id).startsWith('custom-')) { const sp = space(actor, who); food = foodOrCustom(sp.owner, id); if (food) food = { ...food, id }; }
    else food = getFood(id);
    if (!food) notFound('We couldn’t find that food. Try searching for it again.');
    return { ...food, servings: servingsFor(food) };
  }
  const lookupBarcode = (code) => {
    if (!/^\d{6,14}$/.test(String(code))) invalid('A barcode has 6 to 14 digits.', { barcode: 'Enter the digits under the barcode.' });
    return findByBarcode(String(code));
  };

  function addCustomFood(actor, who, body = {}) {
    const sp = space(actor, who, { write: true });
    const { value: food, errors, warnings } = customFoodFromLabel(body);
    if (!food) invalid('Check the label values.', errors);
    // Values copied from Open Food Facts (online barcode lookup) keep that source: community data, check the label.
    const fromOff = body.origin === 'OFF';
    const rec = repo.addHealth({ owner: sp.owner, kind: 'custom-food', date: null, food: { ...food, basis: fromOff ? 'community' : 'label', sourceId: fromOff ? 'OFF' : null, checkLabel: fromOff || undefined, addedBy: actor.name }, createdAt: stamp() });
    return { ...rec.food, id: `custom-${rec.id}`, warnings };
  }

  // ------------------------------------------------------------ overview
  function getOverview(actor, who) {
    const sp = space(actor, who);
    const profile = profileOf(sp);
    const about = profile.about ?? {};
    const weight = latest(sp.owner, 'weight');
    const heightCm = about.heightCm ?? latest(sp.owner, 'height')?.value ?? null;
    const waist = latest(sp.owner, 'waist');
    const b = weight && heightCm ? bmi(weight.value, heightCm) : null;
    const energy = weight && heightCm ? estimatedEnergy({ sex: about.sex, weightKg: weight.value, heightCm, age: about.age, activity: about.activity, pregnantOrBreastfeeding: about.pregnant }) : null;
    const assessments = repo.listHealth({ owner: sp.owner, kind: 'assessment' });
    const readings = repo.listHealth({ owner: sp.owner, kind: 'reading', from: addDays(today(), -180) });
    const targets = profile.targets ?? null;
    return {
      kind: sp.kind, self: sp.self, patientId: sp.patient?.id ?? null, demoId: sp.patient?.demoId ?? null, name: sp.patient?.preferredName ?? null,
      profile: { about, conditions: profile.conditions ?? [], allergies: profile.allergies ?? [], dislikes: profile.dislikes ?? '', nextReviewOn: profile.nextReviewOn ?? null, updatedAt: profile.updatedAt ?? null },
      targets, targetsBasis: profile.targetsBasis ?? null, targetsSetAt: profile.targetsSetAt ?? null, targetsSetBy: profile.targetsSetBy ?? null,
      body: {
        weight, heightCm, waist, bmi: b, bmiCategory: bmiCategory(b), waistRisk: waist ? waistRisk(about.sex, waist.value) : null,
        energy: energy?.kcal ? energy : null, energyNote: energy?.notApplicable ?? null,
        suggested: energy?.kcal ? suggestedTargets(energy) : null,
      },
      plan: targets?.kcal ? nearestPlan(targets.kcal) : null,
      latest: Object.fromEntries(READING_TYPES.map((t) => [t.id, latest(sp.owner, t.id)])),
      readings,
      assessment: assessments.at(-1) ?? null,
      assessmentCount: assessments.length,
      today: (() => { const d = getDiary(actor, who); return { totals: d.totals, missing: d.missing, targets: d.targets }; })(),
    };
  }

  /** Hospital dashboard: assessments waiting and reviews due (care team only; never member data). */
  function healthWorklist(actor) {
    requirePermission(actor, 'health:team-read');
    const t = today();
    const soon = addDays(t, 7);
    const rows = repo.listHealth({ ownerPrefix: 'p:' });
    const waiting = rows.filter((r) => r.kind === 'assessment' && r.status === 'awaiting-review').map((r) => ({ patientId: r.owner.slice(2), id: r.id, submittedAt: r.submittedAt }));
    const due = rows.filter((r) => r.kind === 'profile' && r.nextReviewOn && r.nextReviewOn <= soon).map((r) => ({ patientId: r.owner.slice(2), nextReviewOn: r.nextReviewOn, overdue: r.nextReviewOn < t }));
    return { waiting, due };
  }

  const reference = () => ({
    sections: ASSESSMENT_SECTIONS, readingTypes: READING_TYPES, dailyTrackers: DAILY_TRACKERS, glucoseContext: GLUCOSE_CONTEXT, targetFields: TARGET_FIELDS, nutrients: DIARY_NUTRIENTS, activityLevels: ACTIVITY_LEVELS,
  });

  return {
    api: {
      getHealthOverview: getOverview, updateHealthProfile: updateProfile, setHealthTargets: setTargets,
      listReadings, addReading, deleteReading,
      listAssessments, saveAssessment, submitAssessment, reviewAssessment,
      getDiary, addDiaryEntry, deleteDiaryEntry, updateDiaryEntry, restoreDiaryEntry,
      findFoods, getFoodDetail, lookupBarcode, addCustomFood, listCustomFoods, updateCustomFood, deleteCustomFood,
      setDaily, getWeek, toggleFavorite, listFavorites, repeatMeal,
      healthWorklist, healthReference: reference,
    },
  };
}
