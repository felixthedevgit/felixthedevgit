#!/usr/bin/env node
'use strict';

// Draws every graphic the profile README shows. With PROFILE_TOKEN set it
// fetches fresh numbers from GitHub and keeps them in data/contributions.json,
// without a token (or with --offline) it redraws from that file. The
// workflow in .github/workflows/update-profile.yml runs it once a day.

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
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
const ASSETS = path.join(ROOT, 'assets');
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

// The file name carries a fingerprint of the content. GitHub caches the
// images of a README under their address for a while, so a redrawn file
// under the old name keeps showing the old picture. A new name is a new
// address, and the change is visible with the commit.
const fingerprint = (content) => crypto.createHash('sha256').update(content).digest('hex').slice(0, 8);

// The README is written by hand except for marked blocks, one per
// graphic, which follow the generated file names and profile.json.
const replaceBlock = (readme, name, text) => {
  const pattern = new RegExp(`(<!-- ${name}:start -->)[\\s\\S]*?(<!-- ${name}:end -->)`);
  if (!pattern.test(readme)) throw new Error(`README.md has no ${name} marker.`);
  return readme.replace(pattern, (match, start, end) => `${start}\n${text}\n${end}`);
};

// Every graphic sits in its own <p>: GitHub gives paragraphs a bottom
// margin, bare images would touch. align="top" removes the extra space an
// inline image gets below its baseline, so the gap is the paragraph
// margin alone and matches the gap between the tiles.
const picture = (files, name, alt) => [
  '<picture>',
  `  <source media="(prefers-color-scheme: dark)" srcset="assets/${files.dark[name]}">`,
  `  <img alt="${escape(alt)}" src="assets/${files.light[name]}" width="100%" align="top">`,
  '</picture>',
].join('\n');
const paragraph = (inner, align) => `<p${align ? ` align="${align}"` : ''}>\n${inner}\n</p>`;

// An image in a README can only be one link as a whole, so every pill is
// its own file wrapped in its own <a>.
const linksBlock = (files, list) => list.map((link) => {
  const alt = escape(`${link.label}: ${link.handle}`);
  const pic = `<picture><source media="(prefers-color-scheme: dark)" srcset="assets/${files.dark[`link-${link.id}`]}"><img alt="${alt}" src="assets/${files.light[`link-${link.id}`]}" height="36"></picture>`;
  return link.url ? `<a href="${escape(link.url)}">${pic}</a>` : pic;
}).join('\n');

// One heading and one graphic per skill category.
const skillsBlock = (files, profile) => (profile.categories || []).map((category) => {
  const names = (profile.skills || []).filter((s) => s.category === category.id).map((s) => s.name).join(', ');
  return `#### ${category.label}\n\n${paragraph(picture(files, `skills-${category.id}`, `${category.label}: ${names}, each with what I use it for and how much`))}`;
}).join('\n\n');

const main = async () => {
  const profile = JSON.parse(fs.readFileSync(path.join(ROOT, 'profile.json'), 'utf8'));
  const data = await loadData(profile);
  const summary = analyse(data.days);

  const files = { light: {}, dark: {} };
  const keep = new Set();
  const draw = (theme, name, svg) => {
    const file = `${name}-${theme.name}.${fingerprint(svg)}.svg`;
    files[theme.name][name] = file;
    keep.add(file);
    write(path.join(ASSETS, file), svg);
  };
  for (const theme of Object.values(THEMES)) {
    draw(theme, 'header', header.render(theme, profile));
    draw(theme, 'skyline', skyline.render(theme, summary));
    draw(theme, 'stats', stats.render(theme, summary));
    for (const category of profile.categories || []) draw(theme, `skills-${category.id}`, skills.render(theme, profile, category.id));
    for (const link of profile.links || []) draw(theme, `link-${link.id}`, links.render(theme, link));
  }
  // Older fingerprints are no longer referenced and would pile up.
  for (const file of fs.readdirSync(ASSETS)) {
    if (file.endsWith('.svg') && !keep.has(file)) {
      fs.unlinkSync(path.join(ASSETS, file));
      console.log(`removed: assets/${file}`);
    }
  }

  let readme = fs.readFileSync(README, 'utf8');
  readme = replaceBlock(readme, 'header', paragraph(`<a href="${escape(profile.website)}">\n${picture(files, 'header', `${profile.greeting} ${profile.tagline}.`)}\n</a>`, 'center'));
  readme = replaceBlock(readme, 'skyline', paragraph(picture(files, 'skyline', 'Contributions of the last 52 weeks as a 3D block landscape')));
  readme = replaceBlock(readme, 'stats', paragraph(picture(files, 'stats', 'Contributions, active days, longest streak and favorite day')));
  readme = replaceBlock(readme, 'skills', `\n${skillsBlock(files, profile)}\n`);
  readme = replaceBlock(readme, 'links', paragraph(linksBlock(files, profile.links || [])));
  readme = readme.replace(/(<!-- updated:start -->)[\s\S]*?(<!-- updated:end -->)/, (m, a, b) => `${a}Updated ${stamp(data.fetchedAt)}${b}`);
  write(README, readme);
  console.log(`${summary.total} contributions, ${summary.activeDays} active days, longest streak ${summary.longest}, favorite day ${summary.busiestWeekday}.`);
};

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
