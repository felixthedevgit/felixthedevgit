'use strict';

const { FONT, escape, textWidth, brandPalette, hold, appear, document } = require('../svg');
const { ICONS } = require('../icons');

const W = 900;
const H = 220;
const LEFT = 48;
const HEADLINE_SIZE = 46;
const BASELINE = 100;

// The infinity loop on the right: centre, half width, and how long one
// lap of a logo takes. The height follows from the shape itself.
const LOOP = { cx: 745, cy: 108, a: 126, period: 16 };
const MOON_R = 18;

// Small rounded labels in the lower left. Their width comes from the text
// estimate plus generous padding, so a slightly wider font still fits.
const chip = (theme, text, x, y, begin) => {
  const width = textWidth(text, 13, true) + 30;
  const svg = `<g>
${appear(begin)}
<rect x="${x}" y="${y}" width="${width}" height="28" rx="14" fill="${theme.chipFill}" stroke="${theme.chipEdge}"/>
<text x="${x + width / 2}" y="${y + 18.5}" font-size="13" font-weight="600" fill="${theme.ink}" text-anchor="middle">${escape(text)}</text>
</g>`;
  return { width, svg };
};

// A soft spot of colour that drifts back and forth behind the text. Three
// of them give the pastel gradient some life without a pattern that could
// compete with the headline. The softness comes from a radial gradient,
// not from a blur filter: filters are rasterised in a bounded region and
// showed a hard edge near the corner of the card.
const blob = (id, cx, cy, r, drift, dur) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${id})">
<animateTransform attributeName="transform" type="translate" values="0 0;${drift};0 0" dur="${dur}s" repeatCount="indefinite" calcMode="spline" keyTimes="0;0.5;1" keySplines="0.4 0 0.6 1;0.4 0 0.6 1"/>
</circle>`;

const glow = (id, color) => `<radialGradient id="${id}">
<stop offset="0" stop-color="${color}" stop-opacity="0.9"/>
<stop offset="0.45" stop-color="${color}" stop-opacity="0.45"/>
<stop offset="1" stop-color="${color}" stop-opacity="0"/>
</radialGradient>`;

// A lemniscate sampled into points and joined with Catmull-Rom curves, so
// the loop is one smooth closed path that animateMotion can follow.
const loopPath = () => {
  const steps = 48;
  const pts = [];
  for (let k = 0; k < steps; k += 1) {
    const t = (k / steps) * 2 * Math.PI;
    const d = 1 + Math.sin(t) ** 2;
    pts.push([LOOP.cx + (LOOP.a * Math.cos(t)) / d, LOOP.cy + (LOOP.a * Math.sin(t) * Math.cos(t)) / d]);
  }
  const f = (n) => n.toFixed(1);
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < steps; i += 1) {
    const p0 = pts[(i - 1 + steps) % steps];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % steps];
    const p3 = pts[(i + 2) % steps];
    d += ` C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`;
  }
  return `${d} Z`;
};

// One logo on a pastel disc travelling along the loop. The discs are
// spread evenly in time, so they never bunch up, and each breathes a
// little at its own pace.
const moon = (theme, slug, i, count, path) => {
  const brand = ICONS[slug];
  if (!brand) return '';
  const pal = brandPalette(theme, brand.hex);
  const size = MOON_R * 1.15;
  return `<g>
<animateMotion path="${path}" dur="${LOOP.period}s" begin="${(-(i / count) * LOOP.period).toFixed(2)}s" repeatCount="indefinite"/>
<animateTransform attributeName="transform" type="scale" values="1;1.1;1" dur="${(3 + (i % 3) * 0.7).toFixed(1)}s" begin="${(-i * 0.5).toFixed(1)}s" repeatCount="indefinite" calcMode="spline" keyTimes="0;0.5;1" keySplines="0.4 0 0.6 1;0.4 0 0.6 1"/>
<circle r="${MOON_R}" fill="${pal.key}" stroke="${theme.chipEdge}" stroke-width="2"/>
<g transform="translate(${(-size / 2).toFixed(1)} ${(-size / 2).toFixed(1)}) scale(${(size / 24).toFixed(4)})"><path d="${brand.path}" fill="${pal.ink}"/></g>
</g>`;
};

// The loop: a faint solid track, on it a gradient dash that keeps flowing,
// and the logos riding along. Everything fades in together after the
// headline has settled.
const loop = (theme, slugs) => {
  const path = loopPath();
  const list = slugs.slice(0, 8);
  return `<g>
