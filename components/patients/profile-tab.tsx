'use client';
import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Lock, LogOut, User, Trash2, KeyRound, Copy, Check, X, HeartPulse } from 'lucide-react';
import { apiSend } from '@/lib/api-client';
import { SectionFields, SectionSummary, readSection, type Section } from '@/components/forms/profile-sections';
import { FormErrors, FieldError } from '@/components/forms/errors';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input, NativeSelect, Label } from '@/components/ui/input';
import { Notice } from '@/components/ui/notice';
import { toast } from '@/components/ui/toast';
import { SECTION_PERMISSION } from '@/domain/rbac.js';
import { formatDate } from '@/lib/format';
import { useT } from '@/components/site/lang';
import { cn } from '@/lib/utils';
import { Modal, FormMessage, useSubmit, When, errorText, dropAppCache } from './common';
import { usePatient, P, type DialogProps } from './patient-context';

/* eslint-disable @typescript-eslint/no-explicit-any */

export const SECTIONS: [Section, string, string][] = [
  ['clinical', 'Prescribed diet, allergies and restrictions', 'Entered by the care team. Only an admin can change this section. Saving re-screens every upcoming meal.'],
  ['preferences', 'Food preferences', 'Preferred cuisines and foods, disliked ingredients and preferred portion. Used only for ranking.'],
  ['appetite', 'Current appetite', 'Used to suggest a portion within the prescribed plan.'],
  ['details', 'Patient details', 'Demonstration identifier, ward and bed.'],
];

