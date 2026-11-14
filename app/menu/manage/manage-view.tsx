'use client';
import * as React from 'react';
import Link from 'next/link';
import { List, Layers, Tag, Calendar, Database, Plus, Pencil, ShieldCheck, TriangleAlert, Check, X as XIcon, Eye, Info, Ban, CircleCheck } from 'lucide-react';
import { useApi, apiPath, apiSend } from '@/lib/api-client';
import { useSWRConfig } from 'swr';
import { PageHead, PageBody } from '@/components/site/page-head';
import { periodLabel, portionLabel, allergenName } from '@/components/cb/labels';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Table, Th, Td } from '@/components/ui/table';
import { Notice } from '@/components/ui/notice';
import { Tabs, TabsList, TabsTab, TabsPanel } from '@/components/ui/tabs';
import { Accordion } from '@/components/ui/accordion';
import { Dialog } from '@/components/ui/dialog';
import { toast } from '@/components/ui/toast';
import { formatDate } from '@/lib/format';
import { useT } from '@/components/site/lang';
import { When } from '@/components/staff/ui';
import { TABS, type Tab } from './tabs';
import { MealEditor, DishEditor, IngredientEditor, PlanEditor, UnavailableDialog, VerifyDialog } from './editors';

/* eslint-disable @typescript-eslint/no-explicit-any */
type Catalog = any;
type Plan = any;
type Editing =
  | { kind: 'meal'; id: string | null } | { kind: 'dish'; id: string | null } | { kind: 'ingredient'; id: string | null }
  | { kind: 'plan'; date: string; period: string } | { kind: 'unavailable'; id: string } | { kind: 'verify'; id: string };

const CAT_KEY = '/api/manage/catalog';
const TAB_ICON: Record<Tab, React.ComponentType<{ 'aria-hidden'?: boolean }>> = { meals: List, dishes: Layers, ingredients: Tag, plan: Calendar, sfct: Database };
const rowHead = 'bg-transparent font-sans text-sm font-semibold normal-case tracking-normal text-foreground';

