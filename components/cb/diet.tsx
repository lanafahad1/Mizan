'use client';
import { Toggletip } from './toggletip';
import { DIET_CATEGORIES } from '@/domain/rules.js';
import { useT } from '@/components/site/lang';
import type { T } from '@/lib/i18n';

const DIET_TIPS: Record<string, [string, string] | string> = Object.fromEntries([
  ...DIET_CATEGORIES.map((d: { code: string; plain: string; description: string }) => [d.code, [d.plain, d.description]]),
  ['NPO', 'Nothing by mouth: no food or drink is given while this order is active.'],
]);
const tip = (t: T, c: string) => { const v = DIET_TIPS[c]; return v == null ? null : typeof v === 'string' ? t(v) : `${t(v[0])}: ${t(v[1])}`; };

/** Plain-language diet names; each code is a toggletip with its explanation. */
export function DietNames({ codes = [], labels = [] }: { codes?: string[]; labels?: string[] }) {
  const { t } = useT();
  return (
    <span className="flex flex-wrap gap-x-3 gap-y-1.5">
      {codes.map((c, i) => (
        <span key={c} className="inline-flex items-center gap-1.5">
          <span>{t(labels[i] ?? c)}</span>
          <Toggletip label={c} ariaLabel={t('About {diet} (code {code})', { diet: t(labels[i] ?? c), code: c })}>{tip(t, c) ?? t(labels[i] ?? c)}</Toggletip>
        </span>
      ))}
    </span>
  );
}

/** Diet codes only (compact tables); each opens its explanation. */
export function DietCodes({ codes = [], labels = [] }: { codes?: string[]; labels?: string[] }) {
  const { t, lang } = useT();
  return (
    <span className="flex flex-wrap gap-1">
      {codes.map((c, i) => <Toggletip key={c} label={c} ariaLabel={t('{code}: {diet}. Show explanation', { code: c, diet: t(labels[i] ?? c) })}>{tip(t, c) ?? t(labels[i] ?? c)}</Toggletip>)}
      {labels.length ? <span className="sr-only">{labels.map((l) => t(l)).join(lang === 'ar' ? '، ' : ', ')}</span> : null}
    </span>
  );
}
