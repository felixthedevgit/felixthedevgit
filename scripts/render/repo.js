'use strict';

// Graphics for the README of a single repository, see templates/: a banner
// with the project's key and name, a row of badges, a status card with the
// four steps, and the 1280 by 640 social preview GitHub shows when a link
// to the repository is shared.

const { escape, r1, key, inset, frame } = require('../svg');
const { measure, baseline, font } = require('../fonts');
const { logo } = require('../logo');
const { icon } = require('../icons');
const { THEMES, KEYS } = require('../theme');

const tintOf = (theme, name) => {
  const tint = theme.tints[name];
  if (!tint) throw new Error(`Unknown tint "${name}".`);
  return { ...tint, key: KEYS[name] };
};

// Greedy line breaking for one paragraph of text.
const wrap = (text, id, size, width) => {
  const lines = [];
  let line = '';
  for (const word of String(text).split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (line && measure(next, id, size) > width) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
};

// Banner: the project's icon on a big key, name and one line, the logo in
// the corner. 840 wide, shown at the width of the README.
const banner = (theme, repo) => {
  const W = 840;
  const H = 145;
  const t = tintOf(theme, repo.tint);
  const left = 30;
  const top = 28;
  const titleSize = 42;
  const textX = left + 84 + 20;
  const lineTop = top + (84 - (titleSize + 2 + 25.5)) / 2;
  const titleBase = baseline('nunito-900', titleSize, lineTop, titleSize);
  const subBase = baseline('nunito-800', 17, lineTop + titleSize + 2, 25.5);
  const room = W - textX - 30 - 40 - 20;
  if (measure(repo.name, 'nunito-900', titleSize, -1.26) > room || measure(repo.summary, 'nunito-800', 17) > room) {
    throw new Error('Name or summary is too long for the banner.');
  }
  const ink = theme.name === 'light' ? t.key.ink : theme.card.ink;
  const body = `${frame({ w: W, h: H, r: 24, fill: t.bg, line: t.edge, border: 2, bottom: 7 })}
${inset({ x: left, y: top, w: 84, h: 84, r: 24, fill: t.key.fill, edge: t.key.edge, depth: 7 })}
${icon(repo.icon, { x: left + 21, y: top + 19.5, size: 42, color: t.key.ink })}
<text x="${textX}" y="${r1(titleBase)}" ${font('nunito-900', titleSize, 'letter-spacing="-1.26"')} fill="${ink}">${escape(repo.name)}</text>
<text x="${textX}" y="${r1(subBase)}" ${font('nunito-800', 17)} fill="${t.ink}">${escape(repo.summary)}</text>
${logo({ x: W - 30 - 40, y: top, size: 40, colors: { face: '#FFFFFF', edge: t.key.edge, ink: t.key.ink } })}`;
  const alt = `${repo.name}: ${repo.summary}`;
  return { svg: { width: W, height: H, title: alt, fonts: ['nunito-800', 'nunito-900'], body }, alt };
};

// Badges: a dark label and a pastel value, like shields but drawn here.
const badges = (theme, list) => {
  const id = 'nunito-900';
  const size = 12.5;
  const h = 25;
  const labelBg = theme.name === 'light' ? '#27273A' : '#383A50';
  const labelInk = theme.name === 'light' ? '#FFFFFF' : '#ECECF4';
  let x = 0;
  const base = r1(baseline(id, size, 0, h));
  const body = list.map((b) => {
    const t = tintOf(theme, b.tint);
    const lw = measure(b.label, id, size) + 18;
    const vw = measure(b.value, id, size) + 18;
    const r = h / 2;
    const svg = `<rect x="${r1(x)}" y="0" width="${r1(lw + vw)}" height="${h}" rx="${r}" fill="${t.bg}"/>
<path d="M${r1(x + r)} 0h${r1(lw - r)}v${h}h${r1(-(lw - r))}a${r} ${r} 0 0 1 0 ${-h}z" fill="${labelBg}"/>
<text x="${r1(x + 9)}" y="${base}" ${font(id, size)} fill="${labelInk}">${escape(b.label)}</text>
<text x="${r1(x + lw + 9)}" y="${base}" ${font(id, size)} fill="${t.ink}">${escape(b.value)}</text>`;
    x += lw + vw + 6;
    return svg;
  }).join('\n');
  const alt = list.map((b) => `${b.label}: ${b.value}`).join(', ');
  return { svg: { width: Math.ceil(x - 6), height: h, title: alt, fonts: [id], body }, alt };
};

// Status: four segments and the names of the steps, the current one in
// the project's colour.
const status = (theme, repo) => {
  const W = 840;
  const c = theme.card;
  const t = tintOf(theme, repo.tint);
  const steps = repo.steps || ['Idea', 'Build', 'Alpha', 'Live'];
  const step = Math.max(0, Math.min(steps.length, Number(repo.step) || 0));
  const left = 20;
  const inner = W - 2 * left;
  const gap = 6;
  const segW = (inner - gap * (steps.length - 1)) / steps.length;
  const barTop = 18;
  const segs = steps.map((_, k) => `<rect x="${r1(left + k * (segW + gap))}" y="${barTop}" width="${r1(segW)}" height="12" rx="6" fill="${k < step ? t.key.fill : c.track}"/>`).join('\n');
  const id = 'nunito-900';
  const widths = steps.map((s) => measure(s, id, 12));
  const space = (inner - widths.reduce((a, b) => a + b, 0)) / Math.max(1, steps.length - 1);
  let x = left;
  const base = r1(baseline(id, 12, barTop + 12 + 8, 18));
  const labels = steps.map((s, k) => {
    const svg = `<text x="${r1(x)}" y="${base}" ${font(id, 12)} fill="${k === step - 1 ? t.ink : c.muted}">${escape(s)}</text>`;
    x += widths[k] + space;
    return svg;
  }).join('\n');
  const H = 2 + 16 + 12 + 8 + 18 + 16 + 5;
  const alt = `Step ${step} of ${steps.length}: ${steps[step - 1] || 'not started'}`;
  return { svg: { width: W, height: H, title: alt, fonts: [id], body: `${frame({ w: W, h: H, r: 18, fill: c.bg, line: c.line, border: 2, bottom: 5 })}\n${segs}\n${labels}` }, alt };
};

// Social preview, 1280 by 640, light only: GitHub shows it on other sites
// that know nothing about dark mode. Upload it as PNG in the repository
// settings (Settings, General, Social preview).
const social = (repo) => {
  const theme = THEMES.light;
  const t = tintOf(theme, repo.tint);
  const W = 1280;
  const H = 640;
  const s = repo.social || {};
  const left = 72;
  const colW = W - left - 40 - 360 - 72;

  let titleSize = 112;
  const titleW = measure(repo.name, 'nunito-900', titleSize, -0.04 * titleSize);
  if (titleW > colW) titleSize = Math.floor((titleSize * colW) / titleW);
  const subLines = wrap(repo.summary, 'nunito-800', 30, Math.min(640, colW));
  const pills = s.pills || [];
  const blockH = 48 + 18 + titleSize * 0.95 + 18 + subLines.length * 37.5 + (pills.length ? 18 + 8 + 41 : 0);
  let y = (H - 16 - blockH) / 2;

  const head = `${logo({ x: left, y: r1(y), size: 48 })}
<text x="${left + 60}" y="${r1(baseline('mono-700', 20, y, 48))}" ${font('mono-700', 20)} fill="${t.ink}">${escape(repo.repo || repo.name)}</text>`;
  y += 48 + 18;
  const title = `<text x="${left}" y="${r1(baseline('nunito-900', titleSize, y, titleSize * 0.95))}" ${font('nunito-900', titleSize, `letter-spacing="${r1(-0.04 * titleSize)}"`)} fill="${t.key.ink}">${escape(repo.name)}</text>`;
  y += titleSize * 0.95 + 18;
  const sub = subLines.map((line, k) => `<text x="${left}" y="${r1(baseline('nunito-800', 30, y + k * 37.5, 37.5))}" ${font('nunito-800', 30)} fill="${t.ink}">${escape(line)}</text>`).join('\n');
  y += subLines.length * 37.5 + 26;
  let px = left;
  const pillSvg = pills.map((p) => {
    const pt = p.tint ? tintOf(theme, p.tint) : null;
    const w = measure(p.text, 'nunito-900', 18) + 32;
    const svg = `${inset({ x: px, y, w, h: 41, r: 20.5, fill: pt ? pt.bg : '#FFFFFF', edge: pt ? pt.edge : t.edge, depth: 4 })}
<text x="${r1(px + w / 2)}" y="${r1(baseline('nunito-900', 18, y, 41))}" ${font('nunito-900', 18)} fill="${pt ? pt.ink : t.ink}" text-anchor="middle">${escape(p.text)}</text>`;
    px += w + 10;
    return svg;
  }).join('\n');

  // The picture on the right: a phone-like card with a short checklist,
  // a small key with a bolt and one feature on a pill.
  // Inside the card: 3 px outline plus 22 px padding at the sides, 34 px
  // at top and bottom, a 22 px title, then rows of 30 px every 46 px.
  const inX = 3 + 22;
  const inTop = 3 + 34;
  const rows = [120, 90, 130, 100];
  const done = Math.max(0, Math.min(rows.length, Number(s.done ?? 2)));
  const rowsTop = inTop + (s.cardTitle ? 33 + 16 : 0);
  const list = rows.map((w, k) => {
    const ry = rowsTop + k * 46;
    const circle = k < done
      ? `<circle cx="${inX + 15}" cy="${ry + 15}" r="15" fill="${KEYS.mint.fill}"/>${icon('check', { x: inX + 7, y: ry + 7, size: 16, color: KEYS.mint.ink, stroke: 3.4 })}`
      : `<circle cx="${inX + 15}" cy="${ry + 15}" r="13.5" fill="none" stroke="#E2E0F0" stroke-width="3"/>`;
    return `${circle}<rect x="${inX + 30 + 10}" y="${ry + 8.5}" width="${w}" height="13" rx="6.5" fill="${theme.card.track}"/>`;
  }).join('\n');
  const phoneTitle = s.cardTitle ? `<text x="${inX}" y="${r1(baseline('nunito-900', 22, inTop, 33))}" ${font('nunito-900', 22)} fill="${theme.card.ink}">${escape(s.cardTitle)}</text>` : '';
  const btnTop = 470 - 10 - 34 - 50;
  const button = s.button ? `${key({ x: inX, y: btnTop, w: 240 - 2 * inX, h: 50, r: 16, fill: KEYS.mint.fill, edge: KEYS.mint.edge, depth: 5 })}
<text x="${r1(120 + 0.4)}" y="${r1(baseline('nunito-900', 16, btnTop, 50))}" ${font('nunito-900', 16, 'letter-spacing="0.8"')} fill="${KEYS.mint.ink}" text-anchor="middle">${escape(String(s.button).toUpperCase())}</text>` : '';
  const phone = `<g transform="translate(60 10) rotate(4 120 235)">
${frame({ w: 240, h: 470, r: 40, fill: '#FFFFFF', line: t.edge, border: 3, bottom: 10 })}
${phoneTitle}
${list}
${button}
</g>`;
  const bolt = `<g transform="translate(0 70) rotate(-10 38 38)">${inset({ x: 0, y: 0, w: 76, h: 76, r: 22, fill: theme.tints.butter.bg, edge: theme.tints.butter.edge, depth: 6 })}${icon('bolt', { x: 20, y: 18, size: 36, color: theme.tints.butter.ink, stroke: 2.2 })}</g>`;
  let feature = '';
  if (s.feature) {
    const fw = measure(s.feature, 'nunito-900', 18) + 36 + 4;
    const lav = theme.tints.lavender;
    feature = `<g transform="translate(270 330) rotate(6 ${r1(fw / 2)} 25)">${frame({ w: fw, h: 51, r: 25.5, fill: lav.bg, line: lav.edge, border: 2, bottom: 6 })}
<text x="${r1(fw / 2)}" y="${r1(baseline('nunito-900', 18, 2, 43))}" ${font('nunito-900', 18)} fill="${lav.ink}" text-anchor="middle">${escape(s.feature)}</text></g>`;
  }

  const body = `<rect width="${W}" height="${H}" fill="${t.bg}"/>
${head}
${title}
${sub}
${pillSvg}
<g transform="translate(${W - 72 - 360} 70)">
${phone}
${bolt}
${feature}
</g>`;
  const alt = `${repo.name}: ${repo.summary}`;
  return { svg: { width: W, height: H, title: alt, fonts: ['nunito-800', 'nunito-900', 'mono-700'], body }, alt };
};

module.exports = { banner, badges, status, social };
