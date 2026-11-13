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

// More surfaces, so dishes that look alike in the real world still differ here:
// each rice has its own colour, each porridge and paste its own shade and finish.
// `shape` on a bread base says how the bread is laid out (see flatbread()).
const BREAD = (fill, c, c2, more = {}) => ({ fill, c, c2, tex: 'bread', ...more });
Object.assign(BASES, {
  'rice-white': { fill: '#FBF7EE', c: '#E6DAC2', c2: '#FFFFFF', tex: 'rice' },
  'rice-saffron': { fill: '#FBF1DA', c: '#F2B32E', c2: '#FFFFFF', tex: 'rice' },
  'rice-bukhari': { fill: '#D2955A', c: '#A86A34', c2: '#EFC48A', spice: '#6E3E22', tex: 'rice' },
  'rice-camel': { fill: '#DE8E4A', c: '#B8672C', c2: '#F6C690', spice: '#7A3A22', tex: 'rice' },
  'rice-hassawi': { fill: '#B8644A', c: '#8E4430', c2: '#D9907A', tex: 'rice' },
  'rice-muhammar': { fill: '#C98A4A', c: '#9A5E2A', c2: '#E9B47A', tex: 'rice' },
  'rice-sayadiah': { fill: '#A86E44', c: '#7E4A28', c2: '#CF9A68', spice: '#5A3218', tex: 'rice' },
  'rice-chickpea': { fill: '#EED8A8', c: '#CDAE72', c2: '#FFF6DE', tex: 'rice' },
  'rice-lentil': { fill: '#F2C94A', c: '#D9A52E', c2: '#FBE6A0', spice: '#E9853E', tex: 'rice' },
  'rice-timman': { fill: '#F2A84A', c: '#D98A2E', c2: '#FBD9A0', spice: '#B8502A', tex: 'rice' },
  'rice-haneeth': { fill: '#F4CF6A', c: '#E0A83A', c2: '#FFF0BE', tex: 'rice' },
  'rice-mansaf': { fill: '#FBF4E2', c: '#E9DAB8', c2: '#FFFFFF', spice: '#F2C04B', tex: 'rice' },
  'rice-brown-plain': { fill: '#C9A06A', c: '#A07A44', c2: '#E3C494', tex: 'rice' },
  'rice-raw': { fill: '#F3F0E8', c: '#D6D0C0', c2: '#FFFFFF', tex: 'rice' },
  'rice-mash': { fill: '#FBF6EC', c: '#E6D6B4', c2: '#FFFFFF', tex: 'creamy' },
  mouflag: { fill: '#E58A4A', c: '#C2662E', c2: '#F6B47E', tex: 'grains' },
  tatmaj: { fill: '#CDAE7E', c: '#A8865A', c2: '#E9D2A6', tex: 'porridge' },
  vermicelli: { fill: '#EDB653', c: '#C98A2E', c2: '#FBDC94', tex: 'strands' },
  'rice-noodles': { fill: '#FBF8F0', c: '#E3DAC6', c2: '#FFFFFF', tex: 'strands' },
  'pasta-ww': { fill: '#C9965A', c: '#A8743A', c2: '#E3BC86', tex: 'strands' },
  'broth-yellow': { fill: '#EDB84E', c: '#C98E2E', oil: '#F8D670', tex: 'soup' },
  'broth-brown': { fill: '#9A5A30', c: '#7A4220', oil: '#C98A4A', tex: 'soup' },
  'broth-clear': { fill: '#F2D27A', c: '#D9AE4A', oil: '#FBE6A8', tex: 'soup' },
  'broth-pepper': { fill: '#C9663E', c: '#A64A2A', oil: '#E9944A', tex: 'soup' },
  'broth-bormah': { fill: '#D9A65A', c: '#B07E36', oil: '#EFC77A', tex: 'soup' },
  'stew-orange': { fill: '#E2763A', c: '#C25A26', chunk: '#B8643E', oil: '#F2A84A', tex: 'stew' },
  'stew-thick': { fill: '#CF6A3A', c: '#A84A24', chunk: '#E89A50', oil: '#EBA24A', tex: 'stew' },
  'stew-brown': { fill: '#8E5230', c: '#6A3A1E', chunk: '#B07040', oil: '#C98A4A', tex: 'stew' },
  'stew-mkashan': { fill: '#D9542E', c: '#B03A1E', oil: '#F28A3A', tex: 'soup' },
  'stew-qursan': { fill: '#C2502E', c: '#9A3A1E', chunk: '#B98A5A', oil: '#E9944A', tex: 'stew' },
  'stew-margouq': { fill: '#D2603A', c: '#AE4426', chunk: '#9A5A3C', oil: '#EFA04A', tex: 'stew' },
  'sauce-laban': { fill: '#FBF8F0', c: '#E3D9C4', c2: '#FFFFFF', tex: 'swirl' },
  'sauce-milk': { fill: '#FBF2E0', c: '#E9D6B4', c2: '#FFFFFF', tex: 'swirl' },
  'sauce-tahini': { fill: '#E9D3A0', c: '#CDB27A', c2: '#F6E8C6', tex: 'swirl' },
  'sauce-mrees': { fill: '#F6F0DE', c: '#DCD0B4', c2: '#FFFFFF', tex: 'swirl' },
  'bep-puree': { fill: '#DCC49A', c: '#BFA474', c2: '#F0E0BE', tex: 'swirl' },
  muhalla: { fill: '#6E3E26', c: '#4E2814', c2: '#9A6040', pool: '#F2C04B', tex: 'smooth' },
  ruwakah: { fill: '#FBF8F0', c: '#E6DCC8', c2: '#FFFFFF', tex: 'smooth' },
  telbanah: { fill: '#F3EAD6', c: '#DCCCA8', c2: '#FFFFFF', pool: '#F2C04B', tex: 'smooth' },
  mashghuthah: { fill: '#E9D9B8', c: '#CDB78E', c2: '#F8EEDA', pool: '#F2C04B', tex: 'smooth' },
  hamashah: { fill: '#D9BC8A', c: '#B89A64', c2: '#F2DDB2', tex: 'smooth' },
  matboukhah: { fill: '#FBF5E8', c: '#DDCDB0', c2: '#D9B47E', tex: 'crumbs' },
  thareef: { fill: '#FBF6EA', c: '#D9D2C0', c2: '#FFFFFF', tex: 'swirl' },
  fateet: { fill: '#5E3420', c: '#3E2010', c2: '#8A5634', tex: 'crumbs' },
  marsah: { fill: '#E9CF8A', c: '#C9A85A', c2: '#F6E6B4', pool: '#F2C04B', tex: 'smooth' },
  'ghee-fattah': { fill: '#C9A06A', c: '#A07A44', c2: '#E3C494', pool: '#F2C04B', tex: 'smooth' },
  mardhoufah: { fill: '#B8915E', c: '#94703E', c2: '#D9B888', pool: '#F6D26A', tex: 'smooth' },
  khawadhah: { fill: '#D9B880', c: '#B8945A', c2: '#EED6A6', tex: 'crumbs' },
  qishd: { fill: '#5A2E1E', c: '#3E1C10', c2: '#8A4A30', tex: 'smooth' },
  maasoubah: { fill: '#E9CF8E', c: '#C9AA5E', c2: '#F8E6B6', pool: '#C98A4A', tex: 'smooth' },
  'truffle-mash': { fill: '#D9C2A0', c: '#B89A74', c2: '#EEDCBE', tex: 'crumbs' },
  'iqt-drink': { fill: '#F6F0DE', c: '#C9BC9A', c2: '#FFFDF6', tex: 'specks' },
  kunafa: { fill: '#EE9A36', c: '#C9661F', c2: '#FBC57A', tex: 'shreds' },
  'aseedah-date': { fill: '#8A5A3A', c: '#6A3E26', c2: '#A8784E', pool: '#F2C04B', tex: 'smooth' },
  'aseedah-wheat': { fill: '#B8864E', c: '#946434', c2: '#D6A874', pool: '#F2C04B', tex: 'smooth' },
  'aseedah-white': { fill: '#EAD8B6', c: '#CDB68C', c2: '#FAF0DC', pool: '#F2C04B', tex: 'smooth' },
  'aseedah-meat': { fill: '#C8A472', c: '#A6824E', c2: '#E2C69A', tex: 'smooth' },
  shaathah: { fill: '#7A4A2E', c: '#5A321C', c2: '#FBF6E8', pool: '#F2C04B', tex: 'crumbs' },
  henaini: { fill: '#9A6234', c: '#74441E', c2: '#C08A58', tex: 'crumbs' },
  mathlouthah: { fill: '#5E3420', c: '#40200F', c2: '#8E5A38', tex: 'smooth' },
  mamroos: { fill: '#C49A68', c: '#A07A48', c2: '#E2C08E', tex: 'crumbs' },
  daleekah: { fill: '#E2B44A', c: '#B8862A', c2: '#F6D88A', tex: 'crumbs' },
  bukayla: { fill: '#7E4E30', c: '#5E3420', c2: '#A06E48', pool: '#F2C04B', tex: 'smooth' },
  areekah: { fill: '#8E6440', c: '#6E4A2A', c2: '#B08A5E', pool: '#E0A23B', tex: 'smooth' },
  masoub: { fill: '#D9B07A', c: '#B88A50', c2: '#F0D2A2', tex: 'crumbs' },
  khameea: { fill: '#B89068', c: '#987048', c2: '#D6B48A', pool: '#F2C04B', tex: 'smooth' },
  'jareesh-dry': { fill: '#E3D2AE', c: '#C2AA7E', c2: '#F6EBD2', tex: 'grains' },
  'wheat-grains': { fill: '#D2A866', c: '#A87E40', c2: '#E9CB94', tex: 'grains' },
  'flour-white': { fill: '#FFFFFF', c: '#E2DDD2', c2: '#FFFFFF', tex: 'powder' },
  'flour-ww': { fill: '#D9BE92', c: '#B89A6A', c2: '#ECD9B8', tex: 'powder' },
  'flour-millet': { fill: '#F2E2B0', c: '#D2BE84', c2: '#FBF2D6', tex: 'powder' },
  'flour-sorghum': { fill: '#B86A4A', c: '#94503A', c2: '#D69478', tex: 'powder' },
  'lentil-red': { fill: '#EE8A40', c: '#C9661F', c2: '#F8B070', tex: 'seeds' },
  'pomegranate-arils': { fill: '#B8243E', c: '#7A1028', c2: '#E8566E', tex: 'seeds' },
  'lentil-brown': { fill: '#8A6A3E', c: '#5E4422', c2: '#A88A5A', tex: 'seeds' },
  'egg-white': { fill: '#F8F6EA', c: '#E6E2CE', c2: '#FFFFFF', tex: 'swirl' },
  'yogurt-thick': { fill: '#FFFFFF', c: '#E1DAD0', c2: '#F4F0EA', tex: 'swirl' },
  milk: { fill: '#FFFFFF', c: '#ECE8F4', c2: '#FFFFFF', tex: 'none' },
  'soy-milk': { fill: '#F3E6C8', c: '#DCC9A0', c2: '#F8EEDA', tex: 'none' },
  'almond-milk': { fill: '#F6EEDF', c: '#E2D6BE', c2: '#FBF6EC', tex: 'none' },
  'juice-orange': { fill: '#F5A23A', c: '#D9821E', c2: '#F8BE6A', tex: 'none' },
  'lemon-juice': { fill: '#F6E68A', c: '#D9C454', c2: '#FBF1B8', tex: 'none' },
  'lime-juice': { fill: '#D6E68A', c: '#AFC454', c2: '#E6F0B0', tex: 'none' },
  'milk-choc': { fill: '#B8865E', c: '#94643E', c2: '#CFA07A', tex: 'none' },
  water: { fill: PAL.water, c: '#4AA8D9', c2: PAL.waterTop, tex: 'none' },
  // breads
  'bread-qurs': BREAD('#EBC25A', '#B88A2E', '#F2D47A', { shape: 'stack', n: 5, spot: '#B07A2E', seeds: '#1E1A1A' }),
  'bread-red': BREAD('#A8583A', '#7E3A24', '#C27A5A', { shape: 'stack', n: 2, spot: '#6E2E1E', seeds: '#8A9E4E', seeds2: '#1E1A1A' }),
  'bread-mifa': BREAD('#D9A050', '#A86A28', '#EEC27A', { shape: 'oval', spot: '#6E3A1E' }),
  'bread-khameerah': BREAD('#B8644A', '#8A4430', '#D08A6E', { shape: 'thick', holes: 22 }),
  'bread-malla': BREAD('#C98A4A', '#94602E', '#E0AA6A', { shape: 'loaf', spot: '#9A9488', size: 1.2 }),
  'bread-muqana': BREAD('#7A4A2A', '#5A321C', '#9A6440', { shape: 'loaf', spot: '#4A2814', size: .95 }),
  'bread-masali': BREAD('#EBCB8E', '#B88E50', '#F6E2B6', { shape: 'sheet', spot: '#B07A3E' }),
  'bread-samh': BREAD('#7E7064', '#5A5048', '#9E9084', { shape: 'sheet', spot: '#4A4038', nSpots: 40, size: .9 }),
  'bread-shurak': BREAD('#F3E2BE', '#C9A06A', '#FBF1DC', { shape: 'folded', spot: '#C9A06A' }),
  'bread-ruqsh': BREAD('#F6E8CA', '#C9A874', '#FFF8E8', { shape: 'stack', n: 7, spot: '#D2B07A', size: .96 }),
  'bread-corn': BREAD('#C27A4A', '#94502E', '#DE9A68', { shape: 'small', spot: '#5E2E1A' }),
  'bread-lahouh': BREAD('#F3DFA0', '#A8763A', '#FBEFC8', { shape: 'pancakes', holes: 30, holeSize: 1.6 }),
  'bread-tawah': BREAD('#E0A84E', '#B07A2E', '#F2C87A', { shape: 'small', puffed: true }),
  'bread-masabeeb': BREAD('#D49A52', '#A86E2E', '#E9BA7A', { shape: 'pancakes', holes: 10 }),
  'bread-marasee': BREAD('#E3BC86', '#B98A50', '#F2D6AA', { shape: 'layers', sauce: '#D2402A' }),
  'bread-saj': BREAD('#F1DDB2', '#C9A06A', '#FBF0D6', { shape: 'folded', spot: '#B88A50', size: 1.08 }),
  'bread-ww': BREAD('#B98A56', '#8E6234', '#D2A876', { shape: 'stack', n: 2, spot: '#7A522A' }),
  'bread-arabic': BREAD('#EBCB96', '#C2965A', '#F6E2BC', { shape: 'stack', n: 3, spot: '#B88A50', size: .9 }),
});
for (const b of ['rice-white', 'rice-saffron', 'rice-bukhari', 'rice-camel', 'rice-hassawi', 'rice-muhammar', 'rice-sayadiah', 'rice-chickpea', 'rice-lentil', 'rice-timman', 'rice-haneeth', 'rice-mansaf',
  'rice-brown-plain', 'aseedah-date', 'aseedah-wheat', 'aseedah-white', 'aseedah-meat', 'shaathah', 'henaini', 'mamroos', 'daleekah', 'areekah', 'masoub', 'mathlouthah']) MOUND.add(b);
for (const b of ['rice-white', 'rice-saffron', 'rice-bukhari', 'rice-camel', 'rice-hassawi', 'rice-muhammar', 'rice-sayadiah', 'rice-chickpea', 'rice-lentil', 'rice-timman', 'rice-haneeth', 'rice-mansaf',
  'rice-mash', 'mouflag', 'tatmaj', 'broth-yellow', 'broth-brown', 'broth-pepper', 'broth-bormah', 'stew-orange', 'stew-thick', 'stew-brown', 'stew-mkashan', 'stew-qursan', 'stew-margouq',
  'sauce-laban', 'sauce-milk', 'sauce-mrees', 'bep-puree', 'muhalla', 'ruwakah', 'telbanah', 'mashghuthah', 'hamashah', 'matboukhah', 'thareef', 'marsah', 'ghee-fattah', 'mardhoufah',
  'maasoubah', 'aseedah-date', 'aseedah-wheat', 'aseedah-white', 'aseedah-meat', 'khameea', 'fateet']) HOT_BASES.add(b);
for (const t of ['lamb', 'lamb-roast', 'camel', 'fish-fried', 'fish-tahini', 'fish-piece', 'meatball', 'muttabaq-meat', 'muttabaq-chicken', 'aish-pie']) HOT_ITEMS.add(t);

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
  // a date: glossy dark skin, a lighter shoulder, fine wrinkles and the pale stem end
  date: (v) => `<path d="M-9.4 0C-9.4-3.4-5-5 0-5C5-5 9.4-3.4 9.4 0C9.4 3.4 5 5 0 5C-5 5-9.4 3.4-9.4 0Z" fill="#6E3222"/><path d="M-6.6-2.6C-3-4.2 3-4.2 6.8-2.4" stroke="#A0574A" stroke-width="2"/><path d="${['M-5 1q2-1 4 .4q2 1 4-.4M-1 3.2q2-.8 4 0', 'M-6 .6q2.4-1.2 4.8 0M1 2q2 .8 4-.6M-3 3.4l2.6-.4', 'M-4.6 2q3-1.4 6 0M2-.4l3.4.8'][v % 3]}" stroke="#4A1C12" stroke-width="1"/><ellipse cx="-3.4" cy="-2.6" rx="2.8" ry=".9" fill="#FFFFFF" opacity=".45" stroke="none"/><path d="M-9-1.2v2.4" stroke="#D2A866" stroke-width="2"/>`,
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
  raisin: (v, c = '#5E3A2A', hi = '#8E6250') => `<ellipse rx="2.8" ry="2" fill="${c}" stroke-width="1"/><path d="M-1.2-.4q1.2.8 2.4 0" stroke="${hi}" stroke-width=".9"/>`,
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