export function ManageView({ catalog, plan, initialTab, permissions }: { catalog: Catalog; plan: Plan; initialTab: Tab; permissions: string[] }) {
  const { t, lang } = useT();
  const sep = lang === 'ar' ? '، ' : ', ';
  const an = (id: string) => allergenName(id, t);
  const nm = (x: { name: string; nameAr?: string | null }) => (lang === 'ar' && x.nameAr ? x.nameAr : t(x.name));
  const planKey = apiPath('/api/manage/menu', { from: plan.from });
  const cat = useApi<Catalog>(CAT_KEY, catalog);
  const pl = useApi<Plan>(planKey, plan);
  const { mutate } = useSWRConfig();
  const data = cat.data ?? catalog;
  const menu = pl.data ?? plan;
  const [tab, setTab] = React.useState<Tab>(initialTab);
  const [editing, setEditing] = React.useState<(Editing & { n: number }) | null>(null);
  const [shown, setShown] = React.useState<(Editing & { n: number }) | null>(null);
  const [sfctQ, setSfctQ] = React.useState('');
  const counter = React.useRef(0);
  const canEdit = permissions.includes('menu:edit') && data.canEdit;
  const canVerify = permissions.includes('menu:verify') && data.canVerify;

  const open = (e: Editing) => { const v = { ...e, n: ++counter.current }; setEditing(v); setShown(v); };
  const close = () => setEditing(null);
  const refresh = () => Promise.all([mutate(CAT_KEY), mutate(planKey)]);
  const saved = () => { close(); void refresh(); };
  const changeTab = (t: Tab) => { setTab(t); window.history.replaceState(null, '', apiPath('/menu/manage', { tab: t === 'meals' ? '' : t })); };

  const markAvailable = async (m: any) => {
    try {
      await apiSend('POST', `/api/manage/meals/${m.id}/availability`, { available: true });
      toast(t('{meal} is available again. Held orders stay on hold until the team reviews them.', { meal: t(m.name) }), { timeout: 8000 });
      await refresh();
    } catch (err) { toast((err as Error).message, { tone: 'error' }); }
  };

  const mealActions = (m: any) => (
    <>
                          <Button size="sm" variant="outline" onClick={() => open({ kind: 'meal', id: m.id })}><Pencil aria-hidden />{t('Edit')}<span className="sr-only"> {t(m.name)}</span></Button>
                          {m.available
                            ? <Button size="sm" variant="ghost" onClick={() => open({ kind: 'unavailable', id: m.id })}><Ban aria-hidden />{t('Mark unavailable')}<span className="sr-only">: {t(m.name)}</span></Button>
                            : <Button size="sm" variant="ghost" onClick={() => markAvailable(m)}><CircleCheck aria-hidden />{t('Mark available')}<span className="sr-only">: {t(m.name)}</span></Button>}
                          {canVerify && m.infoReview?.status !== 'verified' ? <Button size="sm" onClick={() => open({ kind: 'verify', id: m.id })}><ShieldCheck aria-hidden />{t('Verify')}<span className="sr-only"> {t(m.name)}</span></Button> : null}
    </>
  );
  const dishEdit = (d: any) => <Button size="sm" variant="outline" onClick={() => open({ kind: 'dish', id: d.id })}><Pencil aria-hidden />{t('Edit')}<span className="sr-only"> {nm(d)}</span></Button>;
  const ingEdit = (i: any) => <Button size="sm" variant="outline" onClick={() => open({ kind: 'ingredient', id: i.id })}><Pencil aria-hidden />{t('Edit')}<span className="sr-only"> {t(i.name)}</span></Button>;
  const pending = data.meals.filter((m: any) => m.infoReview?.status === 'pending').length;
  const unavailable = data.meals.filter((m: any) => m.available === false).length;
  const mealById = (id: string) => data.meals.find((m: any) => m.id === id);
  const today = menu.from;
  const term = sfctQ.trim().toLowerCase();
  const sfctRows = data.sfct.filter((x: any) => !term || `${x.name} ${x.nameAr ?? ''} ${x.region}`.toLowerCase().includes(term));
  const flagLabel = (f: string) => t(data.vocab.ingredientFlags.find((x: any) => x.id === f)?.label ?? f);

  return (
    <>
      <PageHead eyebrow={t('Hospital menu')} title={t('Menu Management')} space="staff">
        <p>{t(canEdit ? 'Add and edit meals, dishes and ingredients. Set availability and portions, plan meals by date, and record where dietary information comes from and whether it’s verified.' : 'You can view the menu here. Healthcare providers and admins keep it up to date.')} {canVerify ? t('As an admin, you also verify dietary information.') : ''}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {pending ? <Badge variant="warn"><TriangleAlert aria-hidden />{t(pending === 1 ? '{n} meal pending admin verification' : '{n} meals pending admin verification', { n: pending })}</Badge> : <Badge variant="ok"><ShieldCheck aria-hidden />{t('All dietary information verified')}</Badge>}
          {unavailable ? <Badge variant="danger"><XIcon aria-hidden />{t(unavailable === 1 ? '{n} meal unavailable' : '{n} meals unavailable', { n: unavailable })}</Badge> : null}
          <Link href="/menu" className={buttonVariants({ variant: 'ghost', size: 'sm' })}><Eye aria-hidden />{t('Public menu view')}</Link>
        </div>
      </PageHead>
      <PageBody space="staff">
        {cat.error || pl.error ? <Notice tone="danger" title={t('We couldn’t refresh the menu catalogue.')}>{t((cat.error ?? pl.error)?.message ?? '')} {t('Check your connection and try again.')}</Notice> : null}
        <Tabs value={tab} onValueChange={(v) => changeTab(v as Tab)} className="flex flex-col gap-5">
          <TabsList aria-label={t('Menu management')}>
            {TABS.map(([id, label]) => { const Icon = TAB_ICON[id]; return <TabsTab key={id} value={id}><Icon aria-hidden />{t(label)}</TabsTab>; })}
          </TabsList>

          <TabsPanel value="meals" className="flex flex-col gap-4 outline-none">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <p className="max-w-3xl text-sm text-muted-foreground">{lang === 'ar' ? t('A meal is what a patient is offered for one meal period: one dish (individual dish) or several dishes (complete meal). Allergens and nutrition are worked out from its dishes.') : <>A <b>meal</b> is what a patient is offered for one meal period: one dish (individual dish) or several dishes (complete meal). Allergens and nutrition are worked out from its dishes.</>}</p>
              {canEdit ? <Button className="shrink-0 max-sm:w-full" onClick={() => open({ kind: 'meal', id: null })}><Plus aria-hidden />{t('Add meal')}</Button> : null}
            </div>
            <Table caption={t('Hospital meals')}>
              <thead><tr><Th scope="col">{t('Meal')}</Th><Th scope="col">{t('Components')}</Th><Th scope="col">{t('Nutrition')}</Th><Th scope="col">{t('Availability')}</Th><Th scope="col">{t('Dietary information')}</Th>{canEdit ? <Th scope="col" className="hidden md:table-cell">{t('Actions')}</Th> : null}</tr></thead>
              <tbody>
                {data.meals.filter((m: any) => !m.archived).map((m: any) => (
                  <tr key={m.id} id={`ms-${m.id}`}>
                    <Th scope="row" className={`min-w-48 ${rowHead}`}><Link href={`/meal/${m.id}`}>{t(m.name)}</Link><br /><span className="text-xs font-normal text-muted-foreground">{t(periodLabel(m.category))} · {t(m.type === 'complete' ? 'Complete meal' : 'Individual dish')} · v{m.version}</span>{canEdit ? <div className="relative mt-2 flex flex-wrap gap-1.5 md:hidden [&>button]:whitespace-nowrap">{mealActions(m)}</div> : null}</Th>
                    <Td className="min-w-48 text-sm">{m.components.map((c: any) => `${nm(c)} (${c.grams} ${t('g')})`).join(' + ')}<br /><span className="text-muted-foreground">{t('Portions:')} {m.portions.map((x: string) => t(portionLabel(x))).join(sep)}</span></Td>
                    <Td>{m.nutritionComplete ? <Badge variant="ok"><Check aria-hidden />{t('SFDA values')}</Badge> : m.nutritionAvailable ? <Badge variant="warn"><Info aria-hidden />{t('Partial')}</Badge> : <Badge variant="outline">{t('None')}</Badge>}</Td>
                    <Td className="min-w-40 text-sm">
                      {m.available ? <Badge variant="ok"><Check aria-hidden />{t('Available')}</Badge> : <><Badge variant="danger"><XIcon aria-hidden />{t('Unavailable')}</Badge><br />{m.unavailableReason ? t(m.unavailableReason) : ''}</>}
                      {m.availabilityChangedBy ? <><br /><span className="text-muted-foreground">{m.availabilityChangedBy}, <When iso={m.availabilityChangedAt} /></span></> : null}
                    </Td>
                    <Td className="min-w-44 text-sm">
                      {m.infoReview?.status === 'verified'
                        ? <><Badge variant="ok"><ShieldCheck aria-hidden />{t('Verified')}</Badge><br /><span className="text-muted-foreground">{m.infoReview.by ?? ''} <When iso={m.infoReview.at} /></span></>
                        : <><Badge variant="warn"><TriangleAlert aria-hidden />{t('Pending verification')}</Badge><br /><span className="text-muted-foreground">{t('changed by {name}', { name: m.infoReview?.changedBy ?? '—' })} <When iso={m.infoReview?.changedAt} /></span></>}
                    </Td>
                    {canEdit ? <Td className="relative hidden md:table-cell"><div className="flex min-w-40 flex-col gap-1.5">{mealActions(m)}</div></Td> : null}
                  </tr>
                ))}
              </tbody>
            </Table>
            <p className="flex items-start gap-1.5 text-sm text-muted-foreground"><Info className="mt-0.5 size-4 shrink-0" aria-hidden /><span>{t('Changing ingredients, components, portion weights or the nutrition source marks the meal “pending verification”: until an admin verifies it, it needs admin review for every patient. Marking a meal unavailable puts upcoming orders for it on hold and alerts the team and the kitchen.')}</span></p>
          </TabsPanel>

          <TabsPanel value="dishes" className="flex flex-col gap-4 outline-none">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <p className="max-w-3xl text-sm text-muted-foreground">{lang === 'ar' ? t('A dish is one component. Its ingredients are in grams per standard portion. Link it to an SFDA Saudi Food Composition Table entry only if the kitchen prepares it to that standard recipe; otherwise it has no nutrient values.') : <>A <b>dish</b> is one component. Its ingredients are in grams per standard portion. Link it to an SFDA Saudi Food Composition Table entry only if the kitchen prepares it to that standard recipe; otherwise it has no nutrient values.</>}</p>
              {canEdit ? <Button className="shrink-0 max-sm:w-full" onClick={() => open({ kind: 'dish', id: null })}><Plus aria-hidden />{t('Add dish')}</Button> : null}
            </div>
            <Table caption={t('Dishes')}>
              <thead><tr><Th scope="col">{t('Dish')}</Th><Th scope="col">{t('Portion')}</Th><Th scope="col">{t('Nutrition source')}</Th><Th scope="col">{t('Allergens')}</Th><Th scope="col">{t('Used in')}</Th>{canEdit ? <Th scope="col" className="hidden md:table-cell">{t('Actions')}</Th> : null}</tr></thead>
              <tbody>
                {data.dishes.map((d: any) => (
                  <tr key={d.id}>
                    <Th scope="row" className={`min-w-48 ${rowHead}`}>{nm(d)}{d.nameAr ? <> {lang === 'ar' ? <span className="text-xs font-normal text-muted-foreground" lang="en" dir="ltr">{d.name}</span> : <span className="text-xs font-normal text-muted-foreground" lang="ar" dir="rtl">{d.nameAr}</span>}</> : null}<br /><span className="text-xs font-normal text-muted-foreground">{t(data.vocab.dishKinds.find((k: any) => k.id === d.kind)?.label ?? d.kind)} · v{d.version ?? 1}</span>{canEdit ? <div className="relative mt-2 md:hidden">{dishEdit(d)}</div> : null}</Th>
                    <Td className="whitespace-nowrap text-sm tabular">{d.portionG} {t('g')}</Td>
                    <Td className="min-w-40 text-sm">{d.nutritionAvailable ? <><Badge variant="ok"><Check aria-hidden />SFCT</Badge> {t(d.sfctName)}</> : <span className="text-muted-foreground">{t('No SFCT link')}</span>}</Td>
                    <Td className="min-w-40 text-sm">{d.allergens.contains.length ? d.allergens.contains.map(an).join(sep) : <span className="text-muted-foreground">{t('none of the 14')}</span>}{d.allergens.mayContain.length ? <><br /><span className="text-muted-foreground">{t('may contain {list}', { list: d.allergens.mayContain.map(an).join(sep) })}</span></> : null}</Td>
                    <Td className="min-w-40 text-sm">{d.usedIn.map((x: any) => t(x.name)).join(sep) || <span className="text-muted-foreground">{t('Not used')}</span>}</Td>
                    {canEdit ? <Td className="relative hidden md:table-cell">{dishEdit(d)}</Td> : null}
                  </tr>
                ))}
              </tbody>
            </Table>
          </TabsPanel>

          <TabsPanel value="ingredients" className="flex flex-col gap-4 outline-none">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <p className="max-w-3xl text-sm text-muted-foreground">{t('Allergens use SFDA’s 14 declarable allergens. “May contain” covers cross-contact or varying brands and excludes the meal for a confirmed allergy. Changing allergen data marks affected meals for verification and re-screens upcoming orders.')}</p>
              {canEdit ? <Button className="shrink-0 max-sm:w-full" onClick={() => open({ kind: 'ingredient', id: null })}><Plus aria-hidden />{t('Add ingredient')}</Button> : null}
            </div>
            <Table caption={t('Ingredients')}>
              <thead><tr><Th scope="col">{t('Ingredient')}</Th><Th scope="col">{t('Contains')}</Th><Th scope="col">{t('May contain')}</Th><Th scope="col">{t('Diet flags')}</Th>{canEdit ? <Th scope="col" className="hidden md:table-cell">{t('Actions')}</Th> : null}</tr></thead>
              <tbody>
                {data.ingredients.map((i: any) => (
                  <tr key={i.id}>
                    <Th scope="row" className={`min-w-44 ${rowHead}`}>{t(i.name)}{i.labelCheck ? <> <Badge variant="warn">{t('check label')}</Badge></> : null}{canEdit ? <div className="relative mt-2 md:hidden">{ingEdit(i)}</div> : null}</Th>
                    <Td className="text-sm">{(i.allergens ?? []).map(an).join(sep) || '—'}</Td>
                    <Td className="text-sm">{(i.mayContain ?? []).map(an).join(sep) || '—'}</Td>
                    <Td className="min-w-36 text-sm">{(i.flags ?? []).filter((f: string) => f !== 'halal_check').map(flagLabel).join(sep) || '—'}</Td>
                    {canEdit ? <Td className="relative hidden md:table-cell">{ingEdit(i)}</Td> : null}
                  </tr>
                ))}
              </tbody>
            </Table>
          </TabsPanel>

          <TabsPanel value="plan" className="flex flex-col gap-4 outline-none">
            <p className="max-w-3xl text-sm text-muted-foreground">{t('The menu follows a 7-day cycle. You can change one date (for example to add a kitchen alternative) or the cycle for every week. Removing a meal re-screens upcoming orders: chosen or confirmed meals that are no longer on the menu are put on hold.')}</p>
            <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(min(100%,260px),1fr))]">
              {menu.dates.map((day: any) => (
                <article key={day.date} className="flex flex-col gap-3 rounded-[20px] border border-border bg-card p-4 shadow-soft">
                  <h3 className="text-lg">{day.date === today ? t('Today') : lang === 'ar' ? formatDate(day.date, { weekday: 'long' }, lang) : day.weekday} <span className="font-sans text-sm font-normal text-muted-foreground">{formatDate(day.date, { month: 'short', day: 'numeric' }, lang)}</span></h3>
                  {day.periods.map((p: any) => (
                    <div key={p.id} className="flex flex-col gap-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex flex-wrap items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-muted-foreground">{t(p.label)}{p.dateSpecific ? <Badge variant="rose" className="normal-case tracking-normal">{t('this date only')}</Badge> : null}</span>
                        {canEdit ? <Button size="sm" variant="ghost" aria-label={t('Change {period} on {weekday} {date}', { period: t(p.label), weekday: lang === 'ar' ? formatDate(day.date, { weekday: 'long' }, lang) : day.weekday, date: formatDate(day.date, { month: 'short', day: 'numeric' }, lang) })} onClick={() => open({ kind: 'plan', date: day.date, period: p.id })}><Pencil aria-hidden />{t('Change')}</Button> : null}
                      </div>
                      <ul className="m-0 flex list-disc flex-col gap-0.5 ps-5 text-sm">
                        {p.meals.length ? p.meals.map((m: any) => <li key={m.id}>{t(m.name)}{m.available ? null : <> <Badge variant="danger"><XIcon aria-hidden />{t('unavailable')}</Badge></>}</li>) : <li className="text-muted-foreground">{t('No meals')}</li>}
                      </ul>
                    </div>
                  ))}
                </article>
              ))}
            </div>
          </TabsPanel>

          <TabsPanel value="sfct" className="flex flex-col gap-4 outline-none">
            <p className="text-sm">{t('Read-only reference: SFDA Saudi Food Composition Tables, first edition ({n} dishes). Values per 100 g, laboratory analysis. Link a dish to an entry from the dish editor.', { n: data.sfct.length })}</p>
            <div className="flex max-w-sm flex-col gap-1.5">
              <Label htmlFor="sf-q">{t('Search the SFCT')}</Label>
              <Input id="sf-q" type="search" value={sfctQ} placeholder={t('kabsa, جريش, Jazan…')} onChange={(e) => setSfctQ(e.target.value)} aria-describedby="sf-count" />
              <span id="sf-count" className="text-sm text-muted-foreground" aria-live="polite">{t(sfctRows.length === 1 ? '{n} dish shown' : '{n} dishes shown', { n: sfctRows.length })}</span>
            </div>
            <Table caption={t('SFCT dishes')}>
              <thead><tr><Th scope="col">{t('Dish')}</Th><Th scope="col">{t('Region')}</Th><Th scope="col" className="text-end">{t('Page')}</Th><Th scope="col" className="text-end">{t('kcal /100 g')}</Th><Th scope="col" className="text-end">{t('Total carbohydrate g /100 g')}</Th><Th scope="col" className="text-end">{t('Sodium mg /100 g')}</Th></tr></thead>
              <tbody>
                {sfctRows.map((x: any) => (
                  <tr key={x.id}>
                    <Th scope="row" className={`min-w-56 ${rowHead}`}>{lang === 'ar' && x.nameAr ? <>{x.nameAr}<br /><span className="text-xs font-normal text-muted-foreground" lang="en" dir="ltr">{x.name}</span></> : <>{x.name}<br /><span className="text-xs font-normal text-muted-foreground" lang="ar" dir="rtl">{x.nameAr ?? ''}</span></>}
                      {x.issue ? <span className="mt-1 flex items-start gap-1 text-xs font-semibold text-warning"><TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden /><span>{t(x.issue)} {t('Shown as published; cannot be linked.')}</span></span> : null}</Th>
                    <Td>{t(x.region)}</Td><Td className="text-end tabular">{x.page}</Td><Td className="text-end tabular">{x.kcal ?? '—'}</Td><Td className="text-end tabular">{x.carbs ?? '—'}</Td><Td className="text-end tabular">{x.sodium ?? '—'}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
            {sfctRows.length ? null : <p className="text-muted-foreground">{t('No SFCT dish matches “{q}”. Try an English or Arabic name, or a region.', { q: sfctQ })}</p>}
          </TabsPanel>
        </Tabs>

        {data.recent.length ? (
          <Accordion className="rounded-[16px] border border-border bg-card" headClassName="min-h-11 px-4 py-3 font-display text-sm font-medium text-heading"
            title={<span className="inline-flex items-center gap-2"><List className="size-4" aria-hidden />{t('Recent menu changes')}</span>}>
            <ol className="m-0 flex list-none flex-col gap-2 px-4 pb-4">
              {data.recent.map((a: any, i: number) => <li key={a.id ?? i} className="flex flex-col gap-0.5 text-sm sm:flex-row sm:gap-3"><span className="shrink-0 text-muted-foreground tabular"><When iso={a.at} /></span><span><b>{a.actorName}</b> {t(a.detail)}</span></li>)}
            </ol>
          </Accordion>
        ) : null}
      </PageBody>

      <Dialog open={Boolean(editing)} onOpenChange={(o) => { if (!o) close(); }}>
        {shown ? <EditorSwitch key={shown.n} e={shown} catalog={data} plan={menu} canVerify={canVerify} mealById={mealById} onSaved={saved} /> : null}
      </Dialog>
    </>
  );
}

function EditorSwitch({ e, catalog, plan, canVerify, mealById, onSaved }: { e: Editing; catalog: Catalog; plan: Plan; canVerify: boolean; mealById: (id: string) => any; onSaved: () => void }) {
  const common = { catalog, canVerify, onSaved };
  switch (e.kind) {
    case 'meal': return <MealEditor {...common} mealId={e.id} />;
    case 'dish': return <DishEditor {...common} dishId={e.id} />;
    case 'ingredient': return <IngredientEditor {...common} ingredientId={e.id} />;
    case 'plan': return <PlanEditor plan={plan} date={e.date} period={e.period} onSaved={onSaved} />;
    case 'unavailable': return <UnavailableDialog meal={mealById(e.id)} onSaved={onSaved} />;
    case 'verify': return <VerifyDialog meal={mealById(e.id)} onSaved={onSaved} />;
  }
}
