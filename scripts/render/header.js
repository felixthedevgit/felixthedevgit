'use strict';

// The banner at the top: the logo, the greeting, one line about what I do
// with marker strokes under three words, and a small terminal on the right
// that types a command and prints a few lines about me, over and over.

const { escape, r1, frame } = require('../svg');
const { measure, baseline, font, face } = require('../fonts');
const { logo, css: logoCss } = require('../logo');

const W = 808;
const BORDER = 2;
const BOTTOM = 7;
const PAD_X = 32;
const PAD_Y = 30;
const GAP = 24;

const HEADLINE = { id: 'nunito-900', size: 44, line: 46.2, spacing: -1.1 };
const TAGLINE = { id: 'nunito-800', size: 19, line: 27.55 };
const MARK_PAD = 3;

// Terminal geometry, the same numbers as the design: 330 wide, a 32 px
// title bar, 13 px text on a 1.9 line height.
const TERM = { w: 330, bar: 32, padTop: 12, padBottom: 14, padX: 16, size: 13, line: 24.7, border: 2, bottom: 6, radius: 18 };
const MONO = 'mono-500';
const MONO_BOLD = 'mono-700';

// One loop of the terminal takes ten seconds. Percentages are of that loop:
// type the command, print the answers one by one, show the next prompt,
// hold, then clear and start over.
const LOOP = 10;

const terminalLines = (profile, age) => (profile.header.about || []).map((line) => {
  if (age === null) return line.replace(/,?\s*\{age\}/, '');
  return line.replace('{age}', String(age));
});

const terminal = (theme, profile, age) => {
  const t = theme.terminal;
  const lines = terminalLines(profile, age);
  const rows = lines.length + 2;
  const inner = TERM.bar + TERM.padTop + rows * TERM.line + TERM.padBottom;
  const h = TERM.border + inner + TERM.bottom;
  const charW = (face(MONO).advances.a / 1000) * TERM.size;
  const textX = TERM.border + TERM.padX;
  const rowTop = (i) => TERM.border + TERM.bar + TERM.padTop + i * TERM.line;
  const rowBase = (i) => r1(baseline(MONO, TERM.size, rowTop(i), TERM.line));
  const command = profile.header.command;
  const commandX = textX + 2 * charW;
  const typed = r1(command.length * charW);

  const prompt = (i) => `<text x="${textX}" y="${rowBase(i)}" ${font(MONO_BOLD, TERM.size)} fill="${t.prompt}">$</text>`;
  const cursorY = (i) => r1(rowTop(i) + (TERM.line - 15) / 2);

  const output = lines.map((line, k) => `<g class="t-out t-out${k + 1}"><text x="${textX}" y="${rowBase(k + 1)}" ${font(MONO, TERM.size)} fill="${t.output}">${escape(`→ ${line}`)}</text></g>`).join('\n');

  const last = lines.length + 1;
  const body = `<rect width="${TERM.w}" height="${r1(h)}" rx="${TERM.radius}" fill="${t.edge}"/>
<g clip-path="url(#term-clip)">
<rect x="${TERM.border}" y="${TERM.border}" width="${TERM.w - 2 * TERM.border}" height="${r1(inner)}" fill="${t.bg}"/>
<rect x="${TERM.border}" y="${TERM.border}" width="${TERM.w - 2 * TERM.border}" height="${TERM.bar}" fill="${t.bar}"/>
</g>
${t.dots.map((c, k) => `<circle cx="${TERM.border + 12 + 5 + k * 16}" cy="${TERM.border + TERM.bar / 2}" r="5" fill="${c}"/>`).join('')}
${prompt(0)}
<g clip-path="url(#term-clip)">
<text x="${r1(commandX)}" y="${rowBase(0)}" ${font(MONO, TERM.size)} fill="${t.text}">${escape(command)}</text>
<g class="t-type">
<rect x="${r1(commandX)}" y="${r1(rowTop(0))}" width="${r1(typed + 4 * charW)}" height="${TERM.line}" fill="${t.bg}"/>
<rect class="t-caret" x="${r1(commandX)}" y="${cursorY(0)}" width="8" height="15" fill="${t.text}"/>
</g>
</g>
${output}
<g class="t-out t-next">${prompt(last)}<rect class="t-blink" x="${r1(textX + 2 * charW)}" y="${cursorY(last)}" width="8" height="15" fill="${t.text}"/></g>`;

  const step = (k) => 18 + k * 12;
  const css = [
    `.t-type{transform:translateX(${typed}px);animation:t-type ${LOOP}s steps(${command.length},end) infinite}`,
    `@keyframes t-type{0%,4%{transform:translateX(0)}16%,90%{transform:translateX(${typed}px)}94%,100%{transform:translateX(0)}}`,
    `.t-caret{opacity:0;animation:t-caret ${LOOP}s steps(1) infinite}`,
    '@keyframes t-caret{0%,17%{opacity:1}18%,100%{opacity:0}}',
    ...lines.map((_, k) => `.t-out${k + 1}{animation:t-out${k + 1} ${LOOP}s infinite}@keyframes t-out${k + 1}{0%,${step(k)}%{opacity:0}${step(k) + 4}%,90%{opacity:1}94%,100%{opacity:0}}`),
    `.t-next{animation:t-next ${LOOP}s infinite}@keyframes t-next{0%,${step(lines.length)}%{opacity:0}${step(lines.length) + 1}%,90%{opacity:1}94%,100%{opacity:0}}`,
    '.t-blink{animation:logo-blink 1.1s steps(1) infinite}',
  ].join('');

  return { w: TERM.w, h, body, css, clip: `<clipPath id="term-clip"><rect x="${TERM.border}" y="${TERM.border}" width="${TERM.w - 2 * TERM.border}" height="${r1(inner)}" rx="${TERM.radius - TERM.border}"/></clipPath>`, lines };
};

