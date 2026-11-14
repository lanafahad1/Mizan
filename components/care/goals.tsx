'use client';
// Goals: for hospital patients, set by the care team (target weight and date,
// daily steps, water, calories, carbs and optional limits for readings); for
// members, their own target weight. Only what the person types is saved: Mizan
// never fills in medical targets.
import * as React from 'react';
import { Flag, PencilLine } from 'lucide-react';
import { apiSend, ApiError } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Notice } from '@/components/ui/notice';
import { toast } from '@/components/ui/toast';
import { Modal } from '@/components/patients/common';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useT } from '@/components/site/lang';
import { C, useCareRefresh, type Field as GoalField, type Goals } from './common';

/* eslint-disable @typescript-eslint/no-explicit-any */
const n1 = (v: number | null | undefined, d = 0) => (v == null ? '–' : v.toLocaleString('en-US', { maximumFractionDigits: d }));

function Bar({ label, value, goal, unit, d = 0, note }: { label: string; value: number | null; goal: number; unit: string; d?: number; note?: React.ReactNode }) {
  const { t } = useT();
  const pct = Math.max(0, Math.min(100, ((value ?? 0) / goal) * 100));
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="font-semibold text-heading">{t(label)}</span>
        <span className="tabular text-muted-foreground" dir="ltr">{value == null ? t('not logged today') : `${n1(value, d)} / ${n1(goal, d)} ${t(unit)}`}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label={t(label)} aria-valuemin={0} aria-valuemax={goal} aria-valuenow={value ?? 0}>
        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
      {note ? <span className="text-xs text-muted-foreground">{note}</span> : null}
    </div>
  );
}

/** Goals with today's progress. `team`: the care team's view (limits shown, editing when allowed). */
export function GoalsCard({ who, data, canEdit, team = false, member = false, fields, limitFields, className }: {
  who: string; data: Goals; canEdit: boolean; team?: boolean; member?: boolean; fields: GoalField[]; limitFields: GoalField[]; className?: string;
}) {
  const { t, lang } = useT();
  const [open, setOpen] = React.useState(false);
  const g = data.goal;
  const p = data.progress ?? {};
  const w = p.weight;
  const limits = g?.limits ?? {};
  const title = member ? t('My weight goal') : team ? t('Goals') : t('Goals from your care team');
  const lost = w && w.start != null && w.latest != null ? Math.round((w.start - w.latest) * 10) / 10 : null;
  return (
    <Card className={cn('h-full', className)} aria-labelledby={`goals-h-${who}`}>
      <CardHeader>
        <div className="flex items-center gap-2"><Flag aria-hidden className="size-5 text-primary" /><CardTitle id={`goals-h-${who}`}>{title}</CardTitle></div>
        {canEdit ? <Button size="sm" variant="outline" onClick={() => setOpen(true)}><PencilLine aria-hidden />{g ? t('Change goals') : member ? t('Set a weight goal') : t('Set goals')}</Button> : null}
      </CardHeader>
      {g ? (
        <div className="flex flex-col gap-4">
          {g.targetWeight != null ? (
            <div className="flex flex-col gap-1.5 rounded-[14px] bg-mint px-3.5 py-3">
              <span className="text-sm text-sage-deep">{t('Target weight')}</span>
              <span className="font-display text-2xl font-semibold text-heading tabular"><bdi dir="ltr">{n1(g.targetWeight, 1)}</bdi> {t('kg')}</span>
              <span className="text-sm text-sage-deep">
                {w?.latest != null ? (w.toGo > 0 ? t('Now {now} kg: {n} kg to go.', { now: n1(w.latest, 1), n: n1(w.toGo, 1) }) : t('Now {now} kg: goal reached.', { now: n1(w.latest, 1) })) : t('No weight recorded yet.')}
                {lost != null && lost > 0 ? ` ${t('{n} kg down since the goal was set.', { n: n1(lost, 1) })}` : ''}
                {g.targetDate ? ` ${t('By {date}.', { date: formatDate(g.targetDate, { day: 'numeric', month: 'long', year: 'numeric' }, lang) })}` : ''}
              </span>
            </div>
          ) : null}
          {!member ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {p.steps ? <Bar label="Steps today" value={p.steps.today} goal={p.steps.goal} unit="steps" /> : null}
              {p.water ? <Bar label="Water today" value={p.water.today} goal={p.water.goal} unit="cups" /> : null}
              {p.kcal ? <Bar label="Calories today" value={p.kcal.today} goal={p.kcal.goal} unit="kcal" /> : null}
              {p.carbs ? <Bar label="Carbs today" value={p.carbs.today} goal={p.carbs.goal} unit="g" /> : null}
            </div>
          ) : null}
          {team && Object.keys(limits).length ? (
            <div className="flex flex-col gap-1 rounded-[14px] border border-border px-3.5 py-2.5 text-sm">
              <b className="font-display font-medium text-heading">{t('Limits for “Needs attention”')}</b>
              {limits.glucoseFastingMax != null ? <span>{t('Fasting blood sugar above {n} mg/dL', { n: limits.glucoseFastingMax })}</span> : null}
              {limits.systolicMax != null || limits.diastolicMax != null ? <span dir="auto">{t('Blood pressure above {s}/{d} mmHg', { s: limits.systolicMax ?? '–', d: limits.diastolicMax ?? '–' })}</span> : null}
            </div>
          ) : null}
          <p className="m-0 text-xs text-muted-foreground">{member ? t('A goal you set yourself.') : t('Set by {name} on {date}.', { name: g.setBy, date: formatDate(String(g.setAt).slice(0, 10), { day: 'numeric', month: 'short' }, lang) })}</p>
        </div>
      ) : (
        <CardDescription>
          {member ? t('Set a target weight to see how far you are from it.') : team ? t('No goals yet. Set only what you and the patient agreed; Mizan never fills in medical targets.') : t('Your care team hasn’t set goals yet. You can ask them in Messages.')}
        </CardDescription>
      )}
      {canEdit ? <GoalsDialog who={who} open={open} onClose={() => setOpen(false)} goal={g} fields={fields} limitFields={limitFields} member={member} /> : null}
    </Card>
  );
}

