// Spot illustrations in CareBite's outlined style: thick sage-deep outlines, flat
// palette fills, two soft round shapes behind and a few small plus-sparkles.
// Each drawing is one main object, often with a small round badge. Plain SVG
// strings (no ids, no external references), safe for server and client.

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
const O = '#3F5646'; // outline (sage-deep)
const W = '#FFFFFF';
const BL = '#FFF1F4'; // blush
const RO = '#FBE1E6'; // rose
const PK = '#F6C9D2'; // pink
const PD = '#EDB3C0'; // pink-deep
const MI = '#E8F3E8'; // mint
const SA = '#D6E8D5'; // sage
const PR = '#526B59'; // primary
const AC = '#7A3E50'; // rose-ink accent (sparingly)

// ---------------------------------------------------------------- frame
type Blobs = 0 | 1 | 2 | 3;
const BLOBS: Record<Blobs, string> = {
  0: `<circle cx="64" cy="50" r="38" fill="${BL}"/><circle cx="34" cy="72" r="21" fill="${MI}"/>`,
  1: `<circle cx="56" cy="50" r="38" fill="${MI}"/><circle cx="90" cy="74" r="19" fill="${RO}"/>`,
  2: `<circle cx="58" cy="52" r="38" fill="${BL}"/><circle cx="92" cy="28" r="17" fill="${MI}"/>`,
  3: `<circle cx="62" cy="52" r="38" fill="${MI}"/><circle cx="28" cy="34" r="18" fill="${RO}"/>`,
};
type Sparks = 'a' | 'b' | 'c';
const SPARKS: Record<Sparks, [number, number, number][]> = {
  a: [[15, 24, 4], [106, 20, 3], [104, 94, 3.5]],
  b: [[16, 90, 3.5], [102, 14, 4], [110, 60, 3]],
  c: [[12, 52, 3], [26, 14, 4], [108, 86, 4]],
};
const spark = (x: number, y: number, s: number) => `M${x} ${y - s}V${y + s}M${x - s} ${y}H${x + s}`;

function frame(body: string, blobs: Blobs = 0, sparks: Sparks = 'a') {
  const plus = SPARKS[sparks].map(([x, y, s]) => spark(x, y, s)).join('');
  return `<svg viewBox="0 0 120 106" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">${BLOBS[blobs]}`
    + `<path d="${plus}" fill="none" stroke="${PK}" stroke-width="2.4" stroke-linecap="round"/>`
    + `<g fill="none" stroke="${O}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${body}</g></svg>`;
}

// ---------------------------------------------------------------- parts
type Glyph = 'heart' | 'check' | 'plus' | 'leaf' | 'drop' | 'clock' | 'bolt' | 'question' | 'dates';
const GLYPH: Record<Glyph, (fill: string) => string> = {
  heart: (c) => `<path d="M0 5.6C-6.6 1.6-7.2-4.4-3.5-5.3C-1.6-5.7-.4-4.5 0-3C.4-4.5 1.6-5.7 3.5-5.3C7.2-4.4 6.6 1.6 0 5.6Z" fill="${c}" stroke-width="2"/>`,
  check: () => `<path d="M-5.2.6L-1.6 4.2L5.4-3.4"/>`,
  plus: () => `<path d="M0-5.6V5.6M-5.6 0H5.6"/>`,
  leaf: (c) => `<path d="M-5.6 5.4C-5.8-2.8-.8-6 6-6C6.2 1-1.4 5.6-5.6 5.4ZM-5.6 5.4L1.2-1.2" fill="${c}" stroke-width="2"/>`,
  drop: (c) => `<path d="M0-7C3.4-2.6 5.4 0 5.4 2.6A5.4 5.4 0 0 1-5.4 2.6C-5.4 0-3.4-2.6 0-7Z" fill="${c}" stroke-width="2"/>`,
  clock: () => `<path d="M0-6V0L4.4 2.6"/>`,
  bolt: (c) => `<path d="M1.6-7.6L-4.6 1H0L-1.6 7.6L4.6-1H0Z" fill="${c}" stroke-width="2"/>`,
  question: () => `<path d="M-3.6-3A3.8 3.8 0 1 1 1.2.4C.2 1 0 1.8 0 3"/><circle cy="6.6" r=".4" stroke-width="2.6"/>`,
  dates: () => `<ellipse cx="-3.2" cy="-1.6" rx="2.6" ry="4" transform="rotate(-25 -3.2 -1.6)" fill="${AC}" stroke-width="1.8"/><ellipse cx="3.2" cy="1.4" rx="2.6" ry="4" transform="rotate(25 3.2 1.4)" fill="${AC}" stroke-width="1.8"/>`,
};
const badge = (x: number, y: number, r: number, fill: string, glyph: Glyph, glyphFill = W) =>
  `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/><g transform="translate(${x} ${y}) scale(${(r / 13).toFixed(2)})">${GLYPH[glyph](glyphFill)}</g>`;

