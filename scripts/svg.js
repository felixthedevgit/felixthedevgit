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

// Rough relative luminance, enough to tell a yellow from a navy.
const luminance = (hex) => {
  const [r, g, b] = hex.match(/[0-9a-f]{2}/gi).map((h) => parseInt(h, 16));
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
};

// A brand colour turned into the handful of pastel shades a row, a pill or
// a key needs, per theme. Black brands (Roblox, TikTok, Express) would only
// turn grey, they get the theme's neutral instead. Light brands such as the
// JavaScript yellow are darkened for the icon in light mode, or the logo
// would drown in its own pastel.
const brandPalette = (theme, hex) => {
  let brand = hex.startsWith('#') ? hex.toUpperCase() : `#${hex.toUpperCase()}`;
  if (luminance(brand) < 0.12) brand = theme.neutral;
  const light = theme.name === 'light';
  let ink = brand;
  if (light && luminance(brand) > 0.55) ink = mix(brand, theme.shadow, 0.4);
  if (!light) ink = mix(brand, '#FFFFFF', luminance(brand) < 0.3 ? 0.45 : 0.2);
  return {
    brand,
    ink,
    key: mix(brand, theme.paper, light ? 0.74 : 0.68),
    side: mix(brand, theme.shadow, light ? 0.3 : 0.5),
    card: mix(brand, theme.paper, light ? 0.9 : 0.86),
    edge: mix(brand, theme.paper, light ? 0.76 : 0.68),
    track: mix(brand, theme.paper, light ? 0.8 : 0.72),
  };
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

module.exports = { FONT, escape, textWidth, number, mix, luminance, brandPalette, hold, appear, document };
