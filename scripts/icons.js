'use strict';

// Line icons on a 24 by 24 grid, drawn with round caps and joins in the
// ink of the tile they sit on. profile.json refers to them by name.
const ICONS = {
  dumbbell: '<path d="M6 8v8M18 8v8M3 10.5v3M21 10.5v3M6 12h12"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  dice: '<rect x="4" y="4" width="16" height="16" rx="4"/><path d="M9 9h.01M15 15h.01M12 12h.01M15 9h.01M9 15h.01"/>',
  browser: '<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M3 9h18"/>',
  bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
};

// x, y: top left corner, size in pixels, stroke width in grid units.
const icon = (name, { x, y, size = 24, color, stroke = 2.4 }) => {
  const shape = ICONS[name];
  if (!shape) throw new Error(`Unknown icon "${name}" in profile.json. Known: ${Object.keys(ICONS).join(', ')}.`);
  const s = Math.round((size / 24) * 10000) / 10000;
  return `<g transform="translate(${x} ${y}) scale(${s})" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round">${shape}</g>`;
};

module.exports = { ICONS, icon };