// The tagline as segments: plain strings, and marked words with a tint.
// Returns the drawn text and the marker strokes behind it. A marker is the
// lower band of a highlighter (58 to 92 percent of the text's height), so
// it underlines the word rather than boxing it in.
const tagline = (theme, segments, x, base) => {
  const m = face(TAGLINE.id);
  const asc = (m.ascender / m.upem) * TAGLINE.size;
  const full = ((m.ascender - m.descender) / m.upem) * TAGLINE.size;
  const top = base - asc + 0.58 * full;
  const height = 0.34 * full;
  let cursor = x;
  const spans = [];
  const marks = [];
  for (const seg of segments) {
    const text = typeof seg === 'string' ? seg : seg.text;
    const width = measure(text, TAGLINE.id, TAGLINE.size);
    if (typeof seg === 'string') {
      spans.push(`<tspan x="${r1(cursor)}">${escape(text)}</tspan>`);
      cursor += width;
    } else {
      const tint = theme.tints[seg.tint];
      if (!tint) throw new Error(`Unknown tint "${seg.tint}" in profile.json.`);
      marks.push(`<rect class="mark mark${marks.length + 1}" x="${r1(cursor)}" y="${r1(top)}" width="${r1(width + 2 * MARK_PAD)}" height="${r1(height)}" fill="${tint.marker}"/>`);
      spans.push(`<tspan x="${r1(cursor + MARK_PAD)}">${escape(text)}</tspan>`);
      cursor += width + 2 * MARK_PAD;
    }
  }
  const text = `<text y="${r1(base)}" ${font(TAGLINE.id, TAGLINE.size)} fill="${theme.banner.ink}">${spans.join('')}</text>`;
  return { width: cursor - x, svg: `${marks.join('\n')}\n${text}`, count: marks.length };
};

const plainTagline = (segments) => segments.map((s) => (typeof s === 'string' ? s : s.text)).join('');

const render = (theme, profile, { age = null } = {}) => {
  const b = theme.banner;
  const term = terminal(theme, profile, age);
  const leftH = 64 + 12 + HEADLINE.line + 12 + TAGLINE.line;
  const contentH = Math.max(term.h, leftH);
  const H = Math.round(BORDER + PAD_Y + contentH + PAD_Y + BOTTOM);
  const top = BORDER + PAD_Y;
  const left = BORDER + PAD_X;
  const leftTop = top + (contentH - leftH) / 2;
  const termX = W - BORDER - PAD_X - TERM.w;
  const termY = top + (contentH - term.h) / 2;
  const room = termX - GAP - left;

  const greeting = profile.header.greeting;
  const headlineW = measure(greeting, HEADLINE.id, HEADLINE.size, HEADLINE.spacing);
  const headTop = leftTop + 64 + 12;
  const headBase = baseline(HEADLINE.id, HEADLINE.size, headTop, HEADLINE.line);
  const tagTop = headTop + HEADLINE.line + 12;
  const tagBase = baseline(TAGLINE.id, TAGLINE.size, tagTop, TAGLINE.line);
  const tag = tagline(theme, profile.header.tagline, left, tagBase);
  if (headlineW > room || tag.width > room) {
    throw new Error(`The greeting or tagline is wider than the ${Math.floor(room)} px next to the terminal. Shorten it in profile.json.`);
  }

  const css = [
    logoCss,
    '.rise{animation:rise .7s cubic-bezier(.2,.8,.2,1) both}',
    '.rise2{animation-delay:.1s}.rise3{animation-delay:.2s}',
    '@keyframes rise{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}',
    '.mark{transform-box:fill-box;transform-origin:left center;animation:mark .8s cubic-bezier(.6,0,.3,1) both}',
    ...Array.from({ length: tag.count }, (_, k) => `.mark${k + 1}{animation-delay:${(0.6 + k * 0.15).toFixed(2)}s}`),
    '@keyframes mark{from{transform:scaleX(0)}to{transform:scaleX(1)}}',
    term.css,
  ].join('');

  const body = `<defs>${term.clip}</defs>
${frame({ w: W, h: H, r: 26, fill: b.bg, line: b.edge, border: BORDER, bottom: BOTTOM })}
<g class="rise">${logo({ x: left, y: r1(leftTop), size: 64, blink: true })}</g>
<g class="rise rise2"><text x="${left}" y="${r1(headBase)}" ${font(HEADLINE.id, HEADLINE.size, `letter-spacing="${HEADLINE.spacing}"`)} fill="${b.ink}">${escape(greeting)}</text></g>
<g class="rise rise3">
${tag.svg}
</g>
<g transform="translate(${r1(termX)} ${r1(termY)}) rotate(2 ${TERM.w / 2} ${r1(term.h / 2)})">
${term.body}
</g>`;

  const about = term.lines.join(', ');
  const title = `${greeting} ${plainTagline(profile.header.tagline)} A small terminal types ${profile.header.command} and answers: ${about}.`;
  return {
    svg: { width: W, height: H, title, fonts: ['nunito-800', 'nunito-900', MONO, MONO_BOLD], css, body },
    alt: title,
  };
};

module.exports = { render, W };
