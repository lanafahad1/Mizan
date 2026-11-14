import type { ReactNode } from 'react';
import { Landmark, Globe, FlaskConical, ExternalLink, Package, Soup, Wheat } from 'lucide-react';
import { publicMetadata } from '@/components/public/seo';
import { SITE_URL, TEAM } from '@/lib/site';
import { AboutNav } from '@/components/cb/misc';
import { PageHead } from '@/components/site/page-head';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Notice } from '@/components/ui/notice';
import { Accordion } from '@/components/ui/accordion';
import { ExtLink } from '@/components/public/blocks';
import { Citation } from '@/components/public/citation';
import { JsonLd } from '@/components/public/json-ld';
import { HashSection } from '@/components/public/hash-section';
import { SOURCES, RULESET_VERSION, RULESET_REVIEW } from '@/domain/rules.js';
import { OUTCOME_RULE } from '@/domain/indicators.js';
import { sfctConsistencyIssue } from '@/domain/nutrition.js';
import { SFCT_META, SFCT_LIBRARY } from '@/data/sfct-dishes.js';
import { SFCT_HOSPITAL_DISHES } from '@/data/sfct-hospital-dishes.js';
import { getT, getLang } from '@/lib/i18n/server';
import type { Lang, T } from '@/lib/i18n';

/* eslint-disable @typescript-eslint/no-explicit-any */
const DESCRIPTION = 'Where Mizan’s food, health and nutrition information comes from (Saudi MOH, SFDA, the Saudi National Diabetes Center, MEWA and international sources), how it is used, and what the prototype cannot do.';
export async function generateMetadata() {
  const t = await getT();
  return publicMetadata({ title: t('Data Sources & Limitations'), description: t(DESCRIPTION), path: '/sources' });
}

type Source = { authority: string; saudi?: boolean; title: string; publisher: string; url?: string | null; summary: string; links?: { label: string; url: string }[] };
type Group = { id: string; title: string; intro: string; icon: typeof Landmark; badge: 'mint' | 'rose' | 'outline'; keep: (x: Source) => boolean };

const GROUPS: Group[] = [
  { id: 'src-saudi', title: 'Saudi government', intro: 'The basis of every health and food rule.', icon: Landmark, badge: 'mint', keep: (x) => Boolean(x.saudi) },
  { id: 'src-intl', title: 'International', intro: 'Used only where no Saudi government equivalent was found.', icon: Globe, badge: 'rose', keep: (x) => !x.saudi && x.authority !== 'Mizan' },
  { id: 'src-mizan', title: 'Mizan assumptions', intro: 'Documented prototype choices, not external guidance.', icon: FlaskConical, badge: 'outline', keep: (x) => x.authority === 'Mizan' },
];

