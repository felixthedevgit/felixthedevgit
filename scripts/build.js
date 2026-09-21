#!/usr/bin/env node
'use strict';

// Draws every graphic the profile README shows. With PROFILE_TOKEN set it
// fetches fresh numbers from GitHub and keeps them in data/contributions.json,
// without a token (or with --offline) it redraws from that file. The
// workflow in .github/workflows/update-profile.yml runs it once a day.

const fs = require('node:fs');
const path = require('node:path');
const { fetchProfile } = require('./github');
const { analyse } = require('./analyse');
const { THEMES } = require('./theme');
const { escape } = require('./svg');
const header = require('./render/header');
const skyline = require('./render/skyline');
const stats = require('./render/stats');
const skills = require('./render/skills');
const links = require('./render/links');

const ROOT = path.join(__dirname, '..');
const DATA_FILE = path.join(ROOT, 'data', 'contributions.json');
const README = path.join(ROOT, 'README.md');

const write = (file, content) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const before = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
  if (before === content) return;
  fs.writeFileSync(file, content);
  console.log(`written: ${path.relative(ROOT, file)}`);
};

// Without a token the stored numbers stay as they are. Fetching with a
// weaker token instead would quietly replace a complete calendar with one
// that lacks every private contribution, and the profile would look idle.
const loadData = async (profile) => {
  const token = process.env.PROFILE_TOKEN;
  const offline = process.argv.includes('--offline') || !token;
  if (offline) {
    if (!fs.existsSync(DATA_FILE)) {
      throw new Error('No PROFILE_TOKEN set and no stored numbers in data/contributions.json.');
    }
    if (!token) console.warn('Note: PROFILE_TOKEN is not set, drawing from the stored numbers.');
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  }
  const data = await fetchProfile(profile.login, token);
  write(DATA_FILE, `${JSON.stringify(data, null, 2)}\n`);
  return data;
};

const stamp = (iso) => new Intl.DateTimeFormat('en-US', {
  day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Berlin',
}).format(new Date(iso));

// The README is written by hand except for two marked blocks: the link
// pills, which follow profile.json, and the date line at the bottom.
const replaceBlock = (readme, name, text) => {
  const pattern = new RegExp(`(<!-- ${name}:start -->)[\\s\\S]*?(<!-- ${name}:end -->)`);
  if (!pattern.test(readme)) throw new Error(`README.md has no ${name} marker.`);
  return readme.replace(pattern, (match, start, end) => `${start}${text}${end}`);
};

// An image in a README can only be one link as a whole, so every pill is
// its own file wrapped in its own <a>. A link without a URL (Discord has
// no public profile pages) is shown as a plain pill.
const linksBlock = (list) => list.map((link) => {
  const alt = escape(`${link.label}: ${link.handle}`);
  const picture = `<picture><source media="(prefers-color-scheme: dark)" srcset="assets/link-${link.id}-dark.svg"><img alt="${alt}" src="assets/link-${link.id}-light.svg" height="36"></picture>`;
  return link.url ? `<a href="${escape(link.url)}">${picture}</a>` : picture;
}).join('\n');

const main = async () => {
  const profile = JSON.parse(fs.readFileSync(path.join(ROOT, 'profile.json'), 'utf8'));
  const data = await loadData(profile);
  const summary = analyse(data.days);
  for (const theme of Object.values(THEMES)) {
    const asset = (name) => path.join(ROOT, 'assets', `${name}-${theme.name}.svg`);
    write(asset('header'), header.render(theme, profile));
    write(asset('skyline'), skyline.render(theme, summary));
    write(asset('stats'), stats.render(theme, summary));
    write(asset('skills'), skills.render(theme, profile));
    for (const link of profile.links || []) write(asset(`link-${link.id}`), links.render(theme, link));
  }
  let readme = fs.readFileSync(README, 'utf8');
  readme = replaceBlock(readme, 'links', `\n${linksBlock(profile.links || [])}\n`);
  readme = replaceBlock(readme, 'updated', `Updated ${stamp(data.fetchedAt)}`);
  write(README, readme);
  console.log(`${summary.total} contributions, ${summary.activeDays} active days, longest streak ${summary.longest}, favorite day ${summary.busiestWeekday}.`);
};

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
