// Generated food illustrations in Mizan's "Tiny world" style. Each recipe has an
// `art` spec (vessel, base, items) and is drawn as a little 3/4-view scene: the
// plate, bowl, tray or glass shows its rim and side, one fine indigo outline,
// frame colours from the palette (lavender, sky, cream, white) and the food in
// its real colours, with a few happy details (clouds, sparkles, flowers, steam).
// If a real photograph is listed in photos.js it is used instead.
//
// Output is deterministic: the same meal always gives the same SVG (seeded from
// the id, no Math.random or Date) and every number is rounded to one decimal,
// so server and browser render identical markup.

import { PHOTOS, HERO_PHOTO } from './photos.js';

const hash = (s) => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
const rng = (seed) => () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const f = (n) => Math.round(n * 10) / 10;

// ---------------------------------------------------------------- style
const OL = '#2E2A86'; // the one outline colour (ink)
const VSW = 2.4; // vessel outline
const ISW = 1.6; // item outline
// Stroke multiplier while a dish is drawn scaled down to make room for sides,
// so outlines keep their weight. Set per scene; rendering is synchronous.
let SWK = 1;
const sw = (w) => f(w * SWK);
// Mizan palette (frames only; food keeps its own colours).
const PAL = { white: '#FFFFFF', cream: '#FBF8F3', muted: '#F3EFE8', lav: '#EEEDFA', lav2: '#DCD9F7', lav3: '#C9C4F2', sky: '#E3F1FA', sky2: '#BFE3F7', indigo: '#3730A3', violet: '#8B7CF6', gold: '#E0A23B', water: '#6EC3EE', waterTop: '#A9DDF6', bone: '#FBF3E4' };

// category → [background, ground]
const SCENE = {
  breakfast: [PAL.cream, PAL.sky],
  lunch: [PAL.lav, PAL.sky],
  dinner: [PAL.sky, PAL.lav],
  snack: [PAL.lav, PAL.muted],
};

// Food surfaces: flat fill plus a texture drawn by texture().
const BASES = {
  oats: { fill: '#E9D3A8', c: '#C9A56A', c2: '#F7E8C8', tex: 'flakes' },
  'tomato-sauce': { fill: '#D9452F', c: '#B8341F', oil: '#F2A93B', tex: 'sauce' },
  'beans-brown': { fill: '#A8693A', c: '#7E4A24', c2: '#C4864F', tex: 'beans' },
  yogurt: { fill: '#FFFFFF', c: '#E9E2D6', tex: 'swirl' },
  'tofu-scramble': { fill: '#F6D35B', c: '#E0B23E', c2: '#FBE69A', tex: 'curds' },
  quinoa: { fill: '#EFDDB3', c: '#CDAE72', c2: '#FFF8E8', tex: 'seeds' },
  'soup-orange': { fill: '#F0A04B', c: '#D9822E', oil: '#F7C85E', tex: 'soup' },
  greens: { fill: '#8FD18A', c: '#5EAE5E', tex: 'leaves' },
  'rice-brown': { fill: '#D9A066', c: '#B0773E', c2: '#F3D2A2', spice: '#7A4A2A', tex: 'rice' },
  noodles: { fill: '#F2D88E', c: '#D9B45E', c2: '#FBEBB8', tex: 'strands' },
  herbs: { fill: '#7CC47A', c: '#4E9E56', tex: 'leaves' },
  chili: { fill: '#B8442E', c: '#8E3020', chunk: '#8E4A30', oil: '#E8A23B', tex: 'stew' },
  curry: { fill: '#E9A93A', c: '#C9862A', oil: '#F6CE6A', tex: 'soup' },
  'rice-spiced': { fill: '#E9A45A', c: '#C77F38', c2: '#FBE2B4', spice: '#94521E', tex: 'rice' },
  pasta: { fill: '#F2CF7E', c: '#D9AD52', c2: '#FBE6B0', tex: 'strands' },
  couscous: { fill: '#F2D58E', c: '#D8B25E', c2: '#FFF1C8', tex: 'grains' },
  bulgur: { fill: '#D9B57A', c: '#B38A4C', c2: '#F0DDB2', tex: 'grains' },
  chia: { fill: '#EDE6DE', c: '#4A4442', tex: 'specks' },
  'smoothie-tan': { fill: '#E8C99A', c: '#D2AD76', tex: 'bubbles' },
  jareesh: { fill: '#EADFC8', c: '#CDBB98', c2: '#FAF4E6', pool: '#F2C04B', tex: 'porridge' },
  saleeg: { fill: '#FBF6EC', c: '#E6D6B4', c2: '#FFFFFF', tex: 'creamy' },
  'stew-red': { fill: '#C9553E', c: '#A63E2B', chunk: '#9A5A3C', oil: '#EBA24A', tex: 'stew' },
  porridge: { fill: '#E8D5B0', c: '#CDB386', c2: '#F8EEDA', pool: '#E9B44A', tex: 'porridge' },
  'rice-yellow': { fill: '#F2C27A', c: '#E8A452', c2: '#FFF3D6', spice: '#6B3A2E', tex: 'rice' },
  laban: { fill: '#FFFFFF', c: '#B9C79A', tex: 'specks' }, // cardamom
  // a flatbread (lahouh) served on a plate
  bread: { fill: '#E8B567', c: '#B9782F', c2: '#F6D9A0', tex: 'bread' },
  none: null,
};
// Grain bases piled as a dome on a plate or tray (as kabsa is served).
const MOUND = new Set(['rice-yellow', 'rice-spiced', 'rice-brown', 'couscous', 'bulgur', 'quinoa', 'saleeg']);
// Hot dishes get rising steam.
const HOT_BASES = new Set(['tomato-sauce', 'beans-brown', 'tofu-scramble', 'soup-orange', 'rice-brown', 'chili', 'curry', 'rice-spiced', 'pasta', 'couscous', 'bulgur', 'jareesh', 'saleeg', 'stew-red', 'porridge', 'rice-yellow']);
const HOT_ITEMS = new Set(['salmon', 'chicken-breast', 'fish-white', 'fish-red', 'egg-fried', 'stuffed-pepper']);
const COLD_ID = /salad|parfait|overnight|pudding|smoothie|hummus/;

// ---------------------------------------------------------------- path helpers
const P = (x, y) => `${f(x)} ${f(y)}`;
const circ = (x, y, a) => `M${P(x - a, y)}a${f(a)} ${f(a)} 0 1 0 ${f(2 * a)} 0a${f(a)} ${f(a)} 0 1 0 ${f(-2 * a)} 0`;
const ell = (x, y, a, b, rot) => { const c = Math.cos(rot); const s = Math.sin(rot); const d = f(rot * 180 / Math.PI); return `M${P(x - c * a, y - s * a)}A${f(a)} ${f(b)} ${d} 1 0 ${P(x + c * a, y + s * a)}A${f(a)} ${f(b)} ${d} 1 0 ${P(x - c * a, y - s * a)}`; };
const grain = (x, y, a, L) => { const c = Math.cos(a) * L / 2; const s = Math.sin(a) * L / 2; return `M${P(x - c, y - s)}q${f(c + s * .6)} ${f(s - c * .6)} ${f(2 * c)} ${f(2 * s)}`; };
const arcAt = (cx, cy, rx, ry, a0, a1) => `M${P(cx + Math.cos(a0) * rx, cy + Math.sin(a0) * ry)}A${f(rx)} ${f(ry)} 0 0 1 ${P(cx + Math.cos(a1) * rx, cy + Math.sin(a1) * ry)}`;
const quad = (x, y, a, rot) => { let d = ''; for (let i = 0; i < 4; i++) { const t = rot + i * Math.PI / 2 + Math.PI / 4; d += `${i ? 'L' : 'M'}${P(x + Math.cos(t) * a, y + Math.sin(t) * a)}`; } return `${d}Z`; };
const path = (d, attrs) => (d ? `<path d="${d}" ${attrs}/>` : '');
const E = (cx, cy, rx, ry, attrs) => `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" ${attrs}/>`;
/** A round slab at 3/4: side of depth `d` under a top ellipse. */
const isoDisc = (cx, cy, rx, ry, d, top, side, w) => {
  const a = w ? ` stroke-width="${w}"` : '';
  return `<path d="M${P(cx - rx, cy)}v${f(d)}a${f(rx)} ${f(ry)} 0 0 0 ${f(2 * rx)} 0v${f(-d)}" fill="${side}"${a}/>${E(cx, cy, rx, ry, `fill="${top}"${a}`)}`;
};

/** Points inside an ellipse at least `md` apart (fewer when it is full). */
function spread(r, n, cx, cy, rx, ry, md, k = .8) {
  const out = [];
  for (let t = 0; out.length < n && t < n * 30; t++) {
    const a = r() * Math.PI * 2; const d = Math.sqrt(r()) * k;
    const x = cx + Math.cos(a) * d * rx; const y = cy + Math.sin(a) * d * ry;
    if (out.every(([px, py]) => Math.hypot(px - x, py - y) >= md)) out.push([x, y]);
  }
  return out;
}

