// Spot illustrations in Mizan's "Tiny world" style: little objects seen at a
// 3/4 angle, with one fine even indigo outline, soft frame colours from the
// palette (lavender, sky, cream, white), food in its real colours and a few
// happy details (4-point sparkles, a small cloud, little flowers, a heart).
// Plain SVG strings (no ids, no external references), safe for server and
// client. Drawn on a 120 × 106 canvas; most show at 44–64 px, so the outline is
// a little heavier than in the big meal pictures and the details are few.

export const ILLUSTRATIONS = [
  // add-food shelves
  'shelf-recent', 'shelf-saudi', 'shelf-groups', 'shelf-ingredients', 'shelf-supermarket', 'shelf-my-foods', 'shelf-barcode', 'shelf-quick',
  // MOH food groups
  'group-starch', 'group-protein', 'group-vegetables', 'group-fruit', 'group-milk', 'group-fat',
  // quick actions and trackers
  'log-food', 'water', 'steps', 'activity', 'weight', 'calculator', 'plan', 'health', 'hospital', 'ideas', 'shopping', 'readings', 'assessment',
  // empty states
  'empty-diary', 'empty-readings', 'empty-requests', 'empty-search', 'empty-generic',
  // pages
  'welcome', 'login', 'not-found', 'error', 'forbidden',
] as const;
export type IllustrationName = (typeof ILLUSTRATIONS)[number];

// ---------------------------------------------------------------- palette
const O = '#2E2A86'; // the one outline colour (ink)
const W = '#FFFFFF';
const CR = '#FBF8F3'; // cream
const MU = '#F3EFE8'; // muted cream
const LV = '#EEEDFA'; // lavender
const LV2 = '#DCD9F7'; // lavender rim
const LV3 = '#C9C4F2'; // lavender side
const SK = '#E3F1FA'; // sky (ground)
const SK2 = '#BFE3F7'; // deeper sky
const IN = '#3730A3'; // primary indigo
const VI = '#8B7CF6'; // violet
const GO = '#E0A23B'; // gold
// food, in real colours
const F = {
  green: '#6CC07A', greenD: '#3E9B57', leafL: '#B9E08E', leafD: '#5E9E3F',
  red: '#E2513E', redHi: '#F08A73', apple: '#D93B33', appleHi: '#F07A6E',
  water: '#6EC3EE', waterTop: '#A9DDF6', lemon: '#F6D35B', lemonD: '#E6B52E',
  rice: '#F7EEDB', riceD: '#E4D3AE', gold: '#F2C27A', goldD: '#E8A452', grain: '#FFF3D6',
  roast: '#C97A34', roastL: '#E9A85E', roastD: '#93521F', bone: '#FBF3E4',
  bread: '#E8B567', breadL: '#F6D9A0', breadD: '#B9782F', date: '#7A3E2E', dateHi: '#A0574A',
  carrot: '#F08A3C', carrotL: '#F8B57A', milk: '#FFFFFF', cheese: '#F6D776', cheeseD: '#E3B93E',
  olive: '#7E9A3A', oliveD: '#5E7A28', almond: '#C98A55', avocado: '#B9D97A', pit: '#9A6234',
  egg: '#FFFFFF', yolk: '#F6B93B', fish: '#F4A688', fishL: '#FCDACB', banana: '#F6D35B',
};

const n = (v: number) => Math.round(v * 10) / 10;

// ---------------------------------------------------------------- happy details
/** 4-point sparkle centred on (x, y). */
const spark = (x: number, y: number, s: number, c = GO) =>
  `<path d="M${x} ${n(y - s)}l${n(s * .3)} ${n(s * .7)} ${n(s * .7)} ${n(s * .3)} ${n(-s * .7)} ${n(s * .3)} ${n(-s * .3)} ${n(s * .7)} ${n(-s * .3)} ${n(-s * .7)} ${n(-s * .7)} ${n(-s * .3)} ${n(s * .7)} ${n(-s * .3)}z" fill="${c}"/>`;
/** Little cloud; (x, y) is its top-left area, s its size. */
const cloud = (x: number, y: number, s: number) =>
  `<path transform="translate(${x} ${y}) scale(${s})" d="M0 12c-6 0-8-8-2-10c0-7 9-9 12-4c3-6 13-5 13 2c6 0 8 8 2 12z" fill="${W}" stroke="${O}" stroke-width="${n(2.2 / s)}" stroke-linejoin="round"/>`;
/** White five-petal flower with a gold centre. */
const flower = (x: number, y: number, r = 2.5) => {
  let o = '';
  for (let i = 0; i < 5; i++) { const a = (-90 + i * 72) * Math.PI / 180; o += `<circle cx="${n(x + Math.cos(a) * r * 1.15)}" cy="${n(y + Math.sin(a) * r * 1.15)}" r="${r}" fill="${W}" stroke="${O}" stroke-width="1.3"/>`; }
  return `${o}<circle cx="${x}" cy="${y}" r="${n(r * .68)}" fill="${GO}" stroke="${O}" stroke-width="1"/>`;
};
/** Small violet heart centred on (x, y). */
const heart = (x: number, y: number, s = 1) =>
  `<path transform="translate(${x} ${y}) scale(${s})" d="M0 5.5c-5.5-3.6-7.6-6.6-7.6-9.4a3.9 3.9 0 0 1 7.6-1.2a3.9 3.9 0 0 1 7.6 1.2c0 2.8-2.1 5.8-7.6 9.4z" fill="${VI}" stroke="${O}" stroke-width="${n(1.7 / s)}" stroke-linejoin="round"/>`
  + `<path transform="translate(${x} ${y}) scale(${s})" d="M-5 -3.6a2 2 0 0 1 2.2-1.8" stroke="${W}" stroke-width="${n(1.3 / s)}" stroke-linecap="round" fill="none"/>`;

type Spark = [number, number, number, string?];
type Deco = {
  g?: [number, number, number, number] | null; // ground ellipse cx, cy, rx, ry
  gc?: string; // ground colour
  s?: Spark[]; c?: [number, number, number][]; fl?: [number, number, number?][]; h?: [number, number, number?];
};
function frame(body: string, d: Deco = {}) {
  const g = d.g === undefined ? [60, 88, 46, 12] : d.g;
  return `<svg viewBox="0 0 120 106" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">`
    + (g ? `<ellipse cx="${g[0]}" cy="${g[1]}" rx="${g[2]}" ry="${g[3]}" fill="${d.gc ?? SK}"/>` : '')
    + (d.c ?? []).map(([x, y, s]) => cloud(x, y, s)).join('')
    + (d.s ?? []).map(([x, y, s, c]) => spark(x, y, s, c)).join('')
    + `<g fill="none" stroke="${O}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">${body}</g>`
    + (d.fl ?? []).map(([x, y, r]) => flower(x, y, r)).join('')
    + (d.h ? heart(d.h[0], d.h[1], d.h[2]) : '')
    + '</svg>';
}

