'use strict';

// Two rows of rounded labels: the pastel pills under "What I build" and the
// outlined chips of the toolbox.
//
// A row is cut into a few short images instead of one long one. On a
// desktop they sit next to each other and read as one row; on a phone they
// wrap like words instead of shrinking the whole row until the labels are
// too small to read.

const { escape, r1, inset, frame } = require('../svg');
const { measure, baseline, font } = require('../fonts');

// Widest piece, a bit narrower than the README column on a phone.
const CHUNK = 300;
const GAP = 8;
// Transparent room right of and below each piece. With the space between
// two images in the README that makes about the same 8 px gap.
const AFTER_X = 4;
const AFTER_Y = 8;
const ID = 'nunito-900';
const SIZE = 14;

const POP = '.pop{animation:pop .5s cubic-bezier(.3,1.4,.5,1) both}@keyframes pop{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}';

// Splits widths into consecutive groups no wider than CHUNK.
const chunk = (widths) => {
  const groups = [];
  let current = [];
  let width = 0;
  widths.forEach((w, i) => {
    const next = current.length ? width + GAP + w : w;
    if (current.length && next > CHUNK) {
      groups.push(current);
      current = [];
      width = w;
    } else {
      width = next;
    }
    current.push(i);
  });
  if (current.length) groups.push(current);
  return groups;
};

// Draws a row as pieces. item(i, x) returns the SVG of label i at x. Each
// piece names its own labels in its alt text, so a screen reader reads the
// whole row once, piece by piece.
const pieces = (widths, height, names, item) => chunk(widths).map((group) => {
  let x = 0;
  const body = group.map((i, k) => {
    const svg = `<g class="pop" style="animation-delay:${(0.05 + i * 0.06).toFixed(2)}s">\n${item(i, x)}\n</g>`;
    x += widths[i] + (k < group.length - 1 ? GAP : 0);
    return svg;
  }).join('\n');
  const alt = group.map((i) => names[i]).join(', ');
  return { svg: { width: Math.ceil(x) + AFTER_X, height: height + AFTER_Y, title: alt, fonts: [ID], css: POP, body }, alt };
});

// "What I build": padding 6 by 14, the edge 3 px inside the bottom.
const build = (theme, items) => {
  const h = 33;
  const names = items.map((item) => item.label);
  const widths = names.map((label) => measure(label, ID, SIZE) + 28);
  return pieces(widths, h, names, (i, x) => {
    const tint = theme.tints[items[i].tint];
    if (!tint) throw new Error(`Unknown tint "${items[i].tint}" in profile.json.`);
    return `${inset({ x, y: 0, w: widths[i], h, r: h / 2, fill: tint.bg, edge: tint.edge, depth: 3 })}
<text x="${r1(x + widths[i] / 2)}" y="${r1(baseline(ID, SIZE, 0, h))}" ${font(ID, SIZE)} fill="${tint.ink}" text-anchor="middle">${escape(names[i])}</text>`;
  });
};

// Toolbox: plain chips with a 2 px outline, padding 5 by 12.
const toolbox = (theme, items) => {
  const c = theme.card;
  const h = 35;
  const widths = items.map((label) => measure(label, ID, SIZE) + 28);
  return pieces(widths, h, items, (i, x) => `${frame({ x, y: 0, w: widths[i], h, r: 11, fill: c.bg, line: c.line, border: 2, bottom: 2 })}
<text x="${r1(x + widths[i] / 2)}" y="${r1(baseline(ID, SIZE, 0, h))}" ${font(ID, SIZE)} fill="${c.ink}" text-anchor="middle">${escape(items[i])}</text>`);
};

module.exports = { build, toolbox };
