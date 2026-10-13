'use strict';

// The logo, in one place. Every graphic that shows it calls logo() here,
// so a different mark only has to be drawn once, in this file.
//
// Current mark: the "Prompt-Taste", a mint key with a >_ prompt on it. The
// key face sits on its darker edge like the buttons, the underscore is the
// cursor and may blink. Drawn on a 64 by 64 grid and scaled to size.

const COLORS = { face: '#7BE0AE', edge: '#46BD84', ink: '#0E3B26' };

// CSS for the blinking cursor. Graphics that pass blink: true add this to
// their stylesheet (the build does that through logo.css).
const css = '.logo-cursor{animation:logo-blink 1.1s steps(1) infinite}@keyframes logo-blink{0%,50%{opacity:1}51%,100%{opacity:0}}';

// x, y: top left corner. size: edge length in pixels.
const logo = ({ x = 0, y = 0, size = 64, blink = false, colors = COLORS } = {}) => {
  const s = size / 64;
  return `<g transform="translate(${x} ${y}) scale(${Math.round(s * 10000) / 10000})">
<rect x="4" y="10" width="56" height="50" rx="15" fill="${colors.edge}"/>
<rect x="4" y="4" width="56" height="49" rx="15" fill="${colors.face}"/>
<path d="M17 20 l10 8.5 l-10 8.5" fill="none" stroke="${colors.ink}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
<rect${blink ? ' class="logo-cursor"' : ''} x="31" y="33" width="16" height="6" rx="3" fill="${colors.ink}"/>
</g>`;
};

module.exports = { logo, css, COLORS };