// ---------------------------------------------------------------- parts
const hi = (x: number, y: number, rx: number, ry = rx, c = W) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${c}" stroke="none"/>`;
/** A round slab seen at 3/4: top ellipse over a side of depth `d`. */
const disc = (cx: number, cy: number, rx: number, ry: number, d: number, top: string, side: string, sw?: number) =>
  `<path d="M${n(cx - rx)} ${cy}v${d}a${rx} ${ry} 0 0 0 ${n(rx * 2)} 0v${-d}" fill="${side}"${sw ? ` stroke-width="${sw}"` : ''}/>`
  + `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${top}"${sw ? ` stroke-width="${sw}"` : ''}/>`;
/** White plate with a lavender side and a cream well. */
const plate = (cx: number, cy: number, rx: number, ry: number, well = CR) =>
  disc(cx, cy, rx, ry, 4, W, LV2) + `<ellipse cx="${cx}" cy="${n(cy - .4)}" rx="${n(rx * .74)}" ry="${n(ry * .72)}" fill="${well}" stroke-width="1.8"/>`;
/** Bowl at 3/4: rim ellipse centred on (cx, cy), body `depth` deep, filled with `food`. */
const bowl = (cx: number, cy: number, rx: number, ry: number, depth: number, food: string, body = LV2) =>
  `<ellipse cx="${cx}" cy="${n(cy + depth - 1)}" rx="${n(rx * .42)}" ry="${n(ry * .5)}" fill="${LV3}" stroke-width="2.2"/>`
  + `<path d="M${n(cx - rx)} ${cy}a${rx} ${depth} 0 0 0 ${n(rx * 2)} 0z" fill="${body}"/>`
  + `<path d="M${n(cx - rx * .72)} ${n(cy + depth * .4)}a${n(rx * .8)} ${n(depth * .6)} 0 0 0 ${n(rx * .38)} ${n(depth * .38)}" stroke="${W}" stroke-width="2"/>`
  + `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${W}"/>`
  + `<ellipse cx="${cx}" cy="${n(cy + .6)}" rx="${n(rx - 4)}" ry="${n(ry - 2.6)}" fill="${food}" stroke-width="1.8"/>`;
/** Round 3D badge (a coin) with a glyph. */
type Glyph = 'heart' | 'check' | 'plus' | 'leaf' | 'drop' | 'clock' | 'bolt' | 'question';
const GLYPH: Record<Glyph, string> = {
  heart: `<path d="M0 5.6C-6.6 1.6-7.2-4.4-3.5-5.3C-1.6-5.7-.4-4.5 0-3C.4-4.5 1.6-5.7 3.5-5.3C7.2-4.4 6.6 1.6 0 5.6Z" fill="${VI}" stroke-width="2"/>`,
  check: `<path d="M-5.2.6L-1.6 4.2L5.4-3.4" stroke-width="3"/>`,
  plus: `<path d="M0-5.6V5.6M-5.6 0H5.6" stroke="${W}" stroke-width="3.2"/>`,
  leaf: `<path d="M-5.6 5.4C-5.8-2.8-.8-6 6-6C6.2 1-1.4 5.6-5.6 5.4Z" fill="${F.green}" stroke-width="2"/><path d="M-5.6 5.4L1.2-1.2" stroke="${F.greenD}" stroke-width="1.8"/>`,
  drop: `<path d="M0-7C3.4-2.6 5.4 0 5.4 2.6A5.4 5.4 0 0 1-5.4 2.6C-5.4 0-3.4-2.6 0-7Z" fill="${F.water}" stroke-width="2"/><circle cx="-1.8" cy="2.4" r="1.2" fill="${W}" stroke="none"/>`,
  clock: `<path d="M0-6.4V0L4.4 2.6" stroke-width="2.6"/><circle r="1.4" fill="${O}" stroke="none"/>`,
  bolt: `<path d="M1.6-7.6L-4.6 1H0L-1.6 7.6L4.6-1H0Z" fill="${GO}" stroke-width="2"/>`,
  question: `<path d="M-3.6-3A3.8 3.8 0 1 1 1.2.4C.2 1 0 1.8 0 3" stroke-width="2.8"/><circle cy="6.8" r="1.5" fill="${O}" stroke="none"/>`,
};
const badge = (x: number, y: number, r: number, fill: string, glyph: Glyph) =>
  `<circle cx="${n(x + r * .12)}" cy="${n(y + r * .2)}" r="${r}" fill="${LV3}" stroke-width="2.2"/><circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke-width="2.2"/>`
  + `<g transform="translate(${x} ${y}) scale(${n(r / 12)})" stroke-width="2.4">${GLYPH[glyph]}</g>`;

const tomato = (x: number, y: number, r: number) =>
  `<circle cx="${x}" cy="${y}" r="${r}" fill="${F.red}" stroke-width="2"/>${hi(n(x - r * .34), n(y - r * .34), n(r * .28))}`;
/** A green leaf from (x, y) along `rot` degrees, with a vein. */
const leaf = (x: number, y: number, len: number, rot: number, fill = F.green) =>
  `<g transform="translate(${x} ${y}) rotate(${rot})"><path d="M0 0C${n(len * .3)} ${n(-len * .38)} ${n(len * .74)} ${n(-len * .36)} ${len} 0C${n(len * .7)} ${n(len * .36)} ${n(len * .3)} ${n(len * .34)} 0 0Z" fill="${fill}" stroke-width="2"/><path d="M${n(len * .14)} 0H${n(len * .7)}" stroke="${F.greenD}" stroke-width="1.5"/></g>`;
/** Cucumber slice lying flat. */
const cuke = (x: number, y: number, r: number) => disc(x, y, r, n(r * .46), n(r * .34), F.leafL, F.leafD, 1.8)
  + `<ellipse cx="${x}" cy="${y}" rx="${n(r * .5)}" ry="${n(r * .22)}" fill="#DDEFC0" stroke="none"/>`;
const apple = (x: number, y: number, r: number) =>
  `<path d="M${x} ${n(y - r * .78)}C${n(x - r * .5)} ${n(y - r * 1.1)} ${n(x - r * 1.1)} ${n(y - r * .8)} ${n(x - r * 1.02)} ${n(y + r * .02)}C${n(x - r * .96)} ${n(y + r * .8)} ${n(x - r * .4)} ${n(y + r * 1.06)} ${x} ${n(y + r * .86)}C${n(x + r * .4)} ${n(y + r * 1.06)} ${n(x + r * .96)} ${n(y + r * .8)} ${n(x + r * 1.02)} ${n(y + r * .02)}C${n(x + r * 1.1)} ${n(y - r * .8)} ${n(x + r * .5)} ${n(y - r * 1.1)} ${x} ${n(y - r * .78)}Z" fill="${F.apple}" stroke-width="2.2"/>`
  + hi(n(x - r * .5), n(y - r * .1), n(r * .18), n(r * .3), F.appleHi)
  + `<path d="M${x} ${n(y - r * .74)}q${n(r * .06)} ${n(-r * .4)} ${n(r * .3)} ${n(-r * .54)}" stroke="#7A4E2A" stroke-width="2"/>`
  + `<path d="M${n(x + r * .22)} ${n(y - r * 1.06)}c${n(r * .3)} ${n(-r * .42)} ${n(r * .82)} ${n(-r * .4)} ${n(r * .92)} ${n(-r * .12)}c${n(-r * .3)} ${n(r * .36)} ${n(-r * .7)} ${n(r * .36)} ${n(-r * .92)} ${n(r * .12)}z" fill="${F.greenD}" stroke-width="1.6"/>`;
