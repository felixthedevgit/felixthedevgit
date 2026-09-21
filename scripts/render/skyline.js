'use strict';

const { FONT, escape, number, mix, hold, document } = require('../svg');

const W = 900;
const H = 460;
const PAD = 40;
const TITLE = 90;
const ROWS = 7;
// Oblique projection: one week step goes mostly right and a little down,
// one weekday step goes down and to the left. The year therefore runs
// across the picture instead of diagonally through it, which keeps the
// graphic wide like the cards around it.
const U = { x: 14.6, y: 4.2 };
const V = { x: -8.5, y: 7.5 };
const MIN_H = 6;
const MAX_H = 46;
const PLATE = 10;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const longDate = (iso) => new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${iso}T12:00:00Z`));
const poly = (points) => points.map((pt) => pt.join(',')).join(' ');

const render = (theme, stats) => {
  // Week index per day. GitHub's calendar starts a new week on Sunday.
  const days = [];
  const weekStarts = [];
  for (const day of stats.days) {
    if (weekStarts.length === 0 || day.weekday === 0) weekStarts.push(day.date);
    days.push({ ...day, week: weekStarts.length - 1 });
  }
  const weekCount = weekStarts.length;
  const X0 = PAD - ROWS * V.x;
  const Y0 = TITLE + MAX_H;
  const p = (u, v, h) => [
    Number((X0 + u * U.x + v * V.x).toFixed(1)),
    Number((Y0 + u * U.y + v * V.y - h).toFixed(1)),
  ];
  const level = (count) => {
    const i = stats.thresholds.findIndex((t) => count <= t);
    return i < 0 ? 4 : i + 1;
  };
  // Square root instead of a straight line: a day with five commits should
  // still stand clearly above the slab even when one day had sixty.
  const height = (count) => MIN_H + (MAX_H - MIN_H) * Math.sqrt(count / Math.max(1, stats.maxDaily));

  // The slab everything stands on, with its two visible sides.
  const plate = [
    `<polygon points="${poly([p(0, 0, 0), p(weekCount, 0, 0), p(weekCount, ROWS, 0), p(0, ROWS, 0)])}" fill="${theme.plate}"/>`,
    `<polygon points="${poly([p(0, ROWS, 0), p(weekCount, ROWS, 0), p(weekCount, ROWS, -PLATE), p(0, ROWS, -PLATE)])}" fill="${mix(theme.plate, theme.shadow, 0.3)}"/>`,
    `<polygon points="${poly([p(weekCount, 0, 0), p(weekCount, ROWS, 0), p(weekCount, ROWS, -PLATE), p(weekCount, 0, -PLATE)])}" fill="${mix(theme.plate, theme.shadow, 0.16)}"/>`,
  ].join('\n');

  // Painter's algorithm: cells further down the screen are closer to the
  // viewer and are drawn last. With both axes pointing downwards this
  // order never changes while the columns grow.
  const sorted = [...days].sort((a, b) => (a.week * U.y + a.weekday * V.y) - (b.week * U.y + b.weekday * V.y));
  // A light runs over the tops from left to right every nine seconds.
  const sweep = (base, light, i) => `<animate attributeName="fill" values="${base};${light};${base};${base}" keyTimes="0;0.05;0.12;1" dur="9s" begin="${(3 + i * 0.07).toFixed(2)}s" repeatCount="indefinite"/>`;
  const cells = sorted.map((day) => {
    const i = day.week;
    const j = day.weekday;
    const flatTop = poly([p(i, j, 0), p(i + 1, j, 0), p(i + 1, j + 1, 0), p(i, j + 1, 0)]);
    if (day.count === 0) {
      return `<polygon points="${flatTop}" fill="${theme.tile}" stroke="${theme.plate}" stroke-width="0.8">${sweep(theme.tile, theme.tileLight, i)}</polygon>`;
    }
    const h = height(day.count);
    const base = theme.levels[level(day.count) - 1];
    const begin = (0.3 + i * 0.035).toFixed(2);
    const rise = (from, to) => `${hold('points', from, begin)}<animate attributeName="points" from="${from}" to="${to}" dur="0.9s" begin="${begin}s" fill="freeze" calcMode="spline" keyTimes="0;1" keySplines="0.2 0 0.2 1"/>`;
    const top = poly([p(i, j, h), p(i + 1, j, h), p(i + 1, j + 1, h), p(i, j + 1, h)]);
    const right = poly([p(i + 1, j, h), p(i + 1, j + 1, h), p(i + 1, j + 1, 0), p(i + 1, j, 0)]);
    const rightFlat = poly([p(i + 1, j, 0), p(i + 1, j + 1, 0), p(i + 1, j + 1, 0), p(i + 1, j, 0)]);
    const front = poly([p(i, j + 1, h), p(i + 1, j + 1, h), p(i + 1, j + 1, 0), p(i, j + 1, 0)]);
    const frontFlat = poly([p(i, j + 1, 0), p(i + 1, j + 1, 0), p(i + 1, j + 1, 0), p(i, j + 1, 0)]);
    return [
      `<polygon points="${right}" fill="${mix(base, theme.shadow, 0.2)}">${rise(rightFlat, right)}</polygon>`,
      `<polygon points="${front}" fill="${mix(base, theme.shadow, 0.34)}">${rise(frontFlat, front)}</polygon>`,
      `<polygon points="${top}" fill="${base}">${rise(flatTop, top)}${sweep(base, mix(base, theme.sweep, 0.55), i)}</polygon>`,
    ].join('\n');
  }).join('\n');

  // One label per month at the first week that starts in it, hanging
  // below the front edge of the slab. The first week is skipped so the
  // label cannot collide with the left corner.
  let labels = '';
  let previous = -1;
  weekStarts.forEach((date, i) => {
    const month = new Date(`${date}T12:00:00Z`).getUTCMonth();
    if (i > 0 && month !== previous) {
      const [x, y] = p(i, ROWS, -PLATE);
      labels += `<text x="${x}" y="${y + 18}" font-size="12" fill="${theme.muted}">${MONTHS[month]}</text>\n`;
    }
    previous = month;
  });

  const swatch = (x, y, fill) => poly([
    [x, y],
    [x + U.x * 0.8, y + U.y * 0.8],
    [x + (U.x + V.x) * 0.8, y + (U.y + V.y) * 0.8],
    [x + V.x * 0.8, y + V.y * 0.8],
  ].map((pt) => pt.map((n) => Number(n.toFixed(1)))));
  const legendY = 78;
  const swatches = [theme.tile, ...theme.levels].map((fill, k) => `<polygon points="${swatch(W - PAD - 42 - (4 - k) * 20, legendY, fill)}" fill="${fill}"/>`).join('\n');
  const legend = `<text x="${W - PAD - 42 - 4 * 20 - 12}" y="${legendY + 9}" font-size="11" fill="${theme.muted}" text-anchor="end">Less</text>
${swatches}
<text x="${W - PAD}" y="${legendY + 9}" font-size="11" fill="${theme.muted}" text-anchor="end">More</text>`;

  const range = stats.first && stats.last ? `${longDate(stats.first)} to ${longDate(stats.last)}` : '';
  const body = `<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="24" fill="${theme.card}" stroke="${theme.cardEdge}"/>
<g font-family="${FONT}">
<text x="${PAD}" y="44" font-size="16" font-weight="700" fill="${theme.ink}">Contributions in the last 52 weeks</text>
<text x="${PAD}" y="64" font-size="13" fill="${theme.muted}">${escape(range)}</text>
<text x="${W - PAD}" y="54" font-size="34" font-weight="700" fill="${theme.accentStrong}" text-anchor="end">${number(stats.total)}</text>
${legend}
<g>
<animateTransform attributeName="transform" type="translate" values="0 0;0 -5;0 0" dur="7s" repeatCount="indefinite" calcMode="spline" keyTimes="0;0.5;1" keySplines="0.4 0 0.6 1;0.4 0 0.6 1"/>
${plate}
${cells}
${labels}</g>
</g>`;

  return document({ width: W, height: H, title: `${number(stats.total)} contributions in the last 52 weeks`, body });
};

module.exports = { render };
