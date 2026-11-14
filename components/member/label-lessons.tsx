'use client';
// "Reading food labels": short lessons from the Ministry of Health (LABEL_GUIDE and the
// healthy-living tips in data/moh-calorie-guide.js, MOH-GUIDE; the salt limit from
// MOH-SALT). Shown in Eat well → Healthy habits (#labels) and linked from packaged
// foods in the food search.
import * as React from 'react';
import { Droplet, Percent, Ruler, Candy, CircleCheck, Tag, Beef } from 'lucide-react';
import { Accordion } from '@/components/ui/accordion';
import { LABEL_GUIDE, LIFESTYLE_TIPS } from '@/data/moh-calorie-guide.js';
import { useT } from '@/components/site/lang';
import { MohSource, Section } from './eat-well-parts';

const accCls = 'rounded-[14px] border border-border bg-background/60';
const accHead = 'min-h-12 px-3.5 py-2.5 font-display text-[.95rem] font-medium text-heading';
const tip = (start: string) => LIFESTYLE_TIPS.find((x) => x.text.startsWith(start))?.text ?? '';

export function LabelLessons({ salt }: { salt?: { title: string; url: string | null } | null }) {
  const { t, lang } = useT();
  const list = (xs: string[]) => (lang === 'ar' ? xs.map((x) => t(x)).join('، ') : xs.join(', ').toLowerCase());
  const lessons: { id: string; icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>; title: string; body: React.ReactNode }[] = [
    { id: 'serving', icon: Ruler, title: t('Serving size'), body: (
      <>
        <p>{t(LABEL_GUIDE.servingNote)}</p>
        <p>{t('If you eat two servings, you get twice the amounts on the label.')}</p>
        <p>{t('Calories per serving: {list}.', { list: LABEL_GUIDE.kcalPerServing.map((k) => (lang === 'ar' ? t('{n} kcal: {level}', { n: k.kcal, level: t(k.label) }) : `${k.kcal} kcal ${k.label.toLowerCase()}`)).join(' · ') })}</p>
      </>
    ) },
    { id: 'dv', icon: Percent, title: t('% daily value'), body: (
      <>
        <p>{t('It shows how much of a day’s amount one serving gives.')}</p>
        <p>{t('% daily value: {low}% or less is low; {high}% or more is high.', { low: LABEL_GUIDE.dailyValue.low, high: LABEL_GUIDE.dailyValue.high })}</p>
      </>
    ) },
    { id: 'sugar', icon: Candy, title: t('Sugar'), body: (
      <>
        <p>{t('Added sugar is on the Ministry of Health list of things to limit.')}</p>
        <p>{t(tip('Limit added sugar'))}</p>
      </>
    ) },
    { id: 'salt', icon: Droplet, title: t('Salt and sodium'), body: (
      <>
        <p>{t('Sodium is on the list of things to limit.')}</p>
        <p>{t('The Ministry of Health says an adult should have no more than 5 g of salt a day (one teaspoon), which is 2,000 mg of sodium.')}</p>
        <p>{t('A sodium value of {low}% daily value or less is low.', { low: LABEL_GUIDE.dailyValue.low })}</p>
        {salt?.url ? <p className="text-sm text-muted-foreground">{t('Source:')} <a href={salt.url} target="_blank" rel="noopener noreferrer">{t(salt.title)}<span className="sr-only"> {t('(opens in a new tab)')}</span></a></p> : null}
      </>
    ) },
    { id: 'fat', icon: Beef, title: t('Fat'), body: (
      <>
        <p>{t('Limit: {list}.', { list: list(LABEL_GUIDE.limit.filter((x) => /fat|Cholesterol/.test(x))) })}</p>
        <p>{t(tip('Avoid saturated and trans fats'))}</p>
      </>
    ) },
    { id: 'enough', icon: CircleCheck, title: t('What to get enough of'), body: (
      <p>{t('Get enough: {list}.', { list: list(LABEL_GUIDE.getEnough) })}</p>
    ) },
  ];
  return (
    <Section id="labels-h" title={t('Reading food labels')} icon={Tag} className="scroll-mt-24">
      <p className="m-0 text-sm text-muted-foreground">{t('Short lessons from the Ministry of Health for packaged foods. The pack’s own label always comes first.')}</p>
      <div className="flex flex-col gap-2">
        {lessons.map((l) => {
          const Ico = l.icon;
          return (
            <Accordion key={l.id} id={`label-${l.id}`} className={accCls} headClassName={accHead}
              title={<span className="inline-flex items-center gap-2"><Ico className="size-4" aria-hidden />{l.title}</span>}>
              <div className="flex flex-col gap-2 px-3.5 pb-3.5 text-[.95rem] [&_p]:m-0">{l.body}</div>
            </Accordion>
          );
        })}
      </div>
      <MohSource />
    </Section>
  );
}
