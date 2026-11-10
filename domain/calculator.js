// BMI and estimated daily energy, exactly as the Saudi Ministry of Health
// calculators compute them (source MOH-CALC in rules.js; read from the MOH
// calorie calculator page script):
//   BMR (Mifflin-St Jeor)  men:   10 × weight kg + 6.25 × height cm − 5 × age + 5
//                          women: 10 × weight kg + 6.25 × height cm − 5 × age − 161
//   daily energy = BMR × activity factor, rounded to whole kcal
//   BMI = weight kg ÷ (height m)²
// BMI categories follow MOH (and the Saudi obesity guideline, MOH-OBESITY).
// MOH rounds BMI to a whole number; CareBite shows one decimal place.
//
// These are estimates for adults. They are not a prescription: in hospital the
// care team sets the targets; a member's own targets are personal estimates.

import { WAIST_RISK, nearestPlan, EXCHANGE_GROUPS } from '../data/moh-calorie-guide.js';

export const ACTIVITY_LEVELS = [
  { id: 'sedentary', label: 'Sedentary', hint: 'Little or no exercise', factor: 1.2 },
  { id: 'light', label: 'Light activity', hint: 'Exercise 1–3 times a week', factor: 1.375 },
  { id: 'moderate', label: 'Moderately active', hint: 'Exercise 3–5 times a week', factor: 1.55 },
  { id: 'very', label: 'Very active', hint: 'Exercise 6–7 times a week', factor: 1.725 },
  { id: 'extra', label: 'Extra active', hint: 'Very hard exercise or a physical job', factor: 1.9 },
];

export const BMI_CATEGORIES = [
  { id: 'underweight', label: 'Underweight', min: 0, max: 18.5 },
  { id: 'healthy', label: 'Healthy weight', min: 18.5, max: 25 },
  { id: 'overweight', label: 'Overweight', min: 25, max: 30 },
  { id: 'obese-1', label: 'Obesity class 1', min: 30, max: 35 },
  { id: 'obese-2', label: 'Obesity class 2', min: 35, max: 40 },
  { id: 'obese-3', label: 'Obesity class 3', min: 40, max: Infinity },
];

/** Accepted input ranges (adults). */
export const CALC_LIMITS = { weightKg: [20, 400], heightCm: [100, 250], age: [18, 120] };

const num = (v) => (v === '' || v == null ? NaN : Number(v));
const inRange = (v, [lo, hi]) => Number.isFinite(v) && v >= lo && v <= hi;

/** BMI to one decimal, or null when the inputs are out of range. */
export function bmi(weightKg, heightCm) {
  const w = num(weightKg);
  const h = num(heightCm);
  if (!inRange(w, CALC_LIMITS.weightKg) || !inRange(h, CALC_LIMITS.heightCm)) return null;
  return Math.round((w / (h / 100) ** 2) * 10) / 10;
}

export function bmiCategory(value) {
  if (value == null || !Number.isFinite(value)) return null;
  return BMI_CATEGORIES.find((c) => value >= c.min && value < c.max) ?? null;
}

/**
 * MOH estimated daily energy. Returns { bmr, kcal, factor } or { notApplicable: reason }
 * when the MOH equation does not apply (under 18, pregnancy or breastfeeding),
 * or null when an input is missing or out of range.
 */
export function estimatedEnergy({ sex, weightKg, heightCm, age, activity, pregnantOrBreastfeeding = false }) {
  const a = num(age);
  if (pregnantOrBreastfeeding) return { notApplicable: 'Energy needs change during pregnancy and breastfeeding, so a healthcare professional should set your targets.' };
  if (Number.isFinite(a) && a < CALC_LIMITS.age[0]) return { notApplicable: 'This calculator is for adults (18 or older). A healthcare professional decides targets for younger people.' };
  const w = num(weightKg);
  const h = num(heightCm);
  const level = ACTIVITY_LEVELS.find((l) => l.id === activity);
  if (!['male', 'female'].includes(sex) || !level || !inRange(w, CALC_LIMITS.weightKg) || !inRange(h, CALC_LIMITS.heightCm) || !inRange(a, CALC_LIMITS.age)) return null;
  const bmr = 10 * w + 6.25 * h - 5 * a + (sex === 'male' ? 5 : -161);
  return { bmr: Math.round(bmr), kcal: Math.round(bmr * level.factor), factor: level.factor };
}

/** Field problems for the calculator form, keyed by field (empty object when fine). */
export function calculatorProblems(input) {
  const out = {};
  if (!['male', 'female'].includes(input.sex)) out.sex = 'Choose male or female, as the Ministry of Health formula is different for each.';
  if (!inRange(num(input.weightKg), CALC_LIMITS.weightKg)) out.weightKg = 'Enter a weight between 20 and 400 kg.';
  if (!inRange(num(input.heightCm), CALC_LIMITS.heightCm)) out.heightCm = 'Enter a height between 100 and 250 cm.';
  const a = num(input.age);
  if (!Number.isFinite(a) || a < 1 || a > 120) out.age = 'Enter an age in years.';
  if (!ACTIVITY_LEVELS.some((l) => l.id === input.activity)) out.activity = 'Choose an activity level.';
  return out;
}

// ---- Waist circumference and daily targets from MOH (source MOH-GUIDE)

/** MOH waist risk: 'normal' | 'increased' | 'high', or null when unknown. */
export function waistRisk(sex, waistCm) {
  const cut = WAIST_RISK[sex];
  const w = Number(waistCm);
  if (!cut || !Number.isFinite(w) || w <= 0) return null;
  if (w >= cut.high) return { id: 'high', label: 'High risk', at: cut.high };
  if (w >= cut.increased) return { id: 'increased', label: 'Increased risk', at: cut.increased };
  return { id: 'normal', label: 'Below the Ministry of Health risk level', at: cut.increased };
}

/** Grams of carbs, protein and fat in an MOH plan, added up from its daily exchanges (MOH does not state every macro for every group). */
export function planMacros(plan) {
  if (!plan) return null;
  const out = { carbs: 0, protein: 0, fat: 0 };
  for (const [group, n] of Object.entries(plan.day)) {
    const g = EXCHANGE_GROUPS.find((x) => x.id === group);
    for (const k of Object.keys(out)) out[k] += (g[k] ?? 0) * n;
  }
  return out;
}

/**
 * Suggested personal targets from Saudi government sources:
 * energy from the MOH calculator; carbs/protein/fat from the nearest MOH meal plan;
 * sodium 2,000 mg (MOH/SFDA salt advice); added sugar ≤ 6 teaspoons (MOH guide).
 */
export function suggestedTargets(energy) {
  if (!energy?.kcal) return null;
  const plan = nearestPlan(energy.kcal);
  const m = planMacros(plan);
  return {
    kcal: energy.kcal, carbs: m.carbs, protein: m.protein, fat: m.fat, sodium: 2000, addedSugarTsp: 6,
    planKcal: plan.kcal, sources: { kcal: 'MOH-CALC', carbs: 'MOH-GUIDE', protein: 'MOH-GUIDE', fat: 'MOH-GUIDE', sodium: 'MOH-SALT', addedSugarTsp: 'MOH-GUIDE' },
  };
}
