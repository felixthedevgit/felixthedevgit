'use strict';

// Shared helpers for the renderers: escaping, the document frame with its
// embedded fonts, and the three shapes the Pastell look is built from.

const { fontFace } = require('./fonts');

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const escape = (value) => String(value).replace(/[&<>"']/g, (c) => ESCAPES[c]);

const number = (n) => new Intl.NumberFormat('en-US').format(n);
const r1 = (n) => Math.round(n * 10) / 10;

// A key: a flat face with its darker edge showing below it, like the
// buttons on the website. depth is how far the edge sticks out.
const key = ({ x, y, w, h, r, fill, edge, depth = 4, extra = '' }) => `<rect x="${r1(x)}" y="${r1(y + depth)}" width="${r1(w)}" height="${r1(h)}" rx="${r}" fill="${edge}"/>
<rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" rx="${r}" fill="${fill}"${extra ? ` ${extra}` : ''}/>`;

// A pill or tile whose edge sits inside its own outline, at the bottom.
const inset = ({ x, y, w, h, r, fill, edge, depth = 3 }) => `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" rx="${r}" fill="${edge}"/>
<rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h - depth)}" rx="${r}" fill="${fill}"/>`;

// A card: a thin outline all around and a thicker one at the bottom.
const frame = ({ x = 0, y = 0, w, h, r, fill, line, border = 2, bottom = 5 }) => `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" rx="${r}" fill="${line}"/>
<rect x="${r1(x + border)}" y="${r1(y + border)}" width="${r1(w - 2 * border)}" height="${r1(h - border - bottom)}" rx="${r - border}" fill="${fill}"/>`;

// Motion lives in CSS inside each file, which runs in an <img> without any
// script. Every animated element carries its finished state as its normal
// style, so with "reduce motion" switched on in the system, or in a viewer
// without animation, the picture is complete and simply stands still.
const REDUCED = '@media (prefers-reduced-motion: reduce){*{animation:none!important}}';

// One document per graphic. The title doubles as a name for assistive
// technology that looks inside the image, the README carries alt text too.
const document = ({ width, height, title, fonts = [], css = '', body }) => [
  `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escape(title)}">`,
  `<title>${escape(title)}</title>`,
  `<style>${fonts.map(fontFace).join('')}${css}${css ? REDUCED : ''}</style>`,
  body,
  '</svg>',
].join('\n') + '\n';

module.exports = { escape, number, r1, key, inset, frame, document };