// ---------------------------------------------------------------- item shapes (local units, centred on 0,0)
// Each takes a variant number so repeated pieces can differ a little.
const n1 = (v) => f(v);
const hiDot = (x, y, rx, ry, c = '#FFFFFF') => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${c}" stroke="none"/>`;
const ball = (r, fill, hi) => `<circle r="${r}" fill="${fill}"/>${hi ? `<circle cx="${n1(-r * .36)}" cy="${n1(-r * .36)}" r="${n1(r * .3)}" fill="${hi}" stroke="none"/>` : ''}`;
// a slice lying flat, seen at 3/4 (top ellipse over a thin side)
const slice = (r, top, side, inner, d = 2) => `<path d="M${-r} 0v${d}a${r} ${n1(r * .5)} 0 0 0 ${2 * r} 0v${-d}" fill="${side}"/><ellipse rx="${r}" ry="${n1(r * .5)}" fill="${top}"/>${inner ? `<ellipse rx="${n1(r * .64)}" ry="${n1(r * .3)}" fill="${inner}" stroke="none"/>` : ''}`;
const cube = (a, fill, hi) => `<rect x="${n1(-a / 2)}" y="${n1(-a / 2)}" width="${a}" height="${a}" rx="${n1(a * .26)}" fill="${fill}"/>${hi ? `<path d="M${n1(-a * .26)} ${n1(-a * .2)}h${n1(a * .3)}" stroke="${hi}" stroke-width="1.2"/>` : ''}`;
const bean = (rx, ry, fill, hi) => `<ellipse rx="${rx}" ry="${ry}" fill="${fill}"/>${hi ? `<ellipse cx="${n1(-rx * .3)}" cy="${n1(-ry * .3)}" rx="${n1(rx * .3)}" ry="${n1(ry * .24)}" fill="${hi}" stroke="none"/>` : ''}`;
const stick = (w, l, fill) => `<rect x="${n1(-w / 2)}" y="${n1(-l / 2)}" width="${w}" height="${l}" rx="${n1(w / 2)}" fill="${fill}"/>`;
const leafShape = (len, fill) => `<path d="M${n1(-len / 2)} 0C${n1(-len * .2)} ${n1(-len * .36)} ${n1(len * .2)} ${n1(-len * .36)} ${n1(len / 2)} 0C${n1(len * .2)} ${n1(len * .36)} ${n1(-len * .2)} ${n1(len * .36)} ${n1(-len / 2)} 0ZM${n1(-len * .34)} 0H${n1(len * .18)}" fill="${fill}"/>`;
// leaf with side veins (for leaves of 12 units and longer)
const leafV = (len, fill, vein) => `${leafShape(len, fill)}<path d="M${n1(-len * .14)} 0l${n1(len * .12)} ${n1(-len * .15)}M${n1(-len * .14)} 0l${n1(len * .12)} ${n1(len * .15)}M${n1(len * .06)} 0l${n1(len * .1)} ${n1(-len * .11)}M${n1(len * .06)} 0l${n1(len * .1)} ${n1(len * .11)}" stroke="${vein}" stroke-width="1"/>`;
const crescent = (w, fill, hi) => `<path d="M${-w} 2C${n1(-w * .7)} ${n1(-w * .8)} ${n1(w * .7)} ${n1(-w * .8)} ${w} 2C${n1(w * .5)} ${n1(-w * .24)} ${n1(-w * .5)} ${n1(-w * .24)} ${-w} 2Z" fill="${fill}"/>${hi ? `<path d="M${n1(-w * .5)} -1.6Q0 ${n1(-w * .5)} ${n1(w * .5)} -1.6" stroke="${hi}" stroke-width="1.2"/>` : ''}`;
const halfDisc = (r, rind, flesh, pith) => `<path d="M${-r} 0A${r} ${r} 0 0 1 ${r} 0Z" fill="${rind}"/><path d="M${n1(-r * .74)} -.8A${n1(r * .74)} ${n1(r * .74)} 0 0 1 ${n1(r * .74)} -.8Z" fill="${pith}" stroke="none"/><path d="M${n1(-r * .62)} -1.2A${n1(r * .62)} ${n1(r * .62)} 0 0 1 ${n1(r * .62)} -1.2Z" fill="${flesh}" stroke="none"/><path d="M0-1V${n1(-r * .56)}M0-1L${n1(-r * .44)} ${n1(-r * .36)}M0-1L${n1(r * .44)} ${n1(-r * .36)}" stroke="${pith}" stroke-width="1.1"/>`;
const FILLET = 'M-24 3C-24-10-6-14 12-11C24-9 27 4 20 9C10 16-24 17-24 3Z';
// a fillet with a little thickness (its side shows below)
const fillet = (top, side) => `<path d="${FILLET}" transform="translate(0 3)" fill="${side}"/><path d="${FILLET}" fill="${top}"/>`;
const dome = (rx, h, fill) => `<path d="M${-rx} 0C${-rx} ${n1(-h * 1.3)} ${rx} ${n1(-h * 1.3)} ${rx} 0C${n1(rx * .6)} ${n1(rx * .26)} ${n1(-rx * .6)} ${n1(rx * .26)} ${-rx} 0Z" fill="${fill}"/>`;
const wedge = (d, fill) => `<path d="${d}" fill="${fill}"/>`;
const dots = (d, c, w = 1.4) => `<path d="${d}" stroke="${c}" stroke-width="${w}"/>`;

