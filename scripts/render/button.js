'use strict';

// One chunky key per link. A README image can only be one link as a whole,
// so every button is its own file inside its own <a>. The primary one is
// the mint brand key, the others are white keys with an outline.

const { escape, r1, key } = require('../svg');
const { measure, baseline, font } = require('../fonts');

const ID = 'nunito-900';
const SIZE = 14;
const SPACING = 0.7;
const H = 48;
const DEPTH = 4;
// Transparent room on the right, so that buttons placed side by side in
// the README keep a gap like in the design.
const AFTER = 8;

const render = (theme, button) => {
  const label = button.label.toUpperCase();
  const textW = measure(label, ID, SIZE, SPACING);
  const primary = Boolean(button.primary);
  const c = theme.card;
  const w = Math.ceil(textW + 40 + (primary ? 0 : 4));
  const ink = primary ? theme.primary.ink : c.ink;
  // letter-spacing also follows the last letter, half of it on each side
  // keeps the label optically centred.
  const textX = r1(w / 2 + SPACING / 2);
  const shape = primary
    ? key({ x: 0, y: 0, w, h: H, r: 14, fill: theme.primary.bg, edge: theme.primary.edge, depth: DEPTH })
    : `${key({ x: 0, y: 0, w, h: H, r: 14, fill: c.line, edge: c.line, depth: DEPTH })}
<rect x="2" y="2" width="${w - 4}" height="${H - 4}" rx="12" fill="${c.bg}"/>`;
  const body = `${shape}
<text x="${textX}" y="${r1(baseline(ID, SIZE, 0, H))}" ${font(ID, SIZE, `letter-spacing="${SPACING}"`)} fill="${ink}" text-anchor="middle">${escape(label)}</text>`;
  const alt = button.alt || button.label;
  return { svg: { width: w + AFTER, height: H + DEPTH, title: alt, fonts: [ID], body }, alt };
};

module.exports = { render };
