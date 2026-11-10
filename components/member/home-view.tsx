'use client';
// Member Home: a calm overview. Greeting → (welcome for new members) → today's
// calories and meals → water, steps and activity → next steps → this week →
// a MOH tip and one meal idea for the next meal. (The medical disclaimer is in the site footer.)
import * as React from 'react';
import Link from 'next/link';
import { Utensils, Check, Circle, ChevronRight, Lightbulb, Plus, ListChecks } from 'lucide-react';
import { useApi, apiSend, ApiError } from '@/lib/api-client';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/toast';
import { CalorieRing } from '@/components/diary/calorie-ring';
import { Illustration } from '@/components/illustrations/illustration';
import { MOH_GUIDE_META } from '@/data/moh-calorie-guide.js';
import { cn } from '@/lib/utils';
import { containerClass } from '@/components/site/page-head';
import { useT } from '@/components/site/lang';
import { MEAL_LABELS, mealIn, diaryKey, tMsg, type Diary, type MealId } from '@/components/diary/types';
import type { Idea } from '@/app/meal-ideas/ideas-view';
import { greetingForHour, mealForHour } from './meal-time';
import { n0, WEEK_KEY, OVERVIEW_KEY, useRefreshHealth, type Week } from './daily';
import { Trackers } from './trackers';
import { WeekCard } from './week-card';
import { WelcomeCard, welcomeHidden } from './onboarding';

/* eslint-disable @typescript-eslint/no-explicit-any */

type HomeDiary = Diary & { daily?: { water: number | null; steps: number | null; activity: number | null } };
export type HomeIdea = (Idea & { mealKcal: number | null; meal: MealId }) | null;

