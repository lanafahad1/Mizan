// Ramadan mode for the food diary. Ramadan is month 9 of the Umm al-Qura calendar
// (the official Saudi Hijri calendar), read through Intl ('islamic-umalqura').
// In Ramadan mode the diary's meals are relabelled; the stored meal ids do not
// change, so entries logged before, during or after Ramadan stay compatible:
//   breakfast → Suhoor, dinner → Iftar, snack → Snacks after Iftar,
//   lunch → hidden unless it already has entries.

export const RAMADAN_MODES = ['auto', 'on', 'off'];
export const RAMADAN_MONTH = 9;
export const RAMADAN_LABELS = { breakfast: 'Suhoor', lunch: 'Lunch', dinner: 'Iftar', snack: 'Snacks after Iftar' };

let fmt = null;
function hijriFormat() {
  // Built once; timeZone UTC with a noon time keeps the calendar day exact.
  fmt ??= new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', { timeZone: 'UTC', year: 'numeric', month: 'numeric', day: 'numeric' });
  return fmt;
}

/** The Umm al-Qura date of a Gregorian YYYY-MM-DD day: { year, month, day }, or null for a bad date. */
export function hijriDate(iso) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(iso ?? ''))) return null;
  const d = new Date(`${iso}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  const parts = Object.fromEntries(hijriFormat().formatToParts(d).filter((p) => p.type !== 'literal').map((p) => [p.type, p.value]));
  const year = Number.parseInt(parts.year, 10);
  const month = Number.parseInt(parts.month, 10);
  const day = Number.parseInt(parts.day, 10);
  return Number.isFinite(year) && Number.isFinite(month) && Number.isFinite(day) ? { year, month, day } : null;
}

/** True when the day falls in Ramadan (Umm al-Qura month 9). */
export const isRamadan = (iso) => hijriDate(iso)?.month === RAMADAN_MONTH;

export const cleanRamadanMode = (mode) => (RAMADAN_MODES.includes(mode) ? mode : 'auto');

/** Whether the diary shows Ramadan meals on that day: "on" always, "off" never, "auto" during Ramadan. */
export function ramadanActive(mode, iso) {
  const m = cleanRamadanMode(mode);
  return m === 'on' || (m === 'auto' && isRamadan(iso));
}

/**
 * Relabel the day's meals for Ramadan. Each meal keeps its id (and entries); lunch is
 * dropped when it is empty. Order: Suhoor, (Lunch), Iftar, Snacks after Iftar.
 */
export function ramadanMeals(meals) {
  return meals
    .filter((m) => m.id !== 'lunch' || (m.entries?.length ?? 0) > 0)
    .map((m) => ({ ...m, label: RAMADAN_LABELS[m.id] ?? m.label }));
}

/** Diabetes (type 1 or type 2) in a list of condition codes. */
export const hasDiabetes = (conditions = []) => conditions.some((c) => c === 't1d' || c === 't2d');
export const hasHypertension = (conditions = []) => conditions.includes('hypertension');
