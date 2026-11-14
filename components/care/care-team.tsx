'use client';
// "Your care team" for patients (names, specialties and short bios), and the care
// team line on the provider's patient page, where an admin adds or removes people.
import * as React from 'react';
import Link from 'next/link';
import { Users, UserPlus, X } from 'lucide-react';
import { useApi, apiSend, ApiError } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { NativeSelect, Label } from '@/components/ui/input';
import { toast } from '@/components/ui/toast';
import { Modal } from '@/components/patients/common';
import { cn } from '@/lib/utils';
import { useT } from '@/components/site/lang';
import { C, Initials, ProviderLine, useCareRefresh, type Provider } from './common';

type Team = { patientId: string; team: Provider[] };

export function CareTeamCard({ initial, className, messages = true }: { initial?: Team; className?: string; messages?: boolean }) {
  const { t } = useT();
  const { data } = useApi<Team>(C('me', '/team'), initial);
  const team = data?.team ?? [];
  return (
    <Card className={className} aria-labelledby="ct-h">
      <CardHeader><div className="flex items-center gap-2"><Users aria-hidden className="size-5 text-primary" /><CardTitle id="ct-h">{t('Your care team')}</CardTitle></div></CardHeader>
      {team.length ? (
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {team.map((p) => (
            <li key={p.id ?? p.name} className="flex items-start gap-3">
              <Initials name={p.name} />
              <div className="flex min-w-0 flex-col leading-snug">
                <b className="font-semibold text-heading"><bdi>{t(p.name)}</bdi></b>
                <span className="text-sm text-muted-foreground">{t(p.specialtyLabel ?? p.roleLabel)}</span>
                {p.bio ? <span dir="auto" className="mt-0.5 text-sm">{p.bio}</span> : null}
              </div>
            </li>
          ))}
        </ul>
      ) : <CardDescription>{t('Your hospital will add the people who look after you here.')}</CardDescription>}
      {messages ? <Link href="/my-messages" className="self-start text-sm font-semibold">{t('Message your care team')}</Link> : null}
    </Card>
  );
}

/** The provider's patient page: who follows this patient; admins can change it. */
export function CareTeamLine({ who, canManage, initial }: { who: string; canManage: boolean; initial?: Team }) {
  const { t } = useT();
  const { data } = useApi<Team>(C(who, '/team'), initial);
  const [open, setOpen] = React.useState(false);
  const team = data?.team ?? [];
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
      <Users aria-hidden className="size-4 text-muted-foreground" />
      <span className="font-semibold text-heading">{t('Care team:')}</span>
      {team.length ? team.map((p, i) => <span key={p.id}><ProviderLine p={p} />{i < team.length - 1 ? <span aria-hidden className="text-muted-foreground">{t(', ')}</span> : null}</span>) : <span className="text-muted-foreground">{t('No one assigned yet')}</span>}
      {canManage ? <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>{t('Manage')}</Button> : null}
      {canManage ? <ManageTeam who={who} open={open} onClose={() => setOpen(false)} team={team} /> : null}
    </div>
  );
}

function ManageTeam({ who, open, onClose, team }: { who: string; open: boolean; onClose: () => void; team: Provider[] }) {
  const { t } = useT();
  const refresh = useCareRefresh(who);
  const { data: providers } = useApi<Provider[]>(open ? '/api/providers' : null);
  const [pick, setPick] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const choices = (providers ?? []).filter((p) => !team.some((m) => m.id === p.id));
  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pick) return;
    setBusy(true);
    try { await apiSend('POST', C(who, '/team'), { userId: pick }); setPick(''); toast(t('Added to the care team.')); void refresh(); }
    catch (err) { toast(t((err as ApiError).message), { tone: 'error' }); }
    finally { setBusy(false); }
  };
  const remove = async (p: Provider) => {
    setBusy(true);
    try { await apiSend('DELETE', C(who, `/team/${encodeURIComponent(p.id ?? '')}`)); toast(t('Removed from the care team.')); void refresh(); }
    catch (err) { toast(t((err as ApiError).message), { tone: 'error' }); }
    finally { setBusy(false); }
  };
  return (
    <Modal open={open} onClose={onClose} title={t('Care team')} description={t('The patient sees these names and specialties. Any healthcare provider can still read and reply to messages.')}
      footer={<Button variant="outline" onClick={onClose}>{t('Done')}</Button>}>
      <div className="flex flex-col gap-4">
        {team.length ? (
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {team.map((p) => (
              <li key={p.id} className="flex items-center gap-3 rounded-[14px] border border-border px-3 py-2">
                <Initials name={p.name} className="size-9" />
                <ProviderLine p={p} className="min-w-0 flex-1" />
                <Button size="icon" variant="ghost" disabled={busy} onClick={() => void remove(p)} aria-label={t('Remove {name} from the care team', { name: p.name })}><X aria-hidden /></Button>
              </li>
            ))}
          </ul>
        ) : <p className="m-0 text-sm text-muted-foreground">{t('No one assigned yet')}</p>}
        <form onSubmit={add} className={cn('flex flex-col gap-2')}>
          <Label htmlFor="ct-add">{t('Add a healthcare provider')}</Label>
          <div className="flex gap-2">
            <NativeSelect id="ct-add" value={pick} onChange={(e) => setPick(e.target.value)} className="min-w-0 flex-1">
              <option value="">{choices.length ? t('Choose…') : t('Everyone is already on the team')}</option>
              {choices.map((p) => <option key={p.id} value={p.id}>{p.name}{p.specialtyLabel ? ` · ${t(p.specialtyLabel)}` : ` · ${t(p.roleLabel)}`}</option>)}
            </NativeSelect>
            <Button type="submit" disabled={busy || !pick}><UserPlus aria-hidden />{t('Add')}</Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
