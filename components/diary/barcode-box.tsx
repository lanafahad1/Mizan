'use client';
// Find a product by its barcode. Lookup order: Mizan's own food list
// (/api/foods/barcode/:code) → Open Food Facts through our server
// (/api/foods/online/:code) → the person adds it from the pack label.
// "Scan with camera" appears only where the browser has BarcodeDetector; no
// library is loaded, and the camera stream stops as soon as it is not needed.
import * as React from 'react';
import { Camera, CameraOff, FileText, Save, Search } from 'lucide-react';
import { apiFetch, apiSend, ApiError } from '@/lib/api-client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Notice } from '@/components/ui/notice';
import { toast } from '@/components/ui/toast';
import { ArabicName } from './source-badge';
import { useT } from '@/components/site/lang';
import { allergenNames, fmt, tMsg, type Food, type LabelDraft, type NutrientKey, type OnlineProduct } from './types';

type Detected = { rawValue: string; format: string };
type Detector = { detect: (source: CanvasImageSource) => Promise<Detected[]> };
type DetectorCtor = { new (opts?: { formats?: string[] }): Detector; getSupportedFormats?: () => Promise<string[]> };
const WANTED_FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e'];

function detectorCtor(): DetectorCtor | null {
  if (typeof window === 'undefined' || !('BarcodeDetector' in window)) return null;
  return (window as unknown as { BarcodeDetector: DetectorCtor }).BarcodeDetector;
}
const noop = () => () => {};
/** True in browsers that can read barcodes from the camera (false on the server). */
const useCanScan = () => React.useSyncExternalStore(noop, () => Boolean(detectorCtor() && navigator.mediaDevices?.getUserMedia), () => false);

const CODE_RE = /^\d{8,14}$/;
type State =
  | { kind: 'idle' }
  | { kind: 'looking'; code: string }
  | { kind: 'online'; product: OnlineProduct }
  | { kind: 'none'; code: string; unavailable: boolean };

const ROWS: { key: NutrientKey; label: string }[] = [
  { key: 'kcal', label: 'Energy' }, { key: 'protein', label: 'Protein' }, { key: 'carbs', label: 'Carbohydrate' }, { key: 'fat', label: 'Fat' },
  { key: 'sugar', label: 'Sugars' }, { key: 'satFat', label: 'Saturated fat' }, { key: 'sodium', label: 'Sodium' },
];
const UNIT: Partial<Record<NutrientKey, string>> = { kcal: 'kcal', sodium: 'mg' };