// ---------------------------------------------------------------- more foods (Saudi dishes, ingredients, portions)
// Same rules as above: local units centred on 0,0, one ink outline, real food colours.
// Some take colour arguments ("jar~#C98A4E~#E0A23B").
const jit = (v, i) => { const x = Math.sin((v + 1) * 12.9898 + i * 78.233) * 43758.5453; return x - Math.floor(x); };
// Kunafah's shredded pastry: short strands over the top in two tones, and down the side.
const KUNAFA_TOP = (() => { const d = ['', '']; for (let i = 0; i < 46; i++) { const a = i * 2.39996; const k = Math.sqrt((i + .5) / 46) * .9; const x = Math.cos(a) * 30 * k; const y = Math.sin(a) * 12 * k; d[i % 3 ? 0 : 1] += `M${P(x - 1.8, y)}q1.8 ${i % 2 ? -1.2 : 1.2} 3.6 0`; } return d; })();
const KUNAFA_SIDE = (() => { let d = ''; for (let i = 0; i < 18; i++) { const t = (i + .5) / 18 * Math.PI; const x = -Math.cos(t) * 29; const y = Math.sin(t) * 11.6; d += `M${P(x, y + 1)}v2.6M${P(x + 1.4, y + 9)}v2`; } return d; })();
/** A soft lumpy outline (meat, dough, truffle), the same for the same variant. */
function blobD(rx, ry, v, wob = 0.16, n = 8) {
  const p = [];
  for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; const k = 1 + (jit(v, i) - 0.5) * wob * 2; p.push([Math.cos(a) * rx * k, Math.sin(a) * ry * k]); }
  const m = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  let d = `M${P(...m(p[n - 1], p[0]))}`;
  for (let i = 0; i < n; i++) d += `Q${P(...p[i])} ${P(...m(p[i], p[(i + 1) % n]))}`;
  return `${d}Z`;
}
const blob = (rx, ry, fill, v = 0, wob) => `<path d="${blobD(rx, ry, v, wob)}" fill="${fill}"/>`;
const boneEnd = (x, y, dx, dy, w = 5) => `<path d="M${x} ${y}l${dx} ${dy}" stroke-width="${w}"/><path d="M${x} ${y}l${dx} ${dy}" stroke="${PAL.bone}" stroke-width="${n1(w * .5)}"/><circle cx="${n1(x + dx * 1.1)}" cy="${n1(y + dy * 1.1)}" r="${n1(w * .52)}" fill="${PAL.bone}"/>`;
/** A lamb (or camel) piece: lean meat with a fat edge, sometimes a bone. */
const meat = (fill, fat, line, hi, bone) => (v) => `${blob(11, 7.6, fill, v, .2)}<path d="${blobD(8, 4.8, v + 7, .2)}" transform="translate(-1 -1.8)" fill="${hi}" stroke="none"/><path d="${['M-10-1C-9-5-6-7-2-7.4', 'M3-7C7-6.6 10-4 10.4-.6', 'M-9 2C-10-2-8-5-5-6.4'][v % 3]}" stroke="${fat}" stroke-width="2.4"/><path d="${['M-4 0l5 1.4M-1 3l5 .6', 'M-5 1l4 1M1-1l5 1.6', 'M-3 2l6 .4M-2-1.6l4 1'][v % 3]}" stroke="${line}" stroke-width="1.1" opacity=".7"/>${bone && v % 4 === 1 ? boneEnd(8, 3, 4, 2, 4.4) : ''}`;
const FISH = 'M-22 0C-16-10 6-11 14-4L22-10L20 0L22 10L14 4C6 11-16 10-22 0Z';
/** A whole fish lying on its side. */
const fishWhole = (body, belly, line, spot) => `<path d="${FISH}" fill="${body}"/><path d="M-20 2C-12 8 4 8 12 3" stroke="${belly}" stroke-width="2.4"/><path d="M-6-8C-2-11 4-10 8-7" stroke="${line}" stroke-width="2"/>${spot ? dots('M-6-2v.1M0 1v.1M5-3v.1M-2-5v.1M8 1v.1M2 4v.1', spot, 1.8) : '<path d="M-8-6l-3 10M-2-7l-3 11M4-6.4l-3 10" stroke="' + line + '" stroke-width="1.5"/>'}<circle cx="-15" cy="-2" r="1.9" fill="#FFFFFF" stroke-width="1"/><circle cx="-15" cy="-2" r=".8" fill="${OL}" stroke="none"/><path d="M-11-4.4q1.2 4.4 0 8.8" stroke="${line}" stroke-width="1.3"/>`;
/** A 3/4 block (tofu, butter, cheese): top, front and side faces. */
const block = (w, h, d, top, front, side) => `<path d="M${-w / 2} ${-h / 2}l${d} ${-d * .7}h${w}l${-d} ${d * .7}Z" fill="${top}"/><path d="M${-w / 2} ${-h / 2}h${w}v${h}h${-w}Z" fill="${front}"/><path d="M${w / 2} ${-h / 2}l${d} ${-d * .7}v${h}l${-d} ${d * .7}Z" fill="${side}"/>`;
/** A glass jar with a lid and a plain label (spreads, pastes, honey). */
const jarItem = (content, lid = PAL.indigo, label = '#FFFFFF') => `<path d="M-11-10H11V11C11 15-11 15-11 11Z" fill="${content}"/><path d="M-8-6V9" stroke="#FFFFFF" stroke-width="2" opacity=".7"/><rect x="-12.4" y="-16" width="24.8" height="7" rx="2.4" fill="${lid}"/><rect x="-8" y="-2" width="16" height="9" rx="2.4" fill="${label}" stroke-width="1.2"/><path d="M-4 2.6h8" stroke="${lid}" stroke-width="1.4"/>`;
/** A bottle (oil, vinegar, sauce, syrup). */
const bottleItem = (liquid, cap = PAL.indigo, glass = '#FFFFFF') => `<path d="M-4-22h8v6C4-12 10-10 10-4V16C10 19-10 19-10 16V-4C-10-10-4-12-4-16Z" fill="${glass}" fill-opacity=".85"/><path d="M-10 0V16C-10 19 10 19 10 16V0Z" fill="${liquid}" stroke="none"/><path d="M-4-22h8v6C4-12 10-10 10-4V16C10 19-10 19-10 16V-4C-10-10-4-12-4-16Z"/><rect x="-5" y="-27" width="10" height="6" rx="2" fill="${cap}"/><path d="M-6-2V12" stroke="#FFFFFF" stroke-width="2" opacity=".8"/><rect x="-7" y="3" width="14" height="8" rx="2" fill="#FFFFFF" stroke-width="1.1"/>`;
/** A tin can (side and top ellipse) with a band label. */
const canItem = (label, band = '#FFFFFF', top = '#D9D6E6') => `<path d="M-11-9V9a11 4 0 0 0 22 0V-9" fill="${label}"/><path d="M-11-3a11 4 0 0 0 22 0v6a11 4 0 0 1-22 0Z" fill="${band}" stroke-width="1.1"/><ellipse cy="-9" rx="11" ry="4" fill="${top}"/><ellipse cy="-9" rx="8" ry="2.6" stroke="#A9A4C4" stroke-width="1"/>`;
/** A heap of powder or tiny seeds. */
const pile = (fill, speck, hi) => `<path d="M-15 4C-12-5-5-11 0-11C5-11 12-5 15 4C9 7-9 7-15 4Z" fill="${fill}"/>${speck ? dots('M-7 0v.1M-2-5v.1M4-2v.1M8 2v.1M-1 2v.1M2-8v.1M-9 3v.1M6-6v.1', speck, 1.6) : ''}<path d="M-5-7q3-2.4 6-2" stroke="${hi ?? '#FFFFFF'}" stroke-width="1.6" opacity=".8"/>`;
/** A small bunch of herbs: stems and leaves. */
// style: leaf (pointed, veined when `vein`), curly (parsley: tight clusters), lobed (coriander: round three-lobed), round (purslane: fleshy ovals)
const bunch = (leaf, stem, len = 8, vein, style = 'leaf') => {
  let o = `<path d="M0 14L-2-3M0 14L3-5M0 14L-6-1M0 14L7-2M0 14L1-11" stroke="${stem}" stroke-width="1.5"/>`;
  [[-2, -4, 20], [3, -6, -30], [-7, -2, 60], [8, -3, -60], [-3, -10, 10], [4, -12, -20], [0, -15, 80], [-8, -8, 40], [9, -9, -40]].forEach(([x, y, rot], i) => {
    const g = (inner) => `<g transform="translate(${x} ${y}) rotate(${rot - 90})" stroke-width="1">${inner}</g>`;
    if (style === 'curly') o += g(`<path d="${blobD(len * .5, len * .42, i + 4, .34, 7)}" fill="${leaf}"/><path d="M-1-1q1 1 2 0" stroke="${vein ?? '#2F7F3E'}" stroke-width=".9"/>`);
    else if (style === 'lobed') o += g(`<circle cx="${n1(-len * .3)}" r="${n1(len * .3)}" fill="${leaf}"/><circle cx="${n1(len * .3)}" r="${n1(len * .3)}" fill="${leaf}"/><circle cy="${n1(-len * .3)}" r="${n1(len * .32)}" fill="${leaf}"/>`);
    else if (style === 'round') o += g(`<ellipse rx="${n1(len * .5)}" ry="${n1(len * .34)}" fill="${leaf}"/>${hiDot(-1, -1, 1.2, .6, '#A9D88A')}`);
    else o += g(vein ? leafV(len, leaf, vein) : leafShape(len, leaf));
  });
  return `${o}<path d="M-2.4 10.4h4.8" stroke="${PAL.violet}" stroke-width="2.4"/>`;
};
/** A muttabaq: folded crisp square pastry, the cut side shows the filling. */
const muttabaq = (inner, speck) => `<path d="M-16-2L2-10L18-4L0 4Z" fill="#EBB862"/><path d="M-16-2L0 4V10L-16 4Z" fill="#C9853A"/><path d="M0 4L18-4V2L0 10Z" fill="${inner}"/><path d="M0 6.6L18-1.4" stroke="#E3A24E" stroke-width="1.2"/>${speck ? dots('M4 5v.1M8 2.4v.1M12 1.6v.1M15-1v.1', speck, 1.6) : ''}<path d="M-9-1.6L8-6M-6 1L10-5.4" stroke="#D2943E" stroke-width="1.1"/><path d="M-12-2.4l9-4" stroke="#FBDC9A" stroke-width="1.6"/>`;
/** A plain cup with a drink (laban, coffee) seen at 3/4. */
const cupItem = (drinkC, body = '#FFFFFF') => `<path d="M-7-5h14l-1.6 9a5.4 2 0 0 1-10.8 0Z" fill="${body}"/><ellipse cy="-5" rx="7" ry="2.2" fill="${drinkC}"/>`;

