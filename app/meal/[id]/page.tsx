import { cache } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronLeft, Scale, Layers, Check, X, Shield, TriangleAlert, Leaf, List } from 'lucide-react';
import { publicMetadata } from '@/components/public/seo';
import { SITE_URL } from '@/lib/site';
import { serviceCall, publicCall, param } from '@/lib/server/data';
import { getActor } from '@/lib/server/session';
import { withQuery } from '@/components/public/url';
import { isoDate, formatDate } from '@/lib/format';
import { MealArt, WhyThisMeal } from '@/components/cb/meal';
import { ScreenChip } from '@/components/cb/status';
import { periodLabel, portionLabel, allergenName } from '@/components/cb/labels';
import { Badge } from '@/components/ui/badge';
import { Notice } from '@/components/ui/notice';
import { Accordion } from '@/components/ui/accordion';
import { Table, Th, Td } from '@/components/ui/table';
import { Panel, ExtLink } from '@/components/public/blocks';
import { CompatChip, type Compat } from '@/components/public/compat';
import { JsonLd } from '@/components/public/json-ld';
import { PERIODS, PORTIONS } from '@/domain/constants.js';
import { getT, getLang } from '@/lib/i18n/server';
import type { T } from '@/lib/i18n';

/* eslint-disable @typescript-eslint/no-explicit-any */
type Props = { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

/** The public view of a meal (no patient), shared by metadata and the page. */
const loadPublic = cache(async (id: string) => publicCall((s) => s.getMealDetail(null, id, {})));

const fmt = (v: number | null | undefined, d: number) => (v == null ? '—' : Number(v).toLocaleString('en-US', { maximumFractionDigits: d }));
const FRACTION: Record<number, string> = { 0.5: '½', 1: '1', 1.5: '1½' };

function describe(m: any, t: T) {
  const kind = m.type === 'complete' ? t('Complete meal: {list}.', { list: m.components.map((c: { name: string }) => t(c.name)).join(' + ') }) : t('Individual dish.');
  return `${m.description ? `${t(m.description)} ` : ''}${kind} ${t('Ingredients, portions, nutrition (SFDA values where they exist), the 14 SFDA allergens and fit with each hospital diet category.')}`.slice(0, 300);
}

/** Arabic shows the dish's own Arabic name when the data has one. */
const nameIn = (lang: string, t: T) => (x: { name: string; nameAr?: string | null }) => (lang === 'ar' ? x.nameAr || t(x.name) : x.name);

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { id } = await params;
  const sp = await searchParams;
  const { meal } = await loadPublic(id);
  const t = await getT();
  const nm = nameIn(await getLang(), t);
  const single = meal.type !== 'complete' && meal.components?.length === 1 ? meal.components[0] : null;
  // Patient-specific views are private; the canonical page is the public one.
  return publicMetadata({ title: nm({ name: meal.name, nameAr: meal.nameAr ?? single?.nameAr }), description: describe(meal, t), path: `/meal/${meal.id}`, noindex: Boolean(param(sp.patient)) });
}

