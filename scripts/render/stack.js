'use strict';

const { FONT, escape, textWidth, appear, document } = require('../svg');

const W = 900;
const PILL_H = 36;
const GAP = 10;
const PAD_X = 16;
const FONT_SIZE = 14;

// Pills flow from the left and wrap like text. The height of the graphic
// follows from the number of rows, so a longer list in profile.json simply
// makes the image taller.
const render = (theme, profile) => {
  const items = profile.stack || [];
  let x = 0;
  let row = 0;
  const pills = items.map((text, i) => {
    const width = PAD_X + 14 + textWidth(text, FONT_SIZE, true) + PAD_X;
    if (x + width > W && x > 0) {
      x = 0;
      row += 1;
    }
    const y = row * (PILL_H + GAP);
    const svg = `<g>
${appear(0.1 + i * 0.07)}
<rect x="${x + 0.5}" y="${y + 0.5}" width="${width - 1}" height="${PILL_H - 1}" rx="${PILL_H / 2}" fill="${theme.card}" stroke="${theme.cardEdge}"/>
<circle cx="${x + PAD_X + 4}" cy="${y + PILL_H / 2}" r="4" fill="${i % 2 ? theme.pink : theme.accent}"/>
<text x="${x + PAD_X + 14}" y="${y + PILL_H / 2 + 5}" font-size="${FONT_SIZE}" font-weight="600" fill="${theme.ink}">${escape(text)}</text>
</g>`;
    x += width + GAP;
    return svg;
  });

  const height = (row + 1) * (PILL_H + GAP) - GAP;
  return document({
    width: W,
    height: height || PILL_H,
    title: `Womit ich arbeite: ${items.join(', ')}`,
    body: `<g font-family="${FONT}">\n${pills.join('\n')}\n</g>`,
  });
};

module.exports = { render };