Object.assign(ITEMS, {
  // meat
  lamb: meat('#7E4026', '#F3E2C6', '#4E2412', '#A8603A', true),
  'lamb-pale': meat('#B88A6E', '#FBF2E2', '#8A644E', '#D6B49A', true),
  camel: meat('#62281C', '#F3E6C8', '#3E140C', '#8A4434', false),
  'lamb-roast': (v) => `${blob(16, 10, '#6E3A1E', v, .14)}<path d="M-11-5C-5-9 6-9 12-5" stroke="#A8643A" stroke-width="3"/><path d="M-6 2q5 3 11 0" stroke="#4E2814" stroke-width="1.4"/>${boneEnd(12, 4, 7, 4, 6)}${dots('M-8-1v.1M-2-4v.1M4-1v.1M8-4v.1M-4 4v.1M1 1v.1', '#FFFFFF', 1.8)}`,
  'meat-cube': () => cube(6.4, '#8A4A2E', '#B8784E'),
  'fat-cube': () => cube(6, '#F6EBD6', '#FFFFFF'),
  liver: (v) => `${blob(6, 4, '#5A2232', v)}${hiDot(-2, -1.4, 1.6, .7, '#8A4A5A')}`,
  kidney: () => `<path d="M-6 0C-6-5 0-5.4 1-2.6C2-5 6-4 6 0C6 4.6-6 4.6-6 0Z" fill="#7A3038"/>${hiDot(-3, -1.6, 1.4, .7, '#A85A62')}`,
  // boiled chicken (cooked in laban or broth): a pale drumstick with its bone
  'chicken-boiled': () => `<path d="M-11-2C-11-9 1-10 5-5C7-2 7 2 5 4.6C1 10-11 7-11-2Z" fill="#E6BE86"/>${boneEnd(4, 1, 7, 2.4, 4.6)}<path d="M-7-4q4-3 8-1" stroke="#F6DCB0" stroke-width="1.6"/><path d="M-6 3q3 1.4 6 0" stroke="#C49860" stroke-width="1.2"/>`,
  meatball: () => `${ball(5.2, '#94562E', '#C98A50')}${dots('M-1 2v.1M2-1v.1', '#6A3A1E', 1.2)}`,
  'fish-fried': () => `${fishWhole('#C98A3E', '#E9B866', '#8A5420')}${dots('M-12 3v.1M-4 5v.1M4 4v.1M9 1v.1M-8-3v.1M0-2v.1M7-4v.1', '#9A5E24', 1.5)}<path d="M-14-6C-8-9 2-9 8-7" stroke="#FFFFFF" stroke-width="1.6" opacity=".55"/>`,
  'fish-tahini': () => `${fishWhole('#D9A050', '#F2CE8C', '#9A6228')}<path d="M-10-2C-4-6 4-6 10-1C6 3-4 4-10-2Z" fill="#EFDDB0" stroke-width="1.2"/>`,
  'fish-raw': (v, body = '#C9B2B8', belly = '#EEE4E6', line = '#E07A6E', spot = '') => fishWhole(body, belly, line, spot || null),
  'fish-piece': (v) => `${blob(9, 6, '#D9A050', v)}<path d="M-5-3q4-2 9 0" stroke="#F2CE8C" stroke-width="1.6"/>${dots('M-3 1v.1M2 2v.1M5-1v.1M-6-1v.1', '#A86A2A', 1.4)}`,
  'fish-steak': () => `${slice(8, '#E9925E', '#B8643E', null, 2.6)}<ellipse rx="6" ry="2.8" stroke="#F6C29A" stroke-width="1.2"/><path d="M0-1.6v3.2M-1.6 0h3.2" stroke="#FFFFFF" stroke-width="1.2"/>`,
  'fillet-raw': (v, top = '#F7956A', side = '#D9704A', line = '#FFE0D0') => `${fillet(top, side)}<path d="M-16-6.6q-3 7 0 14.6M-7-8.6q-3 8.4 0 17.6M2-9.4q-3 9 0 18.4M11-8q-3 7.4 0 15" stroke="${line}" stroke-width="1.6"/>${hiDot(-14, -6, 2.4, 1)}`,
  'shrimp-raw': () => `<path d="M5-5A7 7 0 1 1-5 4.6" stroke-width="7.2"/><path d="M5-5A7 7 0 1 1-5 4.6" stroke="#E6B0A8" stroke-width="3.8"/><path d="M-5 4.6L-9.4 6.6L-7 2.4Z" fill="#D9908A" stroke-width="1.1"/><path d="M7.4 1.4L4.6.6M3.6 6.4L2 4.2M-1.6 7L-.8 4.6" stroke="#F6D6D0" stroke-width="1"/>`,
  'tripe-roll': () => `${stick(9, 20, '#D9B060')}<path d="M-4.5-4h9M-4.5 4h9" stroke="#8A6A2E" stroke-width="1.6"/><path d="M-2-8v14" stroke="#F2D9A0" stroke-width="1.2"/>`,
  'drum-raw': () => `<path d="M-12-2C-12-10 2-11 6-5C8-2 8 2 6 5C2 11-12 8-12-2Z" fill="#F2B4A4"/>${boneEnd(5, 1, 9, 3, 5.4)}<path d="M-8-4q4-3 9-1" stroke="#FBD6CC" stroke-width="1.6"/>`,
  'breast-raw': () => `${fillet('#F4B8A8', '#D9907E')}<path d="M-14-6C-6-10 4-11 12-9" stroke="#FBD8CE" stroke-width="1.8"/><path d="M-8 2q8 3 18-1" stroke="#E9A090" stroke-width="1.2"/>`,
  'mince-raw': (v) => `${blob(15, 9, '#EBA898', v, .12)}<path d="M-9-3q2-2 4 0M-2-5q2-2 4 0M5-2q2-2 4 0M-6 2q2-2 4 0M1 3q2-2 4 0M-12 1q2-2 4 0" stroke="#C97A6E" stroke-width="1.2"/>${hiDot(-6, -5, 3, 1.2, '#F8CEC4')}`,
  'lamb-raw': (v) => `${blob(14, 9, '#C2453E', v)}<path d="M-11-4C-5-9 6-9 12-4" stroke="#FBEFE0" stroke-width="3.2"/><path d="M-4 1q4 3 9 0M-8 4q3 2 6 1" stroke="#9A2E2A" stroke-width="1.3"/><path d="M-9-1q3 1.4 6-.6M1-3q3 1 6-.4M-2 5q3-1 5 0" stroke="#F6D8CE" stroke-width="1"/>${boneEnd(10, 3, 8, 4, 6)}`,
  'tail-fat': (v) => `${blob(9, 6.4, '#FAF2E2', v)}<path d="M-5-1q5-3 10 0" stroke="#E6D6BA" stroke-width="1.3"/>${hiDot(-4, -3, 2, .9)}`,
  // dough and bread pieces
  'dough-sheet': (v) => `<path d="${v % 2 ? 'M-10-3C-6-7 6-6 10-3C11 1 8 5 2 5C-4 6-10 4-11 0Z' : 'M-11-1C-8-6 5-7 10-4C12 0 9 4 3 5C-3 6-9 4-11-1Z'}" fill="#F3E4C6"/><path d="M-7-1C-2-3 3-3 8-1" stroke="#D9C094" stroke-width="1.3"/>`,
  'dough-disc': () => `${slice(6.6, '#F3E2BE', '#D9BF8E', null, 2.4)}<path d="M-3-1q3-1.6 6 0" stroke="#FFFFFF" stroke-width="1.1"/>`,
  'dough-thick': () => `${slice(8.4, '#F1DDB2', '#D2B47E', null, 4.6)}<path d="M-4-1.4q4-2 8 0" stroke="#FFFFFF" stroke-width="1.2"/>`,
  'dough-finger': () => `${stick(5.4, 18, '#EFD9AE')}<path d="M-1-6v12" stroke="#FBEBCB" stroke-width="1.1"/>`,
  ear: () => `<path d="M-6 3C-8-4-2-8 3-6C8-4 7 3 3 4C1 2-2 2-6 3Z" fill="#F3E2C2"/><path d="M-2 0q2-3 5-2" stroke="#D9C094" stroke-width="1.2"/>`,
  dumpling: () => `<path d="M-13 3.6C-13-9.6 13-9.6 13 3.6C8.4 6-8.4 6-13 3.6Z" fill="#FAF0DC"/><path d="M-8-3l1 2M-4-5.4l.6 2.4M0-6v2.4M4-5.4l-.6 2.4M8-3l-1 2" stroke="#D9C49A" stroke-width="1.2"/>${hiDot(-5, -1, 2, .8)}`,
  'bread-piece': (v, crust = '#D9A55E', crumb = '#F1D7A2') => `${blob(7, 5, crust, v, .3)}<path d="${blobD(4.4, 3, v + 3, .3)}" fill="${crumb}" stroke="none"/>`,
  'muttabaq-meat': () => muttabaq('#9A5A3A', '#7CC45A'),
  'muttabaq-chicken': () => muttabaq('#EBCB9A', '#7CC45A'),
  'muttabaq-banana': () => muttabaq('#F6E39A', '#C9A04A'),
  'muttabaq-cheese': () => muttabaq('#FFFDF4', '#E6B52E'),
  'ring-bread': () => `<ellipse rx="15" ry="9" fill="#C9853E"/><ellipse rx="5.4" ry="2.8" fill="${PAL.cream}" stroke-width="1.4"/><path d="M-11-3q11-7 22 0" stroke="#E9B06A" stroke-width="2"/>${dots('M-9-1v.1M-5-5v.1M0-6.4v.1M5-5v.1M9-1v.1M-8 4v.1M8 4v.1M0 6v.1M-4 1v.1', '#FBF1D6', 1.8)}`,
  kleja: () => `${slice(9, '#D9A050', '#B07A30', null, 2.4)}<ellipse rx="6" ry="3" stroke="#A86A28" stroke-width="1.1"/><path d="M-6 0h12M0-3v6M-4-2l8 4M-4 2l8-4" stroke="#A86A28" stroke-width=".9"/>`,
  maamoul: () => `${dome(9, 7, '#F2DAA6')}<path d="M-6-3l2 2.6M-2-6l1 3M3-6l-1 3M7-3l-2 2.6M-3-8.6h6" stroke="#C9A060" stroke-width="1.1"/>`,
  tuweetat: () => `${stick(7, 13, '#D99A48')}<path d="M-3.5-3h7M-3.5 0h7M-3.5 3h7" stroke="#B0702A" stroke-width="1"/>${dots('M-2-5v.1M2-4v.1M0-1v.1M-2 3v.1M2 4v.1', '#FFFFFF', 2.2)}`,
  spiral: () => { const d = 'M-2 0a2 2 0 1 1 4 0a4 4 0 1 1-8 0a6 6 0 1 1 12 0a8 8 0 1 1-16 0'; return `<g transform="scale(1 .62)"><path d="${d}" stroke-width="5.6"/><path d="${d}" stroke="#F28C1E" stroke-width="3"/></g>${dots('M-4-2v.1M3 1v.1', '#FCD08A', 1.4)}`; },
  jubniyah: () => `${slice(7, '#D9963E', '#A8642A', '#E9B466', 3.4)}${hiDot(-3, -1.4, 1.6, .6)}`,
  puff: (v) => `${blob(6, 4.8, '#D99A48', v, .2)}<path d="M-3-2q2-1.6 4-.6" stroke="#FBD79A" stroke-width="1.4"/>`,
  fritter: (v) => `${blob(8, 5.6, '#C98A3E', v, .34)}${dots('M-3-1v.1M2 1v.1M4-2v.1', '#6CAE4E', 1.6)}<path d="M-4-2q3-2 6-1" stroke="#E9B466" stroke-width="1.3"/>`,
  fudge: () => `${cube(9, '#FBF1DC')}<path d="M-3-1l2-1M1 2l2-1" stroke="#D9485A" stroke-width="1.6"/>`,
  'kunafa-cake': (v, mid = '#FFFDF6', top = '#EE9A36') => `<path d="M-30 0v11a30 12 0 0 0 60 0V0" fill="#D9762A"/><path d="${KUNAFA_SIDE}" stroke="#A84E16" stroke-width=".9"/><path d="M-30 4.4a30 12 0 0 0 60 0v3.6a30 12 0 0 1-60 0Z" fill="${mid}" stroke-width="1.1"/><ellipse rx="30" ry="12" fill="${top}"/><path d="${KUNAFA_TOP[0]}" stroke="#FBC57A" stroke-width="1.2"/><path d="${KUNAFA_TOP[1]}" stroke="#B8561A" stroke-width="1.1"/><path d="M0 0L30 0M0 0L9 11.4" stroke="#9A4410" stroke-width="1.5"/><path d="M-22-5C-14-9 0-10 10-8" stroke="#FFFFFF" stroke-width="2" opacity=".5"/>`,
  'aish-pie': (v, fill = '#8A4A2E', speck = '#7CC45A') => `${slice(15, '#E3A24E', '#B9782F', null, 3.4)}<ellipse rx="11" ry="5.4" fill="${fill}" stroke-width="1.2"/>${dots('M-6-1v.1M-1 2v.1M4-2v.1M7 1v.1M-3-3v.1', speck, 1.8)}${dots('M-13-1v.1M-9-5v.1M9-5v.1M13 0v.1M0 6.6v.1M-6 6v.1M6 6v.1', '#FBF1D6', 1.6)}`,
  'cake-round': () => `<path d="M-18 0v8a18 7 0 0 0 36 0V0" fill="#E9A23A"/><ellipse rx="18" ry="7" fill="#F2BE52"/><path d="M-12-1q12-6 24 0" stroke="#FBDC8A" stroke-width="1.8"/>${dots('M-10 0v.1M-5-3v.1M0-4v.1M5-3v.1M10 0v.1M-6 2v.1M0 3v.1M6 2v.1M-13 2v.1M13 2v.1', '#FBF3DC', 1.8)}`,
  // vegetables and garnish in dishes
  'pumpkin-cube': () => `${cube(7, '#F28A2E', '#F8B87A')}<path d="M-3.5 3.5h7" stroke="#8A9A3E" stroke-width="1.6"/>`,
  'eggplant-piece': () => `<path d="M-9-2C-9-5 9-5 9-2V2C9 5-9 5-9 2Z" fill="#F1E2C4"/><path d="M-9 2C-9 5 9 5 9 2" stroke="#5E3A6E" stroke-width="2.4"/>${dots('M-4-1v.1M0 0v.1M4-1v.1', '#C9B08A', 1.2)}`,
  'zucchini-whole': () => `${stick(7, 30, '#4E8E3A')}<path d="M-1.4-12V12M1.6-11V11" stroke="#7DB65A" stroke-width="1"/><circle cy="-15" r="2" fill="#A9C97E"/>`,
  'chili-green': () => `<path d="M-10 2C-6-3 4-4 10-1C6 2-4 5-10 2Z" fill="#4FA040"/><path d="M10-1l3-3" stroke="#3E7B2E" stroke-width="2"/><path d="M-6 0q5-2 10-1" stroke="#A9DB7E" stroke-width="1.1"/>`,
  'chili-red': () => `${ball(4, '#D9302A', '#F07A6E')}<path d="M0-4v-2.4" stroke="#3E7B2E" stroke-width="1.6"/>`,
  'black-lime': () => `${ball(4.6, '#4A3426', '#7A5E4A')}<path d="M-3-1.4q3 2 6 0M-3.4 1.6q3.4 2 6.8 0" stroke="#7A5E4A" stroke-width=".9"/>`,
  'cinnamon-stick': () => `${stick(4, 22, '#9A5A2E')}<path d="M-.6-9v18" stroke="#C98A5A" stroke-width="1"/><ellipse cy="-11" rx="2" ry="1" fill="#7A4220"/>`,
  cardamom: () => `<path d="M-3.4 0C-3.4-2.4 3.4-2.4 3.4 0C3.4 2.4-3.4 2.4-3.4 0Z" fill="#9AB85E"/><path d="M-2 0h4" stroke="#6E8E3A" stroke-width=".8"/>`,
  clove: () => `<path d="M0-1v6" stroke="#5A3420" stroke-width="1.8"/><circle cy="-2.4" r="2" fill="#6A3E26"/>`,
  'bay-leaf': () => `<g stroke-width="1.1">${leafV(14, '#8A9E5A', '#5E7A3A')}</g>`,
  lentil: (v, c = '#EE8A40') => `<ellipse rx="2.3" ry="1.6" fill="${c}" stroke-width=".7"/>`,
  bep: () => `${bean(3.6, 2.4, '#F3E6CC')}<circle r="1" fill="#2E2A2A" stroke="none"/>`,
  fava: () => `${bean(5, 3.6, '#B8A060', '#D9C68A')}<path d="M3.4-1.6q1 1.6 0 3.2" stroke="#7A6A3A" stroke-width="1"/>`,
  guar: () => `${stick(3.6, 14, '#6CA840')}<path d="M0-5v10" stroke="#A9D47F" stroke-width="1"/>`,
  purslane: () => '<g stroke-width="1"><ellipse cx="-2.4" rx="2.6" ry="1.8" fill="#5E9E3E"/><ellipse cx="2.4" cy="-.6" rx="2.6" ry="1.8" fill="#6CAE4E"/><ellipse cy="2" rx="2.4" ry="1.6" fill="#4E8E34"/></g>',
  'grape-roll': () => `${stick(6.4, 16, '#5E6E2E')}<path d="M-3.2-4l6.4 2M-3.2 1l6.4 2" stroke="#8A9A4E" stroke-width="1.1"/>`,
  'grape-parcel': () => '<path d="M-6-3.4L0-7L6-3.4V3.4L0 7L-6 3.4Z" fill="#56682E"/><path d="M0-7V7M-6-3.4L6 3.4" stroke="#7E8E4A" stroke-width="1"/>',
  truffle: (v) => `${blob(6, 5, '#D2B48E', v, .22)}${dots('M-2-1v.1M2 1v.1M1-2.4v.1', '#9A7A5A', 1.4)}${hiDot(-2, -2, 1.4, .7, '#EAD6B8')}`,
  'melon-grilled': () => `${cube(7, '#C9443E', '#E9807A')}${dots('M-1.6 0v.1M1.6 1.4v.1', '#2E2A2A', 1.4)}`,
  citron: () => cube(6, '#EEEFA8', '#FFFFE0'),
  'pine-nut': () => '<ellipse rx="1.4" ry="2.4" fill="#F3E6C2" stroke-width=".8"/>',
  cashew: () => '<path d="M-3-1C-3-4 3-4 3-1C3 1 1 1 1 0C1-1.6-1-1.6-1 0C-1 1-3 1-3-1Z" fill="#F0D9A8" stroke-width=".9"/>',
  'almond-sliver': () => '<ellipse rx="2.8" ry="1.3" fill="#F6E6C6" stroke-width=".8"/>',
  'egg-scramble': (v) => `${blob(4.4, 3.4, '#F6D35B', v, .3)}${hiDot(-1, -1, 1.2, .6, '#FBE9A6')}`,
  leek: () => '<ellipse rx="2.6" ry="1.6" fill="#B9DE8E" stroke-width=".9"/><ellipse rx="1.2" ry=".7" fill="#E9F5D6" stroke="none"/>',
  quartz: () => '<path d="M-6 3L-5-3L0-6L6-3L6 3L0 5Z" fill="#F6F4EE"/><path d="M0-6V5M-5-3L6 3" stroke="#D9D6CC" stroke-width="1"/>',
  'carrot-strip': () => stick(2.4, 13, '#F08A3C'),
  'date-coated': () => `<ellipse rx="9" ry="4.6" fill="#8A5A44"/>${dots('M-6-1v.1M-3 1v.1M0-2v.1M3 1v.1M6-1v.1M-1 2v.1M4-3v.1M-5 2.4v.1', '#C9C0B0', 1.6)}`,
  finjan: () => `<path d="M-6-3h12l-1.6 6a4.4 1.6 0 0 1-8.8 0Z" fill="#FFFFFF"/><ellipse cy="-3" rx="6" ry="1.8" fill="#D9B060"/>`,
  'cup-drink': (v, c = '#FFFDF6') => cupItem(c),
  'drizzle-honey': () => '<path d="M-22 0C-11-12 0 10 12-3S22 4 26-2" stroke="#D98A1E" stroke-width="2.4"/>',
  'drizzle-molasses': () => '<path d="M-22 0C-11-12 0 10 12-3S22 4 26-2" stroke="#5A2618" stroke-width="2.6"/>',
  'drizzle-white': () => '<path d="M-22 0C-11-12 0 10 12-3S22 4 26-2" stroke-width="4.4"/><path d="M-22 0C-11-12 0 10 12-3S22 4 26-2" stroke="#FFFFFF" stroke-width="2.2"/>',
  'drizzle-red': () => '<path d="M-22 0C-11-12 0 10 12-3S22 4 26-2" stroke="#C9402E" stroke-width="2.6"/>',
  // tiny things, scattered without an outline
  pepper: () => '<circle r="1" fill="#2E2A2A"/>',
  nigella: () => '<path d="M-1.4 0L0-1.2L1.4 0L0 1.2Z" fill="#1E1A1A"/>',
  fennel: () => '<ellipse rx="1.6" ry=".7" fill="#8A9E4E"/>',
  sugar: () => '<rect x="-.9" y="-.9" width="1.8" height="1.8" fill="#FFFFFF"/>',
  iqt: () => '<circle r="1.5" fill="#FBF6E8"/>',
  samh: () => '<circle r="1.2" fill="#8E8478"/>',
  saffron: () => '<rect x="-1.6" y="-.4" width="3.2" height=".8" rx=".4" fill="#E2541E"/>',
  rose: () => '<ellipse rx="1.6" ry="1.1" fill="#D9485A"/>',
  'turmeric-dust': () => '<circle r="1.1" fill="#E9A51E"/>',
  coriander: () => '<circle r="1.2" fill="#A8864E"/>',
  // whole produce (big, drawn alone)
  'tomato-whole': () => `<ellipse rx="15" ry="13.4" fill="#E2402E"/><path d="M-9-5q9-6 18 0" stroke="#F4907F" stroke-width="2.4"/>${hiDot(-7, -6, 3.4, 1.8, '#F7B0A2')}<path d="M0-13l-5-2M0-13l5-2M0-13l-3 3M0-13l3 3M0-13v-4" stroke="#3E9B57" stroke-width="2.2"/>`,
  'onion-whole': () => `<path d="M0-16C4-12 15-8 15 2C15 10 8 14 0 14C-8 14-15 10-15 2C-15-8-4-12 0-16Z" fill="#D9A05A"/><path d="M-8-4Q-4 6-2 13M6-6Q5 5 3 13M0-12V13" stroke="#B07A3A" stroke-width="1.2"/><path d="M0-16l-1-4M0-16l2-3" stroke="#8A5A2E" stroke-width="1.4"/>${hiDot(-7, -1, 2.2, 3.6, '#EBC48A')}`,
  'onion-half-red': () => '<ellipse rx="15" ry="11" fill="#8E3A6A"/><ellipse rx="12.4" ry="8.8" fill="#F6E8F0" stroke-width="1"/><ellipse rx="9.4" ry="6.6" stroke="#B85A8E" stroke-width="1.6"/><ellipse rx="6.2" ry="4.4" stroke="#B85A8E" stroke-width="1.6"/><ellipse rx="3" ry="2" stroke="#B85A8E" stroke-width="1.4"/>',
  'garlic-bulb': () => '<path d="M0-15C3-11 13-7 13 2C13 10 6 13 0 13C-6 13-13 10-13 2C-13-7-3-11 0-15Z" fill="#F7F1E6"/><path d="M-5-8Q-9 3-4 12M5-8Q9 3 4 12M0-12V13" stroke="#D9CDB8" stroke-width="1.3"/><path d="M0-15v-4" stroke="#C9B89A" stroke-width="2.2"/><path d="M-4 13h8" stroke="#B8A888" stroke-width="1.2"/>',
  'garlic-clove': () => '<path d="M-3 4C-5 0-2-5 0-6C2-5 5 0 3 4C1 5-1 5-3 4Z" fill="#F7F1E6"/><path d="M0-6v-1.6" stroke="#C9B89A" stroke-width="1.2"/>',
  'bell-pepper': (v, fill = '#E2402E', dark = '#B8301F', hi = '#F4907F') => `<path d="M-12-6C-14 4-10 13-4 13C-1 13 0 11 0 11C0 11 1 13 4 13C10 13 14 4 12-6C10-11 4-11 0-8C-4-11-10-11-12-6Z" fill="${fill}"/><path d="M-6-6C-8 2-6 8-4 11M6-6C8 2 6 8 4 11" stroke="${dark}" stroke-width="1.2"/><path d="M0-8v-5l3-2" stroke="#3E7B2E" stroke-width="3"/>${hiDot(-7, -2, 1.8, 3.6, hi)}`,
  'cucumber-whole': () => `<path d="M-22 2C-22-6 18-8 22-2C24 2 20 8 14 8C4 9-22 10-22 2Z" fill="#4E9E3A"/><path d="M-16-2C-6-5 8-5 18-3" stroke="#8FCB6A" stroke-width="2"/>${dots('M-12 3v.1M-4 4v.1M6 3v.1M14 2v.1', '#2E6E2A', 1.6)}`,
  'zucchini-big': () => `<path d="M-22 1C-22-5 16-7 21-3C24 0 22 6 16 6C6 8-22 8-22 1Z" fill="#3E7B2E"/><path d="M-16-2C-6-4 6-4 16-3M-16 3C-6 4 6 4 16 2" stroke="#7DB65A" stroke-width="1.4"/><ellipse cx="-21" cy="1.4" rx="2" ry="3.6" fill="#E9F0C2" stroke-width="1.2"/><path d="M21-2l4-1" stroke="#6E8E3A" stroke-width="2.6"/>`,
  'eggplant-whole': () => `<path d="M-20 4C-22-4-12-10 0-8C8-7 14-6 16-2C18 4 12 9 4 9C-6 10-18 10-20 4Z" fill="#5A2E6E"/><path d="M13-6C17-9 21-8 21-4C21 0 17 2 14 0C12-2 12-4 13-6Z" fill="#4E9E3A"/><path d="M20-6l4-3" stroke="#3E7B2E" stroke-width="2.4"/><path d="M-12-3C-6-6 2-6 8-5" stroke="#9A6AB0" stroke-width="2"/>`,
  'carrot-whole': () => `<path d="M-20 0C-20-4 12-7 16-4C18-2 18 2 16 4C12 7-20 4-20 0Z" fill="#F08A3C"/><path d="M-10-2l2 2M-2-3l2 2.4M6-3l1.6 2.6" stroke="#C9661F" stroke-width="1.1"/><path d="M16-2l8-6M16 0l9-1M16 2l8 5" stroke="#3E9B57" stroke-width="2.4"/>`,
  'potato-whole': (v, fill = '#C99A5E', eye = '#8A6A3A', hi = '#E3BC86') => `${blob(14, 10, fill, v + 2, .12)}${dots('M-6-2v.1M3 3v.1M7-3v.1M-2 5v.1', eye, 1.8)}${hiDot(-6, -4, 3, 1.4, hi)}`,
  'sweet-potato-whole': () => `<path d="M-20 2C-18-6 10-9 18-3C22 0 20 5 14 6C2 9-22 9-20 2Z" fill="#B8503A"/><path d="M-12-2q8-3 18-1M-8 4q6 1 12 0" stroke="#8E3A2A" stroke-width="1.2"/>${hiDot(-10, -3, 3, 1.2, '#D9806A')}`,
  'pumpkin-whole': () => '<path d="M-16 2C-16-8-6-11 0-10C6-11 16-8 16 2C16 10 8 12 0 11C-8 12-16 10-16 2Z" fill="#F28A2E"/><path d="M-6-9Q-10 2-5 11M6-9Q10 2 5 11M0-10V11" stroke="#C9661F" stroke-width="1.4"/><path d="M0-10q1-4 4-5" stroke="#6E8E3A" stroke-width="3"/>',
  'corn-cob': () => `<path d="M-18 0C-18-6 14-7 18-2C20 0 20 2 18 4C14 8-18 6-18 0Z" fill="#F6CF3B"/>${dots('M-12-2v.1M-7-3v.1M-2-3v.1M3-3v.1M8-3v.1M13-2v.1M-12 2v.1M-7 2v.1M-2 2v.1M3 2v.1M8 2v.1M13 2v.1', '#D9A52E', 2.4)}<path d="M-18 0C-24-6-26 2-30-2C-26 6-22 6-16 4ZM-18 0C-22 4-22 10-26 12C-20 12-16 8-14 4Z" fill="#7DBE4E" stroke-width="1.2"/>`,
  'cabbage-head': (v, fill = '#9ACD6E', hi = '#C9E6A8', vein = '#6CA84A') => `${ball(15, fill, hi)}<path d="M-10 6Q-2-6 10 4M-12-2Q0-12 12-4M-4 14Q0 0 4-14" stroke="${vein}" stroke-width="1.4"/>`,
  'cabbage-half-red': () => '<ellipse rx="15" ry="11" fill="#7A3A8A"/><path d="M-10-2q3 3 0 6M-4-6q4 4 0 10M3-6q-3 5 1 10M9-3q-3 3 0 6M-6 7q6-2 12 0" stroke="#F1E2F2" stroke-width="1.6"/>',
  cauliflower: () => '<path d="M-15 4C-18-2-14-7-10-6C-11-9-8-12-4-10C-2-14 4-13 6-10C10-12 14-8 12-5C16-5 18 0 15 4C10 9-10 9-15 4Z" fill="#FBF6E6"/><path d="M-10-6q2 3 6 2M-4-10q1 4 5 5M6-10q-1 4 2 6M12-5q-3 2-3 5M-6 0q3 3 7 1" stroke="#E2D6B6" stroke-width="1.3"/><path d="M-15 4C-18 8-12 11-8 8M15 4C18 8 12 11 8 8" fill="#7DBE4E" stroke-width="1.2"/>',
  'romaine-head': () => `<g stroke-width="1.2"><g transform="rotate(-70)">${leafV(32, '#8FCB6A', '#5E9E3E')}</g><g transform="translate(-6 2) rotate(-110)">${leafV(28, '#7CC45A', '#4E8E3A')}</g><g transform="translate(6 2) rotate(-40)">${leafV(28, '#A9D88A', '#5E9E3E')}</g></g>`,
  arugula: () => '<path d="M-10 0L-6-3L-5 0L-1-4L0 0L4-3.6L5 0L9-2L10 1C6 4-6 4-10 0Z" fill="#4E8E3A" stroke-width="1.1"/><path d="M-9 .4H10" stroke="#8FCB6A" stroke-width="1"/>',
  'herb-bunch': (v, leaf = '#5DB36A', stem = '#3E8E4A', len = 8, vein = '', style = 'leaf') => bunch(leaf, stem, Number(len), vein || null, style),
  'green-onion': () => '<g stroke-width="4.6"><path d="M-18 6L16-6M-18 8L17-1M-18 10L16 4"/></g><path d="M-18 6L16-6M-18 8L17-1M-18 10L16 4" stroke="#6CC04A" stroke-width="2.4"/><path d="M-18 6L-8 2.6M-18 8L-8 5.2M-18 10L-8 8" stroke="#F6F3E6" stroke-width="2.6"/>',
  'radish-whole': () => `${ball(9, '#D9365A', '#F28AA0')}<path d="M0 9q1 4 3 6" stroke-width="1.8"/><path d="M0-9l-4-8M0-9l3-9" stroke="#4E9E3A" stroke-width="2.4"/>`,
  'avocado-half': () => '<path d="M0-16C8-16 14-4 14 4C14 11 8 15 0 15C-8 15-14 11-14 4C-14-4-8-16 0-16Z" fill="#3E6B2A"/><path d="M0-13C6-13 11-3 11 4C11 9 6 12 0 12C-6 12-11 9-11 4C-11-3-6-13 0-13Z" fill="#CFE39A" stroke="none"/><circle cy="4" r="5.6" fill="#8A5A34"/><circle cx="-1.6" cy="2.4" r="1.6" fill="#B8865A" stroke="none"/>',
  'avocado-slice': () => '<path d="M-12 2C-8-6 8-6 12 2C6 6-6 6-12 2Z" fill="#CFE39A"/><path d="M-12 2C-6 6 6 6 12 2" stroke="#3E6B2A" stroke-width="2.6"/>',
  ginger: () => '<path d="M-14 2C-16-4-10-6-6-4C-6-9 0-10 2-6C4-10 10-10 10-5C15-5 16 2 12 5C6 8-10 8-14 2Z" fill="#D9B07A"/><path d="M-8 0h3M0-2h3M7 1h3" stroke="#B08A50" stroke-width="1.3"/>',
  jalapeno: () => `<path d="M-14 1C-12-5 8-6 14-1C8 4-10 7-14 1Z" fill="#3E8E3A"/><path d="M14-1l4-4" stroke="#6E8E3A" stroke-width="2.4"/>${hiDot(-6, -2, 4, 1, '#8FCB6A')}`,
  'banana-whole': () => '<path d="M-18-6C-12 8 10 10 20-4C21-6 19-7 18-6C8 3-8 2-15-8Z" fill="#F6D35B"/><path d="M-15-8l-3-2" stroke="#6E5A2E" stroke-width="2.6"/><path d="M-12-2C-4 5 8 5 16-3" stroke="#E0B23E" stroke-width="1.4"/>',
  'banana-half': () => '<path d="M-14-4C-8 8 4 8 6 3L4 -1C0 1-6 0-11-6Z" fill="#F6D35B"/><path d="M6 3L4-1" stroke-width="1.6"/><ellipse cx="5" cy="1" rx="1.6" ry="2.4" fill="#FBF0C8" stroke-width="1.1"/><path d="M-11-6l-3-2" stroke="#6E5A2E" stroke-width="2.4"/>',
  'apple-whole': () => `<path d="M0-10C-4-14-15-12-15-1C-15 9-8 15-3 14C-1 13.4 1 13.4 3 14C8 15 15 9 15-1C15-12 4-14 0-10Z" fill="#D93B33"/><path d="M0-10q1-5 3-7" stroke="#6E4A2E" stroke-width="2"/><path d="M2-15c3-3 8-2 9 0c-3 3-7 3-9 0Z" fill="#5DB36A" stroke-width="1.2"/>${hiDot(-8, -3, 2.2, 3.6, '#F07A6E')}`,
  'orange-whole': () => `${ball(12, '#F5952E', '#FBC57A')}${dots('M-4 2v.1M3 5v.1M6-2v.1M-1-5v.1', '#D9761E', 1.2)}<circle cy="-11" r="1.6" fill="#6E8E3A"/>`,
  pear: () => `<path d="M0-14C4-14 4-6 8-2C13 3 11 13 0 13C-11 13-13 3-8-2C-4-6-4-14 0-14Z" fill="#C9D65A"/><path d="M0-14v-4" stroke="#6E4A2E" stroke-width="2"/>${hiDot(-5, 2, 2, 3, '#E6EEA0')}`,
  'mango-whole': () => '<path d="M-14 4C-16-6-6-14 4-12C14-10 16 0 12 6C8 13-12 13-14 4Z" fill="#F6B43B"/><path d="M-13 2C-14-6-6-12 2-11C-4-7-8-2-13 2Z" fill="#E86A3A" stroke="none"/><path d="M-14 4C-16-6-6-14 4-12C14-10 16 0 12 6C8 13-12 13-14 4Z"/><path d="M4-12q2-3 5-3" stroke="#6E4A2E" stroke-width="2"/><path d="M-4 6q6 2 12-2" stroke="#FCD98A" stroke-width="1.6"/>',
  'mango-cheek': () => '<ellipse rx="14" ry="9" fill="#7DAE3E"/><ellipse cy="-1" rx="12" ry="7.4" fill="#F6B43B" stroke-width="1.1"/><path d="M-8-5l12 9M-2-7.6l12 9M-11 0l9 6.6M-6-7l-6 6M1-8l-10 10M7-6l-11 12M11-2l-8 8" stroke="#E0942A" stroke-width="1.1"/>',
  'pomegranate-half': () => `<circle r="14" fill="#B8243E"/><path d="M-4-13l2-4h4l2 4" fill="#B8243E" stroke-width="1.4"/><ellipse cy="1" rx="11" ry="9" fill="#F6E1D0" stroke-width="1.2"/>${dots('M-6-2v.1M-2-4v.1M3-3v.1M7 0v.1M-7 3v.1M-2 1v.1M3 2v.1M0 6v.1M5 5v.1M-4 6v.1M8 4v.1M0-6v.1', '#C9244A', 3)}`,
  'grape-bunch': (v, c = '#9ACD5A', hi = '#C9E68A') => { let o = '<path d="M0-14v-4l4-2" stroke="#6E5A2E" stroke-width="2"/>'; for (const [x, y] of [[-6, -10], [0, -11], [6, -10], [-9, -4], [-3, -5], [3, -5], [9, -4], [-6, 1], [0, 1], [6, 1], [-3, 7], [3, 7], [0, 12]]) o += `<g transform="translate(${x} ${y})">${ball(3.6, c, hi)}</g>`; return o; },
  cherries: () => `<path d="M-5 2Q-4-8 3-14M6 3Q5-6 3-14" stroke="#6E5A2E" stroke-width="1.6"/><path d="M3-14c4-2 8 0 8 2c-3 2-6 1-8-2Z" fill="#5DB36A" stroke-width="1.1"/><g transform="translate(-5 5)">${ball(5.4, '#B8243E', '#E9708A')}</g><g transform="translate(6 6)">${ball(5.4, '#A81E36', '#E06A82')}</g>`,
  'fig-half': () => `<path d="M0-14C3-10 12-4 12 3C12 10 6 13 0 13C-6 13-12 10-12 3C-12-4-3-10 0-14Z" fill="#6E3A6E"/><path d="M0-10C3-6 9-2 9 3C9 8 5 10 0 10C-5 10-9 8-9 3C-9-2-3-6 0-10Z" fill="#E9708A" stroke="none"/>${dots('M-4 2v.1M0 0v.1M4 2v.1M-2 5v.1M2 6v.1M0 3v.1M-5 5v.1M5 5v.1', '#FBE3A0', 1.4)}`,
  fig: () => '<path d="M0-14C3-10 12-4 12 3C12 10 6 13 0 13C-6 13-12 10-12 3C-12-4-3-10 0-14Z" fill="#6E3A6E"/><path d="M0-14v-3" stroke="#5E7A3A" stroke-width="2"/><path d="M-6-2C-6 4-4 8 0 10" stroke="#9A6A9A" stroke-width="1.6"/>',
  'watermelon-slice': () => `<path d="M-18-2A18 14 0 0 0 18-2Z" fill="#4E9E3A"/><path d="M-15.6-2A15.6 11.4 0 0 0 15.6-2Z" fill="#F3F6D8" stroke="none"/><path d="M-14-2A14 9.8 0 0 0 14-2Z" fill="#E2485A" stroke="none"/><path d="M-18-2H18" stroke-width="1.6"/>${dots('M-7 1v.1M0 3v.1M7 1v.1M-3 5v.1M3 5v.1', '#2E2A2A', 1.8)}`,
  'melon-cube': (v, c = '#F6A65A', hi = '#FBD0A0') => `${cube(7, c, hi)}<path d="M-3.5 3.5h7" stroke="#C9D69A" stroke-width="1.6"/>`,
  'pineapple-chunk': () => '<path d="M-4-4L5-3L4 4L-5 3Z" fill="#F6D35B"/><path d="M-2-2l4 3M1-3l-2 5" stroke="#E0B23E" stroke-width=".9"/>',
  mulberry: () => `<ellipse rx="2.8" ry="4" fill="#4A1E3A"/>${dots('M-1-2v.1M1 0v.1M-1 2v.1', '#8A4A6A', 1.1)}`,
  'lemon-whole': (v, c = '#F6D35B', hi = '#FBEB9C') => `<ellipse rx="12" ry="9" fill="${c}"/><path d="M12-1l3-1" stroke-width="2.6"/>${hiDot(-5, -4, 3, 1.4, hi)}`,
  'egg-whole': (v, c = '#F8EEDC') => `<ellipse rx="7.4" ry="9.4" fill="${c}"/>${hiDot(-3, -4, 1.8, 2.6)}`,
  'tofu-block': () => block(26, 14, 8, '#FBF3E0', '#F3E6C8', '#E6D6B0'),
  'butter-block': () => `${block(24, 10, 9, '#FBE7A0', '#F6D978', '#E9C75A')}<path d="M-6-11l10-1" stroke="#FFF6CC" stroke-width="1.6"/>`,
  'cheese-block': (v, top = '#FFFFFF', front = '#F6F2E8', side = '#E6E0D2') => block(22, 12, 8, top, front, side),
  mozzarella: () => `${ball(12, '#FFFDF6', '#FFFFFF')}<path d="M-6 6q6 3 12 0" stroke="#EDE6D6" stroke-width="1.4"/>`,
  'parmesan-wedge': () => '<path d="M-14 6L10-8L14-2L-10 12Z" fill="#F6E29A"/><path d="M-14 6L10-8" stroke="#E0B84A" stroke-width="3"/><path d="M-14 6L-10 12" stroke-width="1.6"/>',
  jar: (v, content = '#C98A4E', lid = PAL.indigo, label = '#FFFFFF') => jarItem(content, lid, label),
  bottle: (v, liquid = '#C9B83A', cap = PAL.indigo, glass = '#FFFFFF') => bottleItem(liquid, cap, glass),
  can: (v, label = '#E2513E', band = '#FFFFFF', top = '#D9D6E6') => canItem(label, band, top),
  pile: (v, fill = '#C9862A', speck = '', hi = '') => pile(fill, speck || null, hi || null),
  spoon: (v, fill = '#E6B52E') => `<path d="M2 1L22 -5" stroke-width="4.4"/><path d="M2 1L22 -5" stroke="#E6E3F2" stroke-width="2"/><ellipse rx="7.4" ry="4.4" fill="#E6E3F2"/><ellipse cy=".4" rx="5.4" ry="3" fill="${fill}" stroke-width="1"/>`,
  packet: (v, body = '#E9DCC2', band = PAL.violet) => `<path d="M-11-14H11L12 14H-12Z" fill="${body}"/><path d="M-11-14l2-3h18l2 3" fill="${body}"/><path d="M-11.4-4H11.6V4H-11.8Z" fill="${band}" stroke-width="1.2"/>`,
  nest: () => `<ellipse rx="10" ry="6" fill="#E9C46A"/><path d="M-7-1q7-6 14 0M-8 2q8-6 16 0M-5-3q5-3 10 0M-6 3q6 3 12 0" stroke="#C99A3A" stroke-width="1.2"/>`,
  'saj-sheet': () => '<path d="M-24 2C-24-8 24-8 24 2C24 6 14 8 0 8C-14 8-24 6-24 2Z" fill="#F1DDB2"/><path d="M-18-2q6-3 10 0M2-4q5-2 9 0M-6 3q5-2 9 0M10 2q4-2 8 0" stroke="#D2A866" stroke-width="1.4"/>',
  'bread-slice': (v, crust = '#A8642A', crumb = '#D9A86A', speck = '#8A5420') => { const d = 'M-14-8C-14-15-7-17-4-14C-1-18 6-18 8-14C12-16 15-12 14-7V12C14 13 13 14 12 14H-12C-13 14-14 13-14 12Z'; return `<path d="${d}" transform="translate(0 2.4)" fill="${crust}"/><path d="${d}" fill="${crust}"/><path d="M-10.6-6C-10.6-11.6-5.4-13-3-10.6C-1-13.4 4.6-13.4 6-10.6C9.6-12 12-8.6 11-5V11H-10.6Z" fill="${crumb}" stroke="none"/>${dots('M-6-5v.1M3-8v.1M7 0v.1M-2 2v.1M-7 7v.1M4 8v.1', speck, 1.6)}`; },
  'pita-round': (v, top = '#D9A86A', side = '#B9782F', spot = '#A8642A') => `${slice(18, top, side, null, 2.4)}<ellipse rx="13" ry="6" stroke="${side}" stroke-width="1.2"/>${dots('M-8-2v.1M4-4v.1M10 1v.1M-2 3v.1M-12 2v.1', spot, 1.8)}`,
  tortilla: () => '<path d="M-18 2A18 8 0 0 1 18 2L0 10Z" fill="#E3C08A"/><path d="M-18 2A18 8 0 0 0 0 10" stroke-width="1.6"/>' + dots('M-8-1v.1M2-3v.1M8 1v.1M-2 3v.1', '#B9864A', 1.8),
  penne: (v, c = '#C9965A', hi = '#E3BC86') => `<path d="M-6-2.6L6-4L7 2.6L-5 4Z" fill="${c}"/><ellipse cx="6.5" cy="-.7" rx="1.4" ry="3.3" fill="${hi}" stroke-width="1"/><path d="M-3-2.8l1 6M1-3.4l1 6.2" stroke="${hi}" stroke-width=".9"/>`,
  flake: (v, c = '#E9B45A') => `<path d="${blobD(4, 2.6, v, .3, 6)}" fill="${c}" stroke-width="1"/>`,
  rusk: () => `${block(20, 6, 6, '#E3A24E', '#D2903E', '#B9782F')}${dots('M-6-5v.1M0-7v.1M6-6v.1', '#9A5A28', 1.6)}`,
  biscuit: (v, c = '#E9C27A') => `${slice(7, c, '#C99A4E', null, 2)}${dots('M-3-.6v.1M0 .8v.1M3-.6v.1', '#B07A3A', 1.4)}`,
  samoli: () => `<path d="M-20 4C-20-6 20-6 20 4C20 7-20 7-20 4Z" fill="#E3A24E"/><path d="M-12-2l4 3M-3-3l4 3M6-3l4 3" stroke="#B9782F" stroke-width="1.5"/><path d="M-14-2q14-6 28 0" stroke="#F2CE8C" stroke-width="1.6"/>`,
  'spoon-oil': () => `<path d="M2 1L22 -5" stroke-width="4.4"/><path d="M2 1L22 -5" stroke="#E6E3F2" stroke-width="2"/><ellipse rx="7.4" ry="4.4" fill="#E6E3F2"/><ellipse cy=".4" rx="5.4" ry="3" fill="#E9C43A" stroke-width="1"/>${hiDot(-2, -.6, 1.6, .7)}`,
  pistachio: () => '<path d="M-3 0C-3-3 3-3 3 0C3 3-3 3-3 0Z" fill="#E9DCB8"/><path d="M-1.6 0C-1.6-1.6 1.6-1.6 1.6 0C1.6 1.6-1.6 1.6-1.6 0Z" fill="#8DB04E" stroke-width=".7"/>',
  'pistachio-dust': () => '<ellipse rx="1.4" ry="1" fill="#8DB04E"/>',
  peas: () => ball(3, '#7DBE3E', '#B5DE8A'),
  'salt-crystal': () => '<rect x="-1.2" y="-1.2" width="2.4" height="2.4" fill="#FFFFFF" stroke="#C9C4F2" stroke-width=".5"/>',
  mastic: (v) => `<path d="${blobD(3, 2.4, v, .3, 6)}" fill="#F6E9A8" stroke-width=".9"/>${hiDot(-1, -.8, .8, .5)}`,
  thread: () => '<path d="M-3 1q2-3 6-1" stroke="#D9301E" stroke-width="1.2"/>',
  'kadi-flower': () => '<path d="M0 6L-3-6M0 6L0-8M0 6L3-6" stroke="#F3EBC6" stroke-width="3"/><path d="M0 6L-3-6M0 6L0-8M0 6L3-6" stroke="#E9DC9A" stroke-width="1.4"/>',
  galangal: () => `${slice(5.4, '#F1E6C8', '#C99A6E', null, 2)}<ellipse rx="3" ry="1.4" stroke="#D9C49A" stroke-width=".9"/>`,
  'shiba-sprig': () => `<path d="M0 10V-10M0-2l-5-4M0 2l5-4M0-6l4-3" stroke="#8E9A7E" stroke-width="1.6"/>${dots('M-5-6v.1M5-2v.1M4-9v.1M-3 4v.1M3 6v.1', '#B8C2A8', 2.4)}`,
  yeast: () => '<circle r="1.1" fill="#C9A87A"/>',
  'seed-pumpkin': () => `${bean(3.4, 1.8, '#6E9A3E')}<path d="M-2 0h3" stroke="#A9C97E" stroke-width="1"/>`,
  'seed-chia': () => '<ellipse rx="1.1" ry=".8" fill="#5A5450"/>',
  'popcorn-big': () => '<path d="M-5 3A3.8 3.8 0 0 1-4-4A4.4 4.4 0 0 1 4-4A3.8 3.8 0 0 1 5 3A4 4 0 0 1-5 3Z" fill="#FFF8E6"/>',
  soybean: () => bean(3, 2.4, '#E9D49A', '#F6E8C0'),
  'tuna-chunk': ITEMS.tuna,
  'cheese-cube': (v, c = '#FFFFFF') => `${cube(7, c)}${dots('M-1.6-1.4v.1M1.8.6v.1', '#E8E0D0', 1.2)}`,
  ice: () => '<path d="M-4-4h8v8h-8Z" fill="#FFFFFF" fill-opacity=".7" stroke-width="1"/>',
});
for (const t of ['pepper', 'nigella', 'fennel', 'sugar', 'iqt', 'samh', 'saffron', 'rose', 'turmeric-dust', 'coriander', 'pistachio-dust', 'salt-crystal', 'yeast', 'seed-chia']) DUST.add(t);
Object.assign(FOOT, {
  lamb: 10, 'lamb-pale': 10, camel: 10, 'lamb-roast': 16, 'meat-cube': 3.8, 'fat-cube': 3.6, liver: 5, kidney: 5, 'chicken-boiled': 9, meatball: 5.4,
  'fish-fried': 22, 'fish-tahini': 22, 'fish-raw': 22, 'fish-piece': 9, 'fish-steak': 8, 'fillet-raw': 22, 'shrimp-raw': 7, 'tripe-roll': 6, 'drum-raw': 14, 'breast-raw': 22,
  'mince-raw': 15, 'lamb-raw': 15, 'tail-fat': 8, 'dough-sheet': 8, 'dough-disc': 6.4, 'dough-thick': 8, 'dough-finger': 5, ear: 6, dumpling: 13, 'bread-piece': 6.6,
  'muttabaq-meat': 15, 'muttabaq-chicken': 15, 'muttabaq-banana': 15, 'muttabaq-cheese': 15, 'ring-bread': 14, kleja: 9, maamoul: 9, tuweetat: 6, spiral: 9, jubniyah: 7,
  puff: 6, fritter: 8, fudge: 5.4, 'kunafa-cake': 30, 'aish-pie': 15, 'cake-round': 18, 'pumpkin-cube': 4.4, 'eggplant-piece': 6,
  'zucchini-whole': 6, 'chili-green': 6, 'chili-red': 4, 'black-lime': 4.6, 'cinnamon-stick': 4, cardamom: 2.8, clove: 2.4, 'bay-leaf': 6, lentil: 2, bep: 3.2, fava: 4.6,
  guar: 3.6, purslane: 4, 'grape-roll': 5, 'grape-parcel': 6, truffle: 5.6, 'melon-grilled': 4.4, citron: 3.6, 'pine-nut': 2, cashew: 3, 'almond-sliver': 2.2, 'egg-scramble': 4,
  leek: 2.6, quartz: 6, 'carrot-strip': 2.6, 'date-coated': 8, finjan: 6, 'cup-drink': 7, 'drizzle-honey': 0, 'drizzle-molasses': 0, 'drizzle-white': 0, 'drizzle-red': 0,
  'tomato-whole': 15, 'onion-whole': 15, 'onion-half-red': 15, 'garlic-bulb': 14, 'garlic-clove': 4, 'bell-pepper': 13, 'cucumber-whole': 20, 'zucchini-big': 20, 'eggplant-whole': 20,
  'carrot-whole': 18, 'potato-whole': 14, 'sweet-potato-whole': 18, 'pumpkin-whole': 16, 'corn-cob': 18, 'cabbage-head': 15, 'cabbage-half-red': 15, cauliflower: 15, 'romaine-head': 16,
  arugula: 8, 'herb-bunch': 14, 'green-onion': 16, 'radish-whole': 9, 'avocado-half': 15, 'avocado-slice': 10, ginger: 13, jalapeno: 14, 'banana-whole': 18, 'banana-half': 13,
  'apple-whole': 15, 'orange-whole': 12, pear: 13, 'mango-whole': 15, 'mango-cheek': 14, 'pomegranate-half': 14, 'grape-bunch': 13, cherries: 10, 'fig-half': 12, fig: 12,
  'watermelon-slice': 18, 'melon-cube': 4.4, 'pineapple-chunk': 4.4, mulberry: 3.6, 'lemon-whole': 12, 'egg-whole': 8, 'tofu-block': 16, 'butter-block': 16, 'cheese-block': 14,
  mozzarella: 12, 'parmesan-wedge': 14, jar: 13, bottle: 12, can: 12, pile: 15, spoon: 12, packet: 12, nest: 10, 'saj-sheet': 24, 'bread-slice': 16, 'pita-round': 18, tortilla: 18,
  penne: 6, flake: 4, rusk: 13, biscuit: 7, samoli: 20, 'spoon-oil': 12, pistachio: 3, peas: 3, mastic: 3, thread: 3, 'kadi-flower': 8, galangal: 5.4, 'shiba-sprig': 8,
  'seed-pumpkin': 3.2, 'popcorn-big': 5, soybean: 3, 'tuna-chunk': 5.6, 'cheese-cube': 4, ice: 4,
});
for (const t of ['zucchini-whole', 'cinnamon-stick', 'grape-roll', 'carrot-strip', 'dough-finger', 'tripe-roll']) LONG.add(t);
for (const t of ['dough-disc', 'dough-thick', 'dumpling', 'ring-bread', 'kleja', 'maamoul', 'spiral', 'jubniyah', 'grape-parcel', 'aish-pie', 'cake-round', 'tomato-whole', 'onion-whole', 'onion-half-red',
  'garlic-bulb', 'bell-pepper', 'cabbage-head', 'cabbage-half-red', 'avocado-half', 'apple-whole', 'pear', 'pomegranate-half', 'grape-bunch', 'cherries', 'fig-half', 'fig', 'lemon-whole',
  'egg-whole', 'jar', 'bottle', 'can', 'pile', 'packet', 'mozzarella', 'radish-whole', 'cup-drink', 'finjan', 'quartz', 'biscuit', 'herb-bunch', 'pumpkin-whole', 'orange-whole', 'mango-cheek', 'kunafa-cake']) UPRIGHT.add(t);

