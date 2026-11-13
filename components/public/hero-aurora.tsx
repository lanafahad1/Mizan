'use client';
// Animated aurora behind the home hero, in Mizan's palette.
//
// Adapted from the owner's "StudioBackground" (ogl) shader, rebuilt on plain WebGL2 so no
// library is downloaded, and slimmed down for speed:
// - the shader keeps only the aurora field (4 moving light fields + a 3-octave haze);
//   every post effect (pixelate, dither, glitch, glow, LED…) is gone, which also removes
//   the glow pass that sampled the whole scene 4 extra times per pixel;
// - it renders at a small fraction of the screen (≤ ~200k pixels, never above 0.45× CSS
//   size) and the browser scales it up smoothly: the aurora is soft, so it looks the same;
// - 24 fps (15 on low-power devices), paused when off screen or when the tab is hidden;
// - starts after the page is idle, fades in over a static CSS gradient of the same colours
//   (also the fallback without WebGL2 and for people who prefer reduced motion, who get a
//   single still frame).
import * as React from 'react';

const VERT = `#version 300 es
in vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }`;

const FRAG = `#version 300 es
precision mediump float;
uniform vec2 uRes;
uniform float uTime;
uniform vec3 uA;
uniform vec3 uB;
uniform vec3 uC;
uniform vec3 uD;
out vec4 fragColor;

float hash21(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash21(i), hash21(i + vec2(1.0, 0.0)), f.x), mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0)), f.x), f.y);
}
float fbm(vec2 p) {
  float v = 0.0; float a = 0.5;
  for (int i = 0; i < 3; i++) { v += a * noise(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; }
  return v;
}
void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 p = (uv - 0.5) * vec2(uRes.x / uRes.y, 1.0);
  p *= 1.12;
  float t = uTime * 0.087;
  p += vec2(sin(p.y * 2.1 + t), cos(p.x * 1.7 - t)) * 0.046;
  vec2 q = p * 0.92;
  vec2 p1 = vec2(-0.58 + sin(t * 0.8) * 0.18, -0.28 + cos(t * 0.7) * 0.16);
  vec2 p2 = vec2(0.52 + cos(t * 0.55) * 0.22, -0.16 + sin(t) * 0.2);
  vec2 p3 = vec2(sin(t * 0.45) * 0.28, 0.48 + cos(t * 0.62) * 0.16);
  vec2 p4 = vec2(-0.28 + cos(t * 0.7) * 0.3, 0.18 + sin(t * 0.5) * 0.2);
  float w1 = exp(-dot(q - p1, q - p1) * 3.4);
  float w2 = exp(-dot(q - p2, q - p2) * 3.0);
  float w3 = exp(-dot(q - p3, q - p3) * 3.8);
  float w4 = exp(-dot(q - p4, q - p4) * 4.8);
  float haze = fbm(q * 1.35 + vec2(t * 0.08, -t * 0.06));
  vec3 c = uA;
  c = mix(c, uB, clamp(w1 * 0.78 + w3 * 0.62 + haze * 0.16, 0.0, 1.0));
  c = mix(c, uC, clamp(w2 * 0.82 + w4 * 0.48, 0.0, 1.0));
  c = mix(c, uD, clamp(w4 * 0.35 * haze, 0.0, 1.0));
  fragColor = vec4(c, 1.0);
}`;

// Mizan palette, light: cream-lavender base, lavender, sky, warm gold-cream glow.
const COLORS = { a: '#F4F1FB', b: '#B9B1F1', c: '#A6D6F3', d: '#F6DCAE' };
const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255) as [number, number, number];

/** Static fallback with the same colours (shown first, and when animation is off). */
export const AURORA_FALLBACK = `radial-gradient(60% 70% at 18% 72%, ${COLORS.b} 0%, transparent 70%), radial-gradient(55% 65% at 82% 38%, ${COLORS.c} 0%, transparent 70%), radial-gradient(40% 50% at 50% 10%, ${COLORS.d} 0%, transparent 70%), ${COLORS.a}`;