const ITEMS = {
  blueberry: () => `${ball(4.2, '#4F6BB8', '#8FA6E0')}<path d="M.8 1.8h1.8" stroke="#2F4580" stroke-width="1"/>`,
  strawberry: () => `<path d="M0 7C-7 3-7-4-3-5.6C-1-6.2 1-6.2 3-5.6C7-4 7 3 0 7Z" fill="#E23C4A"/><path d="M-4-5.4L0-8.4L4-5.4" fill="#3E9B57" stroke-width="1.2"/>${dots('M-2.6-2v.1M2.2-1v.1M0 3v.1M-2.6 1.6v.1M2.6 2.4v.1M0-.4v.1', '#FBE3A0')}${hiDot(-2.6, -3.4, 1.2, .8, '#F58A92')}`,
  raspberry: () => `${ball(4.6, '#D9335A')}${dots('M-2-1.6v.1M2-2v.1M0 1.8v.1M-2.6 1.6v.1M2.6 1.2v.1M0-3v.1', '#F07A92')}`,
  mint: () => `<g stroke-width="1.2">${leafV(12, '#6CC07A', '#3E9B57')}</g>`,
  herb: () => `<g stroke="#2F7F3E" stroke-width=".9">${leafShape(9, '#5DB36A')}</g>`,
  basil: () => `<g stroke-width="1.2">${leafV(13, '#4FA85A', '#2F7F3E')}</g>`,
  spinach: () => `<g stroke-width="1.2">${leafV(16, '#3F9150', '#2A6E3A')}</g>`,
  'egg-fried': () => `<path d="M-12-3C-12-11-4-13 2-11C9-13 14-7 12-1C14 6 8 12 1 10C-6 13-13 7-12-3Z" fill="#FFFFFF"/><circle r="5" fill="#F6B93B"/><path d="M-2.6-1.6A3 3 0 0 1 .4-3" stroke="#FCE3A0" stroke-width="1.4"/>`,
  'egg-half': () => `<ellipse rx="9" ry="7" fill="#FFFFFF"/><circle r="4.4" fill="#F6B93B"/><path d="M-2.4-1.2A2.6 2.6 0 0 1 0-2.6" stroke="#FCE3A0" stroke-width="1.2"/>${dots('M-6 3v.1M5-4v.1', '#C9402E', 1.3)}`,
  'egg-muffin': () => `<path d="M-10 0v6a10 4.6 0 0 0 20 0v-6" fill="#D9A24E"/><path d="M-10 0C-10-9 10-9 10 0C6 3-6 3-10 0Z" fill="#F2CF7E"/>${dots('M-4-3v.1M4-2v.1M0-5v.1', '#3E9B57', 2.4)}${dots('M2-4.6v.1M-5-.6v.1', '#E2513E', 2.4)}<path d="M-6 3v4M-2 3.6v4M2 3.6v4M6 3v4" stroke="#B9782F" stroke-width="1"/>`,
  'tomato-dice': () => cube(6, '#E2513E', '#F4A08F'),
  'tomato-cherry': (v) => `${ball(5.6, '#E2513E', '#F4A08F')}${v % 2 ? '' : '<path d="M-2.2-4.6L0-3.4L2.2-4.6M0-3.4V-6" stroke="#3E9B57" stroke-width="1.3"/>'}`,
  'tomato-slice': () => `${slice(8.6, '#E2513E', '#B8341F', '#F08A73')}${dots('M-3.4-.6v.1M3.2.4v.1M0 1.4v.1M-1.4-1.6v.1M1.8-1.6v.1', '#FBE3A0', 1.4)}`,
  'pepper-red': () => crescent(7, '#E2402E', '#F4907F'),
  'pepper-green': () => crescent(7, '#5FAE3E', '#A9DB7E'),
  'pepper-strip': () => `${stick(4.6, 24, '#E2402E')}<path d="M-.6-8V6" stroke="#F4907F" stroke-width="1.1"/>`,
  cucumber: () => `${slice(6.6, '#B9E08E', '#5E9E3F', '#DDEFC0', 1.8)}${dots('M-1.8 0v.1M1.8 0v.1M0-.8v.1', '#8DBB62', 1.2)}`,
  'cucumber-stick': () => `${stick(6, 26, '#DDEFC0')}<path d="M2-11V11" stroke="#5E9E3F" stroke-width="2"/>${dots('M-1-6v.1M-1 0v.1M-1 6v.1', '#A9CF8E', 1.3)}`,
  chickpea: () => `${ball(4, '#E8C07A', '#F6DDA8')}<path d="M-.6-2.8Q1.8 0 0 2.8" stroke="#C99A4E" stroke-width=".9"/>`,
  'chickpea-roasted': () => `${ball(4.2, '#C98A3E', '#E3AE6A')}<path d="M-.6-2.8Q1.8 0 0 2.8" stroke="#94521E" stroke-width=".9"/>${dots('M1.6 1.2v.1', '#C9402E', 1.2)}`,
  'bean-black': () => `${bean(3.8, 2.4, '#3E3650')}<path d="M-1 .2h2" stroke="#9A92B4" stroke-width="1"/>`,
  'bean-red': () => bean(4, 2.6, '#9E2F3A', '#C9606A'),
  'bean-white': () => bean(4, 2.6, '#F6EEDC', '#FFFFFF'),
  edamame: () => `<path d="M-7 0C-7-3.6 7-3.6 7 0C7 3.6-7 3.6-7 0Z" fill="#7DBE4E"/><path d="M-3.4-.2v.1M0-.2v.1M3.4-.2v.1" stroke="#B5DE8A" stroke-width="2.2"/>`,
  feta: () => `${cube(7, '#FFFFFF')}${dots('M-1.6-1.4v.1M1.8.6v.1M-.6 2v.1', '#E8E0D0', 1.2)}`,
  'onion-ring': () => `<circle r="5.4" stroke="#A65A9A" stroke-width="2.2"/><circle r="2.8" stroke="#D9A6CF" stroke-width="1.2"/>`,
  avocado: () => `<path d="M-11 3C-7-7 7-7 11 3C7 .6-7 .6-11 3Z" fill="#B9D97A"/><path d="M-9 1.4C-5-5 5-5 9 1.4" stroke="#3E6B2A" stroke-width="1.8"/><path d="M-4-1.6Q0-3 4-1.6" stroke="#DCEBBE" stroke-width="1.2"/>`,
  'avocado-mash': () => `<path d="M-16-2C-16-12 12-14 16-4C19 6 10 13 0 13C-10 13-16 7-16-2Z" fill="#A8CF6A"/><path d="M-10-2Q-4-6 2-3M-4 6Q3 3 9 6" stroke="#86B04A" stroke-width="1.4"/>${dots('M-6-6v.1M6 1v.1M-2 9v.1', '#D2302A', 1.8)}`,
  toast: () => { const d = 'M-20-12C-20-22-10-24-6-20C-2-25 8-25 10-20C17-23 21-16 20-10V18C20 20 19 21 17 21H-17C-19 21-20 20-20 18Z'; return `<path d="${d}" transform="translate(0 3)" fill="#B9782F"/><path d="${d}" fill="#D9973F"/><path d="M-15.6-9C-15.6-16.6-8.4-18-5-15C-2-18.6 6-18.6 7.6-15C13-17 16.6-12 15.6-7.6V15.6H-15.6Z" fill="#F2CE8C" stroke="none"/>${dots('M-9-8v.1M4-11v.1M10 0v.1M-3 3v.1M-11 10v.1M6 11v.1M-5-2v.1M11 13v.1', '#D9A85A', 2)}`; },
  pita: () => `${wedge('M-8 6L14-4A17 17 0 0 1 9 12Z', '#E8BE7A')}<path d="M-3 5L11-1.6A13 13 0 0 1 8 8.6" stroke="#D9A85A" stroke-width="1.1"/>${dots('M8 3v.1M11 7v.1', '#B9782F', 1.8)}`,
  'pita-chip': () => `${wedge('M-5 4L0-6L5 4Z', '#E3AE5E')}${dots('M0 0v.1M-2 2.6v.1', '#B9782F', 1.5)}`,
  // grilled chicken pieces: browned chunks with grill marks
  chicken: (v) => `<path d="${v % 2 ? 'M-9-5C-5-8 6-8 9-4.6C11.4-1.6 10.6 3.4 7.6 6C3 8.6-5 8.4-8.6 5.4C-11.4 2.6-11.6-2.4-9-5Z' : 'M-10-3.6C-8-7.6 4-8.4 8.6-5.6C11.6-3.4 11 3 8 5.6C3.6 8.4-5.4 8-8.8 5C-11 2.8-11.4-.6-10-3.6Z'}" fill="#C97A34"/><path d="M-6-4.6L-2 5.4M-1-6L3 5.4M4-5.4L7.4 3.4" stroke="#7E4218" stroke-width="1.7"/><path d="M-7.6-2.6q3-3.6 8-4" stroke="#E9A85E" stroke-width="1.5"/>${hiDot(-6, -3.6, 1.2, .7)}`,
  'chicken-breast': () => `${fillet('#D9954A', '#A8642A')}<path d="M-16-6L-19 8M-6-9L-9 10M4-9.6L1 10.8M13-7.6L10 9.4" stroke="#7E4218" stroke-width="2.2"/><path d="M-12-8.6C-6-11 4-12 11-10" stroke="#F0BE7A" stroke-width="1.6"/>${dots('M-11 2v.1M7 4v.1M17 0v.1', '#3E9B57', 2)}`,
  tuna: () => `<path d="M-6 0C-5-5 5-5 6 0C4 4.4-4 4.4-6 0Z" fill="#E9C3A4"/><path d="M-2.6-1.6q2 1.6 0 3.4M1.4-2q2 2 0 4" stroke="#C99A7A" stroke-width="1"/>`,
  salmon: () => `${fillet('#F48A5E', '#D9653E')}<path d="M-16-6.6q-3 7 0 14.6M-7-8.6q-3 8.4 0 17.6M2-9.4q-3 9 0 18.4M11-8q-3 7.4 0 15" stroke="#FCD0BA" stroke-width="1.6"/>${hiDot(-14, -6, 2.4, 1)}`,
  'fish-white': () => `${fillet('#F2D49A', '#C98A3E')}<path d="M-22-2C-18-10-2-13 12-10" stroke="#D9953E" stroke-width="3.2"/><path d="M-13-2.6q3.4 4.4 0 9M-4-4q3.4 5 0 10.6M5-4q3.4 4.4 0 9.4" stroke="#F8E6C4" stroke-width="1.4"/>${hiDot(-12, -7, 2.4, .9)}${dots('M-16 6v.1M12 1v.1', '#3E9B57', 2)}`,
  'fish-red': () => `${fillet('#D9533A', '#A63E2B')}<path d="M-21-3C-16-10-2-13 13-10" stroke="#F08A63" stroke-width="2.2"/><path d="M-10 0v.1M2 4v.1M12-2v.1" stroke="#3E9B57" stroke-width="2.8"/>${dots('M-15 5v.1M-3-4v.1M8 7v.1M17 3v.1', '#8E3020', 1.6)}`,
  shrimp: () => `<path d="M5-5A7 7 0 1 1-5 4.6" stroke-width="7.2"/><path d="M5-5A7 7 0 1 1-5 4.6" stroke="#F5835A" stroke-width="3.8"/><path d="M-5 4.6L-9.4 6.6L-7 2.4Z" fill="#E9653E" stroke-width="1.1"/><path d="M7.4 1.4L4.6.6M3.6 6.4L2 4.2M-1.6 7L-.8 4.6" stroke="#FBB596" stroke-width="1"/>`,
  mango: () => cube(7, '#F6B43B', '#FCD98A'),
  lemon: () => halfDisc(9, '#F6D35B', '#FBEB9C', '#FFFBE6'),
  lime: () => halfDisc(9, '#7DBE3E', '#C9E78A', '#F1F9E4'),
  walnut: () => `<path d="M-6 0C-6-5.4-1.4-6 0-3.4C1.4-6 6-5.4 6 0C6 4.8 1.4 6 0 3.4C-1.4 6-6 4.8-6 0Z" fill="#B9844E"/><path d="M0-3.4V3.4" stroke-width="1"/><path d="M-4-1.6q1.6 1.4 0 3.2M4-1.6q-1.6 1.4 0 3.2" stroke="#8A5A2E" stroke-width="1"/>`,
  almond: () => `<path d="M0-5C3.6-2.2 3-4 3 0C3 3.6 1.4 5 0 5C-1.4 5-3 3.6-3 0C-3-4-3.6-2.2 0-5Z" fill="#C98A55"/><path d="M0-2.6V2.4" stroke="#9A6234" stroke-width="1"/>`,
  peanut: () => `<path d="M-6.4 0A3.6 3.6 0 0 1-1.2-3.2A1.6 1.6 0 0 0 1.2-3.2A3.6 3.6 0 1 1 1.2 3.2A1.6 1.6 0 0 0-1.2 3.2A3.6 3.6 0 0 1-6.4 0Z" fill="#D9A866"/>${dots('M-3.6-1v.1M-3.2 1.4v.1M3.4-1v.1M3.6 1.4v.1', '#B07C3E', 1.2)}`,
  banana: () => `${slice(5.6, '#FBEFC0', '#E9CE6E', null, 1.6)}${dots('M-1.2-.4v.1M1.2-.4v.1M0 .8v.1', '#B89A4E', 1.1)}`,
  'apple-slice': () => `<path d="M-12 3C-9-8 9-8 12 3C8 6-8 6-12 3Z" fill="#D93B33"/><path d="M-9.6 3.2C-7-3.6 7-3.6 9.6 3.2C6 5-6 5-9.6 3.2Z" fill="#FBF0D8" stroke="none"/>${dots('M-1.6 0v.1M1.6 0v.1', '#6B3A2E', 1.8)}${hiDot(-6, -3.4, 2, .8, '#F07A6E')}`,
  'nut-butter': () => `${slice(14, '#FFFFFF', '#DCD9F7', null, 6)}<ellipse cy=".4" rx="10.6" ry="5" fill="#C98A4E" stroke-width="1.4"/><path d="M-5 .6Q-1-2.6 4-.4" stroke="#A86A32" stroke-width="1.4"/>${hiDot(-4, -1.4, 2, .8, '#E9B57A')}`,
  date: (v) => `<ellipse rx="9" ry="4.6" fill="#7A3E2E"/><path d="${v % 2 ? 'M-5.4-1.6q2.6-1.4 5.4-.4M-2 1.8q3 .8 6-.8' : 'M-4.6-1q3-1.8 6-.6M-5 2q2.6.6 5-.4M3 1.4l3-1'}" stroke="#A0574A" stroke-width="1.1"/><ellipse cx="-4" cy="-2.2" rx="2.2" ry=".9" fill="#B86A5A" stroke="none"/>`,
  popcorn: () => `<path d="M-5 3A3.8 3.8 0 0 1-4-4A4.4 4.4 0 0 1 4-4A3.8 3.8 0 0 1 5 3A4 4 0 0 1-5 3Z" fill="#FFF8E6"/><path d="M-1.4-3.4q1.6 2 0 3.6M2.4-1.6q-1 1.8.6 3.4" stroke="#EAD39A" stroke-width="1"/>`,
  tofu: () => `${cube(9, '#F7EDD6')}<path d="M-4.5 2.6h9" stroke="#E9C27A" stroke-width="2.4"/><path d="M-3-1.6l2.4-2.4" stroke="#E2C996" stroke-width="1.2"/>`,
  broccoli: () => `<rect x="-1.9" y="0" width="3.8" height="7" rx="1.9" fill="#A9D47F"/><path d="M-7 1A3.6 3.6 0 0 1-5-5A4 4 0 0 1 3-6.4A3.8 3.8 0 0 1 7 1Z" fill="#3E9B57"/>${dots('M-4-2v.1M0-4v.1M3-1v.1M-1-.6v.1M4.4-4v.1', '#6CC07A', 1.8)}`,
  'snow-pea': () => `<path d="M-9 0C-4-4.6 4-4.6 9 0C4 2.6-4 2.6-9 0Z" fill="#6CC04A"/><path d="M-4-.6v.1M0-1v.1M4-.6v.1" stroke="#A9DB7E" stroke-width="2"/>`,
  carrot: () => `${slice(3.8, '#F08A3C', '#C9661F', '#F8B57A', 1.4)}`,
  'carrot-stick': () => `${stick(5, 28, '#F08A3C')}<path d="M-1-10V8" stroke="#F8B57A" stroke-width="1.1"/><path d="M-2.5-4h1.6M1 3h1.5" stroke="#C9661F" stroke-width="1"/>`,
  'sweet-potato': () => `${cube(7.6, '#F09A4A')}<path d="M-3.8 2.2V-1.6Q-3.8-3.8-1.6-3.8H2" stroke="#A0522D" stroke-width="1.3"/>`,
  corn: () => `${cube(4, '#F6CF3B')}`,
  zucchini: () => `${slice(6.4, '#EEF2C6', '#3E7B2E', null, 1.8)}<ellipse rx="4.6" ry="2.2" stroke="#9DBF6A" stroke-width="1"/>${dots('M-1.6 0v.1M1.6 0v.1', '#C6D69A', 1.3)}`,
  eggplant: () => `${slice(6.4, '#F4E6CC', '#5E3A6E', null, 1.8)}${dots('M-2-.4v.1M2-.4v.1M0 .8v.1', '#C9B08A', 1.3)}`,
  mushroom: () => `<path d="M-2.4 0V4.6H2.4V0" fill="#F3E6D2"/><path d="M-7 0C-7-6 7-6 7 0Z" fill="#C9A27A"/><path d="M-4-2.6l1-1.2M2-3.6l1.4.6" stroke="#E6CDAE" stroke-width="1.2"/>`,
  'red-cabbage': () => `<path d="M-6 1Q0-4 6 1" stroke="#8E4A9A" stroke-width="2.4"/>`,
  radish: () => `${slice(5.6, '#FFF7F8', '#D9446A', null, 1.8)}<ellipse rx="3.4" ry="1.6" stroke="#F5C6D2" stroke-width="1"/>`,
  olive: () => `${bean(4.4, 3.4, '#4E4258')}<circle r="1.4" fill="#8A7E96" stroke="none"/>`,
  asparagus: () => `${stick(3.6, 36, '#6CAE4E')}<ellipse cy="-18" rx="3" ry="5" fill="#4E8E3A"/><path d="M-2-6l-2.4-2.4M2 4l2.4-2.4M-2 12l-2.4-2.4" stroke-width="1.2"/>`,
  'green-bean': () => `${stick(3.4, 28, '#4FA040')}<path d="M0-10V10" stroke="#8FCB76" stroke-width="1"/>`,
  'quinoa-mound': () => `${dome(20, 12, '#EFDDB3')}${dots('M-10-6v.1M4-10v.1M10-2v.1M-2-4v.1M-12 1v.1M6 2v.1M14-6v.1M-6-12v.1M1-14v.1', '#CDAE72', 2.2)}${dots('M-6-9v.1M8-6v.1M-8-2v.1M2-8v.1', '#FFFFFF', 2)}`,
  'rice-side': () => `${dome(18, 11, '#FBF6EC')}<path d="M-9-6q1.5-1.4 3 0M3-10q1.5-1.4 3 0M8-2q1.5-1.4 3 0M-3-3q1.5-1.4 3 0M-13-1q1.5-1.4 3 0M-4-12q1.5-1.4 3 0M11-7q1.5-1.4 3 0" stroke="#E3D3B0" stroke-width="1.6"/>`,
  'yogurt-dollop': () => `${dome(8, 5, '#FFFFFF')}<path d="M-4-2.4A4 2.6 0 1 1 2-1" stroke="#E8E0D6" stroke-width="1.4"/>`,
  'hummus-bowl': () => `${slice(24, '#FFFFFF', '#DCD9F7', null, 8)}<ellipse cy=".6" rx="19" ry="9" fill="#EBCB93" stroke-width="1.4"/><path d="M-11 0C-8-5 8-5 11 0" stroke="#D2A866" stroke-width="2.2"/><path d="M-7 3C-2 1 4 1 7 3" stroke="#E6B52E" stroke-width="2"/>${dots('M3-2v.1M-3 1v.1M6 3v.1M-9 3v.1', '#C9402E', 2.2)}<circle cx="-1" cy="-2" r="2.4" fill="#E8C07A" stroke-width="1"/><circle cx="4" cy="-3" r="2.2" fill="#E8C07A" stroke-width="1"/>${hiDot(-14, -6, 3, 1.2)}`,
  wrap: () => `${slice(14, '#EED3A0', '#D9B477', null, 6)}<ellipse rx="10.4" ry="5" fill="#F9EFDA" stroke-width="1.2"/><path d="M-7-1C-3-4 4-3.6 6 0C3 3-3 3.6-7 1Z" fill="#6CC07A" stroke-width="1.2"/><circle cx="-1" cy="-.4" r="2.4" fill="#E8C49A" stroke-width="1.1"/><circle cx="4" cy="1.4" r="2" fill="#E2513E" stroke-width="1.1"/><path d="M-4 2.6l1.6-.4" stroke="#F08A3C" stroke-width="1.6"/>`,
  'stuffed-pepper': () => `<path d="M-14-8C-14-15 14-15 14-8L13 9C12 15-12 15-13 9Z" fill="#E2402E"/><path d="M-10-7C-10-11 10-11 10-7L9 6C8 10-8 10-9 6Z" fill="#B98A5A" stroke-width="1.2"/><path d="M-6-4C-3-7 2-6 5-3C7 0 4 3 0 2C-4 3-8 0-6-4Z" fill="#F3E2C2" stroke-width="1"/>${dots('M-5 4v.1M3 5v.1M6-6v.1', '#3E9B57', 2)}<path d="M-11-11.6Q-6-14 0-13.6" stroke="#F4907F" stroke-width="1.4"/><path d="M0-14V-17" stroke="#3E9B57" stroke-width="2.4"/>`,
  drizzle: () => `<path d="M-22 0C-11-12 0 10 12-3S22 4 26-2" stroke="#E6B52E" stroke-width="2.2"/>`,
  dough: () => `${cube(8, '#F3E2C0')}<path d="M-2.4-2.4L2.4 2.4" stroke="#D9C29A" stroke-width="1.1"/>`,
  raisin: () => `${bean(2.8, 2, '#5E3A2A')}<path d="M-1.2-.4q1.2.8 2.4 0" stroke="#8E6250" stroke-width=".9"/>`,
  'pumpkin-seed': () => `${bean(3.4, 1.8, '#6E9A3E')}<path d="M-2 0h3" stroke="#A9C97E" stroke-width="1"/>`,
  'onion-fried': () => `<path d="M-4.6 1Q0-4 4.6 1" stroke="#A8642E" stroke-width="2"/>`,
  // small things, scattered thickly and drawn without an outline
  seed: () => '<ellipse rx="1.2" ry=".8" fill="#4A4442"/>',
  sesame: () => '<ellipse rx="1.6" ry=".9" fill="#F7EED8"/>',
  zaatar: () => '<circle r="1.1" fill="#6E7A3E"/>',
  cumin: () => '<circle r="1" fill="#9A6234"/>',
  paprika: () => '<circle r="1.1" fill="#C9402E"/>',
  cinnamon: () => '<circle r="1.1" fill="#9A5A2E"/>',
  chili: () => '<circle r="1.1" fill="#D2302A"/>',
  parmesan: () => '<rect x="-2" y="-.6" width="4" height="1.2" rx=".6" fill="#FBEFC2"/>',
  oat: () => '<ellipse rx="2.2" ry="1.3" fill="#DCC08A"/>',
  pomegranate: () => '<ellipse rx="2.2" ry="1.8" fill="#C9244A"/>',
  bulgur: () => '<circle r="1.1" fill="#C9A066"/>',
  fleck: () => '<rect x="-1.2" y="-.6" width="2.4" height="1.2" rx=".6" fill="#3E9B57"/>',
};
const DUST = new Set(['seed', 'sesame', 'zaatar', 'cumin', 'paprika', 'cinnamon', 'chili', 'parmesan', 'oat', 'pomegranate', 'bulgur', 'fleck']);
// Spacing radius of each item (default 5).
const FOOT = {
  blueberry: 4.2, strawberry: 6, raspberry: 4.6, mint: 5.4, herb: 4, basil: 6, spinach: 7, 'egg-fried': 12, 'egg-half': 8, 'egg-muffin': 10,
  'tomato-dice': 3.6, 'tomato-cherry': 5.6, 'tomato-slice': 8.6, 'pepper-red': 6, 'pepper-green': 6, 'pepper-strip': 4, cucumber: 6.6, 'cucumber-stick': 5,
  chickpea: 4, 'chickpea-roasted': 4.2, 'bean-black': 3.6, 'bean-red': 3.8, 'bean-white': 3.8, edamame: 5.6, feta: 4, 'onion-ring': 5.6, avocado: 9,
  'avocado-mash': 15, toast: 20, pita: 13, 'pita-chip': 5, chicken: 9, 'chicken-breast': 22, tuna: 5.6, salmon: 22, 'fish-white': 22, 'fish-red': 22,
  shrimp: 7, mango: 4.4, lemon: 8, lime: 8, walnut: 5.6, almond: 3.6, peanut: 4.4, banana: 5.6, 'apple-slice': 10, 'nut-butter': 14, date: 8,
  popcorn: 5, tofu: 5.6, broccoli: 7, 'snow-pea': 7, carrot: 4, 'carrot-stick': 5, 'sweet-potato': 4.8, corn: 2.6, zucchini: 6.4, eggplant: 6.4,
  mushroom: 6, 'red-cabbage': 5, radish: 5.6, olive: 4.4, asparagus: 5, 'green-bean': 4, 'quinoa-mound': 20, 'rice-side': 18, 'yogurt-dollop': 8,
  'hummus-bowl': 24, wrap: 14, 'stuffed-pepper': 14, drizzle: 0, dough: 4.8, raisin: 2.8, 'pumpkin-seed': 3.2, 'onion-fried': 4,
};
const LONG = new Set(['asparagus', 'green-bean', 'carrot-stick', 'cucumber-stick', 'pepper-strip']);
// Pieces that stand or lie flat at 3/4 and only tilt a little.
const UPRIGHT = new Set(['tomato-slice', 'cucumber', 'zucchini', 'eggplant', 'radish', 'banana', 'carrot', 'nut-butter', 'hummus-bowl', 'wrap', 'egg-muffin', 'quinoa-mound', 'rice-side', 'yogurt-dollop', 'stuffed-pepper', 'broccoli', 'mushroom', 'strawberry', 'toast', 'tomato-cherry']);
const ANCHOR = { 'hummus-bowl': [-0.42, -0.1], 'nut-butter': [0.4, -0.1] };
const MAX_EACH = 6; const MAX_SMALL = 16; const MAX_DUST = 12;
// Colours of items shown as a layer inside a glass or jar.
const LAYER = { pomegranate: '#C9244A', blueberry: '#4F6BB8', strawberry: '#E23C4A', raspberry: '#D9335A', mango: '#F6B43B', banana: '#F6D35B' };

