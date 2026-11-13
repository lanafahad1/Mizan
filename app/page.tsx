import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ChevronRight, User, Hospital, Lock, Shield, HeartPulse, Calculator, Recycle, BookOpen, type LucideIcon,
} from 'lucide-react';
import { publicMetadata } from '@/components/public/seo';
import { SITE_NAME, SITE_DESCRIPTION } from '@/lib/site';
import { botanical } from '@/lib/art.js';
import { Illustration } from '@/components/illustrations/illustration';
import type { IllustrationName } from '@/lib/illustrations';
import { getActor, homeFor } from '@/lib/server/session';
import { buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Band, CtaBand } from '@/components/public/blocks';
import { getT } from '@/lib/i18n/server';

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
const SOURCE_BADGES = ['MOH', 'SFDA', 'Saudi National Diabetes Center', 'GFSA'];

function Space({ icon: Icon, tone, title, who, children, action }: { icon: LucideIcon; tone: 'mint' | 'blush'; title: string; who: string; children: React.ReactNode; action: React.ReactNode }) {
  return (
    <Card tone={tone} className="h-full gap-3">
      <div className="flex items-center gap-3">
        <span className={`grid size-11 shrink-0 place-items-center rounded-full ${tone === 'mint' ? 'bg-sage text-heading' : 'bg-rose text-rose-ink'}`}><Icon className="size-5" aria-hidden /></span>
        <div className="flex min-w-0 flex-col">
          <h2 className="text-[1.2rem]">{title}</h2>
          <span className="text-sm text-muted-foreground">{who}</span>
        </div>
      </div>
      <div className="flex-1 text-[.97rem]">{children}</div>
      {action}
    </Card>
  );
}

export default async function Home() {
  const actor = await getActor();
  const t = await getT();
  // One sentence with the highlighted word marked, so Arabic word order can differ.
  const hero = t('Your plate, <em>your balance</em>.').split(/<\/?em>/);

  return (
    <>
      <section className="overflow-hidden bg-[radial-gradient(1200px_500px_at_85%_10%,var(--cb-rose),transparent_60%),radial-gradient(900px_500px_at_0%_100%,var(--cb-mint),transparent_60%)] py-10 sm:py-16">
        <div className="container-page grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-12">
          <div className="flex flex-col gap-5">
            <h1 className="text-display">{hero[0]}<em className="not-italic text-rose-ink">{hero[1]}</em>{hero[2]}</h1>
            <p className="text-[1.1rem]">{t('Track, plan and enjoy food that fits you, at home or in hospital.')}</p>
            {actor ? (
              <Link href={homeFor(actor)} className={buttonVariants({ size: 'lg', className: 'w-full sm:w-fit' })}><ChevronRight aria-hidden className="rtl:-scale-x-100" />{t('Go to my start page')}</Link>
            ) : null}
            <ul className="flex flex-wrap gap-x-5 gap-y-2 text-[.9rem] text-muted-foreground">
              <li className="inline-flex items-center gap-1.5"><HeartPulse className="size-4 text-heading" aria-hidden />{t('Guided by the Ministry of Health and SFDA')}</li>
              <li className="inline-flex items-center gap-1.5"><Lock className="size-4 text-heading" aria-hidden />{t('Your diary stays private')}</li>
              <li className="inline-flex items-center gap-1.5"><Shield className="size-4 text-heading" aria-hidden />{t('Not clinically validated')}</li>
            </ul>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Space icon={User} tone="mint" title={t('Member')} who={t('For anyone who wants to eat well, healthcare workers included')}
              action={<Link href="/register?space=member" className={buttonVariants({ className: 'w-full' })}>{t('Start as a member')} <ChevronRight aria-hidden className="rtl:-scale-x-100" /></Link>}>
              <p>{t('Keep a food diary, see your daily calorie goal and track your health readings. It’s private: hospital staff never see it.')}</p>
            </Space>
            <Space icon={Hospital} tone="blush" title={t('Hospital care')} who={t('For patients, staff and admins')}
              action={<Link href="/login?space=hospital" className={buttonVariants({ variant: 'outline', className: 'w-full' })}>{t('Hospital sign-in')} <ChevronRight aria-hidden className="rtl:-scale-x-100" /></Link>}>
              <p>{t('Every meal is checked against each patient’s diet and health conditions. A demonstration hospital with fictional data.')}</p>
            </Space>
          </div>
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
          <p className="flex items-center gap-2 text-sm"><Recycle className="size-4 shrink-0 text-heading" aria-hidden />{t('A bonus: less food wasted in hospitals.')} <Link href="/sources" className="inline-flex items-center gap-1 whitespace-nowrap font-semibold"><BookOpen className="size-4" aria-hidden />{t('All sources')}</Link></p>
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