const date = (x: number, y: number, rot: number, s = 1) =>
  `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})"><ellipse rx="7" ry="4" fill="${F.date}" stroke-width="${n(1.8 / s)}"/><path d="M-3.4-1.2q2.6-1.4 5.4-.4" stroke="${F.dateHi}" stroke-width="${n(1.3 / s)}"/>${hi(-3.6, -1.8, 1.5, .7, '#B86A5A')}</g>`;
const egg = (x: number, y: number, r: number) =>
  `<path d="M${x} ${n(y - r * 1.25)}C${n(x + r * .9)} ${n(y - r * 1.25)} ${n(x + r)} ${n(y + r)} ${x} ${n(y + r)}C${n(x - r)} ${n(y + r)} ${n(x - r * .9)} ${n(y - r * 1.25)} ${x} ${n(y - r * 1.25)}Z" fill="${F.egg}" stroke-width="2.2"/>${hi(n(x - r * .36), n(y - r * .4), n(r * .16), n(r * .3), '#F1ECE4')}`;
/** Roasted drumstick, meat at (x, y), bone to the right. */
const drumstick = (x: number, y: number, s = 1, rot = -20) =>
  `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})">`
  + `<path d="M8 0H22" stroke-width="${n(7.4 / s)}"/><path d="M8 0H22" stroke="${F.bone}" stroke-width="${n(3.4 / s)}"/>`
  + `<circle cx="23.6" cy="-2.8" r="3.2" fill="${F.bone}" stroke-width="${n(1.8 / s)}"/><circle cx="23.6" cy="2.8" r="3.2" fill="${F.bone}" stroke-width="${n(1.8 / s)}"/>`
  + `<path d="M10 0C4-4-2-10-11-10C-18-10-22-5-22 0C-22 5-18 10-11 10C-2 10 4 4 10 0Z" fill="${F.roast}" stroke-width="${n(2.4 / s)}"/>`
  + `<path d="M-17-3.4A8 7 0 0 1-9-7" stroke="${F.roastL}" stroke-width="${n(3 / s)}"/><path d="M-12 1l8 1.6M-14 5l7 1.2" stroke="${F.roastD}" stroke-width="${n(1.6 / s)}"/>`
  + `${hi(-14, -5.6, 1.4, .9)}</g>`;

/** One roasted half chicken (as on kabsa), drawn round (150, 118) and placed at (x, y) scaled by k. */
const halfChicken = (x: number, y: number, k: number) => {
  const w = (v: number) => n(v / k);
  return `<g transform="translate(${x} ${y}) scale(${k}) translate(-150 -118)">`
    + `<path d="M112 122c-6-20 12-36 38-35c22 1 38 13 38 29c0 12-12 20-38 22c-22 2-36-5-38-16z" fill="${F.roast}" stroke-width="${w(2.2)}"/>`
    + `<path d="M122 104c8-8 22-10 34-6c10 3 18 9 20 16" stroke="${F.roastL}" stroke-width="${w(3)}" opacity=".9"/>`
    + `<path d="M128 100c6-3 12-4 18-3" stroke="${W}" stroke-width="${w(1.6)}" opacity=".8"/>`
    + `<path d="M114 118c-8-2-14 2-14 8c6 4 14 4 20 0" fill="#B5652A" stroke-width="${w(2)}"/>`
    + `<path d="M166 118c12-4 24 2 26 12c2 9-6 15-16 14c-8-1-14-6-14-13c0-5 1-10 4-13z" fill="${F.roast}" stroke-width="${w(2.2)}"/>`
    + `<path d="M184 140l12 8" stroke-width="${w(5.4)}"/><path d="M184 140l12 8" stroke="${F.bone}" stroke-width="${w(2.4)}"/>`
    + `<circle cx="198" cy="146" r="4.4" fill="${F.bone}" stroke-width="${w(1.6)}"/><circle cx="195" cy="152" r="4.4" fill="${F.bone}" stroke-width="${w(1.6)}"/>`
    + `<g fill="${F.roastD}" stroke="none"><circle cx="138" cy="114" r="2.4"/><circle cx="156" cy="120" r="2.4"/><circle cx="166" cy="108" r="2.2"/><circle cx="176" cy="130" r="2.2"/></g></g>`;
};

/** Rice mound on a platter: golden dome with a few grains. */
const riceMound = (cx: number, top: number, w: number, base: number, fill = F.gold, line = F.goldD) => {
  const l = n(cx - w); const r = n(cx + w); const h = base - top;
  return `<path d="M${l} ${base}C${n(l + w * .06)} ${n(top + h * .2)} ${n(cx - w * .55)} ${top} ${cx} ${top}C${n(cx + w * .55)} ${top} ${n(r - w * .06)} ${n(top + h * .2)} ${r} ${base}C${n(cx + w * .6)} ${n(base + w * .22)} ${n(cx - w * .6)} ${n(base + w * .22)} ${l} ${base}Z" fill="${fill}"/>`
    + `<path d="M${n(l + w * .14)} ${n(base + 1)}C${n(cx - w * .4)} ${n(base + w * .16)} ${n(cx + w * .4)} ${n(base + w * .16)} ${n(r - w * .14)} ${n(base + 1)}" stroke="${line}" stroke-width="2"/>`;
};

