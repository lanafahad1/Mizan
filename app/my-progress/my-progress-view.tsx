'use client';
import * as React from 'react';
import { PageHead, PageBody } from '@/components/site/page-head';
import { useT } from '@/components/site/lang';
import { ProgressView, type Progress } from '@/components/care/progress';
import { CheckinCard } from '@/components/care/checkin';
import { PatientNotes } from '@/components/care/notes';
import { CareTeamCard } from '@/components/care/care-team';
import type { CareRef } from '@/components/care/common';

/* eslint-disable @typescript-eslint/no-explicit-any */
export function MyProgressView({ progress, careRef, team, notes }: { progress: Progress; careRef: CareRef; team?: any; notes?: any }) {
  const { t } = useT();
  const patient = progress.kind === 'patient';
  return (
    <>
      <PageHead eyebrow={patient ? t('Your progress with your care team') : t('Your progress')} title={t('My progress')} space="member">
        <p>{patient ? t('Your weight, your goals, how often you log your food and your weekly check-in, all in one place.') : t('Your weight, how often you log your food and your readings, in one place. It’s private: only you can see it.')}</p>
      </PageHead>
      <PageBody space="member">
        {patient && progress.checkins && !progress.checkins.thisWeek ? <CheckinCard initial={progress.checkins} /> : null}
        <ProgressView who="me" initial={progress} canEditGoals={!patient} careRef={careRef} />
        {patient ? (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start">
            <PatientNotes initial={notes} limit={3} />
            <CareTeamCard initial={team} />
          </div>
        ) : null}
        {patient && progress.checkins?.thisWeek ? <CheckinCard initial={progress.checkins} /> : null}
      </PageBody>
    </>
  );
}
