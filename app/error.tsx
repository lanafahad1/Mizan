'use client';
import { Notice } from '@/components/ui/notice';
import { Button } from '@/components/ui/button';
import { useT } from '@/components/site/lang';
import { Illustration } from '@/components/illustrations/illustration';

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { t } = useT();
  return (
    <div className="container-page flex flex-col gap-4 py-16">
      <Illustration name="error" className="mx-auto h-[127px] w-36 sm:h-[159px] sm:w-[180px]" />
      <Notice tone="danger" title={t('This page didn’t load.')}>{t('Something went wrong on our side. Your data is safe and hasn’t been changed.')}</Notice>
      <div><Button onClick={() => reset()}>{t('Try again')}</Button></div>
    </div>
  );
}
