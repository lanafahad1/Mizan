'use client';
// A healthcare provider's profile as patients see it: display name (the account
// name), specialty and a short bio (up to 160 characters). The provider edits it in
// Account settings; an admin can edit anyone's from Provider access.
import * as React from 'react';
import { Stethoscope } from 'lucide-react';
import { useSWRConfig } from 'swr';
import { useApi, apiSend, ApiError } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { NativeSelect, Textarea } from '@/components/ui/input';
import { toast } from '@/components/ui/toast';
import { Modal } from '@/components/patients/common';
import { useT } from '@/components/site/lang';
import { CharCount, Initials, type CareRef, type Provider } from './common';

function ProfileForm({ userId, id, onSaved }: { userId: string; id: string; onSaved?: () => void }) {
  const { t } = useT();
  const { mutate } = useSWRConfig();
  const { data: ref } = useApi<CareRef>('/api/care/reference');
  const key = `/api/providers/${encodeURIComponent(userId)}`;
  const { data: profile } = useApi<Provider>(key);
  const [specialty, setSpecialty] = React.useState('');
  const [bio, setBio] = React.useState('');
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [busy, setBusy] = React.useState(false);
  const loaded = React.useRef(false);
  React.useEffect(() => {
    if (profile && !loaded.current) { loaded.current = true; setSpecialty(profile.specialty ?? ''); setBio(profile.bio ?? ''); }
  }, [profile]);
  const max = ref?.bioMax ?? 160;
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErrors({});
    try {
      await apiSend('PATCH', key, { specialty: specialty || null, bio });
      toast(t('Profile saved. Patients on your care teams see it.'));
      void mutate((k) => typeof k === 'string' && (k.startsWith('/api/providers') || k.startsWith('/api/care/')));
      onSaved?.();
    } catch (err) { if (err instanceof ApiError) { setErrors(err.errors ?? {}); if (!Object.keys(err.errors ?? {}).length) toast(t(err.message), { tone: 'error' }); } }
    finally { setBusy(false); }
  };
  return (
    <form id={id} onSubmit={save} noValidate className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Initials name={profile?.name ?? ''} />
        <div className="flex min-w-0 flex-col leading-tight"><b className="text-heading"><bdi>{profile?.name ?? '…'}</bdi></b><span className="text-sm text-muted-foreground">{profile ? t(profile.roleLabel) : ''}</span></div>
      </div>
      <Field id={`${id}-sp`} label={t('Specialty')} error={errors.specialty}>
        <NativeSelect value={specialty} onChange={(e) => setSpecialty(e.target.value)}>
          <option value="">{t('Not set')}</option>
          {(ref?.specialties ?? []).map((s) => <option key={s.id} value={s.id}>{t(s.label)}</option>)}
        </NativeSelect>
      </Field>
      <Field id={`${id}-bio`} label={t('Short bio')} error={errors.bio} hint={<CharCount value={bio} max={max} />} optional>
        <Textarea rows={3} maxLength={max} value={bio} onChange={(e) => setBio(e.target.value)} placeholder={t('For example: Clinical dietitian. I help with portions and diabetes-friendly meals.')} />
      </Field>
      {onSaved ? null : <Button type="submit" disabled={busy} className="self-start">{busy ? t('Saving…') : t('Save profile')}</Button>}
    </form>
  );
}

/** Account settings: the signed-in provider's own profile. */
export function ProviderProfileCard() {
  const { t } = useT();
  return (
    <Card aria-labelledby="pp-h">
      <CardTitle id="pp-h" className="flex items-center gap-2"><Stethoscope aria-hidden className="size-5 shrink-0" />{t('Your healthcare provider profile')}</CardTitle>
      <CardDescription>{t('Patients on your care teams see your display name, specialty and bio next to your notes and messages. Change your display name under Account details.')}</CardDescription>
      <ProfileForm userId="me" id="pp-form" />
    </Card>
  );
}

/** Provider access (admins): edit someone else's profile. */
export function ProviderProfileDialog({ userId, name, open, onClose }: { userId: string; name: string; open: boolean; onClose: () => void }) {
  const { t } = useT();
  return (
    <Modal open={open} onClose={onClose} title={t('Profile: {name}', { name })} description={t('Patients see the specialty and bio on their care team.')}
      footer={<><Button variant="outline" onClick={onClose}>{t('Cancel')}</Button><Button type="submit" form="ppd-form">{t('Save profile')}</Button></>}>
      {open ? <ProfileForm userId={userId} id="ppd-form" onSaved={onClose} /> : null}
    </Modal>
  );
}
