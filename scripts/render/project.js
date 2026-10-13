'use strict';

// One card per project: a tinted icon tile, the name, one line about it
// and a bar of four steps (idea, build, alpha, live) showing how far it is.
// The step is also written out, so the colour never carries it alone.

const { escape, r1, inset, frame } = require('../svg');
const { measure, baseline, font } = require('../fonts');
const { icon } = require('../icons');

const CARD_W = 396;
const CARD_H = 108;
// Transparent room right of and below the card. Two cards side by side in
// the README then keep a gap like the grid in the design, and when they
// stack on a phone the rows do not touch.
const AFTER_X = 8;
const AFTER_Y = 12;

const TITLE = { id: 'nunito-900', size: 18, line: 27 };
const TEXT = { id: 'nunito-700', size: 13.5, line: 20.25 };
const STATUS = { id: 'nunito-900', size: 11.5, spacing: 0.7 };

const render = (theme, project, steps) => {
  const c = theme.card;
  const tint = theme.tints[project.tint];
  if (!tint) throw new Error(`Unknown tint "${project.tint}" in profile.json.`);
  const total = steps.length;
  const step = Math.max(0, Math.min(total, Number(project.step) || 0));

  const left = 2 + 18;
  const top = 2 + 16;
  const textX = left + 46 + 14;
  const right = CARD_W - 2 - 18;
  const room = right - textX;

  const status = (project.status || steps[step - 1] || '').toUpperCase();
  const statusW = measure(status, STATUS.id, STATUS.size, STATUS.spacing);
  const titleW = measure(project.name, TITLE.id, TITLE.size);
  const textW = measure(project.summary, TEXT.id, TEXT.size);
  if (titleW + 12 + statusW > room || textW > room) {
    throw new Error(`The card for ${project.name} does not fit into ${room} px. Shorten its name, status or summary in profile.json.`);
  }

  const titleBase = baseline(TITLE.id, TITLE.size, top, TITLE.line);
  const textTop = top + TITLE.line + 5;
  const barTop = textTop + TEXT.line + 5 + 4;
  const segGap = 4;
  const segW = (room - segGap * (total - 1)) / total;
  const segments = steps.map((_, k) => {
    const x = textX + k * (segW + segGap);
    if (k < step) {
      return `<rect class="grow" style="animation-delay:${(0.2 + k * 0.2).toFixed(1)}s" x="${r1(x)}" y="${r1(barTop)}" width="${r1(segW)}" height="8" rx="4" fill="${tint.fill}"/>`;
    }
    return `<rect x="${r1(x)}" y="${r1(barTop)}" width="${r1(segW)}" height="8" rx="4" fill="${c.track}"/>`;
  }).join('\n');

  const body = `${frame({ w: CARD_W, h: CARD_H, r: 20, fill: c.bg, line: c.line, border: 2, bottom: 5 })}
${inset({ x: left, y: top, w: 46, h: 46, r: 14, fill: tint.bg, edge: tint.edge, depth: 4 })}
${icon(project.icon, { x: left + 12, y: top + 12, size: 22, color: tint.ink })}
<text x="${textX}" y="${r1(titleBase)}" ${font(TITLE.id, TITLE.size)} fill="${c.ink}">${escape(project.name)}</text>
<text x="${r1(right + STATUS.spacing)}" y="${r1(titleBase)}" ${font(STATUS.id, STATUS.size, `letter-spacing="${STATUS.spacing}"`)} fill="${c.muted}" text-anchor="end">${escape(status)}</text>
<text x="${textX}" y="${r1(baseline(TEXT.id, TEXT.size, textTop, TEXT.line))}" ${font(TEXT.id, TEXT.size)} fill="${c.muted}">${escape(project.summary)}</text>
${segments}`;

  const css = '.grow{transform-box:fill-box;transform-origin:left center;animation:grow 1.1s cubic-bezier(.2,.8,.2,1) both}@keyframes grow{from{transform:scaleX(0)}to{transform:scaleX(1)}}';
  const alt = `${project.name}: ${project.summary}. Step ${step} of ${total}, ${status.toLowerCase()}.`;
  return { svg: { width: CARD_W + AFTER_X, height: CARD_H + AFTER_Y, title: alt, fonts: [TITLE.id, TEXT.id], css, body }, alt };
};

module.exports = { render };
