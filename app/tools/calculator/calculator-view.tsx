'use client';
import * as React from 'react';
import { Calculator, Scale, Ruler, Flame, Target, UtensilsCrossed, MapPin, Info, ShieldCheck } from 'lucide-react';
import {
  ACTIVITY_LEVELS, BMI_CATEGORIES, bmi, bmiCategory, estimatedEnergy, calculatorProblems, waistRisk, suggestedTargets,
} from '@/domain/calculator.js';
import { nearestPlan, MOH_MEAL_PLANS, EXCHANGE_GROUPS } from '@/data/moh-calorie-guide.js';
import { Field, OptionCard } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Notice } from '@/components/ui/notice';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useT } from '@/components/site/lang';
import type { T } from '@/lib/i18n';

// Every number on this page comes from domain/calculator.js and the MOH Calorie
// Guide data. Nothing is sent anywhere: the calculation runs in the browser.

type Sex = '' | 'male' | 'female';
type Values = { sex: Sex; age: string; heightCm: string; weightKg: string; activity: string; waistCm: string; pregnant: boolean };
type Key = 'sex' | 'age' | 'heightCm' | 'weightKg' | 'activity' | 'waistCm';
type Errors = Partial<Record<Key, string>>;

const EMPTY: Values = { sex: '', age: '', heightCm: '', weightKg: '', activity: '', waistCm: '', pregnant: false };
const ORDER: Key[] = ['sex', 'age', 'heightCm', 'weightKg', 'activity', 'waistCm'];
const fmt = (n: number) => n.toLocaleString('en-US');
const PLAN_MIN = Math.min(...MOH_MEAL_PLANS.map((p) => p.kcal));
const PLAN_MAX = Math.max(...MOH_MEAL_PLANS.map((p) => p.kcal));

const SOURCE_LINK: Record<string, { href: string; label: string }> = {
  'MOH-CALC': { href: '#source-moh-calc', label: 'MOH calorie calculator' },
  'MOH-GUIDE': { href: '#source-moh-guide', label: 'MOH Calorie Guide' },
  'MOH-SALT': { href: '#source-moh-salt', label: 'MOH salt advice' },
};

/** Range text for a BMI category, e.g. "18.5–24.9", "under 18.5", "40 or more". */
function rangeText(c: { min: number; max: number }, t: T) {
  if (c.min === 0) return t('under {n}', { n: c.max });
  if (!Number.isFinite(c.max)) return t('{n} or more', { n: c.min });
  // A number range stays left-to-right inside Arabic text.
  return <bdi dir="ltr">{`${c.min}–${(Math.round((c.max - 0.1) * 10) / 10).toString()}`}</bdi>;
}

function problemsFor(v: Values): Errors {
  const e: Errors = calculatorProblems({ sex: v.sex, age: v.age, heightCm: v.heightCm, weightKg: v.weightKg, activity: v.activity });
  if (v.waistCm.trim() && !(Number(v.waistCm) > 0)) e.waistCm = 'Enter your waist in cm, or leave it empty.';
  return e;
}

function ResultCard({ icon: Icon, title, children, className }: { icon: typeof Scale; title: string; children: React.ReactNode; className?: string }) {
  return (
    <section aria-label={title} className={cn('flex flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-soft', className)}>
      <h3 className="flex items-center gap-2 text-lg"><Icon aria-hidden className="size-5 shrink-0 text-sage-deep" />{title}</h3>
      {children}
    </section>
  );
}

function SourceRef({ id, suffix }: { id: string; suffix?: string }) {
  const { t } = useT();
  const s = SOURCE_LINK[id];
  if (!s) return null;
  return <span className="text-xs text-muted-foreground">{t('Source:')} <a href={s.href}>{t(s.label)}</a>{suffix ? ` ${suffix}` : ''}</span>;
}

