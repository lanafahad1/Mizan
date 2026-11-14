'use client';
// One conversation between a patient and their care team (text only). The patient
// sees it as "me"; any healthcare provider or admin of the hospital opens it by the
// patient's id. Newest message at the bottom; opening it marks the other side's
// messages as read; new messages are announced politely to screen readers.
import * as React from 'react';
import { useSWRConfig } from 'swr';
import { Send, Check, CheckCheck, Phone } from 'lucide-react';
import { useApi, apiSend, ApiError } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Textarea, Label } from '@/components/ui/input';
import { toast } from '@/components/ui/toast';
import { When } from '@/components/staff/ui';
import { cn } from '@/lib/utils';
import { useT } from '@/components/site/lang';
import { C, UNREAD_KEY, CharCount } from './common';

type Msg = {
  id: string; body: string; createdAt: string; from: 'patient' | 'team'; mine: boolean; read: boolean;
  sender: { name: string; role: string; roleLabel: string; specialtyLabel: string | null };
};
export type Thread = { patient: { id: string; demoId: string; name: string }; messages: Msg[]; unread: number; max: number };

export function Conversation({ who, side, initial, className }: { who: string; side: 'patient' | 'team'; initial?: Thread; className?: string }) {
  const { t } = useT();
  const key = C(who, '/messages');
  const { data, mutate } = useApi<Thread>(key, initial, { refreshInterval: 30_000 });
  const { mutate: globalMutate } = useSWRConfig();
  const [text, setText] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [announce, setAnnounce] = React.useState('');
  const listRef = React.useRef<HTMLOListElement>(null);
  const seen = React.useRef<Set<string> | null>(null);
  const max = data?.max ?? 1000;
  const messages = data?.messages ?? [];

  // Mark the other side's messages read while the conversation is open.
  const unread = data?.unread ?? 0;
  React.useEffect(() => {
    if (!unread) return;
    let live = true;
    apiSend('POST', C(who, '/messages/read')).then(() => { if (live) { void mutate(); void globalMutate(UNREAD_KEY); void globalMutate((k) => typeof k === 'string' && (k.startsWith('/api/care/inbox') || k.startsWith('/api/care/attention'))); } }).catch(() => {});
    return () => { live = false; };
  }, [unread, who, mutate, globalMutate]);

  // Keep the newest message in view, and announce messages that arrive while the page is open.
  React.useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
    const ids = new Set(messages.map((m) => m.id));
    if (seen.current) {
      const fresh = messages.filter((m) => !seen.current!.has(m.id) && !m.mine);
      if (fresh.length) setAnnounce(t('New message from {name}: {text}', { name: fresh.at(-1)!.sender.name, text: fresh.at(-1)!.body }));
    }
    seen.current = ids;
  }, [messages, t]);

  const send = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const body = text.trim();
    if (!body) { setError(t('Write your message first.')); return; }
    setBusy(true); setError(null);
    try {
      await apiSend('POST', key, { body });
      setText('');
      await mutate();
      setAnnounce(t('Message sent.'));
      void globalMutate((k) => typeof k === 'string' && (k.startsWith('/api/care/inbox') || k.startsWith('/api/care/attention') || k === UNREAD_KEY));
    } catch (err) {
      const msg = err instanceof ApiError ? t(err.errors?.body ?? err.message) : t('We couldn’t send your message. Please try again.');
      setError(msg);
      toast(msg, { tone: 'error' });
    } finally { setBusy(false); }
  };
  const inputId = `${side}-compose`;
  const lastMine = [...messages].reverse().find((m) => m.mine);

  return (
    <section aria-label={t('Messages')} className={cn('flex min-w-0 flex-col overflow-hidden rounded-[20px] border border-border bg-card shadow-soft', className)}>
      <ol ref={listRef} aria-label={t('Messages, oldest first')} className="m-0 flex max-h-[min(60vh,560px)] min-h-48 list-none flex-col gap-3 overflow-y-auto p-3 sm:p-4" tabIndex={0}>
        {messages.length ? messages.map((m) => {
          const ownSide = m.from === side;
          return (
            <li key={m.id} className={cn('flex max-w-[85%] flex-col gap-1', ownSide ? 'ms-auto items-end' : 'me-auto items-start')}>
              <span className="px-1 text-xs text-muted-foreground">
                <b className="font-semibold text-heading">{m.mine ? t('You') : t(m.sender.name)}</b>
                {!m.mine && m.from === 'team' ? ` · ${t(m.sender.specialtyLabel ?? m.sender.roleLabel)}` : ''}
                {' · '}<When iso={m.createdAt} />
              </span>
              <p dir="auto" className={cn('m-0 whitespace-pre-wrap break-words rounded-[18px] px-3.5 py-2.5 text-[.95rem] leading-relaxed', ownSide ? 'rounded-ee-[6px] bg-primary text-primary-foreground' : 'rounded-es-[6px] bg-secondary text-foreground')}>{m.body}</p>
              {m.mine && m.id === lastMine?.id ? (
                <span className="inline-flex items-center gap-1 px-1 text-[.72rem] text-muted-foreground">
                  {m.read ? <><CheckCheck className="size-3.5" aria-hidden />{side === 'team' ? t('Read by the patient') : t('Read by your care team')}</> : <><Check className="size-3.5" aria-hidden />{t('Sent')}</>}
                </span>
              ) : null}
            </li>
          );
        }) : (
          <li className="m-auto max-w-sm px-4 py-8 text-center text-sm text-muted-foreground">
            {side === 'patient' ? t('No messages yet. Write to your care team about your meals, your goals or how you are doing.') : t('No messages yet. Write to the patient to start the conversation.')}
          </li>
        )}
      </ol>
      <p className="sr-only" aria-live="polite" role="status">{announce}</p>
      <form onSubmit={send} noValidate className="flex flex-col gap-2 border-t border-border bg-background/60 p-3 sm:p-4">
        <Label htmlFor={inputId}>{side === 'patient' ? t('Message your care team') : t('Message the patient')}</Label>
        <Textarea id={inputId} value={text} rows={3} maxLength={max} onChange={(e) => { setText(e.target.value); if (error) setError(null); }}
          onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); void send(); } }}
          aria-describedby={`${inputId}-count${error ? ` ${inputId}-err` : ''}${side === 'patient' ? ` ${inputId}-safety` : ''}`} aria-invalid={error ? true : undefined} />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CharCount id={`${inputId}-count`} value={text} max={max} />
          <Button type="submit" disabled={busy}><Send aria-hidden className="rtl:-scale-x-100" />{busy ? t('Sending…') : t('Send')}</Button>
        </div>
        {error ? <p id={`${inputId}-err`} role="alert" className="m-0 text-sm font-semibold text-destructive">{error}</p> : null}
        {side === 'patient' ? (
          <p id={`${inputId}-safety`} className="m-0 flex items-start gap-1.5 text-xs text-muted-foreground">
            <Phone className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            <span>{t('For emergencies call 997 or go to the nearest emergency department. Messages are read during working hours.')} {t('Replies come from your care team, not from Mizan.')}</span>
          </p>
        ) : (
          <p className="m-0 text-xs text-muted-foreground">{t('The patient sees your name and specialty. If they have a real email address, they get a short alert that there is a new message, never what it says.')}</p>
        )}
      </form>
    </section>
  );
}
