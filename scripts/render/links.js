'use strict';

const { FONT, escape, textWidth, mix, brandPalette, hold, document } = require('../svg');
const { ICONS } = require('../icons');

const H = 36;
const ICON = 16;

// Icons for the places that have no brand mark in Simple Icons, drawn by
// hand in a 16 by 16 box: a globe for the website, a block and a leaf for
// the two SkyBlock trackers.
const DRAWN = {
  globe: (c) => `<circle cx="8" cy="8" r="6.3" fill="none" stroke="${c}" stroke-width="1.6"/><ellipse cx="8" cy="8" rx="2.7" ry="6.3" fill="none" stroke="${c}" stroke-width="1.4"/><path d="M1.7 8h12.6" stroke="${c}" stroke-width="1.4"/>`,
  cube: (c, theme) => `<polygon points="8,1.4 14.2,4.9 8,8.4 1.8,4.9" fill="${c}"/><polygon points="1.8,4.9 8,8.4 8,14.8 1.8,11.3" fill="${mix(c, theme.shadow, 0.34)}"/><polygon points="14.2,4.9 8,8.4 8,14.8 14.2,11.3" fill="${mix(c, theme.shadow, 0.2)}"/>`,
  leaf: (c) => `<path d="M14 2.2C7.2 2.4 3 6.6 3 12.4c0 .5 0 1 .1 1.4C4.3 9.6 7.2 6.6 11 5.4c-3.4 2-5.9 5.2-6.8 8.8.7.2 1.4.3 2.2.3 5.6 0 8-4.7 7.6-12.3z" fill="${c}"/>`,
};

// One pill per link in the brand's pastel. They are separate files because
// an image in a README can only be one link as a whole, so every pill
// needs its own <a>.
const render = (theme, link) => {
  const brand = ICONS[link.icon];
  const pal = brandPalette(theme, brand ? brand.hex : (link.color || theme.accentStrong));
  const icon = brand
    ? `<g transform="scale(${(ICON / 24).toFixed(4)})"><path d="${brand.path}" fill="${pal.ink}"/></g>`
    : (DRAWN[link.icon] || DRAWN.globe)(pal.ink, theme);
  const labelWidth = textWidth(link.label, 14, true);
  const handleWidth = textWidth(link.handle, 13, false);
  const textX = 12 + ICON + 8;
  const width = textX + labelWidth + 7 + handleWidth + 14;
  const body = `<g font-family="${FONT}">
${hold('opacity', 0, 0.1)}
<animate attributeName="opacity" from="0" to="1" dur="0.5s" begin="0.1s" fill="freeze"/>
<rect x="0.5" y="0.5" width="${width - 1}" height="${H - 1}" rx="${H / 2}" fill="${pal.card}" stroke="${pal.edge}"/>
<g transform="translate(12 ${(H - ICON) / 2})">${icon}</g>
<text x="${textX}" y="${H / 2 + 5}" font-size="14" font-weight="700" fill="${theme.ink}">${escape(link.label)}</text>
<text x="${textX + labelWidth + 7}" y="${H / 2 + 5}" font-size="13" fill="${theme.muted}">${escape(link.handle)}</text>
</g>`;
  return document({ width, height: H, title: `${link.label}: ${link.handle}`, body });
};

module.exports = { render };