function Panel({ id, title, aside, children, className }: { id: string; title: string; aside?: React.ReactNode; children: React.ReactNode; className?: string }) {
  const { t } = useT();
  return (
    <section aria-labelledby={id} className={cn('flex min-w-0 flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-soft sm:p-6', className)}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h2 id={id} tabIndex={-1} className="text-lg outline-none sm:text-xl">{t(title)}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

export function ProfileTab() {
  const { t, lang } = useT();
  const c = usePatient();
  const p = c.record.patient;
  const discharged = c.discharged;
  const canEdit = (section: Section) => c.can((SECTION_PERMISSION as Record<string, string>)[section]) && !discharged;
  const [linkBusy, setLinkBusy] = React.useState(false);
  const createCode = async (ev: React.MouseEvent<HTMLButtonElement>) => {
    const from = ev.currentTarget;
    setLinkBusy(true);
    try {
      const r = await apiSend<{ code: string; expiresAt: string; hours: number }>('POST', P(c.id, '/link-code'));
      c.open({ kind: 'linkcode', ...r }, { from, fallback: 'sec-acct' });
      void c.refresh();
    } catch (err) { toast(errorText(err, t), { tone: 'error' }); } finally { setLinkBusy(false); }
  };
  const discharge = (ev: React.MouseEvent<HTMLButtonElement>) => c.open({
    kind: 'reason', title: t('Record discharge for {id}?', { id: p.demoId }),
    intro: t('Upcoming meals that have not been delivered are cancelled and the kitchen is alerted. Pending requests are closed with a note. Nothing is deleted.'),
    label: t('Note (optional), e.g. discharged home'), button: t('Record discharge'),
    onSubmit: async (note) => { const r = await apiSend<{ cancelled: unknown[] }>('POST', P(c.id, '/discharge'), { note }); toast(t(r.cancelled.length === 1 ? 'Discharge recorded. {n} upcoming meal period cancelled.' : 'Discharge recorded. {n} upcoming meal periods cancelled.', { n: r.cancelled.length })); },
  }, { from: ev.currentTarget, fallback: 'sec-adm' });

  return (
    <div className="grid items-start gap-4 lg:grid-cols-2">
      {SECTIONS.map(([section, title, hint]) => (
        <Panel key={section} id={`sec-${section}`} title={title} className={section === 'clinical' ? 'border-sage bg-mint/40 lg:col-span-2' : undefined}
          aside={canEdit(section)
            ? <Button variant="outline" size="sm" onClick={(ev) => c.open({ kind: 'section', section }, { from: ev.currentTarget, fallback: `sec-${section}` })} aria-label={lang === 'ar' ? t('Edit {section}', { section: t(title) }) : `Edit ${title.toLowerCase()}`}><Pencil aria-hidden />{t('Edit')}</Button>
            : section === 'clinical' && !c.can('patient:edit-clinical') ? <Badge variant="outline"><Lock aria-hidden />{t('Admin only')}</Badge> : null}>
          <p className="text-sm text-muted-foreground">{t(hint)}</p>
          <SectionSummary section={section} p={p} reference={c.reference} />
        </Panel>
      ))}

      <Panel id="sec-adm" title="Admission status" aside={discharged ? <Badge variant="outline"><X aria-hidden />{t('Discharged')}</Badge> : <Badge variant="ok"><Check aria-hidden />{t('Admitted')}</Badge>}>
        {discharged ? (
          <>
            <p>{lang === 'ar' ? `${t('Discharged on {date}', { date: p.dischargedOn })}${p.dischargedBy ? ` ${t('by {name}', { name: p.dischargedBy })}` : ''}${p.dischargeNote ? ` (${p.dischargeNote})` : ''}.` : <>Discharged on <b>{p.dischargedOn}</b>{p.dischargedBy ? ` by ${p.dischargedBy}` : ''}{p.dischargeNote ? ` (${p.dischargeNote})` : ''}.</>}</p>
            <p className="text-sm text-muted-foreground">{t('Records are kept read-only. Readmitting returns the patient to meal lists; review the diet order first.')}</p>
            {c.can('patient:admission') ? <div><Button size="sm" onClick={(ev) => c.open({ kind: 'readmit' }, { from: ev.currentTarget, fallback: 'sec-adm' })}>{t('Readmit patient')}</Button></div> : null}
          </>
        ) : (
          <>
            <p className="text-sm">{lang === 'ar' ? t('Recording a discharge removes the patient from upcoming meal and kitchen lists and cancels meals not yet delivered (the kitchen is alerted). It does not delete anything: past meals, intake and requests are kept. It is separate from removing the patient account and from deleting the record.') : <>Recording a discharge removes the patient from upcoming meal and kitchen lists and cancels meals not yet delivered (the kitchen is alerted). It does <b>not</b> delete anything: past meals, intake and requests are kept. It is separate from removing the patient account and from deleting the record.</>}</p>
            <div className="flex flex-col gap-2 rounded-[14px] border border-border bg-mint/50 p-3">
              <p className="flex items-center gap-1.5 font-display font-medium text-heading"><HeartPulse className="size-4" aria-hidden />{t('Before discharge: prepare the home plan')}</p>
              <p className="text-sm text-muted-foreground">{t('The patient’s plan for home (meal ideas, a Ministry of Health meal plan and a shopping list in Eat well) uses the daily targets in the Health tab. Check them, and review the assessment if one is waiting.')}</p>
              <div><Button size="sm" variant="outline" onClick={() => c.goToTab('health')}>{t('Prepare home plan')}</Button></div>
            </div>
            {c.can('patient:admission') ? <div><Button variant="outline" size="sm" onClick={discharge}><LogOut aria-hidden />{t('Record discharge')}</Button></div> : null}
          </>
        )}
      </Panel>

      <Panel id="sec-acct" title="Patient account">
        <p className="text-sm text-muted-foreground">{t('The patient’s personal login. Removing the link stops the account from reaching this profile; the account and the hospital record are both kept.')}</p>
        {p.linkedAccounts.length ? (
          <>
            <p className="flex items-center gap-1.5"><User className="size-4" aria-hidden /> {lang === 'ar' ? t('Linked to @{username} since {date}.', { username: p.linkedAccounts[0].username, date: formatDate(String(p.linkedAccounts[0].createdAt).slice(0, 10), undefined, lang) }) : <>Linked to <b>@{p.linkedAccounts[0].username}</b> since {formatDate(String(p.linkedAccounts[0].createdAt).slice(0, 10))}.</>}</p>
            {c.can('patient:link-account') ? <div><Button variant="destructive" size="sm" onClick={(ev) => c.open({ kind: 'unlink' }, { from: ev.currentTarget, fallback: 'sec-acct' })}>{t('Remove account link')}</Button></div> : null}
          </>
        ) : discharged ? <p className="text-sm text-muted-foreground">{t('No account linked.')}</p> : (
          <>
            <p>{t('No account linked.')}{p.linkCodeActive ? ` ${t('A link code is active.')}` : ''}</p>
            {c.can('patient:link-account') ? <div><Button size="sm" onClick={createCode} disabled={linkBusy}><KeyRound aria-hidden />{t(linkBusy ? 'Creating code…' : 'Create a one-time link code')}</Button></div> : null}
          </>
        )}
      </Panel>

      {c.can('patient:delete') ? (
        <Panel id="sec-del" title="Delete patient record permanently" className="border-destructive-border bg-destructive-soft/40 lg:col-span-2">
          <p className="text-sm">{t('Demonstration data control: permanently deletes this record with its meals, intake and requests. This cannot be undone. To end a stay, record a discharge instead.')}</p>
          <div><Button variant="destructive" size="sm" onClick={(ev) => c.open({ kind: 'delete' }, { from: ev.currentTarget, fallback: 'sec-del' })}><Trash2 aria-hidden />{t('Delete record permanently')}</Button></div>
        </Panel>
      ) : null}
    </div>
  );
}

// ------------------------------------------------------------------ edit one section
export function SectionDialog({ a, open, finalFocus }: DialogProps<'section'>) {
  const { t, lang } = useT();
  const c = usePatient();
  const { busy, errors, formError, run } = useSubmit();
  const formRef = React.useRef<HTMLFormElement>(null);
  const [patient] = React.useState(() => a.prefill?.patient ?? c.record.patient);
  const title = SECTIONS.find(([s]) => s === a.section)?.[1] ?? a.section;
  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const body = readSection(a.section, e.currentTarget);
    run(async () => {
      const res = await apiSend<{ changes?: string[]; recheck?: { hold?: boolean }[]; warnings?: string[] }>('PATCH', P(c.id, `/sections/${a.section}`), body);
      await c.refresh();
      const held = (res.recheck ?? []).filter((r) => r.hold).length;
      toast(`${t('Saved.')}${res.changes?.length ? ` ${res.changes.map((x) => t(x)).join(lang === 'ar' ? '؛ ' : '; ')}.` : ''}${res.recheck?.length ? ` ${held ? t(res.recheck.length === 1 ? '{n} upcoming meal period affected, {held} put on hold.' : '{n} upcoming meal periods affected, {held} put on hold.', { n: res.recheck.length, held }) : t(res.recheck.length === 1 ? '{n} upcoming meal period affected.' : '{n} upcoming meal periods affected.', { n: res.recheck.length })}` : ''}`, { timeout: 9000 });
      for (const w of res.warnings ?? []) toast(w, { tone: 'warn', timeout: 9000 });
      if (a.prefill?.requestId) c.open({ kind: 'respond', requestId: a.prefill.requestId, suggestion: t('Allergy record updated after review.') });
      else c.close();
    }, formRef.current);
  };
  return (
    <Modal open={open} onClose={c.close} wide={a.section !== 'appetite'} finalFocus={finalFocus} title={t('Edit: {section}', { section: t(title) })}
      footer={<><Button variant="outline" onClick={c.close}>{t('Cancel')}</Button><Button type="submit" form="sec-form" disabled={busy}>{t(busy ? 'Saving…' : 'Save changes')}</Button></>}>
      {a.section === 'clinical' ? <Notice tone="info">{t('Saving re-screens every upcoming offered, chosen, confirmed and prepared meal. Meals that no longer pass are put on hold for review, and the kitchen is alerted about trays already on its list.')}</Notice> : null}
      {a.prefill?.note ? <Notice tone="rose" icon={<HeartPulse aria-hidden />}>{t(a.prefill.note)}</Notice> : null}
      <FormErrors errors={errors}>
        <form id="sec-form" ref={formRef} onSubmit={submit} noValidate className="flex flex-col gap-4">
          <SectionFields section={a.section} p={patient} reference={c.reference} />
          <FormMessage message={formError} />
        </form>
      </FormErrors>
    </Modal>
  );
}

// ------------------------------------------------------------------ readmit
export function ReadmitDialog({ open, finalFocus }: DialogProps<'readmit'>) {
  const { t } = useT();
  const c = usePatient();
  const p = c.record.patient;
  const { busy, errors, formError, run } = useSubmit();
  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    run(async () => {
      await apiSend('POST', P(c.id, '/readmit'), { ward: fd.get('ward'), bed: fd.get('bed') });
      await c.refresh();
      c.close();
      toast(t('Patient readmitted.'));
    });
  };
  return (
    <Modal open={open} onClose={c.close} finalFocus={finalFocus} title={t('Readmit {id}', { id: p.demoId })}
      footer={<><Button variant="outline" onClick={c.close}>{t('Cancel')}</Button><Button type="submit" form="ra-form" disabled={busy}>{t(busy ? 'Saving…' : 'Readmit')}</Button></>}>
      <FormErrors errors={errors}>
        <form id="ra-form" onSubmit={submit} noValidate className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ra-ward">{t('Ward')}</Label>
              <NativeSelect id="ra-ward" name="ward" defaultValue={p.ward}>{c.reference.vocab.wards.map((w: any) => <option key={w.id} value={w.id}>{t(w.label)}</option>)}</NativeSelect>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ra-bed">{t('Bed')}</Label>
              <Input id="ra-bed" name="bed" defaultValue={p.bed} maxLength={8} />
              <FieldError name="bed" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">{t('An admin should review the diet order and allergies before meals are planned.')}</p>
          <FormMessage message={formError} />
        </form>
      </FormErrors>
    </Modal>
  );
}

