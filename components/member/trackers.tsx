'use client';
// Home trackers: water (cups today), steps (today), active minutes (this week) and
// sleep (last night). Goals are MOH's (Calorie Guide for Weight Loss): 6–8 cups of
// water a day, more than 7,500 steps a day, at least 150 minutes of moderate activity
// a week, and 7–8 hours of sleep a night for adults.
import * as React from 'react';
import { Minus, Plus, Check, Pencil, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Illustration } from '@/components/illustrations/illustration';
import { cn } from '@/lib/utils';
import { useT } from '@/components/site/lang';
import { CountUp } from '@/components/site/count-up';
import { useDaily, n0, h1, type DailyType } from './daily';

const card = 'flex min-w-0 flex-col gap-3 rounded-[20px] border border-border bg-card p-4 shadow-soft';

export function Trackers({ water, steps, activityToday, activityWeek, sleep = null }: { water: number | null; steps: number | null; activityToday: number | null; activityWeek: number; sleep?: number | null }) {
  const { t } = useT();
  return (
    <section aria-labelledby="trackers-h" className="flex flex-col gap-3">
      <div className="flex flex-col gap-0.5">
        <h2 id="trackers-h" className="text-lg sm:text-xl">{t('Water, steps, activity and sleep')}</h2>
        <p className="text-sm text-muted-foreground">{t('Copy your steps and active minutes from your phone or watch. The website can’t count them for you.')}</p>
      </div>
      <div data-reveal-group className="grid gap-3 md:grid-cols-2">
        <WaterCard cups={water ?? 0} logged={water != null} />
        <NumberCard type="steps" art="steps" title={t('Steps today')} value={steps} unit={t('steps')}
          goal={t('The Ministry of Health suggests more than 7,500 steps a day.')} met={(steps ?? 0) > 7500}
          button={t('Add steps')} label={t('Today’s steps')} hint={t('Copy the total from your phone or watch.')} mode="value" max={100000} step={100} />
        <NumberCard type="activity" art="activity" title={t('Active minutes this week')} value={activityWeek} unit={t('min')}
          of={150} goal={t('The Ministry of Health suggests at least 150 minutes of moderate activity a week.')} met={activityWeek >= 150}
          sub={activityToday ? t('{n} min today', { n: n0(activityToday) }) : null} today={activityToday}
          button={t('Add minutes')} label={t('Minutes to add for today')} hint={t('For example, a 30-minute walk counts as 30.')} mode="add" max={600} step={5} />
        <SleepCard value={sleep} />
      </div>
    </section>
  );
}

/** Sleep last night, in hours (to the nearest half hour). Goal from MOH: 7–8 hours a night for adults. */
export function SleepCard({ value }: { value: number | null }) {
  const { t } = useT();
  return (
    <NumberCard type="sleep" art="sleep" title={t('Sleep last night')} value={value} unit={t('hours')} decimals={1}
      goal={t('The Ministry of Health advises adults to sleep 7–8 hours a night.')} met={(value ?? 0) >= 7}
      button={t('Add sleep')} label={t('Hours of sleep last night')} hint={t('For example, 7.5 for seven and a half hours.')} mode="value" max={24} step={0.5} />
  );
}

function WaterCard({ cups, logged }: { cups: number; logged: boolean }) {
  const { t } = useT();
  const { save, clear, busy } = useDaily();
  const [shown, setShown] = React.useState(cups);
  React.useEffect(() => { setShown(cups); }, [cups]);
  const change = async (add: number) => {
    setShown((c) => Math.max(0, c + add));
    const v = await save('water', { add });
    setShown(v ?? cups);
  };
  const met = shown >= 6;
  return (
    <div data-mz-card className={cn(card, 'mz-play')}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col">
          <h3 className="text-base">{t('Water today')}</h3>
          <p className="m-0" aria-live="polite"><b className="font-display text-[1.6rem] font-semibold leading-tight text-heading tabular">{n0(shown)}</b> <span className="text-muted-foreground">{shown === 1 ? t('cup') : t('cups')}</span></p>
        </div>
        <Illustration name="water" className="size-14" />
      </div>
      <div aria-hidden className="flex gap-1">
        {Array.from({ length: 8 }, (_, i) => <span key={i} className={cn('mz-pop h-2.5 flex-1 rounded-full', i < shown ? 'bg-primary' : 'bg-mint')} style={{ '--i': i } as React.CSSProperties} />)}
      </div>
      <p className="m-0 flex items-center gap-1.5 text-sm text-muted-foreground">{met ? <Check className="size-4 shrink-0 text-success" aria-hidden /> : null}{met ? t('Goal reached. Well done.') : null} {t('The Ministry of Health suggests 6–8 cups a day.')}</p>
      <div className="mt-auto flex items-center gap-2">
        <Button variant="outline" size="icon" className="size-11" aria-label={t('Remove a cup of water')} disabled={busy === 'water' || shown <= 0} onClick={() => void change(-1)}><Minus aria-hidden /></Button>
        <Button variant="secondary" className="flex-1" disabled={busy === 'water'} onClick={() => void change(1)}><Plus aria-hidden />{t('Add a cup')}</Button>
      </div>
      {logged ? (
        <Button variant="ghost" size="sm" className="min-h-11 self-start sm:min-h-9" disabled={busy === 'water'} onClick={() => void clear('water', t('Water for today cleared.'))}>
          <X aria-hidden />{t('Clear')}<span className="sr-only"> {t('today’s water')}</span>
        </Button>
      ) : null}
    </div>
  );
}