export function HomeView({ name, hour: serverHour, overview, diary, week, activityLevels, tip, idea }: {
  name: string; hour: number; overview: any; diary: HomeDiary; week: Week; activityLevels: { id: string; label: string; hint: string }[];
  tip: { text: string; area: string }; idea: HomeIdea;
}) {
  const { t, lang } = useT();
  const o = useApi<any>(OVERVIEW_KEY, overview).data ?? overview;
  const d = useApi<HomeDiary>(diaryKey(diary.date), diary).data ?? diary;
  const w = useApi<Week>(WEEK_KEY, week).data ?? week;

  // The device's own clock decides the greeting and the meal (the server's hour is the first guess).
  const [hour, setHour] = React.useState(serverHour);
  React.useEffect(() => { setHour(new Date().getHours()); }, []);
  const meal = mealForHour(hour);
  const logHref = `/today?add=${meal}`;

  const about = o.profile?.about ?? {};
  const heightCm = about.heightCm ?? o.body?.heightCm ?? null;
  const needsBasics = !(about.sex && about.age && heightCm);
  // Rendered after mount only, so "Later" (stored on this device) never flashes the card.
  const [welcome, setWelcome] = React.useState<'unknown' | 'show' | 'hidden'>('unknown');
  React.useEffect(() => { setWelcome(needsBasics && !welcomeHidden() ? 'show' : 'hidden'); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const eaten = d.totals?.kcal ?? 0;
  const target = d.targets?.kcal ?? null;
  const logged = d.meals.some((m) => m.entries.length);
  const status = !logged ? t('Nothing logged yet today')
    : target ? (eaten <= target ? t('{n} kcal left today', { n: n0(target - eaten) }) : t('{n} kcal over today’s target', { n: n0(eaten - target) }))
      : t('{n} kcal logged today', { n: n0(eaten) });

  const steps = [
    { id: 'about', done: Boolean(about.sex && about.age && heightCm && about.activity), label: t('Tell us about you'), hint: t('A few details so we can estimate your calories'), href: '/my-health' },
    { id: 'targets', done: Boolean(o.targets?.kcal), label: t('Set your daily target'), hint: t('Use the Ministry of Health estimate or pick your own'), href: '/my-health#targets' },
    { id: 'log', done: w.daysLogged >= 3, label: t('Log your meals on 3 days'), hint: t('{n} of 3 days this week', { n: Math.min(3, w.daysLogged) }), href: logHref },
    { id: 'assessment', done: Boolean(o.assessment && o.assessment.status !== 'draft'), label: t('Try the optional assessment'), hint: t('About your health, food and habits. Skip any question you like.'), href: '/my-health/assessment' },
  ];
  const left = steps.filter((s) => !s.done).length;

  return (
    <div className={cn(containerClass({ space: 'member' }), 'flex flex-col gap-6 pb-16 pt-8 sm:pt-10')}>
      {/* 1. Greeting */}
      <header className="flex flex-col gap-1">
        <span className="eyebrow">{t('Private to you')}</span>
        <h1 className="text-[1.9rem] leading-tight sm:text-[2.4rem]">{t('{greeting}, {name}', { greeting: t(greetingForHour(hour)), name: t(name) })}</h1>
        <p className="text-[1.05rem] text-muted-foreground" aria-live="polite">{status}</p>
      </header>

      {welcome === 'show' ? <WelcomeCard overview={o} activityLevels={activityLevels} firstMealHref={logHref} onClose={() => setWelcome('hidden')} /> : null}

      {/* 2. Today */}
      <section aria-labelledby="today-h" className="flex flex-col gap-4 rounded-[24px] border border-border bg-card p-4 shadow-soft sm:p-6">
        <div className="flex items-baseline justify-between gap-2">
          <h2 id="today-h" className="text-lg sm:text-xl">{t('Today')}</h2>
          <Link href="/today" className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold">{t('Open your diary')}<ChevronRight className="size-4 rtl:rotate-180" aria-hidden /></Link>
        </div>
        <Link href="/today" className="flex flex-col items-center gap-4 rounded-[18px] text-foreground no-underline hover:bg-background/70 sm:flex-row sm:gap-6 sm:p-2">
          <CalorieRing eaten={eaten} target={target} />
          <span className="sr-only">{target ? t('{n} of {target} kcal eaten today.', { n: n0(eaten), target: n0(target) }) : t('{n} kcal eaten today.', { n: n0(eaten) })}</span>
          <ul className="m-0 grid w-full list-none grid-cols-2 gap-2 p-0">
            {d.meals.map((m) => {
              const has = m.entries.length > 0;
              return (
                <li key={m.id} className={cn('flex min-h-11 items-center gap-2 rounded-[14px] border px-3 py-2', has ? 'border-sage bg-mint' : 'border-border bg-background')}>
                  {has ? <Check className="size-5 shrink-0 text-sage-deep" aria-hidden /> : <Circle className="size-5 shrink-0 text-muted-foreground" aria-hidden />}
                  <span className="flex min-w-0 flex-col leading-tight">
                    <b className="font-display text-sm font-medium text-heading">{t(MEAL_LABELS[m.id])}</b>
                    <span className="text-xs text-muted-foreground">{has ? t('{n} kcal', { n: n0(m.totals?.kcal ?? 0) }) : t('Not logged yet')}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </Link>
        {!logged ? (
          <div className="flex items-center gap-3 rounded-[16px] bg-blush px-3 py-2.5">
            <Illustration name="empty-diary" className="size-12" />
            <p className="m-0 text-sm text-rose-ink">{t('What did you eat today? Add your {meal} to start.', { meal: mealIn(meal, MEAL_LABELS[meal].toLowerCase(), lang) })}</p>
          </div>
        ) : null}
        <Link href={logHref} className={cn(buttonVariants({ size: 'lg' }), 'w-full sm:w-fit')}><Utensils aria-hidden />{t('Add what you ate')}</Link>
        {!target ? <p className="m-0 text-sm text-muted-foreground">{t('No daily target yet.')} <Link href="/my-health#targets">{t('Set your daily calories in My Health')}</Link></p> : null}
      </section>

      {/* 3. Trackers */}
      <Trackers water={d.daily?.water ?? null} steps={d.daily?.steps ?? null} activityToday={d.daily?.activity ?? null} activityWeek={w.activityMinutes} />

      {/* 4. Next steps (new members) */}
      {left && welcome === 'hidden' ? (
        <section aria-labelledby="next-h" className="flex flex-col gap-3 rounded-[20px] border border-sage bg-mint/60 p-4 sm:p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="next-h" className="flex items-center gap-2 text-lg sm:text-xl"><ListChecks className="size-5 text-sage-deep" aria-hidden />{t('Next steps')}</h2>
            <span className="text-sm text-muted-foreground">{t('{done} of {all} done', { done: steps.length - left, all: steps.length })}</span>
          </div>
          <ol className="m-0 flex list-none flex-col gap-2 p-0">
            {steps.map((s, i) => (
              <li key={s.id}>
                <Link href={s.href} className={cn('flex min-h-14 items-center gap-3 rounded-[14px] border bg-card px-3 py-2.5 text-foreground no-underline hover:border-primary', s.done ? 'border-sage' : 'border-border')}>
                  <span aria-hidden className={cn('grid size-7 shrink-0 place-items-center rounded-full border text-sm font-bold', s.done ? 'border-primary bg-primary text-primary-foreground' : 'border-input bg-card text-heading')}>
                    {s.done ? <Check className="size-4" /> : i + 1}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col leading-tight">
                    <b className={cn('font-display text-[.95rem] font-medium text-heading', s.done && 'line-through decoration-sage-deep/60')}>{s.label}</b>
                    <span className="text-sm text-muted-foreground">{s.done ? t('Done') : s.hint}</span>
                  </span>
                  <span className="sr-only">{s.done ? t('(done)') : t('(to do)')}</span>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground rtl:rotate-180" aria-hidden />
                </Link>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {/* 5. This week */}
      <WeekCard week={w} />

      {/* 6. A MOH tip and an idea for the next meal */}
      <div className="grid gap-3 md:grid-cols-2">
        <section aria-labelledby="tip-h" className="flex flex-col gap-2 rounded-[20px] border border-rose bg-blush p-4 sm:p-5">
          <h2 id="tip-h" className="flex items-center gap-2 text-base sm:text-lg"><Lightbulb className="size-5 text-rose-ink" aria-hidden />{t('Tip of the day')}</h2>
          <p className="m-0 text-[1.02rem] text-foreground">{t(tip.text)}</p>
          <p className="m-0 mt-auto text-xs text-muted-foreground">
            {t('Source:')} <a href={MOH_GUIDE_META.url} target="_blank" rel="noopener noreferrer">{lang === 'ar' ? MOH_GUIDE_META.titleAr : t('Saudi Ministry of Health, Calorie Guide for Weight Loss')}<span className="sr-only"> {t('(opens in a new tab)')}</span></a>
          </p>
        </section>
        <IdeaCard idea={idea} />
      </div>

    </div>
  );
}

function IdeaCard({ idea }: { idea: HomeIdea }) {
  const { t, lang } = useT();
  const refresh = useRefreshHealth();
  const [busy, setBusy] = React.useState(false);
  if (!idea) {
    return (
      <section aria-labelledby="idea-h" className="flex flex-col items-start gap-2 rounded-[20px] border border-border bg-card p-4 sm:p-5">
        <h2 id="idea-h" className="text-base sm:text-lg">{t('Meal ideas')}</h2>
        <p className="m-0 text-sm text-muted-foreground">{t('Browse Saudi dishes and CareBite recipes, with the calories for one serving.')}</p>
        <Link href="/eat-well?tab=ideas" className={buttonVariants({ variant: 'outline' })}>{t('See meal ideas')}</Link>
      </section>
    );
  }
  const mealName = mealIn(idea.meal, MEAL_LABELS[idea.meal].toLowerCase(), lang);
  const add = async () => {
    setBusy(true);
    try {
      await apiSend('POST', '/api/health/me/diary', { meal: idea.meal, foodId: idea.id, servingIndex: 0, quantity: 1 });
      toast(t('{name} added to today’s {meal}.', { name: lang === 'ar' ? idea.nameAr || t(idea.name) : idea.name, meal: mealName }));
      void refresh();
    } catch (err) {
      toast(err instanceof ApiError ? tMsg(t, lang, err.message) : t('We couldn’t add this food. Please try again.'), { tone: 'error' });
    } finally { setBusy(false); }
  };
  return (
    <section aria-labelledby="idea-h" className="flex flex-col gap-2 rounded-[20px] border border-border bg-card p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="text-sm text-muted-foreground">{t('An idea for your {meal}', { meal: mealName })}</span>
          <h2 id="idea-h" className="text-base leading-snug sm:text-lg">{lang === 'ar' ? idea.nameAr || t(idea.name) : idea.name}</h2>
        </div>
        <Illustration name="ideas" className="size-14" />
      </div>
      <p className="m-0"><b className="font-display text-xl font-semibold text-heading tabular">{n0(idea.kcal)}</b> <span className="text-muted-foreground">{t('kcal per serving')}</span></p>
      {idea.mealKcal != null && idea.kcal <= idea.mealKcal ? <Badge variant="ok" className="self-start"><Check aria-hidden />{t('Fits your {meal} (≈{n} kcal)', { meal: mealName, n: n0(idea.mealKcal) })}</Badge> : null}
      <p className="m-0 text-xs text-muted-foreground">{idea.kind === 'saudi-dish' ? t('Lab values · Saudi Food Composition Tables') : t('Worked out from the ingredients · USDA')}</p>
      <div className="mt-auto flex flex-wrap gap-2 pt-1">
        <Button variant="outline" disabled={busy} onClick={() => void add()}><Plus aria-hidden />{busy ? t('Adding…') : t('Add to today’s {meal}', { meal: mealName })}</Button>
        <Link href="/eat-well?tab=ideas" className={buttonVariants({ variant: 'ghost' })}>{t('More ideas')}</Link>
      </div>
    </section>
  );
}
