'use client';
import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft, Pencil, Plus, Trash2 } from 'lucide-react';
import { useApi, apiSend, ApiError } from '@/lib/api-client';
import { Button, buttonVariants } from '@/components/ui/button';
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Notice } from '@/components/ui/notice';
import { toast } from '@/components/ui/toast';
import { Illustration } from '@/components/illustrations/illustration';
import { useT } from '@/components/site/lang';
import { ArabicName, SourceBadge } from '@/components/diary/source-badge';
import { LabelFoodForm, draftFromFood } from '@/components/diary/label-food-form';
import { fmt, foodName, tMsg, type Food } from '@/components/diary/types';

const KEY = '/api/health/me/foods';

export function MyFoodsView({ initial }: { initial: Food[] }) {
  const { t, lang } = useT();
  const { data, error, mutate } = useApi<Food[]>(KEY, initial);
  const foods = data ?? [];
  const [form, setForm] = React.useState<{ mode: 'add' } | { mode: 'edit'; food: Food } | null>(null);
  const [confirm, setConfirm] = React.useState<Food | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  async function remove(food: Food) {
    setDeleting(true);
    try {
      await apiSend('DELETE', `${KEY}/${encodeURIComponent(food.id)}`);
      setConfirm(null);
      await mutate();
      toast(t('Deleted {name}.', { name: foodName(food, lang) }));
    } catch (err) {
      toast(tMsg(t, lang, (err as ApiError).message), { tone: 'error' });
    } finally { setDeleting(false); }
  }

  return (
    <>
      {foods.length ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Button onClick={() => setForm({ mode: 'add' })} className="w-full sm:w-fit"><Plus aria-hidden />{t('Add a food from its label')}</Button>
          <Link href="/today" className={buttonVariants({ variant: 'link', size: 'sm' })}><ArrowLeft aria-hidden className="rtl:-scale-x-100" />{t('Back to the food diary')}</Link>
        </div>
      ) : null}

      {error && !data ? <Notice tone="danger" title={t('We couldn’t load your foods')}>{tMsg(t, lang, (error as ApiError).message)}</Notice> : null}

      {foods.length ? (
        <ul aria-label={t('My foods')} className="flex flex-col gap-3">
          {foods.map((f) => {
            const kcal = f.per100g?.kcal;
            return (
              <li key={f.id} className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-soft sm:flex-row sm:items-center sm:gap-4">
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <h2 dir="auto" className={lang === 'ar' ? 'text-right text-base leading-snug' : 'text-left text-base leading-snug'}>{foodName(f, lang)}</h2>
                  <p className="flex flex-wrap gap-x-2 text-sm text-muted-foreground">
                    {f.brand ? <bdi dir="auto">{f.brand}</bdi> : null}
                    {lang === 'ar' ? (f.nameAr ? <bdi dir="ltr" lang="en">{f.name}</bdi> : null) : <ArabicName>{f.nameAr}</ArabicName>}
                    <span className="tabular">{kcal == null ? t('Energy not reported') : t('{n} kcal per 100 g', { n: fmt(kcal) })}</span>
                    {f.barcode ? <span className="tabular">{t('Barcode {code}', { code: f.barcode })}</span> : null}
                  </p>
                  <div><SourceBadge basis={f.basis} sourceId={f.sourceId} className="text-[.72rem]" /></div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button variant="outline" size="sm" className="min-h-11 flex-1 sm:min-h-9" onClick={() => setForm({ mode: 'edit', food: f })}>
                    <Pencil aria-hidden />{t('Edit')}<span className="sr-only"> {foodName(f, lang)}</span>
                  </Button>
                  <Button variant="destructive" size="sm" className="min-h-11 flex-1 sm:min-h-9" onClick={() => setConfirm(f)}>
                    <Trash2 aria-hidden />{t('Delete')}<span className="sr-only"> {foodName(f, lang)}</span>
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      ) : !error ? (
        <div className="flex flex-col items-center gap-3 rounded-[20px] border border-dashed border-input bg-card/70 px-6 py-10 text-center">
          <Illustration name="shelf-my-foods" className="size-28" />
          <h2 className="text-lg">{t('No foods of your own yet')}</h2>
          <p className="max-w-md text-muted-foreground">{t('Can’t find a product? Add it from its pack label and it stays here, ready for next time.')}</p>
          <Button onClick={() => setForm({ mode: 'add' })}><Plus aria-hidden />{t('Add a food from its label')}</Button>
        </div>
      ) : null}

      <p className="text-xs leading-snug text-muted-foreground">{t('Values you copy from a pack are your own entry; values from Open Food Facts are community data. Check them against the label.')}</p>

      <Dialog open={form != null} onOpenChange={(o) => { if (!o) setForm(null); }}>
        <DialogContent className="max-sm:h-dvh max-sm:max-h-dvh max-sm:rounded-none max-sm:border-0">
          <DialogHeader>
            <DialogTitle>{form?.mode === 'edit' ? t('Edit {name}', { name: foodName(form.food, lang) }) : t('Add a food from its label')}</DialogTitle>
            <DialogDescription>{t('Values from the nutrition table on the pack.')}</DialogDescription>
          </DialogHeader>
          <DialogBody className="flex-1">
            {form ? (
              <LabelFoodForm key={form.mode === 'edit' ? form.food.id : 'new'}
                editId={form.mode === 'edit' ? form.food.id : undefined}
                draft={form.mode === 'edit' ? draftFromFood(form.food) : null}
                onSaved={() => { setForm(null); void mutate(); }} />
            ) : null}
          </DialogBody>
        </DialogContent>
      </Dialog>

      <Dialog open={confirm != null} onOpenChange={(o) => { if (!o && !deleting) setConfirm(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('Delete {name}?', { name: confirm ? foodName(confirm, lang) : '' })}</DialogTitle>
            <DialogDescription>{t('It’s removed from your foods and favourites. Anything you already logged stays in your diary.')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose disabled={deleting} className={buttonVariants({ variant: 'outline' })}>{t('Cancel')}</DialogClose>
            <Button variant="destructive-solid" disabled={deleting} onClick={() => confirm && remove(confirm)}>
              <Trash2 aria-hidden />{deleting ? t('Deleting…') : t('Delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
