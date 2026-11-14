'use client';
// Notes from the care team. Providers write a note (up to 600 characters) for the
// patient to see or for the care team only; patients see only the notes meant for
// them, with the author's name, specialty and the date, newest first.
import * as React from 'react';
import { Eye, Lock, NotebookPen, Trash2 } from 'lucide-react';
import { useApi, apiSend, ApiError } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea, Label } from '@/components/ui/input';
import { OptionCard } from '@/components/ui/field';
import { toast } from '@/components/ui/toast';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useT } from '@/components/site/lang';
import { C, CharCount, Initials, ProviderLine, useCareRefresh } from './common';

/* eslint-disable @typescript-eslint/no-explicit-any */
type Note = { id: string; body: string; visibility: 'patient' | 'team'; createdAt: string; author: { name: string; roleLabel: string; specialtyLabel: string | null }; canDelete?: boolean };
type Notes = { notes: Note[]; max: number };

function NoteItem({ n, team, onDelete, busy }: { n: Note; team: boolean; onDelete?: () => void; busy?: boolean }) {
  const { t, lang } = useT();
  return (
    <li className="flex gap-3 rounded-[16px] border border-border bg-card p-3.5 sm:p-4">
      <Initials name={n.author.name} className="max-sm:hidden" />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          <ProviderLine p={n.author} className="font-semibold text-heading" />
          <span className="text-muted-foreground">· {formatDate(n.createdAt.slice(0, 10), { day: 'numeric', month: 'short', year: 'numeric' }, lang)}</span>
          {team ? (n.visibility === 'patient'
            ? <Badge variant="mint"><Eye aria-hidden />{t('The patient can see it')}</Badge>
            : <Badge variant="warn"><Lock aria-hidden />{t('Care team only')}</Badge>) : null}
        </div>
        <p dir="auto" className="m-0 whitespace-pre-wrap break-words text-[.95rem] leading-relaxed">{n.body}</p>
      </div>
      {n.canDelete && onDelete ? <Button size="icon" variant="ghost" onClick={onDelete} disabled={busy} aria-label={t('Delete the note of {date}', { date: formatDate(n.createdAt.slice(0, 10), undefined, lang) })}><Trash2 aria-hidden /></Button> : null}
    </li>
  );
}

/** The care team's Notes tab: write a note, then every note (with who can see it). */
export function TeamNotes({ who, canWrite, initial }: { who: string; canWrite: boolean; initial?: Notes }) {
  const { t } = useT();
  const { data } = useApi<Notes>(C(who, '/notes'), initial);
  const refresh = useCareRefresh(who);
  const [text, setText] = React.useState('');
  const [visibility, setVisibility] = React.useState<'patient' | 'team'>('patient');
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [busy, setBusy] = React.useState(false);
  const [deleting, setDeleting] = React.useState<string | null>(null);
  const max = data?.max ?? 600;
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) { setErrors({ body: 'Write the note first.' }); return; }
    setBusy(true); setErrors({});
    try {
      await apiSend('POST', C(who, '/notes'), { body: text, visibility });
      setText('');
      toast(visibility === 'patient' ? t('Note saved. The patient can see it.') : t('Note saved for the care team only.'));
      void refresh();
    } catch (err) {
      if (err instanceof ApiError) { setErrors(err.errors ?? {}); toast(t(err.message), { tone: 'error' }); }
    } finally { setBusy(false); }
  };
  const remove = async (n: Note) => {
    setDeleting(n.id);
    try { await apiSend('DELETE', C(who, `/notes/${n.id}`)); toast(t('Note deleted.')); void refresh(); }
    catch (err) { toast(t((err as Error).message), { tone: 'error' }); }
    finally { setDeleting(null); }
  };
  const notes = data?.notes ?? [];
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start">
      {canWrite ? (
        <Card className="lg:sticky lg:top-24">
          <CardHeader><div className="flex items-center gap-2"><NotebookPen aria-hidden className="size-5 text-primary" /><CardTitle>{t('Write a note')}</CardTitle></div></CardHeader>
          <form onSubmit={save} noValidate className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="note-body">{t('Note')}</Label>
              <Textarea id="note-body" rows={5} maxLength={max} value={text} onChange={(e) => setText(e.target.value)} aria-describedby={`note-count${errors.body ? ' note-err' : ''}`} aria-invalid={errors.body ? true : undefined}
                placeholder={t('For example: well done on your walks this week. Try one less piece of bread at dinner.')} />
              <CharCount id="note-count" value={text} max={max} />
              {errors.body ? <p id="note-err" role="alert" className="m-0 text-sm font-semibold text-destructive">{t(errors.body)}</p> : null}
            </div>
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-1.5 font-display text-sm font-medium text-heading">{t('Who can see it?')}</legend>
              <OptionCard name="note-vis" value="patient" checked={visibility === 'patient'} onChange={() => setVisibility('patient')} title={t('The patient can see it')} description={t('Shown on the patient’s pages with your name and specialty.')} />
              <OptionCard name="note-vis" value="team" checked={visibility === 'team'} onChange={() => setVisibility('team')} title={t('Care team only')} description={t('Only healthcare providers and admins see it.')} />
            </fieldset>
            <Button type="submit" disabled={busy} className="self-start">{busy ? t('Saving…') : t('Save note')}</Button>
          </form>
        </Card>
      ) : null}
      <section aria-labelledby="notes-h" className="flex min-w-0 flex-col gap-3">
        <h2 id="notes-h" className="text-lg sm:text-xl">{t('Notes')} <span className="text-base font-normal text-muted-foreground">({notes.length})</span></h2>
        {notes.length ? (
          <ul className="m-0 flex list-none flex-col gap-2.5 p-0">{notes.map((n) => <NoteItem key={n.id} n={n} team onDelete={() => void remove(n)} busy={deleting === n.id} />)}</ul>
        ) : <p className="text-muted-foreground">{t('No notes yet.')}</p>}
      </section>
    </div>
  );
}

/** The patient's view: notes the care team wrote for them. */
export function PatientNotes({ initial, className, limit }: { initial?: Notes; className?: string; limit?: number }) {
  const { t } = useT();
  const { data } = useApi<Notes>(C('me', '/notes'), initial);
  const [all, setAll] = React.useState(false);
  const notes = data?.notes ?? [];
  const shown = limit && !all ? notes.slice(0, limit) : notes;
  return (
    <Card className={cn(className)} aria-labelledby="pn-h">
      <CardHeader><div className="flex items-center gap-2"><NotebookPen aria-hidden className="size-5 text-primary" /><CardTitle id="pn-h">{t('Notes from your care team')}</CardTitle></div></CardHeader>
      {notes.length ? (
        <>
          <ul className="m-0 flex list-none flex-col gap-2.5 p-0">{shown.map((n) => <NoteItem key={n.id} n={n} team={false} />)}</ul>
          {limit && notes.length > limit ? <Button variant="ghost" size="sm" className="self-start" onClick={() => setAll((x) => !x)} aria-expanded={all}>{all ? t('Show fewer') : t('Show all {n} notes', { n: notes.length })}</Button> : null}
        </>
      ) : <CardDescription>{t('When your care team writes you a note, you’ll find it here.')}</CardDescription>}
    </Card>
  );
}
