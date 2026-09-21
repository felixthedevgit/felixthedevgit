'use strict';

const { FONT, escape, textWidth, brandPalette, hold, appear, document } = require('../svg');
const { ICONS } = require('../icons');

const W = 900;
const H = 220;
const LEFT = 48;
const HEADLINE_SIZE = 46;
const BASELINE = 100;

// The little planet on the right and the orbit its moons travel on. The
// orbit is a flat ellipse seen from slightly above, which is where the
// depth comes from: a moon at the top is far away, one at the bottom is
// close and passes in front of the planet.
const ORBIT = { cx: 745, cy: 106, rx: 122, ry: 44, period: 14 };
const PLANET_R = 34;
const MOON_R = 19;

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

// The orbit as a path that starts on the left, runs over the top (the far
// side) to the right and returns along the bottom (the near side).
const orbitPath = () => {
  const { cx, cy, rx, ry } = ORBIT;
  return `M${cx - rx} ${cy} A${rx} ${ry} 0 0 1 ${cx + rx} ${cy} A${rx} ${ry} 0 0 1 ${cx - rx} ${cy}`;
};
const orbitHalf = (near) => {
  const { cx, cy, rx, ry } = ORBIT;
  return near
    ? `M${cx + rx} ${cy} A${rx} ${ry} 0 0 1 ${cx - rx} ${cy}`
    : `M${cx - rx} ${cy} A${rx} ${ry} 0 0 1 ${cx + rx} ${cy}`;
};

// One moon, drawn twice: a copy for the far half of the orbit that sits
// behind the planet and a copy for the near half that sits in front. Each
// copy is only visible during its half, and the switch happens at the
// sides where both copies share the same spot, so nothing pops. Size and
// opacity follow the depth: small and faint at the back, large in front.
const moon = (theme, slug, i, count, near) => {
  const brand = ICONS[slug];
  if (!brand) return '';
  const pal = brandPalette(theme, brand.hex);
  const size = MOON_R * 1.15;
  const timing = `dur="${ORBIT.period}s" begin="${(-(i / count) * ORBIT.period).toFixed(2)}s" repeatCount="indefinite"`;
  return `<g visibility="${near ? 'visible' : 'hidden'}">
<animate attributeName="visibility" values="${near ? 'hidden;visible' : 'visible;hidden'}" keyTimes="0;0.5" calcMode="discrete" ${timing}/>
<animateMotion path="${orbitPath()}" ${timing}/>
<animateTransform attributeName="transform" type="scale" values="0.85;0.66;0.85;1.12;0.85" keyTimes="0;0.25;0.5;0.75;1" ${timing}/>
<animate attributeName="opacity" values="0.9;0.65;0.9;1;0.9" keyTimes="0;0.25;0.5;0.75;1" ${timing}/>
<circle r="${MOON_R}" fill="${pal.key}" stroke="${theme.chipEdge}" stroke-width="2"/>
<g transform="translate(${(-size / 2).toFixed(1)} ${(-size / 2).toFixed(1)}) scale(${(size / 24).toFixed(4)})"><path d="${brand.path}" fill="${pal.ink}"/></g>
</g>`;
};

// Planet, ring and moons. The ring is split into its far and near half
// for the same reason as the moons.
const system = (theme, slugs) => {
  const { cx, cy } = ORBIT;
  const list = slugs.slice(0, 8);
  const ring = (near) => `<path d="${orbitHalf(near)}" fill="none" stroke="${theme.chipEdge}" stroke-width="1.5" stroke-dasharray="3 6" stroke-linecap="round"/>`;
  return `<g>
${appear(0.9, 0.8)}
${ring(false)}
${list.map((slug, i) => moon(theme, slug, i, list.length, false)).join('\n')}
<ellipse cx="${cx}" cy="${cy + PLANET_R + 12}" rx="${PLANET_R * 0.8}" ry="5" fill="${theme.shadow}" opacity="0.14">
<animate attributeName="opacity" values="0.14;0.07;0.14" dur="5s" repeatCount="indefinite" calcMode="spline" keyTimes="0;0.5;1" keySplines="0.4 0 0.6 1;0.4 0 0.6 1"/>
</ellipse>
<g>
<animateTransform attributeName="transform" type="translate" values="0 0;0 -5;0 0" dur="5s" repeatCount="indefinite" calcMode="spline" keyTimes="0;0.5;1" keySplines="0.4 0 0.6 1;0.4 0 0.6 1"/>
<circle cx="${cx}" cy="${cy}" r="${PLANET_R}" fill="url(#planet)"/>
<ellipse cx="${cx - 10}" cy="${cy - 14}" rx="9" ry="5" fill="#FFFFFF" opacity="0.55" transform="rotate(-25 ${cx - 10} ${cy - 14})"/>
</g>
${ring(true)}
${list.map((slug, i) => moon(theme, slug, i, list.length, true)).join('\n')}
</g>`;
};