${appear(0.9, 0.8)}
<path d="${path}" fill="none" stroke="${theme.chipEdge}" stroke-width="5" stroke-linecap="round"/>
<path d="${path}" fill="none" stroke="url(#flow)" stroke-width="3.5" stroke-linecap="round" stroke-dasharray="14 10">
<animate attributeName="stroke-dashoffset" from="0" to="-48" dur="1.8s" repeatCount="indefinite"/>
</path>
${list.map((slug, i) => moon(theme, slug, i, list.length, path)).join('\n')}
</g>`;
};

// The greeting in two pieces: everything up to the last word stands
// still, the last word (the name) floats up and down by a few pixels,
// slowly enough to be felt rather than seen. Both pieces are pinned with
// textLength so the cursor still ends exactly where the text does.
const headline = (theme, greeting, headlineWidth) => {
  const words = greeting.trim().split(/\s+/);
  const last = words[words.length - 1];
  // The prefix is measured without its trailing space: SVG drops that
  // space when rendering, and a textLength that still counted it would
  // stretch the letters right up to the name.
  const prefix = words.slice(0, -1).join(' ');
  const prefixWidth = prefix ? textWidth(prefix, HEADLINE_SIZE, true) : 0;
  const gap = prefix ? textWidth(' ', HEADLINE_SIZE, true) : 0;
  const attrs = `y="${BASELINE}" font-size="${HEADLINE_SIZE}" font-weight="700" fill="${theme.ink}" lengthAdjust="spacing"`;
  const name = `<g>
<animateTransform attributeName="transform" type="translate" values="0 0;0 -2.5;0 0" dur="4.5s" repeatCount="indefinite" calcMode="spline" keyTimes="0;0.5;1" keySplines="0.4 0 0.6 1;0.4 0 0.6 1"/>
<text x="${LEFT + prefixWidth + gap}" ${attrs} textLength="${headlineWidth - prefixWidth - gap}">${escape(last)}</text>
</g>`;
  if (!prefix) return name;
  return `<text x="${LEFT}" ${attrs} textLength="${prefixWidth}">${escape(prefix)}</text>
${name}`;
};

const render = (theme, profile) => {
  const [g0, g1, g2] = theme.gradient;
  // textLength pins the headline to the estimated width so that the cursor
  // ends exactly where the text ends. lengthAdjust="spacing" keeps the
  // glyph shapes and only nudges the spacing if the estimate is off.
  const headlineWidth = textWidth(profile.greeting, HEADLINE_SIZE, true);
  const cursorEnd = LEFT + headlineWidth + 4;
  const wipe = 'dur="1.4s" begin="0.4s" fill="freeze" calcMode="spline" keyTimes="0;1" keySplines="0.3 0 0.2 1"';

  let chips = '';
  let x = LEFT;
  (profile.chips || []).forEach((text, i) => {
    const c = chip(theme, text, x, 160, 1.9 + i * 0.15);
    chips += `${c.svg}\n`;
    x += c.width + 10;
  });

  const body = `<defs>
<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
<stop offset="0" stop-color="${g0}"><animate attributeName="stop-color" values="${g0};${g1};${g0}" dur="14s" repeatCount="indefinite"/></stop>
<stop offset="0.55" stop-color="${g1}"><animate attributeName="stop-color" values="${g1};${g2};${g1}" dur="14s" repeatCount="indefinite"/></stop>
<stop offset="1" stop-color="${g2}"><animate attributeName="stop-color" values="${g2};${g0};${g2}" dur="14s" repeatCount="indefinite"/></stop>
</linearGradient>
<linearGradient id="flow" x1="0" y1="0" x2="1" y2="0">
<stop offset="0" stop-color="${theme.accentStrong}"/>
<stop offset="1" stop-color="${theme.pink}"/>
</linearGradient>
${glow('glow-pink', theme.pink)}
${glow('glow-accent', theme.accent)}
${glow('glow-blob', theme.blob)}
<clipPath id="frame"><rect width="${W}" height="${H}" rx="24"/></clipPath>
<clipPath id="wipe"><rect x="${LEFT - 4}" y="${BASELINE - HEADLINE_SIZE}" width="${headlineWidth + 10}" height="${HEADLINE_SIZE + 20}">${hold('width', 0, 0.4)}<animate attributeName="width" from="0" to="${headlineWidth + 10}" ${wipe}/></rect></clipPath>
</defs>
<rect width="${W}" height="${H}" rx="24" fill="url(#bg)"/>
<g clip-path="url(#frame)" opacity="${theme.blobOpacity}">
${blob('glow-pink', 700, 30, 190, '-50 40', 16)}
${blob('glow-accent', 850, 210, 200, '-30 -50', 19)}
${blob('glow-blob', 140, 250, 170, '40 -30', 21)}
</g>
<g font-family="${FONT}">
<g clip-path="url(#wipe)">
${headline(theme, profile.greeting, headlineWidth)}
</g>
<rect x="${cursorEnd}" y="${BASELINE - HEADLINE_SIZE + 8}" width="3" height="${HEADLINE_SIZE}" rx="1.5" fill="${theme.accentStrong}">
${hold('x', LEFT, 0.4)}
<animate attributeName="x" from="${LEFT}" to="${cursorEnd}" ${wipe}/>
<animate attributeName="opacity" values="1;0" keyTimes="0;0.5" calcMode="discrete" dur="1.1s" begin="1.8s" repeatCount="indefinite"/>
</rect>
<g>
${appear(1.6, 0.7)}
<text x="${LEFT}" y="${BASELINE + 38}" font-size="18" fill="${theme.muted}">${escape(profile.tagline)}</text>
</g>
${chips}${loop(theme, profile.hero || [])}
</g>`;

  return document({ width: W, height: H, title: `${profile.greeting} ${profile.tagline}`, body });
};

module.exports = { render };
