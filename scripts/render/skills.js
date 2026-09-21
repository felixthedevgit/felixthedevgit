'use strict';

const { FONT, escape, textWidth, brandPalette, hold, appear, document } = require('../svg');
const { ICONS } = require('../icons');

const W = 900;
const ROW_H = 88;
const GAP = 10;
const PAD = 16;
const RING = 31;
const DISC = 26;
const ICON = 26;
const EASE = 'calcMode="spline" keyTimes="0;1" keySplines="0.2 0 0.2 1"';

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

// One row per skill in the brand's own pastel: the real logo on a round
// disc, a ring around it that fills to the level while the row appears,
// the name with the level in words, and two lines on what it is for.
// Every nine seconds the discs breathe once, one after another, so the
// list keeps a little motion without getting busy.
const row = (theme, skill, i, y) => {
  const brand = ICONS[skill.icon];
  const pal = brandPalette(theme, brand ? brand.hex : theme.accentStrong);
  const level = clampLevel(skill.level);
  const begin = 0.15 + i * 0.1;
  const cx = PAD + RING + 2;
  const cy = y + ROW_H / 2;
  const circumference = (2 * Math.PI * RING).toFixed(1);
  const offset = (2 * Math.PI * RING * (1 - level / 5)).toFixed(1);
  const textX = PAD + RING * 2 + 22;
  const nameWidth = textWidth(skill.name, 15, true);
  const lines = wrap(skill.use, 12.5, W - textX - PAD - 8);
  const logo = brand
    ? `<g transform="translate(${cx} ${cy})"><g>
<animateTransform attributeName="transform" type="scale" values="0.6;1.08;1" keyTimes="0;0.7;1" dur="0.6s" begin="${(begin + 0.1).toFixed(2)}s" fill="freeze" calcMode="spline" keySplines="0.2 0 0.2 1;0.4 0 0.6 1"/>
<g transform="translate(${-ICON / 2} ${-ICON / 2}) scale(${(ICON / 24).toFixed(4)})"><path d="${brand.path}" fill="${pal.ink}"/></g>
</g></g>`
    : '';
  return `<g>
${appear(begin)}
<rect x="0.5" y="${y + 0.5}" width="${W - 1}" height="${ROW_H - 1}" rx="18" fill="${pal.card}" stroke="${pal.edge}"/>
<circle cx="${cx}" cy="${cy}" r="${RING}" fill="none" stroke="${pal.track}" stroke-width="4"/>
<circle cx="${cx}" cy="${cy}" r="${RING}" fill="none" stroke="${pal.ink}" stroke-width="4" stroke-linecap="round" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}" transform="rotate(-90 ${cx} ${cy})">
${hold('stroke-dashoffset', circumference, (begin + 0.1).toFixed(2))}
<animate attributeName="stroke-dashoffset" from="${circumference}" to="${offset}" dur="1.1s" begin="${(begin + 0.1).toFixed(2)}s" fill="freeze" ${EASE}/>
</circle>
<circle cx="${cx}" cy="${cy}" r="${DISC}" fill="${pal.key}">
<animate attributeName="r" values="${DISC};${DISC + 2};${DISC};${DISC}" keyTimes="0;0.03;0.07;1" dur="9s" begin="${(3 + i * 0.35).toFixed(2)}s" repeatCount="indefinite"/>
</circle>
${logo}
<text x="${textX}" y="${y + 30}" font-size="15" font-weight="700" fill="${theme.ink}">${escape(skill.name)}</text>
<circle cx="${textX + nameWidth + 12}" cy="${y + 25}" r="2" fill="${pal.ink}"/>
<text x="${textX + nameWidth + 20}" y="${y + 30}" font-size="11.5" fill="${pal.ink}">${LEVELS[level]}</text>
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
