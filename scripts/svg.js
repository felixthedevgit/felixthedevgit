'use strict';

// Shared helpers for the renderers. There is no font to load: GitHub serves
// these files as plain images through its proxy and would not fetch a font
// anyway. So everything is set in the system stack below, and text widths
// can only be estimated. Every layout leaves room for that estimate being
// a little off.
const FONT = "'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif";

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const escape = (value) => String(value).replace(/[&<>"']/g, (c) => ESCAPES[c]);

// Rough glyph widths in em for the fonts above. Narrow letters and
// punctuation sit around 0.3 em, capitals and round letters around 0.6, the
// m and w family close to 0.9. Good enough to size a pill or place a cursor.
const NARROW = /[iljtfrI.,:;'!|() ]/;
const WIDE = /[mwMW@%]/;
const UPPER = /[A-ZÄÖÜ0-9]/;
const textWidth = (text, size, bold) => {
  let em = 0;
  for (const ch of String(text)) {
    if (NARROW.test(ch)) em += 0.3;
    else if (WIDE.test(ch)) em += 0.9;
    else if (UPPER.test(ch)) em += 0.66;
    else em += bold ? 0.6 : 0.56;
  }
  return Math.round(em * size);
};

const number = (n) => new Intl.NumberFormat('en-US').format(n);

// Mixes a hex colour towards another one, t = 0 keeps the first, t = 1 gives
// the second. The side faces of a block are its top colour mixed with the
// theme's shadow, so a new level colour needs no hand-picked shades.
const mix = (from, to, t) => {
  const a = from.match(/[0-9a-f]{2}/gi).map((h) => parseInt(h, 16));
  const b = to.match(/[0-9a-f]{2}/gi).map((h) => parseInt(h, 16));
  return `#${a.map((c, i) => Math.round(c + (b[i] - c) * t).toString(16).padStart(2, '0')).join('')}`;
};

// Holds an attribute at a start value until an animation takes over. The
// element itself carries its final value, so a renderer that ignores SMIL
// (or a screenshot taken before the timeline starts) shows the finished
// picture instead of an empty one.
const hold = (attribute, value, until) => `<set attributeName="${attribute}" to="${value}" begin="0s" end="${until}s"/>`;

// SMIL fade plus a small rise, used by every renderer for the "appears in
// order" feeling. Everything is SMIL rather than CSS so that a single
// mechanism carries all motion and a reader of the file finds it in place.
const appear = (begin, dur = 0.6) => [
  hold('opacity', 0, begin),
  `<animate attributeName="opacity" from="0" to="1" dur="${dur}s" begin="${begin}s" fill="freeze"/>`,
  `<animateTransform attributeName="transform" type="translate" from="0 8" to="0 0" dur="${dur}s" begin="${begin}s" fill="freeze" calcMode="spline" keyTimes="0;1" keySplines="0.2 0 0.2 1"/>`,
].join('\n');

// One document per graphic. The title doubles as a name for assistive
// technology that looks inside the image, the README carries alt text too.
const document = ({ width, height, title, body }) => [
  `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escape(title)}">`,
  `<title>${escape(title)}</title>`,
  body,
  '</svg>',
].join('\n') + '\n';

module.exports = { FONT, escape, textWidth, number, mix, hold, appear, document };
