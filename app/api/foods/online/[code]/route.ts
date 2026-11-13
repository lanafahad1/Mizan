// Online barcode fallback: when a barcode is not in Mizan's own food list,
// look the product up on Open Food Facts (community data, ODbL) from the server.
// Nothing is saved here: the browser shows the values and the person confirms
// "Save to my foods", which goes through POST /api/health/me/foods.
// Only the barcode digits are sent to Open Food Facts — never user data.
import { NextResponse, type NextRequest } from 'next/server';
import { actorFromHeaders } from '@/lib/server/session';

const HEADERS = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
const USER_AGENT = 'Mizan-student-project/1.0 (educational)';
const FIELDS = 'code,product_name,product_name_ar,brands,quantity,serving_size,serving_quantity,nutriments,allergens_tags';
const TIMEOUT_MS = 4000;

const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: HEADERS });
const fail = (status: number, code: string, message: string, errors?: Record<string, string>) =>
  json({ error: { code, message, ...(errors ? { errors } : {}) } }, status);

type Nutriments = Record<string, unknown>;
type OffProduct = {
  code?: string; product_name?: string; product_name_ar?: string; brands?: string; quantity?: string;
  serving_size?: string; serving_quantity?: number | string; nutriments?: Nutriments; allergens_tags?: string[];
};

/** A finite, non-negative number or null. */
function num(v: unknown): number | null {
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN;
  return Number.isFinite(n) && n >= 0 ? n : null;
}
const round = (v: number | null, d = 1) => (v == null ? null : Math.round(v * 10 ** d) / 10 ** d);
const text = (v: unknown, max: number) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null);

/** Map an Open Food Facts product to the same per-100 g shape as a pack label. */
function toLabel(code: string, p: OffProduct) {
  const n = p.nutriments ?? {};
  const kj = num(n['energy-kj_100g']) ?? num(n['energy_100g']);
  const kcal = num(n['energy-kcal_100g']) ?? (kj != null ? kj / 4.184 : null);
  const sodiumG = num(n['sodium_100g']);
  const saltG = num(n['salt_100g']);
  const sodium = sodiumG != null ? sodiumG * 1000 : saltG != null ? saltG * 400 : null;
  const servingG = num(p.serving_quantity);
  const name = text(p.product_name, 120) ?? text(p.product_name_ar, 120);
  return {
    name,
    nameAr: text(p.product_name_ar, 120),
    brand: text(p.brands?.split(',')[0], 80),
    barcode: code,
    quantity: text(p.quantity, 40),
    servingLabel: text(p.serving_size, 60),
    servingG: servingG && servingG <= 5000 ? round(servingG, 1) : null,
    per100g: {
      kcal: round(kcal, 0),
      protein: round(num(n['proteins_100g'])),
      carbs: round(num(n['carbohydrates_100g'])),
      fat: round(num(n['fat_100g'])),
      sugar: round(num(n['sugars_100g'])),
      satFat: round(num(n['saturated-fat_100g'])),
      fiber: round(num(n['fiber_100g'])),
      sodium: round(sodium, 0),
    },
    sodiumFromSalt: sodiumG == null && saltG != null,
    allergens: (p.allergens_tags ?? []).filter((t) => typeof t === 'string').map((t) => t.replace(/^[a-z]{2}:/, '')).slice(0, 20),
  };
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ code: string }> }) {
  const actor = await actorFromHeaders(req.headers);
  if (!actor) return fail(401, 'unauthenticated', 'Please log in to continue.');
  if (actor.status !== 'active') return fail(403, 'forbidden', 'Your account is not active yet.');

  const code = String((await ctx.params).code ?? '').replace(/\s/g, '');
  if (!/^\d{8,14}$/.test(code)) return fail(422, 'invalid', 'A barcode has 8 to 14 digits.', { barcode: 'Enter the 8 to 14 digits under the barcode.' });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const url = `https://world.openfoodfacts.org/api/v2/product/${code}.json?fields=${FIELDS}`;
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' }, signal: controller.signal, cache: 'no-store' });
    if (res.status === 404) return json({ found: false });
    if (!res.ok) return json({ found: false, unavailable: true });
    const data = (await res.json()) as { status?: number; product?: OffProduct };
    if (data.status !== 1 || !data.product) return json({ found: false });
    const product = toLabel(code, data.product);
    if (!product.name) return json({ found: false });
    return json({ found: true, product });
  } catch {
    // Timeout, network error or malformed JSON: tell the person to use the pack label.
    return json({ found: false, unavailable: true });
  } finally {
    clearTimeout(timer);
  }
}
