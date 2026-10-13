'use strict';

// The Pastell palette, once for GitHub's light and once for its dark
// scheme. The README picks the file through <picture> and a
// prefers-color-scheme media query, so every graphic is drawn twice. All
// colours live here so that a renderer cannot drift off into its own shade.
//
// Every surface is flat. The "3D key" look comes from a darker edge under
// a shape, never from a gradient, a glow or transparency.
//
// tints: one pastel per topic, each with a surface (bg), a darker bottom
// edge, an ink for text on it, a stronger fill for progress segments and a
// marker colour for the highlighter stroke under a word.
const TINTS = {
  light: {
    mint: { bg: '#D3F5E4', edge: '#9EDFBF', ink: '#17603F', fill: '#7BE0AE', marker: '#9EDFBF' },
    sky: { bg: '#D6ECFF', edge: '#9DCBF5', ink: '#1D5A93', fill: '#8EC9FF', marker: '#9DCBF5' },
    lavender: { bg: '#E3DEFF', edge: '#BDB3F7', ink: '#4936B8', fill: '#B4A7FF', marker: '#CFC6FF' },
    butter: { bg: '#FFF2BF', edge: '#EDD27A', ink: '#735B00', fill: '#FFE07A', marker: '#EDD27A' },
    peach: { bg: '#FFE0CC', edge: '#F7B994', ink: '#93441A', fill: '#FFB98E', marker: '#F7B994' },
    pink: { bg: '#FFDCE8', edge: '#F4ABC6', ink: '#962E58', fill: '#FFA8C5', marker: '#F4ABC6' },
  },
  dark: {
    mint: { bg: '#1D3A2D', edge: '#2C5A45', ink: '#9EEBC3', fill: '#7BE0AE', marker: '#2E7656' },
    sky: { bg: '#1B3045', edge: '#2A4B6B', ink: '#A9D4FF', fill: '#8EC9FF', marker: '#2F5E8C' },
    lavender: { bg: '#2A2650', edge: '#403A78', ink: '#C9C0FF', fill: '#B4A7FF', marker: '#4F478F' },
    butter: { bg: '#39321A', edge: '#574C24', ink: '#FFE38A', fill: '#FFE07A', marker: '#6E5F2A' },
    peach: { bg: '#40281C', edge: '#633E2B', ink: '#FFC6A3', fill: '#FFB98E', marker: '#80492C' },
    pink: { bg: '#42202E', edge: '#663146', ink: '#FFB8D0', fill: '#FFA8C5', marker: '#7D3553' },
  },
};

// The solid keys of the icon family (big icon tiles, the repo banner): a
// stronger fill, its darker edge and the ink drawn on it. The same in both
// schemes, like the mint logo key.
const KEYS = {
  mint: { fill: '#7BE0AE', edge: '#46BD84', ink: '#0E3B26' },
  sky: { fill: '#8EC9FF', edge: '#5BA5EC', ink: '#0B2E52' },
  lavender: { fill: '#B4A7FF', edge: '#8E7CF0', ink: '#22186B' },
  butter: { fill: '#FFE07A', edge: '#E3BC3A', ink: '#4A3B00' },
  peach: { fill: '#FFB98E', edge: '#EE915C', ink: '#4A1F05' },
  pink: { fill: '#FFA8C5', edge: '#E9779F', ink: '#4D1530' },
};

// The terminal and the primary key look the same in both schemes: a dark
// terminal sits well on either banner, and the mint key is the brand.
const TERMINAL = {
  bg: '#27273A',
  edge: '#15151F',
  bar: '#CFC6FF',
  dots: ['#F4ABC6', '#EDD27A', '#9EDFBF'],
  text: '#ECECF4',
  prompt: '#B4A7FF',
  output: '#7BE0AE',
};
const PRIMARY = { bg: '#7BE0AE', edge: '#46BD84', ink: '#0E3B26' };

const THEMES = {
  light: {
    name: 'light',
    banner: { bg: '#E3DEFF', edge: '#BDB3F7', ink: '#22186B' },
    card: { bg: '#FFFFFF', line: '#E7E6F2', ink: '#27273A', muted: '#646478', track: '#EEEDF5' },
    tints: TINTS.light,
    terminal: TERMINAL,
    primary: PRIMARY,
    keys: KEYS,
  },
  dark: {
    name: 'dark',
    banner: { bg: '#2A2650', edge: '#403A78', ink: '#F1EEFF' },
    card: { bg: '#1E1F2A', line: '#383A50', ink: '#ECECF4', muted: '#A3A4B9', track: '#2E3042' },
    tints: TINTS.dark,
    terminal: TERMINAL,
    primary: PRIMARY,
    keys: KEYS,
  },
};

module.exports = { THEMES, KEYS };
