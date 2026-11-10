'use client';
// The health space: body measurements and BMI, daily needs and targets, health
// readings with history, the assessment and today's totals. One view for members
// (who = "me"), patients (who = "me") and the care team (who = patient id).
import * as React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Plus, Scale, Target, HeartPulse, ClipboardList, PencilLine, Trash2, Utensils } from 'lucide-react';
import { useSWRConfig } from 'swr';
import { useApi, apiSend } from '@/lib/api-client';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Notice } from '@/components/ui/notice';
import { toast } from '@/components/ui/toast';
import { LineChart, Figure } from '@/components/staff/charts';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useT } from '@/components/site/lang';
import { tMsg } from '@/components/diary/types';
import { H, fmtNum, Stat, BmiScale, TargetBar, StatusPill, SourceNote, type Overview } from './common';
import { ReadingDialog, TargetsDialog, AboutDialog } from './dialogs';
import { AssessmentReview } from './assessment-review';

/* eslint-disable @typescript-eslint/no-explicit-any */

export type HealthRef = { readingTypes: any[]; glucoseContext: any[]; targetFields: any[]; nutrients: any[]; activityLevels: any[]; vocab: { conditions: any[]; allergens: any[] } };

export function HealthSpace({ who, initial, reference, canReview = false, assessmentHref }: { who: string; initial: Overview; reference: HealthRef; canReview?: boolean; assessmentHref: string }) {
  const { t, lang } = useT();
  const { data } = useApi<Overview>(H(who), initial);
  const o = data ?? initial;
  const [dlg, setDlg] = React.useState<null | 'reading' | 'targets' | 'about'>(null);
  const [readingType, setReadingType] = React.useState('weight');
  // "?add=weight" (from the member quick-add sheet or Home) opens the Add reading dialog once, then leaves the address clean.
  const addParam = useSearchParams().get('add');
  React.useEffect(() => {
    if (who !== 'me' || !addParam || !['weight', 'bp', 'glucose', 'waist'].includes(addParam)) return;
    setReadingType(addParam);
    setDlg('reading');
    const url = new URL(window.location.href);
    url.searchParams.delete('add');
    window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
  }, [addParam, who]);
  const member = o.kind === 'member';
  const careTeam = !o.self;
  const canSetTargets = member || canReview;
  const about = o.profile.about ?? {};
  const b = o.body;
  const label = (list: any[], id: string) => t(list.find((x) => x.id === id)?.label ?? id);

  return (
    <div className="flex flex-col gap-5">
      {/* ---- body and needs | targets and today: side by side on wide screens */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="h-full">
          <CardHeader>
            <div className="flex items-center gap-2"><Scale aria-hidden className="size-5 text-sage-deep" /><CardTitle>{t('Body & daily needs')}</CardTitle></div>
            <Button size="sm" variant="outline" onClick={() => setDlg('about')}><PencilLine aria-hidden />{careTeam ? t('About the patient') : t('About me')}</Button>
          </CardHeader>
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label="Weight" value={fmtNum(b.weight?.value, 1)} unit={b.weight ? 'kg' : undefined} sub={b.weight ? formatDate(b.weight.date, undefined, lang) : t('No weight yet')} />
            <Stat label="BMI" value={fmtNum(b.bmi, 1)} sub={b.bmiCategory?.label ? t(b.bmiCategory.label) : (b.heightCm ? t('Add a weight') : careTeam ? t('Add the height') : t('Add your height'))} tone={b.bmi != null && b.bmi >= 25 ? 'warn' : b.bmi != null ? 'ok' : 'default'} />
            <Stat label="Waist" value={fmtNum(b.waist?.value, 1)} unit={b.waist ? 'cm' : undefined} sub={b.waistRisk ? t('{risk} (MOH)', { risk: t(b.waistRisk.label) }) : b.waist ? (careTeam ? t('Add sex in About the patient') : t('Add sex in About me')) : t('Optional')} tone={b.waistRisk && b.waistRisk.id !== 'normal' ? 'warn' : 'default'} />
          </div>
          {b.bmi != null ? <BmiScale value={b.bmi} /> : null}
          {b.energy ? (
            <p className="text-[.95rem]">
              {t('Estimated daily needs:')} <b className="tabular">{t('{n} kcal', { n: fmtNum(b.energy.kcal) })}</b> <span className="text-muted-foreground">{t('(energy your body uses at rest (BMR) {bmr} × activity {factor})', { bmr: fmtNum(b.energy.bmr), factor: b.energy.factor })}</span>
            </p>
          ) : b.energyNote ? <Notice tone="info">{t(b.energyNote)}</Notice> : (
            <p className="text-sm text-muted-foreground">{careTeam ? t('Add the patient’s sex, age, height, activity and a weight to see the MOH estimate of daily needs.') : t('Add your sex, age, height, activity and weight to see how many calories you need each day.')}</p>
          )}
          {about.goal ? <p className="rounded-[12px] bg-mint px-3 py-2 text-sm text-sage-deep"><b>{t('Goal:')}</b> <bdi dir="auto">{about.goal}</bdi></p> : null}
          <SourceNote className="mt-auto text-[.7rem] leading-snug">{t('Ministry of Health BMI and calorie calculators (Mifflin-St Jeor) and waist risk levels.')}</SourceNote>
        </Card>

        {/* ---- targets and today */}
        <Card id="targets" className="h-full scroll-mt-24">
          <CardHeader>
            <div className="flex items-center gap-2"><Target aria-hidden className="size-5 text-sage-deep" /><CardTitle>{t('Daily targets')}</CardTitle></div>
            {canSetTargets ? <Button size="sm" variant="outline" onClick={() => setDlg('targets')}><PencilLine aria-hidden />{o.targets ? t('Change') : t('Set targets')}</Button> : null}
          </CardHeader>
          {o.targets && Object.keys(o.targets).length ? (
            <>
              <CardDescription>
                {o.targetsBasis === 'care-team' ? (o.targetsSetBy ? t('Care-team targets, set by {name}.', { name: o.targetsSetBy }) : t('Care-team targets.')) : careTeam ? t('Personal estimates the patient set — not a prescription.') : t('Personal estimates you set yourself — not a prescription.')} {t('Today so far:')}
              </CardDescription>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                {reference.targetFields.filter((f) => o.targets[f.key] != null).map((f) => {
                  const n = reference.nutrients.find((x) => x.key === f.key);
                  return <TargetBar key={f.key} label={f.label} value={o.today.totals[f.key]} target={o.targets[f.key]} unit={n?.unit ?? ''} d={n?.decimals ?? 0} />;
                })}
              </div>
              {o.self ? <Link href="/today" className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }), 'self-start')}><Utensils aria-hidden />{t('Open today’s food diary')}</Link> : null}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              {member ? t('No targets yet. Set your own, or start from the Ministry of Health suggestion.') : canReview ? t('No targets yet. Review the assessment or set them here.') : careTeam ? t('The care team sets targets after reviewing the assessment.') : t('Your care team sets your targets after reviewing your assessment.')}
            </p>
          )}
          {o.plan ? <p className="text-sm">{t('Matching Ministry of Health meal plan:')} <b>{t('{n} kcal', { n: o.plan.kcal })}</b>. {o.self ? <Link href="/my-plan">{t('See the plan and shopping list')}</Link> : null}</p> : null}
        </Card>
      </div>

      {/* ---- readings */}
      <Readings o={o} who={who} reference={reference} onAdd={(t) => { setReadingType(t); setDlg('reading'); }} />

      {/* ---- assessment */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2"><ClipboardList aria-hidden className="size-5 text-sage-deep" /><CardTitle>{t('Nutrition & chronic disease assessment')}</CardTitle></div>
          {o.assessment ? <StatusPill status={o.assessment.status} /> : null}
        </CardHeader>
        {o.assessment ? (
          <>
            <CardDescription>
              {o.assessment.status === 'more-info' && o.assessment.reviewNote ? <>{t('The care team asked:')} “{o.assessment.reviewNote}”</> : null}
              {o.assessment.status === 'approved' && o.assessment.nextReviewOn ? <>{t('Next review:')} <b>{formatDate(o.assessment.nextReviewOn, undefined, lang)}</b>.</> : null}
              {o.assessment.status === 'awaiting-review' ? t('Sent to the care team.') : null}
              {o.assessment.status === 'completed' ? t('Completed {date}.', { date: formatDate(o.assessment.submittedAt?.slice(0, 10) ?? o.assessment.date, undefined, lang) }) : null}
              {o.assessment.status === 'draft' ? (careTeam ? t('Not sent yet — the patient can finish it any time.') : t('Not sent yet — you can finish it any time.')) : null}
            </CardDescription>
            {canReview && careTeam ? <AssessmentReview who={who} assessment={o.assessment} suggested={b.suggested} /> : null}
          </>
        ) : <CardDescription>{careTeam ? t('An optional form about health, food and habits. It helps the care team personalise the plan; every question can be skipped.') : t('A few optional questions about your health, food and habits. Your answers help you shape your plan, and you can skip any question.')}</CardDescription>}
        {!careTeam ? (
          <Link href={assessmentHref} className={cn(buttonVariants({ variant: o.assessment && !['draft', 'more-info'].includes(o.assessment.status) ? 'outline' : 'default', size: 'sm' }), 'self-start')}>
            {!o.assessment ? t('Start the assessment') : ['draft', 'more-info'].includes(o.assessment.status) ? t('Continue the assessment') : t('Start a new assessment')}
          </Link>
        ) : null}
      </Card>

      <ReadingDialog who={who} open={dlg === 'reading'} onClose={() => setDlg(null)} types={reference.readingTypes} contexts={reference.glucoseContext} initialType={readingType} />
      <TargetsDialog who={who} open={dlg === 'targets'} onClose={() => setDlg(null)} fields={reference.targetFields} targets={o.targets} suggested={b.suggested} careTeam={careTeam} />
      <AboutDialog who={who} open={dlg === 'about'} onClose={() => setDlg(null)} about={about} member={member} conditions={o.profile.conditions ?? []} allergies={o.profile.allergies ?? []} activityLevels={reference.activityLevels} vocab={reference.vocab} />
      {member ? (
        <p className="text-sm text-muted-foreground">
          {o.profile.conditions?.length ? <>{t('Conditions:')} {o.profile.conditions.map((c: string) => label(reference.vocab.conditions, c)).join(t(', '))}. </> : null}
          {o.profile.allergies?.length ? <>{t('Allergies:')} {o.profile.allergies.map((c: string) => label(reference.vocab.allergens, c)).join(t(', '))}. </> : null}
          {t('Your health space is private. Hospital staff can’t see it.')}
        </p>
      ) : null}
    </div>
  );
}