export default async function MealPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const t = await getT();
  const lang = await getLang();
  const nm = nameIn(lang, t);
  const list = (xs: string[]) => xs.join(t(', '));
  const signedIn = await getActor();
  const actor = signedIn && signedIn.status === 'active' ? signedIn : null;
  const role = actor?.role ?? null;
  const staff = role === 'admin' || role === 'staff';
  const period = PERIODS.some((p: { id: string }) => p.id === param(sp.period)) ? param(sp.period)! : null;
  const date = isoDate(param(sp.date));
  const patientId = role === 'patient' ? actor!.patientId : staff ? param(sp.patient) ?? null : null;
  const d = actor ? await serviceCall((s) => s.getMealDetail(actor, id, { patientId, date, period })) : await loadPublic(id);

  const m = d.meal;
  const n = m.nutrition;
  const portions: string[] = m.portions;
  const complete = m.type === 'complete';
  const mealName = nm({ name: m.name, nameAr: m.nameAr ?? (!complete && m.components.length === 1 ? m.components[0].nameAr : null) });
  const pLabel = (p: string) => t(portionLabel(p));
  const ev = d.evaluation;
  const back: [string, string] = d.patient && role !== 'patient'
    ? [withQuery(`/patients/${d.patient.id}`, { date }), t('Back to {id}', { id: d.patient.demoId })]
    : role === 'patient' ? [withQuery('/my-meals', { date, period }), t('My meals')]
      : [withQuery('/menu', { date, period }), t('Hospital menu')];
  const cell = (row: any, key: string, decimals: number) => (row.complete[key] != null ? fmt(row.complete[key], decimals) : row.partial[key] != null ? `≥ ${fmt(row.partial[key], decimals)}` : '—');
  const factors = portions.map((p) => FRACTION[(PORTIONS as { id: string; factor: number }[]).find((x) => x.id === p)?.factor ?? 1] ?? '1');

  // Structured data: a menu item with nutrition only when every dish has SFDA values (never estimated or partial).
  const url = `${SITE_URL}/meal/${m.id}`;
  const ps = n.perServing ?? {};
  const g = (k: string, unit: string) => (ps[k] != null ? `${ps[k]} ${unit}` : undefined);
  const nutrition = n.allAvailable && ps.kcal != null ? {
    '@type': 'NutritionInformation', servingSize: m.servingSize, calories: g('kcal', 'kcal'), proteinContent: g('protein', 'g'), carbohydrateContent: g('carbs', 'g'),
    fiberContent: g('fiber', 'g'), sugarContent: g('sugar', 'g'), fatContent: g('fat', 'g'), saturatedFatContent: g('satFat', 'g'), cholesterolContent: g('cholesterol', 'mg'), sodiumContent: g('sodium', 'mg'),
  } : undefined;
  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'MenuItem', '@id': `${url}#meal`, name: mealName, url, description: m.description ? t(m.description) : undefined, ...(nutrition ? { nutrition } : {}) },
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: t('Home'), item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: t('Hospital Meal Menu'), item: `${SITE_URL}/menu` },
        { '@type': 'ListItem', position: 3, name: mealName, item: url },
      ] },
    ],
  };

  return (
    <>
      <JsonLd data={ld} />
      <div className="container-page grid items-start gap-6 pb-8 pt-6 sm:pt-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-12">
        <MealArt meal={m} label className="aspect-[4/3] w-full rounded-[24px] shadow-lift" />
        <div className="flex min-w-0 flex-col gap-4">
          <Link href={back[0]} className="inline-flex w-fit items-center gap-1 text-sm"><ChevronLeft className="size-4 rtl:-scale-x-100" aria-hidden />{back[1]}</Link>
          <span className="eyebrow">{complete ? t('Complete meal · {n} components', { n: m.components.length }) : t('Individual dish')} · {t(m.cuisine)} · {t('usually served at {period}', { period: lang === 'ar' ? t(periodLabel(m.category)) : periodLabel(m.category).toLowerCase() })}</span>
          <h1 className="text-[2rem] leading-tight sm:text-[2.5rem]">{mealName}</h1>
          {m.description ? <p className="text-[1.1rem]">{t(m.description)}</p> : null}
          {complete ? (
            <ol className="flex list-decimal flex-col gap-1 ps-5">
              {m.components.map((c: any) => <li key={c.dishId}><b className="text-heading">{nm(c)}</b>{c.nameAr && lang !== 'ar' ? <> <span lang="ar" dir="rtl">{c.nameAr}</span></> : null} <span className="text-sm text-muted-foreground">· {t(c.kindLabel)} · {t('{n} g', { n: c.grams })}</span></li>)}
            </ol>
          ) : null}
          <div className="flex flex-col gap-1 text-sm text-muted-foreground">
            <span className="inline-flex items-start gap-1.5"><Scale className="mt-0.5 size-4 shrink-0 text-heading" aria-hidden />{t('Standard serving:')} {t(m.servingSize)}</span>
            <span className="inline-flex items-start gap-1.5"><Layers className="mt-0.5 size-4 shrink-0 text-heading" aria-hidden />{t('Portions:')} {list(portions.map(pLabel))} {complete ? t('({factors} of every component)', { factors: list(factors) }) : t('({factors} of the standard serving)', { factors: list(factors) })}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {m.available ? <Badge variant="ok"><Check aria-hidden />{t('Available')}</Badge> : <Badge variant="danger" className="whitespace-normal"><X aria-hidden />{t('Unavailable')}{m.unavailableReason ? `: ${t(m.unavailableReason)}` : ''}</Badge>}
            {m.infoReview?.status === 'verified'
              ? <Badge variant="ok" className="whitespace-normal"><Shield aria-hidden />{m.infoReview.by ? t('Dietary information verified by {name}', { name: m.infoReview.by }) : t('Dietary information verified')}</Badge>
              : <Badge variant="warn" className="whitespace-normal"><TriangleAlert aria-hidden />{m.infoReview?.changedBy ? t('Dietary information changed by {name}; not yet verified by an admin', { name: m.infoReview.changedBy }) : t('Dietary information changed; not yet verified by an admin')}</Badge>}
            <Badge variant="outline">{t('Version {v}', { v: m.version })}</Badge>
          </div>
          {m.onMenu.length
            ? <p className="text-sm"><b className="text-heading">{t('On the menu in the next 7 days:')}</b> {m.onMenu.map((x: any) => (lang === 'ar' ? `${t(x.name)} (${list(x.periods.map((p: string) => t(periodLabel(p))))})` : `${x.name} (${x.periods.map(periodLabel).join(', ').toLowerCase()})`)).join(' · ')}</p>
            : <p className="text-sm text-muted-foreground">{t('Not on the menu in the next 7 days.')}</p>}
          {m.local.length ? <p className="flex items-start gap-1.5 text-sm text-success"><Leaf className="mt-0.5 size-4 shrink-0" aria-hidden /><span>{t('Local Saudi produce (MEWA / GASTAT 2024 self-sufficiency):')} {m.local.map((l: any) => `${t(l.ingredient)} (${t(l.label)}, ${l.selfSufficiency}%)`).join(' · ')}</span></p> : null}
          {ev && d.patient ? (
            <Panel tone={ev.status === 'excluded' ? 'blush' : 'mint'} className="p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg">{role === 'patient' ? t('For you') : t('For {id} ({name})', { id: d.patient.demoId, name: d.patient.preferredName })} · {t(periodLabel(d.patient.period))}</h2>
                <ScreenChip status={ev.status} />
              </div>
              {ev.portion ? <p className="text-sm">{t(ev.portion.explanation)}</p> : null}
              <WhyThisMeal ev={ev} open audience={role === 'patient' ? 'patient' : 'staff'} />
            </Panel>
          ) : null}
        </div>
      </div>

      <div className="container-page grid items-start gap-8 pb-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,400px)]">
        <div className="flex min-w-0 flex-col gap-10">
          {m.components.map((c: any) => (
            <section key={c.dishId} aria-labelledby={`cmp-${c.dishId}`} className="flex flex-col gap-3">
              <h2 id={`cmp-${c.dishId}`} className="text-[1.4rem] sm:text-[1.6rem]">{complete ? `${t(c.kindLabel)}: ` : `${t('Ingredients')}: `}{nm(c)}{c.nameAr && lang !== 'ar' ? <> <span className="font-sans text-base font-normal text-muted-foreground" lang="ar" dir="rtl">{c.nameAr}</span></> : null}</h2>
              <p className="text-sm text-muted-foreground">{t('{g} g per standard serving ({serving}). Ingredient grams are per standard portion and are used to scale kitchen quantities.', { g: c.grams, serving: t(c.servingSize) })}{c.sfct ? ` ${t('Prepared to the SFDA Saudi Food Composition Tables standard recipe “{name}” ({region} region, recipe p. {recipe}, nutrient table p. {page}).', { name: nm(c.sfct), region: t(c.sfct.region), recipe: c.sfct.recipePage, page: c.sfct.page })}` : ''}</p>
              <ul className="flex flex-col rounded-[16px] border border-border bg-card px-4">
                {c.ingredients.map((i: any) => (
                  <li key={i.id} className="grid grid-cols-[72px_minmax(0,1fr)] gap-3 border-b border-dashed border-border py-2.5 last:border-b-0 sm:grid-cols-[96px_minmax(0,1fr)]">
                    <span className="font-display font-medium text-heading tabular">{t('{n} g', { n: fmt(i.grams, 1) })}</span>
                    <span className="flex min-w-0 flex-col gap-1">
                      <span><b className="text-heading">{nm(i)}</b>{i.prep ? `${t(', ')}${t(i.prep)}` : ''}{i.optional ? <> <Badge variant="outline">{t('optional')}</Badge></> : null}</span>
                      {(i.allergens.length || i.mayContain.length || i.labelCheck || i.local) ? (
                        <span className="flex flex-wrap gap-1.5">
                          {i.allergens.length ? <Badge variant="danger" className="whitespace-normal"><TriangleAlert aria-hidden />{t('Contains {list}', { list: list(i.allergens.map((a: string) => allergenName(a, t))) })}</Badge> : null}
                          {i.mayContain.length ? <Badge variant="warn" className="whitespace-normal"><TriangleAlert aria-hidden />{t('May contain {list}', { list: list(i.mayContain.map((a: string) => allergenName(a, t))) })}</Badge> : null}
                          {i.labelCheck ? <Badge variant="outline">{t('Kitchen checks label')}</Badge> : null}
                          {i.local ? <Badge variant="ok"><Leaf aria-hidden />{t('Local: {label}', { label: t(i.local.label) })}</Badge> : null}
                        </span>
                      ) : null}
                      {i.note ? <span className="text-sm text-muted-foreground">{t(i.note)}</span> : null}
                    </span>
                  </li>
                ))}
              </ul>
              {staff && c.steps.length ? (
                <Accordion className="rounded-[16px] border border-border bg-card" headClassName="min-h-11 px-4 py-3 font-display text-sm font-semibold text-heading"
                  title={<span className="inline-flex items-center gap-2"><List className="size-4" aria-hidden />{c.batchPortions ? t('Kitchen preparation (method written for a batch of {n})', { n: c.batchPortions }) : t('Kitchen preparation')}</span>}>
                  <div className="flex flex-col gap-3 px-4 pb-4">
                    <ol className="flex list-decimal flex-col gap-1.5 ps-5">{c.steps.map((s: string, k: number) => <li key={k}>{t(s)}</li>)}</ol>
                    {c.notes.length ? <ul className="flex list-disc flex-col gap-1 ps-5 text-sm text-muted-foreground">{c.notes.map((x: string, k: number) => <li key={k}>{t(x)}</li>)}</ul> : null}
                  </div>
                </Accordion>
              ) : null}
            </section>
          ))}

          <section aria-labelledby="cmpt-h" className="flex flex-col gap-3">
            <h2 id="cmpt-h" className="text-[1.4rem] sm:text-[1.6rem]">{t('Which hospital diets this fits')}</h2>
            <p className="text-sm text-muted-foreground">{t('Checked with each diet’s documented rules and default limits. Each patient is also checked against their own diet order. Tap a result to see why.')}</p>
            <ul className="flex flex-col rounded-[16px] border border-border bg-card">
              {(m.compatibility as Compat[]).map((c) => (
                <li key={c.id} className="grid gap-2 border-b border-border px-4 py-3 last:border-b-0 md:grid-cols-[minmax(0,1fr)_auto] md:items-start md:gap-x-4">
                  <div className="flex min-w-0 flex-col gap-1">
                    <span><b className="text-heading">{t(c.label)}</b> <span className="text-sm text-muted-foreground">({c.code})</span></span>
                    <span className="text-sm">{t(c.note)}</span>
                    <span className="text-sm text-muted-foreground">{t('Portions passing:')} {list(c.portions.map(pLabel)) || '—'}</span>
                  </div>
                  <div className="md:justify-self-end"><CompatChip c={c} /></div>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="flex min-w-0 flex-col gap-5 lg:sticky lg:top-24" aria-label={t('Nutrition, allergens and sources')}>
          <Panel className="p-4 sm:p-5">
            <h2 id="nu-h" className="text-xl">{complete ? t('Nutrition for the full meal') : t('Nutrition')}</h2>
            {n.available ? (
              <>
                {complete ? (
                  <Table caption={t('Nutrition per component, standard serving')}>
                    <thead><tr><Th scope="col" className="px-2.5">{t('Component')}</Th><Th scope="col" className="px-2.5 text-end">{t('kcal')}</Th><Th scope="col" className="px-2.5 text-end">{t('Carbs g')}</Th><Th scope="col" className="px-2.5 text-end">{t('Sodium mg')}</Th></tr></thead>
                    <tbody>
                      {m.components.map((c: any) => (
                        <tr key={c.dishId}>
                          <Th scope="row" className="bg-transparent px-2.5 text-[.85rem] normal-case tracking-normal">{nm(c)}</Th>
                          {c.nutrition.available
                            ? <><Td className="px-2.5 text-end tabular">{fmt(c.nutrition.perPortion.kcal, 0)}</Td><Td className="px-2.5 text-end tabular">{fmt(c.nutrition.perPortion.carbs, 1)}</Td><Td className="px-2.5 text-end tabular">{fmt(c.nutrition.perPortion.sodium, 0)}</Td></>
                            : <Td colSpan={3} className="text-end text-muted-foreground">{t('no SFDA values')}</Td>}
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                ) : null}
                <Table caption={complete ? t('Meal totals by portion') : t('Nutrition by portion')}>
                  <thead><tr><Th scope="col" className="px-2.5">{t('Nutrient')}</Th>{portions.map((p) => <Th key={p} scope="col" className="px-2.5 text-end">{pLabel(p)}</Th>)}</tr></thead>
                  <tbody>
                    {n.nutrients.map((x: any) => (
                      <tr key={x.key}>
                        <Th scope="row" className="bg-transparent px-2.5 text-[.85rem] normal-case tracking-normal">{t(x.label)} <span className="font-sans font-normal text-muted-foreground">({t(x.unit)})</span></Th>
                        {portions.map((p) => <Td key={p} className="whitespace-nowrap px-2.5 text-end tabular"><bdi>{cell(n.byPortion[p], x.key, x.decimals)}</bdi></Td>)}
                      </tr>
                    ))}
                  </tbody>
                </Table>
                <p className="text-sm text-muted-foreground">{t(n.method)} {t('“—” means not reported; “≥” is a partial total that leaves out components without SFDA values. Nothing is estimated.')}</p>
              </>
            ) : (
              <>
                <Notice tone="warn" title={t('No nutrition values')}>{t(n.method)}</Notice>
                <p className="text-sm text-muted-foreground">{t('Diets with nutrient limits (sodium, carbohydrate, potassium, phosphorus) need admin review for this meal.')}</p>
              </>
            )}
          </Panel>

          <Panel>
            <h2 className="text-xl">{t('Allergens (SFDA 14)')}</h2>
            <p><b className="text-heading">{t('Contains:')}</b> {m.allergens.contains.length ? list(m.allergens.contains.map((a: string) => allergenName(a, t))) : t('none of the 14 declarable allergens')}</p>
            {m.allergens.mayContain.length ? <p><b className="text-heading">{t('May contain:')}</b> {list(m.allergens.mayContain.map((a: string) => allergenName(a, t)))}</p> : null}
            {m.allergens.labelCheck.length ? <p className="text-sm">{t('The kitchen checks labels of: {list}.', { list: list(m.allergens.labelCheck.map((x: string) => t(x))) })}</p> : null}
            <p className="text-sm text-muted-foreground">{t('Worked out from every component’s ingredients. CareBite never labels a meal “allergy-safe”.')}</p>
          </Panel>

          <Panel tone="blush">
            <h2 className="text-xl">{t('Sources and limitations')}</h2>
            <ul className="flex list-disc flex-col gap-1.5 ps-5 text-sm">{m.limitations.map((x: string) => <li key={x}>{t(x)}</li>)}</ul>
            <ul className="flex flex-col gap-1.5 border-t border-rose pt-3 text-sm">
              {m.components.filter((c: any) => c.sfct).map((c: any) => <li key={c.dishId}>{t('SFCT:')} <ExtLink href={m.dataSources.sfct.links[0].url}>{nm(c.sfct)}</ExtLink>{t(', ')}{t(c.sfct.region)}{t(', ')}{t('p. {page}', { page: c.sfct.page })} ({t(c.sfct.yield)})</li>)}
              <li><ExtLink href={m.dataSources.sfct.url}>{t(m.dataSources.sfct.title)}</ExtLink></li>
              <li><ExtLink href={m.dataSources.allergens.url}>{t('SFDA allergen disclosure (14 allergens)')}</ExtLink></li>
              <li><ExtLink href={m.dataSources.local.url}>{t('MEWA local produce')}</ExtLink></li>
              <li><Link href="/sources">{t('All data sources and limitations')}</Link></li>
            </ul>
            {m.updatedAt ? <p className="text-sm text-muted-foreground">{m.updatedBy ? t('Last changed {date} by {name}.', { date: formatDate(m.updatedAt, { month: 'short', day: 'numeric', year: 'numeric' }, lang), name: m.updatedBy }) : t('Last changed {date}.', { date: formatDate(m.updatedAt, { month: 'short', day: 'numeric', year: 'numeric' }, lang) })}</p> : null}
          </Panel>
        </aside>
      </div>
    </>
  );
}
