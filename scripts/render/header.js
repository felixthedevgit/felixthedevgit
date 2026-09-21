'use strict';

const { FONT, escape, textWidth, mix, brandPalette, hold, appear, document } = require('../svg');
const { ICONS } = require('../icons');

const W = 900;
const H = 220;
const LEFT = 48;
const HEADLINE_SIZE = 46;
const BASELINE = 100;

// The block cluster on the right uses a true isometric projection, the
// same idea as the contribution landscape further down, only larger: one
// edge of a block is EDGE long, a step along u goes right and down, a
// step along v goes left and down.
const EDGE = 44;
const U = { x: EDGE * Math.cos(Math.PI / 6), y: EDGE * Math.sin(Math.PI / 6) };
const V = { x: -U.x, y: U.y };
const ORIGIN = { x: 745, y: 66 };
// Seven cells in a loose cluster, back row first.
const CELLS = [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1], [1, 2]];

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

const point = (u, v, h) => [
  Number((ORIGIN.x + u * U.x + v * V.x).toFixed(1)),
  Number((ORIGIN.y + u * U.y + v * V.y - h).toFixed(1)),
];
const poly = (points) => points.map((p) => p.join(',')).join(' ');

// One block: top face with the logo lying on it, two visible sides in
// shadow. The logo is mapped onto the top face with a matrix whose axes
// are the face's own edges, so it sits in perspective like a print on a
// box rather than floating flat in front of it. Each block drops in from
// above when the header loads, and its top catches the passing light.
const block = (theme, slug, level, [u, v], i) => {
  const brand = ICONS[slug];
  const pal = brandPalette(theme, brand ? brand.hex : theme.accentStrong);
  const h = 16 + level * 5;
  const top = pal.key;
  const right = mix(top, theme.shadow, 0.16);
  const left = mix(top, theme.shadow, 0.32);
  const begin = (0.6 + (u + v) * 0.18 + (i % 2) * 0.05).toFixed(2);
  const inset = 0.19;
  const k = (1 - 2 * inset) / 24;
  const [ox, oy] = point(u, v, h);
  const logo = brand
    ? `<path d="${brand.path}" fill="${pal.ink}" transform="matrix(${(U.x * k).toFixed(4)} ${(U.y * k).toFixed(4)} ${(V.x * k).toFixed(4)} ${(V.y * k).toFixed(4)} ${(ox + inset * (U.x + V.x)).toFixed(1)} ${(oy + inset * (U.y + V.y)).toFixed(1)})"/>`
    : '';
  return `<g>
${hold('opacity', 0, begin)}
<animate attributeName="opacity" from="0" to="1" dur="0.5s" begin="${begin}s" fill="freeze"/>
<animateTransform attributeName="transform" type="translate" from="0 -46" to="0 0" dur="0.7s" begin="${begin}s" fill="freeze" calcMode="spline" keyTimes="0;1" keySplines="0.2 0.9 0.3 1.1"/>
<polygon points="${poly([point(u + 1, v, h), point(u + 1, v + 1, h), point(u + 1, v + 1, 0), point(u + 1, v, 0)])}" fill="${right}"/>
<polygon points="${poly([point(u, v + 1, h), point(u + 1, v + 1, h), point(u + 1, v + 1, 0), point(u, v + 1, 0)])}" fill="${left}"/>
<polygon points="${poly([point(u, v, h), point(u + 1, v, h), point(u + 1, v + 1, h), point(u, v + 1, h)])}" fill="${top}" stroke="${theme.chipEdge}" stroke-width="1">
<animate attributeName="fill" values="${top};${mix(top, theme.sweep, 0.55)};${top};${top}" keyTimes="0;0.05;0.12;1" dur="9s" begin="${(3 + (u + v) * 0.3).toFixed(2)}s" repeatCount="indefinite"/>
</polygon>
${logo}
</g>`;
};

// The cluster as a whole floats above its shadow. Blocks are drawn back
// to front so the ones in front cover the ones behind.
const cluster = (theme, profile) => {
  const slugs = (profile.hero || []).slice(0, CELLS.length);
  const levelOf = (slug) => {
    const skill = (profile.skills || []).find((s) => s.icon === slug);
    return Math.min(5, Math.max(1, Number(skill && skill.level) || 3));
  };
  const blocks = slugs
    .map((slug, i) => ({ slug, i, cell: CELLS[i] }))
    .sort((a, b) => (a.cell[0] + a.cell[1]) - (b.cell[0] + b.cell[1]))
    .map(({ slug, i, cell }) => block(theme, slug, levelOf(slug), cell, i))
    .join('\n');
  const [sx, sy] = point(1.5, 1.5, 0);
  const ease = 'calcMode="spline" keyTimes="0;0.5;1" keySplines="0.4 0 0.6 1;0.4 0 0.6 1"';
  return `<ellipse cx="${sx}" cy="${sy + 2 * U.y + 14}" rx="${(2.6 * U.x).toFixed(1)}" ry="11" fill="${theme.shadow}" opacity="0.13">
<animate attributeName="opacity" values="0.13;0.06;0.13" dur="6s" repeatCount="indefinite" ${ease}/>
<animate attributeName="rx" values="${(2.6 * U.x).toFixed(1)};${(2.3 * U.x).toFixed(1)};${(2.6 * U.x).toFixed(1)}" dur="6s" repeatCount="indefinite" ${ease}/>
</ellipse>
<g>
<animateTransform attributeName="transform" type="translate" values="0 0;0 -6;0 0" dur="6s" repeatCount="indefinite" ${ease}/>
${blocks}
</g>`;
};

// The greeting in two pieces: everything up to the last word stands
// still, the last word (the name) floats up and down by a few pixels,
// slowly enough to be felt rather than seen. Both pieces are pinned with
// textLength so the cursor still ends exactly where the text does. The
// prefix is measured without its trailing space, which SVG drops when
// rendering: counting it would stretch the letters right up to the name.
const headline = (theme, greeting, headlineWidth) => {
  const words = greeting.trim().split(/\s+/);
  const last = words[words.length - 1];
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
${chips}${cluster(theme, profile)}
</g>`;

  return document({ width: W, height: H, title: `${profile.greeting} ${profile.tagline}`, body });
};

module.exports = { render };
