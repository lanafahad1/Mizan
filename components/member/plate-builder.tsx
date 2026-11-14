'use client';
// Healthy plate builder (Eat well → Plate): the person says roughly how much of each
// food group is on their plate, or starts from a meal they logged today, and sees in
// plain words how it compares with the Ministry of Health healthy plate (HEALTHY_PLATE:
// vegetables 30%, grains 25%, protein 25%, fruit 20%, milk beside the plate).
// The comparison is domain/plate.js; no score, no medical judgement.
import * as React from 'react';
import Link from 'next/link';
import { Apple, Carrot, Check, Drumstick, Milk, Salad, Wheat, ArrowDown, ArrowUp, CircleDashed } from 'lucide-react';
import { useApi } from '@/lib/api-client';
import { Label, NativeSelect } from '@/components/ui/input';
import { Notice } from '@/components/ui/notice';
import { cn } from '@/lib/utils';
import { useT } from '@/components/site/lang';
import { PLATE_GROUPS as GROUPS_JS, PLATE_AMOUNTS, comparePlate, plateFromEntries } from '@/domain/plate.js';
import { makeMealNames } from '@/components/diary/meal-names';
import type { Diary, MealId } from '@/components/diary/types';
import { MohSource, Section } from './eat-well-parts';

type GroupId = 'vegetables' | 'grains' | 'protein' | 'fruit';
type Amounts = Record<GroupId, number>;
type Icon = React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;

const STYLE: Record<GroupId, { fill: string; dot: string; icon: Icon }> = {
  vegetables: { fill: 'fill-chart-4', dot: 'bg-chart-4', icon: Carrot },
  grains: { fill: 'fill-chart-5', dot: 'bg-chart-5', icon: Wheat },
  protein: { fill: 'fill-chart-3', dot: 'bg-chart-3', icon: Drumstick },
  fruit: { fill: 'fill-chart-2', dot: 'bg-chart-2', icon: Apple },
};
const EMPTY: Amounts = { vegetables: 0, grains: 0, protein: 0, fruit: 0 };
type Row = { id: GroupId; label: string; amount: number; share: number; moh: number; verdict: 'missing' | 'close' | 'more' | 'less' };
const PLATE_GROUPS = GROUPS_JS as { id: GroupId; label: string; share: number }[];

/** A pie slice from angle a0 to a1 (degrees, 0 = top, clockwise). */
function slice(cx: number, cy: number, r: number, a0: number, a1: number) {
  const p = (a: number) => [cx + r * Math.sin((a * Math.PI) / 180), cy - r * Math.cos((a * Math.PI) / 180)].map((v) => Math.round(v * 100) / 100);
  const [x0, y0] = p(a0);
  const [x1, y1] = p(a1);
  return `M${cx} ${cy}L${x0} ${y0}A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1} ${y1}Z`;
}

/** A plate drawn from shares (percent per group). `labels` writes each share on its slice. */
function PlateSvg({ shares, milk, labels = false, className }: { shares: { id: GroupId; share: number }[]; milk: boolean; labels?: boolean; className?: string }) {
  const parts = shares.filter((s) => s.share > 0);
  let a = 0;
  return (
    <svg viewBox="0 0 220 200" aria-hidden className={cn('block h-auto w-full', className)}>
      <circle cx="96" cy="100" r="92" className="fill-card stroke-border" strokeWidth="2" />
      <circle cx="96" cy="100" r="78" className="fill-background stroke-border" strokeWidth="1.5" />
      {parts.length === 0 ? <circle cx="96" cy="100" r="66" fill="none" className="stroke-input" strokeWidth="2" strokeDasharray="6 7" /> : null}
      {parts.length === 1 ? <circle cx="96" cy="100" r="72" className={STYLE[parts[0].id].fill} /> : parts.map((s) => {
        const a0 = a;
        a += (s.share / 100) * 360;
        return <path key={s.id} d={slice(96, 100, 72, a0, a)} className={cn('stroke-card', STYLE[s.id].fill)} strokeWidth="2.5" strokeLinejoin="round" />;
      })}
      {labels ? (() => {
        let b = 0;
        return parts.map((s) => {
          const mid = b + (s.share / 100) * 180;
          b += (s.share / 100) * 360;
          const x = 96 + 44 * Math.sin((mid * Math.PI) / 180);
          const y = 100 - 44 * Math.cos((mid * Math.PI) / 180);
          return <text key={s.id} x={x} y={y + 5} textAnchor="middle" fontSize="15" fontWeight="700" className="fill-white tabular" paintOrder="stroke" stroke="rgba(27,26,58,.35)" strokeWidth="2">{s.share}%</text>;
        });
      })() : null}
      {/* milk, laban or yogurt beside the plate */}
      <g className={milk ? 'opacity-100' : 'opacity-40'}>
        <path d="M192 138h20l-3 40a4 4 0 0 1-4 3.6h-6a4 4 0 0 1-4-3.6z" className={cn(milk ? 'fill-accent' : 'fill-card', 'stroke-sage-deep')} strokeWidth="2.2" strokeLinejoin="round" strokeDasharray={milk ? undefined : '4 4'} />
        {milk ? <path d="M193.5 150h17" className="stroke-sage-deep" strokeWidth="1.6" /> : null}
      </g>
    </svg>
  );
}

