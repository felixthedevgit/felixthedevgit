'use strict';

const { FONT, escape, textWidth, hold, appear, document } = require('../svg');

const W = 900;
const H = 220;
const LEFT = 48;
const HEADLINE_SIZE = 46;
const BASELINE = 100;

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
<text x="${LEFT}" y="${BASELINE}" font-size="${HEADLINE_SIZE}" font-weight="700" fill="${theme.ink}" textLength="${headlineWidth}" lengthAdjust="spacing">${escape(profile.greeting)}</text>
</g>
<rect x="${cursorEnd}" y="${BASELINE - HEADLINE_SIZE + 8}" width="3" height="${HEADLINE_SIZE}" rx="1.5" fill="${theme.accentStrong}">
${hold('x', LEFT, 0.4)}
<animate attributeName="x" from="${LEFT}" to="${cursorEnd}" ${wipe}/>
<animate attributeName="opacity" values="1;0" keyTimes="0;0.5" calcMode="discrete" dur="1.1s" begin="1.8s" repeatCount="indefinite"/>
</rect>
<g>
${appear(1.6, 0.7)}
<text x="${LEFT}" y="${BASELINE + 34}" font-size="18" fill="${theme.muted}">${escape(profile.tagline)}</text>
</g>
${chips}</g>`;

  return document({ width: W, height: H, title: `${profile.greeting} ${profile.tagline}`, body });
};

module.exports = { render };
