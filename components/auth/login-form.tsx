'use client';
import * as React from 'react';
import Link from 'next/link';
import { authClient, authErrorMessage } from '@/lib/auth-client';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/toast';
import { useT } from '@/components/site/lang';
import { ShowPassword, FormError, SubmitButton, focusFirstInvalid, type AuthError } from './form-bits';
import { useAfterSignIn } from './use-after-sign-in';

type Errors = Partial<Record<'identifier' | 'password', string>>;

function loginError(error: AuthError): string {
  // Never say which part was wrong (no account enumeration).
  if (error?.code === 'INVALID_EMAIL') return 'That username, email or password doesn’t match. Check them and try again.';
  return authErrorMessage(error);
}

const IDENTIFIER_HINT = {
  member: 'Hospital staff: use your separate member account here, not your work account.',
  hospital: 'Patients: use the account you made with your link code. Staff: use your approved staff account.',
} as const;

/** Username-or-email sign-in. `space` only changes the help text: the server sends every account to its own role's home. */
export function LoginForm({ next, space }: { next: string | null; space: 'member' | 'hospital' }) {
  const { t } = useT();
  const formRef = React.useRef<HTMLFormElement>(null);
  const [identifier, setIdentifier] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [show, setShow] = React.useState(false);
  const [errors, setErrors] = React.useState<Errors>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);
  const after = useAfterSignIn(next);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pending) return;
    setFormError(null);
    const id = identifier.trim();
    const errs: Errors = {};
    if (!id) errs.identifier = 'Enter your username or email.';
    if (!password) errs.password = 'Enter your password.';
    setErrors(errs);
    if (Object.keys(errs).length) { focusFirstInvalid(formRef.current); return; }

    setPending(true);
    const { data, error } = id.includes('@')
      ? await authClient.signIn.email({ email: id, password })
      : await authClient.signIn.username({ username: id, password });
    if (error || !data) {
      setPending(false);
      if (error?.status !== 429) setPassword('');
      setFormError(loginError(error));
      return;
    }
    const user = data.user as { name?: string; role?: string | null; status?: string | null };
    toast(user.name ? t('Welcome back, {name}.', { name: t(user.name) }) : t('Welcome back.'));
    after(user);
  };

  return (
    <form ref={formRef} onSubmit={submit} noValidate className="flex flex-col gap-4" aria-busy={pending || undefined}>
      <Field id="login-identifier" label={t('Username or email')} error={errors.identifier && t(errors.identifier)} hint={t(IDENTIFIER_HINT[space])}>
        <Input
          name="identifier" type="text" value={identifier} onChange={(e) => setIdentifier(e.target.value)}
          autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck={false} maxLength={120} required
        />
      </Field>
      <Field id="login-password" label={t('Password')} error={errors.password && t(errors.password)}>
        <Input
          name="password" type={show ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password" maxLength={128} required
        />
      </Field>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <ShowPassword id="login-show" checked={show} onChange={setShow} />
        <Link href="/forgot-password" className="inline-flex min-h-11 items-center text-sm">{t('Forgot password?')}</Link>
      </div>
      <FormError message={formError} />
      <SubmitButton pending={pending} pendingLabel={t('Logging in…')} size="lg" className="w-full">{t('Log in')}</SubmitButton>
    </form>
  );
}