// A marker stroke under the last word of the greeting, drawn by hand:
// two slightly wobbly lines, the second shorter and a little lower, with
// an offset shadow copy underneath for a bit of depth. They draw
// themselves once the headline has finished wiping in. The x positions
// come from the same width estimate that textLength pins the headline to.
const scribble = (theme, greeting) => {
  const words = greeting.trim().split(/\s+/);
  const last = words[words.length - 1].replace(/[.!?,]+$/, '');
  const prefix = words.length > 1 ? `${words.slice(0, -1).join(' ')} ` : '';
  const x = LEFT + textWidth(prefix, HEADLINE_SIZE, true);
  const w = textWidth(last, HEADLINE_SIZE, true);
  const y = BASELINE + 10;
  const at = (f, dy) => `${(x + w * f).toFixed(1)} ${y + dy}`;
  const first = `M${at(0, 0)} C${at(0.2, -4)} ${at(0.35, 4)} ${at(0.5, 1)} S${at(0.85, -3)} ${at(1, 2)}`;
  const second = `M${at(0.12, 8)} C${at(0.4, 5)} ${at(0.6, 11)} ${at(0.86, 7)}`;
  const stroke = (d, color, width, begin, dur, extra) => `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" pathLength="1" stroke-dasharray="1"${extra}>
${hold('stroke-dashoffset', 1, begin)}
<animate attributeName="stroke-dashoffset" from="1" to="0" dur="${dur}s" begin="${begin}s" fill="freeze" calcMode="spline" keyTimes="0;1" keySplines="0.3 0 0.2 1"/>
</path>`;
  const shadow = ` opacity="0.22" transform="translate(2.5 2.5)"`;
  return [
    stroke(first, theme.shadow, 4.5, 1.9, 0.45, shadow),
    stroke(second, theme.shadow, 3.5, 2.4, 0.3, shadow),
    stroke(first, theme.pink, 4.5, 1.9, 0.45, ''),
    stroke(second, theme.pink, 3.5, 2.4, 0.3, ''),
  ].join('\n');
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
<radialGradient id="planet" cx="0.35" cy="0.3" r="0.85">
<stop offset="0" stop-color="#FFFFFF" stop-opacity="0.95"/>
<stop offset="0.3" stop-color="${theme.accent}"/>
<stop offset="1" stop-color="${theme.accentStrong}"/>
</radialGradient>
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
${scribble(theme, profile.greeting)}
<rect x="${cursorEnd}" y="${BASELINE - HEADLINE_SIZE + 8}" width="3" height="${HEADLINE_SIZE}" rx="1.5" fill="${theme.accentStrong}">
${hold('x', LEFT, 0.4)}
<animate attributeName="x" from="${LEFT}" to="${cursorEnd}" ${wipe}/>
<animate attributeName="opacity" values="1;0" keyTimes="0;0.5" calcMode="discrete" dur="1.1s" begin="1.8s" repeatCount="indefinite"/>
</rect>
<g>
${appear(1.6, 0.7)}
<text x="${LEFT}" y="${BASELINE + 38}" font-size="18" fill="${theme.muted}">${escape(profile.tagline)}</text>
</g>
${chips}${system(theme, profile.hero || [])}
</g>`;

  return document({ width: W, height: H, title: `${profile.greeting} ${profile.tagline}`, body });
};

module.exports = { render };
