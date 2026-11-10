'use client';
// App-style bottom tab bar for members and patients on phones and tablets (< lg):
// members  Home · Diary · (+) · Health · Eat well
// patients My meals · Diary · (+) · Health · Requests (food profile: account menu)
// The centre (+) opens a small sheet of quick actions (log food, water, steps,
// activity, weight). The page gets bottom padding so the bar never covers content.
import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { House, NotebookPen, HeartPulse, Salad, Plus, ChevronRight, UtensilsCrossed, MessageSquare } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Illustration } from '@/components/illustrations/illustration';
import { toast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import { useT } from '@/components/site/lang';
import type { IllustrationName } from '@/lib/illustrations';
import { MEAL_LABELS, mealIn } from '@/components/diary/types';
import { mealForHour } from './meal-time';
import { useDaily, n0, type DailyType } from './daily';

type Icon = React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
type Tab = { href: string; label: string; icon: Icon; also?: string[] };
// One set of words for both spaces: Diary (/today), Health (/my-health). Keep in step with MEMBER_NAV / PATIENT_NAV in lib/site.ts.
const DIARY: Tab = { href: '/today', label: 'Diary', icon: NotebookPen, also: ['/my-foods'] };
const HEALTH: Tab = { href: '/my-health', label: 'Health', icon: HeartPulse };
const TABS: Record<'member' | 'patient', [Tab, Tab, Tab, Tab]> = {
  member: [{ href: '/home', label: 'Home', icon: House }, DIARY, HEALTH, { href: '/eat-well', label: 'Eat well', icon: Salad, also: ['/meal-ideas', '/my-plan'] }],
  patient: [{ href: '/my-meals', label: 'My meals', icon: UtensilsCrossed, also: ['/my-schedule', '/meal'] }, DIARY, HEALTH, { href: '/my-requests', label: 'Requests', icon: MessageSquare }],
};
const on = (path: string, href: string) => path === href || path.startsWith(`${href}/`);

/** Body padding (phones/tablets) so content and toasts sit above the bar; nothing of it in print. */
const SPACE_CSS = '@media (max-width: 1023.98px) { body { padding-bottom: calc(5rem + env(safe-area-inset-bottom, 0px)); } body [aria-live="polite"].fixed.bottom-0 { bottom: calc(4.5rem + env(safe-area-inset-bottom, 0px)); } } @media print { body { padding-bottom: 0 !important; } }';

/** Bottom tab bar for the member space (default) or the patient space. */
export function MemberTabBar({ space = 'member' }: { space?: 'member' | 'patient' }) {
  const path = usePathname();
  const { t } = useT();
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => { setOpen(false); }, [path]);
  const tabs = TABS[space];
  const item = (x: Tab) => {
    const active = on(path, x.href) || (x.also ?? []).some((h) => on(path, h));
    const Ico = x.icon;
    return (
      <li key={x.href} className="flex flex-1">
        <Link href={x.href} aria-current={active ? 'page' : undefined}
          className="flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 rounded-[14px] px-1 font-display text-[11px] font-medium text-muted-foreground no-underline aria-[current=page]:text-sage-deep">
          <span className={cn('grid h-7 w-12 place-items-center rounded-full transition-colors', active && 'bg-sage')}><Ico className="size-5" aria-hidden /></span>
          <span className="max-w-full truncate">{t(x.label)}</span>
        </Link>
      </li>
    );
  };
  return (
    <>
      <style>{SPACE_CSS}</style>
      <nav aria-label={space === 'patient' ? t('Patient') : t('Member')} className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-6px_20px_rgba(81,81,81,.06)] backdrop-blur supports-[backdrop-filter]:bg-card/90 lg:hidden print:hidden">
        <ul className="mx-auto flex max-w-xl list-none items-stretch gap-1 px-2 py-1">
          {item(tabs[0])}
          {item(tabs[1])}
          <li className="flex flex-1 items-start justify-center">
            <button type="button" onClick={() => setOpen(true)} aria-haspopup="dialog" aria-label={t('Quick add')}
              className="-mt-5 grid size-14 place-items-center rounded-full border-4 border-background bg-primary text-primary-foreground shadow-lift hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/30">
              <Plus className="size-7" aria-hidden />
            </button>
          </li>
          {item(tabs[2])}
          {item(tabs[3])}
        </ul>
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
  const tile = 'flex min-h-16 w-full items-center gap-3 rounded-[16px] border border-border bg-card px-3 py-2 text-start font-display text-[.95rem] font-medium text-heading no-underline hover:border-primary hover:bg-mint disabled:opacity-60';
  const art = (n: IllustrationName) => <Illustration name={n} className="size-11" />;
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
    <form onSubmit={submit} noValidate className="flex flex-col gap-1.5 rounded-[16px] border border-primary bg-mint/50 p-3">
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