function parseItems(list) { return (list ?? []).map((s) => { const [type, n] = String(s).split('*'); return { type, n: Math.max(0, Number(n ?? 1) || 0) }; }); }

/** Scatter points in an ellipse so that pieces of radius `rad` (in screen units) do not overlap placed ones too much. */
// Garnish that may sit on top of a big piece (herbs on fish, raisins on rice).
const GARNISH = new Set(['herb', 'mint', 'basil', 'tomato-dice', 'onion-fried', 'raisin', 'pumpkin-seed', 'corn']);
function scatter(r, count, rx, ry, rad, placed, garnish = false) {
  const pts = [];
  const near = garnish ? placed.filter((q) => q[2] < 11) : placed;
  for (let tries = 0; pts.length < count && tries < count * 80; tries++) {
    const a = r() * Math.PI * 2; const d = Math.sqrt(r());
    const p = [Math.cos(a) * d * rx, Math.sin(a) * d * ry, rad];
    if ([...near, ...pts].every((q) => Math.hypot(q[0] - p[0], (q[1] - p[1]) * 1.5) >= (q[2] + rad) * 0.8)) pts.push(p);
  }
  return pts;
}

/** Items laid out on the food surface: an ellipse (rx, ry) around (cx, cy), drawn back to front. */
function drawItems(items, cx, cy, rx, ry, r, { k: k0 = 1 } = {}) {
  let k = k0;
  const placed = [];
  // big pieces first so smaller ones arrange around them
  const order = items.map((it, i) => ({ ...it, i })).filter((it) => ITEMS[it.type]).sort((x, y) => (FOOT[y.type] ?? 5) - (FOOT[x.type] ?? 5));
  const out = [];
  const longRot = r() * 180;
  // a few pieces are drawn bigger so a small plate of dates or eggs still reads well
  const pieces = order.filter((it) => !DUST.has(it.type) && it.type !== 'drizzle').reduce((a, it) => a + Math.min(it.n, MAX_EACH), 0);
  if (pieces && pieces <= 7) k *= 1.3;
  for (const { type, n } of order) {
    const dust = DUST.has(type);
    const small = (FOOT[type] ?? 5) <= 6 && !LONG.has(type);
    const count = Math.min(n, dust ? MAX_DUST : small ? MAX_SMALL : MAX_EACH);
    const rad = dust ? 1.6 * k : (FOOT[type] ?? 5) * ((FOOT[type] ?? 5) >= 12 ? k0 : k);
    const rrx = Math.max(4, rx - Math.min(rad, rx * .5) * .7); const rry = Math.max(2, ry - Math.min(rad, ry * .6) * .5);
    const pts = ANCHOR[type] ? [[ANCHOR[type][0] * rx, ANCHOR[type][1] * ry, rad]] : scatter(r, count, rrx, rry, rad, dust ? [] : placed, GARNISH.has(type));
    pts.forEach((p, j) => {
      if (!dust && rad > 0) placed.push(p);
      const big = (FOOT[type] ?? 5) >= 12;
      // big pieces (fillets, toast) lie along the plate, so they only turn a little
      const rot = LONG.has(type) ? longRot + (r() - 0.5) * 24 : UPRIGHT.has(type) ? (r() - 0.5) * 16 : big ? (r() - 0.5) * 40 : r() * 360;
      const s = (big ? k0 : k) * (dust ? 1 : 0.92 + r() * 0.18);
      const z = dust || type === 'drizzle' ? 1e4 + p[1] : (big ? -1e4 : 0) + p[1];
      out.push([z, `<g transform="translate(${f(cx + p[0])} ${f(cy + p[1])}) rotate(${f(rot)}) scale(${f(s)})"${dust ? ' stroke="none"' : ` stroke-width="${f(ISW * SWK / s)}"`}>${ITEMS[type](j)}</g>`]);
    });
  }
  out.sort((x, y) => x[0] - y[0]);
  return out.map(([, svg]) => svg).join('');
}

