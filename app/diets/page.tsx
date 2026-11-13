import type { ReactNode } from 'react';
import Link from 'next/link';
import { HeartPulse, ShieldX, TriangleAlert, ChefHat, Flag, ListChecks, FlaskConical, ArrowUpDown, type LucideIcon } from 'lucide-react';
import { publicMetadata } from '@/components/public/seo';
import { SITE_URL } from '@/lib/site';
import { AboutNav } from '@/components/cb/misc';
import { PageHead } from '@/components/site/page-head';
import { Badge } from '@/components/ui/badge';
import { Table, Th, Td } from '@/components/ui/table';
import { ExtLink } from '@/components/public/blocks';
import { Accordion } from '@/components/ui/accordion';
import { JsonLd } from '@/components/public/json-ld';
import { HashSection } from '@/components/public/hash-section';
import { DIET_CATEGORIES, DIET_SUPPORT, MEDICAL_RULES, SAFETY_RULES, INTAKE_FLAG_RULES, SOURCES, MEAL_SHARE, RULESET_VERSION, RULESET_REVIEW } from '@/domain/rules.js';
import { ALLERGENS, PERIODS } from '@/domain/constants.js';
import { TEXTURE_LEVELS } from '@/domain/patient.js';
import { LOCAL_PRODUCTION, LOCAL_PRODUCTION_SOURCES } from '@/data/local-production.js';
import { SFCT_META } from '@/data/sfct-dishes.js';
import { getT } from '@/lib/i18n/server';
import type { T } from '@/lib/i18n';

/* eslint-disable @typescript-eslint/no-explicit-any */
const DESCRIPTION = 'Every diet Mizan applies, including weight management, with its exact logic and Saudi government source (MOH, SFDA, MEWA, GFSA): nutrient limits, allergy and review rules, intake flags, the 14 SFDA allergens and IDDSI texture levels.';
export async function generateMetadata() {
  const t = await getT();
  return publicMetadata({ title: t('Diets & Screening Rules'), description: t(DESCRIPTION), path: '/diets' });
}

type Variant = 'danger' | 'warn' | 'outline' | 'rose';
const OUTCOME: Record<string, [Variant, string, LucideIcon]> = {
  exclude: ['danger', 'Excludes', ShieldX], review: ['warn', 'Sends to review', TriangleAlert], kitchen: ['outline', 'Kitchen instruction', ChefHat], flag: ['rose', 'Flags for the team', Flag],
};
const SUPPORT: Record<string, [Variant, LucideIcon]> = { ingredient: ['outline', ListChecks], nutrient: ['rose', FlaskConical], ranking: ['outline', ArrowUpDown], review: ['warn', TriangleAlert] };
const REQUIRES: Record<string, string> = { potassiumMgPerDay: 'potassium limit', phosphorusMgPerDay: 'phosphorus limit', textureLevel: 'IDDSI texture level', carbsGPerMeal: 'carbohydrate amount per meal' };
const pct = (period: string) => `${Math.round((MEAL_SHARE as Record<string, number>)[period] * 100)}%`;

function SourceLinks({ ids, t }: { ids?: string[]; t: T }) {
  if (!ids?.length) return <span className="text-sm text-muted-foreground">{t('Mizan safety design (no external threshold)')}</span>;
  return (
    <ul className="flex flex-col gap-1 text-sm">
      {ids.map((id) => { const s = (SOURCES as any)[id]; return <li key={id}>{s.url ? <ExtLink href={s.url}>{t(s.title)}</ExtLink> : t(s.title)} · <span className="text-muted-foreground">{t(s.publisher)}</span></li>; })}
    </ul>
  );
}

/** One collapsible section (closed by default; opens for /diets#<id> or ?section=<id>). */
function Section({ id, title, intro, meta, children }: { id: string; title: string; intro?: ReactNode; meta?: ReactNode; children: ReactNode }) {
  return (
    <HashSection id={id} title={title} meta={meta} className="rounded-[16px] border border-border bg-card" headClassName="min-h-14 px-4 py-3 font-display text-[1.1rem] font-semibold text-heading sm:px-5 sm:text-[1.2rem]">
      <div className="flex flex-col gap-3 px-4 pb-5 sm:px-5">
        {intro ? <p className="text-muted-foreground">{intro}</p> : null}
        {children}
      </div>
    </HashSection>
  );
}

