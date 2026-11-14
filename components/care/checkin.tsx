'use client';
// Weekly check-in (Saturday–Friday): hunger, energy and mood, each 1–5 with a
// face and a word. Patients answer once a week and can change it that week; the
// care team reads the answers over time.
import * as React from 'react';
import { Frown, Annoyed, Meh, Smile, Laugh, CalendarCheck, PencilLine } from 'lucide-react';
import { apiSend, ApiError, useApi } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, Th, Td } from '@/components/ui/table';
import { toast } from '@/components/ui/toast';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useT } from '@/components/site/lang';
import { C, useCareRefresh, type CareRef } from './common';

type Q = CareRef['checkinQuestions'][number];
type Checkin = { id: string; weekStart: string; weekEnd: string; hunger: number; energy: number; mood: number; updatedAt: string };
export type Checkins = { weekStart: string; weekEnd: string; thisWeek: Checkin | null; history: Checkin[]; questions: Q[] };

const FACES = [Frown, Annoyed, Meh, Smile, Laugh];
const TONE = ['text-destructive', 'text-warning', 'text-muted-foreground', 'text-primary', 'text-success'];

export function Face({ value, className }: { value: number; className?: string }) {
  const Icon = FACES[value - 1] ?? Meh;
  return <Icon aria-hidden className={cn('size-5 shrink-0', TONE[value - 1], className)} />;
}

function range(c: { weekStart: string; weekEnd: string }, lang: 'en' | 'ar') {
  return `${formatDate(c.weekStart, { day: 'numeric', month: 'short' }, lang)} – ${formatDate(c.weekEnd, { day: 'numeric', month: 'short' }, lang)}`;
}

/** The patient's card: answer this week's three questions, or see and change the answers. */
export function CheckinCard({ initial, className }: { initial: Checkins; className?: string }) {
  const { t, lang } = useT();
  const { data } = useApi<Checkins>(C('me', '/checkins'), initial);
  const d = data ?? initial;
  const refresh = useCareRefresh('me');
  const [editing, setEditing] = React.useState(!d.thisWeek);
  const [answers, setAnswers] = React.useState<Record<string, number>>(() => (d.thisWeek ? { hunger: d.thisWeek.hunger, energy: d.thisWeek.energy, mood: d.thisWeek.mood } : {} as Record<string, number>));
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (d.questions.some((q) => !answers[q.id])) { setError(t('Answer all three questions.')); return; }
    setBusy(true); setError(null);
    try {
      await apiSend('POST', C('me', '/checkins'), answers);
      toast(d.thisWeek ? t('Check-in updated. Thank you!') : t('Check-in saved. Thank you!'));
      setEditing(false);
      void refresh();
    } catch (err) { setError(err instanceof ApiError ? t(err.message) : t('We couldn’t save this. Please try again.')); }
    finally { setBusy(false); }
  };
  return (
    <Card className={cn(!d.thisWeek && 'border-primary/40', className)} aria-labelledby="ci-h">
      <CardHeader>
        <div className="flex items-center gap-2"><CalendarCheck aria-hidden className="size-5 text-primary" /><CardTitle id="ci-h">{t('Weekly check-in')}</CardTitle></div>
        <span className="text-sm text-muted-foreground">{range(d, lang)}</span>
      </CardHeader>
      {!editing && d.thisWeek ? (
        <>
          <ul className="m-0 grid list-none grid-cols-1 gap-2 p-0 sm:grid-cols-3">
            {d.questions.map((q) => {
              const v = d.thisWeek![q.id];
              return <li key={q.id} className="flex items-center gap-2 rounded-[14px] bg-muted px-3 py-2.5"><Face value={v} /><span className="flex flex-col leading-tight"><span className="text-xs text-muted-foreground">{t(q.label)}</span><b className="font-semibold text-heading">{t(q.scale[v - 1])}</b></span></li>;
            })}
          </ul>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">{t('Thanks! Your care team can see your answers.')}</span>
            <Button size="sm" variant="ghost" onClick={() => setEditing(true)}><PencilLine aria-hidden />{t('Change answers')}</Button>
          </div>
        </>
      ) : (
        <form onSubmit={save} noValidate className="flex flex-col gap-4">
          <CardDescription>{t('Three quick questions about this week. Your care team sees your answers.')}</CardDescription>
          {d.questions.map((q) => (
            <fieldset key={q.id} className="flex flex-col gap-2">
              <legend className="mb-1 font-display text-[.95rem] font-medium text-heading">{t(q.question)}</legend>
              <div className="grid grid-cols-5 gap-1.5">
                {q.scale.map((label, i) => {
                  const v = i + 1;
                  const on = answers[q.id] === v;
                  return (
                    <label key={v} className={cn('flex min-h-16 cursor-pointer flex-col items-center justify-center gap-1 rounded-[14px] border-[1.5px] px-1 py-2 text-center text-[.72rem] leading-tight transition-colors has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/25 sm:text-xs', on ? 'border-primary bg-secondary font-semibold text-heading' : 'border-input bg-card text-muted-foreground hover:bg-secondary/50')}>
                      <input type="radio" name={`ci-${q.id}`} value={v} checked={on} onChange={() => setAnswers((a) => ({ ...a, [q.id]: v }))} className="sr-only" />
                      <Face value={v} className="size-6" />
                      <span>{t(label)}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          ))}
          {error ? <p role="alert" className="m-0 text-sm font-semibold text-destructive">{error}</p> : null}
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={busy}>{busy ? t('Saving…') : t('Save check-in')}</Button>
            {d.thisWeek ? <Button variant="outline" onClick={() => setEditing(false)}>{t('Cancel')}</Button> : null}
          </div>
        </form>
      )}
    </Card>
  );
}

/** The care team's view: answers over the weeks (newest first). */
export function CheckinHistory({ data, className }: { data: Checkins; className?: string }) {
  const { t, lang } = useT();
  return (
    <Card className={className} aria-labelledby="cih-h">
      <CardHeader>
        <div className="flex items-center gap-2"><CalendarCheck aria-hidden className="size-5 text-primary" /><CardTitle id="cih-h">{t('Weekly check-ins')}</CardTitle></div>
        <span className="text-sm text-muted-foreground">{data.thisWeek ? t('Answered this week') : t('Not answered this week yet')}</span>
      </CardHeader>
      {data.history.length ? (
        <div className="overflow-x-auto">
          <Table caption={t('Weekly check-in answers, newest first')} className="text-sm">
            <thead><tr><Th scope="col">{t('Week')}</Th>{data.questions.map((q) => <Th key={q.id} scope="col">{t(q.label)}</Th>)}</tr></thead>
            <tbody>
              {data.history.map((c) => (
                <tr key={c.id}>
                  <Th scope="row" className="whitespace-nowrap bg-transparent font-sans text-sm font-semibold normal-case tracking-normal text-foreground">{range(c, lang)}</Th>
                  {data.questions.map((q) => <Td key={q.id}><span className="inline-flex items-center gap-1.5 whitespace-nowrap"><Face value={c[q.id]} className="size-4" />{t(q.scale[c[q.id] - 1])} <span className="text-muted-foreground tabular">({c[q.id]}/5)</span></span></Td>)}
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      ) : <CardDescription>{t('No check-ins yet. Patients with an account answer three questions each week.')}</CardDescription>}
    </Card>
  );
}
