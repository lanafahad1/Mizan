'use client';
import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Lock, HeartPulse, Database, Download, RotateCcw, Trash2, Pencil, Loader2 } from 'lucide-react';
import type { Viewer } from '@/lib/server/session';
import { authClient, authErrorMessage } from '@/lib/auth-client';
import { apiSend, ApiError } from '@/lib/api-client';
import { PASSWORD_RULE, USERNAME_RULE, USERNAME_RE, passwordProblem } from '@/lib/password-policy';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Button, buttonVariants } from '@/components/ui/button';
import { Notice } from '@/components/ui/notice';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { toast } from '@/components/ui/toast';
import { PageHead } from '@/components/site/page-head';
import { useT } from '@/components/site/lang';
import { ShowPassword, FormError, SubmitButton, focusFirstInvalid, type AuthError } from './form-bits';
import { SessionsCard } from './sessions-card';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_MSG = `Usernames use ${USERNAME_RULE.charAt(0).toLowerCase()}${USERNAME_RULE.slice(1)}`;

function SectionTitle({ id, icon: Icon, children, className }: { id: string; icon: typeof User; children: React.ReactNode; className?: string }) {
  return <CardTitle id={id} className={className ?? 'flex items-center gap-2'}><Icon aria-hidden className="size-5 shrink-0" />{children}</CardTitle>;
}

function Kv({ items }: { items: [string, React.ReactNode][] }) {
  return (
    <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1.5 border-t border-border pt-3 text-sm">
      {items.map(([k, v]) => (
        <React.Fragment key={k}><dt className="font-semibold text-heading">{k}</dt><dd className="min-w-0 break-words text-muted-foreground">{v}</dd></React.Fragment>
      ))}
    </dl>
  );
}

/* ---------------------------------------------------------------- details */

function AccountDetails({ viewer, memberSince }: { viewer: Viewer; memberSince: string }) {
  const { t, lang } = useT();
  const router = useRouter();
  const formRef = React.useRef<HTMLFormElement>(null);
  const [name, setName] = React.useState(viewer.name);
  const [username, setUsername] = React.useState(viewer.username);
  const [email, setEmail] = React.useState(viewer.email);
  const [errors, setErrors] = React.useState<Partial<Record<'name' | 'username' | 'email', string>>>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pending) return;
    setFormError(null);
    const n = name.trim(); const u = username.trim(); const m = email.trim().toLowerCase();
    const errs: typeof errors = {};
    if (!n) errs.name = 'Enter the name to show in Mizan.';
    if (!viewer.isDemo) {
      if (!u) errs.username = 'Please choose a username.';
      else if (!USERNAME_RE.test(u)) errs.username = USERNAME_MSG;
      if (!m) errs.email = 'Please enter your email address.';
      else if (!EMAIL_RE.test(m)) errs.email = 'Please enter a valid email address, for example name@example.com.';
    }
    setErrors(errs);
    if (Object.keys(errs).length) { focusFirstInvalid(formRef.current); return; }

    const update: { name?: string; username?: string } = {};
    if (n !== viewer.name) update.name = n;
    if (!viewer.isDemo && u.toLowerCase() !== viewer.username.toLowerCase()) update.username = u;
    const emailChanged = !viewer.isDemo && m !== viewer.email.toLowerCase();
    if (!Object.keys(update).length && !emailChanged) { toast(t('Nothing to save yet. Change a detail first.'), { tone: 'info' }); return; }

    setPending(true);
    try {
      if (Object.keys(update).length) {
        const { error } = await authClient.updateUser(update);
        if (error) {
          const err = error as AuthError;
          if (err?.code === 'USERNAME_IS_ALREADY_TAKEN') setErrors({ username: 'This username is already taken. Please choose another.' });
          else if (err?.code === 'INVALID_USERNAME' || err?.code === 'USERNAME_TOO_SHORT' || err?.code === 'USERNAME_TOO_LONG') setErrors({ username: USERNAME_MSG });
          else setFormError(authErrorMessage(err));
          return;
        }
      }
      if (emailChanged) {
        const { error } = await authClient.changeEmail({ newEmail: m });
        if (error) {
          const err = error as AuthError;
          if (err?.code?.startsWith('USER_ALREADY_EXISTS') || err?.status === 422) setErrors({ email: 'An account with this email already exists. Use a different email.' });
          else if (err?.code === 'INVALID_EMAIL') setErrors({ email: 'Please enter a valid email address, for example name@example.com.' });
          else setFormError(authErrorMessage(err));
          return;
        }
      }
      toast(t('Account details saved.'));
      router.refresh();
    } finally {
      setPending(false);
    }
  };

  return (
    <Card aria-labelledby="acc-h">
      <SectionTitle id="acc-h" icon={User}>{t('Account details')}</SectionTitle>
      {viewer.isDemo ? (
        <Notice tone="warn">{t('This is a')} <b>{t('shared demo account')}</b>. {t('Its username, email and password cannot be changed.')}</Notice>
      ) : null}
      <form ref={formRef} onSubmit={submit} noValidate className="flex flex-col gap-4">
        <Field id="s-name" label={t('Display name')} error={errors.name && t(errors.name)}>
          <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} autoComplete="name" />
        </Field>
        <Field id="s-user" label={t('Username')} error={errors.username && t(errors.username)} hint={`${t(USERNAME_RULE)} ${t('You can log in with your username or your email.')}`}>
          <Input value={username} onChange={(e) => setUsername(e.target.value)} maxLength={20} autoCapitalize="none" autoCorrect="off" spellCheck={false} autoComplete="username" readOnly={viewer.isDemo} aria-readonly={viewer.isDemo || undefined} className="read-only:bg-muted/60" />
        </Field>
        <Field id="s-email" label={t('Email')} error={errors.email && t(errors.email)}>
          <Input type="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={120} autoCapitalize="none" spellCheck={false} autoComplete="email" readOnly={viewer.isDemo} aria-readonly={viewer.isDemo || undefined} className="read-only:bg-muted/60" />
        </Field>
        <FormError message={formError} />
        <SubmitButton pending={pending} pendingLabel={t('Saving…')} className="w-full sm:w-auto sm:self-start">{t('Save details')}</SubmitButton>
      </form>
      <Kv items={[[t('Role'), t(viewer.roleLabel)], [t('Status'), t(viewer.statusLabel)], [t('Member since'), new Date(memberSince).toLocaleDateString(lang === 'ar' ? 'ar-SA-u-ca-gregory-nu-latn' : 'en-US', { month: 'long', year: 'numeric' })]]} />
    </Card>
  );
}

