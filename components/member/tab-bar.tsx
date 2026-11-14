'use client';
// Top tabs for members and patients on phones and tablets (< lg), right under the site header:
// members  Home · Diary · Progress · Health · Eat well
// patients My meals · Diary · Progress · Messages · Health · Requests (food profile: account menu)
// The current page is underlined in the primary colour; the strip scrolls sideways if it has to.
// A small "+ Add" pill at the end opens the quick actions (log food, water, steps, activity, weight).
import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Plus, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody } from '@/components/ui/dialog';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Illustration } from '@/components/illustrations/illustration';
import { toast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import { useT } from '@/components/site/lang';
import type { IllustrationName } from '@/lib/illustrations';
import { MEAL_LABELS, mealIn } from '@/components/diary/types';
import { containerClass } from '@/components/site/page-head';
import { mealForHour } from './meal-time';
import { useDaily, n0, type DailyType } from './daily';

type Tab = { href: string; label: string; also?: string[] };
// One set of words for both spaces: Diary (/today), Health (/my-health). Keep in step with MEMBER_NAV / PATIENT_NAV in lib/site.ts.
const DIARY: Tab = { href: '/today', label: 'Diary', also: ['/my-foods'] };
const HEALTH: Tab = { href: '/my-health', label: 'Health' };
const PROGRESS: Tab = { href: '/my-progress', label: 'Progress' };
const TABS: Record<'member' | 'patient', Tab[]> = {
  member: [{ href: '/home', label: 'Home' }, DIARY, PROGRESS, HEALTH, { href: '/eat-well', label: 'Eat well', also: ['/meal-ideas', '/my-plan'] }],
  patient: [{ href: '/my-meals', label: 'My meals', also: ['/my-schedule', '/meal'] }, DIARY, PROGRESS, { href: '/my-messages', label: 'Messages' }, HEALTH, { href: '/my-requests', label: 'Requests' }],
};
const on = (path: string, href: string) => path === href || path.startsWith(`${href}/`);

/** Top tab strip for the member space (default) or the patient space. Rendered inside the sticky site header. */
export function MemberTabBar({ space = 'member' }: { space?: 'member' | 'patient' }) {
  const path = usePathname();
  const { t } = useT();
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => { setOpen(false); }, [path]);
  const listRef = React.useRef<HTMLUListElement>(null);
  // Keep the current tab in view when the strip has to scroll (long Arabic words on small phones).
  React.useEffect(() => {
    listRef.current?.querySelector<HTMLElement>('[aria-current="page"]')?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [path]);
  // One underline that slides to the current tab (transform only; app/styles/motion.css). Until it is
  // measured, and without JavaScript, each tab draws its own border.
  const [ink, setInk] = React.useState<{ x: number; y: number; w: number } | null>(null);
  const [inkMoves, setInkMoves] = React.useState(false);
  React.useLayoutEffect(() => {
    const ul = listRef.current;
    if (!ul) return;
    const place = () => {
      const a = ul.querySelector<HTMLElement>('a[aria-current="page"]');
      setInk(a ? { x: a.offsetLeft, y: a.offsetTop + a.offsetHeight - 2.5, w: a.offsetWidth } : null);
    };
    place();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(place);
    ul.querySelectorAll('a').forEach((a) => ro.observe(a));
    return () => ro.disconnect();
  }, [path]);
  React.useEffect(() => {
    if (!ink || inkMoves) return;
    const id = requestAnimationFrame(() => setInkMoves(true));
    return () => cancelAnimationFrame(id);
  }, [ink, inkMoves]);
  return (
    <>
      <nav aria-label={space === 'patient' ? t('Patient') : t('Member')} className="border-t border-border lg:hidden print:hidden">
        <div className={cn(containerClass({ space: 'member' }), 'flex items-center gap-2')}>
          <ul ref={listRef} className="relative -ms-2 flex min-w-0 flex-1 list-none items-stretch gap-0.5 overflow-x-auto p-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {TABS[space].map((x) => {
              const active = on(path, x.href) || (x.also ?? []).some((h) => on(path, h));
              return (
                <li key={x.href} className="flex shrink-0">
                  <Link href={x.href} aria-current={active ? 'page' : undefined}
                    className={cn('-mb-px inline-flex min-h-11 items-center whitespace-nowrap border-b-[2.5px] border-transparent px-2 font-display text-[.86rem] font-semibold text-muted-foreground no-underline transition-colors hover:text-foreground aria-[current=page]:text-primary sm:px-3.5', ink ? 'aria-[current=page]:border-transparent' : 'aria-[current=page]:border-primary')}>
                    {t(x.label)}
                  </Link>
                </li>
              );
            })}
            {ink ? (
              <li aria-hidden="true" data-anim={inkMoves ? '' : undefined}
                className="mz-ink pointer-events-none absolute left-0 top-0 h-[2.5px] w-px origin-left bg-primary"
                style={{ transform: `translate(${ink.x}px, ${ink.y}px) scaleX(${ink.w})` }} />
            ) : null}
          </ul>
          <button type="button" onClick={() => setOpen(true)} aria-haspopup="dialog" title={t('Quick add')}
            className={cn(buttonVariants({ size: 'sm' }), 'min-h-9 shrink-0 gap-1 px-3 max-sm:whitespace-nowrap max-[359px]:px-2.5')}>
            <Plus aria-hidden />{t('Add')}
          </button>
        </div>
      </nav>
      <QuickAdd open={open} onOpenChange={setOpen} />
    </>
  );
}

