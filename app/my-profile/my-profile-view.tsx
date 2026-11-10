'use client';
import * as React from 'react';
import Link from 'next/link';
import { Lock, Heart, Activity, HeartPulse, Pencil, Info, Clock } from 'lucide-react';
import { useApi, apiSend, ApiError } from '@/lib/api-client';
import { PageHead, PageBody } from '@/components/site/page-head';
import { RequestStatusChip } from '@/components/cb/status';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Notice } from '@/components/ui/notice';
import { toast } from '@/components/ui/toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { SectionFields, SectionSummary, readSection, type Section } from '@/components/forms/profile-sections';
import { FormErrors, scrollToFirstError } from '@/components/forms/errors';
import { RequestDialog, type RequestTarget } from '@/components/patient/request-dialog';
import { PERMISSION_TEXT } from '@/components/patient/helpers';
import { useT } from '@/components/site/lang';

/* eslint-disable @typescript-eslint/no-explicit-any */
type Record_ = any;
type Editable = Extract<Section, 'preferences' | 'appetite'>;

export function MyProfileView({ pid, initial, reference, openReport, today }: { pid: string; initial: Record_; reference: any; openReport: boolean; today: string }) {
  const { t } = useT();
  const key = `/api/patients/${pid}`;
  const { data, error, mutate } = useApi<Record_>(key, initial);
  const rec = data ?? initial;
  const p = rec.patient;
  const discharged = p.status === 'discharged';
  const reports = rec.requests.filter((r: any) => r.clinical);
  const [edit, setEdit] = React.useState<Editable | null>(null);
  const [report, setReport] = React.useState<RequestTarget | null>(null);

  // ?report=1 opens the report dialog once (admitted patients only), then clears the parameter.
  React.useEffect(() => {
    if (!openReport) return;
    window.history.replaceState(null, '', '/my-profile');
    if (!discharged) setReport({ type: 'clinical-change' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <PageHead eyebrow={`${p.demoId} · ${t('My food profile')}`} title={t('My Food Profile')} space="member">
        <div className="flex flex-col gap-3 pt-1">
          <Notice tone="info" role="note" icon={<Lock aria-hidden />} title={t(PERMISSION_TEXT)}>
            {t('Your preferences decide which meals we show you first. They never override your prescribed diet or allergies.')}
          </Notice>
          {discharged ? <Notice tone="warn" icon={<Info aria-hidden />}>{t('You have been discharged. You can still see your profile, but you can’t change it here.')}</Notice> : null}
        </div>
      </PageHead>
      <PageBody space="member">
        {error ? <Notice tone="danger" title={t('We couldn’t refresh your profile.')}>{t(error.message)} {t('Check your connection and try again.')}</Notice> : null}
        <div className="grid items-start gap-4 md:grid-cols-2">
          <Card aria-labelledby="pf-pref">
            <CardHeader>
              <CardTitle id="pf-pref" className="flex items-center gap-2"><Heart className="size-5" aria-hidden />{t('My food preferences')}</CardTitle>
              {discharged ? null : <Button size="sm" className="min-h-10" onClick={() => setEdit('preferences')} aria-label={t('Update my food preferences')}><Pencil aria-hidden />{t('Update')}</Button>}
            </CardHeader>
            <SectionSummary section="preferences" p={p} reference={reference} />
            <p className="text-sm text-muted-foreground">{t('You can change these yourself at any time.')}</p>
          </Card>
          <Card aria-labelledby="pf-app">
            <CardHeader>
              <CardTitle id="pf-app" className="flex items-center gap-2"><Activity className="size-5" aria-hidden />{t('My appetite')}</CardTitle>
              {discharged ? null : <Button size="sm" className="min-h-10" onClick={() => setEdit('appetite')} aria-label={t('Update my appetite')}><Pencil aria-hidden />{t('Update')}</Button>}
            </CardHeader>
            <SectionSummary section="appetite" p={p} reference={reference} />
            <p className="text-sm text-muted-foreground">{t('If you’re not very hungry, we’ll suggest smaller portions that still fit your plan.')}</p>
          </Card>
          <Card tone="mint" aria-labelledby="pf-diet" className="md:col-span-2">
            <CardHeader>
              <CardTitle id="pf-diet" className="flex items-center gap-2"><Lock className="size-5" aria-hidden />{t('My prescribed diet and allergies')}</CardTitle>
              {discharged ? null : <Button size="sm" variant="outline" className="min-h-10" onClick={() => setReport({ type: 'clinical-change' })}><HeartPulse aria-hidden />{t('Tell us about a change')}</Button>}
            </CardHeader>
            <p className="text-sm">{t('Your care team recorded this, and only an authorised admin can change it. If something looks wrong or has changed, tell us. Your nutrition team will check it, and nothing changes until they do.')}</p>
            <SectionSummary section="clinical" p={p} reference={reference} />
            {reports.length ? (
              <div className="flex flex-col gap-2 border-t border-sage pt-4">
                <h3 className="text-base">{t('Changes I reported')}</h3>
                <ul className="flex flex-col gap-2">
                  {reports.map((r: any) => (
                    <li key={r.id} className="flex flex-col gap-1.5 rounded-[14px] border border-border bg-card px-3.5 py-3 text-[.95rem]">
                      <span className="flex flex-wrap items-center gap-2"><RequestStatusChip status={r.status} /><b>{t(r.reportLabel ?? r.typeLabel)}{r.allergenLabel ? `: ${t(r.allergenLabel)}` : ''}</b></span>
                      <span className="min-w-0 break-words">“{r.message}”</span>
                      {r.response
                        ? <span className="text-sm">{t('Reply from {name}: {response}', { name: r.resolvedBy, response: t(r.response) })}</span>
                        : <span className="flex items-center gap-1.5 text-sm text-muted-foreground"><Clock className="size-4" aria-hidden />{t('Waiting for an admin to review it.')}</span>}
                      <Link href={`/my-requests?id=${encodeURIComponent(r.id)}`} className="inline-flex min-h-10 w-fit items-center text-sm" aria-label={t('View report: {type}', { type: t(r.reportLabel ?? r.typeLabel) })}>{t('View')}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </Card>
        </div>
      </PageBody>

      <EditDialog pid={pid} section={edit} p={p} reference={reference} onClose={() => setEdit(null)} onSaved={() => mutate()} />
      <RequestDialog pid={pid} target={report} onClose={() => setReport(null)} vocab={reference.vocab} today={today} maxDate={today} defaultDate={today} onSent={() => { void mutate(); }} />
    </>
  );
}

function EditDialog({ pid, section, p, reference, onClose, onSaved }: { pid: string; section: Editable | null; p: any; reference: any; onClose: () => void; onSaved: () => Promise<unknown> }) {
  const { t } = useT();
  const last = React.useRef<Editable | null>(null);
  if (section) last.current = section;
  const s = section ?? last.current;
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const formRef = React.useRef<HTMLFormElement>(null);
  React.useEffect(() => { if (section) { setErrors({}); setFormError(null); setBusy(false); } }, [section]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!s) return;
    setBusy(true); setErrors({}); setFormError(null);
    try {
      const res = await apiSend<{ warnings?: string[] }>('PATCH', `/api/patients/${pid}/sections/${s}`, readSection(s, e.currentTarget));
      onClose();
      toast(t('Saved. Your nutrition team will see your update.'));
      for (const w of res.warnings ?? []) toast(t(w), { tone: 'warn', timeout: 9000 });
      await onSaved();
    } catch (err) {
      const ae = err as ApiError;
      if (Object.keys(ae.errors ?? {}).length) { setErrors(Object.fromEntries(Object.entries(ae.errors).map(([k, v]) => [k, t(v)]))); scrollToFirstError(formRef.current); } else setFormError(t(ae.message));
    } finally { setBusy(false); }
  }

  return (
    <Dialog open={Boolean(section)} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent wide={s === 'preferences'}>
        <DialogHeader>
          <DialogTitle>{s === 'preferences' ? t('Update my food preferences') : t('Update my appetite')}</DialogTitle>
          <DialogDescription>{s === 'preferences' ? t('Your preferences decide which meals we show you first. They never override your diet or allergies.') : t('How is your appetite now? We’ll suggest portions that fit your plan.')}</DialogDescription>
        </DialogHeader>
        <DialogBody>
          {s ? (
            <FormErrors errors={errors}>
              <form id="pf-form" ref={formRef} noValidate onSubmit={submit} key={s} className="flex flex-col gap-4">
                <SectionFields section={s} p={p} reference={reference} />
                {formError ? <p role="alert" className="text-sm font-semibold text-destructive">{formError}</p> : null}
              </form>
            </FormErrors>
          ) : null}
        </DialogBody>
        <DialogFooter>
          <DialogClose className={buttonVariants({ variant: 'outline' })}>{t('Cancel')}</DialogClose>
          <Button type="submit" form="pf-form" disabled={busy}>{busy ? t('Saving…') : t('Save')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
