'use strict';

// The numbers of the last twelve months as two cards the size of the
// project cards: three figures with a marker stroke under each, and a bar
// per week. Side by side on a desktop, stacked on a phone. Everything
// comes from the GitHub calendar via scripts/analyse.js.

const { escape, number, r1, frame } = require('../svg');
const { measure, baseline, font, face } = require('../fonts');

const CARD_W = 396;
const CARD_H = 108;
const AFTER_X = 8;
const AFTER_Y = 12;
const PAD = 22;
const NUM = { id: 'nunito-900', size: 28, line: 34 };
const LABEL = { id: 'nunito-700', size: 13.5, line: 20 };
const TOP = 2 + 18;

const MARK = '.mark{transform-box:fill-box;transform-origin:left center;animation:mark .8s cubic-bezier(.6,0,.3,1) both}@keyframes mark{from{transform:scaleX(0)}to{transform:scaleX(1)}}';
const UP = '.up{transform-box:fill-box;transform-origin:center bottom;animation:up .6s cubic-bezier(.2,.8,.2,1) both}@keyframes up{from{transform:scaleY(0)}to{transform:scaleY(1)}}';

const card = (theme) => frame({ w: CARD_W, h: CARD_H, r: 20, fill: theme.card.bg, line: theme.card.line, border: 2, bottom: 5 });
const labelBase = () => baseline(LABEL.id, LABEL.size, TOP + NUM.line + 10, LABEL.line);

const figures = (theme, stats) => {
  const c = theme.card;
  const list = [
    { value: number(stats.total), label: stats.total === 1 ? 'contribution' : 'contributions', tint: 'mint' },
    { value: number(stats.activeDays), label: stats.activeDays === 1 ? 'active day' : 'active days', tint: 'sky' },
    { value: `${number(stats.longest)} ${stats.longest === 1 ? 'day' : 'days'}`, label: 'longest streak', tint: 'lavender' },
  ];
  const numBase = baseline(NUM.id, NUM.size, TOP, NUM.line);
  const m = face(NUM.id);
  const full = ((m.ascender - m.descender) / m.upem) * NUM.size;
  const markTop = numBase - (m.ascender / m.upem) * NUM.size + 0.58 * full;
  const markH = 0.3 * full;

  // The three columns share the room left over after their own widths.
  const widths = list.map((f) => Math.max(measure(f.value, NUM.id, NUM.size) + 6, measure(f.label, LABEL.id, LABEL.size)));
  const room = CARD_W - 2 * PAD - widths.reduce((a, b) => a + b, 0);
  if (room < 24) throw new Error('The stats figures do not fit into their card.');
  const gap = Math.min(40, room / (list.length - 1));
  let x = PAD;
  const body = list.map((f, i) => {
    const valueW = measure(f.value, NUM.id, NUM.size);
    const svg = `<rect class="mark" style="animation-delay:${(0.3 + i * 0.15).toFixed(2)}s" x="${r1(x - 3)}" y="${r1(markTop)}" width="${r1(valueW + 6)}" height="${r1(markH)}" fill="${theme.tints[f.tint].marker}"/>
<text x="${r1(x)}" y="${r1(numBase)}" ${font(NUM.id, NUM.size)} fill="${c.ink}">${escape(f.value)}</text>
<text x="${r1(x)}" y="${r1(labelBase())}" ${font(LABEL.id, LABEL.size)} fill="${c.muted}">${escape(f.label)}</text>`;
    x += widths[i] + gap;
    return svg;
  }).join('\n');

  const alt = `Last 12 months on GitHub: ${list.map((f) => (f.label === 'longest streak' ? `longest streak ${f.value}` : `${f.value} ${f.label}`)).join(', ')}.`;
  return { svg: { width: CARD_W + AFTER_X, height: CARD_H + AFTER_Y, title: alt, fonts: [NUM.id, LABEL.id], css: MARK, body: `${card(theme)}\n${body}` }, alt };
};

// One bar per calendar week. The height follows the square root of the
// count, so one very busy week does not flatten all the others, and any
// activity gets at least a stub in colour so it is not mistaken for none.
const weeks = (theme, stats) => {
  const c = theme.card;
  const list = stats.weeks;
  const left = PAD;
  const right = CARD_W - PAD;
  const pitch = (right - left) / Math.max(1, list.length);
  const barW = Math.max(2, Math.min(8, pitch * 0.66));
  const bottom = TOP + NUM.line + 2;
  const top = TOP;
  const maxH = bottom - top;
  const max = Math.sqrt(Math.max(1, ...list.map((w) => w.count)));
  const fill = theme.tints.mint.fill;
  const radius = r1(Math.min(2, barW / 2));
  const bars = list.map((w, k) => {
    const bx = r1(left + k * pitch + (pitch - barW) / 2);
    if (!w.count) return `<rect x="${bx}" y="${r1(bottom - 4)}" width="${r1(barW)}" height="4" rx="${radius}" fill="${c.track}"/>`;
    const h = Math.max(6, Math.round(maxH * (Math.sqrt(w.count) / max)));
    return `<rect class="up" style="animation-delay:${(0.3 + k * 0.012).toFixed(3)}s" x="${bx}" y="${r1(bottom - h)}" width="${r1(barW)}" height="${h}" rx="${radius}" fill="${fill}"/>`;
  }).join('\n');
  const active = list.filter((w) => w.count > 0).length;
  const caption = `<text x="${r1(left + (pitch - barW) / 2)}" y="${r1(labelBase())}" ${font(LABEL.id, LABEL.size)} fill="${c.muted}">contributions per week</text>`;
  const alt = `Contributions per week over the last 12 months, one bar per week. ${active} of ${list.length} weeks had activity.`;
  return { svg: { width: CARD_W + AFTER_X, height: CARD_H + AFTER_Y, title: alt, fonts: [LABEL.id], css: UP, body: `${card(theme)}\n${bars}\n${caption}` }, alt };
};

module.exports = { figures, weeks };