function BmiScale({ activeId }: { activeId: string | null }) {
  const { t } = useT();
  return (
    <div className="flex flex-col gap-3">
      <div aria-hidden className="flex gap-1 pt-5">
        {BMI_CATEGORIES.map((c) => (
          <span key={c.id} className="relative flex h-3 flex-1 items-center justify-center">
            <span className={cn('h-3 w-full rounded-full', c.id === activeId ? 'bg-primary' : c.id === 'healthy' ? 'bg-sage' : 'bg-border')} />
            {c.id === activeId ? <MapPin className="absolute -top-5 size-4 text-heading" /> : null}
          </span>
        ))}
      </div>
      <ol aria-label={t('MOH BMI categories for adults')} className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-sm sm:grid-cols-3">
        {BMI_CATEGORIES.map((c) => {
          const active = c.id === activeId;
          return (
            <li key={c.id} aria-current={active ? 'true' : undefined} className={cn('flex flex-col rounded-[10px] px-2 py-1', active && 'bg-mint')}>
              <span className={cn(active ? 'font-semibold text-heading' : 'text-foreground')}>
                {t(c.label)}{active ? <span className="sr-only"> {t('(your result)')}</span> : null}
              </span>
              <span className="tabular text-xs text-muted-foreground">{rangeText(c, t)}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function CalculatorView() {
  const { t, lang } = useT();
  const [v, setV] = React.useState<Values>(EMPTY);
  const [submitted, setSubmitted] = React.useState(false);
  const resultsRef = React.useRef<HTMLHeadingElement>(null);
  const formRef = React.useRef<HTMLFormElement>(null);

  const errors = submitted ? problemsFor(v) : {};
  const valid = submitted && Object.keys(errors).length === 0;

  const set = (k: 'age' | 'heightCm' | 'weightKg' | 'waistCm') => (e: React.ChangeEvent<HTMLInputElement>) => setV((s) => ({ ...s, [k]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    const errs = problemsFor(v);
    const firstKey = ORDER.find((k) => errs[k]);
    requestAnimationFrame(() => {
      if (!firstKey) { resultsRef.current?.focus(); return; }
      const form = formRef.current;
      const el = firstKey === 'sex' || firstKey === 'activity'
        ? form?.querySelector<HTMLInputElement>(`input[name="calc-${firstKey}"]`)
        : form?.querySelector<HTMLInputElement>(`#calc-${firstKey}`);
      el?.focus();
    });
  };

  const reset = () => { setV(EMPTY); setSubmitted(false); };

  // Results (only when the inputs are valid).
  const pregnant = v.sex === 'female' && v.pregnant;
  const adult = Number(v.age) >= 18;
  const bmiValue = valid ? bmi(v.weightKg, v.heightCm) : null;
  const category = bmiCategory(bmiValue);
  const waist = valid && v.waistCm.trim() ? waistRisk(v.sex, v.waistCm) : null;
  const energy = valid ? estimatedEnergy({ sex: v.sex, weightKg: v.weightKg, heightCm: v.heightCm, age: v.age, activity: v.activity, pregnantOrBreastfeeding: pregnant }) : null;
  const kcal = energy && 'kcal' in energy && typeof energy.kcal === 'number' ? energy : null;
  const targets = kcal ? suggestedTargets(kcal) : null;
  const plan = kcal ? nearestPlan(kcal.kcal) : null;
  const level = ACTIVITY_LEVELS.find((l) => l.id === v.activity);

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-8">
      {/* ---- Inputs */}
      <section aria-labelledby="calc-form-h" className="flex min-w-0 flex-col gap-5 rounded-xl border border-border bg-card p-5 shadow-soft sm:p-6">
        <div className="flex flex-col gap-1">
          <h2 id="calc-form-h" className="flex items-center gap-2 text-xl"><Calculator aria-hidden className="size-5 text-sage-deep" />{t('Your details')}</h2>
          <p className="flex items-start gap-1.5 text-sm text-muted-foreground"><ShieldCheck aria-hidden className="mt-0.5 size-4 shrink-0" />{t('Calculated in your browser. Nothing you enter is sent or saved.')}</p>
        </div>
        <form ref={formRef} onSubmit={submit} noValidate className="flex flex-col gap-5">
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 font-display text-sm font-medium text-heading">{t('Sex')}</legend>
            <div className="grid grid-cols-2 gap-2">
              <OptionCard name="calc-sex" value="male" checked={v.sex === 'male'} onChange={() => setV((s) => ({ ...s, sex: 'male', pregnant: false }))} title={t('Male')} />
              <OptionCard name="calc-sex" value="female" checked={v.sex === 'female'} onChange={() => setV((s) => ({ ...s, sex: 'female' }))} title={t('Female')} />
            </div>
            <span className="text-sm text-muted-foreground">{t('The Ministry of Health formula is different for men and women.')}</span>
            {errors.sex ? <p role="alert" className="text-sm font-semibold text-destructive">{t(errors.sex)}</p> : null}
          </fieldset>

          {v.sex === 'female' ? (
            <label htmlFor="calc-pregnant" className="-mt-2 flex min-h-11 cursor-pointer items-center gap-2.5 self-start text-sm">
              <input id="calc-pregnant" type="checkbox" checked={v.pregnant} onChange={(e) => setV((s) => ({ ...s, pregnant: e.target.checked }))} className="size-5 shrink-0 accent-[var(--color-primary)]" />
              <span>{t('I am pregnant or breastfeeding')}</span>
            </label>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-3">
            <Field id="calc-age" label={t('Age (years)')} error={errors.age}>
              <Input name="age" type="number" inputMode="numeric" min={18} max={120} step={1} value={v.age} onChange={set('age')} />
            </Field>
            <Field id="calc-heightCm" label={t('Height (cm)')} error={errors.heightCm}>
              <Input name="heightCm" type="number" inputMode="decimal" min={100} max={250} step="any" value={v.heightCm} onChange={set('heightCm')} />
            </Field>
            <Field id="calc-weightKg" label={t('Weight (kg)')} error={errors.weightKg}>
              <Input name="weightKg" type="number" inputMode="decimal" min={20} max={400} step="any" value={v.weightKg} onChange={set('weightKg')} />
            </Field>
          </div>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 font-display text-sm font-medium text-heading">{t('Activity level')}</legend>
            <div className="flex flex-col gap-2">
              {ACTIVITY_LEVELS.map((l) => (
                <OptionCard key={l.id} name="calc-activity" value={l.id} checked={v.activity === l.id} onChange={() => setV((s) => ({ ...s, activity: l.id }))} title={t(l.label)} description={t(l.hint)} />
              ))}
            </div>
            {errors.activity ? <p role="alert" className="text-sm font-semibold text-destructive">{t(errors.activity)}</p> : null}
          </fieldset>

          <Field id="calc-waistCm" label={t('Waist (cm)')} optional error={errors.waistCm} hint={t('Add it to see your waist risk, as the Ministry of Health measures it.')}>
            <Input name="waistCm" type="number" inputMode="decimal" min={1} step="any" value={v.waistCm} onChange={set('waistCm')} />
          </Field>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="submit" size="lg" className="w-full sm:w-auto">{t('Calculate')}</Button>
            {submitted ? <Button type="button" variant="outline" size="lg" className="w-full sm:w-auto" onClick={reset}>{t('Clear')}</Button> : null}
          </div>
        </form>
      </section>

      {/* ---- Results */}
      <section aria-labelledby="calc-results-h" className="flex min-w-0 flex-col gap-4">
        <h2 id="calc-results-h" ref={resultsRef} tabIndex={-1} className="text-xl outline-none">{t('Your results')}</h2>
        {!valid ? (
          <div className="flex flex-col gap-2 rounded-xl border border-dashed border-input bg-blush p-5">
            <p className="font-display font-semibold text-heading">{submitted ? t('A few details need a look. Check the highlighted fields.') : t('Your results will show up here.')}</p>
            <p className="text-sm text-muted-foreground">{t('Fill in your details and choose Calculate. You’ll see your BMI, roughly how much energy you use each day, suggested daily goals and the closest Ministry of Health meal plan.')}</p>
          </div>
        ) : (
          <>
            <ResultCard icon={Scale} title={t('Body mass index (BMI)')}>
              {bmiValue != null ? (
                <>
                  <p className="flex flex-wrap items-baseline gap-x-2">
                    <span className="tabular font-display text-[2.2rem] font-semibold leading-none text-heading">{bmiValue.toFixed(1)}</span>
                    <span className="text-sm text-muted-foreground">{t('kg/m²')}</span>
                    {adult && category ? <Badge variant={category.id === 'healthy' ? 'sage' : 'rose'} className="ms-1"><MapPin aria-hidden />{t(category.label)}</Badge> : null}
                  </p>
                  {adult ? <BmiScale activeId={category?.id ?? null} /> : <p className="text-sm">{t('The adult BMI categories do not apply under 18.')}</p>}
                  {pregnant ? <p className="text-sm">{t('BMI is read differently during pregnancy and breastfeeding. Ask your care team.')}</p> : null}
                  <p className="text-xs text-muted-foreground">{t('MOH rounds BMI to a whole number ({n}); CareBite shows one decimal.', { n: Math.round(bmiValue) })}</p>
                  <SourceRef id="MOH-CALC" />
                </>
              ) : <p className="text-sm">{t('We couldn’t work out your BMI from these values. Check them and try again.')}</p>}
            </ResultCard>

            {waist ? (
              <ResultCard icon={Ruler} title={t('Waist circumference')}>
                <p className="flex flex-wrap items-center gap-2">
                  <span className="tabular font-display text-2xl font-semibold text-heading">{t('{n} cm', { n: fmt(Number(v.waistCm)) })}</span>
                  <Badge variant={waist.id === 'normal' ? 'sage' : waist.id === 'high' ? 'danger' : 'warn'}>
                    {waist.id === 'normal' ? <ShieldCheck aria-hidden /> : <Info aria-hidden />}{t(waist.label)}
                  </Badge>
                </p>
                <p className="text-sm">
                  {waist.id === 'normal'
                    ? (v.sex === 'male'
                      ? t('Below {cm} cm, the level at which MOH says disease risk starts to rise for men.', { cm: waist.at })
                      : t('Below {cm} cm, the level at which MOH says disease risk starts to rise for women.', { cm: waist.at }))
                    : waist.id === 'high'
                      ? (v.sex === 'male' ? t('From {cm} cm, MOH says disease risk is high for men.', { cm: waist.at }) : t('From {cm} cm, MOH says disease risk is high for women.', { cm: waist.at }))
                      : (v.sex === 'male' ? t('From {cm} cm, MOH says disease risk is increased for men.', { cm: waist.at }) : t('From {cm} cm, MOH says disease risk is increased for women.', { cm: waist.at }))}
                </p>
                <SourceRef id="MOH-GUIDE" />
              </ResultCard>
            ) : null}

            <ResultCard icon={Flame} title={t('Estimated daily energy')}>
              {kcal ? (
                <>
                  <p className="flex flex-wrap items-baseline gap-x-2">
                    <span className="tabular font-display text-[2.2rem] font-semibold leading-none text-heading">{fmt(kcal.kcal)}</span>
                    <span className="text-sm text-muted-foreground">{t('kcal a day')}</span>
                  </p>
                  <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                    <dt className="text-muted-foreground">{t('Energy your body uses at rest (BMR)')}</dt><dd className="tabular">{t('{n} kcal', { n: fmt(kcal.bmr) })}</dd>
                    <dt className="text-muted-foreground">{t('Activity factor')}</dt><dd className="tabular"><bdi dir="ltr">× {kcal.factor}</bdi>{level ? ` (${t(level.label)})` : ''}</dd>
                  </dl>
                  <p className="text-sm text-muted-foreground">{t('How it’s worked out (Ministry of Health method): your resting energy from the Mifflin-St Jeor equation, multiplied by your activity factor. That gives an estimate of the energy you use in a day.')}</p>
                  <Notice tone="rose" title={t('Want to lose weight?')}>
                    {t('The Ministry of Health advises eating fewer calories than you use and losing weight slowly, ½–1 kg a week. Its meal plans run from 1,200 to 2,200 kcal. Pick one together with a healthcare professional.')}
                  </Notice>
                  <SourceRef id="MOH-CALC" />
                </>
              ) : energy && 'notApplicable' in energy && energy.notApplicable ? (
                <Notice tone="info">{t(energy.notApplicable)}</Notice>
              ) : <p className="text-sm">{t('We couldn’t estimate your energy from these values. Check them and try again.')}</p>}
            </ResultCard>

            {targets ? (
              <ResultCard icon={Target} title={t('Suggested daily goals')}>
                <p className="text-sm text-muted-foreground">{t('Estimates from Saudi government sources, not a prescription.')}</p>
                <ul className="flex flex-col divide-y divide-border">
                  {([
                    ['Energy', t('{n} kcal', { n: fmt(targets.kcal) }), 'MOH-CALC', undefined],
                    ['Carbohydrate', t('{n} g', { n: fmt(targets.carbs) }), 'MOH-GUIDE', t('({n} kcal plan)', { n: fmt(targets.planKcal) })],
                    ['Protein', t('{n} g', { n: fmt(targets.protein) }), 'MOH-GUIDE', t('({n} kcal plan)', { n: fmt(targets.planKcal) })],
                    ['Fat', t('{n} g', { n: fmt(targets.fat) }), 'MOH-GUIDE', t('({n} kcal plan)', { n: fmt(targets.planKcal) })],
                    ['Sodium', t('up to {n} mg', { n: fmt(targets.sodium) }), 'MOH-SALT', undefined],
                    ['Added sugar', t('up to {n} teaspoons', { n: targets.addedSugarTsp }), 'MOH-GUIDE', undefined],
                  ] as const).map(([name, value, src, suffix]) => (
                    <li key={name} className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 py-2.5 first:pt-0 last:pb-0">
                      <span className="flex flex-col">
                        <span className="font-display font-medium text-heading">{t(name)}</span>
                        <SourceRef id={src} suffix={suffix} />
                      </span>
                      <span className="tabular font-semibold">{value}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-muted-foreground">{t('Carbohydrate, protein and fat are added up from the daily portions of the nearest MOH meal plan, using MOH\'s average value for one portion of each food group.')}</p>
              </ResultCard>
            ) : null}

            {plan ? (
              <ResultCard icon={UtensilsCrossed} title={t('Nearest MOH meal plan: {n} kcal', { n: fmt(plan.kcal) })}>
                <p className="text-sm text-muted-foreground">
                  {kcal && kcal.kcal > PLAN_MAX
                    ? t('Your estimate is above the highest MOH plan ({n} kcal), so that plan is shown.', { n: fmt(PLAN_MAX) })
                    : kcal && kcal.kcal < PLAN_MIN
                      ? t('Your estimate is below the lowest MOH plan ({n} kcal), so that plan is shown.', { n: fmt(PLAN_MIN) })
                      : t('The Ministry of Health plan closest to your estimate. Portions per day:')}
                </p>
                <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {EXCHANGE_GROUPS.map((g) => {
                    const n = (plan.day as Record<string, number>)[g.id] ?? 0;
                    return (
                      <li key={g.id} className="flex flex-col rounded-[12px] border border-sage bg-mint px-3 py-2">
                        <span className="tabular font-display text-xl font-semibold text-heading">{n}</span>
                        <span className="text-sm">{lang === 'ar' && 'labelAr' in g && g.labelAr ? g.labelAr : t(g.label)}</span>
                        <span className="text-xs text-muted-foreground">{t('{n} kcal a portion', { n: g.kcal })}</span>
                      </li>
                    );
                  })}
                </ul>
                {'note' in plan && plan.note ? <p className="text-xs text-muted-foreground">{t(plan.note)}</p> : null}
                <SourceRef id="MOH-GUIDE" />
              </ResultCard>
            ) : null}
          </>
        )}
      </section>
    </div>
  );
}