export function BarcodeBox({ onFood, onLabel }: { onFood: (food: Food) => void; onLabel: (draft: LabelDraft) => void }) {
  const { t, lang } = useT();
  const canScan = useCanScan();
  const [code, setCode] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [state, setState] = React.useState<State>({ kind: 'idle' });
  const [saving, setSaving] = React.useState(false);
  const [scanning, setScanning] = React.useState(false);
  const [camError, setCamError] = React.useState<string | null>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const streamRef = React.useRef<MediaStream | null>(null);

  const stopCamera = React.useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setScanning(false);
  }, []);
  // Always release the camera when this view goes away (dialog closed or another view).
  React.useEffect(() => () => { streamRef.current?.getTracks().forEach((t) => t.stop()); streamRef.current = null; }, []);

  const lookup = React.useCallback(async (raw: string) => {
    const c = raw.replace(/\s/g, '');
    setError(null);
    if (!CODE_RE.test(c)) { setError(t('Enter the 8 to 14 digits under the barcode.')); return; }
    setState({ kind: 'looking', code: c });
    try {
      const local = await apiFetch<Food | { ok: true } | null>(`/api/foods/barcode/${c}`);
      if (local && 'id' in local) { onFood(local); return; }
      const online = await apiFetch<{ found: boolean; product?: OnlineProduct; unavailable?: boolean }>(`/api/foods/online/${c}`);
      if (online.found && online.product) setState({ kind: 'online', product: online.product });
      else setState({ kind: 'none', code: c, unavailable: Boolean(online.unavailable) });
    } catch (err) {
      const ae = err as ApiError;
      setState({ kind: 'idle' });
      setError(tMsg(t, lang, ae.errors?.barcode ?? ae.message));
    }
  }, [onFood, t, lang]);

  // While the camera is on, look for a barcode a few times a second.
  React.useEffect(() => {
    if (!scanning) return;
    const Ctor = detectorCtor();
    const video = videoRef.current;
    if (!Ctor || !video || !streamRef.current) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    video.srcObject = streamRef.current;
    void video.play().catch(() => {});
    (async () => {
      const supported = (await Ctor.getSupportedFormats?.().catch(() => null)) ?? WANTED_FORMATS;
      const formats = WANTED_FORMATS.filter((f) => supported.includes(f));
      let detector: Detector;
      try { detector = new Ctor({ formats: formats.length ? formats : WANTED_FORMATS }); } catch { setCamError(t('This browser can’t read barcodes. Type the number instead.')); stopCamera(); return; }
      const tick = async () => {
        if (stopped) return;
        if (video.readyState >= 2) {
          try {
            const found = (await detector.detect(video)).find((d) => CODE_RE.test(d.rawValue));
            if (found && !stopped) { stopCamera(); setCode(found.rawValue); void lookup(found.rawValue); return; }
          } catch { /* try the next frame */ }
        }
        timer = setTimeout(tick, 250);
      };
      void tick();
    })();
    return () => { stopped = true; if (timer) clearTimeout(timer); };
  }, [scanning, lookup, stopCamera, t]);

  async function startCamera() {
    setCamError(null); setError(null); setState({ kind: 'idle' });
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
      setScanning(true);
    } catch (err) {
      const name = (err as DOMException)?.name;
      setCamError(t(name === 'NotAllowedError' || name === 'SecurityError'
        ? 'The camera is not allowed here. Type the number under the barcode instead.'
        : name === 'NotFoundError' ? 'No camera was found. Type the number under the barcode instead.'
          : 'The camera didn’t start. Type the number under the barcode instead.'));
    }
  }

  function draftFrom(p: OnlineProduct): LabelDraft {
    return { name: p.name, brand: p.brand ?? undefined, barcode: p.barcode, servingG: p.servingG, per100g: p.per100g, fromOnline: true };
  }

  async function saveOnline(p: OnlineProduct) {
    setSaving(true);
    try {
      const per100g = Object.fromEntries(Object.entries(p.per100g).filter(([, v]) => v != null));
      const food = await apiSend<Food & { warnings?: string[] }>('POST', '/api/health/me/foods', {
        name: p.name, brand: p.brand ?? undefined, barcode: p.barcode, servingG: p.servingG ?? undefined, per100g, origin: 'OFF',
      });
      for (const w of food.warnings ?? []) toast(tMsg(t, lang, w), { tone: 'warn', timeout: 9000 });
      toast(t('Saved {name} to your foods.', { name: lang === 'ar' && food.nameAr ? food.nameAr : food.name }));
      onFood(food);
    } catch (err) {
      const ae = err as ApiError;
      if (ae.status === 422) {
        toast(t('Some values are missing or look wrong. Check them against the pack label.'), { tone: 'warn' });
        onLabel(draftFrom(p));
      } else toast(tMsg(t, lang, ae.message), { tone: 'error' });
    } finally { setSaving(false); }
  }

  const looking = state.kind === 'looking';
  return (
    <div className="flex flex-col gap-4">
      <form noValidate className="flex flex-col gap-2" onSubmit={(e) => { e.preventDefault(); stopCamera(); void lookup(code); }}>
        <Field id="bc-code" label={t('Type the number under the barcode')} error={error} hint={t('8 to 14 digits')}>
          <Input value={code} onChange={(e) => setCode(e.target.value.replace(/[^\d\s]/g, ''))} inputMode="numeric" autoComplete="off" maxLength={18} placeholder={t('e.g. 6281007025168')} />
        </Field>
        <Button type="submit" disabled={looking} className="w-full sm:w-fit"><Search aria-hidden />{looking ? t('Looking…') : t('Find')}</Button>
      </form>

      {canScan ? (
        <div className="flex flex-col gap-2">
          {scanning ? (
            <>
              <div className="relative overflow-hidden rounded-[16px] border border-border bg-mint">
                <video ref={videoRef} muted playsInline aria-label={t('Camera preview')} className="aspect-[4/3] w-full object-cover" />
                <span aria-hidden className="pointer-events-none absolute inset-x-[12%] top-1/2 h-0.5 -translate-y-1/2 rounded bg-primary/70" />
              </div>
              <p role="status" className="text-sm text-muted-foreground">{t('Point the camera at the barcode and hold it steady.')}</p>
              <Button variant="outline" onClick={stopCamera} className="w-full sm:w-fit"><CameraOff aria-hidden />{t('Stop camera')}</Button>
            </>
          ) : (
            <Button variant="secondary" onClick={startCamera} disabled={looking} className="w-full sm:w-fit"><Camera aria-hidden />{t('Scan with camera')}</Button>
          )}
          {camError ? <Notice tone="warn">{camError}</Notice> : null}
        </div>
      ) : null}

      <div aria-live="polite" className="flex flex-col gap-3">
        {looking ? <p className="text-sm text-muted-foreground">{t('Looking up {code}…', { code: state.code })}</p> : null}

        {state.kind === 'online' ? <OnlineResult product={state.product} saving={saving} onSave={() => saveOnline(state.product)} onEdit={() => onLabel(draftFrom(state.product))} /> : null}

        {state.kind === 'none' ? (
          <Notice tone="info" title={state.unavailable ? t('We couldn’t reach Open Food Facts') : t('We couldn’t find this barcode')}>
            <p>{state.unavailable ? t('Try again later, or add the product from its pack label.') : t('{code} is not in our food list or on Open Food Facts. You can add it from the pack label.', { code: state.code })}</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => onLabel({ barcode: state.code })}><FileText aria-hidden />{t('Add it from the pack label')}</Button>
          </Notice>
        ) : null}
      </div>
    </div>
  );
}

