import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ChevronRight, Lock, Shield, HeartPulse, Calculator, BookOpen,
} from 'lucide-react';
import { publicMetadata } from '@/components/public/seo';
import { SITE_NAME, SITE_DESCRIPTION } from '@/lib/site';
import { botanical, heroArt } from '@/lib/art.js';
import { Illustration } from '@/components/illustrations/illustration';
import type { IllustrationName } from '@/lib/illustrations';
import { getActor, homeFor } from '@/lib/server/session';
import { buttonVariants } from '@/components/ui/button';
import { Band, CtaBand } from '@/components/public/blocks';
import { getT } from '@/lib/i18n/server';
import { HeroAurora } from '@/components/public/hero-aurora';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  const HOME_TITLE = t('{site}: Your plate, your balance', { site: SITE_NAME });
  const base = publicMetadata({ description: t(SITE_DESCRIPTION), path: '/' });
  return { ...base, title: { absolute: HOME_TITLE }, openGraph: { ...base.openGraph, title: HOME_TITLE }, twitter: { ...base.twitter, title: HOME_TITLE } };
}

const FEATURES: [IllustrationName, string, string][] = [
  ['log-food', 'Log what you eat', 'Find Saudi dishes, ingredients and supermarket products, or just scan a barcode.'],
  ['calculator', 'Know your numbers', 'See your daily calorie goal, worked out the Ministry of Health way, and your protein, carb and fat goals. Track your weight, blood pressure and blood sugar too.'],
  ['plan', 'Plan meals & shop', 'Get meal ideas and a ready-made shopping list that fit your goals.'],
  ['hospital', 'Hospital care', 'Every meal is checked against the patient’s diet order, allergies and conditions, and patients leave with a plan for eating at home.'],
];

/** Saudi government bodies behind Mizan's health and food rules. */
const SOURCE_BADGES = ['MOH', 'SFDA', 'Saudi National Diabetes Center'];

