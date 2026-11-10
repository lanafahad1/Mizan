// Small helpers for the patient pages (wording follows the old SPA).
import * as React from 'react';
import { addDays } from '@/domain/dates.js';
import { formatDate } from '@/lib/format';
import type { Lang, T } from '@/lib/i18n';

const same: T = (s) => s;

/** Rewrite staff-facing engine text ("the patient’s preferred cuisine") for the patient ("your preferred cuisine"). */
export const you = (t: string) => t.replace(/the patient’s|the patient's/g, 'your').replace(/The patient/g, 'You').replace(/the patient/g, 'you');

/** `you()` plus translation: the patient wording if it has Arabic, otherwise the engine's own text. */
export const youT = (text: string, t: T, lang: Lang) => {
  const y = you(text);
  if (lang !== 'ar') return y;
  const a = t(y);
  return a !== y ? a : t(text);
};

/** "Today", "Tomorrow", "Yesterday" or the weekday name. */
export const dayName = (d: string, today: string, t: T = same, lang?: Lang) => (d === today ? t('Today') : d === addDays(today, 1) ? t('Tomorrow') : d === addDays(today, -1) ? t('Yesterday') : formatDate(d, { weekday: 'long' }, lang));

export const when = (iso: string, lang?: Lang) => new Date(iso).toLocaleString(lang === 'ar' ? 'ar-SA-u-ca-gregory-nu-latn' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

/** A timestamp shown in the viewer's local time (server and browser time zones may differ). */
export function Time({ iso, lang }: { iso: string; lang?: Lang }) {
  return <time dateTime={iso} suppressHydrationWarning>{when(iso, lang)}</time>;
}

export const PERMISSION_TEXT = 'You can update your food preferences and appetite. Changes to your prescribed diet or allergies must be reviewed by your nutrition team.';