function AmountPicker({ group, value, onChange }: { group: { id: GroupId; label: string }; value: number; onChange: (v: number) => void }) {
  const { t } = useT();
  const Ico = STYLE[group.id].icon;
  const name = `plate-${group.id}`;
  return (
    <fieldset className="flex min-w-0 flex-col gap-1.5">
      <legend className="mb-1.5 flex items-center gap-2 font-display text-sm font-semibold text-heading">
        <span aria-hidden className={cn('size-3 shrink-0 rounded-full', STYLE[group.id].dot)} /><Ico aria-hidden className="size-4" />{t(group.label)}
      </legend>
      <div className="grid grid-cols-4 gap-1 rounded-full bg-muted p-1">
        {PLATE_AMOUNTS.map((a) => (
          <label key={a.value} className={cn('relative flex min-h-11 cursor-pointer items-center justify-center rounded-full px-1 text-center text-[.82rem] font-semibold leading-tight sm:min-h-10',
            value === a.value ? 'bg-primary text-primary-foreground shadow-soft' : 'text-muted-foreground hover:bg-card hover:text-heading')}>
            <input type="radio" name={name} value={a.value} checked={value === a.value} onChange={() => onChange(a.value)} className="peer absolute inset-0 cursor-pointer opacity-0" />
            <span className="pointer-events-none rounded-full peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-ring">{t(a.label)}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function PlateBuilder({ kind }: { kind: 'member' | 'patient' }) {
  const { t, lang } = useT();
  const [amounts, setAmounts] = React.useState<Amounts>(EMPTY);
  const [milk, setMilk] = React.useState(false);
  const [from, setFrom] = React.useState('');
  const [unknown, setUnknown] = React.useState<string[]>([]);
  const { data: diary } = useApi<Diary>('/api/health/me/diary');
  const names = makeMealNames(Boolean(diary?.ramadan?.active), lang);
  const logged = (diary?.meals ?? []).filter((m) => m.entries.length > 0);
  const result = comparePlate(amounts, { milk }) as { empty: boolean; groups: Row[]; milk: boolean };
  const shares = result.groups.map((g) => ({ id: g.id, share: g.share }));
  const mohShares = PLATE_GROUPS.map((g) => ({ id: g.id, share: g.share }));

  const pickMeal = (id: string) => {
    setFrom(id);
    const meal = logged.find((m) => m.id === id);
    if (!meal) return;
    const start = plateFromEntries(meal.entries);
    setAmounts(start.amounts as Amounts);
    setMilk(start.milk);
    setUnknown(start.unknown);
  };
  const reset = () => { setAmounts(EMPTY); setMilk(false); setFrom(''); setUnknown([]); };

  const sentence = (g: { id: GroupId; label: string; verdict: string; share: number; moh: number }) => {
    const group = t(g.label);
    if (g.verdict === 'missing') return t('No {group} on your plate. The MOH plate has about {moh}%.', { group: lang === 'ar' ? group : group.toLowerCase(), moh: g.moh });
    if (g.verdict === 'close') return t('{group}: about the same as the MOH plate (about {moh}%).', { group, moh: g.moh });
    if (g.verdict === 'more') return t('{group}: more than the MOH plate (yours about {share}%, MOH about {moh}%).', { group, share: g.share, moh: g.moh });
    return t('{group}: less than the MOH plate (yours about {share}%, MOH about {moh}%).', { group, share: g.share, moh: g.moh });
  };
  const VerdictIcon = ({ v }: { v: string }) => (v === 'close' ? <Check aria-hidden className="size-4 shrink-0 text-success" />
    : v === 'more' ? <ArrowUp aria-hidden className="size-4 shrink-0 text-heading" />
      : v === 'less' ? <ArrowDown aria-hidden className="size-4 shrink-0 text-heading" /> : <CircleDashed aria-hidden className="size-4 shrink-0 text-muted-foreground" />);
  const allClose = !result.empty && result.groups.every((g) => g.verdict === 'close');

  return (
    <Section id="plate-h" title={t('Build your plate')} icon={Salad}>
      <p className="m-0 text-sm text-muted-foreground">{t('Tap how much of each food group is on your plate, and see how it compares with the Ministry of Health healthy plate.')}</p>
      {kind === 'patient' ? <Notice tone="rose">{t('In hospital, your nutrition team plans your meals. Use this for meals at home.')}</Notice> : null}

      <div className="grid grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] items-start gap-3 sm:gap-6">
        <figure className="m-0 flex min-w-0 flex-col items-center gap-1">
          <PlateSvg shares={shares} milk={milk} className="max-w-[260px]" />
          <figcaption className="font-display text-sm font-medium text-heading">{t('Your plate')}</figcaption>
        </figure>
        <figure className="m-0 flex min-w-0 flex-col items-center gap-1">
          <PlateSvg shares={mohShares} milk labels className="max-w-[220px]" />
          <figcaption className="text-center font-display text-sm font-medium text-heading">{t('The MOH healthy plate')}</figcaption>
        </figure>
      </div>
      <ul aria-label={t('Colours on the plate')} className="m-0 flex list-none flex-wrap justify-center gap-x-4 gap-y-1 p-0 text-sm">
        {PLATE_GROUPS.map((g) => (
          <li key={g.id} className="flex items-center gap-1.5"><span aria-hidden className={cn('size-3 rounded-full', STYLE[g.id].dot)} />{t(g.label)} <span className="text-muted-foreground tabular">{t('MOH {n}%', { n: g.share })}</span></li>
        ))}
        <li className="flex items-center gap-1.5"><Milk aria-hidden className="size-4 text-sage-deep" />{t('Milk on the side')}</li>
      </ul>

      {logged.length ? (
        <div className="flex flex-col gap-1.5 rounded-[14px] bg-muted/60 p-3">
          <Label htmlFor="plate-from">{t('Start from a meal you logged today')}</Label>
          <NativeSelect id="plate-from" value={from} onChange={(e) => pickMeal(e.target.value)}>
            <option value="">{t('Choose a meal')}</option>
            {logged.map((m) => <option key={m.id} value={m.id}>{t(names.label(m.id as MealId))}</option>)}
          </NativeSelect>
          {from && unknown.length ? <p className="m-0 text-xs text-muted-foreground">{t('We couldn’t tell the food group of: {foods}. Add them yourself below.', { foods: unknown.map((n) => t(n)).join(t(', ')) })}</p> : null}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        {PLATE_GROUPS.map((g) => (
          <AmountPicker key={g.id} group={g} value={amounts[g.id]} onChange={(v) => { setAmounts((a) => ({ ...a, [g.id]: v })); }} />
        ))}
      </div>
      <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-[14px] border border-border bg-background/60 px-3 py-2">
        <input type="checkbox" checked={milk} onChange={(e) => setMilk(e.target.checked)} className="size-5 accent-[var(--primary)]" />
        <Milk aria-hidden className="size-4 text-sage-deep" /><span className="text-[.95rem]">{t('Milk, laban or yogurt on the side')}</span>
      </label>

      <div aria-live="polite" className="flex flex-col gap-2 rounded-[16px] border border-sage bg-secondary/50 p-3.5">
        <h3 className="text-base">{t('How your plate compares')}</h3>
        {result.empty ? (
          <p className="m-0 text-sm text-muted-foreground">{t('Choose what’s on your plate to compare it with the MOH healthy plate.')}</p>
        ) : (
          <>
            <p className="m-0 text-[.95rem]">{allClose ? t('Your plate is close to the MOH healthy plate in every group.') : t('Here’s how your plate compares with the MOH healthy plate.')}</p>
            <ul className="m-0 flex list-none flex-col gap-1.5 p-0 text-[.95rem]">
              {result.groups.map((g) => (
                <li key={g.id} className="flex items-start gap-2"><span className="mt-0.5"><VerdictIcon v={g.verdict} /></span><span>{sentence(g)}</span></li>
              ))}
              <li className="flex items-start gap-2">
                <span className="mt-0.5">{milk ? <Check aria-hidden className="size-4 shrink-0 text-success" /> : <CircleDashed aria-hidden className="size-4 shrink-0 text-muted-foreground" />}</span>
                <span>{milk ? t('Milk on the side, like the MOH plate.') : t('The MOH plate shows milk, laban or yogurt beside the plate.')}</span>
              </li>
            </ul>
            <button type="button" onClick={reset} className="inline-flex min-h-11 w-fit items-center text-sm font-semibold text-primary hover:underline">{t('Start again')}</button>
          </>
        )}
      </div>
      <p className="m-0 text-xs text-muted-foreground">
        {t('A rough picture to help you plan, not a medical check. “About the same” means within 10 percentage points.')} <Link href="/sources#src-mizan">{t('How we compare')}</Link>
      </p>
      <MohSource />
    </Section>
  );
}
