'use client';
// "How was your lunch?": the patient's own report after a meal was delivered
// (delivered does not mean eaten). Uses the shared intake fields (staff=false).
import * as React from 'react';
import { apiSend, ApiError } from '@/lib/api-client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button, buttonVariants } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import { IntakeFields, readIntake } from '@/components/forms/intake-fields';
import { FormErrors, scrollToFirstError } from '@/components/forms/errors';
import { periodLabel, portionLabel } from '@/components/cb/labels';
import { formatDate } from '@/lib/format';
import { useT } from '@/components/site/lang';

/* eslint-disable @typescript-eslint/no-explicit-any */
export type FeedbackTarget = { date: string; period: string; mealName?: string | null; portion?: string | null; myFeedback?: any };

export function FeedbackDialog({ pid, target, onClose, reference, onSaved }: { pid: string; target: FeedbackTarget | null; onClose: () => void; reference: any; onSaved: () => void | Promise<unknown> }) {
  const { t, lang } = useT();
  const last = React.useRef<FeedbackTarget | null>(null);
  if (target) last.current = target;
  const tg = target ?? last.current;
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const formRef = React.useRef<HTMLFormElement>(null);
  React.useEffect(() => { if (target) { setErrors({}); setFormError(null); setBusy(false); } }, [target]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true); setErrors({}); setFormError(null);
    try {
      await apiSend('POST', `/api/patients/${pid}/intake`, readIntake(e.currentTarget));
      onClose();
      toast(t('Thank you. We’ve saved your answers.'));
      await onSaved();
    } catch (err) {
      const ae = err as ApiError;
      if (Object.keys(ae.errors ?? {}).length) { setErrors(Object.fromEntries(Object.entries(ae.errors).map(([k, v]) => [k, t(v)]))); scrollToFirstError(formRef.current); } else setFormError(t(ae.message));
    } finally { setBusy(false); }
  }

  return (
    <Dialog open={Boolean(target)} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent wide>
        <DialogHeader>
          <DialogTitle>{tg ? t('How was your {period}?', { period: t(periodLabel(tg.period)).toLowerCase() }) : t('How was your meal?')}</DialogTitle>
          {tg ? <DialogDescription><b className="text-foreground">{tg.mealName ? t(tg.mealName) : ''}</b>{tg.portion ? ` · ${t('{portion} portion', { portion: t(portionLabel(tg.portion)) })}` : ''} · {formatDate(tg.date, { weekday: 'long', month: 'short', day: 'numeric' }, lang)}</DialogDescription> : null}
        </DialogHeader>
        <DialogBody>
          {tg ? (
            <FormErrors errors={errors}>
              <form id="fb-form" ref={formRef} noValidate onSubmit={submit} key={`${tg.date}|${tg.period}`} className="flex flex-col gap-5">
                <input type="hidden" name="date" value={tg.date} />
                <input type="hidden" name="period" value={tg.period} />
                <IntakeFields reference={reference} staff={false} initial={tg.myFeedback ?? null} />
                {formError ? <p role="alert" className="text-sm font-semibold text-destructive">{formError}</p> : null}
              </form>
            </FormErrors>
          ) : null}
          <p className="text-sm text-muted-foreground">{t('Your answers help us choose meals you’ll enjoy. They never change your diet or allergy rules. Your care team may also note what they saw, but each meal is only counted once.')}</p>
        </DialogBody>
        <DialogFooter>
          <DialogClose className={buttonVariants({ variant: 'outline' })}>{t('Cancel')}</DialogClose>
          <Button type="submit" form="fb-form" disabled={busy}>{busy ? t('Sending…') : t('Send feedback')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