// ------------------------------------------------------------------ link code
export function LinkCodeDialog({ a, open, finalFocus }: DialogProps<'linkcode'>) {
  const { t, lang } = useT();
  const c = usePatient();
  const copy = async () => {
    try { await navigator.clipboard.writeText(a.code); toast(t('Code copied.')); } catch { toast(t('Select the code and copy it manually.'), { tone: 'warn' }); }
  };
  return (
    <Modal open={open} onClose={c.close} finalFocus={finalFocus} title={t('One-time account link code')}
      footer={<><Button variant="outline" onClick={copy}><Copy aria-hidden />{t('Copy code')}</Button><Button onClick={c.close}>{t('Done')}</Button></>}>
      <p>{lang === 'ar' ? <>{t('Give this code to the patient. They choose “Create account → Patient” and enter it. It works once and expires in {n} hours', { n: a.hours })} (<When iso={a.expiresAt} />).</> : <>Give this code to the patient. They choose <b>Create account → Patient</b> and enter it. It works once and expires in {a.hours} hours (<When iso={a.expiresAt} />).</>}</p>
      <p dir="ltr" className="select-all rounded-[16px] bg-mint p-4 text-center font-mono text-[1.75rem] tracking-[.12em] text-sage-deep sm:text-[2rem]" aria-label={t('Link code {code}', { code: a.code.split('').join(' ') })}>{a.code}</p>
      <p className="text-sm text-muted-foreground">{t('Creating a new code replaces any earlier unused code.')}</p>
    </Modal>
  );
}

