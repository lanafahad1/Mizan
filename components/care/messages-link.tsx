'use client';
// The Messages button in the site header with the number of unread messages
// (patients: from their care team; healthcare providers and admins: from patients).
// It checks again every minute while the page is open. No push notifications.
import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageCircle } from 'lucide-react';
import { useApi } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { useT } from '@/components/site/lang';
import { UNREAD_KEY } from './common';

export function MessagesLink({ href }: { href: string }) {
  const { t } = useT();
  const path = usePathname();
  const { data } = useApi<{ count: number }>(UNREAD_KEY, undefined, { refreshInterval: 60_000 });
  const n = data?.count ?? 0;
  const [announce, setAnnounce] = React.useState('');
  const prev = React.useRef<number | null>(null);
  React.useEffect(() => {
    if (data == null) return;
    if (prev.current != null && n > prev.current) setAnnounce(n === 1 ? t('You have 1 unread message.') : t('You have {n} unread messages.', { n }));
    prev.current = n;
  }, [data, n, t]);
  const here = path === href || path.startsWith(`${href}/`);
  return (
    <>
      <Link href={href} aria-current={here ? 'page' : undefined} data-unread={n}
        aria-label={n ? (n === 1 ? t('Messages, 1 unread') : t('Messages, {n} unread', { n })) : t('Messages')}
        className={cn('relative grid size-10 shrink-0 place-items-center rounded-full text-heading no-underline hover:bg-mint aria-[current=page]:bg-sage')}>
        <MessageCircle className="size-5 rtl:-scale-x-100" aria-hidden />
        {n ? <span aria-hidden className="absolute -end-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-destructive px-1 text-[.68rem] font-bold leading-none text-white ring-2 ring-card tabular">{n > 99 ? '99+' : n}</span> : null}
      </Link>
      <span className="sr-only" aria-live="polite">{announce}</span>
    </>
  );
}
