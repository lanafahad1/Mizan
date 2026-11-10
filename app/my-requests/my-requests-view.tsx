'use client';
import * as React from 'react';
import Link from 'next/link';
import { HeartPulse, MessageSquare, ChevronRight, Plus, ShieldAlert } from 'lucide-react';
import { useApi } from '@/lib/api-client';
import { PageHead, PageBody } from '@/components/site/page-head';
import { RequestStatusChip } from '@/components/cb/status';
import { EmptyState } from '@/components/cb/misc';
import { periodLabel } from '@/components/cb/labels';
import { Button, buttonVariants } from '@/components/ui/button';
import { Notice } from '@/components/ui/notice';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/format';
import { RequestDialog, type RequestTarget, type RequestVocab } from '@/components/patient/request-dialog';
import { Time } from '@/components/patient/helpers';
import { useT } from '@/components/site/lang';

/* eslint-disable @typescript-eslint/no-explicit-any */
type Data = { requests: any[]; discharged: boolean };

export function MyRequestsView({ pid, demoId, initial, focusId, vocab, today, maxDate }: { pid: string; demoId: string; initial: Data; focusId: string | null; vocab: RequestVocab; today: string; maxDate: string }) {
  const { t, lang } = useT();
  const key = `/api/patients/${pid}/requests`;
  const { data, error } = useApi<Data>(key, initial);
  const [highlight, setHighlight] = React.useState<string | null>(focusId);
  const [request, setRequest] = React.useState<RequestTarget | null>(null);
  const d = data ?? initial;
  const rs = d.requests;
  const pending = rs.filter((r) => r.status === 'open');

  // ?id= highlights one request: scroll it into view and move focus to it.
  React.useEffect(() => {
    if (!focusId) return;
    const el = document.getElementById(`rq-${focusId}`);
    if (!el) return;
    el.scrollIntoView({ block: 'center' });
    el.focus({ preventScroll: true });
  }, [focusId]);

  // One "New request" button: the dialog asks what it is about (meal, schedule, support, or a diet/allergy report).
  const newRequest = () => setRequest({ type: '' });

  return (
    <>
      <PageHead eyebrow={`${demoId} · ${t('My requests')}`} title={t('My Requests')} space="member"
        actions={d.discharged ? null : <Button className="w-full sm:w-auto" onClick={newRequest}><Plus aria-hidden />{t('New request')}</Button>}>
        <p>{t('Everything you’ve asked the nutrition team, with their replies. You and the team see the same status.')}</p>
      </PageHead>
      <PageBody space="member" className="gap-4">
        {error ? <Notice tone="danger" title={t('We couldn’t refresh your requests.')}>{t(error.message)} {t('Check your connection and try again.')}</Notice> : null}
        <p className="text-sm">
          {lang === 'ar'
            ? <>{t('Pending:')} <b>{pending.length}</b> · {t('Answered:')} <b>{rs.length - pending.length}</b>.{' '}</>
            : <><b>{pending.length}</b> pending · <b>{rs.length - pending.length}</b> answered.{' '}</>}
          {d.discharged ? t('You have been discharged, so you can’t send new requests here.') : null}
        </p>
        {rs.length ? (
          <ul className="flex flex-col gap-3">
            {rs.map((r) => (
              <li key={r.id} id={`rq-${r.id}`} tabIndex={-1} aria-current={r.id === highlight ? 'true' : undefined}
                className={cn('flex scroll-mt-24 flex-col gap-3 rounded-xl border bg-card p-4 shadow-soft outline-none sm:p-5', r.clinical && 'border-s-[5px] border-s-pink-deep',
                  r.id === highlight ? 'border-2 border-heading ring-3 ring-sage' : 'border-border')}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h2 className="flex items-center gap-2 text-lg">{r.clinical ? <HeartPulse className="size-5" aria-hidden /> : <MessageSquare className="size-5" aria-hidden />}{t(r.typeLabel)}</h2>
                  <RequestStatusChip status={r.status} />
                </div>
                <dl className="grid gap-x-6 gap-y-2 text-[.95rem] sm:grid-cols-[8rem_1fr]">
                  <dt className="text-sm font-semibold text-muted-foreground">{t('Sent')}</dt>
                  <dd><Time iso={r.createdAt} lang={lang} />{r.createdByRole !== 'patient' ? ` ${t('by {name} from the nutrition team', { name: r.createdBy })}` : ''}</dd>
                  {r.date ? <><dt className="text-sm font-semibold text-muted-foreground">{lang === 'ar' ? t('About this meal') : 'About'}</dt><dd>{t('{period} on {date}', { period: t(periodLabel(r.period)), date: formatDate(r.date, { weekday: 'long', month: 'short', day: 'numeric' }, lang) })}{r.mealName ? ` · ${t(r.mealName)}` : ''}</dd></> : null}
                  {r.reportLabel ? <><dt className="text-sm font-semibold text-muted-foreground">{t('What changed')}</dt><dd>{t(r.reportLabel)}{r.allergenLabel ? ` · ${t(r.allergenLabel)}` : ''}</dd></> : null}
                  <dt className="text-sm font-semibold text-muted-foreground">{t('Your message')}</dt><dd className="min-w-0 break-words">“{r.message}”</dd>
                  <dt className="text-sm font-semibold text-muted-foreground">{t('Reply')}</dt>
                  <dd>{r.response
                    ? <><b>{t(r.response)}</b><br /><span className="text-sm text-muted-foreground">{r.resolvedBy}{lang === 'ar' ? '،' : ','} <Time iso={r.resolvedAt} lang={lang} /></span></>
                    : <span className="text-muted-foreground">{t('No reply yet.')} {r.clinical ? t('An admin will check it before your record is changed.') : t('The nutrition team will reply here.')}</span>}</dd>
                </dl>
                {r.clinical && r.status === 'open' && r.allergenLabel && r.reportLabel?.includes('new')
                  ? <p className="flex items-start gap-1.5 text-sm"><ShieldAlert className="mt-0.5 size-4 shrink-0 text-heading" aria-hidden />{t('Until an admin reviews this, we’re holding back meals that contain {allergen}, to keep you safe.', { allergen: t(r.allergenLabel).toLowerCase() })}</p> : null}
                {r.date ? <Link href={`/my-meals?date=${r.date}&period=${r.period}`} className="inline-flex min-h-10 w-fit items-center gap-1 text-sm">{t('See this meal')} <ChevronRight className="size-4 rtl:-scale-x-100" aria-hidden /></Link> : null}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title={t('No requests yet')} action={<Link href="/my-meals" className={buttonVariants({ variant: 'outline' })}>{t('Go to My Meals')}</Link>}>
            {t('When you ask for a different meal, a change to your meal times or some help, you’ll see it here.')}
          </EmptyState>
        )}
      </PageBody>
      <RequestDialog pid={pid} target={request} onClose={() => setRequest(null)} vocab={vocab} today={today} maxDate={maxDate} defaultDate={today}
        onSent={(r) => setHighlight(r.request.id)} />
    </>
  );
}