/** A leaf with a midrib, from (x, y) pointing along `rot` degrees. */
const leaf = (x: number, y: number, len: number, rot: number, fill = SA) =>
  `<path transform="translate(${x} ${y}) rotate(${rot})" d="M0 0C${len * .3} ${-len * .34} ${len * .72} ${-len * .36} ${len} 0C${len * .72} ${len * .36} ${len * .3} ${len * .34} 0 0ZM${len * .12} 0H${len * .66}" fill="${fill}"/>`;

/** Plate seen from above, with an inner rim. */
const plate = (cx: number, cy: number, r: number, inner = BL) =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${W}"/><circle cx="${cx}" cy="${cy}" r="${(r * .68).toFixed(1)}" fill="${inner}" stroke-width="2"/>`;

/** Bowl seen from the side (as in the logo), with a mound of food on top. */
function bowl(cx: number, y: number, w: number, d: number, food = SA, mound = 10) {
  const l = cx - w / 2; const r = cx + w / 2;
  return `<path d="M${l + 3} ${y}C${l + 6} ${y - mound} ${r - 6} ${y - mound} ${r - 3} ${y}Z" fill="${food}"/>`
    + `<path d="M${l} ${y}H${r}C${r} ${y + d * .78} ${cx + w * .28} ${y + d} ${cx} ${y + d}C${cx - w * .28} ${y + d} ${l} ${y + d * .78} ${l} ${y}Z" fill="${W}"/>`
    + `<path d="M${l + 7} ${y + 6}H${r - 7}" stroke="${PK}" stroke-width="2.6"/>`;
}

/** A small salad on a plate: leaf, tomato and cucumber slice. */
const salad = (cx: number, cy: number) =>
  leaf(cx - 12, cy + 4, 15, -35) + `<circle cx="${cx + 6}" cy="${cy - 4}" r="6" fill="${PD}"/><circle cx="${cx + 5}" cy="${cy + 8}" r="4.6" fill="${MI}" stroke-width="2"/>`;

/** The CareBite date palm over a bowl (the logo mark, redrawn at illustration size). */
function palmBowl(tilt = 0) {
  const palm = `<path d="M20 23L20 12.5"/>`
    + `<path d="M20 12.5C17 9.5 12.5 9.5 10 12C13 11.8 16.5 12.2 20 14Z" fill="${SA}"/>`
    + `<path d="M20 12.5C23 9.5 27.5 9.5 30 12C27 11.8 23.5 12.2 20 14Z" fill="${SA}"/>`
    + `<path d="M20 12.5C18.2 9 18.5 6.3 20 5C21.5 6.3 21.8 9 20 12.5Z" fill="${SA}"/>`
    + `<path d="M20 13C16.8 13.8 14.6 16 14.2 18.6C16.4 16.2 18.2 15.2 20 14.6ZM20 13C23.2 13.8 25.4 16 25.8 18.6C23.6 16.2 21.8 15.2 20 14.6Z" fill="${PR}"/>`
    + `<ellipse cx="18.2" cy="16.4" rx="1.25" ry="1.65" fill="${PD}" stroke-width=".8"/><ellipse cx="21.8" cy="16.4" rx="1.25" ry="1.65" fill="${PD}" stroke-width=".8"/><ellipse cx="20" cy="17.7" rx="1.25" ry="1.65" fill="${PD}" stroke-width=".8"/>`;
  return `<g transform="translate(10 6) scale(2.4)" stroke-width="1">`
    + (tilt ? `<g transform="rotate(${tilt} 20 23)">${palm}</g>` : palm)
    + `<path d="M9.5 22H30.5C30 28.5 25.6 32.5 20 32.5C14.4 32.5 10 28.5 9.5 22Z" fill="${W}"/><path d="M12.5 25H27.5" stroke="${PK}" stroke-width="1.1"/></g>`;
}

