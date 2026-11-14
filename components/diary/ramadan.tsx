'use client';
// Ramadan mode in the diary: the Auto / On / Off switch and the "Ramadan tips" card.
// Every tip is from a Ministry of Health page (data/moh-ramadan.js, sources in
// domain/rules.js). No medication advice: people are asked to talk to their doctor.
import * as React from 'react';
import Link from 'next/link';
import { ChevronDown, Moon, Stethoscope } from 'lucide-react';
import { apiSend, ApiError } from '@/lib/api-client';
import { Notice } from '@/components/ui/notice';
import { toast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import { useT } from '@/components/site/lang';
import { useRefreshHealth } from '@/components/member/daily';
import { RAMADAN_TIPS, RAMADAN_BP_TIPS, RAMADAN_DIABETES, RAMADAN_PATIENT_NOTE } from '@/data/moh-ramadan.js';
import { tMsg, type RamadanInfo } from './types';

export type SourceRef = { title: string; url: string | null };
export type SourceRefs = Record<string, SourceRef>;

const MODES = [
  { id: 'auto', label: 'Auto' },
  { id: 'on', label: 'On' },
  { id: 'off', label: 'Off' },
] as const;

/** Auto (during Ramadan, by the Umm al-Qura calendar), On or Off. Saved for the person's own diary. */
export function RamadanSwitch({ info }: { info: RamadanInfo }) {
  const { t, lang } = useT();
  const refresh = useRefreshHealth();
  const [mode, setMode] = React.useState(info.mode);
  const [busy, setBusy] = React.useState(false);
  React.useEffect(() => { setMode(info.mode); }, [info.mode]);
  const change = async (next: RamadanInfo['mode']) => {
    if (next === mode) return;
    const before = mode;
    setMode(next);
    setBusy(true);
    try {
      await apiSend('POST', '/api/health/me/ramadan', { mode: next });
      await refresh();
      toast(next === 'on' ? t('Ramadan meals are on.') : next === 'off' ? t('Ramadan meals are off.') : t('Ramadan meals will turn on by themselves in Ramadan.'));
    } catch (err) {
      setMode(before);
      toast(err instanceof ApiError ? tMsg(t, lang, err.message) : t('We couldn’t save this. Please try again.'), { tone: 'error' });
    } finally { setBusy(false); }
  };
  const status = mode === 'on' ? t('Your meals show as Suhoor, Iftar and Snacks after Iftar.')
    : mode === 'off' ? t('Your meals keep their usual names, also in Ramadan.')
      : info.inRamadan ? t('It’s Ramadan, so your meals show as Suhoor, Iftar and Snacks after Iftar.')
        : t('Your meals change to Suhoor, Iftar and Snacks after Iftar during Ramadan (Umm al-Qura calendar).');
  return (
    <fieldset className="flex flex-col gap-2 rounded-[16px] border border-border bg-card p-3.5 sm:p-4" aria-describedby="rm-status">
      <legend className="sr-only">{t('Ramadan meals')}</legend>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span aria-hidden className="flex items-center gap-2 font-display text-[.98rem] font-medium text-heading"><Moon className="size-4 text-primary" />{t('Ramadan meals')}</span>
        <div className="flex rounded-full bg-muted p-1" role="presentation">
          {MODES.map((m) => (
            <label key={m.id} className={cn('relative flex min-h-11 min-w-[3.6rem] cursor-pointer items-center justify-center rounded-full px-3 text-sm font-semibold sm:min-h-9',
              mode === m.id ? 'bg-card text-heading shadow-soft' : 'text-muted-foreground hover:text-heading', busy && 'cursor-wait')}>
              <input type="radio" name="ramadan-mode" value={m.id} checked={mode === m.id} disabled={busy} onChange={() => void change(m.id)}
                className="peer absolute inset-0 cursor-pointer opacity-0" />
              <span className="pointer-events-none rounded-full peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-ring">{t(m.label)}</span>
            </label>
          ))}
        </div>
      </div>
      <p id="rm-status" className="m-0 text-sm text-muted-foreground" aria-live="polite">{status}</p>
    </fieldset>
  );
}

function Cite({ id, sources }: { id: string; sources: SourceRefs }) {
  const { t } = useT();
  const s = sources[id];
  if (!s) return null;
  return s.url ? (
    <a href={s.url} target="_blank" rel="noopener noreferrer" className="break-words text-xs font-semibold">
      {/^MOH\b/.test(s.title) ? t(s.title) : t('MOH: {title}', { title: t(s.title) })}<span className="sr-only"> {t('(opens in a new tab)')}</span>
    </a>
  ) : <span className="text-xs text-muted-foreground">{t(s.title)}</span>;
}

/** "Ramadan tips": a few MOH tips, more on request, and information for people with diabetes. */
export function RamadanTipsCard({ info, sources }: { info: RamadanInfo; sources: SourceRefs }) {
  const { t } = useT();
  const [more, setMore] = React.useState(false);
  const tips = [...(info.hypertension ? RAMADAN_BP_TIPS : []), ...RAMADAN_TIPS];
  const first = tips.slice(0, 3);
  const rest = tips.slice(3);
  const tipItem = (x: { id: string; text: string; source: string }) => (
    <li key={x.id} className="flex flex-col gap-0.5">
      <span>{t(x.text)}</span>
      <Cite id={x.source} sources={sources} />
    </li>
  );
  return (
    <section aria-labelledby="ramadan-tips-h" className="flex flex-col gap-3 rounded-xl border border-sage bg-secondary/60 p-4 sm:p-5">
      <h2 id="ramadan-tips-h" className="flex items-center gap-2 text-lg"><Moon aria-hidden className="size-5 text-primary" />{t('Ramadan tips')}</h2>
      {info.patient ? <Notice tone="rose" icon={<Stethoscope aria-hidden />}>{t(RAMADAN_PATIENT_NOTE)}</Notice> : null}
      <ul className="m-0 flex list-disc flex-col gap-2.5 ps-5 text-[.95rem]">{first.map(tipItem)}</ul>
      {rest.length ? (
        <>
          <button type="button" aria-expanded={more} aria-controls="ramadan-more" onClick={() => setMore((o) => !o)}
            className="inline-flex min-h-11 w-fit items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
            {more ? t('Fewer tips') : t('More Ramadan tips ({n})', { n: rest.length })}
            <ChevronDown aria-hidden className={cn('size-4 transition-transform', more && 'rotate-180')} />
          </button>
          {more ? <ul id="ramadan-more" className="m-0 flex list-disc flex-col gap-2.5 ps-5 text-[.95rem]">{rest.map(tipItem)}</ul> : null}
        </>
      ) : null}

      {info.diabetes ? (
        <div className="flex flex-col gap-2.5 rounded-[14px] border border-border bg-card p-3.5" aria-labelledby="ramadan-dm-h">
          <h3 id="ramadan-dm-h" className="text-base">{t('If you have diabetes')}</h3>
          <ul className="m-0 flex list-disc flex-col gap-1.5 ps-5 text-[.95rem]">{RAMADAN_DIABETES.checks.map((x) => <li key={x}>{t(x)}</li>)}</ul>
          <p className="m-0 font-semibold text-heading">{t('The Ministry of Health says to break the fast straight away if:')}</p>
          <ul className="m-0 flex list-disc flex-col gap-1.5 ps-5 text-[.95rem]">{RAMADAN_DIABETES.breakFast.map((x) => <li key={x}>{t(x)}</li>)}</ul>
          <Notice tone="info" icon={<Stethoscope aria-hidden />}><b>{t(RAMADAN_DIABETES.doctor)}</b></Notice>
          <Cite id={RAMADAN_DIABETES.source} sources={sources} />
        </div>
      ) : null}

      <p className="m-0 text-xs text-muted-foreground">
        {t('General information from the Ministry of Health, not personal medical advice.')} <Link href="/sources#src-saudi">{t('About our sources')}</Link>
      </p>
    </section>
  );
}