/** Collapsed detail block (the shared Accordion). */
function Details({ title, id, children }: { title: ReactNode; id?: string; children: ReactNode }) {
  return (
    <Accordion id={id} className="scroll-mt-24 rounded-[16px] border border-border bg-card" headClassName="min-h-12 px-4 py-3 font-display text-[.98rem] font-semibold text-heading" title={title}>
      <div className="flex flex-col gap-3 px-4 pb-4">{children}</div>
    </Accordion>
  );
}

function RuleCard({ r, outcome, t }: { r: any; outcome?: string; t: T }) {
  const o = outcome ? OUTCOME[outcome] : null;
  const OIcon = o?.[2];
  return (
    <li className="flex flex-col gap-2 rounded-[14px] border border-border bg-background p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col">
          <h3 className="text-[1.05rem]">{t(r.title)}</h3>
          <span className="font-mono text-xs text-muted-foreground">{r.id}{r.kind ? ` · ${String(r.kind).startsWith('rank') ? t('ranking only') : t('limit')}` : ''}</span>
        </div>
        {o && OIcon ? <Badge variant={o[0]}><OIcon aria-hidden />{t(o[1])}</Badge> : null}
      </div>
      <p className="text-[.95rem]">{t(r.logic)}</p>
      <div className="border-t border-dashed border-border pt-2"><span className="sr-only">{t('Sources:')} </span><SourceLinks ids={r.sources} t={t} /></div>
    </li>
  );
}