// An item is "type*n" (n pieces scattered), "type@x,y,s,rot" (one piece placed at x, y
// from the centre of the food, scale s, turned rot degrees), and either may carry
// colour arguments: "jar~#C98A4E~#E0A23B@0,0".
function parseItems(list) {
  return (list ?? []).map((s) => {
    const [head, at] = String(s).split('@');
    const [name, n] = head.split('*');
    const [type, ...args] = name.split('~');
    const it = { type, n: at ? 1 : Math.max(0, Number(n ?? 1) || 0), args };
    if (at) { const [x = 0, y = 0, sc = 1, rot = 0] = at.split(',').map(Number); it.at = [x, y, sc, rot]; }
    return it;
  });
}
const drawOne = (it, v) => ITEMS[it.type](v, ...(it.args ?? []));

// Rounded pieces get soft light: a contact shadow on the food under them, a shaded lower side and a
// highlight at the top left. Value = the radius that stays inside the piece's outline.
const LIT = {
  lamb: 6.4, 'lamb-pale': 6.4, camel: 6.4, chicken: 6.4, meatball: 5, truffle: 4.6, chickpea: 3.8, 'chickpea-roasted': 4, 'tomato-cherry': 5.4,
  blueberry: 4, raspberry: 4.4, 'date-ball': 5.8, puff: 4.4, fritter: 4.6, liver: 3.6, 'fish-piece': 5.4, 'bread-piece': 4.4, 'black-lime': 4.4,
  olive: 3.4, walnut: 4.6, 'melon-grilled': 3.4, 'pumpkin-cube': 3.4, 'meat-cube': 3.1, 'egg-scramble': 3.2, 'cheese-cube': 3.4, feta: 3.4,
  'tomato-dice': 2.9, mango: 3.4, tofu: 4.4, 'sweet-potato': 3.6, 'dough-ball': 5.6, peas: 2.9, 'melon-cube': 3.4, 'tail-fat': 5.6, kidney: 4,
  'potato-whole': 9.6, 'tomato-whole': 13, 'apple-whole': 11, 'orange-whole': 11.6, 'onion-whole': 11, 'cabbage-head': 14.4, mozzarella: 11.6,
  'radish-whole': 8.6, 'pumpkin-whole': 10, 'lemon-whole': 8.6, 'egg-whole': 7, 'garlic-bulb': 10, 'mango-whole': 10, pear: 9, strawberry: 4.6,
  'bell-pepper': 10, 'grape-bunch': 3.4, 'date-coated': 4.4, date: 4.4, bun: 5.6, maamoul: 6, 'lamb-roast': 9, 'chicken-boiled': 5,
};
const lit = (R, rot) => `<g transform="rotate(${f(-rot)})" stroke="none"><path d="M${P(-R * .84, R * .06)}A${f(R * .86)} ${f(R * .82)} 0 0 0 ${P(R * .84, R * .06)}A${f(R * .98)} ${f(R * .6)} 0 0 1 ${P(-R * .84, R * .06)}Z" fill="#2A1A3A" opacity=".16"/><ellipse cx="${f(-R * .34)}" cy="${f(-R * .44)}" rx="${f(R * .28)}" ry="${f(R * .16)}" fill="#FFFFFF" opacity=".5"/></g>`;
const contact = (R, rot) => `<ellipse transform="rotate(${f(-rot)})" cy="${f(R * .78)}" rx="${f(R * 1.02)}" ry="${f(R * .36)}" fill="${OL}" opacity=".13" stroke="none"/>`;
const litPiece = (type, svg, rot) => (LIT[type] ? `${contact(LIT[type], rot)}${svg}${lit(LIT[type], rot)}` : svg);

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
// Scattered pieces are drawn this much bigger, and piece outlines this much finer (set while a single food is drawn on its own).
let ITEM_K = 1; let ITEM_SW = 1;
function drawItems(items, cx, cy, rx, ry, r, { k: k0 = 1 } = {}) {
  k0 *= ITEM_K;
  let k = k0;
  const placed = [];
  // big pieces first so smaller ones arrange around them
  const all = items.map((it, i) => ({ ...it, i })).filter((it) => ITEMS[it.type]);
  const out = [];
  // placed pieces, drawn in the order listed, under the scattered ones
  all.filter((it) => it.at).forEach((it, j) => {
    const [x, y, s, rot] = it.at;
    placed.push([x, y, (FOOT[it.type] ?? 5) * s]);
    out.push([-2e4 + j, `<g transform="translate(${f(cx + x)} ${f(cy + y)})${rot ? ` rotate(${f(rot)})` : ''} scale(${f(s)})"${DUST.has(it.type) ? ' stroke="none"' : ` stroke-width="${f(ISW * SWK * ITEM_SW / s)}"`}>${litPiece(it.type, drawOne(it, j), rot)}</g>`]);
  });
  const order = all.filter((it) => !it.at).sort((x, y) => (FOOT[y.type] ?? 5) - (FOOT[x.type] ?? 5));
  const longRot = r() * 180;
  // a few pieces are drawn bigger so a small plate of dates or eggs still reads well
  const pieces = order.filter((it) => !DUST.has(it.type) && it.type !== 'drizzle').reduce((a, it) => a + Math.min(it.n, MAX_EACH), 0);
  if (pieces && pieces <= 7) k *= 1.3;
  for (const it of order) {
    const { type, n } = it;
    const dust = DUST.has(type);
    const small = (FOOT[type] ?? 5) <= 6 && !LONG.has(type);
    const count = Math.min(n, dust ? MAX_DUST : small ? MAX_SMALL : MAX_EACH);
    const rad = dust ? 1.6 * k : (FOOT[type] ?? 5) * ((FOOT[type] ?? 5) >= 12 ? k0 : k);
    const rrx = Math.max(4, rx - Math.min(rad, rx * .5) * .7); const rry = Math.max(2, ry - Math.min(rad, ry * .6) * .5);
    // a drizzle on a small plate or bowl stays near the middle, lies almost flat and fits the food
    const tame = type.startsWith('drizzle') && (type !== 'drizzle' || rx < 50 || ITEM_SW < 1);
    const pts = tame ? [[(r() - .5) * rx * .3, (r() - .5) * ry * .3, 0]] : ANCHOR[type] ? [[ANCHOR[type][0] * rx, ANCHOR[type][1] * ry, rad]] : scatter(r, count, rrx, rry, rad, dust ? [] : placed, GARNISH.has(type));
    pts.forEach((p, j) => {
      if (!dust && rad > 0) placed.push(p);
      const big = (FOOT[type] ?? 5) >= 12;
      // big pieces (fillets, toast) lie along the plate, so they only turn a little
      const rot = tame ? (r() - .5) * 24 : LONG.has(type) ? longRot + (r() - 0.5) * 24 : UPRIGHT.has(type) ? (r() - 0.5) * 16 : big ? (r() - 0.5) * 40 : r() * 360;
      const s = tame ? Math.min(1, rx / 46) : (big ? k0 : k) * (dust ? 1 : 0.92 + r() * 0.18);
      const z = dust || type === 'drizzle' ? 1e4 + p[1] : (big ? -1e4 : 0) + p[1];
      out.push([z, `<g transform="translate(${f(cx + p[0])} ${f(cy + p[1])}) rotate(${f(rot)}) scale(${f(s)})"${dust ? ' stroke="none"' : ` stroke-width="${f(ISW * SWK * ITEM_SW / s)}"`}>${dust ? drawOne(it, j) : litPiece(type, drawOne(it, j), rot)}</g>`]);
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
  // wet surfaces (broth, sauce, stew, porridge, paste) catch the light at the top left
  if (['soup', 'sauce', 'stew', 'swirl', 'smooth', 'porridge'].includes(t)) o += path(arcAt(cx, cy, rx * .8, ry * .72, 3.55, 4.35), `stroke="#FFFFFF" stroke-width="${sw(2.4)}" opacity=".55"`);
  const drops = (m, c, edge) => { let d = ''; for (const [x, y] of pts(m, 7, .7)) d += ell(x, y, 1.3 + r() * 1.3, .9 + r() * .6, 0); return path(d, `fill="${c}" stroke="${edge}" stroke-width="1"`); };
  if (t === 'rice' || t === 'creamy') {
    let d = ''; let d2 = '';
    pts(n(t === 'rice' ? 34 : 70), 3.6, .9).forEach(([x, y], i) => { const g = grain(x, y, (r() - .5) * 1.4, 4.4); if (i % 3 === 0) d2 += g; else d += g; });
    o += path(d, `stroke="${b.c2}" stroke-width="1.9"`) + path(d2, `stroke="${b.c}" stroke-width="1.9"`);
    if (t === 'rice') {
      // a few whole grains with their outline, so it reads as rice even when small
      let g = ''; for (const [a, k, rot] of [[3.5, .5, .3], [4.2, .7, -.5], [5.1, .55, .8], [5.9, .35, -.2], [.4, .6, .5], [1.2, .42, -.7], [2.4, .66, .1]]) g += grain(cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k, rot, 5);
      o += path(g, `stroke="${OL}" stroke-width="3.6" opacity=".55"`) + path(g, `stroke="${b.c2 === '#FFFFFF' ? '#FFFFFF' : b.c2}" stroke-width="2.2"`);
    }
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
  } else if (t === 'smooth') {
    // a smooth paste or porridge: a soft sheen, and a well of ghee when it has one
    o += path(arcAt(cx, cy, rx * .62, ry * .62, 3.6, 5.3) + arcAt(cx, cy, rx * .4, ry * .4, .5, 1.9), `stroke="${b.c2}" stroke-width="2"`);
    if (b.pool) o += `${E(cx, cy + ry * .04, rx * .3, ry * .28, `fill="${b.pool}" stroke="${b.c}" stroke-width="1.3"`)}<path d="M${P(cx - rx * .12, cy - ry * .06)}h${f(rx * .1)}" stroke="#FFFFFF" stroke-width="1.4" opacity=".8"/>`;
  } else if (t === 'crumbs') {
    let d = ''; let d2 = '';
    pts(n(26), 3.4, .88).forEach(([x, y], i) => { const q = quad(x, y, 1.1 + r() * .9, r() * Math.PI); if (i % 2) d2 += q; else d += q; });
    o += path(d, `fill="${b.c2}" stroke="none"`) + path(d2, `fill="${b.c}" stroke="none"`);
    if (b.pool) o += E(cx, cy, rx * .26, ry * .24, `fill="${b.pool}" stroke="${b.c}" stroke-width="1.3"`);
  } else if (t === 'shreds') {
    let d = ''; let d2 = '';
    pts(n(16), 3, .9).forEach(([x, y], i) => { const g = grain(x, y, (r() - .5) * 2.4, 5.4); if (i % 3) d += g; else d2 += g; });
    o += path(d, `stroke="${b.c2}" stroke-width="1.5"`) + path(d2, `stroke="${b.c}" stroke-width="1.5"`);
  } else if (t === 'powder') {
    let d = ''; for (const [x, y] of pts(n(60), 5, .8)) d += `M${P(x, y)}v.1`;
    o += path(d, `stroke="${b.c}" stroke-width="1.4"`) + path(arcAt(cx, cy - ry * .1, rx * .5, ry * .5, 3.8, 5.2), `stroke="${b.c2}" stroke-width="2.4"`);
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
  // shade on the right flank and a soft highlight on the top of the dome
  o += `<path d="M${P(cx + w * .5, top + h * .3)}C${P(cx + w * .8, top + h * .5)} ${P(cx + w * .88, base - h * .1)} ${P(cx + w * .7, base + h * .02)}" stroke="#2A1A3A" stroke-width="${sw(5)}" opacity=".1"/>`;
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
  if (b.shape) return breadShape(b, cx, cy, R * (b.size ?? 1), r);
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

/** The other breads: stacks of thin discs, thick loaves, ovals, big sheets (flat or folded), small rounds, pancakes, layers with sauce. */
function breadShape(b, cx, cy, R, r) {
  const spots = (x, y, a, ry, n, c) => { let d = ''; for (const [px, py] of spread(r, n, x, y, a, ry, 3.6, .8)) d += ell(px, py, 1 + r() * .8, .6 + r() * .4, (r() - .5) * .6); return path(d, `fill="${c}" stroke="none"`); };
  const finish = (x, y, a, ry) => {
    // a browned rim and a soft sheen in the middle
    let s = E(x, y + ry * .04, a * .9, ry * .86, `stroke="${b.c}" stroke-width="${sw(2.6)}" opacity=".35"`) + path(arcAt(x, y, a * .55, ry * .5, 3.6, 4.6), `stroke="#FFFFFF" stroke-width="${sw(2.2)}" opacity=".45"`);
    if (b.spot) s += spots(x, y, a, ry, b.nSpots ?? 18, b.spot);
    if (b.holes) { let d = ''; for (const [px, py] of spread(r, b.holes, x, y, a, ry, 4.4, .8)) d += ell(px, py, (b.holeSize ?? .9) + r() * .7, (b.holeSize ?? .9) * .6 + r() * .4, 0); s += path(d, `fill="${b.c}" stroke="none"`); }
    for (const c of [b.seeds, b.seeds2]) if (c) { let d = ''; for (const [px, py] of spread(r, 14, x, y, a, ry, 3.6, .8)) d += grain(px, py, r() * Math.PI, 2.2); s += path(d, `stroke="${c}" stroke-width="1.5"`); }
    return s;
  };
  const disc = (x, y, a, d, top) => isoDisc(x, y, a, a * .42, d, top, b.c, sw(1.8));
  let o = '';
  switch (b.shape) {
    case 'stack': {
      const n = b.n ?? 3; const a = R * .9;
      for (let i = 0; i < n; i++) o += disc(cx + (i % 2 ? 3 : -2), cy + 4 - i * 2.4, a, 1.4, i === n - 1 ? b.fill : b.c2);
      const x = cx + ((n - 1) % 2 ? 3 : -2); const y = cy + 4 - (n - 1) * 2.4;
      return o + E(x, y, a * .78, a * .3, `stroke="${b.c2}" stroke-width="${sw(1.6)}"`) + finish(x, y, a, a * .42);
    }
    case 'thick': case 'loaf': {
      const a = R * .78; const h = b.shape === 'loaf' ? 12 : 7;
      o += disc(cx, cy + 2, a, h, b.fill);
      if (b.shape === 'loaf') o += `<path d="M${P(cx - a * .8, cy + 2)}C${P(cx - a * .6, cy - a * .32)} ${P(cx + a * .6, cy - a * .32)} ${P(cx + a * .8, cy + 2)}" fill="${b.c2}" stroke-width="${sw(1.6)}"/><path d="M${P(cx - a * .42, cy - a * .02)}l${f(a * .16)} ${f(-a * .12)}M${P(cx - a * .08, cy - a * .08)}l${f(a * .16)} ${f(-a * .12)}M${P(cx + a * .26, cy - a * .04)}l${f(a * .16)} ${f(-a * .12)}" stroke="${b.c}" stroke-width="${sw(2)}"/>`;
      return o + finish(cx, cy + 1, a * .9, a * .34);
    }
    case 'oval': {
      for (const [dx, dy, rot, top] of [[-10, -3, -14, b.c2], [8, 4, 10, b.fill]]) {
        const x = cx + dx; const y = cy + dy; const a = R * .72;
        o += `<g transform="rotate(${rot} ${f(x)} ${f(y)})">${disc(x, y, a, 2.6, top)}${top === b.fill ? finish(x, y, a * .9, a * .34) : ''}</g>`;
      }
      return o;
    }
    case 'sheet': {
      const a = R * 1.04;
      return disc(cx, cy + 2, a, 1.6, b.fill) + E(cx, cy + 2, a * .86, a * .34, `stroke="${b.c2}" stroke-width="${sw(1.6)}"`) + finish(cx, cy + 2, a, a * .42);
    }
    case 'folded': {
      // a big thin sheet folded in half, the fold towards the front
      const a = R * 1.02; const ry = a * .42;
      o += `<path d="M${P(cx - a, cy + 2)}A${f(a)} ${f(ry)} 0 0 1 ${P(cx + a, cy + 2)}Z" fill="${b.c2}" stroke-width="${sw(1.8)}"/>`;
      o += `<path d="M${P(cx - a, cy + 2)}A${f(a)} ${f(ry * 1.2)} 0 0 0 ${P(cx + a, cy + 2)}C${P(cx + a * .5, cy - ry * .3)} ${P(cx - a * .5, cy - ry * .3)} ${P(cx - a, cy + 2)}Z" fill="${b.fill}" stroke-width="${sw(1.8)}"/>`;
      return o + finish(cx, cy + ry * .5, a * .8, ry * .5);
    }
    case 'small': {
      for (const [dx, dy] of [[-22, -4], [20, -6], [0, 6]]) {
        const x = cx + dx; const y = cy + dy; const a = R * .44;
        o += disc(x, y, a, b.puffed ? 6 : 5, b.fill);
        if (b.puffed) o += E(x, y - 1, a * .6, a * .24, `fill="${b.c2}" stroke="none"`);
        o += finish(x, y, a, a * .42);
      }
      return o;
    }
    case 'pancakes': {
      for (const [dx, dy] of [[-20, -5], [18, -6], [0, 5]]) {
        const x = cx + dx; const y = cy + dy; const a = R * .56;
        o += disc(x, y, a, 3.4, b.fill) + E(x, y, a * .78, a * .3, `stroke="${b.c2}" stroke-width="${sw(1.4)}"`) + finish(x, y, a, a * .42);
      }
      return o;
    }
    case 'layers': {
      const a = R * .74; const n = 4;
      for (let i = 0; i < n; i++) {
        const y = cy + 6 - i * 5;
        o += disc(cx, y, a, 3.4, b.fill);
        if (i < n - 1) o += E(cx, y - 1.2, a * 1.02, a * .42, `fill="none" stroke="${b.sauce}" stroke-width="${sw(2.6)}"`);
      }
      return o + E(cx, cy + 6 - (n - 1) * 5, a * .56, a * .2, `fill="${b.sauce}" stroke-width="${sw(1.4)}"`);
    }
    default: return '';
  }
}

const TALL = new Set(['jar', 'glass', 'tumbler', 'mcup']);
/** One dish in a vessel, centred on (cx, cy), in a 200 × 150 frame. Returns the svg; `top` is set to the top of the food. */
const TOP = { y: 0 };
function vessel(kind, base, items, r, cx = 100, cy = 90, { half = false } = {}) {
  const b = BASES[base] ?? null;
  const { white, cream, lav2, lav3, indigo } = PAL;
  let o = '';
  if (TALL.has(kind)) {
    // jar and measuring cup: straight sides; glass and tumbler: narrower at the foot
    const straight = kind === 'jar' || kind === 'mcup';
    const top = kind === 'tumbler' ? 44 : 30; const bot = 130; const rT = straight ? 30 : 31; const rB = straight ? 30 : 24; const ryT = 8.6; const ryB = straight ? 8.6 : 6.8;
    const xAt = (y) => rT + (rB - rT) * (y - top) / (bot - top);
    const fill = b?.fill ?? '#F3E6D6';
    const y0 = top + (bot - top) * (kind === 'jar' ? .26 : .2);
    const r0 = xAt(y0); const ry0 = ryT + (ryB - ryT) * (y0 - top) / (bot - top);
    const body = `M${P(cx - rT, top)}L${P(cx - rB, bot)}a${rB} ${ryB} 0 0 0 ${2 * rB} 0L${P(cx + rT, top)}`;
    const front = (y, rr, ryy) => `M${P(cx - rr, y)}a${f(rr)} ${f(ryy)} 0 0 0 ${f(2 * rr)} 0`;
    if (kind === 'mcup') o += `<path d="M${P(cx + rT - 1, top + 20)}c22 0 22 46 0 46" stroke-width="10"/><path d="M${P(cx + rT - 1, top + 20)}c22 0 22 46 0 46" stroke="${lav2}" stroke-width="5.6"/>`;
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
    if (kind === 'mcup') { let d = ''; for (const y of [56, 76, 96, 116]) d += `M${P(cx - rT + 4, y)}h${y % 40 === 16 ? 12 : 7}`; o += path(d, `stroke="${PAL.violet}" stroke-width="${sw(2.4)}"`); }
    o += drawItems(items, cx, y0 - 1, r0 * .66, ry0 * .5, r, { k: .8 });
    o += E(cx, top, rT, ryT, `fill="none" stroke-width="${sw(VSW)}"`);
    TOP.y = top - 6;
    return o;
  }
  if (kind === 'bowl' || kind === 'small' || kind === 'pot' || kind === 'stone') {
    // a bowl; a small dish; a clay pot (burma) with ears; a black stone pot (maghsh)
    const small = kind === 'small';
    const rx = small ? 46 : 62; const ry = small ? 18 : 24; const rim = cy - (small ? 0 : 8); const depth = small ? 28 : 40;
    const [foot, side, top, shine] = kind === 'pot' ? ['#A85A36', '#C9744A', '#E9A27A', '#F2C2A2'] : kind === 'stone' ? ['#2E2A34', '#4A4652', '#77737F', '#9A96A6'] : [lav3, lav2, white, white];
    if (kind === 'pot' || kind === 'stone') for (const sx of [-1, 1]) o += `<path d="M${P(cx + sx * (rx - 4), rim + 6)}q${sx * 14} 0 ${sx * 12} 12" stroke-width="9"/><path d="M${P(cx + sx * (rx - 4), rim + 6)}q${sx * 14} 0 ${sx * 12} 12" stroke="${side}" stroke-width="4.6"/>`;
    o += E(cx, rim + depth - 1, small ? 18 : 26, small ? 5.4 : 7.4, `fill="${foot}"`);
    o += `<path d="M${P(cx - rx, rim)}a${rx} ${depth} 0 0 0 ${2 * rx} 0z" fill="${side}"/>`;
    o += `<path d="M${P(cx - rx * .78, rim + depth * .36)}a${f(rx * .84)} ${f(depth * .64)} 0 0 0 ${f(rx * .44)} ${f(depth * .42)}" stroke="${shine}" stroke-width="${sw(3)}"/>`;
    o += E(cx, rim, rx, ry, `fill="${top}"`);
    const fx = rx - (small ? 5 : 6); const fy = ry - (small ? 3 : 3.6);
    o += b ? surface(b, cx, rim + 1, fx, fy, r) : E(cx, rim + 1, fx, fy, `fill="#F6EEDD" stroke-width="${sw(1.6)}"`);
    TOP.y = rim - ry - 4;
    return o + drawItems(items, cx, rim + 1, fx - 5, fy - 2.4, r);
  }
  if (kind === 'none') {
    // food straight on the ground (a whole pumpkin, a bottle, a few fruits)
    TOP.y = cy - 34;
    return drawItems(items, cx, cy + 8, 46, 14, r);
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
    if (dish && b) o += texture(b, cx, cy - 2, w * .36, h * .26, r).replace(/^<path d="M[^"]*A[^"]*" stroke="[^"]*" stroke-width="[^"]*"\/>/, '');
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
  'fish-dinner-tray': { bowl: ['rice-lentil', ['lentil*6', 'chili-green*1']], drink: 'water' },
  'bukhari-lunch-tray': { bowl: ['greens', ['tomato-dice*3', 'cucumber*2']], drink: 'water' },
  'lahouh-breakfast': { drink: 'laban', dates: true },
  'laban-dates': { dates: true },
};

const VESSEL_TOP = { bowl: 1, plate: 1, platter: 1, pan: 1, board: 1, dish: 1, jar: 1, glass: 1, tumbler: 1, mcup: 1, small: 1, pot: 1, stone: 1, none: 1 };

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
  const tall = TALL.has(kind);
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

// ---------------------------------------------------------------- food pictures (food lists)
// Every food a person can log gets its own square picture (drawn on 160 × 160, framed to the middle 136) in the same tiny-world
// style. Saudi dishes, ingredients, MOH portions and recipes carry an `art` recipe (from
// data/food-art.js and data/dishes.js); packaged products and the person's own foods get a
// plain package drawn from the product itself (no brand's packaging is imitated).
// The picture depends only on the recipe, so the same recipe always gives the same SVG and
// two foods only share a picture if they share a recipe (test/food-art.test.js checks none do).

// kind → [background, ground]
const TILE_BG = {
  'saudi-dish': [PAL.lav, PAL.sky], recipe: [PAL.sky, PAL.lav], ingredient: [PAL.sky, PAL.lav2],
  'moh-portion': [PAL.cream, PAL.lav2], packaged: [PAL.lav, PAL.muted], custom: [PAL.muted, PAL.lav2],
};
// vessel → [scale, the y of the vessel drawn at the tile centre]
const TILE_FIT = {
  platter: [.8, 94], plate: [.86, 94], bowl: [.9, 98], small: [1.12, 98], pot: [.86, 98], stone: [.86, 98], pan: [.78, 94],
  board: [.86, 92], dish: [.82, 96], jar: [.78, 82], glass: [.74, 80], tumbler: [.8, 88], mcup: [.76, 82], none: [1.2, 94],
};

/** A small extra beside the dish: a saucer of dates, a cup, a coffee cup or a side bowl. */
function tileSide(side, r) {
  const [what, ...args] = String(side).split('~');
  if (what === 'dates') return dates(128, 128);
  if (what === 'cup') return `<g transform="translate(136 124) scale(1.6)" stroke-width="${f(2 / 1.6)}">${cupItem(args[0] ?? '#FFFDF6')}</g>`;
  if (what === 'finjan') return `<g transform="translate(138 126) scale(1.6)" stroke-width="${f(2 / 1.6)}">${ITEMS.finjan()}</g>`;
  if (what === 'bowl') return sideBowl(132, 118, 20, args[0], args.slice(1), r);
  return '';
}

/** The square picture for one food recipe. */
function tile(spec, kind) {
  const r = rng(hash(`${kind}|${JSON.stringify(spec)}`));
  const v = VESSEL_TOP[spec.vessel] ? spec.vessel : 'plate';
  const base = spec.base && BASES[spec.base] !== undefined ? spec.base : 'none';
  let items = parseItems(spec.items);
  const types = new Set(items.map((i) => i.type));
  const [bg, ground] = TILE_BG[kind] ?? TILE_BG['saudi-dish'];
  const half = (v === 'platter' || v === 'plate') && MOUND.has(base) && types.has('chicken');
  if (half) items = items.filter((it) => it.type !== 'chicken');
  if (!TALL.has(v) && (types.has('herb') || types.has('mint') || types.has('basil')) && !types.has('fleck')) items.push({ type: 'fleck', n: 8, args: [] });
  let [s, ay] = TILE_FIT[v];
  let mx = 80;
  if (spec.side) { s *= .84; mx = 66; }
  s *= spec.zoom ?? 1;
  SWK = Math.min(1.25, .92 / s);
  // pieces a little bigger than on a meal card, so they read at list size
  ITEM_K = spec.k ?? (kind === 'ingredient' || kind === 'moh-portion' ? 1.35 : 1.14); ITEM_SW = .82;
  const dish = vessel(v, base, items, r, 100, 90, { half });
  ITEM_K = 1; ITEM_SW = 1;
  const topY = 92 + (TOP.y - ay) * s;
  const hot = spec.hot ?? (HOT_BASES.has(base) || [...types].some((t) => HOT_ITEMS.has(t)));
  let o = `<rect width="160" height="160" fill="${bg}"/>${E(80, 126, 70, 18, `fill="${ground}"`)}`;
  o += G_OPEN + spark(26, 28, 5, PAL.gold) + spark(134, 24, 4.2, PAL.violet) + flower(24, 136, 2.4);
  if (hot) o += steam(mx, f(Math.max(24, topY)));
  o += `<g transform="translate(${mx} 92) scale(${f(s)}) translate(-100 -${ay})" stroke-width="${f(VSW * SWK)}">${dish}</g>`;
  SWK = 1;
  if (spec.side) o += tileSide(spec.side, r);
  return `<svg viewBox="12 12 136 136" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">${o}</g></svg>`;
}

// ---------------------------------------------------------------- packaged products
// The package shape follows the product (carton, bottle, can, cup, bag, bar, box, jar, tube,
// squeeze bottle, tray, pouch, ice lolly, tub, bread bag); what is inside is drawn on the
// label; colours, pattern and label place come from the product id, so no two match.
const PACK_RULES = [
  ['water', /\bwater\b|ماء|مياه/i],
  ['can', /\b(7.?up|seven up|pepsi|cola|mirinda|soda|sparkling|energy drink)\b|soft-drinks/i],
  ['stick', /\b(lolly|popsicle|ice lolly)\b/i],
  ['tub', /\b(ice ?cream|icecream|feast|tornado+|labneh|cream cheese|cheese spread|squeeze|cheddar cheese spread|halwa|halawa)\b|آيس/i],
  ['cup', /\b(yog(h)?(u)?rt|yahourt|skyr|activia|greek|zabadi|زبادي|mix&go|pudding|custard)\b/i],
  ['carton', /\b(milk|lait|laban|cream|soy drink|juice|jus|nectar|drink|smoothie|cocktail|sun ?top|عصير|حليب|لبن)\b|milk|juices|laban|beverages|dairy/i],
  ['bag', /\b(chips|crisps|doritos|cheetos|bugles|nacho|lay'?s|lays|puffs?|curls|popcorn|nuts|farfasha|bake ?rolls|rolls|mini bites|kraker|croutons|فشار)\b|chips|snacks/i],
  ['slab', /\b(cheese|cheddar|mozzarella|halloumi|gouda|kiri|4 cheeses|butter)\b|cheese/i],
  ['bar', /\b(chocolate|choco|bar|snickers|twix|galaxy|kit ?kat|bounty|wafer|m&m|flutes|flipz|ferrero|crispy|caramel bar)\b|chocolate/i],
  ['tube', /\b(biscuits?|biscuts|cookies?|digestive|hobnobs|oreo|fingers|sandwich biscuits?|chocosandwich|albeni)\b|biscuits/i],
  ['bread', /\b(bread|buns?|brioche|croissant|crossant|muffin|cupcake|parthas|paratha|pound cake|cake|pancake|sliced|toast|tortilla|pita|puff|sandwich rolls)\b|bread/i],
  ['box', /\b(cereal|granola|oats|corn ?flakes|cerelac|choco nutty|fitness|tola|pasta|spaghetti|penne|pappardelle|rice kit|pancake mix|bran|wheat and dates)\b|cereals|pasta-rice/i],
  ['squeeze', /\b(ketchup|mayo\w*|mayonise|sauce|dressing|mustard|syrup|bbq|barbeque)\b|sauces/i],
  ['can', /\b(tuna|plum tomatoes|tomato paste|sweet corn|mushrooms?|beans|foul|chickpeas|corn|okra|condensed|evaporated|sardines?)\b|seafood/i],
  ['tray', /\b(burger|nuggets|chicken|beef|mutton|meat|kebab|meatballs|mortadella|shawarma|fillet|strips|tenders|bites|wings?|salmon|fries|wedges|pizza|crust|vegetables|okra)\b/i],
  ['jar', /\b(honey|jam|marmalade|peanut|spread|ghee|samn|hummus|paste|olive oil|oil|nutella|tahini|pistachio squeezy|coffee|nescaf[eé]|capsules|apricot|مربى|مربی)\b/i],
  ['pouch', /\b(soup|broth|cooking paste|sachet|latte|mocha|cappuccino|espresso|instant)\b/i],
  ['box', /\b(dates|tamr|tamara|khalas|sukari|safawi|kholas|date bars|date paste|date cookies)\b|dates|تمر/i],
];
const INSIDE = [
  [/strawberr/i, 'strawberry'], [/banana/i, 'banana-half'], [/mango/i, 'mango-cheek'], [/pineapple/i, 'pineapple-chunk'], [/orange|jus d'orange|mirinda/i, 'orange-whole'],
  [/lemon|citrus|lime|ليمون/i, 'lemon'], [/apple/i, 'apple-slice'], [/grape/i, 'grape-bunch'], [/guava|peach|apricot|مشمش/i, 'mango'], [/berr|cherry|cerise|raspberr|blackberr|pomegranate/i, 'raspberry'],
  [/date|tamr|تمر|khalas|sukari|safawi/i, 'date'], [/kiwi/i, 'lime'], [/mixed fruit|fruit|cocktail|nectar|juice/i, 'orange-whole'],
  [/salmon/i, 'salmon'], [/tuna/i, 'tuna-chunk'], [/shrimp/i, 'shrimp'], [/fish/i, 'fish-white'],
  [/nugget|pop ?corn chicken|bites|tenders|strips|zinger|broasted|boasted/i, 'fish-piece'], [/shawarma|mosahab|chicken|دجاج/i, 'chicken'], [/burger|beef|mutton|meat|kebab|mince|mortadella/i, 'meatball'],
  [/fries|wedges|potato/i, 'carrot-stick'], [/pizza/i, 'tomato-slice'], [/okra|vegetable/i, 'broccoli'], [/sweet corn|corn/i, 'corn-cob'], [/mushroom/i, 'mushroom'], [/tomato|ketchup/i, 'tomato-cherry'],
  [/olive/i, 'olive'], [/hummus|chickpea/i, 'chickpea'], [/foul|fava/i, 'fava'], [/peanut/i, 'peanut'], [/almond/i, 'almond'], [/pistachio/i, 'pistachio'], [/hazelnut|nuts|nutty/i, 'walnut'],
  [/honey|عسل/i, 'drizzle-honey'], [/caramel|toffee/i, 'drizzle-honey'], [/chocolate|choco|cocoa|mocha|oreo|galaxy|twix|snickers|kit ?kat|bounty|m&m|ferrero/i, 'choc'],
  [/coffee|nescaf|espresso|latte|cappuccino|baja/i, 'bean-coffee'], [/tea\b|ice tea|iced tea/i, 'mint'], [/mint/i, 'mint'], [/zaatar|za'atar/i, 'herb'], [/chili|chilli|flamin|hot|spic/i, 'chili-green'],
  [/cheese|cheddar|mozzarella|halloumi|gouda|kiri|جبن/i, 'cheese-cube'], [/vanilla|vanila/i, 'flower-item'], [/cream|قشطة|كريمة/i, 'yogurt-dollop'],
  [/milk|lait|laban|yog|skyr|حليب|لبن|زبادي|soy/i, 'milk-drop'], [/bread|bun|brioche|toast|bran|sliced/i, 'bread-slice'], [/croissant|crossant|puff|muffin|cupcake|cake/i, 'bun'],
  [/biscuit|biscut|cookie|digestive|hobnob|wafer|finger|sandwich/i, 'biscuit'], [/pasta|spaghetti|penne|pappardelle/i, 'penne'], [/rice|broccoli/i, 'rice-side'], [/soup|broth/i, 'carrot'],
  [/oat|granola|cereal|cerelac|wheat|flakes|tola/i, 'oat-cluster'], [/chips|crisps|lay|doritos|cheetos|kraker|rolls|croutons|bites|farfasha/i, 'chip'], [/popcorn|فشار/i, 'popcorn'],
  [/ice ?cream|lolly|popsicle|feast|tornado/i, 'scoop'], [/water|ماء/i, 'water-drop'], [/mayo|ranch|dressing|garlic/i, 'garlic-clove'], [/bbq|barbeque|hickory|smoke|sauce/i, 'drizzle-red'],
  [/syrup|pancake/i, 'drizzle-honey'], [/ghee|samn|butter/i, 'butter-block'], [/oil/i, 'olive'], [/cola|pepsi|7.?up|seven|soda/i, 'bubbles'],
];
Object.assign(ITEMS, {
  choc: () => `${block(16, 4, 5, '#7A4A2E', '#5E3420', '#4A2818')}<path d="M-8-4.4v4M-2.6-4.4v4M2.6-4.4v4" stroke="#9A6A4A" stroke-width="1"/>`,
  'bean-coffee': () => `${bean(4.6, 3.4, '#6E4228')}<path d="M-3 .2q3-1.6 6 0" stroke="#3E2414" stroke-width="1.1"/>`,
  'flower-item': () => flower(0, 0, 3),
  'milk-drop': () => '<path d="M0-8C3-3 6 0 6 3A6 6 0 0 1-6 3C-6 0-3-3 0-8Z" fill="#FFFFFF"/><path d="M-3 2a3 3 0 0 0 2 3" stroke="#D9D6EC" stroke-width="1.2"/>',
  'water-drop': () => `<path d="M0-8C3-3 6 0 6 3A6 6 0 0 1-6 3C-6 0-3-3 0-8Z" fill="${PAL.water}"/><path d="M-3 2a3 3 0 0 0 2 3" stroke="#FFFFFF" stroke-width="1.2"/>`,
  bun: () => `${dome(9, 6, '#D9A050')}<path d="M-5-4q5-4 10 0" stroke="#F2CE8C" stroke-width="1.6"/>`,
  'date-ball': (v) => `${ball(6, '#7A4A2E', '#A0704A')}${dots('M-2 2v.1M2-1v.1', '#5A321C', 1.2)}`,
  'oat-cluster': () => `<g stroke-width="1"><ellipse cx="-3" rx="2.6" ry="1.5" fill="#DCC08A"/><ellipse cx="2" cy="-2" rx="2.6" ry="1.5" fill="#E9D3A8"/><ellipse cx="2" cy="2" rx="2.6" ry="1.5" fill="#D2B074"/></g>`,
  chip: () => '<path d="M-7 0C-6-6 5-7 7-1C6 5-5 6-7 0Z" fill="#F2C65A"/><path d="M-3-1q3-2 6 0" stroke="#D9A43A" stroke-width="1"/>',
  scoop: () => `${ball(7, '#FBE6EC', '#FFFFFF')}<path d="M-6 3l6 12 6-12" fill="#E3A24E"/><path d="M-3 6h6M-1.6 10h3" stroke="#B9782F" stroke-width="1"/>`,
  bubbles: () => '<g stroke-width="1"><circle cx="-3" cy="2" r="2.4" fill="#FFFFFF"/><circle cx="3" cy="-2" r="1.8" fill="#FFFFFF"/><circle cx="1" cy="5" r="1.4" fill="#FFFFFF"/></g>',
});
Object.assign(FOOT, { choc: 9, 'bean-coffee': 4.6, 'flower-item': 5, 'milk-drop': 6, 'water-drop': 6, bun: 9, 'date-ball': 6, 'oat-cluster': 5, chip: 7, scoop: 8, bubbles: 5 });

const hx = (h, s, l) => { // hsl → #rrggbb
  s /= 100; l /= 100; const k = (n) => (n + h / 30) % 12; const a = s * Math.min(l, 1 - l);
  const c = (n) => Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1))))).toString(16).padStart(2, '0');
  return `#${c(0)}${c(8)}${c(4)}`.toUpperCase();
};

/** The package recipe of a packaged product or one of the person's own foods. */
export function packSpec(food) {
  const text = `${food.name ?? ''} ${food.category ?? ''}`;
  const custom = food.kind === 'custom' || /^custom[-:]/.test(String(food.id));
  let shape = PACK_RULES.find(([, re]) => re.test(text))?.[0] ?? (custom ? 'jar' : 'box');
  const inside = INSIDE.find(([re]) => re.test(text))?.[1] ?? (shape === 'carton' ? 'milk-drop' : shape === 'bag' ? 'chip' : shape === 'box' ? 'oat-cluster' : 'flower-item');
  const h = hash(`${food.id}|${custom ? food.name : ''}`);
  const h2 = hash(`${food.name}|${food.brand ?? ''}|${food.id}`);
  return {
    pack: shape, inside, custom: custom || undefined,
    hue: f((h % 3600) / 10), hue2: f(((h2 >>> 4) % 3600) / 10), pat: (h >>> 12) % 5, band: f(((h2 >>> 16) % 100) / 100),
  };
}

// the size a piece is drawn at so it fits on a label (drizzles are long and flat)
const iconR = (t) => (t.startsWith('drizzle') ? 20 : Math.max(5, FOOT[t] ?? 5));
/** The label: a panel with a pattern and what is inside drawn on it. */
function packLabel(x, y, w, hgt, sp, main, accent, rx = 6) {
  let o = `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(hgt)}" rx="${rx}" fill="#FFFFFF" stroke-width="1.6"/>`;
  const by = y + 4 + sp.band * (hgt - 14);
  if (sp.pat === 0) o += `<path d="M${P(x + 3, by)}h${f(w - 6)}M${P(x + 3, by + 4)}h${f(w - 6)}" stroke="${accent}" stroke-width="2.2"/>`;
  else if (sp.pat === 1) { let d = ''; for (let i = 0; i < 5; i++) d += `M${P(x + 6 + i * (w - 12) / 4, by + 2)}v.1`; o += path(d, `stroke="${accent}" stroke-width="3"`); }
  else if (sp.pat === 2) o += `<path d="M${P(x + 3, by + 2)}q${f(w / 8)} -4 ${f(w / 4)} 0t${f(w / 4)} 0t${f(w / 4)} 0t${f(w / 4 - 6)} 0" stroke="${accent}" stroke-width="2.2"/>`;
  else if (sp.pat === 3) o += `<rect x="${f(x + 3)}" y="${f(by)}" width="${f(w - 6)}" height="5" rx="2.5" fill="${accent}" stroke="none"/>`;
  else o += `<path d="M${P(x + 4, by + 4)}l${f(w / 8)} -4 ${f(w / 8)} 4 ${f(w / 8)} -4 ${f(w / 8)} 4 ${f(w / 8)} -4 ${f(w / 8)} 4 ${f(w / 8 - 2)} -4" stroke="${accent}" stroke-width="2"/>`;
  const iy = sp.band > .5 ? y + hgt * .36 : y + hgt * .64;
  const sc = Math.min(w, hgt) * .3 / iconR(sp.inside);
  o += `<g transform="translate(${f(x + w / 2)} ${f(iy)}) scale(${f(sc)})" stroke-width="${f(1.4 / sc)}">${drawOne({ type: sp.inside, args: [] }, 0)}</g>`;
  if (sp.custom) o += heart(x + w - 5, y + 6, .55);
  return o;
}

/** A plain package (cx, base y) for the product. */
function packShape(sp, main, light, dark, accent) {
  const lab = (x, y, w, hgt, rx) => packLabel(x, y, w, hgt, sp, main, accent, rx);
  switch (sp.pack) {
    case 'carton': return `<path d="M54 56L62 40H98L106 56Z" fill="${light}"/><path d="M62 40l4-8h28l4 8" fill="${main}"/><path d="M106 56L116 50V126L106 132Z" fill="${dark}"/><path d="M98 40l18 10" stroke-width="2"/><rect x="54" y="56" width="52" height="76" rx="3" fill="${main}"/>${lab(59, 70, 42, 46)}`;
    case 'water': return `<path d="M72 24h16v8c0 4 12 8 12 18v74c0 6-40 6-40 0V50c0-10 12-14 12-18Z" fill="#E9F6FD"/><path d="M60 64h40v56c0 6-40 6-40 0Z" fill="${PAL.sky2}" stroke="none"/><path d="M72 24h16v8c0 4 12 8 12 18v74c0 6-40 6-40 0V50c0-10 12-14 12-18Z"/><rect x="71" y="16" width="18" height="9" rx="3" fill="${main}"/><path d="M60 80h40M60 100h40" stroke="#FFFFFF" stroke-width="2" opacity=".8"/>${lab(63, 84, 34, 22, 4)}`;
    case 'can': return `<path d="M58 40V122a22 7 0 0 0 44 0V40" fill="${main}"/><ellipse cx="80" cy="40" rx="22" ry="7" fill="#E6E3F2"/><ellipse cx="80" cy="40" rx="15" ry="4.4" stroke="#A9A4C4" stroke-width="1.4"/><path d="M74 38h10" stroke-width="2.4"/><path d="M63 50V116" stroke="${light}" stroke-width="4" opacity=".8"/>${lab(64, 66, 32, 40, 8)}`;
    case 'bottle': case 'squeeze': {
      const sq = sp.pack === 'squeeze';
      return sq
        ? `<path d="M62 50C62 40 98 40 98 50L102 120C102 130 58 130 58 120Z" fill="${main}"/><path d="M70 50L72 30H88L90 50" fill="${dark}"/><path d="M76 30l2-8h4l2 8" fill="${accent}"/><path d="M66 56l-2 56" stroke="${light}" stroke-width="3.6" opacity=".8"/>${lab(66, 70, 28, 38)}`
        : `<path d="M72 22h16v12c0 6 14 10 14 22v66c0 6-44 6-44 0V56c0-12 14-16 14-22Z" fill="${main}"/><rect x="70" y="14" width="20" height="10" rx="3" fill="${accent}"/><path d="M64 60v54" stroke="${light}" stroke-width="3.6" opacity=".8"/>${lab(64, 72, 32, 36)}`;
    }
    case 'cup': return `<path d="M54 60H106L100 124C100 130 60 130 60 124Z" fill="${main}"/><ellipse cx="80" cy="60" rx="26" ry="8" fill="#E6E3F2"/><path d="M58 54c10-6 34-6 46 0" stroke="${accent}" stroke-width="2.4"/><path d="M106 60l6-4" stroke-width="2.4"/><path d="M60 70l4 48" stroke="${light}" stroke-width="3.4" opacity=".8"/>${lab(62, 76, 36, 36)}`;
    case 'tub': return `<path d="M50 70V118a30 9 0 0 0 60 0V70" fill="${main}"/><ellipse cx="80" cy="70" rx="30" ry="9" fill="${accent}"/><ellipse cx="80" cy="66" rx="30" ry="9" fill="${light}"/><path d="M55 80v34" stroke="${light}" stroke-width="3.4" opacity=".8"/>${lab(60, 84, 40, 30, 8)}`;
    case 'bag': return `<path d="M52 36C66 30 94 30 108 36L112 124C96 130 64 130 48 124Z" fill="${main}"/><path d="M52 36l4-6 4 6 4-6 4 6 4-6 4 6 4-6 4 6 4-6 4 6 4-6 4 6 4-6 4 6" stroke-width="1.6"/><path d="M48 124l4 5 4-5 4 5 4-5 4 5 4-5 4 5 4-5 4 5 4-5 4 5 4-5 4 5 4-5 4 5 4-5" stroke-width="1.6"/><path d="M58 44l-4 70" stroke="${light}" stroke-width="4" opacity=".8"/>${lab(60, 60, 40, 44, 14)}`;
    case 'bar': return `<path d="M28 82L118 64L136 76L46 96Z" fill="${light}"/><path d="M46 96L136 76V92L46 114Z" fill="${main}"/><path d="M28 82V100L46 114V96Z" fill="${dark}"/><path d="M28 82l-6-3 6-3M136 76l6-3-6-3" stroke-width="1.6"/>${`<g transform="matrix(1 -.22 0 1 0 0)">${lab(62, 102, 44, 20, 4)}</g>`}`;
    case 'tube': return `<path d="M34 64H116V96H34Z" fill="${main}"/><ellipse cx="116" cy="80" rx="8" ry="16" fill="${light}"/><ellipse cx="34" cy="80" rx="8" ry="16" fill="${dark}"/><path d="M34 64H116M34 96H116" stroke-width="2.2"/><path d="M40 70H110" stroke="${light}" stroke-width="3" opacity=".8"/>${lab(56, 69, 44, 22, 4)}`;
    case 'bread': return `<path d="M42 64C42 50 118 50 118 64V116C118 124 42 124 42 116Z" fill="#FFFFFF" fill-opacity=".9"/><path d="M50 70C50 60 110 60 110 70V114H50Z" fill="#E3A24E" stroke="none"/><path d="M42 64C42 50 118 50 118 64V116C118 124 42 124 42 116Z"/><path d="M118 74l10-6M118 74l10 6" stroke="${accent}" stroke-width="3"/><path d="M118 70v8" stroke-width="2"/>${lab(56, 80, 48, 26, 6)}`;
    case 'box': return `<path d="M50 44L62 34H112L100 44Z" fill="${light}"/><path d="M100 44L112 34V118L100 128Z" fill="${dark}"/><rect x="50" y="44" width="50" height="84" rx="2" fill="${main}"/>${lab(55, 58, 40, 50)}`;
    case 'jar': return `<path d="M56 54H104V120C104 128 56 128 56 120Z" fill="${light}"/><path d="M62 60V116" stroke="#FFFFFF" stroke-width="3" opacity=".8"/><rect x="54" y="40" width="52" height="15" rx="4" fill="${main}"/><path d="M58 44h44" stroke="${dark}" stroke-width="1.6"/>${lab(62, 70, 36, 38)}`;
    case 'slab': return `${block(70, 34, 20, light, main, dark).replace(/<path/g, '<path transform="translate(70 96)"')}${lab(42, 84, 50, 26, 5)}`;
    case 'tray': return `<path d="M30 92L50 70H130L110 92Z" fill="#FFFFFF"/><path d="M30 92V104H110L130 82V70L110 92Z" fill="${main}"/><path d="M30 92H110V104H30Z" fill="${dark}"/><path d="M38 90L54 74H122" stroke="${light}" stroke-width="2.4"/>${`<g transform="translate(80 82) scale(${f(14 / iconR(sp.inside))})" stroke-width="${f(1.6 * iconR(sp.inside) / 14)}">${drawOne({ type: sp.inside, args: [] }, 0)}</g>`}<path d="M30 92L50 70H130L110 92Z" fill="#FFFFFF" fill-opacity=".35"/>${lab(40, 106, 60, 16, 4)}`;
    case 'pouch': return `<path d="M54 30H106L108 128H52Z" fill="${main}"/><path d="M54 30l2-4h48l2 4" fill="${dark}"/><path d="M54 40H106" stroke="${light}" stroke-width="2"/><path d="M50 46l4 2M110 46l-4 2" stroke-width="1.6"/>${lab(59, 56, 42, 56)}`;
    case 'stick': return `<path d="M78 112V136" stroke-width="7"/><path d="M78 112V136" stroke="#E3C08A" stroke-width="3.6"/><path d="M62 52C62 36 94 36 94 52V108C94 114 62 114 62 108Z" fill="${main}"/><path d="M68 54V104" stroke="${light}" stroke-width="4" opacity=".8"/><path d="M62 70H94" stroke="${accent}" stroke-width="3"/><g transform="translate(78 88) scale(${f(9 / iconR(sp.inside))})" stroke-width="${f(1.5 * iconR(sp.inside) / 9)}">${drawOne({ type: sp.inside, args: [] }, 0)}</g>`;
    default: return '';
  }
}

/** The square picture of a package. */
function packTile(sp, kind) {
  const main = hx(sp.hue, 58, 62); const light = hx(sp.hue, 70, 82); const dark = hx(sp.hue, 46, 46); const accent = hx(sp.hue2, 64, 52);
  const [bg, ground] = TILE_BG[kind] ?? TILE_BG.packaged;
  let o = `<rect width="160" height="160" fill="${bg}"/>${E(80, 128, 66, 16, `fill="${ground}"`)}`;
  o += G_OPEN + spark(26, 28, 5, PAL.gold) + spark(134, 24, 4.2, PAL.violet) + flower(24, 136, 2.4);
  o += `<g stroke-width="2.4">${packShape(sp, main, light, dark, accent)}</g>`;
  return `<svg viewBox="12 12 136 136" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">${o}</g></svg>`;
}

const PACK_SHAPES = new Set(['carton', 'water', 'can', 'bottle', 'squeeze', 'cup', 'tub', 'bag', 'bar', 'tube', 'bread', 'box', 'jar', 'slab', 'tray', 'pouch', 'stick']);
/** What in a picture recipe is not drawn (unknown vessel, base, item, side, or nothing at all); [] when all is drawn. */
export function artProblems(spec) {
  if (!spec || typeof spec !== 'object') return ['no recipe'];
  if (spec.pack) return PACK_SHAPES.has(spec.pack) && ITEMS[spec.inside] ? [] : [`package ${spec.pack} with ${spec.inside}`];
  const out = [];
  const items = parseItems(spec.items);
  if (!VESSEL_TOP[spec.vessel]) out.push(`vessel ${spec.vessel}`);
  if (spec.base && spec.base !== 'none' && !BASES[spec.base]) out.push(`base ${spec.base}`);
  for (const it of items) if (!ITEMS[it.type]) out.push(`item ${it.type}`);
  if ((!spec.base || spec.base === 'none') && !items.length) out.push('nothing on it');
  if (spec.side) {
    const [what, ...args] = String(spec.side).split('~');
    if (!['dates', 'cup', 'finjan', 'bowl'].includes(what)) out.push(`side ${what}`);
    if (what === 'bowl') { if (!BASES[args[0]]) out.push(`side base ${args[0]}`); for (const it of parseItems(args.slice(1))) if (!ITEMS[it.type]) out.push(`side item ${it.type}`); }
  }
  return out;
}

// The kind of a food from its id, for rows that only know the id (recent foods).
const KIND_PREFIX = { moh: 'moh-portion', sfct: 'saudi-dish', ing: 'ingredient', recipe: 'recipe' };
const kindOf = (id) => KIND_PREFIX[String(id ?? '').split(':')[0]] ?? (/^custom/.test(String(id)) ? 'custom' : 'packaged');
const foodCache = new Map();
/** The picture recipe of a food: its own `art` (dishes, ingredients, portions, recipes) or a package. */
export function foodArtSpec(food) {
  const a = food?.art;
  if (a && typeof a === 'object' && (a.vessel || a.pack)) return a;
  return packSpec(food ?? {});
}
/** Decorative square SVG of one food for food lists (the name is shown next to it). Cached by id and recipe. */
export function foodArt(food) {
  const spec = foodArtSpec(food);
  const kind = String(food?.kind ?? kindOf(food?.id));
  const key = `${kind}|${JSON.stringify(spec)}`;
  if (!foodCache.has(key)) {
    if (foodCache.size > 2000) foodCache.clear();
    foodCache.set(key, spec.pack ? packTile(spec, kind) : tile(spec, kind));
  }
  return foodCache.get(key);
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

/**
 * Mizan logo: an elegant balance scale (curved beam with curled ends, gold sparkle, turned
 * pillar, round base) with dates on one pan and a green leaf on the other, on lavender.
 * `withWord` adds the Arabic name ميزان under the scale (used for the large logo: emails,
 * link previews). The word is a pre-rendered transparent PNG of Rubik Bold so it shows the same
 * everywhere, also where web fonts are not available.
 */
const LOGO_PLAIN = '<svg viewBox="0 0 128 128" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><rect width="128" height="128" rx="30" fill="#EEEDFA"/><path d="M14 15l1.5 3.5 3.8 0.2-3.0 2.2 1.2 3.8-3.5-2.2-3.5 2.2 1.2-3.8-3.0-2.2 3.8-0.2z" fill="none" stroke="#2E2A86" stroke-width="1.1" stroke-linejoin="round" opacity=".55"/><path d="M112 22l1.2 2.8 3.0 0.2-2.4 1.8 1.0 3.0-2.8-1.8-2.8 1.8 1.0-3.0-2.4-1.8 3.0-0.2z" fill="none" stroke="#2E2A86" stroke-width="1.1" stroke-linejoin="round" opacity=".55"/><path d="M108 92l1.2 2.8 3.0 0.2-2.4 1.8 1.0 3.0-2.8-1.8-2.8 1.8 1.0-3.0-2.4-1.8 3.0-0.2z" fill="none" stroke="#2E2A86" stroke-width="1.1" stroke-linejoin="round" opacity=".55"/><path d="M18 94.5l1.1 2.4 2.6 0.2-2.1 1.6 0.9 2.6-2.4-1.6-2.4 1.6 0.9-2.6-2.1-1.6 2.6-0.2z" fill="none" stroke="#2E2A86" stroke-width="1.1" stroke-linejoin="round" opacity=".55"/><path d="M24 60.4c-3.5999999999999996 -2.4000000000000004 -3.5999999999999996 -5.4 -1.2000000000000002 -5.4c0.8999999999999999 0 1.2000000000000002 0.8999999999999999 1.2000000000000002 1.5c0 -0.6000000000000001 0.30000000000000004 -1.5 1.2000000000000002 -1.5c2.4000000000000004 0 2.4000000000000004 3 -1.2000000000000002 5.4z" fill="none" stroke="#2E2A86" stroke-width="1.1" opacity=".55"/><path d="M104 64.4c-3.5999999999999996 -2.4000000000000004 -3.5999999999999996 -5.4 -1.2000000000000002 -5.4c0.8999999999999999 0 1.2000000000000002 0.8999999999999999 1.2000000000000002 1.5c0 -0.6000000000000001 0.30000000000000004 -1.5 1.2000000000000002 -1.5c2.4000000000000004 0 2.4000000000000004 3 -1.2000000000000002 5.4z" fill="none" stroke="#2E2A86" stroke-width="1.1" opacity=".55"/><path d="M98 16.08c-3.12 -2.08 -3.12 -4.680000000000001 -1.04 -4.680000000000001c0.78 0 1.04 0.78 1.04 1.3c0 -0.52 0.26 -1.3 1.04 -1.3c2.08 0 2.08 2.6 -1.04 4.680000000000001z" fill="none" stroke="#2E2A86" stroke-width="1.1" opacity=".55"/><path d="M60 48h8v34h-8z" fill="#C9C4F2" stroke="#2E2A86" stroke-width="2.2" stroke-linejoin="round"/><path d="M62 50v30" stroke="#FFFFFF" stroke-width="1.6" opacity=".7" stroke-linecap="round"/><rect x="56" y="44" width="16" height="6" rx="3" fill="#E4E1FA" stroke="#2E2A86" stroke-width="2.2"/><path d="M58 82h12c4 4 5 10 2 14h-16c-3-4-2-10 2-14z" fill="#C9C4F2" stroke="#2E2A86" stroke-width="2.2" stroke-linejoin="round"/><path d="M44 108c2-8 10-12 20-12s18 4 20 12z" fill="#E4E1FA" stroke="#2E2A86" stroke-width="2.2" stroke-linejoin="round"/><rect x="38" y="107" width="52" height="7" rx="3.5" fill="#C9C4F2" stroke="#2E2A86" stroke-width="2.2"/><path d="M50 104c4-3 10-4 14-4" stroke="#FFFFFF" stroke-width="1.6" fill="none" opacity=".8" stroke-linecap="round"/><path d="M22 42C36 33 50 49 64 40S92 31 106 42" stroke="#2E2A86" stroke-width="8" fill="none" stroke-linecap="round"/><path d="M22 42C36 33 50 49 64 40S92 31 106 42" stroke="#C9C4F2" stroke-width="4.4" fill="none" stroke-linecap="round"/><path d="M24 40C36 33 48 45 60 40" stroke="#FFFFFF" stroke-width="1.4" fill="none" opacity=".8" stroke-linecap="round"/><circle cx="20" cy="38" r="5.4" fill="#C9C4F2" stroke="#2E2A86" stroke-width="2.2"/><path d="M20 38m-2 0a2 2 0 1 1 2 2" stroke="#2E2A86" stroke-width="1.4" fill="none" stroke-linecap="round"/><circle cx="108" cy="38" r="5.4" fill="#C9C4F2" stroke="#2E2A86" stroke-width="2.2"/><path d="M108 38m-2 0a2 2 0 1 1 2 2" stroke="#2E2A86" stroke-width="1.4" fill="none" stroke-linecap="round"/><circle cx="64" cy="40" r="5" fill="#E0A23B" stroke="#2E2A86" stroke-width="2.2"/><path d="M64 13C65.62 20.38 65.62 20.38 73 22C65.62 23.62 65.62 23.62 64 31C62.38 23.62 62.38 23.62 55 22C62.38 20.38 62.38 20.38 64 13z" fill="#E0A23B" stroke="#2E2A86" stroke-width="1.4" stroke-linejoin="round"/><path d="M64 8v3M54 13l2 2M74 13l-2 2" stroke="#E0A23B" stroke-width="1.8" stroke-linecap="round"/><path d="M20 43l-14 28M20 43l14 28M20 43v16" stroke="#2E2A86" stroke-width="1.4" stroke-linecap="round" stroke-dasharray="3 2"/><path d="M108 43l-14 28M108 43l14 28M108 43v16" stroke="#2E2A86" stroke-width="1.4" stroke-linecap="round" stroke-dasharray="3 2"/><path d="M4 71h32c0 8-7 12-16 12s-16-4-16-12z" fill="#C9C4F2" stroke="#2E2A86" stroke-width="2.2" stroke-linejoin="round"/><path d="M10 76q10 4 20 0" stroke="#FFFFFF" stroke-width="1.6" fill="none" opacity=".8"/><path d="M92 71h32c0 8-7 12-16 12s-16-4-16-12z" fill="#A6D6F3" stroke="#2E2A86" stroke-width="2.2" stroke-linejoin="round"/><path d="M98 76q10 4 20 0" stroke="#FFFFFF" stroke-width="1.6" fill="none" opacity=".8"/><g transform="rotate(-18 13 66)"><ellipse cx="13" cy="66" rx="6.2" ry="4.4" fill="#9C5230" stroke="#2E2A86" stroke-width="1.6"/><path d="M9.59 64.46q3.1 1.1 6.820000000000001 0M9.280000000000001 66.66q3.7199999999999998 1.32 7.4399999999999995 -0.22000000000000003M11.76 62.7q1.2400000000000002 2.2 0 5.720000000000001" stroke="#7A3B22" stroke-width="1.3" fill="none" stroke-linecap="round"/><ellipse cx="10.83" cy="64.02" rx="1.7360000000000002" ry="0.7040000000000001" fill="#C27A52" opacity=".9"/><circle cx="16.844" cy="66" r="1.1" fill="#F6CF7A"/></g><g transform="rotate(15 27 66)"><ellipse cx="27" cy="66" rx="6.2" ry="4.4" fill="#9C5230" stroke="#2E2A86" stroke-width="1.6"/><path d="M23.59 64.46q3.1 1.1 6.820000000000001 0M23.28 66.66q3.7199999999999998 1.32 7.4399999999999995 -0.22000000000000003M25.759999999999998 62.7q1.2400000000000002 2.2 0 5.720000000000001" stroke="#7A3B22" stroke-width="1.3" fill="none" stroke-linecap="round"/><ellipse cx="24.83" cy="64.02" rx="1.7360000000000002" ry="0.7040000000000001" fill="#C27A52" opacity=".9"/><circle cx="30.844" cy="66" r="1.1" fill="#F6CF7A"/></g><g transform="rotate(-4 20 60)"><ellipse cx="20" cy="60" rx="6.4" ry="4.6" fill="#9C5230" stroke="#2E2A86" stroke-width="1.6"/><path d="M16.48 58.39q3.2 1.15 7.040000000000001 0M16.16 60.69q3.84 1.38 7.68 -0.22999999999999998M18.72 56.55q1.2800000000000002 2.3 0 5.9799999999999995" stroke="#7A3B22" stroke-width="1.3" fill="none" stroke-linecap="round"/><ellipse cx="17.76" cy="57.93" rx="1.7920000000000003" ry="0.736" fill="#C27A52" opacity=".9"/><circle cx="23.968" cy="60" r="1.1" fill="#F6CF7A"/></g><path d="M97 70c0-10 9-16 22-15c0 11-9 16-22 15z" fill="#6CC07A" stroke="#2E2A86" stroke-width="1.8" stroke-linejoin="round"/><path d="M98 69c6-4 12-8 19-12M104 66l0-5M110 62l1-4M102 68l-4-2" stroke="#3E9B57" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>';
const LOGO_WITH_WORD = '<svg viewBox="0 0 128 128" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><rect width="128" height="128" rx="30" fill="#EEEDFA"/><path d="M14 15l1.5 3.5 3.8 0.2-3.0 2.2 1.2 3.8-3.5-2.2-3.5 2.2 1.2-3.8-3.0-2.2 3.8-0.2z" fill="none" stroke="#2E2A86" stroke-width="1.1" stroke-linejoin="round" opacity=".55"/><path d="M112 22l1.2 2.8 3.0 0.2-2.4 1.8 1.0 3.0-2.8-1.8-2.8 1.8 1.0-3.0-2.4-1.8 3.0-0.2z" fill="none" stroke="#2E2A86" stroke-width="1.1" stroke-linejoin="round" opacity=".55"/><path d="M108 92l1.2 2.8 3.0 0.2-2.4 1.8 1.0 3.0-2.8-1.8-2.8 1.8 1.0-3.0-2.4-1.8 3.0-0.2z" fill="none" stroke="#2E2A86" stroke-width="1.1" stroke-linejoin="round" opacity=".55"/><path d="M18 94.5l1.1 2.4 2.6 0.2-2.1 1.6 0.9 2.6-2.4-1.6-2.4 1.6 0.9-2.6-2.1-1.6 2.6-0.2z" fill="none" stroke="#2E2A86" stroke-width="1.1" stroke-linejoin="round" opacity=".55"/><path d="M24 60.4c-3.5999999999999996 -2.4000000000000004 -3.5999999999999996 -5.4 -1.2000000000000002 -5.4c0.8999999999999999 0 1.2000000000000002 0.8999999999999999 1.2000000000000002 1.5c0 -0.6000000000000001 0.30000000000000004 -1.5 1.2000000000000002 -1.5c2.4000000000000004 0 2.4000000000000004 3 -1.2000000000000002 5.4z" fill="none" stroke="#2E2A86" stroke-width="1.1" opacity=".55"/><path d="M104 64.4c-3.5999999999999996 -2.4000000000000004 -3.5999999999999996 -5.4 -1.2000000000000002 -5.4c0.8999999999999999 0 1.2000000000000002 0.8999999999999999 1.2000000000000002 1.5c0 -0.6000000000000001 0.30000000000000004 -1.5 1.2000000000000002 -1.5c2.4000000000000004 0 2.4000000000000004 3 -1.2000000000000002 5.4z" fill="none" stroke="#2E2A86" stroke-width="1.1" opacity=".55"/><path d="M98 16.08c-3.12 -2.08 -3.12 -4.680000000000001 -1.04 -4.680000000000001c0.78 0 1.04 0.78 1.04 1.3c0 -0.52 0.26 -1.3 1.04 -1.3c2.08 0 2.08 2.6 -1.04 4.680000000000001z" fill="none" stroke="#2E2A86" stroke-width="1.1" opacity=".55"/><g transform="translate(15.5 1) scale(.76)"><path d="M60 48h8v34h-8z" fill="#C9C4F2" stroke="#2E2A86" stroke-width="2.2" stroke-linejoin="round"/><path d="M62 50v30" stroke="#FFFFFF" stroke-width="1.6" opacity=".7" stroke-linecap="round"/><rect x="56" y="44" width="16" height="6" rx="3" fill="#E4E1FA" stroke="#2E2A86" stroke-width="2.2"/><path d="M58 82h12c4 4 5 10 2 14h-16c-3-4-2-10 2-14z" fill="#C9C4F2" stroke="#2E2A86" stroke-width="2.2" stroke-linejoin="round"/><path d="M44 108c2-8 10-12 20-12s18 4 20 12z" fill="#E4E1FA" stroke="#2E2A86" stroke-width="2.2" stroke-linejoin="round"/><rect x="38" y="107" width="52" height="7" rx="3.5" fill="#C9C4F2" stroke="#2E2A86" stroke-width="2.2"/><path d="M50 104c4-3 10-4 14-4" stroke="#FFFFFF" stroke-width="1.6" fill="none" opacity=".8" stroke-linecap="round"/><path d="M22 42C36 33 50 49 64 40S92 31 106 42" stroke="#2E2A86" stroke-width="8" fill="none" stroke-linecap="round"/><path d="M22 42C36 33 50 49 64 40S92 31 106 42" stroke="#C9C4F2" stroke-width="4.4" fill="none" stroke-linecap="round"/><path d="M24 40C36 33 48 45 60 40" stroke="#FFFFFF" stroke-width="1.4" fill="none" opacity=".8" stroke-linecap="round"/><circle cx="20" cy="38" r="5.4" fill="#C9C4F2" stroke="#2E2A86" stroke-width="2.2"/><path d="M20 38m-2 0a2 2 0 1 1 2 2" stroke="#2E2A86" stroke-width="1.4" fill="none" stroke-linecap="round"/><circle cx="108" cy="38" r="5.4" fill="#C9C4F2" stroke="#2E2A86" stroke-width="2.2"/><path d="M108 38m-2 0a2 2 0 1 1 2 2" stroke="#2E2A86" stroke-width="1.4" fill="none" stroke-linecap="round"/><circle cx="64" cy="40" r="5" fill="#E0A23B" stroke="#2E2A86" stroke-width="2.2"/><path d="M64 13C65.62 20.38 65.62 20.38 73 22C65.62 23.62 65.62 23.62 64 31C62.38 23.62 62.38 23.62 55 22C62.38 20.38 62.38 20.38 64 13z" fill="#E0A23B" stroke="#2E2A86" stroke-width="1.4" stroke-linejoin="round"/><path d="M64 8v3M54 13l2 2M74 13l-2 2" stroke="#E0A23B" stroke-width="1.8" stroke-linecap="round"/><path d="M20 43l-14 28M20 43l14 28M20 43v16" stroke="#2E2A86" stroke-width="1.4" stroke-linecap="round" stroke-dasharray="3 2"/><path d="M108 43l-14 28M108 43l14 28M108 43v16" stroke="#2E2A86" stroke-width="1.4" stroke-linecap="round" stroke-dasharray="3 2"/><path d="M4 71h32c0 8-7 12-16 12s-16-4-16-12z" fill="#C9C4F2" stroke="#2E2A86" stroke-width="2.2" stroke-linejoin="round"/><path d="M10 76q10 4 20 0" stroke="#FFFFFF" stroke-width="1.6" fill="none" opacity=".8"/><path d="M92 71h32c0 8-7 12-16 12s-16-4-16-12z" fill="#A6D6F3" stroke="#2E2A86" stroke-width="2.2" stroke-linejoin="round"/><path d="M98 76q10 4 20 0" stroke="#FFFFFF" stroke-width="1.6" fill="none" opacity=".8"/><g transform="rotate(-18 13 66)"><ellipse cx="13" cy="66" rx="6.2" ry="4.4" fill="#9C5230" stroke="#2E2A86" stroke-width="1.6"/><path d="M9.59 64.46q3.1 1.1 6.820000000000001 0M9.280000000000001 66.66q3.7199999999999998 1.32 7.4399999999999995 -0.22000000000000003M11.76 62.7q1.2400000000000002 2.2 0 5.720000000000001" stroke="#7A3B22" stroke-width="1.3" fill="none" stroke-linecap="round"/><ellipse cx="10.83" cy="64.02" rx="1.7360000000000002" ry="0.7040000000000001" fill="#C27A52" opacity=".9"/><circle cx="16.844" cy="66" r="1.1" fill="#F6CF7A"/></g><g transform="rotate(15 27 66)"><ellipse cx="27" cy="66" rx="6.2" ry="4.4" fill="#9C5230" stroke="#2E2A86" stroke-width="1.6"/><path d="M23.59 64.46q3.1 1.1 6.820000000000001 0M23.28 66.66q3.7199999999999998 1.32 7.4399999999999995 -0.22000000000000003M25.759999999999998 62.7q1.2400000000000002 2.2 0 5.720000000000001" stroke="#7A3B22" stroke-width="1.3" fill="none" stroke-linecap="round"/><ellipse cx="24.83" cy="64.02" rx="1.7360000000000002" ry="0.7040000000000001" fill="#C27A52" opacity=".9"/><circle cx="30.844" cy="66" r="1.1" fill="#F6CF7A"/></g><g transform="rotate(-4 20 60)"><ellipse cx="20" cy="60" rx="6.4" ry="4.6" fill="#9C5230" stroke="#2E2A86" stroke-width="1.6"/><path d="M16.48 58.39q3.2 1.15 7.040000000000001 0M16.16 60.69q3.84 1.38 7.68 -0.22999999999999998M18.72 56.55q1.2800000000000002 2.3 0 5.9799999999999995" stroke="#7A3B22" stroke-width="1.3" fill="none" stroke-linecap="round"/><ellipse cx="17.76" cy="57.93" rx="1.7920000000000003" ry="0.736" fill="#C27A52" opacity=".9"/><circle cx="23.968" cy="60" r="1.1" fill="#F6CF7A"/></g><path d="M97 70c0-10 9-16 22-15c0 11-9 16-22 15z" fill="#6CC07A" stroke="#2E2A86" stroke-width="1.8" stroke-linejoin="round"/><path d="M98 69c6-4 12-8 19-12M104 66l0-5M110 62l1-4M102 68l-4-2" stroke="#3E9B57" stroke-width="1.5" fill="none" stroke-linecap="round"/></g><image x="30" y="91" width="68" height="32.7" href="data:image/png;base64,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" xlink:href="data:image/png;base64,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"/></svg>';
export function logoMark({ withWord = false } = {}) {
  return withWord ? LOGO_WITH_WORD : LOGO_PLAIN;
}
