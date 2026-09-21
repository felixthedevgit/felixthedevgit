'use strict';

const { FONT, escape, number, hold, appear, document } = require('../svg');

const W = 900;
const H = 150;
const GAP = 16;
const PAD = 24;
const EASE = 'calcMode="spline" keyTimes="0;1" keySplines="0.2 0 0.2 1"';

// A number that counts up. SMIL cannot animate text content, so the value
// is drawn in frames that take turns being visible. The last frame is the
// only one visible without SMIL, so a renderer that ignores animation
// still shows the final number.
const countUp = (value, x, y, size, fill, begin) => {
  const steps = 20;
  const dur = 1.2;
  const attrs = `x="${x}" y="${y}" font-size="${size}" font-weight="700" fill="${fill}"`;
  const frames = [];
  for (let k = 0; k < steps; k += 1) {
    const eased = 1 - (1 - k / steps) ** 3;
    const t0 = (begin + dur * (k / steps)).toFixed(2);
    const t1 = (begin + dur * ((k + 1) / steps)).toFixed(2);
    frames.push(`<g visibility="hidden"><set attributeName="visibility" to="visible" begin="${t0}s" end="${t1}s"/><text ${attrs}>${number(Math.round(value * eased))}</text></g>`);
  }
  frames.push(`<g>${hold('visibility', 'hidden', (begin + dur).toFixed(2))}<text ${attrs}>${number(value)}</text></g>`);
  return frames.join('\n');
};

// A bar that grows out of its baseline. Height and y move together so the
// bar stays anchored at the bottom instead of stretching from the top.
const bar = (x, baseline, width, height, fill, begin) => `<rect x="${x}" y="${baseline - height}" width="${width}" height="${height}" rx="2" fill="${fill}">
${hold('y', baseline, begin.toFixed(2))}${hold('height', 0, begin.toFixed(2))}
<animate attributeName="y" from="${baseline}" to="${baseline - height}" dur="0.8s" begin="${begin.toFixed(2)}s" fill="freeze" ${EASE}/>
<animate attributeName="height" from="0" to="${height}" dur="0.8s" begin="${begin.toFixed(2)}s" fill="freeze" ${EASE}/>
</rect>`;

// The last twelve weeks as small bars, so the big number has a shape.
const weeklyBars = (theme, tint, stats, right, begin) => {
  const weeks = stats.weeks.slice(-12);
  const max = Math.max(1, ...weeks.map((w) => w.count));
  const bw = 4.5;
  const gap = 2.5;
  const left = right - (weeks.length * bw + (weeks.length - 1) * gap);
  return weeks.map((w, k) => bar(
    left + k * (bw + gap), 94, bw,
    w.count ? Math.max(4, Math.round(48 * (w.count / max))) : 2,
    w.count ? tint.fg : theme.accentSoft,
    begin + k * 0.06,
  )).join('\n');
};

