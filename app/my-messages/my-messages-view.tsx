'use client';
import * as React from 'react';
import { PageHead, PageBody } from '@/components/site/page-head';
import { useT } from '@/components/site/lang';
import { Conversation, type Thread } from '@/components/care/conversation';
import { CareTeamCard } from '@/components/care/care-team';

/* eslint-disable @typescript-eslint/no-explicit-any */
export function MyMessagesView({ thread, team }: { thread: Thread; team: any }) {
  const { t } = useT();
  return (
    <>
      <PageHead eyebrow={t('Your care team')} title={t('Messages')} space="member">
        <p>{t('Write to your care team about your meals, your goals or how you feel. They usually reply during working hours.')}</p>
      </PageHead>
      <PageBody space="member">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:items-start">
          <Conversation who="me" side="patient" initial={thread} />
          <CareTeamCard initial={team} messages={false} />
        </div>
      </PageBody>
    </>
  );
}