/** Texture for a food surface filling the ellipse (cx, cy, rx, ry). */
function texture(b, cx, cy, rx, ry, r) {
  const A = Math.PI * rx * ry;
  const n = (per) => Math.max(3, Math.round(A / per));
  const pts = (m, md, k = .8) => spread(r, m, cx, cy, rx, ry, md, k);
  const t = b.tex;
  if (t === 'none' || t === 'bread') return '';
  // darker crescent along the lower inside edge gives the food some depth
  let o = t === 'leaves' ? '' : path(`M${P(cx - rx * .86, cy + ry * .22)}A${f(rx * .9)} ${f(ry * .9)} 0 0 0 ${P(cx + rx * .86, cy + ry * .22)}`, `stroke="${b.c}" stroke-width="${sw(2.2)}"`);
  const drops = (m, c, edge) => { let d = ''; for (const [x, y] of pts(m, 7, .7)) d += ell(x, y, 1.3 + r() * 1.3, .9 + r() * .6, 0); return path(d, `fill="${c}" stroke="${edge}" stroke-width="1"`); };
  if (t === 'rice' || t === 'creamy') {
    let d = ''; let d2 = '';
    pts(n(t === 'rice' ? 34 : 70), 3.6, .9).forEach(([x, y], i) => { const g = grain(x, y, (r() - .5) * 1.4, 4.4); if (i % 3 === 0) d2 += g; else d += g; });
    o += path(d, `stroke="${b.c2}" stroke-width="1.9"`) + path(d2, `stroke="${b.c}" stroke-width="1.9"`);
    if (b.spice) { let s = ''; for (const [x, y] of pts(Math.min(8, n(260)), 9, .78)) s += circ(x, y, 1.5); o += path(s, `fill="${b.spice}" stroke="none"`); }
    if (t === 'creamy') o += path(`M${P(cx - rx * .4, cy)}a${f(rx * .4)} ${f(ry * .36)} 0 1 1 ${f(rx * .56)} ${f(ry * .26)}`, `stroke="${b.c}" stroke-width="2"`);
  } else if (t === 'grains' || t === 'seeds') {
    let d = ''; let d2 = '';
    pts(n(t === 'grains' ? 22 : 30), 3, .88).forEach(([x, y], i) => { if (i % 3 === 0) d2 += circ(x, y, 1.1); else d += t === 'seeds' ? circ(x, y, 1.2) : `M${P(x, y)}v.1`; });
    o += t === 'seeds' ? path(d, `fill="${b.c2}" stroke="${b.c}" stroke-width=".9"`) : path(d, `stroke="${b.c}" stroke-width="2.1"`);
    o += path(d2, `fill="${b.c2}" stroke="none"`);
  } else if (t === 'flakes') {
    let d = ''; for (const [x, y] of pts(n(44), 4.6, .86)) d += ell(x, y, 2.6, 1.3, (r() - .5) * .8);
    o += path(d, `fill="${b.c2}" stroke="${b.c}" stroke-width="1"`);
  } else if (t === 'beans') {
    let d = ''; for (const [x, y] of pts(n(70), 6.4, .84)) d += ell(x, y, 3.2, 2, (r() - .5) * 1.2);
    o += path(d, `fill="${b.c2}" stroke="${b.c}" stroke-width="1.1"`) + drops(3, '#E6B52E', b.c);
  } else if (t === 'curds') {
    let d = ''; for (const [x, y] of pts(n(100), 7, .82)) d += ell(x, y, 2.8 + r() * 1.4, 1.8 + r(), 0);
    o += path(d, `fill="${b.c2}" stroke="${b.c}" stroke-width="1.1"`);
  } else if (t === 'soup' || t === 'sauce') {
    o += path(arcAt(cx, cy, rx * .55, ry * .55, 3.5, 5.4) + arcAt(cx, cy, rx * .32, ry * .32, .4, 2.2) + arcAt(cx, cy, rx * .7, ry * .7, .9, 1.9), `stroke="${b.c}" stroke-width="1.6"`);
    o += drops(n(260), b.oil, b.c);
    if (t === 'sauce') { let s = ''; for (const [x, y] of pts(8, 6, .8)) s += grain(x, y, r() * Math.PI, 3.4); o += path(s, `stroke="#8E2A1C" stroke-width="1.5"`); }
  } else if (t === 'stew') {
    let d = ''; for (const [x, y] of pts(n(180), 9, .76)) d += quad(x, y, 3 + r(), r() * Math.PI);
    o += path(d, `fill="${b.chunk}" stroke-width="1.1"`);
    o += path(arcAt(cx, cy, rx * .5, ry * .5, 3.6, 5.2), `stroke="${b.c}" stroke-width="1.6"`) + drops(n(320), b.oil, b.c);
  } else if (t === 'swirl' || t === 'porridge') {
    const sp = `M${P(cx - rx * .5, cy)}a${f(rx * .5)} ${f(ry * .5)} 0 1 1 ${f(rx * .7)} ${f(ry * .35)}a${f(rx * .3)} ${f(ry * .3)} 0 1 1 ${f(-rx * .45)} ${f(-ry * .3)}`;
    o += path(sp, `stroke="${b.c}" stroke-width="2.4"`);
    o += path(`M${P(cx - rx * .56, cy - ry * .18)}a${f(rx * .56)} ${f(ry * .56)} 0 0 1 ${f(rx * .4)} ${f(-ry * .38)}`, `stroke="${b.c2 ?? '#FFFFFF'}" stroke-width="1.6"`);
    if (b.pool) o += `${E(cx + rx * .06, cy + ry * .04, rx * .22, ry * .2, `fill="${b.pool}" stroke="${b.c}" stroke-width="1.2"`)}<path d="M${P(cx - rx * .06, cy - ry * .04)}h${f(rx * .08)}" stroke="#FCEBB4" stroke-width="1.4"/>`;
    if (t === 'porridge') { let s = ''; for (const [x, y] of pts(n(110), 4.4, .82)) s += `M${P(x, y)}v.1`; o += path(s, `stroke="${b.c}" stroke-width="1.8"`); }
  } else if (t === 'strands') {
    let d = '';
    for (let y = cy - ry + 4; y < cy + ry - 3; y += 4.4) {
      const hw = Math.sqrt(Math.max(0, 1 - ((y - cy) / ry) ** 2)) * rx - 5;
      if (hw < 6) continue;
      const segs = Math.max(1, Math.floor(hw / 4));
      d += `M${P(cx - segs * 4, y)}q2 ${f(-2.2 + r())} 4 0` + 't4 0'.repeat(segs * 2 - 1);
    }
    o += path(d, `stroke="${b.c}" stroke-width="3.4"`) + path(d, `stroke="${b.c2}" stroke-width="1.3"`);
  } else if (t === 'leaves') {
    for (const [x, y] of pts(n(110), 8, .82)) o += `<g transform="translate(${P(x, y)}) rotate(${f(r() * 360)})" stroke-width="1.1">${leafV(13, r() > .5 ? '#7CC47A' : '#5DB36A', '#3E8E4A')}</g>`;
  } else if (t === 'specks') {
    let d = ''; for (const [x, y] of pts(n(26), 3, .86)) d += `M${P(x, y)}v.1`; o += path(d, `stroke="${b.c}" stroke-width="1.6"`);
  } else if (t === 'bubbles') {
    let d = ''; for (const [x, y] of pts(n(70), 5, .8)) d += circ(x, y, 1 + r() * .8); o += path(d, `stroke="${b.c}" stroke-width="1"`);
  }
  return o;
}

/** A flat food surface (ellipse plus texture). */
const surface = (b, cx, cy, rx, ry, r) => E(cx, cy, rx, ry, `fill="${b.fill}" stroke-width="${sw(1.6)}"`) + texture(b, cx, cy, rx, ry, r);

/** A dome of grains (rice, couscous…) on a plate or tray, as kabsa is served. Returns [svg, item area]. */
function mound(b, cx, base, w, h, r) {
  const l = cx - w; const rr = cx + w; const top = base - h;
  let o = `<path d="M${P(l, base)}C${P(l + w * .06, top + h * .2)} ${P(cx - w * .56, top)} ${P(cx, top)}C${P(cx + w * .56, top)} ${P(rr - w * .06, top + h * .2)} ${P(rr, base)}C${P(cx + w * .62, base + w * .2)} ${P(cx - w * .62, base + w * .2)} ${P(l, base)}Z" fill="${b.fill}" stroke-width="${sw(VSW)}"/>`;
  o += `<path d="M${P(l + w * .12, base + 1)}C${P(cx - w * .44, base + w * .16)} ${P(cx + w * .44, base + w * .16)} ${P(rr - w * .12, base + 1)}" stroke="${b.c}" stroke-width="${sw(2.8)}"/>`;
  o += texture({ ...b, tex: b.tex === 'creamy' ? 'creamy' : b.tex }, cx, top + h * .58, w * .8, h * .5, r).replace(/^<path d="M[^"]*A[^"]*" stroke="[^"]*" stroke-width="[^"]*"\/>/, '');
  // a soft highlight on the top of the dome
  o += `<path d="M${P(cx - w * .4, top + h * .26)}q${f(w * .22)} ${f(-h * .2)} ${f(w * .46)} ${f(-h * .2)}" stroke="#FFFFFF" stroke-width="${sw(2.4)}" opacity=".7"/>`;
  return [o, [cx, base - h * .34, w * .84, h * .5]];
}

