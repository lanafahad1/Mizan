'use client';
// "Needs attention" on the provider dashboard: followed patients (admitted, or with
// a linked account) with unread messages, no food logged for 3 days, no weight for
// 14 days, no check-in this week, low intake or repeated refusals, or a reading above
// a limit a provider set for them. Each row says why and links to the patient.
import * as React from 'react';
import Link from 'next/link';
import { BellRing, MessageCircle, Utensils, Scale, CalendarCheck, Activity, HeartPulse, Droplet, ChevronRight } from 'lucide-react';
import { useApi } from '@/lib/api-client';
import { Panel } from '@/components/staff/ui';
import { Pid } from '@/components/cb/misc';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/format';
import type { T, Lang } from '@/lib/i18n';
import { useT } from '@/components/site/lang';

/* eslint-disable @typescript-eslint/no-explicit-any */
type Reason = { code: string; n?: number; date?: string | null; value?: number; value2?: number; max?: number; systolicMax?: number | null; diastolicMax?: number | null; title?: string; text?: string };
type Row = { id: string; demoId: string; preferredName: string; ward: string; bed: string; status: string; onMyTeam: boolean; reasons: Reason[] };
export type Attention = { patients: Row[]; myTeam: number };

const ICON: Record<string, React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>> = {
  messages: MessageCircle, 'no-food': Utensils, 'no-weight': Scale, checkin: CalendarCheck, 'low-intake': Activity, refusal: Activity, glucose: Droplet, bp: HeartPulse,
};
const TAB: Record<string, string> = { messages: 'messages', 'no-food': 'food', 'no-weight': 'progress', checkin: 'progress', 'low-intake': 'intake', refusal: 'intake', glucose: 'progress', bp: 'progress' };

export function reasonText(r: Reason, t: T, lang: Lang): string {
  const d = (iso?: string | null) => (iso ? formatDate(iso, { day: 'numeric', month: 'short' }, lang) : '');
  switch (r.code) {
    case 'messages': return r.n === 1 ? t('1 unread message') : t('{n} unread messages', { n: r.n });
    case 'no-food': return r.date ? t('No food logged since {date}', { date: d(r.date) }) : t('No food logged yet');
    case 'no-weight': return r.date ? t('No weight since {date}', { date: d(r.date) }) : t('No weight recorded yet');
    case 'checkin': return t('No check-in this week yet');
    case 'glucose': return t('Fasting blood sugar {value} mg/dL on {date}, above the limit of {max}', { value: r.value, date: d(r.date), max: r.max });
    case 'bp': return t('Blood pressure {value} mmHg on {date}, above the limit of {max}', { value: `${r.value}/${r.value2}`, date: d(r.date), max: `${r.systolicMax ?? '–'}/${r.diastolicMax ?? '–'}` });
    default: return r.title ? `${t(r.title)}: ${t(r.text ?? '')}` : t(r.code);
  }
}

export function NeedsAttention({ initial, limit = 8 }: { initial?: Attention; limit?: number }) {
  const { t, lang } = useT();
  const { data } = useApi<Attention>('/api/care/attention', initial, { refreshInterval: 60_000 });
  const [all, setAll] = React.useState(false);
  const rows = data?.patients ?? [];
  const shown = all ? rows : rows.slice(0, limit);
  return (
    <Panel id="na-h" icon={BellRing} title={<>{t('Needs attention')} <span className="text-base font-normal text-muted-foreground">({rows.length})</span></>}
      action={<span className="text-sm text-muted-foreground">{t('Your care-team patients first. Only the rules listed here, and limits your team set.')}</span>}>
      {!data ? <p className="m-0 text-sm text-muted-foreground" role="status">{t('Loading…')}</p> : rows.length ? (
        <>
          <ul className="m-0 grid list-none grid-cols-1 gap-2.5 p-0 md:grid-cols-2">
            {shown.map((r) => (
              <li key={r.id} className="flex flex-col gap-2 rounded-[16px] border border-border bg-card p-3.5">
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/patients/${r.id}?tab=${TAB[r.reasons[0]?.code] ?? 'progress'}`} className="inline-flex items-center gap-1.5 font-semibold">
                    <Pid>{r.demoId}</Pid> <bdi>{r.preferredName || r.demoId}</bdi>
                  </Link>
                  {r.onMyTeam ? <Badge variant="mint">{t('Your care team')}</Badge> : null}
                  {r.status === 'discharged' ? <Badge variant="outline">{t('Discharged')}</Badge> : null}
                </div>
                <ul className="m-0 flex list-none flex-col gap-1 p-0 text-sm">
                  {r.reasons.map((x, i) => {
                    const Icon = ICON[x.code] ?? BellRing;
                    return (
                      <li key={`${x.code}-${i}`}>
                        <Link href={`/patients/${r.id}?tab=${TAB[x.code] ?? 'progress'}`} className="group inline-flex items-start gap-1.5 text-foreground no-underline hover:text-primary">
                          <Icon aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
                          <span>{reasonText(x, t, lang)}</span>
                          <ChevronRight aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 rtl:rotate-180" />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ul>
          {rows.length > limit ? <Button variant="ghost" size="sm" className="self-start" aria-expanded={all} onClick={() => setAll((x) => !x)}>{all ? t('Show fewer') : t('Show all {n} patients', { n: rows.length })}</Button> : null}
        </>
      ) : <p className="m-0 text-muted-foreground">{t('Nothing needs attention right now.')}</p>}
    </Panel>
  );
}