function QuickAdd({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { t, lang } = useT();
  const { save, busy } = useDaily();
  const [form, setForm] = React.useState<null | 'steps' | 'activity'>(null);
  const [meal, setMeal] = React.useState(() => mealForHour(12));
  React.useEffect(() => { if (open) { setForm(null); setMeal(mealForHour(new Date().getHours())); } }, [open]);
  const close = () => onOpenChange(false);
  const water = async () => {
    const v = await save('water', { add: 1 });
    if (v != null) { toast(t('Added a cup of water. That’s {n} today.', { n: n0(v) })); close(); }
  };
  const tile = 'mz-lift flex min-h-16 w-full items-center gap-3 rounded-[16px] border border-border bg-card px-3 py-2 text-start font-display text-[.95rem] font-medium text-heading no-underline hover:border-sage hover:bg-secondary disabled:opacity-60';
  const art = (n: IllustrationName) => <Illustration name={n} className="size-11" still />;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Quick add')}</DialogTitle>
          <DialogDescription>{t('Add a meal, water, steps, activity or your weight.')}</DialogDescription>
        </DialogHeader>
        <DialogBody className="gap-2 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            <li>
              <Link href={`/today?add=${meal}`} onClick={close} className={tile}>
                {art('log-food')}<span className="flex flex-1 flex-col leading-tight">{t('Add what you ate')}<small className="font-sans text-sm font-normal text-muted-foreground">{t('Add to {meal}', { meal: mealIn(meal, MEAL_LABELS[meal].toLowerCase(), lang) })}</small></span>
                <ChevronRight className="size-4 text-muted-foreground rtl:rotate-180" aria-hidden />
              </Link>
            </li>
            <li>
              <button type="button" className={tile} disabled={busy === 'water'} onClick={() => void water()}>
                {art('water')}<span className="flex flex-1 flex-col leading-tight">{t('Add a cup of water')}<small className="font-sans text-sm font-normal text-muted-foreground">{t('The Ministry of Health suggests 6–8 cups a day.')}</small></span>
                <Plus className="size-4 text-muted-foreground" aria-hidden />
              </button>
            </li>
            <li>
              {form === 'steps' ? <NumberForm type="steps" label={t('Today’s steps')} hint={t('Copy the total from your phone or watch. The website can’t count steps for you.')} max={100000} onDone={close} save={save} busy={busy} />
                : <button type="button" className={tile} onClick={() => setForm('steps')}>{art('steps')}<span className="flex flex-1 flex-col leading-tight">{t('Steps')}<small className="font-sans text-sm font-normal text-muted-foreground">{t('Enter today’s steps')}</small></span><ChevronRight className="size-4 text-muted-foreground rtl:rotate-180" aria-hidden /></button>}
            </li>
            <li>
              {form === 'activity' ? <NumberForm type="activity" label={t('Minutes to add for today')} hint={t('For example, a 30-minute walk counts as 30.')} max={600} onDone={close} save={save} busy={busy} />
                : <button type="button" className={tile} onClick={() => setForm('activity')}>{art('activity')}<span className="flex flex-1 flex-col leading-tight">{t('Active minutes')}<small className="font-sans text-sm font-normal text-muted-foreground">{t('Aim for at least 150 minutes a week.')}</small></span><ChevronRight className="size-4 text-muted-foreground rtl:rotate-180" aria-hidden /></button>}
            </li>
            <li>
              <Link href="/my-health?add=weight" onClick={close} className={tile}>
                {art('weight')}<span className="flex flex-1 flex-col leading-tight">{t('Weight')}<small className="font-sans text-sm font-normal text-muted-foreground">{t('Add today’s weight')}</small></span>
                <ChevronRight className="size-4 text-muted-foreground rtl:rotate-180" aria-hidden />
              </Link>
            </li>
          </ul>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}

function NumberForm({ type, label, hint, max, onDone, save, busy }: {
  type: DailyType; label: string; hint: string; max: number; onDone: () => void;
  save: ReturnType<typeof useDaily>['save']; busy: DailyType | null;
}) {
  const { t } = useT();
  const [text, setText] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const id = `qa-${type}`;
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = Number(text);
    if (!text.trim() || !Number.isFinite(n) || n < 0 || n > max) { setError(t('Enter a number from 0 to {max}.', { max: n0(max) })); return; }
    setError(null);
    const v = await save(type, type === 'activity' ? { add: Math.round(n) } : { value: Math.round(n) });
    if (v != null) {
      toast(type === 'steps' ? t('{n} steps saved for today.', { n: n0(v) }) : t('{n} active minutes today.', { n: n0(v) }));
      onDone();
    }
  };
  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-1.5 rounded-[16px] bg-secondary p-3">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex gap-2">
        {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
        <Input id={id} autoFocus type="number" inputMode="numeric" min={0} max={max} value={text} onChange={(e) => setText(e.target.value)}
          aria-describedby={`${id}-hint${error ? ` ${id}-err` : ''}`} aria-invalid={error ? true : undefined} className="min-w-0 flex-1" />
        <Button type="submit" disabled={busy === type}>{busy === type ? t('Saving…') : t('Save')}</Button>
      </div>
      <span id={`${id}-hint`} className="text-xs text-muted-foreground">{hint}</span>
      {error ? <p id={`${id}-err`} role="alert" className="m-0 text-sm font-semibold text-destructive">{error}</p> : null}
    </form>
  );
}