// ------------------------------------------------------------------ unlink accounts
export function UnlinkDialog({ open, finalFocus }: DialogProps<'unlink'>) {
  const { t } = useT();
  const c = usePatient();
  const { busy, formError, run } = useSubmit();
  const go = () => run(async () => {
    await apiSend('DELETE', P(c.id, '/accounts'));
    await c.refresh();
    c.close();
    toast(t('Account link removed.'));
  });
  return (
    <Modal open={open} onClose={c.close} finalFocus={finalFocus} title={t('Remove the patient account link?')}
      footer={<><Button variant="outline" onClick={c.close}>{t('Cancel')}</Button><Button variant="destructive-solid" onClick={go} disabled={busy}>{t(busy ? 'Removing…' : 'Remove link')}</Button></>}>
      <p>{t('The patient will no longer reach this profile from their account. The account and all hospital records are kept.')}</p>
      <FormMessage message={formError} />
    </Modal>
  );
}

// ------------------------------------------------------------------ delete the demonstration record
export function DeleteDialog({ open, finalFocus }: DialogProps<'delete'>) {
  const { t } = useT();
  const c = usePatient();
  const router = useRouter();
  const demoId = c.record.patient.demoId;
  const [typed, setTyped] = React.useState('');
  const { busy, errors, formError, run } = useSubmit();
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    run(async () => {
      await apiSend('DELETE', P(c.id), { confirmDemoId: typed });
      c.close();
      toast(t('Record deleted.'));
      void dropAppCache();
      router.push('/patients');
    });
  };
  return (
    <Modal open={open} onClose={c.close} finalFocus={finalFocus} title={t('Permanently delete {id}?', { id: demoId })}
      footer={<><Button variant="outline" onClick={c.close}>{t('Cancel')}</Button><Button type="submit" form="dl-form" variant="destructive-solid" disabled={busy}>{t(busy ? 'Deleting…' : 'Delete permanently')}</Button></>}>
      <Notice tone="danger" icon={<Trash2 aria-hidden />}>{t('This deletes the record, its schedule, intake and requests for good. To end a hospital stay, use “Record discharge” instead.')}</Notice>
      <FormErrors errors={errors}>
        <form id="dl-form" onSubmit={submit} noValidate className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dl-id">{t('Type {id} to confirm', { id: demoId })}</Label>
            <Input id="dl-id" name="confirmDemoId" autoComplete="off" value={typed} onChange={(e) => setTyped(e.target.value)} aria-invalid={errors.confirmDemoId ? true : undefined} />
            <FieldError name="confirmDemoId" />
          </div>
          <FormMessage message={errors.confirmDemoId ? null : formError} />
        </form>
      </FormErrors>
    </Modal>
  );
}
