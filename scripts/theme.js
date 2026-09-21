'use strict';

// Two palettes, one per GitHub colour scheme. The README picks the file
// through <picture> and a prefers-color-scheme media query, so every graphic
// is drawn twice. All colours live here so that a new renderer cannot drift
// off into its own shade of purple.
//
// levels: four shades for the contribution blocks, quiet to busy.
// plate and tile: the slab the blocks stand on and the empty days on it.
// shadow: what the side faces are mixed towards, sweep: the light that
// runs across the tops every few seconds.
// tints: one pastel pair (background, foreground) per skill category, in
// the order the categories appear in profile.json.
const THEMES = {
  light: {
    name: 'light',
    card: '#F7F4FF',
    cardEdge: '#E8E0FB',
    ink: '#3B2E63',
    muted: '#8577AE',
    accent: '#A78BFA',
    accentStrong: '#8B5CF6',
    accentSoft: '#DDD6FE',
    pink: '#F9A8D4',
    blob: '#C4B5FD',
    blobOpacity: 0.55,
    chipFill: 'rgba(255,255,255,0.55)',
    chipEdge: 'rgba(255,255,255,0.85)',
    gradient: ['#EDE0FF', '#DDD6FE', '#FBD0EA'],
    levels: ['#C4B5FD', '#A78BFA', '#8B5CF6', '#6D28D9'],
    plate: '#E4DDF8',
    tile: '#F0EBFF',
    tileLight: '#D9CDFF',
    shadow: '#3B2E63',
    sweep: '#FFFFFF',
    tints: [
      { bg: '#EDE9FE', fg: '#7C3AED' },
      { bg: '#FCE7F3', fg: '#DB2777' },
      { bg: '#D1FAE5', fg: '#059669' },
      { bg: '#FFEDD5', fg: '#EA580C' },
    ],
  },
  dark: {
    name: 'dark',
    card: '#17132A',
    cardEdge: '#2B2449',
    ink: '#EDE9FE',
    muted: '#A89CD3',
    accent: '#C4B5FD',
    accentStrong: '#B39DFB',
    accentSoft: '#2F2757',
    pink: '#F0ABFC',
    blob: '#7C5CE6',
    blobOpacity: 0.35,
    chipFill: 'rgba(255,255,255,0.08)',
    chipEdge: 'rgba(255,255,255,0.18)',
    gradient: ['#2A2050', '#33295F', '#4B2C5A'],
    levels: ['#5B4A9E', '#7E69D1', '#A78BFA', '#D9CEFF'],
    plate: '#221B3F',
    tile: '#2A2250',
    tileLight: '#4A3D85',
    shadow: '#0B0814',
    sweep: '#FFFFFF',
    tints: [
      { bg: '#2E2657', fg: '#C4B5FD' },
      { bg: '#4A2340', fg: '#F9A8D4' },
      { bg: '#1B3D33', fg: '#6EE7B7' },
      { bg: '#4A2E1B', fg: '#FDBA74' },
    ],
  },
};

module.exports = { THEMES };