export function HeroAurora({ className = '' }: { className?: string }) {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const host = ref.current;
    if (!host) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
    const lowPower = (nav.hardwareConcurrency ?? 8) <= 4 || (nav.deviceMemory ?? 8) <= 4 || nav.connection?.saveData === true;
    const fps = lowPower ? 15 : 24;

    let cancelled = false;
    let cleanup = () => {};

    const start = () => {
      if (cancelled) return;
      const canvas = document.createElement('canvas');
      Object.assign(canvas.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', display: 'block', opacity: '0', transition: 'opacity 900ms ease' });
      const gl = canvas.getContext('webgl2', { alpha: false, antialias: false, depth: false, stencil: false, premultipliedAlpha: false, preserveDrawingBuffer: false, powerPreference: 'low-power' });
      if (!gl) return; // keep the CSS fallback
      const compile = (type: number, src: string) => { const s = gl.createShader(type)!; gl.shaderSource(s, src); gl.compileShader(s); return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null; };
      const vs = compile(gl.VERTEX_SHADER, VERT); const fs = compile(gl.FRAGMENT_SHADER, FRAG);
      if (!vs || !fs) return;
      const prog = gl.createProgram()!; gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
      gl.useProgram(prog);
      // One full-screen triangle.
      const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(prog, 'position'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      const uRes = gl.getUniformLocation(prog, 'uRes'); const uTime = gl.getUniformLocation(prog, 'uTime');
      gl.uniform3fv(gl.getUniformLocation(prog, 'uA'), rgb(COLORS.a)); gl.uniform3fv(gl.getUniformLocation(prog, 'uB'), rgb(COLORS.b));
      gl.uniform3fv(gl.getUniformLocation(prog, 'uC'), rgb(COLORS.c)); gl.uniform3fv(gl.getUniformLocation(prog, 'uD'), rgb(COLORS.d));
      host.appendChild(canvas);

      const PIXEL_BUDGET = lowPower ? 120_000 : 200_000;
      const size = () => {
        const r = host.getBoundingClientRect();
        const w = Math.max(1, r.width), h = Math.max(1, r.height);
        const scale = Math.min(0.45, Math.sqrt(PIXEL_BUDGET / (w * h)));
        canvas.width = Math.max(2, Math.round(w * scale)); canvas.height = Math.max(2, Math.round(h * scale));
        gl.viewport(0, 0, canvas.width, canvas.height); gl.uniform2f(uRes, canvas.width, canvas.height);
      };
      size();
      let resizeQueued = false;
      const ro = new ResizeObserver(() => { if (resizeQueued) return; resizeQueued = true; requestAnimationFrame(() => { resizeQueued = false; size(); draw(); }); });
      ro.observe(host);

      let elapsed = 6; // start a little into the motion so the first frame is already balanced
      let last = 0, raf = 0, shown = false, onScreen = true, visible = !document.hidden;
      const draw = () => { gl.uniform1f(uTime, elapsed); gl.drawArrays(gl.TRIANGLES, 0, 3); if (!shown) { shown = true; canvas.style.opacity = '1'; } };
      const step = (now: number) => {
        raf = requestAnimationFrame(step);
        if (!last) last = now;
        const dt = now - last;
        if (dt < 1000 / fps - 1) return;
        last = now;
        elapsed += Math.min(dt, 100) / 1000;
        draw();
      };
      const run = () => { if (!raf && onScreen && visible && !reduce) { last = 0; raf = requestAnimationFrame(step); } };
      const stop = () => { if (raf) { cancelAnimationFrame(raf); raf = 0; } };
      const io = new IntersectionObserver(([e]) => { onScreen = e?.isIntersecting ?? true; onScreen ? run() : stop(); });
      io.observe(host);
      const vis = () => { visible = !document.hidden; visible ? run() : stop(); };
      document.addEventListener('visibilitychange', vis);
      const lost = (e: Event) => { e.preventDefault(); stop(); canvas.style.opacity = '0'; };
      canvas.addEventListener('webglcontextlost', lost);

      draw(); // one still frame (all that reduced-motion users get)
      run();
      cleanup = () => {
        stop(); ro.disconnect(); io.disconnect(); document.removeEventListener('visibilitychange', vis); canvas.removeEventListener('webglcontextlost', lost);
        gl.deleteBuffer(buf); gl.deleteProgram(prog); gl.deleteShader(vs); gl.deleteShader(fs);
        gl.getExtension('WEBGL_lose_context')?.loseContext(); canvas.remove();
      };
    };

    // Start after the page is idle so the hero text paints first.
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void };
    const id = w.requestIdleCallback ? w.requestIdleCallback(start, { timeout: 1200 }) : window.setTimeout(start, 300);
    return () => { cancelled = true; if (w.cancelIdleCallback) w.cancelIdleCallback(id as number); else clearTimeout(id as number); cleanup(); };
  }, []);

  return <div ref={ref} aria-hidden="true" className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} style={{ background: AURORA_FALLBACK }} />;
}
