'use strict';

// The fonts every graphic carries inside itself. GitHub shows README images
// through <img>, and an SVG in an <img> may not fetch anything, not even a
// font. So the few weights a graphic uses are embedded as base64, cut down
// to the characters in scripts/make-fonts.js (about 8 KB per weight).
//
// Because the exact font is known, text can be measured exactly: the
// widths and kerning pairs in fonts/metrics.json come from the same files.

const fs = require('node:fs');
const path = require('node:path');

const DIR = path.join(__dirname, '..', 'fonts');
const METRICS = JSON.parse(fs.readFileSync(path.join(DIR, 'metrics.json'), 'utf8'));

// Ids as in fonts/metrics.json: nunito-700, nunito-800, nunito-900,
// mono-500, mono-700.
const face = (id) => {
  const m = METRICS[id];
  if (!m) throw new Error(`Unknown font ${id}.`);
  return m;
};

// Width of a line of text in pixels. A character the subset lacks would
// fall back to a system font and break every measurement, so it stops the
// build with a hint instead of drawing something slightly off.
const measure = (text, id, size, letterSpacing = 0) => {
  const m = face(id);
  const chars = Array.from(String(text));
  let units = 0;
  chars.forEach((c, i) => {
    const adv = m.advances[c];
    if (adv === undefined) {
      throw new Error(`The font ${id} has no "${c}" (in "${text}"). Add it to CHARS in scripts/make-fonts.js and run that script.`);
    }
    units += adv;
    if (i > 0) units += m.kern[chars[i - 1] + c] || 0;
  });
  return (units / m.upem) * size + letterSpacing * chars.length;
};

// Baseline for text that should sit optically centred in a box from top
// to top + height: the capital letters are centred, which is what a reader
// sees as "in the middle" for both upper and lower case.
const baseline = (id, size, top, height) => {
  const m = face(id);
  return top + height / 2 + ((m.capHeight / m.upem) * size) / 2;
};

const cache = new Map();
const fontFace = (id) => {
  if (!cache.has(id)) {
    const m = face(id);
    const data = fs.readFileSync(path.join(DIR, m.file)).toString('base64');
    cache.set(id, `@font-face{font-family:'${m.family}';font-weight:${m.weight};font-style:normal;src:url(data:font/woff2;base64,${data}) format('woff2')}`);
  }
  return cache.get(id);
};

// The family name plus a fallback, for the font-family attribute.
const FAMILY = {
  nunito: "Nunito, 'Segoe UI', Helvetica, Arial, sans-serif",
  mono: "'JetBrains Mono', Consolas, Menlo, monospace",
};

// Shorthand for the attributes of a <text> in one of the embedded faces.
const font = (id, size, extra = '') => {
  const m = face(id);
  const family = m.family === 'Nunito' ? FAMILY.nunito : FAMILY.mono;
  return `font-family="${family}" font-weight="${m.weight}" font-size="${size}"${extra ? ` ${extra}` : ''}`;
};

module.exports = { measure, baseline, fontFace, font, face };
