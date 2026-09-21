'use strict';

const { FONT, escape, number, hold, appear, document } = require('../svg');

const W = 900;
const H = 150;
const GAP = 16;
const PADDING = 24;

// One tile per figure. The bar at the bottom is a share of something the
// label makes obvious: all contributions, days of the year, days of the
// longest streak out of all active days, share of the busiest weekday.
const tiles = (stats) => [
  { label: 'Beiträge', value: number(stats.total), hint: 'in zwölf Monaten', share: 1 },
  { label: 'Aktive Tage', value: number(stats.activeDays), hint: `von ${number(stats.dayCount)}`, share: stats.dayCount ? stats.activeDays / stats.dayCount : 0 },
  { label: 'Längste Serie', value: number(stats.longest), hint: stats.longest === 1 ? 'Tag am Stück' : 'Tage am Stück', share: stats.activeDays ? stats.longest / stats.activeDays : 0 },
  { label: 'Lieblingstag', value: stats.busiestWeekday, hint: `${Math.round(stats.busiestShare * 100)} % der Beiträge`, share: stats.busiestShare },
];

const render = (theme, stats) => {
  const list = tiles(stats);
  const width = (W - GAP * (list.length - 1)) / list.length;
  const body = list.map((tile, i) => {
    const x = i * (width + GAP);
    const begin = 0.2 + i * 0.15;
    const barWidth = Math.max(8, Math.round((width - PADDING * 2) * tile.share));
    const numeric = /^[\d.]+$/.test(tile.value);
    return `<g>
${appear(begin)}
<rect x="${x + 0.5}" y="0.5" width="${width - 1}" height="${H - 1}" rx="20" fill="${theme.card}" stroke="${theme.cardEdge}"/>
<text x="${x + PADDING}" y="38" font-size="13" font-weight="600" fill="${theme.muted}">${escape(tile.label)}</text>
<text x="${x + PADDING}" y="${numeric ? 82 : 80}" font-size="${numeric ? 34 : 26}" font-weight="700" fill="${theme.ink}">${escape(tile.value)}</text>
<text x="${x + PADDING}" y="106" font-size="13" fill="${theme.muted}">${escape(tile.hint)}</text>
<rect x="${x + PADDING}" y="122" width="${width - PADDING * 2}" height="6" rx="3" fill="${theme.accentSoft}"/>
<rect x="${x + PADDING}" y="122" width="${barWidth}" height="6" rx="3" fill="${i % 2 ? theme.pink : theme.accent}">
${hold('width', 0, begin + 0.3)}
<animate attributeName="width" from="0" to="${barWidth}" dur="1.1s" begin="${begin + 0.3}s" fill="freeze" calcMode="spline" keyTimes="0;1" keySplines="0.3 0 0.2 1"/>
</rect>
</g>`;
  }).join('\n');

  const title = list.map((tile) => `${tile.label}: ${tile.value} ${tile.hint}`).join(', ');
  return document({ width: W, height: H, title, body: `<g font-family="${FONT}">\n${body}\n</g>` });
};

module.exports = { render };