export default async function DietsPage() {
  const t = await getT();
  const ruleTitle = (id: string) => { const r: any = [...MEDICAL_RULES, ...SAFETY_RULES].find((x: any) => x.id === id); return r ? t(r.title) : id; };
  const active = DIET_CATEGORIES.filter((d: any) => d.status !== 'retired');
  const retired = DIET_CATEGORIES.filter((d: any) => d.status === 'retired');
  const ld = { '@context': 'https://schema.org', '@type': 'WebPage', name: t('Diets & Screening Rules'), url: `${SITE_URL}/diets`, description: t(DESCRIPTION), version: RULESET_VERSION, isPartOf: { '@id': `${SITE_URL}/#website` } };
  return (
    <>
      <JsonLd data={ld} />
      <AboutNav current="/diets" />
      <PageHead eyebrow={t('Knowledge base · ruleset {version}', { version: RULESET_VERSION })} title={t('Diets & Screening Rules')}>
        <p>{t('Here is every diet and rule Mizan uses, how it works and where it comes from. All food and health rules are based on Saudi government guidance (MOH, the Saudi National Diabetes Center, SFDA, MEWA and GFSA). Open a section to learn more.')}</p>
      </PageHead>
      <div className="container-page flex flex-col gap-6 pb-16">
        <nav aria-label={t('Diet categories')} className="flex flex-col gap-2">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('Diet categories')}</p>
          <ul className="flex flex-wrap gap-2">
            {active.map((d: any) => (
              <li key={d.id}><a href={`#${d.id}`} className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-sm font-semibold text-foreground no-underline hover:bg-mint hover:text-heading">{t(d.plain)} <span className="font-mono text-xs font-normal text-muted-foreground">{d.code}</span></a></li>
            ))}
          </ul>
        </nav>
        <p className="flex items-start gap-2 text-sm text-muted-foreground"><HeartPulse className="mt-0.5 size-4 shrink-0 text-heading" aria-hidden /><span><b className="text-heading">{t('Governance.')}</b> {t('Reviewed by: {by} on {date}.', { by: t(RULESET_REVIEW.reviewedBy), date: RULESET_REVIEW.reviewedOn })} {t(RULESET_REVIEW.clinicalValidation)}</span></p>
        <div className="flex min-w-0 flex-col gap-3">
          <Section id="weight" title={t('Weight management (energy-controlled)')} intro={t('A daily energy (calorie) target, set by the care team, shared across the day’s meals.')}>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="flex flex-col gap-1.5 rounded-[16px] border border-sage bg-mint p-4">
                <h3 className="text-[1.02rem]">{t('Lifestyle first')}</h3>
                <p className="text-sm">{t('For adults with overweight or obesity, the Saudi guideline makes diet, physical activity and behaviour support the basis of care.')}</p>
              </div>
              <div className="flex flex-col gap-1.5 rounded-[16px] border border-border bg-card p-4">
                <h3 className="text-[1.02rem]">{t('A target from the MOH method')}</h3>
                <p className="text-sm">{t('The daily energy need can be estimated with the MOH calculator method: the Mifflin-St Jeor equation × an activity level. The care team decides the target.')}</p>
              </div>
              <div className="flex flex-col gap-1.5 rounded-[16px] border border-border bg-card p-4">
                <h3 className="text-[1.02rem]">{t('Shared across meals')}</h3>
                <p className="text-sm">{t('Like other daily limits, the target is divided by meal: breakfast {breakfast}, lunch {lunch}, dinner {dinner}, snack {snack} (a Mizan prototype assumption).', { breakfast: pct('breakfast'), lunch: pct('lunch'), dinner: pct('dinner'), snack: pct('snack') })}</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">{t('Mizan does not choose a calorie deficit itself. Energy can only be checked for dishes with nutrient values. Members can estimate their own needs with the')} <Link href="/tools/calculator">{t('calculator')}</Link>{t('.')}</p>
            <SourceLinks t={t} ids={['MOH-OBESITY', 'MOH-CALC', 'MIZAN-ALLOC'].filter((id) => (SOURCES as any)[id])} />
          </Section>

          <Section id="categories" title={t('Hospital diet categories')} meta={t('{n} categories', { n: active.length })} intro={t('A diet order combines one or more categories. Open a diet to see its rules.')}>
            <ul className="flex flex-col gap-2">
              {active.map((d: any) => {
                const [variant, Icon] = SUPPORT[d.support] ?? SUPPORT.ingredient;
                return (
                  <li key={d.id}>
                    <HashSection id={d.id} as="h3" className="rounded-[14px] border border-border bg-background" headClassName="min-h-12 px-4 py-3 font-display text-[.98rem] font-semibold text-heading"
                      title={<span className="flex flex-wrap items-center gap-2">{t(d.plain)} <Badge variant="outline" className="font-mono">{d.code}</Badge></span>}>
                      <div className="flex flex-col gap-3 px-4 pb-4">
                        <Badge variant={variant} className="w-fit"><Icon aria-hidden />{t((DIET_SUPPORT as any)[d.support].label)}</Badge>
                        <p className="text-sm text-muted-foreground">{t('Clinical name: {name}', { name: t(d.label) })}</p>
                        <p>{t(d.description)}</p>
                        {d.rules.length ? <p className="text-sm"><b className="text-heading">{t('Rules:')}</b> {d.rules.map((r: string) => `${ruleTitle(r)} (${r})`).join(' · ')}</p> : <p className="text-sm text-muted-foreground">{t('No nutrient limits. Allergy, intolerance and exclusion screening still applies.')}</p>}
                        {d.defaults ? <p className="text-sm"><b className="text-heading">{t('Default:')}</b> {t('sodium {n} mg a day unless the diet order sets another limit.', { n: d.defaults.sodiumMgPerDay.toLocaleString('en-US') })}</p> : null}
                        {d.requires ? <p className="text-sm"><b className="text-heading">{t('Required in the diet order:')}</b> {t('{list}. Until set, meals need admin review.', { list: d.requires.map((x: string) => (REQUIRES[x] ? t(REQUIRES[x]) : x)).join(t(', ')) })}</p> : null}
                      </div>
                    </HashSection>
                  </li>
                );
              })}
            </ul>
            <Details title={t('How completely each diet can be checked')}>
              <dl className="grid gap-3 md:grid-cols-2">
                {Object.entries(DIET_SUPPORT as Record<string, { label: string; text: string }>).map(([key, sup]) => {
                  const [variant, Icon] = SUPPORT[key] ?? SUPPORT.ingredient;
                  const diets = active.filter((d: any) => d.support === key);
                  if (!diets.length) return null;
                  return (
                    <div key={key} className="flex flex-col gap-2 rounded-[14px] border border-border bg-background p-4">
                      <dt><Badge variant={variant}><Icon aria-hidden />{t(sup.label)}</Badge></dt>
                      <dd className="text-sm">{t(sup.text)}</dd>
                      <dd className="flex flex-wrap gap-x-3 gap-y-1 text-sm"><span className="sr-only">{t('Diets:')} </span>{diets.map((d: any) => <a key={d.id} href={`#${d.id}`} className="font-semibold">{t(d.plain)} <span className="font-normal text-muted-foreground">({d.code})</span></a>)}</dd>
                    </div>
                  );
                })}
              </dl>
            </Details>
            {retired.length ? (
              <Details title={t('Retired categories')}>
                <ul className="flex list-disc flex-col gap-1.5 ps-5">{retired.map((d: any) => <li key={d.id}><b className="text-heading">{t(d.plain)} ({d.code}):</b> {t(d.retiredReason)}</li>)}</ul>
              </Details>
            ) : null}
          </Section>

          <Section id="medical" title={t('Nutrient rules')} meta={t('{n} rules', { n: MEDICAL_RULES.length })} intro={t('Limits checked per portion using SFDA Saudi Food Composition Table dish values; ranking rules only change the order.')}>
            <p className="text-sm">{t('Dishes prepared to an SFDA Saudi Food Composition Tables recipe ({n} dishes in the first edition) are screened automatically; meals with any dish outside the SFCT go to admin review for these limits.', { n: SFCT_META.dishes })}</p>
            <ul className="flex flex-col gap-3">{MEDICAL_RULES.map((r: any) => <RuleCard key={r.id} r={r} t={t} />)}</ul>
          </Section>

          <Section id="safety" title={t('Safety and review rules')} meta={t('{n} rules', { n: SAFETY_RULES.length })} intro={t('What excludes a meal, sends it to review, or adds a kitchen instruction.')}>
            <ul className="flex flex-col gap-3">{SAFETY_RULES.map((r: any) => <RuleCard key={r.id} r={{ ...r, kind: undefined }} outcome={r.outcome} t={t} />)}</ul>
          </Section>

          <Section id="intake" title={t('Intake flags')} meta={t('{n} flags', { n: INTAKE_FLAG_RULES.length })} intro={t('Prompts for a professional review from recorded meals. They never change a diet order.')}>
            <ul className="flex list-disc flex-col gap-1.5 ps-5">{INTAKE_FLAG_RULES.map((r: any) => <li key={r.id}><b className="text-heading">{t(r.title)} ({r.id}):</b> {t(r.logic)}</li>)}</ul>
            <SourceLinks ids={['MIZAN-FLAGS']} t={t} />
          </Section>

          <Section id="allocation" title={t('Daily limits per meal')} intro={t('To check one meal against a daily limit, the limit is shared across the day.')}>
            <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {PERIODS.map((p: { id: string; label: string }) => (
                <div key={p.id} className="flex flex-col gap-1 rounded-[16px] border border-border bg-card px-4 py-3">
                  <dd className="order-1 font-display text-2xl font-semibold text-heading tabular">{pct(p.id)}</dd>
                  <dt className="order-2 text-sm text-muted-foreground">{t(p.label)}</dt>
                </div>
              ))}
            </dl>
            <p className="text-sm text-muted-foreground">{t('A Mizan prototype assumption; a hospital would set its own distribution.')}</p>
          </Section>

          <Section id="allergens" title={t('The 14 SFDA allergens')} intro={t('Every allergy record and meal label uses SFDA’s list of declarable allergens.')}>
            <p className="text-sm">{t((SOURCES as any)['SFDA-ALLERGENS'].summary)}</p>
            <ul className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 md:grid-cols-3">
              {ALLERGENS.map((a: { id: string; label: string; hint?: string }) => (
                <li key={a.id} className="flex flex-col rounded-[12px] border border-border bg-background px-3 py-2">
                  <b className="text-heading">{t(a.label)}</b>
                  {a.hint ? <span className="text-xs text-muted-foreground">{t(a.hint)}</span> : null}
                </li>
              ))}
            </ul>
            <p className="text-sm">{t('Meals are never called “allergy-safe”. Ingredients that may contain an allergen through cross-contact exclude the meal for a confirmed allergy, and the kitchen is told which labels to check.')}</p>
            <SourceLinks ids={['SFDA-ALLERGENS']} t={t} />
          </Section>

          <Section id="texture" title={t('Texture-modified diets (IDDSI)')} intro={t('The care team sets the texture level; every such meal needs admin review.')}>
            <p className="text-sm">{t('Menu items do not have a recorded IDDSI level, so the kitchen prepares each meal at the prescribed level after review.')}</p>
            <ul className="flex list-disc flex-col gap-1 ps-5">{TEXTURE_LEVELS.map((x: { id: string; label: string }) => <li key={x.id}>{t(x.label)}</li>)}</ul>
            <SourceLinks ids={['IDDSI']} t={t} />
          </Section>

          <Section id="local" title={t('Local produce (MEWA)')} intro={t('Ingredients the Kingdom produces widely are marked on the menu and kitchen summary.')}>
            <p className="text-sm">{t((SOURCES as any)['MEWA-LOCAL'].summary)}</p>
            <Table caption={t('National self-sufficiency by food group')} className="sm:w-auto">
              <thead><tr><Th scope="col">{t('Group')}</Th><Th scope="col" className="text-end">{t('Self-sufficiency')}</Th><Th scope="col" className="text-end">{t('Year')}</Th></tr></thead>
              <tbody>{Object.entries(LOCAL_PRODUCTION).map(([k, l]: [string, any]) => <tr key={k}><Td>{t(l.label)}</Td><Td className="text-end tabular">{l.selfSufficiency}%</Td><Td className="text-end tabular">{l.year}</Td></tr>)}</tbody>
            </Table>
            <p className="text-sm text-muted-foreground">{t('Self-sufficiency = domestic production ÷ consumption. It does not show where a particular product was grown.')}</p>
            <ul className="flex flex-col gap-1 text-sm">{LOCAL_PRODUCTION_SOURCES.map((s: { url: string; publisher: string }) => <li key={s.url}><ExtLink href={s.url}>{t(s.publisher)}</ExtLink></li>)}</ul>
          </Section>

          <Section id="waste" title={t('Food security and food waste (GFSA)')} intro={t('A secondary benefit: hospital leftovers and plate waste are recorded for every meal.')}>
            <p className="text-sm">{t((SOURCES as any).GFSA.summary)}</p>
            <p className="text-sm">{t((SOURCES as any)['GFSA-WASTE'].summary)}</p>
            <p className="text-sm">{t('Estimated leftovers and weighed plate waste are recorded separately, and the nutrition team dashboard shows both. Meals ranked by preference and portions matched to appetite are intended to reduce avoidable waste; the prototype does not measure that effect.')}</p>
            <ul className="flex flex-col gap-1 text-sm">
              {['GFSA', 'GFSA-WASTE'].flatMap((id) => {
                const s = (SOURCES as any)[id];
                return [<li key={id}><ExtLink href={s.url}>{t(s.title)}</ExtLink> · <span className="text-muted-foreground">{t(s.publisher)}</span></li>, ...(s.links ?? []).map((l: { url: string; label: string }) => <li key={l.url}><ExtLink href={l.url}>{t(l.label)}</ExtLink></li>)];
              })}
            </ul>
          </Section>

        </div>
        <p id="sources" className="scroll-mt-24 text-sm text-muted-foreground"><b className="text-heading">{t('Sources and limitations.')}</b> {t('Every source behind these rules and the project’s limitations are listed on')} <Link href="/sources">{t('Data sources & limitations')}</Link>{t('.')}</p>
      </div>
    </>
  );
}