/** One roasted half chicken (as on kabsa), drawn round (150, 118) and placed at (x, y) scaled by k. */
function halfChicken(x, y, k) {
  const w = (v) => f(v * SWK / k);
  return `<g transform="translate(${f(x)} ${f(y)}) scale(${k}) translate(-150 -118)">`
    + `<path d="M112 122c-6-20 12-36 38-35c22 1 38 13 38 29c0 12-12 20-38 22c-22 2-36-5-38-16z" fill="#C97A34" stroke-width="${w(2.4)}"/>`
    + `<path d="M122 104c8-8 22-10 34-6c10 3 18 9 20 16" stroke="#E9A85E" stroke-width="${w(4)}" opacity=".9"/>`
    + `<path d="M128 100c6-3 12-4 18-3" stroke="#FFFFFF" stroke-width="${w(2)}" opacity=".8"/>`
    + `<path d="M114 118c-8-2-14 2-14 8c6 4 14 4 20 0" fill="#B5652A" stroke-width="${w(2.2)}"/>`
    + `<path d="M104 122l10-1" stroke="#93521F" stroke-width="${w(1.5)}"/>`
    + `<path d="M166 118c12-4 24 2 26 12c2 9-6 15-16 14c-8-1-14-6-14-13c0-5 1-10 4-13z" fill="#C97A34" stroke-width="${w(2.4)}"/>`
    + `<path d="M170 124c6-2 12 0 15 4" stroke="#E9A85E" stroke-width="${w(2.6)}"/>`
    + `<path d="M184 140l12 8" stroke-width="${w(6)}"/><path d="M184 140l12 8" stroke="${PAL.bone}" stroke-width="${w(2.8)}"/>`
    + `<circle cx="198" cy="146" r="3.8" fill="${PAL.bone}" stroke-width="${w(1.6)}"/><circle cx="196" cy="152" r="3.8" fill="${PAL.bone}" stroke-width="${w(1.6)}"/>`
    + '<g fill="#93521F" stroke="none"><circle cx="136" cy="112" r="1.5"/><circle cx="148" cy="118" r="1.5"/><circle cx="160" cy="110" r="1.5"/><circle cx="142" cy="126" r="1.5"/><circle cx="170" cy="132" r="1.4"/><circle cx="178" cy="126" r="1.4"/><circle cx="126" cy="118" r="1.4"/></g>'
    + `<path d="M132 130c10 3 24 3 34-1" stroke="#93521F" stroke-width="${w(1.5)}" opacity=".7"/></g>`;
}

/** A flatbread (lahouh) stack lying on a plate, centred on (cx, cy). */
function flatbread(b, cx, cy, R, r) {
  let o = '';
  for (const [dx, dy, s] of [[8, -4, .9], [-3, 2, 1]]) {
    const x = cx + dx; const y = cy + dy; const a = R * s;
    o += isoDisc(x, y, a, a * .42, 2.4, s < 1 ? b.c2 : b.fill, b.c, sw(1.8));
  }
  const x = cx - 3; const y = cy + 2;
  o += E(x, y, R * .8, R * .32, `stroke="${b.c2}" stroke-width="${sw(2)}"`);
  let d = ''; for (const [px, py] of spread(r, 30, x, y, R, R * .42, 4, .78)) d += ell(px, py, 1 + r() * .7, .6 + r() * .4, 0);
  return o + path(d, `fill="${b.c}" stroke="none"`);
}

/** One dish in a vessel, centred on (cx, cy), in a 200 × 150 frame. Returns the svg; `top` is set to the top of the food. */
const TOP = { y: 0 };
function vessel(kind, base, items, r, cx = 100, cy = 90, { half = false } = {}) {
  const b = BASES[base] ?? null;
  const { white, cream, lav2, lav3, indigo } = PAL;
  let o = '';
  if (kind === 'jar' || kind === 'glass') {
    const top = 30; const bot = 130; const rT = kind === 'jar' ? 30 : 31; const rB = kind === 'jar' ? 30 : 24; const ryT = 8.6; const ryB = kind === 'jar' ? 8.6 : 6.8;
    const xAt = (y) => rT + (rB - rT) * (y - top) / (bot - top);
    const fill = b?.fill ?? '#F3E6D6';
    const y0 = top + (bot - top) * (kind === 'jar' ? .26 : .2);
    const r0 = xAt(y0); const ry0 = ryT + (ryB - ryT) * (y0 - top) / (bot - top);
    const body = `M${P(cx - rT, top)}L${P(cx - rB, bot)}a${rB} ${ryB} 0 0 0 ${2 * rB} 0L${P(cx + rT, top)}`;
    const front = (y, rr, ryy) => `M${P(cx - rr, y)}a${f(rr)} ${f(ryy)} 0 0 0 ${f(2 * rr)} 0`;
    if (kind === 'glass' && base !== 'laban') o += `<path d="M${P(cx + 8, y0 + 6)}L${P(cx + 26, top - 26)}" stroke-width="9"/><path d="M${P(cx + 8, y0 + 6)}L${P(cx + 26, top - 26)}" stroke="${white}" stroke-width="5.4"/><path d="M${P(cx + 20.6, top - 14)}l4-2M${P(cx + 16.4, top - 2)}l4-2" stroke="${PAL.violet}" stroke-width="3.2"/>`;
    o += `<path d="${body}Z" fill="${white}" fill-opacity=".8"/>`;
    o += `<path d="M${P(cx - r0, y0)}L${P(cx - rB, bot)}a${rB} ${ryB} 0 0 0 ${2 * rB} 0L${P(cx + r0, y0)}a${f(r0)} ${f(ry0)} 0 0 1 ${f(-2 * r0)} 0Z" fill="${fill}"/>`;
    const types = items.map((it) => it.type);
    // a fruit layer (and a granola layer for yogurt) seen through the glass, curving with it
    const fruit = types.find((t) => LAYER[t]);
    if (base === 'oats' || base === 'yogurt' || base === 'chia') {
      const yl = y0 + (bot - y0) * .5; const rl = xAt(yl) - 1.6; const ryl = ry0 * .8;
      if (fruit) {
        o += path(front(yl, rl, ryl), `stroke="${LAYER[fruit]}" stroke-width="9" stroke-linecap="butt"`);
        let d = ''; for (let i = 0; i < 7; i++) { const t = (i + .5) / 7 * Math.PI; d += circ(cx - Math.cos(t) * rl * .9, yl + Math.sin(t) * ryl - 2 + (r() - .5) * 3, 1.7); }
        o += path(d, `fill="#FFFFFF" fill-opacity=".45" stroke="none"`);
      }
      if (types.includes('oat') || base === 'oats') {
        const yg = y0 + (bot - y0) * .22; const rg = xAt(yg) - 1.6;
        let g = ''; for (let i = 0; i < 9; i++) { const t = (i + .5) / 9 * Math.PI; g += ell(cx - Math.cos(t) * rg * .9, yg + Math.sin(t) * ry0 * .8 + (r() - .5) * 2, 2.2, 1.2, r() * 3); }
        o += path(g, `fill="#DCC08A" stroke="#B9955A" stroke-width=".8"`);
      }
    }
    if (b && b.tex === 'bubbles') { let d = ''; for (const [x, y] of spread(r, 8, cx, (y0 + bot) / 2 + 8, r0 - 9, (bot - y0) / 2 - 12, 8, 1)) d += circ(x, y, 1.2 + r()); o += path(d, `fill="#FFFFFF" fill-opacity=".5" stroke="${b.c}" stroke-width="1"`); }
    if (types.includes('seed')) { let d = ''; for (const [x, y] of spread(r, 14, cx, (y0 + bot) / 2 + 6, r0 - 9, (bot - y0) / 2 - 12, 5, 1)) d += `M${P(x, y)}h1.2`; o += path(d, `stroke="#4A4442" stroke-width="1.4"`); }
    // the top of the drink or food
    o += E(cx, y0, r0, ry0, `fill="${b?.c2 ?? (base === 'laban' || base === 'yogurt' ? '#FFFDF8' : fill)}" stroke-width="${sw(1.8)}"`);
    if (b && b.tex === 'specks') { let d = ''; for (const [x, y] of spread(r, 10, cx, y0, r0 * .8, ry0 * .7, 4, 1)) d += `M${P(x, y)}v.1`; o += path(d, `stroke="${b.c}" stroke-width="1.6"`); }
    o += `<path d="M${P(cx - rT + 8, top + 18)}L${P(cx - rB + 7, bot - 14)}" stroke="${white}" stroke-width="3.6" opacity=".85"/>`;
    o += `<path d="${body}"/>`;
    if (kind === 'jar') o += path(front(top + 6, rT, ryT), `stroke="${lav3}" stroke-width="${sw(3.4)}"`);
    o += drawItems(items, cx, y0 - 1, r0 * .66, ry0 * .5, r, { k: .8 });
    o += E(cx, top, rT, ryT, `fill="none" stroke-width="${sw(VSW)}"`);
    TOP.y = top - 6;
    return o;
  }
  if (kind === 'bowl') {
    const rx = 62; const ry = 24; const rim = cy - 8; const depth = 40;
    o += E(cx, rim + depth - 1, 26, 7.4, `fill="${lav3}"`);
    o += `<path d="M${P(cx - rx, rim)}a${rx} ${depth} 0 0 0 ${2 * rx} 0z" fill="${lav2}"/>`;
    o += `<path d="M${P(cx - rx * .78, rim + depth * .36)}a${f(rx * .84)} ${f(depth * .64)} 0 0 0 ${f(rx * .44)} ${f(depth * .42)}" stroke="${white}" stroke-width="${sw(3)}"/>`;
    o += E(cx, rim, rx, ry, `fill="${white}"`);
    const fx = rx - 6; const fy = ry - 3.6;
    o += b ? surface(b, cx, rim + 1, fx, fy, r) : E(cx, rim + 1, fx, fy, `fill="#F6EEDD" stroke-width="${sw(1.6)}"`);
    TOP.y = rim - ry - 4;
    return o + drawItems(items, cx, rim + 1, fx - 5, fy - 2.4, r);
  }
  if (kind === 'plate' || kind === 'platter') {
    const tray = kind === 'platter';
    const rx = tray ? 78 : 70; const ry = tray ? 31 : 28;
    o += isoDisc(cx, cy, rx, ry, tray ? 7 : 6, tray ? lav2 : white, tray ? lav3 : lav2);
    o += E(cx, cy - .6, rx * (tray ? .87 : .76), ry * (tray ? .82 : .72), `fill="${tray ? white : cream}" stroke-width="${sw(1.8)}"`);
    let area = [cx, cy - 1, rx * .64, ry * .56];
    TOP.y = cy - ry - 6;
    if (b?.tex === 'bread') o += flatbread(b, cx, cy, rx * .56, r);
    else if (b && MOUND.has(base)) {
      const [m, a] = mound(b, cx, cy + 3, tray ? 54 : 46, tray ? 34 : 28, r); o += m; area = a; TOP.y = cy + 3 - (tray ? 34 : 28) - 8;
      if (half) { o += drawItems(items, ...area, r); TOP.y -= 8; return o + halfChicken(cx - 2, cy - (tray ? 24 : 20), tray ? .62 : .52); }
    } else if (b) o += surface(b, cx, cy - .6, rx * .6, ry * .54, r);
    return o + drawItems(items, ...area, r, { k: tray ? .92 : 1 });
  }
  if (kind === 'pan') {
    const rx = 64; const ry = 25;
    o += `<path d="M${P(cx + rx - 6, cy - 6)}L${P(cx + rx + 30, cy - 18)}" stroke-width="10.6"/><path d="M${P(cx + rx - 6, cy - 6)}L${P(cx + rx + 30, cy - 18)}" stroke="${indigo}" stroke-width="6"/>`;
    o += isoDisc(cx, cy, rx, ry, 11, lav2, lav3);
    o += b ? surface(b, cx, cy + .6, rx - 7, ry - 4, r) : E(cx, cy + .6, rx - 7, ry - 4, `fill="${cream}" stroke-width="${sw(1.6)}"`);
    TOP.y = cy - ry - 6;
    return o + drawItems(items, cx, cy, rx - 14, ry - 7, r, { k: 1 });
  }
  if (kind === 'board' || kind === 'dish') {
    const dish = kind === 'dish';
    const w = dish ? 136 : 132; const h = dish ? 54 : 54; const x = cx - w / 2; const y = cy - h / 2 - 2; const d = dish ? 14 : 7;
    if (dish) o += `<rect x="${f(x - 9)}" y="${f(y + 18)}" width="${w + 18}" height="12" rx="6" fill="${lav3}"/>`;
    o += `<rect x="${f(x)}" y="${f(y + d)}" width="${w}" height="${h}" rx="20" fill="${dish ? lav3 : lav2}"/><rect x="${f(x)}" y="${f(y)}" width="${w}" height="${h}" rx="20" fill="${dish ? lav2 : white}"/>`;
    if (dish) o += `<rect x="${f(x + 9)}" y="${f(y + 7)}" width="${w - 18}" height="${h - 14}" rx="14" fill="${b?.fill ?? '#F1DEC4'}" stroke-width="${sw(1.6)}"/>`;
    else o += `<circle cx="${f(x + w - 16)}" cy="${f(y + 12)}" r="3.6" fill="${PAL.lav}" stroke-width="${sw(1.6)}"/>`;
    TOP.y = y - 8;
    return o + drawItems(items, cx, cy - 2, w * .36, h * .3, r, { k: 1.05 });
  }
  // unknown vessel: a plain plate
  return vessel('plate', base, items, r, cx, cy);
}