/* --------------------------------------------------------------- password */

function PasswordCard({ viewer }: { viewer: Viewer }) {
  const { t } = useT();
  const formRef = React.useRef<HTMLFormElement>(null);
  const [cur, setCur] = React.useState('');
  const [n1, setN1] = React.useState('');
  const [n2, setN2] = React.useState('');
  const [show, setShow] = React.useState(false);
  const [errors, setErrors] = React.useState<Partial<Record<'currentPassword' | 'newPassword' | 'confirmPassword', string>>>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pending) return;
    setFormError(null);
    const errs: typeof errors = {};
    if (!cur) errs.currentPassword = 'Enter your current password.';
    if (!n1) errs.newPassword = 'Please choose a new password.';
    else { const p = passwordProblem(n1, { username: viewer.username, email: viewer.email }); if (p) errs.newPassword = p; }
    if (n1 && n1 !== n2) errs.confirmPassword = 'The new passwords do not match.';
    setErrors(errs);
    if (Object.keys(errs).length) { focusFirstInvalid(formRef.current); return; }

    setPending(true);
    const { error } = await authClient.changePassword({ currentPassword: cur, newPassword: n1, revokeOtherSessions: true });
    setPending(false);
    if (error) {
      const err = error as AuthError;
      if (err?.errors && Object.keys(err.errors).length) setErrors(err.errors as typeof errors);
      else if (err?.code === 'INVALID_PASSWORD') setErrors({ currentPassword: 'That isn’t your current password. Try again.' });
      else if (err?.code === 'PASSWORD_TOO_SHORT') setErrors({ newPassword: 'Use at least 8 characters.' });
      else setFormError(authErrorMessage(err));
      setCur('');
      focusFirstInvalid(formRef.current);
      return;
    }
    setCur(''); setN1(''); setN2('');
    toast(t('Password updated. We’ve signed you out on your other devices.'));
    window.dispatchEvent(new Event('carebite:sessions-changed'));
  };

  return (
    <Card aria-labelledby="pw-h">
      <SectionTitle id="pw-h" icon={Lock}>{t('Password')}</SectionTitle>
      {viewer.isDemo ? (
        <p className="text-muted-foreground">{t('Demo accounts share a public password, so it can’t be changed.')}</p>
      ) : (
        <form ref={formRef} onSubmit={submit} noValidate className="flex flex-col gap-4">
          <Field id="s-cur" label={t('Current password')} error={errors.currentPassword && t(errors.currentPassword)}>
            <Input type={show ? 'text' : 'password'} value={cur} onChange={(e) => setCur(e.target.value)} autoComplete="current-password" maxLength={128} />
          </Field>
          <Field id="s-new" label={t('New password')} error={errors.newPassword && t(errors.newPassword)} hint={t(PASSWORD_RULE)}>
            <Input type={show ? 'text' : 'password'} value={n1} onChange={(e) => setN1(e.target.value)} autoComplete="new-password" maxLength={128} />
          </Field>
          <Field id="s-new2" label={t('Confirm new password')} error={errors.confirmPassword && t(errors.confirmPassword)}>
            <Input type={show ? 'text' : 'password'} value={n2} onChange={(e) => setN2(e.target.value)} autoComplete="new-password" maxLength={128} />
          </Field>
          <ShowPassword id="s-show" checked={show} onChange={setShow} />
          <p className="text-sm text-muted-foreground">{t('Changing your password signs you out on every other device.')}</p>
          <FormError message={formError} />
          <SubmitButton pending={pending} pendingLabel={t('Updating…')} className="w-full sm:w-auto sm:self-start">{t('Update password')}</SubmitButton>
        </form>
      )}
    </Card>
  );
}

