import { ImageResponse } from 'next/og';
import { logoMark } from '@/lib/art.js';

export const alt = 'CareBite: Care in every bite';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Palette (globals.css): cream background, sky, lavender, indigo ink and primary.
const C = { bg: '#FBF8F3', blush: '#F3EFE8', rose: '#E3F1FA', pink: '#CDE5F5', sage: '#DCD9F4', mint: '#EEEDFA', heading: '#1B1A3A', roseInk: '#3730A3', text: '#615F74', chip: '#2E2A86' };

export default function OpengraphImage() {
  const logo = `data:image/svg+xml;utf8,${encodeURIComponent(logoMark().replace('<svg ', '<svg width="160" height="160" '))}`;
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', position: 'relative', background: C.bg, fontFamily: 'sans-serif' }}>
        <div style={{ position: 'absolute', right: -160, top: -200, width: 720, height: 720, borderRadius: 9999, background: C.rose, display: 'flex' }} />
        <div style={{ position: 'absolute', left: -220, bottom: -320, width: 760, height: 620, borderRadius: 9999, background: C.mint, display: 'flex' }} />
        <div style={{ position: 'absolute', right: 120, bottom: 70, width: 220, height: 220, borderRadius: 9999, background: C.sage, display: 'flex' }} />
        <div style={{ position: 'absolute', right: 300, top: 120, width: 90, height: 90, borderRadius: 9999, background: C.pink, display: 'flex' }} />
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 88px', gap: 28, position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logo} width={140} height={140} alt="" />
            <div style={{ fontSize: 112, fontWeight: 700, color: C.heading, letterSpacing: -2 }}>CareBite</div>
          </div>
          <div style={{ fontSize: 50, fontWeight: 600, color: C.roseInk, maxWidth: 860, lineHeight: 1.15 }}>Care in every bite.</div>
          <div style={{ fontSize: 30, color: C.text, maxWidth: 820, lineHeight: 1.35 }}>Keep a private food diary at home and get meals checked for you in hospital, guided by the Saudi Ministry of Health and SFDA.</div>
          <div style={{ display: 'flex', marginTop: 8 }}>
            <div style={{ fontSize: 24, color: C.chip, background: C.mint, border: `2px solid ${C.sage}`, borderRadius: 999, padding: '10px 24px' }}>A university Health Informatics project</div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
