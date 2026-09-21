'use strict';

const { FONT, escape, number, hold, document } = require('../svg');

const W = 900;
const H = 240;
const PAD = { left: 40, right: 40, top: 84, bottom: 46 };
const MONTHS = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

const longDate = (iso) => new Intl.DateTimeFormat('de-DE', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${iso}T12:00:00Z`));

// Catmull-Rom through the weekly points, written out as cubic Béziers. A
// polyline would show every week as a kink, and the profile is meant to
// read like a river, not like a seismograph. The control points are clamped
// to the drawing area so a quiet week between two busy ones cannot dip
// below the baseline.
const smoothPath = (points, top, bottom) => {
  const clamp = (y) => Math.min(bottom, Math.max(top, y));
  let d = `M${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;
    const c1x = (p1.x + (p2.x - p0.x) / 6).toFixed(1);
    const c1y = clamp(p1.y + (p2.y - p0.y) / 6).toFixed(1);
    const c2x = (p2.x - (p3.x - p1.x) / 6).toFixed(1);
    const c2y = clamp(p2.y - (p3.y - p1.y) / 6).toFixed(1);
    d += ` C${c1x} ${c1y} ${c2x} ${c2y} ${p2.x} ${p2.y}`;
  }
  return d;
};

const render = (theme, stats) => {
  const weeks = stats.weeks.length ? stats.weeks : [{ start: stats.first, count: 0 }];
  const innerW = W - PAD.left - PAD.right;
  const baseline = H - PAD.bottom;
  const max = Math.max(1, ...weeks.map((w) => w.count));
  const step = weeks.length > 1 ? innerW / (weeks.length - 1) : 0;
  const points = weeks.map((w, i) => ({
    x: Number((PAD.left + i * step).toFixed(1)),
    y: Number((baseline - (baseline - PAD.top) * (w.count / max)).toFixed(1)),
  }));
  const line = smoothPath(points, PAD.top, baseline);
  const area = `${line} L${points[points.length - 1].x} ${baseline} L${points[0].x} ${baseline} Z`;
  const last = points[points.length - 1];

  // One label per month, placed at the first week that starts in it. The
  // first week is skipped so the label does not collide with the left edge.
  let labels = '';
  let previous = new Date(`${weeks[0].start}T12:00:00Z`).getUTCMonth();
  weeks.forEach((w, i) => {
    const month = new Date(`${w.start}T12:00:00Z`).getUTCMonth();
    if (month !== previous && i > 0) {
      labels += `<text x="${points[i].x}" y="${H - 18}" font-size="12" fill="${theme.muted}" text-anchor="middle">${MONTHS[month]}</text>\n`;
    }
    previous = month;
  });

  const range = stats.first && stats.last ? `${longDate(stats.first)} bis ${longDate(stats.last)}` : '';
  const body = `<defs>
<linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="${theme.accent}" stop-opacity="0.5"/>
<stop offset="1" stop-color="${theme.accent}" stop-opacity="0"/>
</linearGradient>
<linearGradient id="stroke" x1="0" y1="0" x2="1" y2="0">
<stop offset="0" stop-color="${theme.accentStrong}"/>
<stop offset="1" stop-color="${theme.pink}"/>
</linearGradient>
<clipPath id="reveal"><rect x="0" y="0" width="${W}" height="${H}">${hold('width', 0, 0.2)}<animate attributeName="width" from="0" to="${W}" dur="2.2s" begin="0.2s" fill="freeze" calcMode="spline" keyTimes="0;1" keySplines="0.3 0 0.2 1"/></rect></clipPath>
</defs>
<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="24" fill="${theme.card}" stroke="${theme.cardEdge}"/>
<g font-family="${FONT}">
<text x="${PAD.left}" y="44" font-size="16" font-weight="700" fill="${theme.ink}">Beiträge in den letzten 52 Wochen</text>
<text x="${PAD.left}" y="64" font-size="13" fill="${theme.muted}">${escape(range)}</text>
<text x="${W - PAD.right}" y="54" font-size="34" font-weight="700" fill="${theme.accentStrong}" text-anchor="end">${number(stats.total)}</text>
${labels}</g>
<line x1="${PAD.left}" y1="${baseline}" x2="${W - PAD.right}" y2="${baseline}" stroke="${theme.cardEdge}" stroke-width="1"/>
<g clip-path="url(#reveal)">
<path d="${area}" fill="url(#area)"/>
<path d="${line}" fill="none" stroke="url(#stroke)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
</g>
<circle cx="${last.x}" cy="${last.y}" r="6" fill="${theme.pink}">
${hold('opacity', 0, 2.3)}
<animate attributeName="opacity" from="0" to="1" dur="0.4s" begin="2.3s" fill="freeze"/>
<animate attributeName="r" values="6;10;6" dur="2.4s" begin="2.7s" repeatCount="indefinite" calcMode="spline" keyTimes="0;0.5;1" keySplines="0.4 0 0.6 1;0.4 0 0.6 1"/>
</circle>
<circle cx="${last.x}" cy="${last.y}" r="3" fill="${theme.card}">
${hold('opacity', 0, 2.3)}
<animate attributeName="opacity" from="0" to="1" dur="0.4s" begin="2.3s" fill="freeze"/>
</circle>`;

  return document({ width: W, height: H, title: `${number(stats.total)} Beiträge in den letzten 52 Wochen`, body });
};

module.exports = { render };
