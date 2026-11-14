'use client';
// Meal names for the diary. In Ramadan mode (domain/ramadan.js) the same meal ids
// get Ramadan names: breakfast → Suhoor, dinner → Iftar, snack → Snacks after Iftar;
// lunch is hidden unless it already has food. Components inside <MealNamesProvider
// ramadan> use these names; everywhere else keeps the usual names.
import * as React from 'react';
import { RAMADAN_LABELS } from '@/domain/ramadan.js';
import { useT } from '@/components/site/lang';
import type { Lang } from '@/lib/i18n';
import { MEAL_IDS, MEAL_LABELS, mealIn, type MealId } from './types';

const RamadanCtx = React.createContext(false);

/** The meal names inside a sentence ("Added dates to Suhoor."). */
const IN_EN: Record<MealId, string> = { breakfast: 'Suhoor', lunch: 'lunch', dinner: 'Iftar', snack: 'snacks after Iftar' };
const IN_AR: Record<MealId, string> = { breakfast: 'السحور', lunch: 'الغداء', dinner: 'الإفطار', snack: 'الوجبات الخفيفة بعد الإفطار' };

export function MealNamesProvider({ ramadan, children }: { ramadan: boolean; children: React.ReactNode }) {
  return <RamadanCtx.Provider value={ramadan}>{children}</RamadanCtx.Provider>;
}

/** The meal names for Ramadan mode or the usual ones (also usable outside the provider). */
export function makeMealNames(ramadan: boolean, lang: Lang) {
  return {
    ramadan,
    /** The English label (translate it with t()). */
    label: (id: MealId) => (ramadan ? (RAMADAN_LABELS as Record<MealId, string>)[id] : MEAL_LABELS[id]),
    /** The name inside a sentence, already in the page language. `lower` matches the usual "to breakfast". */
    inSentence: (id: MealId, lower = true) => {
      if (ramadan) return lang === 'ar' ? IN_AR[id] : IN_EN[id];
      return mealIn(id, lower ? MEAL_LABELS[id].toLowerCase() : MEAL_LABELS[id], lang);
    },
    /** Meals offered in "Move to…" lists: lunch is left out in Ramadan mode (unless it is the current meal). */
    ids: (keep?: MealId) => (ramadan ? MEAL_IDS.filter((m) => m !== 'lunch' || m === keep) : MEAL_IDS),
  };
}

export function useMealNames() {
  const ramadan = React.useContext(RamadanCtx);
  const { lang } = useT();
  return React.useMemo(() => makeMealNames(ramadan, lang), [ramadan, lang]);
}