// A ring that fills to a share, drawn with a dash offset that shrinks.
const ring = (theme, tint, share, label, cx, cy, begin) => {
  const r = 26;
  const c = (2 * Math.PI * r).toFixed(1);
  const offset = (2 * Math.PI * r * (1 - share)).toFixed(1);
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${theme.accentSoft}" stroke-width="6"/>
<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${tint.fg}" stroke-width="6" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${offset}" transform="rotate(-90 ${cx} ${cy})">
${hold('stroke-dashoffset', c, begin.toFixed(2))}
<animate attributeName="stroke-dashoffset" from="${c}" to="${offset}" dur="1.2s" begin="${begin.toFixed(2)}s" fill="freeze" ${EASE}/>
</circle>
<text x="${cx}" y="${cy + 4.5}" font-size="12" font-weight="700" fill="${tint.fg}" text-anchor="middle">${escape(label)}</text>`;
};

// The streak as a grid of days that light up one after another, seven per
// row like a calendar. Four rows is the cap, longer streaks get a "+".
const streakGrid = (theme, tint, longest, right, begin) => {
  const size = 8;
  const gap = 3;
  const cols = 7;
  const cap = 28;
  const lit = Math.min(longest, cap);
  const rows = Math.max(1, Math.ceil(lit / cols));
  const left = right - (cols * size + (cols - 1) * gap);
  const top = 70 - (rows * (size + gap) - gap) / 2;
  let out = '';
  for (let k = 0; k < rows * cols; k += 1) {
    const x = left + (k % cols) * (size + gap);
    const y = top + Math.floor(k / cols) * (size + gap);
    out += `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="2" fill="${theme.accentSoft}"/>\n`;
    if (k < lit) {
      const at = (begin + k * 0.05).toFixed(2);
      out += `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="2" fill="${tint.fg}">${hold('opacity', 0, at)}<animate attributeName="opacity" from="0" to="1" dur="0.3s" begin="${at}s" fill="freeze"/></rect>\n`;
    }
  }
  if (longest > cap) {
    out += `<text x="${right}" y="${top + rows * (size + gap) + 8}" font-size="10" fill="${theme.muted}" text-anchor="end">+${number(longest - cap)}</text>\n`;
  }
  return out;
};

// All seven weekdays as bars, the favourite one in colour.
const weekdayBars = (theme, tint, stats, right, begin) => {
  const max = Math.max(1, ...stats.byWeekday);
  const best = stats.byWeekday.indexOf(max);
  const bw = 5;
  const gap = 2.5;
  const left = right - (7 * bw + 6 * gap);
  const letters = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  return stats.byWeekday.map((v, k) => {
    const x = left + k * (bw + gap);
    return bar(x, 92, bw, v ? Math.max(3, Math.round(44 * (v / max))) : 2, k === best ? tint.fg : theme.accentSoft, begin + k * 0.07)
      + `<text x="${x + bw / 2}" y="104" font-size="8" fill="${theme.muted}" text-anchor="middle">${letters[k]}</text>`;
  }).join('\n');
};

const render = (theme, stats) => {
  const width = (W - GAP * 3) / 4;
  const activeShare = stats.dayCount ? stats.activeDays / stats.dayCount : 0;
  const tiles = [
    { label: 'Contributions', value: stats.total, hint: 'in twelve months', visual: (tint, right, b) => weeklyBars(theme, tint, stats, right, b) },
    { label: 'Active days', value: stats.activeDays, hint: `of ${number(stats.dayCount)}`, visual: (tint, right, b) => ring(theme, tint, activeShare, `${Math.round(activeShare * 100)}%`, right - 30, 70, b) },
    { label: 'Longest streak', value: stats.longest, hint: stats.longest === 1 ? 'day in a row' : 'days in a row', visual: (tint, right, b) => streakGrid(theme, tint, stats.longest, right, b) },
    { label: 'Favorite day', value: stats.busiestWeekday, hint: `${Math.round(stats.busiestShare * 100)}% of activity`, visual: (tint, right, b) => weekdayBars(theme, tint, stats, right, b) },
  ];

  const body = tiles.map((tile, i) => {
    const x = i * (width + GAP);
    const begin = 0.2 + i * 0.15;
    const tint = theme.tints[i % theme.tints.length];
    const numeric = typeof tile.value === 'number';
    const size = numeric ? 34 : (String(tile.value).length > 7 ? 20 : 24);
    const value = numeric
      ? countUp(tile.value, x + PAD, 86, size, theme.ink, begin + 0.1)
      : `<text x="${x + PAD}" y="84" font-size="${size}" font-weight="700" fill="${theme.ink}">${escape(tile.value)}</text>`;
    return `<g>
${appear(begin)}
<rect x="${x + 0.5}" y="0.5" width="${width - 1}" height="${H - 1}" rx="20" fill="${theme.card}" stroke="${theme.cardEdge}"/>
<text x="${x + PAD}" y="38" font-size="13" font-weight="600" fill="${theme.muted}">${escape(tile.label)}</text>
${value}
<text x="${x + PAD}" y="108" font-size="13" fill="${theme.muted}">${escape(tile.hint)}</text>
${tile.visual(tint, x + width - PAD, begin + 0.3)}
</g>`;
  }).join('\n');

  const title = tiles.map((tile) => `${tile.label}: ${typeof tile.value === 'number' ? number(tile.value) : tile.value} ${tile.hint}`).join(', ');
  return document({ width: W, height: H, title, body: `<g font-family="${FONT}">\n${body}\n</g>` });
};

module.exports = { render };