// ---------------------------------------------------------------- drawings
export const DRAWINGS: Record<IllustrationName, string> = {
  'shelf-recent': frame(
    plate(50, 72, 36, 15)
    + leaf(29, 72, 18, -18) + tomato(55, 71, 5.4) + tomato(63, 76, 4.2) + cuke(68, 67.6, 6)
    + badge(92, 34, 14, W, 'clock'),
    { s: [[20, 32, 6], [108, 64, 4.4, VI]], fl: [[16, 86]] }),

  'shelf-saudi': frame(
    disc(54, 74, 40, 15, 5, LV2, LV3) + `<ellipse cx="54" cy="73.2" rx="34" ry="12" fill="${W}" stroke-width="1.8"/>`
    + riceMound(54, 48, 28, 74)
    + `<g fill="${F.grain}" stroke="none"><ellipse cx="38" cy="68" rx="2" ry="1"/><ellipse cx="70" cy="66" rx="2" ry="1"/><ellipse cx="46" cy="74" rx="2" ry="1"/><ellipse cx="64" cy="73" rx="2" ry="1"/></g>`
    + halfChicken(53, 53, .3)
    + disc(100, 82, 13, 5.4, 3, W, LV2, 2) + date(96, 79.6, -14, .8) + date(104, 81, 12, .8),
    { g: [62, 90, 52, 12], s: [[18, 30, 6], [104, 28, 4.4, VI], [100, 56, 3.4]], c: [[76, 12, .55]] }),

  'shelf-groups': frame(
    disc(50, 70, 38, 16, 4.5, W, LV2)
    + `<path d="M50 69.5L50 57.5A30 12 0 0 1 80 69.5Z" fill="${F.breadL}" stroke-width="1.8"/><path d="M50 69.5L80 69.5A30 12 0 0 1 50 81.5Z" fill="${F.roastL}" stroke-width="1.8"/>`
    + `<path d="M50 69.5L50 81.5A30 12 0 0 1 20 69.5Z" fill="${F.green}" stroke-width="1.8"/><path d="M50 69.5L20 69.5A30 12 0 0 1 50 57.5Z" fill="${F.redHi}" stroke-width="1.8"/>`
    + `<g stroke="none" fill="${W}"><circle cx="34" cy="64" r="1.4"/><ellipse cx="62" cy="63" rx="2" ry="1"/><ellipse cx="70" cy="66" rx="2" ry="1"/></g>`
    + `<path d="M60 74l10 1.6M58 77.6l8 1" stroke="${F.roastD}" stroke-width="1.6"/><path d="M30 73.6q6-4 12 0" stroke="${F.greenD}" stroke-width="1.6"/>`
    + `<path d="M90 44h18l-2.2 34a6.8 2.6 0 0 1-13.6 0z" fill="${W}"/><path d="M90.8 54h16.4l-1.6 24a6.8 2.6 0 0 1-13.6 0z" fill="${F.milk}" stroke="none"/>`
    + `<ellipse cx="99" cy="54" rx="8.2" ry="2.6" fill="${CR}" stroke-width="1.8"/><ellipse cx="99" cy="44" rx="9" ry="3" fill="none" stroke-width="2.2"/><path d="M93.4 58v14" stroke="${LV2}" stroke-width="2.4"/>`,
    { s: [[18, 30, 6], [104, 26, 4.4, VI]], fl: [[110, 88]] }),

  'shelf-ingredients': frame(
    // carrot lying down, a tomato, an egg and a leaf
    `<g transform="translate(30 66) rotate(-24)"><path d="M0-5.6C14-6 30-3 40 0C30 3 14 6 0 5.6C-3 5.6-4.6 3-4.6 0S-3-5.6 0-5.6Z" fill="${F.carrot}"/><path d="M8-2.4h5M18 2h5M27-1h4" stroke="#C9661F" stroke-width="1.6"/><path d="M-4 0C-9-4-12-8-12-11M-4 0C-10-1-14 0-16 2M-4 0C-9 2-11 6-11 9" stroke="${F.greenD}" stroke-width="2.2"/>${hi(6, -3, 4, 1, F.carrotL)}</g>`
    + tomato(80, 70, 11) + `<path d="M75 60.4l5 2.6 5-2.6M80 63v-4" stroke="${F.greenD}" stroke-width="2"/>`
    + egg(58, 76, 7.6)
    + leaf(84, 42, 18, -60, F.leafL),
    { s: [[18, 30, 6], [106, 30, 4.4, VI], [54, 22, 3.6]], c: [[24, 12, .5]], fl: [[108, 86]] }),

  'shelf-supermarket': frame(
    // a basket with bread, a milk carton and greens
    `<rect x="46" y="22" width="16" height="30" rx="2" fill="${W}"/><path d="M46 28L54 20L62 28" fill="${SK2}"/><path d="M48 36h12" stroke="${SK2}" stroke-width="3"/>`
    + `<path d="M64 46C62 30 70 22 80 22C86 30 82 42 70 50Z" fill="${F.bread}"/><path d="M70 32l6-4M68 39l7-4" stroke="${F.breadD}" stroke-width="1.8"/>`
    + leaf(30, 46, 22, -64) + leaf(36, 50, 18, -100, F.leafL)
    + `<path d="M24 50H96L90 84C89.4 87 87 89 84 89H36C33 89 30.6 87 30 84Z" fill="${LV2}"/>`
    + `<path d="M34 60L36 82M48 60V84M60 60V84M72 60V84M86 60L84 82" stroke="${LV3}" stroke-width="2.4"/>`
    + `<rect x="20" y="46" width="80" height="9" rx="4.5" fill="${W}"/>`
    + `<path d="M36 46C38 30 82 30 84 46" stroke-width="2.6"/>`,
    { g: [60, 90, 46, 10], s: [[14, 26, 6], [106, 30, 4.4, VI]], fl: [[108, 90]] }),

  'shelf-my-foods': frame(
    // a food package lying at an angle, with a nutrition label and a heart
    `<path d="M24 42L64 30L96 40L56 52Z" fill="${W}"/><path d="M24 42V78L56 90V52Z" fill="${LV2}"/><path d="M56 52V90L96 78V40Z" fill="${LV3}"/>`
    + `<path d="M62 56.6L88 49V71L62 78.6Z" fill="${W}" stroke-width="2"/><path d="M66 61l18-5.4M66 66.6l14-4.2M66 72l17-5" stroke-width="1.8"/>`
    + `<path d="M32 50l16 5M32 57l12 3.6" stroke="${W}" stroke-width="2.6"/>`,
    { s: [[16, 28, 6], [106, 28, 4.4, VI]], h: [60, 18, 1.3], fl: [[16, 86]] }),

  'shelf-barcode': frame(
    `<path d="M22 40L62 28L98 40L58 52Z" fill="${W}"/><path d="M22 40V76L58 88V52Z" fill="${LV2}"/><path d="M58 52V88L98 76V40Z" fill="${W}"/>`
    + [0, 4, 7, 12, 15, 19, 24, 27, 31].map((t, i) => `<path d="M${n(64 + t)} ${n(58.6 - t * .3)}V${n(78 - t * .3)}" stroke-width="${i % 3 === 0 ? 2.6 : 1.6}" stroke-linecap="butt"/>`).join('')
    + `<path d="M14 64L106 56" stroke="${F.red}" stroke-width="2.6"/>`
    + `<path d="M54 22H46V30M96 22H104V30" stroke="${IN}" stroke-width="2.4"/>`,
    { s: [[16, 22, 5.4], [110, 76, 4, VI]], fl: [[18, 88]] }),

  'shelf-quick': frame(
    plate(52, 74, 36, 15)
    + `<path d="M36 72c0-6 6-10 16-10s16 4 16 10c-4 3-10 4-16 4s-12-1-16-4z" fill="${F.bread}"/><path d="M38 70.6c4-3 9-4 14-4s10 1 14 4" stroke="${F.breadL}" stroke-width="2.6"/>`
    + leaf(44, 68, 10, -10) + tomato(58, 66.6, 3.4)
    + badge(92, 32, 14, W, 'bolt'),
    { s: [[18, 30, 6], [108, 62, 4.4, VI]], fl: [[16, 88]] }),

  'group-starch': frame(
    // a bread loaf and a small bowl of rice
    `<path d="M14 72C14 56 24 46 44 46C64 46 74 56 74 72V80C74 84 72 86 68 86H20C16 86 14 84 14 80Z" fill="${F.bread}"/>`
    + `<path d="M20 64C22 54 30 50 44 50" stroke="${F.breadL}" stroke-width="3.2"/><path d="M30 58L36 50M42 58L48 50M54 58L60 50" stroke="${F.breadD}" stroke-width="2"/>`
    + bowl(92, 70, 18, 6.4, 12, F.rice)
    + `<path d="M80 69.4c3-6 21-6 24 0" fill="${F.rice}" stroke-width="1.8"/><g fill="${F.riceD}" stroke="none"><ellipse cx="88" cy="66" rx="1.6" ry=".9"/><ellipse cx="95" cy="65" rx="1.6" ry=".9"/><ellipse cx="99" cy="68" rx="1.6" ry=".9"/><ellipse cx="86" cy="69" rx="1.6" ry=".9"/></g>`,
    { s: [[16, 30, 5.4], [104, 34, 4.4, VI]] }),

  'group-protein': frame(
    drumstick(42, 64, 1.05, -24)
    + egg(90, 66, 11)
    + `<path d="M70 84c0-5 6-8 12-8s12 3 12 8c-3 3-7 4-12 4s-9-1-12-4z" fill="${F.egg}" stroke-width="2"/><ellipse cx="82" cy="82" rx="5" ry="3" fill="${F.yolk}" stroke-width="1.8"/>` + hi(80.4, 81, 1.4, .8, '#FCE3A0'),
    { s: [[18, 30, 5.4], [104, 34, 4.4, VI]], fl: [[16, 88]] }),

  'group-vegetables': frame(
    // broccoli, a carrot and a cucumber slice
    `<path d="M40 82V60" stroke-width="7.4"/><path d="M40 82V60" stroke="#A9D47F" stroke-width="3.4"/><path d="M40 70l-8-6M40 66l7-6" stroke-width="5"/><path d="M40 70l-8-6M40 66l7-6" stroke="#A9D47F" stroke-width="1.8"/>`
    + `<path d="M22 56a9 9 0 0 1 4-14a11 11 0 0 1 18-6a10 10 0 0 1 16 8a9 9 0 0 1-4 14C48 62 30 62 22 56Z" fill="${F.greenD}"/>`
    + `<g fill="${F.green}" stroke="none"><circle cx="30" cy="46" r="3"/><circle cx="42" cy="40" r="3"/><circle cx="52" cy="48" r="3"/></g>`
    + `<g transform="translate(78 48) rotate(64)"><path d="M0-5C10-5 24-3 32 0C24 3 10 5 0 5C-3 5-4 2.6-4 0S-3-5 0-5Z" fill="${F.carrot}"/><path d="M8-2h4M17 1.6h4" stroke="#C9661F" stroke-width="1.6"/><path d="M-4 0C-8-4-10-7-10-10M-4 0C-9 1-12 3-13 5" stroke="${F.greenD}" stroke-width="2.2"/></g>`
    + cuke(96, 80, 10),
    { s: [[16, 30, 5.4], [106, 30, 4.4, VI]] }),

  'group-fruit': frame(
    apple(44, 60, 22)
    + `<circle cx="90" cy="74" r="13" fill="#F59A3B"/>` + hi(85.4, 69.4, 3, 3.6, '#FBC27E') + `<path d="M90 61.4l1-3" stroke="#7A4E2A" stroke-width="2"/>` + leaf(91, 59, 10, -30)
    + date(104, 88, 8, .8),
    { g: [60, 90, 48, 11], s: [[16, 28, 5.4], [108, 30, 4.4, VI]], fl: [[108, 92, 2.2]] }),

  'group-milk': frame(
    // a glass of milk and a wedge of cheese
    `<path d="M30 30H62L58 84a12 4 0 0 1-24 0z" fill="${W}"/><path d="M31.4 44H60.6L58 84a12 4 0 0 1-24 0z" fill="${F.milk}" stroke="none"/>`
    + `<ellipse cx="46" cy="44" rx="14.6" ry="4.4" fill="${CR}" stroke-width="2"/><ellipse cx="46" cy="30" rx="16" ry="5" fill="none"/><path d="M37 50V76" stroke="${LV2}" stroke-width="3"/>`
    + `<path d="M66 74L98 64L98 80L66 90Z" fill="${F.cheeseD}"/><path d="M66 74L82 60L98 64Z" fill="${F.cheese}"/>`
    + `<circle cx="74" cy="80" r="2.4" fill="${F.cheese}" stroke-width="1.6"/><circle cx="88" cy="74" r="2" fill="${F.cheese}" stroke-width="1.6"/><circle cx="83" cy="64" r="1.6" fill="${F.cheeseD}" stroke="none"/>`,
    { s: [[16, 28, 5.4], [104, 30, 4.4, VI]], fl: [[108, 90]] }),

  'group-fat': frame(
    // a drop of olive oil, olives and almonds
    `<path d="M44 18C54 32 68 44 68 60A24 24 0 0 1 20 60C20 44 34 32 44 18Z" fill="${GO}"/><path d="M28 60A16 16 0 0 0 36 74" stroke="#F6D38A" stroke-width="3.4"/>`
    + `<ellipse cx="82" cy="72" rx="7" ry="8.6" transform="rotate(-20 82 72)" fill="${F.olive}" stroke-width="2.2"/><ellipse cx="98" cy="78" rx="7" ry="8.6" transform="rotate(24 98 78)" fill="${F.olive}" stroke-width="2.2"/>`
    + hi(79.6, 68.6, 1.6, 2.4, '#B6CC74') + hi(95.6, 74.6, 1.6, 2.4, '#B6CC74')
    + `<path d="M88 58c-2-6 0-12 6-16" stroke="#7A4E2A" stroke-width="2"/>` + leaf(92, 46, 12, -30)
    + `<path d="M58 86c-4-3-4-9 0-12c4 3 4 9 0 12z" fill="${F.almond}" stroke-width="2"/><path d="M68 88c-4-3-4-9 0-12c4 3 4 9 0 12z" fill="${F.almond}" stroke-width="2"/>`,
    { s: [[16, 28, 5.4], [104, 26, 4.4, VI]] }),

  'log-food': frame(
    plate(50, 72, 36, 15)
    + leaf(30, 72, 16, -16) + tomato(54, 70, 5.4) + cuke(66, 74, 5.6)
    + `<circle cx="93.4" cy="35.8" r="14" fill="${LV3}" stroke-width="2.2"/><circle cx="92" cy="33" r="14" fill="${IN}" stroke-width="2.2"/><g transform="translate(92 33) scale(1.15)">${GLYPH.plus}</g>`,
    { s: [[18, 30, 6], [108, 64, 4.4, VI]], fl: [[16, 86]] }),

  water: frame(
    `<path d="M66 50l14-38" stroke-width="7.4"/><path d="M66 50l14-38" stroke="${W}" stroke-width="3.6"/><path d="M70 38l3-1.4M74 27l3-1.4" stroke="${VI}" stroke-width="2.6"/>`
    + `<path d="M36 34l4 50a20 6.4 0 0 0 40 0l4-50" fill="${W}"/>`
    + `<path d="M37.6 52l2.4 32a20 6.4 0 0 0 40 0l2.4-32a22.4 7 0 0 1-44.8 0z" fill="${F.water}"/>`
    + `<ellipse cx="60" cy="52" rx="22.4" ry="7" fill="${F.waterTop}"/>`
    + `<path d="M54 47l6 3-6 3-6-3z" fill="${W}" stroke-width="1.8"/><path d="M48 50v5l6 3v-5z" fill="#DDEFF9" stroke-width="1.8"/><path d="M54 53v5l6-3v-5z" fill="#C6E6F7" stroke-width="1.8"/>`
    + `<path d="M66 52a6.6 3.4 0 0 1 13.2 0z" fill="${F.lemon}" stroke-width="1.8"/>`
    + `<ellipse cx="60" cy="34" rx="24" ry="7.6" fill="none"/>`
    + `<path d="M45 62V78" stroke="${W}" stroke-width="3.2" opacity=".85"/><circle cx="66" cy="70" r="2" fill="${W}" stroke-width="1.4"/><circle cx="58" cy="78" r="1.6" fill="${W}" stroke-width="1.4"/>`,
    { g: [60, 90, 40, 9], gc: LV, s: [[18, 40, 5.4], [100, 26, 4.4, VI]], c: [[16, 16, .55]], fl: [[24, 88], [98, 88]] }),

  steps: frame(
    // a sneaker with a dotted path of steps
    `<path d="M14 40C34 26 62 22 104 28" stroke="${VI}" stroke-width="3" stroke-dasharray="0 8"/>`
    + `<path d="M18 74C17 62 21 50 30 48C36 56 48 58 56 52L82 63C94 65 100 70 99 78Z" fill="${W}"/>`
    + `<path d="M30 48C36 56 48 58 56 52L62 55C56 63 38 64 26 56Z" fill="${LV3}" stroke-width="2"/>`
    + `<path d="M38 56l4-5M46 58l4-5M54 58l3-4" stroke="${IN}" stroke-width="2"/>`
    + `<path d="M16 76H98C101 76 102 79 101 82C100.6 84 99 86 97 86H20C17 86 15.6 84 15.4 81.6C15.2 78.6 15.6 76 16 76Z" fill="${SK2}"/>`
    + `<path d="M24 81H40" stroke="${W}" stroke-width="2.4"/>`,
    { g: [60, 90, 48, 8], s: [[100, 46, 5.4], [14, 60, 4, VI]] }),

  activity: frame(
    // a stopwatch seen at an angle, with a heart
    `<rect x="51" y="14" width="12" height="9" rx="2.6" fill="${LV2}"/><path d="M80 28l4-4" stroke-width="3.4"/>`
    + `<circle cx="59" cy="58" r="31" fill="${LV3}"/><circle cx="56.6" cy="56" r="31" fill="${W}"/><circle cx="56.6" cy="56" r="23" fill="${SK}" stroke-width="2"/>`
    + `<path d="M56.6 37A19 19 0 0 1 75.6 56" stroke="${VI}" stroke-width="4.6"/><path d="M56.6 56L64 44"/><circle cx="56.6" cy="56" r="2.2" fill="${O}" stroke="none"/>`
    + `<path d="M40 44a20 20 0 0 1 6-6" stroke="${W}" stroke-width="2.6"/>`,
    { s: [[14, 30, 5.4], [108, 40, 4.4, VI]], h: [96, 80, 1.5] }),

  weight: frame(
    // a bathroom scale at 3/4
    `<path d="M18 62L60 46L102 62L60 78Z" fill="${W}"/><path d="M18 62v8L60 86V78Z" fill="${LV2}"/><path d="M60 78v8L102 70V62Z" fill="${LV3}"/>`
    + `<path d="M48 56.6a14 6 0 0 1 24 0l-12 4.6z" fill="${SK}" stroke-width="2"/><path d="M60 61.2L64 53.6" stroke="${F.red}" stroke-width="2"/>`
    + `<ellipse cx="40" cy="66" rx="7" ry="3.6" fill="${LV}" stroke-width="1.8"/><ellipse cx="78" cy="66" rx="7" ry="3.6" fill="${LV}" stroke-width="1.8"/>`,
    { s: [[18, 30, 6], [104, 30, 4.4, VI], [60, 24, 3.4]], c: [[72, 12, .5]], fl: [[14, 84], [106, 82]] }),

  calculator: frame(
    `<path d="M30 20H76A6 6 0 0 1 82 26V86A6 6 0 0 1 76 92H30Z" fill="${LV3}" transform="translate(4 2)"/>`
    + `<rect x="28" y="18" width="50" height="72" rx="8" fill="${W}"/><rect x="35" y="26" width="36" height="14" rx="3" fill="${SK}" stroke-width="2"/><path d="M58 33h8" stroke-width="2.2"/>`
    + [38, 51, 64].flatMap((x, i) => [48, 60, 72].map((y, j) => `<rect x="${x - 2}" y="${y}" width="9" height="8" rx="2.2" fill="${(i === 2 && j === 2) ? VI : (i + j) % 2 ? LV2 : LV}" stroke-width="1.8"/>`)).join(''),
    { s: [[14, 30, 5.4], [104, 28, 4.4, VI]], h: [96, 76, 1.5], fl: [[16, 90]] }),

  plan: frame(
    `<rect x="26" y="30" width="62" height="58" rx="8" fill="${LV3}" transform="translate(4 2)"/>`
    + `<rect x="24" y="28" width="62" height="58" rx="8" fill="${W}"/><path d="M24 36C24 31 28 28 32 28H78C82 28 86 31 86 36V42H24Z" fill="${IN}"/>`
    + `<path d="M38 22V33M72 22V33" stroke-width="3"/>`
    + [[33, 50], [47, 50], [61, 50], [33, 64], [47, 64]].map(([x, y]) => `<rect x="${x}" y="${y}" width="10" height="9" rx="2.2" fill="${LV}" stroke-width="1.8"/>`).join('')
    + `<rect x="61" y="64" width="10" height="9" rx="2.2" fill="${GO}" stroke-width="1.8"/><path d="M35.6 54.6l2 2 3.4-3.6M49.6 54.6l2 2 3.4-3.6" stroke="${F.greenD}" stroke-width="1.8"/>`
    + leaf(84, 82, 16, -50),
    { s: [[14, 26, 5.4], [106, 34, 4.4, VI]], fl: [[16, 90]] }),

  health: frame(
    `<path d="M58.6 90C32.6 74 22.6 58 24.6 45C26.6 33 36.6 26 45.6 28C51.6 29.4 55.6 33.6 58.6 38C61.6 33.6 65.6 29.4 71.6 28C80.6 26 90.6 33 92.6 45C94.6 58 84.6 74 58.6 90Z" fill="${LV3}"/>`
    + `<path d="M56 88C30 72 20 56 22 43C24 31 34 24 43 26C49 27.4 53 31.6 56 36C59 31.6 63 27.4 69 26C78 24 88 31 90 43C92 56 82 72 56 88Z" fill="${VI}"/>`
    + `<path d="M29 42A12 12 0 0 1 37 32" stroke="${W}" stroke-width="3"/>`
    + `<path d="M28 56H42L47 46L55 68L62 50L66 56H84" stroke="${W}" stroke-width="3"/>`,
    { s: [[14, 28, 5.4], [106, 26, 4.4], [104, 70, 3.6, VI]], fl: [[18, 88], [100, 90]] }),

  hospital: frame(
    // a small building at 3/4 with a cross sign
    `<path d="M20 40L56 30L56 90L20 82Z" fill="${W}"/><path d="M56 30L92 40V82L56 90Z" fill="${LV2}"/><path d="M18 40L56 29L94 40" stroke-width="3"/>`
    + [[26, 48], [38, 45], [26, 62], [38, 59]].map(([x, y]) => `<path d="M${x} ${y}l8-2v8l-8 2z" fill="${SK2}" stroke-width="1.8"/>`).join('')
    + [[62, 46], [76, 50], [62, 60], [76, 64]].map(([x, y]) => `<path d="M${x} ${y}l9 2.4v8l-9-2.4z" fill="${SK}" stroke-width="1.8"/>`).join('')
    + `<path d="M42 87V74l9-2v16" fill="${IN}" stroke-width="2"/>`
    + `<circle cx="56" cy="18" r="10" fill="${W}"/><path d="M56 12.6v10.8M50.6 18h10.8" stroke="${F.red}" stroke-width="3.4"/>`,
    { g: [58, 88, 50, 10], s: [[14, 26, 5.4], [104, 22, 4.4, VI]], c: [[84, 10, .5]], fl: [[104, 88]] }),

  ideas: frame(
    bowl(46, 64, 32, 11, 22, F.green)
    + leaf(24, 62, 14, -12, F.leafL) + tomato(44, 60, 5) + cuke(58, 63, 5) + egg(36, 60, 4.2)
    + `<path d="M92 14A13 13 0 0 1 99.4 37.6V43H84.6V37.6A13 13 0 0 1 92 14Z" fill="${F.lemon}"/><rect x="85.4" y="43" width="13.2" height="7" rx="2" fill="${LV2}"/>`
    + `<path d="M88 26a5 5 0 0 1 4-5" stroke="${W}" stroke-width="2.4"/><path d="M92 6V2M106 10L109 7M78 10L75 7M110 24H114M74 24H70" stroke="${GO}" stroke-width="2.4"/>`,
    { s: [[16, 28, 5.4], [108, 60, 4, VI]], fl: [[100, 88]] }),

  shopping: frame(
    // a paper bag with bread, greens and an apple
    leaf(30, 44, 22, -70) + leaf(38, 48, 18, -110, F.leafL)
    + `<path d="M64 46C62 28 70 18 82 18C88 26 84 38 72 48Z" fill="${F.bread}"/><path d="M70 30l7-4M68 38l8-4" stroke="${F.breadD}" stroke-width="1.8"/>`
    + `<path d="M24 46H84L80 90H28Z" fill="${LV2}"/><path d="M84 46L96 50L92 86L80 90Z" fill="${LV3}"/>`
    + `<path d="M40 56C40 64 66 64 66 56" stroke-width="2.4"/>`
    + apple(100, 84, 8),
    { g: [62, 92, 46, 8], s: [[16, 24, 5.4], [106, 30, 4.4, VI]], fl: [[16, 90]] }),

  readings: frame(
    `<rect x="24" y="26" width="64" height="58" rx="8" fill="${LV3}" transform="translate(4 2)"/>`
    + `<rect x="22" y="24" width="64" height="58" rx="8" fill="${W}"/><path d="M31 72H77" stroke="${LV2}" stroke-width="2.6"/>`
    + `<path d="M31 62L43 50L53 56L65 40L77 46" stroke="${VI}" stroke-width="3"/>`
    + [[43, 50], [53, 56], [65, 40]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.2" fill="${W}" stroke-width="2"/>`).join('')
    + badge(90, 78, 13, W, 'drop'),
    { s: [[14, 28, 5.4], [104, 22, 4.4, VI]], fl: [[16, 90]] }),

  assessment: frame(
    `<rect x="30" y="22" width="54" height="70" rx="8" fill="${LV3}" transform="translate(4 2)"/>`
    + `<rect x="28" y="20" width="54" height="70" rx="8" fill="${LV2}"/><rect x="35" y="29" width="40" height="54" rx="4" fill="${W}" stroke-width="2"/>`
    + `<rect x="45" y="14" width="20" height="10" rx="4" fill="${IN}"/>`
    + [42, 56, 70].map((y, i) => `<rect x="40" y="${y - 3.8}" width="7.6" height="7.6" rx="2" fill="${i < 2 ? F.green : W}" stroke-width="1.8"/>${i < 2 ? `<path d="M41.6 ${y}l1.6 1.6 3-3.2" stroke="${W}" stroke-width="1.6"/>` : ''}<path d="M52 ${y}H${i === 1 ? 64 : 69}" stroke-width="2"/>`).join(''),
    { s: [[14, 28, 5.4], [104, 24, 4.4, VI]], h: [96, 76, 1.5], fl: [[16, 90]] }),

  'empty-diary': frame(
    plate(60, 72, 38, 16)
    + `<path d="M14 84V48M10 48v8c0 4 8 4 8 0v-8M14 40v6" stroke-width="2.6"/>`
    + `<path d="M104 84V58"/><ellipse cx="104" cy="50" rx="5" ry="8" fill="${W}"/>`
    + spark(60, 70, 5, GO).replace('<path', '<path stroke="none"'),
    { s: [[24, 24, 5.4], [96, 26, 4.4, VI]], c: [[46, 12, .6]], fl: [[30, 92], [90, 92]] }),

  'empty-readings': frame(
    `<rect x="24" y="24" width="68" height="60" rx="8" fill="${LV3}" transform="translate(4 2)"/>`
    + `<rect x="22" y="22" width="68" height="60" rx="8" fill="${W}"/><path d="M33 32V71H80" stroke-width="2.4"/>`
    + `<path d="M40 58H76" stroke="${VI}" stroke-width="2.8" stroke-dasharray="4 6"/>`
    + `<circle cx="93.4" cy="81.6" r="13" fill="${LV3}" stroke-width="2.2"/><circle cx="92" cy="79" r="13" fill="${IN}" stroke-width="2.2"/><g transform="translate(92 79) scale(1.05)">${GLYPH.plus}</g>`,
    { s: [[12, 28, 5.4], [104, 22, 4.4, VI]], c: [[50, 6, .5]], fl: [[14, 90]] }),

  'empty-requests': frame(
    // an open envelope with a letter
    `<path d="M20 50L60 26L100 50Z" fill="${LV3}"/>`
    + `<rect x="34" y="22" width="52" height="40" rx="4" fill="${W}" stroke-width="2.2"/><path d="M42 32H76M42 40H70M42 48H62" stroke="${LV3}" stroke-width="2.4"/>`
    + `<path d="M20 50L60 74L100 50V86C100 89 98 91 95 91H25C22 91 20 89 20 86Z" fill="${LV2}"/>`
    + `<path d="M20 88L50 68M100 88L70 68" stroke-width="2.2"/>`,
    { g: [60, 92, 50, 8], s: [[12, 30, 5.4], [108, 30, 4.4, VI]], h: [60, 12, 1.3], fl: [[108, 90]] }),

  'empty-search': frame(
    `<path d="M68 64L92 86" stroke-width="12"/><path d="M68 64L92 86" stroke="${IN}" stroke-width="6.4"/>`
    + `<circle cx="52" cy="46" r="26" fill="${LV3}"/><circle cx="50" cy="44" r="26" fill="${W}"/><circle cx="50" cy="44" r="18" fill="${SK}" stroke-width="2"/><path d="M39 38A12 12 0 0 1 46 31" stroke="${W}" stroke-width="3"/>`
    + leaf(14, 84, 16, -30) + tomato(36, 86, 4),
    { g: [60, 90, 48, 9], s: [[14, 24, 5.4], [100, 18, 4.4, VI], [104, 54, 3.4]], fl: [[108, 88]] }),

  'empty-generic': frame(
    // an open box at 3/4 with a sparkle inside
    `<path d="M30 46L60 36L90 46L60 56Z" fill="${LV3}"/>`
    + `<path d="M30 46L60 56V88L30 78Z" fill="${LV2}"/><path d="M60 56L90 46V78L60 88Z" fill="${W}"/>`
    + `<path d="M30 46L14 36L44 26L60 36Z" fill="${W}"/><path d="M90 46L106 36L76 26L60 36Z" fill="${LV2}"/>`
    + spark(60, 36, 8, GO).replace('<path', '<path stroke="none"'),
    { s: [[16, 18, 5.4, VI], [100, 16, 4.4], [108, 64, 3.6, VI]], c: [[44, 6, .5]], fl: [[16, 86], [104, 86]] }),

  welcome: frame(
    // the Mizan date palm growing from a bowl, with a heart
    `<path d="M58 62V34" stroke-width="3"/>`
    + `<path d="M58 34C51 26 39 26 32 32C40 31 49 32 58 38Z" fill="${F.green}"/><path d="M58 34C65 26 77 26 84 32C76 31 67 32 58 38Z" fill="${F.green}"/>`
    + `<path d="M58 34C53 25 54 18 58 14C62 18 63 25 58 34Z" fill="${F.leafL}"/>`
    + `<path d="M58 36C50 38 45 43 44 49C50 43 54 41 58 40ZM58 36C66 38 71 43 72 49C66 43 62 41 58 40Z" fill="${F.greenD}" stroke-width="2.2"/>`
    + `<ellipse cx="53.6" cy="42" rx="3" ry="4" fill="${F.date}" stroke-width="1.8"/><ellipse cx="62.4" cy="42" rx="3" ry="4" fill="${F.date}" stroke-width="1.8"/><ellipse cx="58" cy="45.6" rx="3" ry="4" fill="${F.date}" stroke-width="1.8"/>`
    + bowl(58, 64, 30, 10, 22, F.gold),
    { s: [[16, 26, 6], [100, 40, 4.4, VI], [24, 62, 3.6]], h: [96, 20, 1.5], c: [[12, 6, .5]], fl: [[16, 88], [100, 90]] }),

  login: frame(
    // a phone with a padlock and a leaf
    `<rect x="36" y="16" width="42" height="76" rx="9" fill="${LV3}" transform="translate(3 2)"/>`
    + `<rect x="34" y="14" width="42" height="76" rx="9" fill="${W}"/><rect x="40" y="24" width="30" height="56" rx="3" fill="${SK}" stroke-width="2"/><path d="M51 19H59" stroke-width="2.2"/>`
    + `<path d="M49.6 52V46A5.4 5.4 0 0 1 60.4 46V52" stroke-width="2.6"/><rect x="45" y="51" width="20" height="16" rx="3.6" fill="${GO}" stroke-width="2.4"/><path d="M55 56.6V61" stroke-width="2.4"/>`
    + leaf(80, 86, 20, -60) + leaf(84, 88, 14, -10, F.leafL),
    { s: [[16, 26, 5.4], [100, 22, 4.4, VI], [106, 56, 3.4]], h: [96, 40, 1.3], fl: [[20, 90]] }),

  'not-found': frame(
    // a folded map with a dotted path and a question mark
    `<path d="M18 40L40 32V82L18 90Z" fill="${W}"/><path d="M40 32L62 40V90L40 82Z" fill="${LV2}"/><path d="M62 40L84 32V82L62 90Z" fill="${W}"/>`
    + `<path d="M26 74C34 64 44 70 50 60C56 50 66 56 74 46" stroke="${VI}" stroke-width="2.8" stroke-dasharray="3 5"/>`
    + `<path d="M74 36l-4 4M70 36l4 4" stroke="${F.red}" stroke-width="2.6"/>`
    + badge(94, 30, 13, W, 'question'),
    { s: [[14, 22, 5.4], [108, 60, 4, VI]], c: [[38, 8, .5]], fl: [[100, 90]] }),

  error: frame(
    // a plate with a little plaster on it
    plate(58, 70, 40, 17)
    + `<g transform="rotate(-18 58 66)"><rect x="34" y="60" width="48" height="13" rx="6.5" fill="${F.breadL}"/><rect x="51" y="60" width="14" height="13" fill="#FBE8C4" stroke-width="2"/>`
    + `<path d="M54.6 64v.1M58 64v.1M61.4 64v.1M54.6 69v.1M58 69v.1M61.4 69v.1" stroke-width="2"/></g>`,
    { s: [[16, 26, 5.4], [104, 26, 4.4, VI], [58, 30, 4]], c: [[72, 8, .55]], h: [24, 50, 1.2], fl: [[14, 90], [104, 90]] }),

  forbidden: frame(
    `<path d="M58.6 20L86.6 30V52C86.6 70 74.6 84 58.6 92C42.6 84 30.6 70 30.6 52V30Z" fill="${LV3}"/>`
    + `<path d="M56 18L84 28V50C84 68 72 82 56 90C40 82 28 68 28 50V28Z" fill="${LV2}"/><path d="M56 26L77 33.6V50C77 63 68 74 56 81" stroke="${W}" stroke-width="2.6"/>`
    + `<path d="M50 52V45A6 6 0 0 1 62 45V52" stroke-width="2.6"/><rect x="44.6" y="51" width="22.8" height="18" rx="4" fill="${GO}"/><circle cx="56" cy="59" r="2.2" fill="${O}" stroke="none"/><path d="M56 61V64.4"/>`,
    { s: [[14, 26, 5.4], [104, 28, 4.4, VI]], h: [96, 72, 1.4], fl: [[16, 90], [100, 90]] }),
};

/** The SVG markup of an illustration (aria-hidden; the caller gives the text). */
export function illustrationSvg(name: IllustrationName): string {
  return DRAWINGS[name] ?? DRAWINGS['empty-generic'];
}