function NumberCard({ type, art, title, value, unit, of, goal, met, sub, today, button, label, hint, mode, max, step, decimals = 0 }: {
  type: DailyType; art: 'steps' | 'activity' | 'sleep'; title: string; value: number | null; unit: string; of?: number; goal: string; met: boolean; sub?: string | null;
  /** 1 for sleep hours (saved to the nearest half hour). */
  decimals?: 0 | 1;
  /** Today's own value for "add" cards (the card shows the week); `value` for "value" cards. */
  today?: number | null;
  button: string; label: string; hint: string; mode: 'value' | 'add'; max: number; step: number;
}) {
  const { t } = useT();
  const { save, clear, busy } = useDaily();
  const todayValue = mode === 'value' ? value : today ?? null;
  const [open, setOpen] = React.useState(false);
  const [text, setText] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const id = `trk-${type}`;
  const inputRef = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => { if (open) inputRef.current?.focus(); }, [open]);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = Number(text);
    if (!text.trim() || !Number.isFinite(n) || n < 0 || n > max) { setError(t('Enter a number from 0 to {max}.', { max: n0(max) })); return; }
    setError(null);
    const whole = decimals ? Math.round(n * 2) / 2 : Math.round(n);
    const v = await save(type, mode === 'add' ? { add: whole } : { value: whole }, t('Saved.'));
    if (v != null) { setOpen(false); setText(''); }
  };
  const share = of ? Math.min(1, (value ?? 0) / of) : null;
  return (
    <div data-mz-card className={cn(card, 'mz-play')}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col">
          <h3 className="text-base">{title}</h3>
          <p className="m-0"><b className="font-display text-[1.6rem] font-semibold leading-tight text-heading tabular">{value == null ? n0(value) : decimals ? h1(value) : <CountUp value={value} format={n0} />}</b> <span className="text-muted-foreground">{of ? t('of {n} {unit}', { n: n0(of), unit }) : unit}</span></p>
          {sub ? <span className="text-sm text-muted-foreground">{sub}</span> : null}
        </div>
        <Illustration name={art} className="size-14" />
      </div>
      {share != null ? <div aria-hidden className="h-2.5 overflow-hidden rounded-full bg-mint"><span className="mz-bar block h-full rounded-full bg-primary" style={{ width: `${Math.round(share * 100)}%` }} /></div> : null}
      <p className="m-0 flex items-center gap-1.5 text-sm text-muted-foreground">{met ? <Check className="size-4 shrink-0 text-success" aria-hidden /> : null}{met ? t('Goal reached. Well done.') : null} {goal}</p>
      {open ? (
        <form onSubmit={submit} noValidate className="mt-auto flex flex-col gap-1.5">
          <Label htmlFor={id}>{label}</Label>
          <div className="flex gap-2">
            <Input ref={inputRef} id={id} type="number" inputMode={decimals ? 'decimal' : 'numeric'} min={0} max={max} step={step} value={text} onChange={(e) => setText(e.target.value)}
              aria-describedby={`${id}-hint${error ? ` ${id}-err` : ''}`} aria-invalid={error ? true : undefined} className="min-w-0 flex-1" />
            <Button type="submit" disabled={busy === type}>{busy === type ? t('Saving…') : t('Save')}</Button>
          </div>
          <span id={`${id}-hint`} className="text-xs text-muted-foreground">{hint}</span>
          {error ? <p id={`${id}-err`} role="alert" className="m-0 text-sm font-semibold text-destructive">{error}</p> : null}
          <Button variant="ghost" size="sm" className="self-start" onClick={() => { setOpen(false); setError(null); }}>{t('Cancel')}</Button>
        </form>
      ) : todayValue != null ? (
        // Already saved today: change it or clear it ("not logged").
        <div className="mt-auto flex flex-wrap gap-2">
          {mode === 'value' ? (
            <Button variant="outline" className="min-w-0 flex-1" onClick={() => { setText(String(todayValue)); setOpen(true); }}><Pencil aria-hidden />{t('Edit')}<span className="sr-only"> {title}</span></Button>
          ) : (
            <Button variant="outline" className="min-w-0 flex-1" onClick={() => setOpen(true)}><Plus aria-hidden />{button}</Button>
          )}
          <Button variant="ghost" disabled={busy === type} onClick={() => void clear(type, t('Cleared for today.'))}>
            <X aria-hidden />{mode === 'value' ? t('Clear') : t('Clear today')}<span className="sr-only"> {title}</span>
          </Button>
        </div>
      ) : (
        <Button variant="outline" className="mt-auto" onClick={() => setOpen(true)}><Plus aria-hidden />{button}</Button>
      )}
    </div>
  );
}
