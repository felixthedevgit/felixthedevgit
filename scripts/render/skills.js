'use strict';

const { FONT, escape, textWidth, hold, appear, document } = require('../svg');

const W = 900;
const COLUMNS = 2;
const GAP = 14;
const CARD_H = 100;
const PAD = 16;
const ICON_BOX = 40;

// How much a skill is used, in words rather than in made-up percentages.
// Index is the level from profile.json, one to five.
const LEVELS = ['', 'getting started', 'now and then', 'regularly', 'most weeks', 'daily'];

// Simple icons in a 20 by 20 box. Languages get their usual monogram, tools
// get a glyph. Each takes the foreground colour and the box background.
const ICONS = {
  js: (c) => `<text x="10" y="14.5" font-size="12" font-weight="800" text-anchor="middle" fill="${c}" font-family="${FONT}">JS</text>`,
  ts: (c) => `<text x="10" y="14.5" font-size="12" font-weight="800" text-anchor="middle" fill="${c}" font-family="${FONT}">TS</text>`,
  csharp: (c) => `<text x="10" y="14.5" font-size="12" font-weight="800" text-anchor="middle" fill="${c}" font-family="${FONT}">C#</text>`,
  markup: (c) => `<path d="M7 4L2 10l5 6M13 4l5 6-5 6" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
  luau: (c, bg) => `<circle cx="9" cy="11" r="6.5" fill="${c}"/><circle cx="11.5" cy="8.5" r="1.8" fill="${bg}"/><circle cx="16.5" cy="3.5" r="1.7" fill="${c}"/>`,
  roblox: (c, bg) => `<g transform="rotate(-14 10 10)"><rect x="3.4" y="3.4" width="13.2" height="13.2" rx="1.6" fill="${c}"/><rect x="7.8" y="7.8" width="4.4" height="4.4" fill="${bg}"/></g>`,
  db: (c) => `<ellipse cx="10" cy="5.5" rx="6.5" ry="2.5" fill="none" stroke="${c}" stroke-width="1.8"/><path d="M3.5 5.5v9c0 1.4 2.9 2.5 6.5 2.5s6.5-1.1 6.5-2.5v-9" fill="none" stroke="${c}" stroke-width="1.8"/><path d="M3.5 10c0 1.4 2.9 2.5 6.5 2.5s6.5-1.1 6.5-2.5" fill="none" stroke="${c}" stroke-width="1.8"/>`,
  docker: (c) => `<rect x="2.5" y="10" width="4.2" height="4.2" rx="0.8" fill="${c}"/><rect x="7.9" y="10" width="4.2" height="4.2" rx="0.8" fill="${c}"/><rect x="13.3" y="10" width="4.2" height="4.2" rx="0.8" fill="${c}"/><rect x="7.9" y="4.6" width="4.2" height="4.2" rx="0.8" fill="${c}"/><path d="M2 17h16" stroke="${c}" stroke-width="1.8" stroke-linecap="round"/>`,
  terminal: (c) => `<path d="M4 6l5 4-5 4" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M11 15h5" stroke="${c}" stroke-width="2" stroke-linecap="round"/>`,
  git: (c) => `<circle cx="6" cy="5" r="2.2" fill="${c}"/><circle cx="6" cy="15" r="2.2" fill="${c}"/><circle cx="14" cy="8" r="2.2" fill="${c}"/><path d="M6 7v6M14 10c0 3-4 3-8 3" fill="none" stroke="${c}" stroke-width="1.8" stroke-linecap="round"/>`,
};

// Word wrap on the estimated width, at most two lines. A third line would
// push the bar out of the card, so the text is cut with an ellipsis.
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

const render = (theme, profile) => {
  const categories = profile.categories || [];
  const skills = profile.skills || [];
  const cardW = (W - GAP * (COLUMNS - 1)) / COLUMNS;
  const textX = PAD + ICON_BOX + 14;
  const textW = cardW - textX - PAD;

  const cards = skills.map((skill, i) => {
    const col = i % COLUMNS;
    const row = Math.floor(i / COLUMNS);
    const x = col * (cardW + GAP);
    const y = row * (CARD_H + GAP);
    const categoryIndex = Math.max(0, categories.findIndex((c) => c.id === skill.category));
    const category = categories[categoryIndex] || { label: '' };
    const tint = theme.tints[categoryIndex % theme.tints.length];
    const icon = ICONS[skill.icon] || ICONS.markup;
    const level = Math.min(5, Math.max(1, Number(skill.level) || 1));
    const begin = 0.15 + i * 0.08;
    const barW = textW - 92;
    const barFill = Math.round(barW * (level / 5));
    const lines = wrap(skill.use, 12.5, textW);
    return `<g>
${appear(begin)}
<rect x="${x + 0.5}" y="${y + 0.5}" width="${cardW - 1}" height="${CARD_H - 1}" rx="20" fill="${theme.card}" stroke="${theme.cardEdge}"/>
<rect x="${x + PAD}" y="${y + PAD}" width="${ICON_BOX}" height="${ICON_BOX}" rx="12" fill="${tint.bg}"/>
<g transform="translate(${x + PAD + 10} ${y + PAD + 10})">${icon(tint.fg, tint.bg)}</g>
<text x="${x + textX}" y="${y + 33}" font-size="15" font-weight="700" fill="${theme.ink}">${escape(skill.name)}</text>
<text x="${x + cardW - PAD}" y="${y + 32}" font-size="10.5" font-weight="700" letter-spacing="0.6" fill="${tint.fg}" text-anchor="end">${escape(category.label.toUpperCase())}</text>
${lines.map((line, n) => `<text x="${x + textX}" y="${y + 53 + n * 16}" font-size="12.5" fill="${theme.muted}">${escape(line)}</text>`).join('\n')}
<rect x="${x + textX}" y="${y + CARD_H - 19}" width="${barW}" height="5" rx="2.5" fill="${theme.accentSoft}"/>
<rect x="${x + textX}" y="${y + CARD_H - 19}" width="${barFill}" height="5" rx="2.5" fill="${tint.fg}">
${hold('width', 0, begin + 0.3)}
<animate attributeName="width" from="0" to="${barFill}" dur="1s" begin="${begin + 0.3}s" fill="freeze" calcMode="spline" keyTimes="0;1" keySplines="0.3 0 0.2 1"/>
</rect>
<text x="${x + textX + barW + 10}" y="${y + CARD_H - 14}" font-size="11" fill="${theme.muted}">${escape(LEVELS[level])}</text>
</g>`;
  });

  const rows = Math.ceil(skills.length / COLUMNS);
  const height = Math.max(CARD_H, rows * (CARD_H + GAP) - GAP);
  const title = skills.map((skill) => `${skill.name} (${LEVELS[Math.min(5, Math.max(1, Number(skill.level) || 1))]})`).join(', ');
  return document({ width: W, height, title: `What I work with: ${title}`, body: `<g font-family="${FONT}">\n${cards.join('\n')}\n</g>` });
};

module.exports = { render };