/** First sentence (shown on the card) and the rest (in "More detail"). */
function splitSummary(text: string, lang: Lang = 'en'): [string, string] {
  const m = (lang === 'ar' ? /^(.+?[.!?؟])\s+(?=[A-Z(“\u0600-\u06FF])/ : /^(.+?[.!?])\s+(?=[A-Z(“])/).exec(text);
  return m ? [m[1], text.slice(m[0].length)] : [text, ''];
}

function SourceCard({ id, s, badge, t, lang }: { id: string; s: Source; badge: Group['badge']; t: T; lang: Lang }) {
  const [lead, rest] = splitSummary(t(s.summary), lang);
  const more = rest || (s.links ?? []).length;
  return (
    <li>
      <Card tone="plain" className="h-full gap-2.5 p-4 sm:p-5">
        <Badge variant={badge} className="w-fit">{t(s.authority)}</Badge>
        <h3 className="break-words text-[1.02rem] leading-snug">{s.url ? <ExtLink href={s.url}>{t(s.title)}<ExternalLink className="ms-1 inline size-3.5 align-[-2px]" aria-hidden /></ExtLink> : t(s.title)}</h3>
        <p className="text-sm text-muted-foreground">{t(s.publisher)}</p>
        <p className="text-[.95rem]">{lead}</p>
        {more ? (
          <Accordion className="border-t border-dashed border-border" headClassName="min-h-10 py-2 font-display text-sm font-medium text-heading" title={t('More detail')}>
            <div className="flex flex-col gap-2 pb-1 text-sm">
              {rest ? <p>{rest}</p> : null}
              {(s.links ?? []).length ? (
                <ul className="flex flex-col gap-1">{s.links!.map((l) => <li key={l.url}><ExtLink href={l.url}>{t(l.label)}</ExtLink></li>)}</ul>
              ) : null}
            </div>
          </Accordion>
        ) : null}
        <span className="mt-auto pt-1 font-mono text-[.72rem] text-muted-foreground"><span className="sr-only">{t('Source ID:')} </span>{id}</span>
      </Card>
    </li>
  );
}

function Section({ id, title, intro, children }: { id: string; title: string; intro?: ReactNode; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <h2 id={id} className="text-[1.375rem] sm:text-[1.6rem]">{title}</h2>
      {intro ? <p className="text-muted-foreground">{intro}</p> : null}
      {children}
    </section>
  );
}

function FoodCard({ icon: Icon, title, children }: { icon: typeof Soup; title: string; children: ReactNode }) {
  return (
    <Card tone="plain" className="gap-2 p-4">
      <h3 className="flex items-center gap-2 text-[1.02rem]"><span className="grid size-8 place-items-center rounded-full bg-mint text-heading"><Icon className="size-4" aria-hidden /></span>{title}</h3>
      <div className="text-sm">{children}</div>
    </Card>
  );
}

export default async function SourcesPage() {
  const t = await getT();
  const lang = await getLang();
  const library = SFCT_LIBRARY as Record<string, any>;
  // Arabic shows the dish's Arabic name from the SFCT data when it has one.
  const dishName = (e: { name: string; nameAr?: string | null }) => (lang === 'ar' ? e.nameAr || t(e.name) : e.name);
  const flagged = Object.entries(library).filter(([, e]) => sfctConsistencyIssue(e)).sort(([a], [b]) => (a === 'ruwakah' ? -1 : b === 'ruwakah' ? 1 : 0));
  // The example detail is built from numbers in English; in Arabic it is translated by pattern when one exists.
  const exampleDetail = flagged[0] ? String(sfctConsistencyIssue(flagged[0][1])).replace(/^The published table is internally inconsistent \(per 100 g: /, '').replace(/\)\.$/, '') : '';
  // Each part is a fixed English phrase with numbers; Arabic rebuilds it from the same numbers.
  const issueText = (s: string) => (lang !== 'ar' ? s : s.split('; ').map((part) => {
    let m = /^energy (\S+) kcal vs about (\S+) kcal from its macronutrients$/.exec(part);
    if (m) return t('energy {a} kcal vs about {b} kcal from its macronutrients', { a: m[1], b: m[2] });
    m = /^(\S+) kJ does not match (\S+) kcal$/.exec(part);
    if (m) return t('{a} kJ does not match {b} kcal', { a: m[1], b: m[2] });
    m = /^total carbohydrate (\S+) g vs available carbohydrate plus fibre (\S+) g$/.exec(part);
    if (m) return t('total carbohydrate {a} g vs available carbohydrate plus fibre {b} g', { a: m[1], b: m[2] });
    return t(part);
  }).join(t('; ')));
  const example = flagged[0] ? `${dishName(flagged[0][1])}: ${issueText(exampleDetail)}` : '';
  const sources = Object.entries(SOURCES as unknown as Record<string, Source>);
  const usda = (SOURCES as any)['USDA-FDC'] as Source | undefined;
  const ld = {
    '@context': 'https://schema.org', '@type': 'WebPage', name: t('Data Sources & Limitations'), url: `${SITE_URL}/sources`, description: t(DESCRIPTION),
    citation: sources.filter(([, x]) => x.url).map(([, x]) => ({ '@type': 'CreativeWork', name: x.title, url: x.url, publisher: { '@type': 'Organization', name: x.publisher } })),
    author: TEAM.map((name) => ({ '@type': 'Person', name })),
  };

  return (
    <>
      <JsonLd data={ld} />
      <AboutNav current="/sources" />
      <PageHead eyebrow={t('About & Sources')} title={t('Data Sources & Limitations')}>
        <p>{t('We use Saudi government sources first, and others only where no Saudi source exists. Here you’ll find where each value comes from, every source we use, and what this prototype can’t do.')}</p>
      </PageHead>
      <div className="container-page flex flex-col gap-10 pb-16">
        <Section id="food-h" title={t('Where nutrient values come from')} intro={t('Every food value tells you where it came from.')}>
          <div className="grid gap-3 md:grid-cols-3">
            <FoodCard icon={Soup} title={t('Saudi dishes')}>{t('SFDA Saudi Food Composition Tables: laboratory-analysed values for {n} traditional dishes.', { n: SFCT_META.dishes })}</FoodCard>
            <FoodCard icon={Wheat} title={t('Ingredients')}>{usda ? t('{publisher}, {title}: values per 100 g, calculated by recipe weight (not laboratory-analysed).', { publisher: t(usda.publisher), title: t(usda.title) }) : t('Single-food reference values, where documented.')}</FoodCard>
            <FoodCard icon={Package} title={t('Packaged products')}>{t('Open Food Facts: community-contributed data (ODbL licence). Values can be incomplete or out of date, so always check the pack label.')}</FoodCard>
          </div>
          <Accordion className="rounded-[16px] border border-border bg-card" headClassName="min-h-12 px-4 py-3 font-display text-[.98rem] font-semibold text-heading" title={t('How the SFDA Saudi Food Composition Tables are used')}>
            <div className="flex flex-col gap-3 px-4 pb-4 text-[.95rem]">
              <div className="grid gap-3 md:grid-cols-2">
                <Card tone="plain" className="gap-2 p-4">
                  <h3 className="text-[1rem]">{t('What it is')}</h3>
                  <p className="flex items-baseline gap-2"><b className="font-display text-[2rem] leading-none text-primary tabular">{SFCT_META.dishes}</b><span className="text-muted-foreground">{t('traditional dishes from the 13 regions')}</span></p>
                  <p className="text-sm">{lang === 'ar' ? t(SFCT_META.publisher) : SFCT_META.publisher} · {lang === 'ar' ? t(SFCT_META.edition) : SFCT_META.edition} · {t('released {date}', { date: SFCT_META.released })}</p>
                  <p className="text-sm text-muted-foreground">{lang === 'ar' ? t(SFCT_META.basis) : SFCT_META.basis.charAt(0).toUpperCase() + SFCT_META.basis.slice(1)}</p>
                  <p className="flex flex-wrap gap-x-3 gap-y-1 text-sm"><ExtLink href={SFCT_META.news}>{t('SFDA announcement')}</ExtLink><ExtLink href={SFCT_META.url}>{t('English PDF')}</ExtLink><ExtLink href={SFCT_META.urlAr}>{t('Arabic PDF')}</ExtLink></p>
                </Card>
                <Card tone="plain" className="gap-2 p-4">
                  <h3 className="text-[1rem]">{t('How we use it')}</h3>
                  <ul className="flex list-disc flex-col gap-1.5 ps-5 text-sm">
                    <li>{t('Per portion = value per 100 g × the hospital’s portion weight.')}</li>
                    <li>{t('If part of a meal has no values, the total shows as “≥” and is never used for a limit.')}</li>
                    <li>{t('Carb limits use SFDA “Total Carbohydrates” (fibre included); available carbs are shown next to it.')}</li>
                    <li>{t('Portion weights and kitchen grams are demonstration values, not SFDA data.')}</li>
                  </ul>
                </Card>
              </div>
              <Card tone="plain" className="gap-3 p-4">
                <div className="flex flex-col gap-0.5">
                  <h3 className="text-[1rem]">{t('{n} hospital dishes made to the SFDA recipe', { n: SFCT_HOSPITAL_DISHES.length })}</h3>
                  <p className="text-sm text-muted-foreground">{t('A dish is linked only when the kitchen prepares it to that standard recipe.')}</p>
                </div>
                {Object.entries(SFCT_HOSPITAL_DISHES.reduce((acc: Record<string, any[]>, d: any) => { const e = library[d.nutrition.sfctId]; (acc[e.region] ??= []).push({ d, e }); return acc; }, {}))
                  .sort(([, x], [, y]) => y.length - x.length)
                  .map(([region, list]) => (
                    <div key={region} className="flex flex-col gap-1.5">
                      <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{t(region)}</span>
                      <ul className="flex flex-wrap gap-1.5">
                        {list.map(({ d, e }) => (
                          <li key={d.id} className="rounded-[10px] bg-blush px-2.5 py-1 text-sm">{dishName({ name: d.name, nameAr: d.nameAr ?? e.nameAr })} <span className="text-xs font-semibold text-muted-foreground tabular">{t('p. {page}', { page: e.tablePage })}</span></li>
                        ))}
                      </ul>
                    </div>
                  ))}
              </Card>
              {flagged.length ? (
                <Accordion className="rounded-[14px] border border-border bg-card" headClassName="min-h-11 px-4 py-2.5 text-[.95rem] font-semibold text-heading" title={t('{n} tables we can’t use yet', { n: flagged.length })}>
                  <div className="flex flex-col gap-2 px-4 pb-4 text-sm">
                    <p>{example ? t('Their numbers don’t add up, for example {example}.', { example }) : t('Their numbers don’t add up.')} {t('They stay exactly as published and won’t be linked to a hospital dish until SFDA confirms them.')}</p>
                    <ul className="flex flex-wrap gap-1.5">{flagged.map(([id, e]) => <li key={id} className="rounded-[10px] border border-border px-2.5 py-1">{dishName(e)}</li>)}</ul>
                  </div>
                </Accordion>
              ) : null}
            </div>
          </Accordion>
        </Section>

        <div className="flex flex-col gap-3">
          {GROUPS.map((g, gi) => {
            const list = sources.filter(([, x]) => g.keep(x)).sort(([, a], [, b]) => a.authority.localeCompare(b.authority));
            if (!list.length) return null;
            const Icon = g.icon;
            return (
              <HashSection key={g.id} id={g.id} defaultOpen={gi === 0} className="rounded-[16px] border border-border bg-card"
                headClassName="min-h-14 px-4 py-3 font-display text-[1.15rem] font-semibold text-heading sm:px-5 sm:text-[1.3rem]"
                title={<span className="inline-flex flex-wrap items-center gap-2"><Icon className="size-5 shrink-0" aria-hidden />{t(g.title)} <Badge variant={g.badge}>{list.length === 1 ? t('{n} source', { n: list.length }) : t('{n} sources', { n: list.length })}</Badge></span>}
                meta={t(g.intro)}>
                <ul className="grid gap-3 px-4 pb-5 sm:px-5 md:grid-cols-2 xl:grid-cols-3">
                  {list.map(([sid, x]) => <SourceCard key={sid} id={sid} s={x} badge={g.badge} t={t} lang={lang} />)}
                </ul>
              </HashSection>
            );
          })}
        </div>

        <Section id="lim-h" title={t('Limitations')} intro={t('What this prototype can’t do.')}>
          <Card tone="blush" className="gap-3">
            <ul className="flex list-disc flex-col gap-2 ps-5 text-[.95rem]">
              <li>{t(RULESET_REVIEW.clinicalValidation)}</li>
              <li>{t('BMI and calorie figures are estimates from the MOH calculator method, not a clinical assessment.')}</li>
              <li>{t('Where no Saudi source sets a number (carbohydrate per meal, potassium, phosphorus, an energy target), the care team sets it. Meal shares, portion sizes, the protein ranking level and intake flags are Mizan prototype assumptions (ruleset {version}).', { version: RULESET_VERSION })}</li>
              <li>{t('Packaged products vary by brand; check labels. Meals are never called “allergy-safe”.')}</li>
              <li>{t('Alerts appear inside Mizan only: no text messages or pager alerts, and no connection to any hospital system (electronic health record, pharmacy or kitchen equipment). The only emails are account emails (email confirmation and password reset).')}</li>
              <li>{t('Accounts are demonstration access: no identity is verified. All hospital patients, staff and records are fictional.')}</li>
            </ul>
          </Card>
          <Accordion className="rounded-[16px] border border-border bg-card" headClassName="min-h-12 px-4 py-3 font-display text-[.98rem] font-semibold text-heading" title={t('How hospital intake and feedback are summarised')}>
            <ul className="flex list-disc flex-col gap-1.5 px-4 pb-4 ps-9 text-[.95rem]">{(OUTCOME_RULE as string[]).map((x) => <li key={x}>{t(x)}</li>)}</ul>
          </Accordion>
          <Notice tone="info">{t('No source can replace advice from a qualified healthcare professional.')}</Notice>
        </Section>

        <Section id="cite-h" title={t('How to cite this project')}>
          <Citation id="sources-cite" />
        </Section>
      </div>
    </>
  );
}
