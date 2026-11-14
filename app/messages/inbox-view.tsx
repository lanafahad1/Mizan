'use client';
import * as React from 'react';
import Link from 'next/link';
import { MessageCircle } from 'lucide-react';
import { useApi } from '@/lib/api-client';
import { PageHead, PageBody } from '@/components/site/page-head';
import { Pid, EmptyState } from '@/components/cb/misc';
import { Badge } from '@/components/ui/badge';
import { When } from '@/components/staff/ui';
import { cn } from '@/lib/utils';
import { useT } from '@/components/site/lang';

type Row = { patientId: string; demoId: string; name: string; status: string; onMyTeam: boolean; unread: number; count: number; last: { from: 'patient' | 'team'; senderName: string; createdAt: string; preview: string } };
type Inbox = { conversations: Row[] };

export function InboxView({ initial }: { initial: Inbox }) {
  const { t } = useT();
  const { data } = useApi<Inbox>('/api/care/inbox', initial, { refreshInterval: 30_000 });
  const rows = (data ?? initial).conversations;
  const [mine, setMine] = React.useState(false);
  const shown = mine ? rows.filter((r) => r.onMyTeam) : rows;
  return (
    <>
      <PageHead eyebrow={t('Care team')} title={t('Messages')} space="staff">
        <p>{t('Conversations with patients, unread first. Any healthcare provider or admin can read and reply; patients see your name and specialty.')}</p>
      </PageHead>
      <PageBody space="staff">
        <div role="group" aria-label={t('Show')} className="flex flex-wrap gap-2">
          {[[false, t('All patients')], [true, t('My care-team patients')]].map(([v, label]) => (
            <button key={String(v)} type="button" aria-pressed={mine === v} onClick={() => setMine(v as boolean)}
              className={cn('min-h-10 rounded-full border px-4 text-sm font-semibold', mine === v ? 'border-primary bg-secondary text-secondary-foreground' : 'border-input bg-card text-muted-foreground hover:bg-secondary')}>{label as string}</button>
          ))}
        </div>
        {shown.length ? (
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {shown.map((r) => (
              <li key={r.patientId}>
                <Link href={`/patients/${r.patientId}?tab=messages`} className={cn('mz-lift flex items-center gap-3 rounded-[16px] border bg-card p-3.5 text-foreground no-underline hover:border-primary', r.unread ? 'border-primary/50' : 'border-border')}>
                  <MessageCircle aria-hidden className={cn('size-5 shrink-0', r.unread ? 'text-primary' : 'text-muted-foreground')} />
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="flex flex-wrap items-center gap-2">
                      <Pid>{r.demoId}</Pid> <b className="font-semibold text-heading"><bdi>{r.name}</bdi></b>
                      {r.onMyTeam ? <Badge variant="mint">{t('Your care team')}</Badge> : null}
                      {r.unread ? <Badge variant="dark">{r.unread === 1 ? t('1 unread') : t('{n} unread', { n: r.unread })}</Badge> : null}
                    </span>
                    <span dir="auto" className="truncate text-sm text-muted-foreground">{r.last.from === 'patient' ? '' : `${t('You or the team')}: `}{r.last.preview}</span>
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground"><When iso={r.last.createdAt} /></span>
                </Link>
              </li>
            ))}
          </ul>
        ) : <EmptyState title={t('No conversations yet')}>{t('Open a patient and use the Messages tab to write to them.')}</EmptyState>}
      </PageBody>
    </>
  );
}
