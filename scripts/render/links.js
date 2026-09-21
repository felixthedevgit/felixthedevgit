'use strict';

const { FONT, escape, textWidth, mix, hold, document } = require('../svg');

const H = 36;
const ICON = 16;

// Small icons drawn by hand in a 16 by 16 box. No icon font and no brand
// assets from elsewhere: the point of this profile is that it loads
// nothing from anyone. Each takes the icon colour and the pill background.
const ICONS = {
  globe: (c) => `<circle cx="8" cy="8" r="6.3" fill="none" stroke="${c}" stroke-width="1.6"/><ellipse cx="8" cy="8" rx="2.7" ry="6.3" fill="none" stroke="${c}" stroke-width="1.4"/><path d="M1.7 8h12.6" stroke="${c}" stroke-width="1.4"/>`,
  roblox: (c, bg) => `<g transform="rotate(-14 8 8)"><rect x="2.6" y="2.6" width="10.8" height="10.8" rx="1.4" fill="${c}"/><rect x="6.2" y="6.2" width="3.6" height="3.6" fill="${bg}"/></g>`,
  discord: (c, bg) => `<path d="M13 3.7a11.6 11.6 0 0 0-2.9-.9l-.4.8a10.8 10.8 0 0 0-3.4 0l-.4-.8a11.6 11.6 0 0 0-2.9.9C1.2 6.4.7 9 1 11.6a11.7 11.7 0 0 0 3.6 1.8l.8-1.2c-.4-.2-.9-.4-1.3-.6l.3-.2a8.3 8.3 0 0 0 7.2 0l.3.2c-.4.2-.9.4-1.3.6l.8 1.2a11.7 11.7 0 0 0 3.6-1.8c.4-3-.5-5.6-2-7.9z" fill="${c}"/><circle cx="5.9" cy="8.6" r="1.25" fill="${bg}"/><circle cx="10.1" cy="8.6" r="1.25" fill="${bg}"/>`,
  tiktok: (c) => `<path d="M8.5 1.3h2.4c.2 1.9 1.3 3 3.2 3.2v2.4c-1.2 0-2.3-.4-3.2-1.1v4.4a4 4 0 1 1-4-4h.7v2.5h-.7a1.5 1.5 0 1 0 1.6 1.5V1.3z" fill="${c}"/>`,
  cube: (c, bg, theme) => `<polygon points="8,1.4 14.2,4.9 8,8.4 1.8,4.9" fill="${theme.accent}"/><polygon points="1.8,4.9 8,8.4 8,14.8 1.8,11.3" fill="${mix(theme.accent, theme.shadow, 0.34)}"/><polygon points="14.2,4.9 8,8.4 8,14.8 14.2,11.3" fill="${mix(theme.accent, theme.shadow, 0.2)}"/>`,
};

// One pill per link. They are separate files because an image in a README
// can only be one link as a whole, so every pill needs its own <a>.
const render = (theme, link) => {
  const icon = ICONS[link.icon] || ICONS.globe;
  const labelWidth = textWidth(link.label, 14, true);
  const handleWidth = textWidth(link.handle, 13, false);
  const textX = 12 + ICON + 8;
  const width = textX + labelWidth + 7 + handleWidth + 14;
  const body = `<g font-family="${FONT}">
${hold('opacity', 0, 0.1)}
<animate attributeName="opacity" from="0" to="1" dur="0.5s" begin="0.1s" fill="freeze"/>
<rect x="0.5" y="0.5" width="${width - 1}" height="${H - 1}" rx="${H / 2}" fill="${theme.card}" stroke="${theme.cardEdge}"/>
<g transform="translate(12 ${(H - ICON) / 2})">${icon(theme.accentStrong, theme.card, theme)}</g>
<text x="${textX}" y="${H / 2 + 5}" font-size="14" font-weight="700" fill="${theme.ink}">${escape(link.label)}</text>
<text x="${textX + labelWidth + 7}" y="${H / 2 + 5}" font-size="13" fill="${theme.muted}">${escape(link.handle)}</text>
</g>`;
  return document({ width, height: H, title: `${link.label}: ${link.handle}`, body });
};

module.exports = { render };
