// Synthetic health data for the demonstration: a member (sara.member) and a few
// hospital patients. Everything is fictional and generated relative to today.

import { addDays } from './dates.js';
import { searchFoods } from './food-db.js';
import { seedCareDemo } from './care-demo.js';

const safely = (fn) => { try { return fn(); } catch { return null; } };

/** First food whose name matches, for the demo diary (skips quietly when the food list changes). */
const food = (q, kinds = null) => searchFoods(q, { kinds, limit: 1 })[0] ?? null;

export function seedHealthDemo({ repo, service, today, patientIds = {} }) {
  const admin = { id: null, role: 'admin', name: 'Demo Admin', status: 'active' };
  const staff = { id: null, role: 'staff', name: 'Demo Healthcare Provider', status: 'active' };
  const asPatient = (demoId) => ({ id: null, role: 'patient', name: demoId, status: 'active', patientId: patientIds[demoId] });

  // ---- member: Sara, using Mizan on her own
  const u = repo.getUserByUsername('sara.member');
  if (u) {
    repo.deleteHealthOwner(`m:${u.id}`);
    const sara = { id: u.id, role: 'member', name: u.name, status: 'active' };
    safely(() => service.updateHealthProfile(sara, 'me', { about: { sex: 'female', age: 34, heightCm: 165, activity: 'light', goal: 'Walk after dinner and swap soft drinks for water.' }, conditions: ['obesity'], allergies: [] }));
    const weights = [84.2, 84.0, 83.9, 83.5, 83.6, 83.1, 82.8, 82.9, 82.5];
    weights.forEach((w, i) => safely(() => service.addReading(sara, 'me', { type: 'weight', value: w, date: addDays(today, -7 * (weights.length - 1 - i)) })));
    safely(() => service.addReading(sara, 'me', { type: 'waist', value: 92, date: addDays(today, -7) }));
    safely(() => service.addReading(sara, 'me', { type: 'bp', value: 128, value2: 82, date: addDays(today, -3) }));
    const a = safely(() => service.saveAssessment(sara, 'me', { answers: { age: 34, sex: 'female', heightCm: 165, weightKg: 84.2, weightDate: addDays(today, -56), measuredBy: 'self', conditions: ['obesity'], allergies: 'nka', sugaryDrinks: 'most-days', activity: 'light', helpWith: ['portions', 'labels'], goal: 'Walk after dinner and swap soft drinks for water.' } }));
    if (a) safely(() => service.submitAssessment(sara, 'me', a.id));
    safely(() => service.setHealthTargets(sara, 'me', { kcal: 1700, carbs: 200, protein: 90, fat: 55, sugar: 40, sodium: 2000 }));
    const log = (date, meal, q, servingIndex = 0, quantity = 1) => {
      const f = food(q);
      if (f) safely(() => service.addDiaryEntry(sara, 'me', { date, meal, foodId: f.id, servingIndex, quantity }));
    };
    for (const d of [2, 1, 0]) {
      const date = addDays(today, -d);
      log(date, 'breakfast', 'Arabic flat bread', 0, 2);
      log(date, 'breakfast', 'White cheese');
      log(date, 'breakfast', 'laban');
      if (d !== 0) {
        log(date, 'lunch', 'kabsa');
        log(date, 'snack', 'dates');
        log(date, 'dinner', 'lentil');
      }
    }
    safely(() => service.addDiaryEntry(sara, 'me', { date: today, meal: 'snack', quick: true, name: 'Coffee with cardamom and 3 dates', values: { kcal: 75, carbs: 18 } }));
  }

  // ---- hospital patients
  const n = patientIds['MZ-1001'];
  if (n) {
    safely(() => service.updateHealthProfile(asPatient('MZ-1001'), 'me', { about: { sex: 'female', age: 52, heightCm: 158, activity: 'sedentary' } }));
    [92.4, 92.1, 91.9, 91.6].forEach((w, i) => safely(() => service.addReading(staff, n, { type: 'weight', value: w, date: addDays(today, -(3 - i) * 2) })));
    safely(() => service.addReading(staff, n, { type: 'waist', value: 104, date: addDays(today, -6) }));
    [[148, 92, 5], [142, 90, 3], [136, 86, 1]].forEach(([s, d, ago]) => safely(() => service.addReading(staff, n, { type: 'bp', value: s, value2: d, date: addDays(today, -ago) })));
    [[168, 'fasting', 4], [151, 'fasting', 2], [182, 'after-meal', 1]].forEach(([v, c, ago]) => safely(() => service.addReading(staff, n, { type: 'glucose', value: v, context: c, date: addDays(today, -ago) })));
    const a = safely(() => service.saveAssessment(asPatient('MZ-1001'), 'me', { answers: { age: 52, sex: 'female', language: 'ar', heightCm: 158, weightKg: 92.4, weightDate: addDays(today, -6), measuredBy: 'staff', conditions: ['obesity', 't2d', 'hypertension'], prescribedDiet: 'yes', allergies: 'nka', mealsPerDay: 3, sugaryDrinks: 'occasionally', outsideFood: 'yes', appetite: 'usual', activity: 'sedentary', barriers: ['understanding'], helpWith: ['portions', 'home'], goal: 'Understand portions of rice and dates at home.', educationFormat: ['pictures', 'printable'] } }));
    if (a) {
      safely(() => service.submitAssessment(asPatient('MZ-1001'), 'me', a.id));
      safely(() => service.reviewAssessment(admin, n, a.id, { decision: 'approved', review: { confirmedConditions: 'Obesity class 2, type 2 diabetes, hypertension. Consistent-carbohydrate, sodium-restricted diet.', kcal: 1500, carbs: 180, sodium: 2000, sugar: 25, sugarType: 'added', education: 'Portion guide (MOH exchange list) and home meal plan at discharge.', nextReviewOn: addDays(today, 3) } }));
    }
    safely(() => service.addDiaryEntry(asPatient('MZ-1001'), 'me', { date: today, meal: 'snack', quick: true, name: 'Dates brought by family (estimate)', values: { kcal: 120, carbs: 30, sugar: 28 } }));
  }
  const f = patientIds['MZ-1002'];
  if (f) {
    safely(() => service.updateHealthProfile(asPatient('MZ-1002'), 'me', { about: { sex: 'male', age: 66, heightCm: 172, activity: 'sedentary' } }));
    safely(() => service.addReading(staff, f, { type: 'weight', value: 101.5, date: addDays(today, -5) }));
    safely(() => service.addReading(staff, f, { type: 'bp', value: 152, value2: 94, date: addDays(today, -1) }));
    const a = safely(() => service.saveAssessment(asPatient('MZ-1002'), 'me', { answers: { age: 66, sex: 'male', heightCm: 172, weightKg: 101.5, weightDate: addDays(today, -5), measuredBy: 'staff', conditions: ['obesity', 'hypertension', 'cvd'], allergies: 'nka', sugaryDrinks: 'daily', appetite: 'usual', activity: 'sedentary', helpWith: ['choosing', 'labels'], goal: 'Cut down on soft drinks.' } }));
    if (a) safely(() => service.submitAssessment(asPatient('MZ-1002'), 'me', a.id));
  }

  // ---- care team: provider profiles, care teams, goals, notes, check-ins and a conversation
  seedCareDemo({ repo, today, patientIds });
}