/** Drumstick with the meat centred near (x, y), bone pointing down-right. */
const drumstick = (x: number, y: number, s = 1, meat = PD) =>
  `<g transform="translate(${x} ${y}) rotate(45) scale(${s})" stroke-width="${(2.4 / s).toFixed(2)}">`
  + `<circle cx="27" cy="-3.6" r="4.2" fill="${W}"/><circle cx="27" cy="3.6" r="4.2" fill="${W}"/>`
  + `<path d="M4 0H26" stroke-width="${(9.4 / s).toFixed(1)}"/><path d="M4 0H26" stroke="${W}" stroke-width="${(4.6 / s).toFixed(1)}"/>`
  + `<path d="M10 0C4-4-2-11-12-11C-20-11-24-5-24 0C-24 5-20 11-12 11C-2 11 4 4 10 0Z" fill="${meat}"/>`
  + `<path d="M-18-4A7 7 0 0 1-12-7" stroke="${W}" stroke-width="${(2.4 / s).toFixed(2)}"/></g>`;

// ---------------------------------------------------------------- drawings
export const DRAWINGS: Record<IllustrationName, string> = {
  'shelf-recent': frame(plate(52, 58, 30) + salad(52, 58) + badge(88, 30, 15, W, 'clock') + `<circle cx="88" cy="30" r="1" fill="${O}" stroke-width="1.6"/>`, 0, 'b'),

  'shelf-saudi': frame(
    `<ellipse cx="58" cy="82" rx="44" ry="10" fill="${W}"/><ellipse cx="58" cy="80.6" rx="34" ry="5.4" fill="${BL}" stroke-width="2"/>`
    + `<path d="M26 81C27 54 89 54 90 81C80 85 36 85 26 81Z" fill="${W}"/>`
    + `<path d="M36 74l3-1.5M46 66l3 1M70 66l3-1.2M80 74l2.6 1.4M44 78l3 .6M72 79l3-.6M58 76l2.6-1" stroke-width="1.8"/>`
    + drumstick(52, 58, .7)
    + badge(94, 34, 13, W, 'dates'), 1, 'c'),

  'shelf-groups': frame(
    `<circle cx="52" cy="54" r="33" fill="${W}"/>`
    + `<path d="M52 54L27 54A25 25 0 0 1 52 29Z" fill="${SA}" stroke-width="2"/><path d="M52 54L52 29A25 25 0 0 1 75.5 45.5Z" fill="${PK}" stroke-width="2"/>`
    + `<path d="M52 54L75.5 45.5A25 25 0 0 1 52 79Z" fill="${RO}" stroke-width="2"/><path d="M52 54L52 79A25 25 0 0 1 27 54Z" fill="${MI}" stroke-width="2"/>`
    + `<path d="M90 50H104L101.5 84C101.3 85.8 100 87 98.2 87H95.8C94 87 92.7 85.8 92.5 84Z" fill="${MI}"/><path d="M90.8 60H103.2" stroke-width="2"/><path d="M93.4 66H100.6" stroke="${W}" stroke-width="2.4"/>`, 2, 'b'),

  'shelf-ingredients': frame(
    `<path d="M30 88C31 70 31 50 33 28"/>`
    + [[28.6, 36, -28], [29, 46, -28], [28.6, 56, -28], [36.4, 34, 28], [36.4, 44, 28], [35.6, 54, 28], [33, 24, 0]].map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="2.8" ry="5.2" transform="rotate(${r} ${x} ${y})" fill="${W}" stroke-width="1.8"/>`).join('')
    + `<g transform="translate(80 30) rotate(24)"><path d="M0-1C-5-8-11-9-13-6M0-1C0-9 3-13 5-15M0-1C4-7 10-8 12-6" stroke-width="2.2"/><path d="M-8 0C-8-4 8-4 8 0L1.6 46C1 48.6-1 48.6-1.6 46Z" fill="${PK}"/><path d="M-5 12H-1M2 22H5M-3 32H0" stroke-width="2"/></g>`
    + `<circle cx="50" cy="66" r="18" fill="${PD}"/><path d="M39.4 60.6A11.6 11.6 0 0 1 45 54.2" stroke="${W}" stroke-width="2.6"/>`
    + `<path d="M50 44L52.2 48.4L57 48.6L53.2 51.6L54.4 56.2L50 53.6L45.6 56.2L46.8 51.6L43 48.6L47.8 48.4Z" fill="${SA}" stroke-width="2"/><path d="M50 44V40"/>`, 0, 'b'),

  'shelf-supermarket': frame(
    `<rect x="36" y="22" width="18" height="30" rx="2" fill="${SA}"/><path d="M50 22L53 12H58"/><path d="M40 30H50" stroke="${W}" stroke-width="2.4"/>`
    + leaf(58, 40, 22, -62)
    + `<path d="M28 42H84L88 92H24Z" fill="${W}"/><path d="M27 52H85" stroke-width="2"/><path d="M42 42C42 30 70 30 70 42" fill="none"/><path d="M38 66H74" stroke="${PK}" stroke-width="2.6"/>`
    + badge(88, 80, 12, SA, 'leaf', W), 3, 'a'),

  'shelf-my-foods': frame(
    `<rect x="26" y="20" width="58" height="70" rx="9" fill="${W}"/><rect x="35" y="30" width="40" height="10" rx="3" fill="${SA}"/>`
    + `<path d="M35 50H75M35 59H67M35 68H73M35 77H58" stroke-width="2"/>`
    + badge(86, 76, 14, PK, 'heart', W), 0, 'c'),

  'shelf-barcode': frame(
    `<rect x="20" y="28" width="78" height="52" rx="9" fill="${W}"/>`
    + [[31, 3.6], [36.5, 1.8], [41, 4.4], [47, 1.8], [51, 3.6], [57, 1.8], [61.4, 4.4], [67.4, 1.8], [71.4, 3.6], [77, 1.8], [81.4, 4.4], [87, 1.8]].map(([x, w]) => `<path d="M${x} 38V70" stroke-width="${w}" stroke-linecap="butt"/>`).join('')
    + `<path d="M14 54H104" stroke="${PD}" stroke-width="3.4"/>`
    + `<path d="M14 26V20H22M96 20H104V26M14 82V88H22M96 88H104V82" stroke-width="2.4"/>`, 1, 'c'),

  'shelf-quick': frame(
    plate(52, 58, 30)
    + `<path d="M38 70L62 44L66 70Z" fill="${RO}"/><path d="M40.6 67.2L62.6 47" stroke="${SA}" stroke-width="3"/>`
    + badge(88, 30, 15, PK, 'bolt', W), 2, 'b'),

  'group-starch': frame(
    `<path d="M20 70C20 52 32 42 50 42C68 42 80 52 80 70V84C80 87 78 89 75 89H25C22 89 20 87 20 84Z" fill="${RO}"/>`
    + `<path d="M24 62C26 50 36 46 50 46" stroke="${W}" stroke-width="2.6"/><path d="M36 58L42 50M48 58L54 50M60 58L66 50" stroke-width="2"/>`
    + bowl(92, 70, 28, 18, W, 9) + `<path d="M86 63.4l2-1M93 62.6l2 .6M99 64l1.6-1" stroke-width="1.6"/>`, 3, 'a'),

  'group-protein': frame(
    drumstick(46, 50, 1.05)
    + `<ellipse cx="90" cy="48" rx="13" ry="16" fill="${W}"/><path d="M83 42A8 9 0 0 1 87 36" stroke="${PK}" stroke-width="2.4"/>`, 0, 'c'),

  'group-vegetables': frame(
    leaf(52, 52, 40, -50, MI) + `<path d="M64 32C66 38 66 42 64 46" stroke-width="1.8"/>`
    + `<g transform="rotate(-32 52 64)"><rect x="20" y="54" width="64" height="20" rx="10" fill="${SA}"/><ellipse cx="80" cy="64" rx="4" ry="9.4" fill="${MI}" stroke-width="2"/>`
    + `<circle cx="32" cy="60" r="1.2" fill="${PR}" stroke="none"/><circle cx="44" cy="67" r="1.2" fill="${PR}" stroke="none"/><circle cx="56" cy="60" r="1.2" fill="${PR}" stroke="none"/><circle cx="66" cy="68" r="1.2" fill="${PR}" stroke="none"/></g>`
    + `<circle cx="90" cy="80" r="11" fill="${SA}"/><circle cx="90" cy="80" r="7.4" fill="${MI}" stroke-width="1.8"/><path d="M90 76.6v.1M87 81.4v.1M93 81.4v.1" stroke-width="2.2"/>`, 3, 'b'),

  'group-fruit': frame(
    `<path d="M56 40C48 32 28 34 28 56C28 74 42 88 50 86C53 85 54 84 56 84C58 84 59 85 62 86C70 88 84 74 84 56C84 34 64 32 56 40Z" fill="${PD}"/>`
    + `<path d="M36 52A15 15 0 0 1 44 41" stroke="${W}" stroke-width="2.6"/><path d="M56 40C56 34 58 30 61 27"/>` + leaf(58, 32, 17, -28)
    + badge(92, 78, 14, W, 'dates'), 1, 'a'),

  'group-milk': frame(
    `<rect x="45" y="14" width="22" height="9" rx="3" fill="${SA}"/>`
    + `<path d="M47.5 23H64.5V31C64.5 35 76 39 76 50V86C76 90 73 92 69 92H43C39 92 36 90 36 86V50C36 39 47.5 35 47.5 31Z" fill="${W}"/>`
    + `<rect x="36" y="54" width="40" height="20" fill="${MI}"/>` + leaf(46, 64, 12, -20, W)
    + badge(92, 76, 13, BL, 'drop', W), 0, 'b'),

  'group-fat': frame(
    `<path d="M50 18C60 32 74 46 74 62A24 24 0 0 1 26 62C26 46 40 32 50 18Z" fill="${SA}"/><path d="M34 62A16 16 0 0 0 42 76" stroke="${W}" stroke-width="2.6"/>`
    + `<path d="M76 92C82 84 90 78 102 76" stroke-width="2.2"/>` + leaf(86, 82, 15, -100) + leaf(94, 78, 14, 20)
    + `<ellipse cx="80" cy="76" rx="5.6" ry="7.2" transform="rotate(-20 80 76)" fill="${PR}"/><ellipse cx="100" cy="88" rx="5.6" ry="7.2" transform="rotate(30 100 88)" fill="${PR}"/>`
    + `<circle cx="78.6" cy="73.6" r="1" fill="${W}" stroke="none"/><circle cx="99" cy="85.6" r="1" fill="${W}" stroke="none"/>`, 2, 'c'),

  'log-food': frame(plate(52, 58, 32) + salad(52, 58) + badge(90, 30, 14, SA, 'plus'), 0, 'b'),

  water: frame(
    `<path d="M32 26H74L69 88C68.6 91 67 93 64 93H42C39 93 37.4 91 37 88Z" fill="${W}"/>`
    + `<path d="M34.2 50C42 46 48 54 56 50C62 47 66 47 71.8 50L69 88C68.6 91 67 93 64 93H42C39 93 37.4 91 37 88Z" fill="${MI}"/>`
    + `<path d="M42 60V80" stroke="${W}" stroke-width="2.8"/>` + badge(92, 34, 14, BL, 'drop', MI), 1, 'a'),

  steps: frame(
    `<path d="M16 40C36 24 66 22 104 32" stroke-width="3.2" stroke-dasharray="0 8"/>`
    + `<path d="M22 72C21 60 25 50 33 48C39 54 49 56 56 52L80 63C90 65 95 69 94 76Z" fill="${PK}"/>`
    + `<path d="M20 76H94C97 76 99 79 98 82C97.6 84 96 86 94 86H24C21 86 19.6 84 19.4 81.6C19.2 78.6 19.8 76 20 76Z" fill="${W}"/>`
    + `<path d="M42 54L46 50M49 56L53 52" stroke-width="2"/><path d="M26 81H40" stroke="${PK}" stroke-width="2.4"/>`, 3, 'b'),

  activity: frame(
    `<rect x="51" y="16" width="10" height="9" rx="2" fill="${SA}"/><path d="M78 30L82 26" stroke-width="3"/>`
    + `<circle cx="56" cy="58" r="31" fill="${W}"/><circle cx="56" cy="58" r="23" fill="${MI}" stroke-width="2"/>`
    + `<path d="M56 39A19 19 0 0 1 75 58" stroke="${PD}" stroke-width="4.4"/><path d="M56 58L64 46"/><circle cx="56" cy="58" r="2" fill="${O}"/>`
    + badge(90, 82, 12, PK, 'heart', W), 0, 'c'),

  weight: frame(
    `<rect x="22" y="34" width="68" height="58" rx="14" fill="${W}"/>`
    + `<path d="M40 56A16 16 0 0 1 72 56Z" fill="${MI}" stroke-width="2"/><path d="M56 56L62 46" stroke-width="2.2"/>`
    + `<ellipse cx="42" cy="77" rx="7" ry="8" fill="${SA}" stroke-width="2"/><ellipse cx="70" cy="77" rx="7" ry="8" fill="${SA}" stroke-width="2"/>`
    + badge(94, 30, 13, SA, 'leaf', W), 2, 'b'),

  calculator: frame(
    `<rect x="28" y="18" width="50" height="72" rx="9" fill="${W}"/><rect x="36" y="27" width="34" height="14" rx="3" fill="${MI}" stroke-width="2"/>`
    + [38, 50, 62].flatMap((x, i) => [50, 62, 74].map((y, j) => `<rect x="${x - .6}" y="${y}" width="8" height="7.6" rx="2" fill="${(i + j) % 3 === 2 ? PK : BL}" stroke-width="1.8"/>`)).join('')
    + badge(86, 78, 14, PK, 'heart', W), 1, 'a'),

  plan: frame(
    `<rect x="24" y="28" width="62" height="60" rx="9" fill="${W}"/><path d="M24 37C24 32 28 28 33 28H77C82 28 86 32 86 37V44H24Z" fill="${PK}"/>`
    + `<path d="M38 22V33M72 22V33"/>`
    + [[34, 52], [48, 52], [62, 52], [34, 66], [48, 66]].map(([x, y]) => `<rect x="${x}" y="${y}" width="9" height="8" rx="2" fill="${SA}" stroke-width="1.8"/>`).join('')
    + `<rect x="62" y="66" width="9" height="8" rx="2" fill="${PD}" stroke-width="1.8"/>`
    + badge(88, 80, 14, SA, 'leaf', W), 0, 'c'),

  health: frame(
    `<path d="M56 88C30 72 20 56 22 43C24 31 34 24 43 26C49 27.4 53 31.6 56 36C59 31.6 63 27.4 69 26C78 24 88 31 90 43C92 56 82 72 56 88Z" fill="${PK}"/>`
    + `<path d="M28 42A12 12 0 0 1 36 32" stroke="${W}" stroke-width="2.6"/>`
    + `<path d="M28 56H42L47 46L55 68L62 50L66 56H84" stroke-width="2.6"/>`
    + badge(94, 30, 12, SA, 'plus'), 3, 'b'),

  hospital: frame(
    `<path d="M26 92V40C26 37 28 35 31 35H73C76 35 78 37 78 40V92" fill="${W}"/><path d="M18 92H86"/>`
    + `<rect x="44" y="18" width="16" height="16" rx="4" fill="${PK}"/><path d="M52 21.6V30.4M47.6 26H56.4" stroke-width="2.2"/>`
    + [[33, 44], [62, 44], [33, 60], [62, 60]].map(([x, y]) => `<rect x="${x}" y="${y}" width="9" height="9" rx="2" fill="${MI}" stroke-width="1.8"/>`).join('')
    + `<path d="M44 92V78C44 76 46 74 48 74H56C58 74 60 76 60 78V92" fill="${SA}"/>`
    + `<circle cx="92" cy="74" r="15" fill="${W}"/><circle cx="92" cy="74" r="9.4" fill="${BL}" stroke-width="2"/>` + leaf(86.6, 76, 9.6, -35) + `<circle cx="95" cy="71.6" r="3" fill="${PD}" stroke-width="1.8"/>`, 2, 'a'),

  ideas: frame(
    bowl(48, 66, 60, 26, SA, 12) + `<circle cx="42" cy="58" r="5" fill="${PD}" stroke-width="2"/>` + leaf(50, 60, 12, -40, MI)
    + `<path d="M90 18A13 13 0 0 1 97.4 41.6V47H82.6V41.6A13 13 0 0 1 90 18Z" fill="${W}"/><rect x="83.6" y="47" width="12.8" height="6" rx="2" fill="${SA}"/>`
    + `<path d="M87 36L90 31L93 36" stroke-width="2"/><path d="M90 8V4M104 14L107 11M76 14L73 11M108 28H112M72 28H68" stroke-width="2"/>`, 0, 'b'),

  shopping: frame(
    leaf(40, 46, 20, -70) + `<circle cx="66" cy="40" r="10" fill="${PD}"/><path d="M66 30C66 27 68 25 70 24" stroke-width="2"/>`
    + `<rect x="74" y="26" width="10" height="24" rx="3" fill="${SA}"/>`
    + `<path d="M26 54H94L86 88C85.4 90.4 83.6 92 81 92H39C36.4 92 34.6 90.4 34 88Z" fill="${PK}"/>`
    + `<rect x="20" y="48" width="80" height="9" rx="4.5" fill="${W}"/><path d="M46 64L47.6 84M60 64V84M74 64L72.4 84" stroke-width="2"/>`
    + `<path d="M30 48L44 24M90 48L82 30" stroke-width="2.4"/>`, 1, 'c'),

  readings: frame(
    `<rect x="22" y="24" width="64" height="58" rx="9" fill="${W}"/><path d="M31 72H77" stroke="${SA}" stroke-width="2.6"/>`
    + `<path d="M31 62L43 50L53 56L65 40L77 46" stroke-width="2.4"/>`
    + [[43, 50], [53, 56], [65, 40]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3" fill="${PK}" stroke-width="1.8"/>`).join('')
    + badge(88, 78, 14, PK, 'drop', W), 3, 'a'),

  assessment: frame(
    `<rect x="28" y="20" width="54" height="72" rx="9" fill="${SA}"/><rect x="35" y="30" width="40" height="55" rx="4" fill="${W}" stroke-width="2"/>`
    + `<rect x="45" y="15" width="20" height="10" rx="4" fill="${W}"/>`
    + [42, 56, 70].map((y, i) => `<rect x="40" y="${y - 3.6}" width="7.2" height="7.2" rx="2" fill="${i < 2 ? PK : W}" stroke-width="1.8"/><path d="M52 ${y}H${i === 1 ? 64 : 69}" stroke-width="2"/>`).join('')
    + badge(88, 80, 14, SA, 'check'), 0, 'b'),

  'empty-diary': frame(
    plate(60, 56, 30)
    + `<path d="M22 22V36M17 22V33C17 38 27 38 27 33V22M22 37V88"/>`
    + `<path d="M98 88V22C104 28 105 42 98 50"/>`, 2, 'a') .replace('</svg>', `<path d="${spark(60, 56, 4)}" fill="none" stroke="${PK}" stroke-width="2.4" stroke-linecap="round"/></svg>`),

  'empty-readings': frame(
    `<rect x="22" y="22" width="68" height="60" rx="9" fill="${W}"/><path d="M33 32V71H80" stroke-width="2.2"/>`
    + `<path d="M40 58H76" stroke="${PD}" stroke-width="2.6" stroke-dasharray="4 6"/>`
    + badge(90, 80, 13, SA, 'plus'), 1, 'b'),

  'empty-requests': frame(
    `<rect x="40" y="22" width="40" height="34" rx="4" fill="${BL}" stroke-width="2"/><path d="M48 32H72M48 40H66" stroke-width="2"/>`
    + `<path d="M20 44L60 70L100 44V84C100 87 98 89 95 89H25C22 89 20 87 20 84Z" fill="${W}"/>`
    + `<path d="M20 44C20 41 22 40 25 40" fill="none"/><path d="M20 86L48 64M100 86L72 64" stroke-width="2"/>`
    + `<path d="M20 44L60 70L100 44" fill="none"/>`, 0, 'c'),

  'empty-search': frame(
    `<path d="M66 64L88 86" stroke-width="11"/><path d="M66 64L88 86" stroke="${PK}" stroke-width="6"/>`
    + `<circle cx="50" cy="46" r="24" fill="${W}"/><circle cx="50" cy="46" r="17" fill="${MI}" stroke-width="2"/><path d="M40 40A11 11 0 0 1 47 33" stroke="${W}" stroke-width="2.6"/>`
    + `<path d="M24 84L29 80L34 82L33 88L27 89Z" fill="${RO}" stroke-width="2"/><circle cx="40" cy="90" r="1.6" fill="${RO}" stroke-width="1.6"/>`, 3, 'a'),

  'empty-generic': frame(
    `<path d="M30 50L60 40L54 24L24 34Z" fill="${W}"/><path d="M60 40L90 50L96 34L66 24Z" fill="${W}"/>`
    + `<path d="M30 50L60 40L90 50L60 60Z" fill="${PD}"/>`
    + `<path d="M30 50L60 60V92L30 82Z" fill="${PK}"/><path d="M60 60L90 50V82L60 92Z" fill="${RO}"/>`
    + `<path d="M60 60L90 50L102 60L72 70Z" fill="${W}"/>`, 1, 'c'),

  welcome: frame(
    palmBowl(-10)
    + `<path d="M84 22C88 26 88 32 85 36M90 16C96 22 96 34 91 40" stroke-width="2.2"/>`
    + badge(92, 76, 13, PK, 'heart', W), 0, 'c'),

  login: frame(
    `<rect x="34" y="16" width="42" height="76" rx="9" fill="${W}"/><rect x="40" y="26" width="30" height="56" rx="3" fill="${MI}" stroke-width="2"/><path d="M51 21H59" stroke-width="2"/>`
    + `<path d="M50 52V46A5 5 0 0 1 60 46V52" stroke-width="2.2"/><rect x="46" y="51" width="18" height="15" rx="3.4" fill="${PK}" stroke-width="2.2"/><path d="M55 56.6V60.4" stroke-width="2.2"/>`
    + badge(86, 78, 13, SA, 'leaf', W), 2, 'b'),

  'not-found': frame(
    `<path d="M22 34L42 27V79L22 86Z" fill="${W}"/><path d="M42 27L64 34V86L42 79Z" fill="${MI}"/><path d="M64 34L86 27V79L64 86Z" fill="${W}"/>`
    + `<path d="M29 72C38 62 48 68 54 58C60 48 70 54 77 44" stroke="${PD}" stroke-width="2.6" stroke-dasharray="3 5"/>`
    + `<path d="M77 36l-4 4M73 36l4 4" stroke-width="2.2"/>`
    + badge(92, 78, 14, PK, 'question'), 0, 'a'),

  error: frame(
    plate(56, 56, 32)
    + `<path d="M36 34L40 40L37 46" stroke-width="2"/>`
    + `<g transform="rotate(-32 56 56)"><rect x="26" y="48" width="60" height="16" rx="8" fill="${PK}"/><rect x="47" y="48" width="18" height="16" fill="${RO}" stroke-width="2"/>`
    + `<path d="M51 53v.1M56 53v.1M61 53v.1M51 59v.1M56 59v.1M61 59v.1" stroke-width="2"/></g>`, 3, 'c'),

  forbidden: frame(
    `<path d="M56 18L84 28V50C84 68 72 82 56 90C40 82 28 68 28 50V28Z" fill="${SA}"/><path d="M56 26L77 33.6V50C77 63 68 74 56 81" stroke="${W}" stroke-width="2.4"/>`
    + `<path d="M50 52V45A6 6 0 0 1 62 45V52" stroke-width="2.4"/><rect x="45" y="51" width="22" height="18" rx="4" fill="${W}"/><circle cx="56" cy="59" r="2" fill="${O}" stroke-width="1.4"/><path d="M56 61V64"/>`
    + badge(92, 76, 12, PK, 'heart', W), 1, 'b'),
};

/** The SVG markup of an illustration (aria-hidden; the caller gives the text). */
export function illustrationSvg(name: IllustrationName): string {
  return DRAWINGS[name] ?? DRAWINGS['empty-generic'];
}
