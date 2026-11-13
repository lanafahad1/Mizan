'use client';
import * as React from 'react';
import { Ban, CircleAlert, CircleX, List, Clock, Check, Layers, X, RefreshCw, ThumbsDown, Activity, MessageSquare, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { WORKFLOW_STEPS } from '@/domain/constants.js';
import { appetiteLabel, periodLabel, requestStatusLabel } from './labels';
import { useT } from '@/components/site/lang';

type Variant = React.ComponentProps<typeof Badge>['variant'];

/** Screening status of a meal for a patient. */
export function ScreenChip({ status }: { status?: string | null }) {
  const { t } = useT();
  if (status === 'eligible') return <Badge variant="ok"><Check aria-hidden />{t('Passes screening')}</Badge>;
  if (status === 'review') return <Badge variant="warn"><CircleAlert aria-hidden />{t('Needs admin review')}</Badge>;
  if (status === 'excluded') return <Badge variant="danger"><Ban aria-hidden />{t('Excluded')}</Badge>;
  return null;
}

// Colour meaning: lavender = the next step; sky = waiting; green = done; amber = check;
// red = a problem (on hold). Always text plus icon, never colour alone.
type EntryIcon = React.ComponentType<{ 'aria-hidden'?: boolean; className?: string }>;
const ENTRY: Record<string, [Variant, EntryIcon | null, string, string]> = {
  offered: ['mint', List, 'Options offered', 'Offered'],
  selected: ['info', Clock, 'Patient choice submitted', 'Choice in'],
  confirmed: ['ok', Check, 'Confirmed by nutrition team', 'Confirmed'],
  prepared: ['ok', Layers, 'Prepared', 'Prepared'],
  delivered: ['dark', Check, 'Delivered', 'Delivered'],
  'on-hold': ['danger', CircleAlert, 'On hold: needs review', 'On hold'],
  cancelled: ['outline', CircleX, 'Cancelled', 'Cancelled'],
  none: ['outline', null, 'Not scheduled', 'Not scheduled'],
  npo: ['outline', X, 'Nothing by mouth', 'NPO'],
  discharged: ['outline', X, 'Discharged', 'Discharged'],
};
/** Patient wording (plain words, no workflow jargon): [full, short]. Other statuses use the staff wording. */
const PATIENT_ENTRY: Record<string, [string, string]> = {
  offered: ['Choose now', 'Choose now'],
  selected: ['Choice sent', 'Choice sent'],
  confirmed: ['Confirmed by your nutrition team', 'Confirmed'],
  prepared: ['Being prepared', 'Being prepared'],
  'on-hold': ['On hold: your nutrition team is checking', 'On hold'],
  none: ['Not planned yet', 'Not planned yet'],
  npo: ['Nothing by mouth', 'Nothing by mouth'],
};
const NEUTRAL_TEXT = 'text-secondary-foreground';

/**
 * English label of a meal-period status (wrap it in t()). `patient` gives the patient wording
 * ("Choose now" instead of "Offered"); `short` the brief form.
 */
export function entryStatusText(status?: string | null, { patient = false, short = false }: { patient?: boolean; short?: boolean } = {}) {
  const key = ENTRY[status ?? 'none'] ? status ?? 'none' : 'none';
  const p = patient ? PATIENT_ENTRY[key] : undefined;
  if (p) return short ? p[1] : p[0];
  const [, , text, brief] = ENTRY[key];
  return short ? brief : text;
}

/**
 * Meal-period workflow status: always text plus icon, never colour alone.
 * Patient pages pass `patient` for plain wording: `<EntryChip status={s} patient />` shows "Choose now" for offered.
 */
export function EntryChip({ status, short = false, patient = false }: { status?: string | null; short?: boolean; patient?: boolean }) {
  const { t } = useT();
  const [variant, Icon] = ENTRY[status ?? 'none'] ?? ENTRY.none;
  return <Badge variant={variant} className={variant === 'neutral' ? NEUTRAL_TEXT : undefined}>{Icon ? <Icon aria-hidden /> : null}{t(entryStatusText(status, { patient, short }))}</Badge>;
}

const STEP_LABELS: Record<string, string> = { offered: 'Options offered', selected: 'Choice submitted', confirmed: 'Confirmed', prepared: 'Prepared', delivered: 'Delivered' };
const PATIENT_STEP_LABELS: Record<string, string> = { offered: 'Choose now', selected: 'Choice sent', confirmed: 'Confirmed', prepared: 'Being prepared', delivered: 'Delivered' };

/** Offered → Choice submitted → Confirmed → Prepared → Delivered, current stage marked (aria-current="step"). `patient`: plain wording. */
export function Stepper({ status, compact = false, patient = false }: { status?: string | null; compact?: boolean; patient?: boolean }) {
  const { t } = useT();
  if (status === 'on-hold' || status === 'cancelled') return <p className="text-sm"><EntryChip status={status} patient={patient} /></p>;
  const idx = (WORKFLOW_STEPS as string[]).indexOf(status ?? '');
  const labels = patient ? PATIENT_STEP_LABELS : STEP_LABELS;
  return (
    <ol aria-label={t('Meal progress')} className={cn('flex flex-wrap items-center gap-x-1 gap-y-2 text-sm', compact && 'text-xs')}>
      {(WORKFLOW_STEPS as string[]).map((st, i) => {
        const state = i < idx ? 'done' : i === idx ? 'current' : 'todo';
        return (
          <li key={st} aria-current={state === 'current' ? 'step' : undefined} className="flex items-center gap-1.5">
            <span aria-hidden className={cn('grid size-6 place-items-center rounded-full border text-[.7rem] font-bold', state === 'done' && 'border-primary bg-primary text-primary-foreground', state === 'current' && 'border-primary bg-secondary text-secondary-foreground ring-2 ring-ring/30', state === 'todo' && 'border-input bg-card text-muted-foreground')}>
              {state === 'done' ? <Check className="size-3.5" /> : i + 1}
            </span>
            <span className={cn(state === 'current' ? 'font-bold text-heading' : state === 'done' ? 'text-foreground' : 'text-muted-foreground', compact && state === 'todo' && 'max-sm:sr-only')}>{t(labels[st])}</span>
            <span className="sr-only">{state === 'done' ? ` (${t('done')})` : state === 'current' ? ` (${t('current stage')})` : ` (${t('not yet')})`}</span>
            {i < (WORKFLOW_STEPS as string[]).length - 1 ? <span aria-hidden className="mx-1 h-px w-3 bg-input sm:w-5" /> : null}
          </li>
        );
      })}
    </ol>
  );
}

export function RequestStatusChip({ status }: { status: string }) {
  const variant: Variant = status === 'open' ? 'info' : status === 'resolved' ? 'ok' : 'outline';
  const { t } = useT();
  const Icon = status === 'open' ? Clock : status === 'resolved' ? Check : X;
  return <Badge variant={variant}><Icon aria-hidden />{t(requestStatusLabel(status))}</Badge>;
}

const FLAG: Record<string, [Variant, React.ComponentType<{ 'aria-hidden'?: boolean }>]> = {
  review: ['warn', CircleAlert], 'no-options': ['danger', Ban], hold: ['danger', CircleAlert], changes: ['warn', RefreshCw],
  refusal: ['warn', ThumbsDown], 'low-intake': ['warn', Activity], requests: ['info', MessageSquare], npo: ['outline', X],
};
export function FlagChips({ flags = [] }: { flags?: { code: string; label: string; text?: string }[] }) {
  const { t } = useT();
  return (
    <span className="flex flex-wrap gap-1.5">
      {flags.map((f) => { const [v, Icon] = FLAG[f.code] ?? ['neutral', Info]; return <Badge key={f.code + f.label} variant={v} title={f.text ? t(f.text) : undefined}><Icon aria-hidden />{t(f.label)}</Badge>; })}
    </span>
  );
}

export function AppetiteChip({ level }: { level: string }) {
  const { t } = useT();
  return <Badge variant={level === 'poor' ? 'warn' : level === 'fair' ? 'info' : 'ok'}>{level === 'fair' ? <Info aria-hidden /> : null}{t(appetiteLabel(level))}</Badge>;
}

export function AllergyChips({ b }: { b: { allergyStatus?: string; allergies: string[]; intolerances: string[] } }) {
  const { t } = useT();
  if (b.allergyStatus === 'unknown') return <Badge variant="warn"><CircleAlert aria-hidden />{t('Allergies not assessed')}</Badge>;
  if (!b.allergies.length && !b.intolerances.length) return <Badge variant="outline">{t('No known food allergies')}</Badge>;
  return (
    <span className="flex flex-wrap gap-1.5">
      {b.allergies.map((a) => <Badge key={a} variant="danger"><Ban aria-hidden />{t(a)}</Badge>)}
      {b.intolerances.map((a) => <Badge key={a} variant="warn">{t(a)}</Badge>)}
    </span>
  );
}

const STRIP: Record<string, [React.ComponentType<{ 'aria-hidden'?: boolean; className?: string }> | null, string, string]> = {
  offered: [List, 'offered', 'bg-secondary text-secondary-foreground'], selected: [Clock, 'choice in', 'bg-accent text-accent-foreground'], confirmed: [Check, 'confirmed', 'bg-success-soft text-success'],
  prepared: [Layers, 'prepared', 'bg-success-soft text-success'], delivered: [Check, 'delivered', 'bg-primary text-primary-foreground'], 'on-hold': [CircleAlert, 'on hold', 'bg-destructive-soft text-destructive'],
  cancelled: [CircleX, 'cancelled', 'bg-muted text-muted-foreground'], npo: [X, 'NPO', 'bg-card text-muted-foreground'], discharged: [X, 'discharged', 'bg-card text-muted-foreground'],
  'none-flag': [Ban, 'no option', 'bg-destructive-soft text-destructive'], 'review-only': [CircleAlert, 'review', 'bg-warning-soft text-warning'], none: [null, '—', 'bg-card text-muted-foreground'],
};
/** Meal periods for one day as a compact strip: letter, icon and text (not colour alone). */
export function PeriodStrip({ periods }: { periods: { period: string; status?: string; entryStatus?: string | null; noSuitable?: boolean; reviewOnly?: boolean }[] }) {
  const { t } = useT();
  return (
    <ul aria-label={t('Meal periods')} className="grid grid-cols-1 gap-1">
      {periods.map((p) => {
        const key = p.status === 'npo' ? 'npo' : p.status === 'discharged' ? 'discharged' : p.entryStatus ?? (p.noSuitable ? 'none-flag' : p.reviewOnly ? 'review-only' : 'none');
        const [Icon, text, cls] = STRIP[key] ?? STRIP.none;
        return (
          <li key={p.period} className={cn('inline-flex w-fit items-center gap-1 rounded-full border border-border px-2 py-0.5 text-xs font-bold', cls)}>
            <b aria-hidden>{t(periodLabel(p.period)).slice(0, 1)}</b>{Icon ? <Icon aria-hidden className="size-3" /> : null}<span>{t(text)}</span>
            <span className="sr-only">{t(periodLabel(p.period))}: {t(text)}</span>
          </li>
        );
      })}
    </ul>
  );
}
