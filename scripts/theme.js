'use strict';

// Two palettes, one per GitHub colour scheme. The README picks the file
// through <picture> and a prefers-color-scheme media query, so every graphic
// is drawn twice. All colours live here so that a new renderer cannot drift
// off into its own shade of purple.
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
  },
};

module.exports = { THEMES };