// ---------------------------------------------------------------- table extras
/** Tumbler of water (with a lemon slice) or laban; (x, y) is the centre of its base. */
function drink(x, y, kind, lemon) {
  const h = 40; const rt = 12; const rb = 9.6; const top = y - h;
  const body = `M${P(x - rt, top)}L${P(x - rb, y)}a${rb} 3 0 0 0 ${2 * rb} 0L${P(x + rt, top)}`;
  const y0 = top + 11; const r0 = rt - (rt - rb) * 11 / h;
  const liquid = kind === 'laban' ? '#FFFFFF' : PAL.water; const topc = kind === 'laban' ? '#FFFDF6' : PAL.waterTop;
  let o = `<path d="${body}Z" fill="#FFFFFF" fill-opacity=".8"/>`;
  o += `<path d="M${P(x - r0, y0)}L${P(x - rb, y)}a${rb} 3 0 0 0 ${2 * rb} 0L${P(x + r0, y0)}a${f(r0)} 3.4 0 0 1 ${f(-2 * r0)} 0Z" fill="${liquid}" stroke-width="${sw(1.8)}"/>`;
  o += E(x, y0, r0, 3.4, `fill="${topc}" stroke-width="${sw(1.8)}"`);
  if (kind !== 'laban') o += `<path d="M${P(x - 3, y0 - 2.4)}l3.4 1.7-3.4 1.7-3.4-1.7z" fill="#FFFFFF" stroke-width="1.3"/><circle cx="${f(x + 3)}" cy="${f(y - 14)}" r="1.5" fill="#FFFFFF" stroke-width="1.1"/>`;
  else o += `<path d="M${P(x - 4, y0)}q4-1.6 8 0" stroke="#B9C79A" stroke-width="1.4"/>`;
  o += `<path d="M${P(x - rt + 4, top + 14)}L${P(x - rb + 3.4, y - 6)}" stroke="#FFFFFF" stroke-width="2.4" opacity=".85"/><path d="${body}" stroke-width="${sw(2)}"/>`;
  o += E(x, top, rt, 3.8, `fill="none" stroke-width="${sw(2)}"`);
  if (lemon && kind !== 'laban') o += `<g transform="translate(${f(x + 9)} ${f(top + 1)}) rotate(-20) scale(.8)" stroke-width="${sw(1.8)}">${ITEMS.lemon()}</g>`;
  return o;
}

/** Small side bowl at 3/4, rim centred on (x, y), with a food base and a few items. */
function sideBowl(x, y, R, base, items, r) {
  const b = BASES[base]; const ry = R * .4; const depth = R * .56;
  let o = `<path d="M${P(x - R, y)}a${R} ${f(depth)} 0 0 0 ${2 * R} 0z" fill="${PAL.lav3}" stroke-width="${sw(2.2)}"/>`;
  o += E(x, y, R, ry, `fill="#FFFFFF" stroke-width="${sw(2.2)}"`) + E(x, y + .4, R * .76, ry * .7, `fill="${b.fill}" stroke-width="${sw(1.5)}"`);
  if (b.tex === 'rice' || b.tex === 'soup' || b.tex === 'stew' || b.tex === 'leaves') { let d = ''; for (const [px, py] of spread(r, 6, x, y, R * .6, ry * .5, 4, .8)) d += circ(px, py, 1.1); o += path(d, `fill="${b.oil ?? b.c2 ?? b.c}" stroke="none"`); }
  return o + drawItems(parseItems(items), x, y, R * .5, ry * .4, r, { k: .5 });
}

/** Two dates on a small saucer; (x, y) is the saucer centre. */
function dates(x, y) {
  return isoDisc(x, y, 23, 9, 3.6, '#FFFFFF', PAL.lav2, sw(2.2))
    + `<g transform="translate(${f(x - 7)} ${f(y - 1.6)}) rotate(-14)" stroke-width="${sw(1.8)}">${ITEMS.date(0)}</g><g transform="translate(${f(x + 7)} ${f(y + .8)}) rotate(12)" stroke-width="${sw(1.8)}">${ITEMS.date(1)}</g>`;
}

/** Three steam curls rising above (x, y). */
function steam(x, y) {
  let d = '';
  for (const dx of [-11, 0, 11]) d += `M${f(x + dx)} ${f(y - (dx ? 0 : 3))}c-4.6-6 4.6-9 0-15`;
  return path(d, `stroke="${OL}" stroke-width="2" opacity=".5"`);
}

// ---------------------------------------------------------------- happy details
const spark = (x, y, s, c) => `<path d="M${P(x, y - s)}l${f(s * .3)} ${f(s * .7)} ${f(s * .7)} ${f(s * .3)} ${f(-s * .7)} ${f(s * .3)} ${f(-s * .3)} ${f(s * .7)} ${f(-s * .3)} ${f(-s * .7)} ${f(-s * .7)} ${f(-s * .3)} ${f(s * .7)} ${f(-s * .3)}z" fill="${c}"/>`;
const cloud = (x, y, s) => `<path transform="translate(${f(x)} ${f(y)}) scale(${s})" d="M0 12c-6 0-8-8-2-10c0-7 9-9 12-4c3-6 13-5 13 2c6 0 8 8 2 12z" fill="#FFFFFF" stroke="${OL}" stroke-width="${f(2 / s)}" stroke-linejoin="round"/>`;
const flower = (x, y, rr = 2.8) => {
  let o = '';
  for (let i = 0; i < 5; i++) { const a = (-90 + i * 72) * Math.PI / 180; o += `<circle cx="${f(x + Math.cos(a) * rr * 1.15)}" cy="${f(y + Math.sin(a) * rr * 1.15)}" r="${rr}" fill="#FFFFFF" stroke="${OL}" stroke-width="1.3"/>`; }
  return `${o}<circle cx="${f(x)}" cy="${f(y)}" r="${f(rr * .68)}" fill="${PAL.gold}" stroke="${OL}" stroke-width="1"/>`;
};
const heart = (x, y, s = 1) => `<path transform="translate(${f(x)} ${f(y)}) scale(${s})" d="M0 5.5c-5.5-3.6-7.6-6.6-7.6-9.4a3.9 3.9 0 0 1 7.6-1.2a3.9 3.9 0 0 1 7.6 1.2c0 2.8-2.1 5.8-7.6 9.4z" fill="${PAL.violet}" stroke="${OL}" stroke-width="${f(1.6 / s)}" stroke-linejoin="round"/>`;

/** Seeded shuffle (no sort with a random comparator: engines differ). */
function shuffle(r, a) { const o = [...a]; for (let i = o.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [o[i], o[j]] = [o[j], o[i]]; } return o; }

const CLOUDS = [[[22, 12, .82], [150, 22, .66]], [[34, 22, .64], [142, 10, .82]], [[148, 12, .8], [30, 26, .6]], [[44, 12, .7], [160, 30, .56]]];
const SPARKS = [[64, 14, 5.4], [174, 50, 4.2], [26, 60, 3.8], [178, 96, 3.4], [22, 98, 3.4], [116, 16, 4.4], [100, 28, 3]];
const FLOWERS = [[42, 132], [158, 134], [178, 118], [24, 120], [104, 142], [128, 138]];

/** Ground, clouds, sparkles and flowers behind the dish. */
function world(r, bg, ground, w = 200, h = 150) {
  const sx = w / 200; const sy = h / 150;
  let o = `<rect width="${w}" height="${h}" fill="${bg}"/>${E(w / 2, 118 * sy, 88 * sx, 25 * sy, `fill="${ground}"`)}`;
  for (const [x, y, s] of CLOUDS[Math.floor(r() * CLOUDS.length)]) o += cloud(x * sx, y * sy, s * Math.min(sx, sy) ** .5);
  shuffle(r, SPARKS).slice(0, 4).forEach(([x, y, s], i) => { o += spark(x * sx, y * sy, s, i % 2 ? PAL.violet : PAL.gold); });
  shuffle(r, FLOWERS).slice(0, 3).forEach(([x, y]) => { o += flower(x * sx, y * sy); });
  return o;
}

// Complete trays: the sides are the meal's other components.
const TRAYS = {
  'kabsa-lunch-tray': { bowl: ['stew-red', ['herb*5', 'tomato-dice*2']], drink: 'water' },
  'saleeg-dinner-tray': { bowl: ['stew-red', ['herb*5', 'tomato-dice*2']], drink: 'water' },
  'fish-dinner-tray': { bowl: ['rice-yellow', ['chickpea*4', 'herb*2']], drink: 'water' },
  'bukhari-lunch-tray': { bowl: ['greens', ['tomato-dice*3', 'cucumber*2']], drink: 'water' },
  'lahouh-breakfast': { drink: 'laban', dates: true },
  'laban-dates': { dates: true },
};