/* ----------------------------------------------------------- patient link */

function LinkCard({ viewer }: { viewer: Viewer }) {
  const { t } = useT();
  const router = useRouter();
  const [code, setCode] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pending) return;
    const c = code.trim().toUpperCase();
    if (!c) { setError('Enter the link code the nutrition team gave you.'); return; }
    setError(null);
    setPending(true);
    try {
      await apiSend('POST', '/api/account/link', { linkCode: c });
      setCode('');
      toast(t('Linked to your hospital meal profile.'));
      router.refresh();
    } catch (ex) {
      setError(ex instanceof ApiError ? (Object.values(ex.errors ?? {})[0] ?? ex.message) : 'Something went wrong. Please try again.');
    } finally {
      setPending(false);
    }
  };

  return (
    <Card tone="mint" aria-labelledby="lk-h">
      <SectionTitle id="lk-h" icon={HeartPulse}>{t('Hospital meal profile')}</SectionTitle>
      {viewer.patientId ? (
        <>
          <p>{t('Linked to')} <b>{viewer.patientDemoId}</b>. {t('The hospital nutrition team looks after your nutrition record. You can update your food preferences and appetite, and tell us about changes for an admin to review.')}</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link href="/my-profile" className={buttonVariants({ variant: 'outline' })}><Pencil aria-hidden />{t('My food profile')}</Link>
            <Link href="/my-meals" className={buttonVariants({ variant: 'ghost' })}>{t('My meals')}</Link>
          </div>
        </>
      ) : (
        <>
          <p>{t('Not linked yet. Enter the one-time code from your nutrition team.')}</p>
          <form onSubmit={submit} noValidate className="flex flex-col gap-3">
            <Field id="s-link" label={t('Link code')} error={error && t(error)} hint={t('The one-time code from your nutrition team (it works for 72 hours).')}>
              <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="ABCD-2345" autoComplete="one-time-code" autoCapitalize="characters" autoCorrect="off" spellCheck={false} maxLength={12} className="uppercase tracking-wider placeholder:normal-case" />
            </Field>
            <SubmitButton pending={pending} pendingLabel={t('Linking…')} className="w-full sm:w-auto sm:self-start">{t('Link')}</SubmitButton>
          </form>
        </>
      )}
    </Card>
  );
}

/* ------------------------------------------------------------------- data */

function DataCard({ viewer }: { viewer: Viewer }) {
  const { t } = useT();
  return (
    <Card aria-labelledby="data-h">
      <SectionTitle id="data-h" icon={Database}>{t('Your data')}</SectionTitle>
      <p className="text-sm">
        {viewer.role === 'patient'
          ? t('Download a copy of everything linked to your account as a JSON file: account details, your nutrition profile, meal schedule, what you ate, feedback and requests.')
          : t('Download a copy of your account details as a JSON file.')}
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        {/* A plain link: the server answers with an attachment, so the browser downloads it. */}
        <a href="/api/account/export" download="mizan-my-data.json" className={buttonVariants({ variant: 'outline' })}><Download aria-hidden />{t('Download my data')}</a>
        <Link href="/privacy" className={buttonVariants({ variant: 'ghost' })}>{t('Privacy Policy')}</Link>
      </div>
      <Kv items={[[t('Where it’s kept'), t('On the Mizan server, in a Postgres database')]]} />
    </Card>
  );
}

/* ------------------------------------------------------------- demo reset */