function GoalsDialog({ who, open, onClose, goal, fields, limitFields, member }: { who: string; open: boolean; onClose: () => void; goal: any; fields: GoalField[]; limitFields: GoalField[]; member: boolean }) {
  const { t } = useT();
  const refresh = useCareRefresh(who);
  const init = React.useCallback(() => {
    const v: Record<string, string> = {};
    for (const f of fields) v[f.key] = goal?.[f.key] != null ? String(goal[f.key]) : '';
    for (const f of limitFields) v[`limits.${f.key}`] = goal?.limits?.[f.key] != null ? String(goal.limits[f.key]) : '';
    v.targetDate = goal?.targetDate ?? '';
    return v;
  }, [goal, fields, limitFields]);
  const [v, setV] = React.useState<Record<string, string>>(init);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [busy, setBusy] = React.useState(false);
  React.useEffect(() => { if (open) { setV(init()); setErrors({}); } }, [open, init]);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setV((x) => ({ ...x, [k]: e.target.value }));
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErrors({});
    const body: Record<string, unknown> = { targetDate: v.targetDate || null, limits: {} };
    for (const f of fields) body[f.key] = v[f.key] === '' ? null : Number(v[f.key]);
    for (const f of limitFields) (body.limits as Record<string, unknown>)[f.key] = v[`limits.${f.key}`] === '' ? null : Number(v[`limits.${f.key}`]);
    try {
      await apiSend('POST', C(who, '/goals'), body);
      toast(t('Goals saved.'));
      void refresh();
      onClose();
    } catch (err) {
      if (err instanceof ApiError) { setErrors(err.errors ?? {}); if (!Object.keys(err.errors ?? {}).length) toast(t(err.message), { tone: 'error' }); }
    } finally { setBusy(false); }
  };
  const today = new Date().toISOString().slice(0, 10);
  return (
    <Modal open={open} onClose={onClose} title={member ? t('My weight goal') : t('Goals for this patient')}
      description={member ? t('Leave it empty to remove the goal.') : t('Fill in only what you agreed with the patient. Empty fields are not shown to them.')}
      footer={<><Button variant="outline" onClick={onClose}>{t('Cancel')}</Button><Button type="submit" form="goals-form" disabled={busy}>{busy ? t('Saving…') : t('Save goals')}</Button></>}>
      <form id="goals-form" onSubmit={save} noValidate className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {fields.map((f) => (
            <Field key={f.key} id={`goal-${f.key}`} label={`${t(f.label)} (${t(f.unit)})`} error={errors[f.key]} optional>
              <Input type="number" inputMode="decimal" step={f.decimals ? 0.1 : 1} min={f.min} max={f.max} value={v[f.key] ?? ''} onChange={set(f.key)} />
            </Field>
          ))}
          <Field id="goal-date" label={t('Target date')} error={errors.targetDate} optional>
            <Input type="date" min={today} value={v.targetDate ?? ''} onChange={set('targetDate')} />
          </Field>
        </div>
        {limitFields.length ? (
          <fieldset className="flex flex-col gap-3 rounded-[14px] border border-border p-3.5">
            <legend className="px-1 font-display text-sm font-medium text-heading">{t('Limits for readings (optional)')}</legend>
            <p className="m-0 text-sm text-muted-foreground">{t('A reading above a limit you set here puts the patient on your “Needs attention” list. Mizan has no limits of its own.')}</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {limitFields.map((f) => (
                <Field key={f.key} id={`limit-${f.key}`} label={`${t(f.label)} (${t(f.unit)})`} error={errors[`limits.${f.key}`]} optional>
                  <Input type="number" inputMode="numeric" min={f.min} max={f.max} value={v[`limits.${f.key}`] ?? ''} onChange={set(`limits.${f.key}`)} />
                </Field>
              ))}
            </div>
          </fieldset>
        ) : null}
        {!member ? <Notice tone="info">{t('Calories and carbs you set here become the patient’s daily targets in their food diary.')}</Notice> : null}
      </form>
    </Modal>
  );
}