const VESSEL_TOP = { bowl: 1, plate: 1, platter: 1, pan: 1, board: 1, dish: 1, jar: 1, glass: 1 };

/** The whole tiny-world scene for one meal (200 × 150). */
function scene(meal) {
  const r = rng(hash(meal.id));
  const art = meal.art && meal.art.vessel ? meal.art : { vessel: 'plate', base: 'none', items: [] };
  const kind = VESSEL_TOP[art.vessel] ? art.vessel : 'plate';
  let items = parseItems(art.items);
  const types = new Set(items.map((i) => i.type));
  const cat = SCENE[meal.category] ? meal.category : 'dinner';
  const [bg, ground] = SCENE[cat];
  // a plate of "oats" is a flatbread (lahouh)
  const base = art.base === 'oats' && (kind === 'plate' || kind === 'platter') ? 'bread' : art.base;
  const tall = kind === 'jar' || kind === 'glass';
  const hot = !COLD_ID.test(meal.id) && (HOT_BASES.has(base) || kind === 'pan' || [...types].some((t) => HOT_ITEMS.has(t)));
  const extra = TRAYS[meal.id] ?? (tall || cat === 'snack' ? {} : { drink: 'water' });
  // chicken on a dome of rice is one roasted half chicken, as kabsa is served
  const half = (kind === 'platter' || kind === 'plate') && MOUND.has(base) && types.has('chicken');
  if (half) items = items.filter((it) => it.type !== 'chicken');
  // garnish: a few fresh herb flecks wherever the recipe has herbs
  if (!tall && (types.has('herb') || types.has('mint') || types.has('basil')) && !types.has('fleck')) items.push({ type: 'fleck', n: 10 });

  let s = 1; let mx = 100; let my = 90;
  if (extra.bowl) { s = .8; mx = 96; my = 92; }
  else if (extra.drink && !tall) { s = .9; mx = 108; my = 91; }
  else if (tall) { s = .9; mx = extra.dates ? 86 : 96; my = 88; }
  else { s = .94; }
  SWK = s < 1 ? Math.min(1.2, .96 / s) : 1;

  const dish = vessel(kind, base, items, r, 100, 90, { half });
  const topY = my + (TOP.y - 90) * s;
  let o = '';
  if (hot) { o += steam(mx, f(topY)); if (r() > .4) o += heart(mx, f(topY - 22), .9); }
  o += `<g transform="translate(${mx} ${my}) scale(${s}) translate(-100 -90)" stroke-width="${f(VSW * SWK)}">${dish}</g>`;
  SWK = 1;
  if (extra.bowl) o += sideBowl(168, 112, 18, extra.bowl[0], extra.bowl[1], r);
  if (extra.drink) o += drink(extra.bowl ? 30 : 32, 128, extra.drink, types.has('lemon') || types.has('lime'));
  if (extra.dates) o += tall ? dates(150, 120) : dates(168, 124);
  if (tall && !extra.dates) {
    // a few of the toppings on the ground beside the glass
    const loose = items.filter((it) => !DUST.has(it.type) && it.type !== 'mint').slice(0, 2).map((it) => ({ type: it.type, n: 2 }));
    o += drawItems(loose, 150, 124, 14, 5, r, { k: .9 });
  }
  return `<svg viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">${world(r, bg, ground)}${G_OPEN}${o}</g></svg>`;
}

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const cache = new Map();
const G_OPEN = `<g fill="none" stroke="${OL}" stroke-width="${VSW}" stroke-linecap="round" stroke-linejoin="round">`;

/** SVG illustration for a meal summary or record. */
export function mealArt(meal, { label = true } = {}) {
  // Same picture for the same id, category and art everywhere (server and browser).
  // Everything drawn below comes from these three fields only.
  const key = `${meal.id}|${meal.category ?? ''}|${JSON.stringify(meal.art ?? null)}`;
  if (!cache.has(key)) cache.set(key, scene(meal));
  const photo = PHOTOS[meal.id];
  const alt = `${label ? 'Illustration' : 'Image'} of ${meal.name}`;
  if (photo) return `<img src="${esc(photo)}" alt="${esc(alt.replace('Illustration', 'Photo'))}" loading="lazy">`;
  return cache.get(key).replace('<svg ', `<svg role="img" aria-label="${esc(alt)}" `);
}

/** Hero still life: several dishes in one tiny world. */
export function heroArt() {
  if (HERO_PHOTO) return `<img src="${esc(HERO_PHOTO)}" alt="A table of balanced, healthy meals">`;
  const r = rng(20261019);
  const W = 640; const H = 512;
  let o = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Illustration of balanced meals: a quinoa salad bowl, salmon with asparagus, a berry yogurt bowl and a green smoothie" preserveAspectRatio="xMidYMid slice">`;
  o += world(r, PAL.lav, PAL.sky, W, H) + G_OPEN;
  const place = (x, y, s, kind, base, items) => `<g transform="translate(${x} ${y}) scale(${s}) translate(-100 -90)">${vessel(kind, base, parseItems(items), r)}</g>`;
  o += place(510, 150, 1.2, 'bowl', 'yogurt', ['blueberry*6', 'strawberry*3', 'raspberry*3', 'mint*2']);
  o += place(110, 150, 1, 'glass', 'smoothie-tan', ['mint*2']);
  o += place(230, 280, 2.1, 'bowl', 'quinoa', ['chickpea*7', 'cucumber*5', 'tomato-cherry*5', 'feta*4', 'avocado*2', 'herb*7']);
  o += place(470, 370, 1.8, 'plate', 'none', ['salmon*1', 'asparagus*4', 'lemon*1', 'herb*4']);
  return `${o}</g></svg>`;
}

// Soft botanical leaf used by botanical() and teamPortrait().
const leaf = (x, y, s, rot, c1 = '#6CC07A', c2 = '#3E9B57') => `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${f(s)})"><path d="M0 -9 C7 -6 7 6 0 9 C-7 6 -7 -6 0 -9Z" fill="${c1}" stroke="${OL}" stroke-width="${f(1.6 / s)}"/><path d="M0 -6 L0 6" stroke="${c2}" stroke-width="${f(1.1 / s)}" fill="none" stroke-linecap="round"/></g>`;

/** Small decorative sprig used in empty states and panels. */
export function botanical(cls = 'botanical') {
  let o = `<svg class="${cls}" viewBox="0 0 160 120" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><ellipse cx="80" cy="110" rx="64" ry="9" fill="${PAL.sky}"/><path d="M28 108 C56 82 92 52 136 18" stroke="${OL}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
  for (let i = 1; i < 6; i++) {
    const x = 28 + i * 18; const y = 108 - i * 15;
    o += leaf(x - 7, y - 8, 1.5, -60 + i * 4, i % 2 ? '#6CC07A' : '#B9E08E') + leaf(x + 9, y + 3, 1.4, 150 - i * 4, i % 2 ? '#B9E08E' : '#6CC07A');
  }
  return `${o}${spark(20, 40, 6, PAL.gold)}${spark(146, 62, 4.4, PAL.violet)}${flower(136, 18, 3.4)}</svg>`;
}

/** Abstract tiny-world portrait used on team cards (no likeness implied). */
export function teamPortrait(initials, variant) {
  const pal = [[PAL.lav, PAL.lav2], [PAL.sky, PAL.sky2], [PAL.cream, PAL.lav2], [PAL.lav, PAL.sky2]][variant % 4];
  const r = rng(hash(initials) + variant);
  let ring = '';
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + r() * .3 - Math.PI / 2;
    const x = 58 + Math.cos(a) * 46; const y = 58 + Math.sin(a) * 46;
    ring += i % 3 === 0 ? flower(x, y, 2.8) : i % 3 === 1 ? spark(x, y, 4.6, PAL.gold) : spark(x, y, 4, PAL.violet);
  }
  return `<svg class="portrait" viewBox="0 0 116 116" role="img" aria-label="Decorative monogram ${initials}" xmlns="http://www.w3.org/2000/svg"><circle cx="58" cy="58" r="56" fill="${pal[0]}"/>${ring}<circle cx="59.4" cy="61" r="34" fill="${pal[1]}" stroke="${OL}" stroke-width="2.2"/><circle cx="58" cy="58" r="34" fill="#FFFFFF" stroke="${OL}" stroke-width="2.2"/><text x="58" y="66" text-anchor="middle" font-family="Poppins, system-ui, sans-serif" font-size="24" font-weight="600" fill="${OL}">${initials}</text></svg>`;
}

export function logoMark() {
  // A small "Tiny world" balance scale (ميزان): a base, pillar, beam and two pans, with a gold top knob.
  // Kept simple and bold so it still reads at 32 px (favicon).
  return `<svg viewBox="0 0 40 40" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="20" r="19" fill="#EEEDFA"/><path d="M11.4 29.2L20 24.9L28.6 29.2L20 33.5Z" fill="#FFFFFF" stroke="#2E2A86" stroke-width="1.5" stroke-linejoin="round"/><path d="M11.4 29.2V32L20 36.3V33.5Z" fill="#DCD9F7" stroke="#2E2A86" stroke-width="1.5" stroke-linejoin="round"/><path d="M20 33.5V36.3L28.6 32V29.2Z" fill="#C9C4F2" stroke="#2E2A86" stroke-width="1.5" stroke-linejoin="round"/><path d="M18.5 12V29.2A1.5 0.75 0 0 0 21.5 29.2V12" fill="#3730A3" stroke="#2E2A86" stroke-width="1.5" stroke-linejoin="round"/><path d="M8.8 13.6L4.8 21.4M8.8 13.6L12.8 21.4M31.2 13.6L27.2 21.4M31.2 13.6L35.2 21.4" stroke="#2E2A86" stroke-width="1.15" stroke-linecap="round"/><path d="M7.4 13.4H32.6" stroke="#2E2A86" stroke-width="3.3" stroke-linecap="round"/><path d="M7.4 13.4H32.6" stroke="#8B7CF6" stroke-width="1.1" stroke-linecap="round"/><ellipse cx="20" cy="10.5" rx="3.2" ry="2.1" fill="#E0A23B" stroke="#2E2A86" stroke-width="1.5"/><path d="M3.6 21.6A5.2 4.6 0 0 0 14 21.6Z" fill="#DCD9F7" stroke="#2E2A86" stroke-width="1.5" stroke-linejoin="round"/><ellipse cx="8.8" cy="21.6" rx="5.2" ry="1.8" fill="#FFFFFF" stroke="#2E2A86" stroke-width="1.5"/><path d="M26 21.6A5.2 4.6 0 0 0 36.4 21.6Z" fill="#DCD9F7" stroke="#2E2A86" stroke-width="1.5" stroke-linejoin="round"/><ellipse cx="31.2" cy="21.6" rx="5.2" ry="1.8" fill="#FFFFFF" stroke="#2E2A86" stroke-width="1.5"/></svg>`;
}
