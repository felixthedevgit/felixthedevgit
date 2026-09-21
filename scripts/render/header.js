'use strict';

const { FONT, escape, textWidth, brandPalette, hold, appear, document } = require('../svg');
const { ICONS } = require('../icons');

const W = 900;
const H = 220;
const LEFT = 48;
const HEADLINE_SIZE = 46;
const BASELINE = 100;

// Where the floating logo discs sit on the right half, loosely scattered
// so they read as a cloud rather than a grid. profile.json decides which
// logos, the first slot takes the first entry.
const SLOTS = [
  { x: 640, y: 62, r: 24 },
  { x: 722, y: 40, r: 20 },
  { x: 806, y: 66, r: 26 },
  { x: 862, y: 138, r: 21 },
  { x: 776, y: 150, r: 24 },
  { x: 692, y: 168, r: 22 },
  { x: 612, y: 142, r: 18 },
];

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

// A logo on a pastel disc that bobs up and down. The shadow underneath
// stays put and fades while the disc is up, which is what sells the
// floating. Durations differ per disc so the cloud never moves in step.
const disc = (theme, slug, slot, i) => {
  const brand = ICONS[slug];
  if (!brand) return '';
  const pal = brandPalette(theme, brand.hex);
  const size = slot.r * 1.15;
  const dur = (4 + (i % 3) * 0.9).toFixed(1);
  const phase = (-(i * 0.7)).toFixed(1);
  const ease = 'calcMode="spline" keyTimes="0;0.5;1" keySplines="0.4 0 0.6 1;0.4 0 0.6 1"';
  return `<g>
${appear(0.5 + i * 0.12)}
<ellipse cx="${slot.x}" cy="${slot.y + slot.r + 9}" rx="${(slot.r * 0.75).toFixed(1)}" ry="4" fill="${theme.shadow}" opacity="0.14">
<animate attributeName="opacity" values="0.14;0.05;0.14" dur="${dur}s" begin="${phase}s" repeatCount="indefinite" ${ease}/>
</ellipse>
<g>
<animateTransform attributeName="transform" type="translate" values="0 0;0 -7;0 0" dur="${dur}s" begin="${phase}s" repeatCount="indefinite" ${ease}/>
<circle cx="${slot.x}" cy="${slot.y}" r="${slot.r}" fill="${pal.key}" stroke="${theme.chipEdge}" stroke-width="2"/>
<g transform="translate(${(slot.x - size / 2).toFixed(1)} ${(slot.y - size / 2).toFixed(1)}) scale(${(size / 24).toFixed(4)})"><path d="${brand.path}" fill="${pal.ink}"/></g>
</g>
</g>`;
};

// A hand-drawn wave under the last word of the greeting, drawn after the
// headline has finished wiping in. The x positions come from the same
// width estimate that textLength pins the headline to, so they line up.
const underline = (theme, greeting) => {
  const words = greeting.trim().split(/\s+/);
  const last = words[words.length - 1].replace(/[.!?,]+$/, '');
  const prefix = words.length > 1 ? `${words.slice(0, -1).join(' ')} ` : '';
  const start = LEFT + textWidth(prefix, HEADLINE_SIZE, true);
  const width = textWidth(last, HEADLINE_SIZE, true);
  const y = BASELINE + 11;
  let d = `M${start} ${y}`;
  const step = 14;
  const steps = Math.max(2, Math.round(width / step));
  const dx = width / steps;
  for (let k = 0; k < steps; k += 1) d += ` q${(dx / 2).toFixed(1)} ${k % 2 ? 5 : -5} ${dx.toFixed(1)} 0`;
  return `<path d="${d}" fill="none" stroke="${theme.pink}" stroke-width="3" stroke-linecap="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="0">
${hold('stroke-dashoffset', 1, 1.9)}
<animate attributeName="stroke-dashoffset" from="1" to="0" dur="0.6s" begin="1.9s" fill="freeze" calcMode="spline" keyTimes="0;1" keySplines="0.3 0 0.2 1"/>
</path>`;
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
  const discs = (profile.hero || []).slice(0, SLOTS.length).map((slug, i) => disc(theme, slug, SLOTS[i], i)).join('\n');

  const body = `<defs>
<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
<stop offset="0" stop-color="${g0}"><animate attributeName="stop-color" values="${g0};${g1};${g0}" dur="14s" repeatCount="indefinite"/></stop>
<stop offset="0.55" stop-color="${g1}"><animate attributeName="stop-color" values="${g1};${g2};${g1}" dur="14s" repeatCount="indefinite"/></stop>
<stop offset="1" stop-color="${g2}"><animate attributeName="stop-color" values="${g2};${g0};${g2}" dur="14s" repeatCount="indefinite"/></stop>
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
<text x="${LEFT}" y="${BASELINE}" font-size="${HEADLINE_SIZE}" font-weight="700" fill="${theme.ink}" textLength="${headlineWidth}" lengthAdjust="spacing">${escape(profile.greeting)}</text>
</g>
${underline(theme, profile.greeting)}
<rect x="${cursorEnd}" y="${BASELINE - HEADLINE_SIZE + 8}" width="3" height="${HEADLINE_SIZE}" rx="1.5" fill="${theme.accentStrong}">
${hold('x', LEFT, 0.4)}
<animate attributeName="x" from="${LEFT}" to="${cursorEnd}" ${wipe}/>
<animate attributeName="opacity" values="1;0" keyTimes="0;0.5" calcMode="discrete" dur="1.1s" begin="1.8s" repeatCount="indefinite"/>
</rect>
<g>
${appear(1.6, 0.7)}
<text x="${LEFT}" y="${BASELINE + 36}" font-size="18" fill="${theme.muted}">${escape(profile.tagline)}</text>
</g>
${chips}${discs}
</g>`;

  return document({ width: W, height: H, title: `${profile.greeting} ${profile.tagline}`, body });
};

module.exports = { render };