function OnlineResult({ product: p, saving, onSave, onEdit }: { product: OnlineProduct; saving: boolean; onSave: () => void; onEdit: () => void }) {
  const { t, lang } = useT();
  const allergens = allergenNames(p.allergens).map((a) => t(a));
  return (
    <div className="flex flex-col gap-3 rounded-[16px] border border-border bg-card p-4">
      <div className="flex flex-col gap-1">
        <h3 className="text-base leading-snug">{lang === 'ar' && p.nameAr ? p.nameAr : p.name}</h3>
        <p className="flex flex-wrap gap-x-2 text-sm text-muted-foreground">
          {p.brand ? <span>{p.brand}</span> : null}
          {p.quantity ? <span>{p.quantity}</span> : null}
          {lang === 'ar' ? (p.nameAr && p.nameAr !== p.name ? <bdi dir="ltr" lang="en">{p.name}</bdi> : null) : p.nameAr && p.nameAr !== p.name ? <ArabicName>{p.nameAr}</ArabicName> : null}
        </p>
        <div><Badge variant="warn" className="whitespace-normal">{t('Pack label (Open Food Facts) — check the label')}</Badge></div>
      </div>
      <table className="w-full text-sm">
        <caption className="sr-only">{t('Values per 100 g from Open Food Facts')}</caption>
        <thead><tr><th scope="col" className="pb-1 text-start font-display font-medium text-heading">{t('Per 100 g')}</th><th scope="col" className="sr-only">{t('Amount')}</th></tr></thead>
        <tbody>
          {ROWS.map((r) => (
            <tr key={r.key} className="border-t border-border">
              <th scope="row" className="py-1 text-start font-normal text-muted-foreground">{t(r.label)}</th>
              <td className="py-1 text-end font-semibold tabular">{p.per100g[r.key] == null ? t('not reported') : `${fmt(p.per100g[r.key], r.key)} ${t(UNIT[r.key] ?? 'g')}`}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {p.servingG ? <p className="text-sm text-muted-foreground">{t('Serving on the pack: {serving}', { serving: p.servingLabel ?? `${p.servingG} ${t('g')}` })}</p> : null}
      {p.sodiumFromSalt ? <p className="text-sm text-muted-foreground">{t('Sodium is worked out from salt (salt ÷ 2.5).')}</p> : null}
      {allergens.length ? <p className="text-sm"><b className="font-semibold">{t('Allergens listed:')}</b> {allergens.join(lang === 'ar' ? '، ' : ', ')}</p> : null}
      <p className="text-xs text-muted-foreground">{t('Community data from Open Food Facts (ODbL). Nothing is saved until you choose to.')}</p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button onClick={onSave} disabled={saving}><Save aria-hidden />{saving ? t('Saving…') : t('Save to my foods & add')}</Button>
        <Button variant="outline" onClick={onEdit} disabled={saving}><FileText aria-hidden />{t('Check and edit first')}</Button>
      </div>
    </div>
  );
}
