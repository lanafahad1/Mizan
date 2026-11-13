import Link from 'next/link';
import { Shield, TriangleAlert, ShieldX, Layers, RefreshCw, Activity, List, Lock, BookOpen, User, Hospital, ChevronRight, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { publicMetadata } from '@/components/public/seo';
import { PageHead } from '@/components/site/page-head';
import { buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Accordion } from '@/components/ui/accordion';
import { Band, SectionHead, CheckList, CheckItem, Pipeline, CtaBand } from '@/components/public/blocks';
import { JsonLd } from '@/components/public/json-ld';
import { MEAL_SHARE } from '@/domain/rules.js';
import { PORTIONS } from '@/domain/constants.js';
import { SITE_URL } from '@/lib/site';
import { getT, getLang } from '@/lib/i18n/server';
import type { T } from '@/lib/i18n';

const DESCRIPTION = 'How Mizan works. As a member, you keep a private food diary with calorie goals and health readings. In hospital, every meal is checked against the patient’s diet order, allergies and conditions before it is offered.';
export async function generateMetadata() {
  const t = await getT();
  return publicMetadata({ title: t('How It Works'), description: t(DESCRIPTION), path: '/how-it-works' });
}

const WORKFLOW = ['Options offered', 'Patient choice submitted', 'Confirmed by nutrition team', 'Prepared', 'Delivered'];
const share = (p: 'breakfast' | 'lunch' | 'dinner' | 'snack') => `${Math.round(MEAL_SHARE[p] * 100)}%`;

const MEMBER_STEPS = [
  { title: 'Work out your numbers', text: 'Find your BMI and daily calorie needs with the Ministry of Health method.' },
  { title: 'Set your goals', text: 'Pick a daily calorie goal and goals for protein, carbs and fat.' },
  { title: 'Log what you eat', text: 'Search Saudi dishes, ingredients and supermarket products, or scan a barcode.' },
  { title: 'Track your health', text: 'Add your weight, blood pressure and blood sugar, and take a personal health assessment.' },
  { title: 'Plan ahead', text: 'Get meal ideas and a ready-made shopping list.' },
];
const HOSPITAL_STEPS = [
  { safety: true, title: 'Care-team assessment', text: 'The care team records each patient’s conditions, diet order, allergies and intolerances (kept separate) and daily nutrient targets.' },
  { safety: true, title: 'Meals checked for every condition', text: 'Each meal on the menu is checked against everything recorded for the patient, all at once.' },
  { title: 'Choose, confirm, serve', text: 'The patient picks a meal, the nutrition team confirms it, and the kitchen prepares and delivers it.' },
  { title: 'Intake and feedback', text: 'What patients eat and enjoy helps shape their next suggestions.' },
  { title: 'A plan for home', text: 'Before patients leave, the care team prepares a plan for eating at home.' },
];

function Journey({ icon: Icon, tone, title, intro, steps, footer, t }: { icon: LucideIcon; tone: 'mint' | 'blush'; title: string; intro: string; steps: { title: string; text: string; safety?: boolean }[]; footer: ReactNode; t: T }) {
  return (
    <Card tone={tone} className="h-full">
      <div className="flex items-center gap-3">
        <span className={`grid size-11 shrink-0 place-items-center rounded-full ${tone === 'mint' ? 'bg-sage text-heading' : 'bg-rose text-rose-ink'}`}><Icon className="size-5" aria-hidden /></span>
        <div className="flex min-w-0 flex-col">
          <h2 className="text-[1.3rem]">{t(title)}</h2>
          <p className="text-sm text-muted-foreground">{t(intro)}</p>
        </div>
      </div>
      <ol aria-label={t('{title} journey', { title: t(title) })} className="flex flex-1 flex-col gap-2.5 rounded-xl border border-border bg-card p-4">
        {steps.map((s, i) => (
          <li key={s.title} className="grid grid-cols-[32px_minmax(0,1fr)] items-start gap-3">
            <span aria-hidden className={`grid size-8 place-items-center rounded-full border-2 font-display text-sm font-semibold ${s.safety ? 'border-primary bg-mint text-heading' : 'border-pink bg-card text-rose-ink'}`}>{i + 1}</span>
            <div className="min-w-0 pt-0.5">
              <h3 className="text-[1rem]">{t(s.title)}{s.safety ? <span className="sr-only"> {t('(safety step)')}</span> : null}</h3>
              <p className="text-[.92rem] text-muted-foreground">{t(s.text)}</p>
            </div>
          </li>
        ))}
      </ol>
      {footer}
    </Card>
  );
}

function Details({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Accordion className="rounded-[16px] border border-border bg-card" headClassName="min-h-12 px-4 py-3 font-display text-[1rem] font-semibold text-heading sm:px-5" title={title}>
      <div className="flex flex-col gap-4 px-4 pb-5 sm:px-5">{children}</div>
    </Accordion>
  );
}

export default async function HowItWorks() {
  const t = await getT();
  const lang = await getLang();
  const screening = [
    { safety: true, title: 'Diet order, allergies and restrictions', text: 'Nothing by mouth (NPO), confirmed allergen groups (SFDA’s 14) including cross-contact, specific ingredients, intolerances, no added sugar for diabetes (MOH), vegetarian and gluten-free diets, and medically excluded ingredients.' },
    { safety: true, title: 'Information that needs review', text: 'Allergies not yet assessed, allergies that cannot be coded, texture-modified diets, renal diets without potassium and phosphorus limits, and missing nutrient data.' },
    { safety: true, title: 'Nutrient limits, per portion', text: t('Sodium (2,000 mg a day by default, MOH and SFDA), carbohydrate, potassium and phosphorus (set by the care team) are checked for each portion. Daily limits are shared across the day: breakfast {breakfast}, lunch {lunch}, dinner {dinner}, snack {snack}.', { breakfast: share('breakfast'), lunch: share('lunch'), dinner: share('dinner'), snack: share('snack') }) },
    { title: 'Ranking', text: 'Preferred foods, disliked ingredients, lower salt, meals high in fibre (SFDA definition) for diabetes, protein for high-protein diets, and past feedback.' },
    { title: 'Portion suggestion', text: 'The patient’s preferred portion, made smaller when appetite is low, and only from portions that pass every limit.' },
    { title: 'Explanation and kitchen instructions', text: '“Why This Meal?” for the team and the patient, and preparation instructions for the kitchen.' },
  ];
  const howTo = {
    '@context': 'https://schema.org', '@type': 'HowTo', name: t('How Mizan checks each hospital meal'), url: `${SITE_URL}/how-it-works`,
    description: t(DESCRIPTION),
    step: screening.map((s, i) => ({ '@type': 'HowToStep', position: i + 1, name: t(s.title), text: t(s.text) })),
  };

  return (
    <>
      <JsonLd data={howTo} />
      <PageHead eyebrow={t('How It Works')} title={t('Two spaces, one goal: healthier eating')}>
        <p>{t('At home, you’re in charge of your own food. In hospital, the care team plans each patient’s meals, and safety always comes first.')}</p>
      </PageHead>

      <Band tone="white" aria-label={t('The two journeys')} className="py-8 sm:py-10 lg:py-12">
        <div className="container-page grid gap-4 lg:grid-cols-2">
          <Journey icon={User} tone="mint" t={t} title="Member" intro="For anyone who wants to eat well, healthcare workers included" steps={MEMBER_STEPS}
            footer={<>
              <p className="flex items-start gap-2 text-sm"><Lock className="mt-0.5 size-4 shrink-0 text-heading" aria-hidden />{t('Your space is private: hospital staff can never see it.')}</p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Link href="/register?space=member" className={buttonVariants({ className: 'w-full sm:w-fit' })}>{t('Start as a member')} <ChevronRight aria-hidden className="rtl:-scale-x-100" /></Link>
                <Link href="/tools/calculator" className={buttonVariants({ variant: 'outline', className: 'w-full sm:w-fit' })}>{t('Try the calculator')}</Link>
              </div>
            </>} />
          <Journey icon={Hospital} tone="blush" t={t} title="Hospital care" intro="For patients, staff and admins" steps={HOSPITAL_STEPS}
            footer={<>
              <p className="flex items-start gap-2 text-sm"><Shield className="mt-0.5 size-4 shrink-0 text-heading" aria-hidden />{t('Likes and dislikes never override medical restrictions. A demonstration hospital with fictional data.')}</p>
              <Link href="/login?space=hospital" className={buttonVariants({ variant: 'outline', className: 'w-full sm:w-fit' })}>{t('Hospital sign-in')} <ChevronRight aria-hidden className="rtl:-scale-x-100" /></Link>
            </>} />
        </div>
      </Band>

      <Band aria-labelledby="hd-h" className="py-8 sm:py-10 lg:py-12">
        <div className="container-page flex flex-col gap-3">
          <SectionHead title={t('More about hospital care')} id="hd-h" className="mb-3">
            <p>{t('How each hospital meal is checked. Open a topic to learn more.')}</p>
          </SectionHead>

          <Details title={t('Three possible results for each meal')}>
            <CheckList>
              <CheckItem icon={Shield} title={t('Passes screening:')}>{t('nothing conflicts with the patient’s recorded needs, so it can be offered and confirmed.')}</CheckItem>
              <CheckItem icon={TriangleAlert} title={t('Needs admin review:')}>{t('some information is missing or can’t be checked automatically, so only an admin can offer or confirm it.')}</CheckItem>
              <CheckItem icon={ShieldX} title={t('Excluded:')}>{t('there is a definite conflict, so it is never offered, whatever the patient prefers.')}</CheckItem>
            </CheckList>
            <p className="text-sm text-muted-foreground">{t('If no meal passes for a mealtime, the nutrition team is alerted. The requirements are never loosened automatically.')}</p>
          </Details>

          <Details title={t('How a meal is checked, step by step')}>
            <Pipeline steps={screening.map((s) => ({ ...s, title: t(s.title), text: t(s.text) }))} label={t('How a meal is checked, step by step')} className="border-0 p-0 sm:p-0" />
          </Details>

          <Details title={t('A meal’s journey')}>
            <ol aria-label={t('A meal’s journey')} className="grid gap-2 sm:grid-cols-5">
              {WORKFLOW.map((w, i) => (
                <li key={w} className="flex items-center gap-3 rounded-[14px] border border-sage bg-mint px-3 py-2.5 sm:flex-col sm:items-start">
                  <span aria-hidden className="grid size-7 shrink-0 place-items-center rounded-full bg-primary font-display text-sm font-semibold text-primary-foreground">{i + 1}</span>
                  <span className="font-display text-[.92rem] font-medium text-heading"><span className="sr-only">{t('Step {n}:', { n: i + 1 })} </span>{t(w)}</span>
                </li>
              ))}
            </ol>
            {lang === 'ar'
              ? <p className="text-sm text-muted-foreground">{t('A meal can also be On hold: needs review when something changes, or Cancelled (for example at discharge).')}</p>
              : <p className="text-sm text-muted-foreground">A meal can also be <b className="text-heading">On hold: needs review</b> when something changes, or <b className="text-heading">Cancelled</b> (for example at discharge).</p>}
          </Details>

          <Details title={t('Portions, changes, feedback and the audit log')}>
            <CheckList>
              <CheckItem icon={Layers} title={t('Portions:')}>{PORTIONS.map((p: { label: string; short: string }) => t('{label} = {short} serving', { label: t(p.label), short: t(p.short) })).join(t(', '))}{t('. Each is screened separately.')}</CheckItem>
              <CheckItem icon={RefreshCw} title={t('Changes after an order:')}>{t('when a diet order, allergy, meal or menu changes, upcoming meals are checked again, and any affected meal is put on hold until someone reviews it.')}</CheckItem>
              <CheckItem icon={Activity} title={t('Feedback:')}>{t('ratings and refused meals shape future suggestions, and repeated refusals or low intake are flagged for a professional to review.')}</CheckItem>
              <CheckItem icon={List} title={t('Kitchen:')}>{t('sees only confirmed meals, with quantities and tray tickets. Delivered doesn’t mean eaten, so intake is recorded separately.')}</CheckItem>
              <CheckItem icon={Lock} title={t('Audit log:')}>{t('every change to a patient’s record, schedule, intake or requests is saved with who made it and when.')}</CheckItem>
            </CheckList>
          </Details>
        </div>
      </Band>

      <Band className="pt-0 sm:pt-0 lg:pt-0">
        <div className="container-page">
          <CtaBand title={t('See every rule and where it comes from')} action={<Link href="/diets" className={buttonVariants({ size: 'lg' })}><BookOpen aria-hidden />{t('Diets & Rules')}</Link>}>
            <p>{t('Every diet and rule is written out with how it works, where it comes from and its review status.')}</p>
          </CtaBand>
        </div>
      </Band>
    </>
  );
}
