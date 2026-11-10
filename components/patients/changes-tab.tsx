'use client';
import * as React from 'react';
import { Check, Clock, TriangleAlert } from 'lucide-react';
import { periodLabel, roleLabel } from '@/components/cb/labels';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/format';
import { When, CellLabel } from './common';
import { usePatient } from './patient-context';
import { useT } from '@/components/site/lang';

/* eslint-disable @typescript-eslint/no-explicit-any */

const effectOf = (ch: any) => (ch.hold ? 'Put on hold'
  : ch.resolution?.startsWith('Cancelled') || ch.resolution === 'Meal cancelled' ? 'Cancelled'
    : ch.resolution?.startsWith('Replaced') ? 'Replaced' : 'Options withdrawn');

export function ChangesTab() {
  const { t, lang } = useT();
  const { record } = usePatient();
  const changes: any[] = record.changes;
  const audit: any[] = record.audit;
  return (
    <div className="flex flex-col gap-5">
      <section aria-labelledby="ch-head" className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-soft sm:p-6">
        <h2 id="ch-head" className="text-xl">{t('Changes after an order')}</h2>
        <p className="text-sm text-muted-foreground">{t('Each time a change to the record, a reported allergy, a meal or the menu affected an upcoming meal: what changed, what it did, whether it was reviewed and whether the kitchen acknowledged it.')}</p>
        {changes.length ? (
          <ul className="flex flex-col gap-3">
            {changes.map((ch) => (
              <li key={`${ch.id}-${ch.at}`} className="flex flex-col gap-3 rounded-[16px] border border-border bg-background p-4">
                <div className="flex flex-col">
                  <b className="font-display text-heading">{formatDate(ch.date, undefined, lang)} · {t(periodLabel(ch.period))}</b>
                  <span className="text-sm">{t(ch.mealName ?? 'Options')}</span>
                </div>
                <div className="text-sm">
                  <b>{t(ch.causeLabel)}</b>
                  <p>{t(ch.change)}</p>
                  <span className="text-muted-foreground"><When iso={ch.at} /></span>
                </div>
                <dl className="grid gap-3 text-sm sm:grid-cols-3">
                  <div className="flex flex-col gap-1">
                    <dt><CellLabel>{t('Effect')}</CellLabel></dt>
                    <dd>
                      {ch.hold ? <Badge variant="danger"><TriangleAlert aria-hidden />{t(effectOf(ch))}</Badge> : <span>{t(effectOf(ch))}</span>}
                      {ch.details?.length ? <span className="mt-1 block text-muted-foreground">{ch.details.map((x: string) => t(x)).join(' ')}</span> : null}
                    </dd>
                  </div>
                  <div className="flex flex-col gap-1">
                    <dt><CellLabel>{t('Review')}</CellLabel></dt>
                    <dd className="flex flex-col gap-1">
                      {ch.reviewed
                        ? <><span><Badge variant="ok"><Check aria-hidden />{t('Reviewed')}</Badge></span><span>{ch.reviewedBy}{ch.reviewedByRole ? ` (${t(roleLabel(ch.reviewedByRole))})` : ''}: {ch.resolution ? t(ch.resolution) : ''}</span></>
                        : <span><Badge variant="warn"><Clock aria-hidden />{t('Not reviewed')}</Badge></span>}
                    </dd>
                  </div>
                  <div className="flex flex-col gap-1">
                    <dt><CellLabel>{t('Kitchen')}</CellLabel></dt>
                    <dd>
                      {ch.kitchenAffected
                        ? ch.kitchenAck ? <span className="inline-flex items-center gap-1"><Check className="size-4" aria-hidden />{t('Acknowledged by {name}', { name: ch.kitchenAck.by })}</span> : <Badge variant="warn"><Clock aria-hidden />{t('Alert not yet acknowledged')}</Badge>
                        : <span className="text-muted-foreground">{t('Not affected')}</span>}
                    </dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
        ) : <p className="text-muted-foreground">{t('No changes have affected this patient’s meals.')}</p>}
      </section>
      <section aria-labelledby="ac-head" className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-soft sm:p-6">
        <h2 id="ac-head" className="text-xl">{t('Activity log')}</h2>
        <p className="text-sm text-muted-foreground">{t('Who changed this patient’s record or meals, and when.')}</p>
        {audit.length ? (
          <ol className="flex flex-col divide-y divide-border">
            {audit.map((a, i) => (
              <li key={a.id ?? i} className="flex flex-col gap-0.5 py-2.5 text-sm sm:flex-row sm:gap-4">
                <span className="shrink-0 text-muted-foreground tabular sm:w-32"><When iso={a.at} /></span>
                <span><b>{a.actorName}</b> <Badge variant="outline">{t(roleLabel(a.actorRole))}</Badge> {t(a.detail)}</span>
              </li>
            ))}
          </ol>
        ) : <p className="text-muted-foreground">{t('No activity yet.')}</p>}
      </section>
    </div>
  );
}