function DemoResetCard() {
  const { t } = useT();
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const reset = async () => {
    setPending(true);
    try {
      await apiSend('POST', '/api/account/reset-demo');
      setOpen(false);
      toast(t('The demonstration hospital was reset.'));
      router.push('/patients');
      router.refresh();
    } catch (ex) {
      toast(t(ex instanceof Error ? ex.message : 'Something went wrong. Please try again.'), { tone: 'error' });
    } finally {
      setPending(false);
    }
  };
  return (
    <Card tone="blush" aria-labelledby="demo-h">
      <SectionTitle id="demo-h" icon={RotateCcw}>{t('Reset the demonstration hospital')}</SectionTitle>
      <p className="text-sm">{t('Put every fictional patient, schedule, intake record and request back to how it started today. Accounts stay. A new patient account loses its link if its record is removed.')}</p>
      <Dialog open={open} onOpenChange={setOpen}>
        <Button variant="soft" className="w-full sm:w-auto sm:self-start" onClick={() => setOpen(true)}>{t('Reset demonstration data')}</Button>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('Reset the demonstration hospital?')}</DialogTitle>
            <DialogDescription>{t('All fictional patients, schedules, intake records and requests will be restored to their starting state for today.')}</DialogDescription>
          </DialogHeader>
          <DialogBody><p className="text-sm">{t('Everyone using the demo accounts will see the reset data. You can’t undo this.')}</p></DialogBody>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>{t('Cancel')}</DialogClose>
            <Button variant="destructive-solid" onClick={reset} disabled={pending}>{pending ? <Loader2 aria-hidden className="animate-spin" /> : null}{t('Reset')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

/* ----------------------------------------------------------------- delete */

function DeleteCard({ viewer }: { viewer: Viewer }) {
  const { t } = useT();
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  const onOpenChange = (o: boolean) => { setOpen(o); if (!o) { setPassword(''); setError(null); } };

  const confirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pending) return;
    if (!password) { setError('Enter your password to confirm.'); return; }
    setError(null);
    setPending(true);
    const { error: err } = await authClient.deleteUser({ password });
    if (err) {
      setPending(false);
      setPassword('');
      const ae = err as AuthError;
      setError(ae?.code === 'INVALID_PASSWORD' ? 'That password isn’t right. Try again.' : authErrorMessage(ae));
      return;
    }
    await authClient.signOut().catch(() => undefined);
    setOpen(false);
    toast(t('Your account was deleted.'));
    router.push('/');
    router.refresh();
  };

  return (
    <Card className="border-destructive-border" aria-labelledby="del-h">
      <SectionTitle id="del-h" icon={Trash2} className="flex items-center gap-2 text-destructive">{t('Delete account')}</SectionTitle>
      <p className="text-sm">
        {t('Permanently delete your personal account.')} {viewer.role === 'patient' ? t('Your hospital nutrition record is kept by the hospital nutrition team.') : t('Changes you made stay in patients’ audit logs under your display name.')}
      </p>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <Button variant="destructive" className="w-full sm:w-auto sm:self-start" onClick={() => setOpen(true)}><Trash2 aria-hidden />{t('Delete my account')}</Button>
        <DialogContent>
          <form onSubmit={confirm} noValidate className="flex min-h-0 flex-col">
            <DialogHeader>
              <DialogTitle>{t('Delete your account?')}</DialogTitle>
              <DialogDescription>{t('This deletes your personal account for good. You can’t undo it.')}</DialogDescription>
            </DialogHeader>
            <DialogBody>
              <Field id="del-pw" label={t('Enter your password to confirm')} error={error && t(error)}>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" maxLength={128} autoFocus />
              </Field>
            </DialogBody>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>{t('Cancel')}</DialogClose>
              <SubmitButton pending={pending} pendingLabel={t('Deleting…')} variant="destructive-solid">{t('Delete account')}</SubmitButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

/* ------------------------------------------------------------------- page */

export function SettingsView({ viewer, memberSince }: { viewer: Viewer; memberSince: string }) {
  const { t } = useT();
  const canReset = viewer.isDemo && viewer.permissions.includes('demo:reset');
  return (
    <>
      <PageHead eyebrow={t('Account Settings')} title={t('Account, privacy and your data')}>
        <p>{t('Update your details, keep your account safe and download your data.')}</p>
      </PageHead>
      <div className="container-page grid items-start gap-5 pb-16 lg:grid-cols-2 lg:gap-6">
        {/* Phones read top to bottom: details, password, meal profile, devices, data, then the destructive actions. */}
        <div className="flex min-w-0 flex-col gap-5 lg:gap-6">
          <AccountDetails viewer={viewer} memberSince={memberSince} />
          <PasswordCard viewer={viewer} />
          {viewer.role === 'patient' ? <LinkCard viewer={viewer} /> : null}
        </div>
        <div className="flex min-w-0 flex-col gap-5 lg:gap-6">
          <SessionsCard shared={viewer.isDemo} />
          <DataCard viewer={viewer} />
          {canReset ? <DemoResetCard /> : null}
          {viewer.isDemo
            ? <p className="text-sm text-muted-foreground">{t('Shared demo accounts cannot be deleted.')}</p>
            : <DeleteCard viewer={viewer} />}
        </div>
      </div>
    </>
  );
}