export default async function Home() {
  const actor = await getActor();
  const t = await getT();
  // One sentence with the highlighted word marked, so Arabic word order can differ.
  const hero = t('Your plate, <em>your balance</em>.').split(/<\/?em>/);

  return (
    <>
      <section className="mz-hero relative isolate overflow-hidden bg-[#DDD5F2] py-12 sm:py-20">
        <HeroAurora className="-z-20" />
        {/* A soft cream veil behind the text and a fine grain keep it readable over any part of the moving light. */}
        <div aria-hidden="true" className="mz-hero-scrim pointer-events-none absolute inset-0 -z-10" />
        <div aria-hidden="true" className="mz-grain pointer-events-none absolute inset-0 -z-10" />
        <div className="container-page grid items-center gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-12">
          <div className="flex flex-col gap-5">
            <h1 className="text-display mz-rise text-[#1A1747]" style={{ '--d': '0ms' } as React.CSSProperties}>{hero[0]}<em className="not-italic text-[#3730A3]">{hero[1]}</em>{hero[2]}</h1>
            <p className="mz-rise max-w-[40ch] text-[1.15rem] font-semibold text-[#221F47]" style={{ '--d': '90ms' } as React.CSSProperties}>{t('Track, plan and enjoy food that fits you, at home or in hospital.')}</p>
            {actor ? (
              <Link href={homeFor(actor)} className={buttonVariants({ size: 'lg', className: 'w-full sm:w-fit' })}><ChevronRight aria-hidden className="rtl:-scale-x-100" />{t('Go to my start page')}</Link>
            ) : null}
            <ul className="mz-rise flex flex-wrap gap-x-5 gap-y-2 text-[.92rem] font-bold text-[#221F47]" style={{ '--d': '170ms' } as React.CSSProperties}>
              <li className="inline-flex items-center gap-1.5"><HeartPulse className="size-4 text-primary" aria-hidden />{t('Guided by the Ministry of Health and SFDA')}</li>
              <li className="inline-flex items-center gap-1.5"><Lock className="size-4 text-primary" aria-hidden />{t('Your diary stays private')}</li>
              <li className="inline-flex items-center gap-1.5"><Shield className="size-4 text-primary" aria-hidden />{t('Not clinically validated')}</li>
            </ul>
          </div>
          {/* A tiny world of balanced dishes: decorative, so the text above carries the message. */}
          <div aria-hidden="true" className="mz-glass mz-rise mz-illo mx-auto w-full max-w-[520px] overflow-hidden rounded-[28px] p-2 [&>svg]:block [&>svg]:h-auto [&>svg]:w-full [&>svg]:rounded-[22px]" style={{ '--d': '220ms' } as React.CSSProperties}
            dangerouslySetInnerHTML={{ __html: heroArt() }} />
        </div>
      </section>

      <section aria-labelledby="vision-h" className="border-b border-border bg-card py-7 sm:py-9">
        <div className="container-page flex flex-col items-center gap-2 text-center">
          <h2 id="vision-h" className="eyebrow">{t('Our vision')}</h2>
          <p className="max-w-[46ch] text-balance font-display text-[1.25rem] font-semibold leading-snug text-heading sm:text-[1.5rem]">{t('Helping people with obesity and chronic disease live healthier, one meal at a time.')}</p>
        </div>
      </section>

      <Band tone="white" aria-labelledby="do-h" className="py-10 sm:py-12 lg:py-14">
        <div className="container-page flex flex-col gap-6">
          <h2 id="do-h" className="text-[1.5rem] leading-tight sm:text-[1.8rem]">{t('What you can do')}</h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(([art, title, text]) => (
              <li key={title} className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 shadow-soft lg:flex-col">
                <Illustration name={art} className="h-[57px] w-16 lg:h-[85px] lg:w-24" />
                <div className="flex min-w-0 flex-col gap-0.5">
                  <h3 className="text-[1.02rem]">{t(title)}</h3>
                  <p className="text-[.93rem] text-muted-foreground">{t(text)}</p>
                </div>
              </li>
            ))}
          </ul>
          <Link href="/how-it-works" className={buttonVariants({ variant: 'outline', className: 'w-full sm:w-fit' })}>{t('How it works')} <ChevronRight aria-hidden className="rtl:-scale-x-100" /></Link>
        </div>
      </Band>

      <section aria-labelledby="sa-h" className="border-y border-border bg-blush py-5">
        <div className="container-page flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
            <h2 id="sa-h" className="text-[1rem]">{t('Built on Saudi government guidance')}</h2>
            <ul aria-label={t('Saudi sources')} className="flex flex-wrap gap-2">
              {SOURCE_BADGES.map((b) => (
                <li key={b}><Link href="/sources" className="inline-flex min-h-9 items-center rounded-full border border-rose bg-card px-3 py-1 text-sm font-semibold text-rose-ink no-underline hover:bg-rose">{t(b)}</Link></li>
              ))}
            </ul>
          </div>
          <p className="flex items-center gap-2 text-sm"><Link href="/sources" className="inline-flex items-center gap-1 whitespace-nowrap font-semibold"><BookOpen className="size-4" aria-hidden />{t('All sources')}</Link></p>
        </div>
      </section>

      <Band className="py-10 sm:py-12 lg:py-14">
        <div className="container-page">
          <CtaBand title={t('Start with your numbers')}
            action={<Link href="/tools/calculator" className={buttonVariants({ size: 'lg' })}><Calculator aria-hidden />{t('Open the calculator')}</Link>}>
            <p>{t('Find your BMI and how many calories you need each day, using the Ministry of Health method. No account needed.')}</p>
          </CtaBand>
          <div className="mt-6 flex justify-center"><span className="w-28" dangerouslySetInnerHTML={{ __html: botanical('w-full h-auto') }} /></div>
        </div>
      </Band>
    </>
  );
}
