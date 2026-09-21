'use strict';

const { FONT, escape, textWidth, brandPalette, appear, document } = require('../svg');
const { ICONS } = require('../icons');

const W = 900;
const ROW_H = 88;
const GAP = 10;
const PAD = 16;
const KEY = 56;
const ICON = 28;

// How much a skill is used, in words rather than in made-up percentages.
// Index is the level from profile.json, one to five.
const LEVELS = ['', 'getting started', 'now and then', 'regularly', 'most weeks', 'daily'];

const clampLevel = (value) => Math.min(5, Math.max(1, Number(value) || 1));

// Word wrap on the estimated width, at most two lines. A third line would
// not fit the row, so the text is cut with an ellipsis instead.
const wrap = (text, size, maxWidth) => {
  const lines = [];
  let line = '';
  for (const word of String(text).split(/\s+/)) {
    const candidate = line ? `${line} ${word}` : word;
    if (textWidth(candidate, size) > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  if (lines.length > 2) {
    lines.length = 2;
    lines[1] = `${lines[1].replace(/\s+\S*$/, '')}…`;
  }
  return lines;
};

// One row per skill in the brand's own pastel: a key that rises out of its
// shadow (the thicker the key, the more the skill is used) with the real
// logo on top, the name, five segments for the level, and two lines on
// what it is for. Every nine seconds the keys get pressed one after
// another, so the list keeps moving without being busy.
const row = (theme, skill, i, y) => {
  const brand = ICONS[skill.icon];
  const pal = brandPalette(theme, brand ? brand.hex : theme.accentStrong);
  const level = clampLevel(skill.level);
  const depth = 4 + level * 3;
  const keyY = y + (ROW_H - KEY - depth) / 2;
  const begin = 0.15 + i * 0.1;
  const textX = PAD + KEY + 18;
  const segX = textX + textWidth(skill.name, 15, true) + 14;
  const segments = [1, 2, 3, 4, 5]
    .map((k) => `<rect x="${segX + (k - 1) * 11}" y="${y + 22}" width="8" height="5" rx="2.5" fill="${k <= level ? pal.ink : pal.edge}"/>`)
    .join('');
  const lines = wrap(skill.use, 12.5, W - textX - PAD - 8);
  const logo = brand
    ? `<g transform="translate(${PAD + (KEY - ICON) / 2} ${keyY + (KEY - ICON) / 2}) scale(${(ICON / 24).toFixed(4)})"><path d="${brand.path}" fill="${pal.ink}"/></g>`
    : '';
  return `<g>
${appear(begin)}
<rect x="0.5" y="${y + 0.5}" width="${W - 1}" height="${ROW_H - 1}" rx="18" fill="${pal.card}" stroke="${pal.edge}"/>
<rect x="${PAD}" y="${keyY + depth}" width="${KEY}" height="${KEY}" rx="14" fill="${pal.side}"/>
<g>
<animateTransform attributeName="transform" type="translate" from="0 ${depth}" to="0 0" dur="0.7s" begin="${begin.toFixed(2)}s" fill="freeze" calcMode="spline" keyTimes="0;1" keySplines="0.2 0 0.2 1"/>
<animateTransform attributeName="transform" type="translate" additive="sum" values="0 0;0 ${Math.round(depth * 0.6)};0 0;0 0" keyTimes="0;0.03;0.07;1" dur="9s" begin="${(3 + i * 0.35).toFixed(2)}s" repeatCount="indefinite"/>
<rect x="${PAD}" y="${keyY}" width="${KEY}" height="${KEY}" rx="14" fill="${pal.key}"/>
${logo}
</g>
<text x="${textX}" y="${y + 30}" font-size="15" font-weight="700" fill="${theme.ink}">${escape(skill.name)}</text>
${segments}
<text x="${segX + 5 * 11 + 4}" y="${y + 30}" font-size="11.5" fill="${pal.ink}">${LEVELS[level]}</text>
${lines.map((line, n) => `<text x="${textX}" y="${y + 53 + n * 17}" font-size="12.5" fill="${theme.muted}">${escape(line)}</text>`).join('\n')}
</g>`;
};

// One graphic per category, so the README can put a heading above each.
const render = (theme, profile, categoryId) => {
  const skills = (profile.skills || []).filter((skill) => skill.category === categoryId);
  const category = (profile.categories || []).find((c) => c.id === categoryId) || { label: categoryId };
  const rows = skills.map((skill, i) => row(theme, skill, i, i * (ROW_H + GAP))).join('\n');
  const height = Math.max(ROW_H, skills.length * (ROW_H + GAP) - GAP);
  const title = `${category.label}: ${skills.map((s) => `${s.name} (${LEVELS[clampLevel(s.level)]})`).join(', ')}`;
  return document({ width: W, height, title, body: `<g font-family="${FONT}">\n${rows}\n</g>` });
};

module.exports = { render };