const CHART_TYPES = [
  { id: 'weight', label: 'Weight' }, { id: 'bp', label: 'Blood pressure' }, { id: 'glucose', label: 'Blood sugar' }, { id: 'waist', label: 'Waist' },
];

function Readings({ o, who, reference, onAdd }: { o: Overview; who: string; reference: HealthRef; onAdd: (type: string) => void }) {
  const { t: tr, lang } = useT();
  const [type, setType] = React.useState('weight');
  const { mutate } = useSWRConfig();
  const list = (o.readings as any[]).filter((r) => r.type === type).slice(-14);
  const t = reference.readingTypes.find((x) => x.id === type);
  const unit = type === 'glucose' ? (list.at(-1)?.unit ?? 'mg/dL') : t?.unit;
  const sameUnit = list.filter((r) => r.unit === unit);
  const vals = sameUnit.map((r) => r.value);
  const lo = vals.length ? Math.min(...vals) : 0;
  const hi = vals.length ? Math.max(...vals) : 1;
  const pad = Math.max(1, (hi - lo) * 0.25);
  const yMin = Math.max(0, Math.floor(lo - pad));
  const yMax = Math.ceil(hi + pad);
  const change = sameUnit.length >= 2 && type !== 'bp' ? Math.round((sameUnit.at(-1).value - sameUnit[0].value) * 10) / 10 : null;
  const points = sameUnit.map((r) => ({
    label: `${formatDate(r.date, undefined, lang)}${r.time ? ` ${r.time}` : ''}`, short: r.date.slice(8, 10) + '/' + r.date.slice(5, 7), date: r.date, value: r.value,
    detail: [type === 'bp' ? `${r.value}/${r.value2} ${tr('mmHg')}` : null, r.context ? tr(reference.glucoseContext.find((c) => c.id === r.context)?.label ?? r.context) : null, r.source === 'staff' ? tr('by care team') : null].filter(Boolean).join(' · ') || undefined,
  }));
  const remove = async (id: string) => {
    try { await apiSend('DELETE', H(who, `/readings/${id}`)); toast(tr('Reading deleted.')); void mutate((k) => typeof k === 'string' && k.startsWith(H(who))); }
    catch (e) { toast(tMsg(tr, lang, (e as Error).message), { tone: 'error' }); }
  };
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2"><HeartPulse aria-hidden className="size-5 text-sage-deep" /><CardTitle>{tr('Readings')}</CardTitle></div>
        <Button size="sm" onClick={() => onAdd(type)}><Plus aria-hidden />{tr('Add a reading')}</Button>
      </CardHeader>
      <div className="flex flex-wrap gap-2" role="tablist" aria-label={tr('Reading type')}>
        {CHART_TYPES.map((c) => {
          const last = o.latest[c.id];
          const value = last ? (c.id === 'bp' ? `${last.value}/${last.value2}` : fmtNum(last.value, 1)) : null;
          const unitText = last?.unit ? tr(last.unit) : '';
          return (
            <button key={c.id} type="button" role="tab" aria-selected={type === c.id} onClick={() => setType(c.id)}
              aria-label={value ? tr('{type}: {value}', { type: tr(c.label), value: `${value}${unitText ? ` ${unitText}` : ''}` }) : tr(c.label)}
              className={cn('inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-semibold', type === c.id ? 'border-primary bg-mint text-heading' : 'border-border bg-card text-muted-foreground hover:bg-mint')}>
              <span>{tr(c.label)}</span>
              {value ? <><span aria-hidden className="text-muted-foreground">·</span><bdi className="font-normal tabular" dir="ltr">{value}</bdi></> : null}
            </button>
          );
        })}
      </div>
      {change != null ? <p className="text-sm">{tr('Change since {date}:', { date: formatDate(sameUnit[0].date, undefined, lang) })} <b className="tabular" dir="ltr">{change > 0 ? '+' : ''}{fmtNum(change, 1)} {tr(unit ?? '')}</b></p> : null}
      {points.length >= 2 ? (
        <Figure title={tr('{type} history', { type: tr(t?.label ?? '') })} caption={type === 'bp' ? tr('The line shows the upper (systolic) number; hover or focus a point for both numbers.') : tr('Last {n} readings, {unit}.', { n: points.length, unit: tr(unit ?? '') })}
          headers={[tr('Date'), type === 'bp' ? tr('Reading (mmHg)') : tr('Reading ({unit})', { unit: tr(unit ?? '') }), tr('Notes')]} rows={sameUnit.map((r) => [formatDate(r.date, undefined, lang), type === 'bp' ? `${r.value}/${r.value2}` : String(r.value), [r.context && lang === 'ar' ? tr(reference.glucoseContext.find((c) => c.id === r.context)?.label ?? r.context) : r.context, r.source === 'staff' ? tr('care team') : tr('self')].filter(Boolean).join(tr(', '))])}>
          <div dir="ltr" className="contents"><LineChart points={points} yMin={yMin} yMax={yMax} fmt={(v) => fmtNum(v, type === 'weight' || type === 'waist' ? 1 : 0)} unit={tr(unit ?? '')} /></div>
        </Figure>
      ) : (
        <p className="text-sm text-muted-foreground">{points.length ? tr('Add one more reading to see how it changes over time.') : tr('No {type} readings yet.', { type: lang === 'ar' ? tr(t?.label ?? '') : t?.label.toLowerCase() })}</p>
      )}
      {list.length ? (
        <ul className="flex flex-col divide-y divide-border rounded-[12px] border border-border text-sm">
          {list.slice(-4).reverse().map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3 px-3 py-2">
              <span><b className="tabular" dir="ltr">{type === 'bp' ? `${r.value}/${r.value2}` : r.value} {tr(r.unit)}</b> <span className="text-muted-foreground">· {formatDate(r.date, undefined, lang)}{r.time ? ` ${r.time}` : ''}{r.source === 'staff' ? ` · ${tr('care team')}` : ''}</span></span>
              {(o.self ? r.source === 'self' : true) ? <Button size="icon" variant="ghost" aria-label={tr('Delete the reading of {date}', { date: formatDate(r.date, undefined, lang) })} onClick={() => void remove(r.id)}><Trash2 aria-hidden /></Button> : null}
            </li>
          ))}
        </ul>
      ) : null}
      <p className="text-[.7rem] leading-snug text-muted-foreground">{o.self ? tr('Your readings are a record to share with your healthcare professional. CareBite doesn’t diagnose or send alerts.') : tr('Readings are a record for the patient and the care team. CareBite does not diagnose or give alerts.')}</p>
    </Card>
  );
}
