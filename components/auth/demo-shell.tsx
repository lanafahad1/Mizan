'use client';
import type * as React from 'react';
import { useT } from '@/components/site/lang';
import { DemoAccountList, type DemoAccount } from './demo-accounts';

const DEMO_PASSWORD = 'Mizan#2026';
const HOSPITAL_ROLES = ['admin', 'staff', 'patient'];

/** Existing demo panels, kept separate from personal sign-in and registration. */
export function DemoShell({ accounts, next }: { accounts: DemoAccount[]; next: string | null }) {
  const { t } = useT();
  const members = accounts.filter((a) => a.role === 'member');
  const hospital = accounts.filter((a) => HOSPITAL_ROLES.includes(a.role));
  return (
    <div className="container-page pb-16 pt-6 sm:pt-10">
      <h1 className="text-3xl sm:text-4xl">{t('Try the demo')}</h1>
      <div className="mt-6 grid items-start gap-6 lg:grid-cols-2 lg:gap-8">
        <DemoPanel
          id="demo-member-h"
          title={t('Explore the demo member')}
          intro={<><strong className="font-semibold text-foreground">{t('Demonstration access:')}</strong> {t('this member and their records are fictional, and no identity is checked. Everyone using this demo account sees the same changes.')}</>}
          accounts={members}
          next={next}
        />
        <DemoPanel
          id="demo-hospital-h"
          title={t('Explore the demonstration hospital')}
          intro={<><strong className="font-semibold text-foreground">{t('Demonstration access:')}</strong> {t('every patient, healthcare provider and record is fictional, and no identity is checked. Each account shows what that role can see and do. Everyone using the same demo account sees the same changes.')}</>}
          accounts={hospital}
          next={next}
        />
      </div>
    </div>
  );
}

function DemoPanel({ id, title, intro, accounts, next }: { id: string; title: string; intro: React.ReactNode; accounts: DemoAccount[]; next: string | null }) {
  const { t } = useT();
  return (
    <section aria-labelledby={id} className="flex flex-col gap-4 rounded-xl border border-border bg-blush p-5 sm:p-6">
      <h2 id={id} className="text-xl sm:text-[1.4rem]">{title}</h2>
      <p className="text-muted-foreground">{intro}</p>
      <DemoAccountList accounts={accounts} password={DEMO_PASSWORD} next={next} />
      {accounts.length ? <p className="text-sm text-muted-foreground">
        {t('Or type in the demo username')} <code dir="ltr" className="rounded bg-card px-1.5 py-0.5 text-[.85em] text-heading">{accounts[0]?.username}</code> {t('and the shared password')} <code dir="ltr" className="rounded bg-card px-1.5 py-0.5 text-[.85em] text-heading">{DEMO_PASSWORD}</code>.
      </p> : null}
    </section>
  );
}
