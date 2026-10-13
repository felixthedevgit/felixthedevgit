#!/usr/bin/env node
'use strict';

// Draws the graphics for one repository's README from a small JSON file,
// in the same style and with the same fonts as this profile. Not part of
// the daily build.
//
//   node scripts/repo-card.js templates/repo.example.json [outDir]
//
// Writes banner, badges and status (light and dark) and social-preview.svg
// into outDir (default templates/out/<id>/). Copy them into the other
// repository's .github/ folder and start its README from
// templates/repo-readme.md. GitHub wants the social preview as PNG, for
// example: chrome --headless=new --window-size=1280,640
//   --screenshot=social-preview.png social-preview.svg

const fs = require('node:fs');
const path = require('node:path');
const { THEMES } = require('./theme');
const { document } = require('./svg');
const repo = require('./render/repo');

const [input, outArg] = process.argv.slice(2);
if (!input) {
  console.error('Usage: node scripts/repo-card.js <repo.json> [outDir]');
  process.exit(1);
}
const config = JSON.parse(fs.readFileSync(input, 'utf8'));
const out = outArg || path.join(__dirname, '..', 'templates', 'out', config.id || 'repo');
fs.mkdirSync(out, { recursive: true });

const save = (name, result) => {
  fs.writeFileSync(path.join(out, name), document(result.svg));
  console.log(`written: ${path.join(out, name)}`);
};
for (const theme of Object.values(THEMES)) {
  save(`banner-${theme.name}.svg`, repo.banner(theme, config));
  if (config.badges && config.badges.length) save(`badges-${theme.name}.svg`, repo.badges(theme, config.badges));
  save(`status-${theme.name}.svg`, repo.status(theme, config));
}
save('social-preview.svg', repo.social(config));
