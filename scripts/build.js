#!/usr/bin/env node
'use strict';

// Draws every graphic the profile README shows. With PROFILE_TOKEN set it
// fetches fresh numbers from GitHub and keeps them in data/contributions.json,
// without a token (or with --offline) it redraws from that file. The
// workflow in .github/workflows/update-profile.yml runs it once a day.
//
// The age in the header terminal comes from the BIRTHDATE variable
// (YYYY-MM-DD, set as a repository variable for the workflow). It is not
// stored in this public repository; without it the age is left out.

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { fetchProfile } = require('./github');
const { analyse } = require('./analyse');
const { THEMES } = require('./theme');
const { escape, document } = require('./svg');
const header = require('./render/header');
const pills = require('./render/pills');
const project = require('./render/project');
const stats = require('./render/stats');
const button = require('./render/button');

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

// Today's date in Germany, which is where the birthday happens.
const ageToday = (birthdate) => {
  if (!birthdate) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthdate.trim());
  if (!m) throw new Error('BIRTHDATE must look like YYYY-MM-DD.');
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date()).map((p) => [p.type, Number(p.value)]));
  const [, year, month, day] = m.map(Number);
  const before = parts.month < month || (parts.month === month && parts.day < day);
  return parts.year - year - (before ? 1 : 0);
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

// Light and dark file for one graphic. Every image has a fixed width so
// that it shows at its drawn size on a desktop; GitHub's max-width: 100%
// shrinks it on a phone. align="top" removes the gap an inline image gets
// below its baseline.
const picture = (files, name, alt, width) => `<picture><source media="(prefers-color-scheme: dark)" srcset="assets/${files.dark[name]}"><img alt="${escape(alt)}" src="assets/${files.light[name]}" width="${width}" align="top"></picture>`;
const link = (url, inner) => `<a href="${escape(url)}">${inner}</a>`;
const paragraph = (lines) => `<p>\n${[].concat(lines).join('\n')}\n</p>`;

const main = async () => {
  const profile = JSON.parse(fs.readFileSync(path.join(ROOT, 'profile.json'), 'utf8'));
  const data = await loadData(profile);
  const summary = analyse(data.days);
  const age = ageToday(process.env.BIRTHDATE);

  const files = { light: {}, dark: {} };
  const meta = {};
  const keep = new Set();
  const draw = (theme, name, result) => {
    const svg = document(result.svg);
    const file = `${name}-${theme.name}.${fingerprint(svg)}.svg`;
    files[theme.name][name] = file;
    meta[name] = { alt: result.alt, width: result.svg.width };
    keep.add(file);
    write(path.join(ASSETS, file), svg);
  };
  // A row that comes in pieces gets one file per piece: name-1, name-2, ...
  const drawAll = (theme, name, results) => results.map((result, k) => {
    const piece = `${name}-${k + 1}`;
    draw(theme, piece, result);
    return piece;
  });
  const names = {};
  for (const theme of Object.values(THEMES)) {
    draw(theme, 'header', header.render(theme, profile, { age }));
    names.build = drawAll(theme, 'build', pills.build(theme, profile.build));
    for (const p of profile.projects) draw(theme, `project-${p.id}`, project.render(theme, p, profile.steps));
    names.toolbox = drawAll(theme, 'toolbox', pills.toolbox(theme, profile.toolbox));
    draw(theme, 'stats-figures', stats.figures(theme, summary));
    draw(theme, 'stats-weeks', stats.weeks(theme, summary));
    for (const b of profile.buttons) draw(theme, `button-${b.id}`, button.render(theme, b));
  }
  // Older fingerprints are no longer referenced and would pile up.
  for (const file of fs.readdirSync(ASSETS)) {
    if (file.endsWith('.svg') && !keep.has(file)) {
      fs.unlinkSync(path.join(ASSETS, file));
      console.log(`removed: assets/${file}`);
    }
  }

  const pic = (name) => picture(files, name, meta[name].alt, meta[name].width);
  let readme = fs.readFileSync(README, 'utf8');
  readme = replaceBlock(readme, 'header', paragraph(link(profile.website, pic('header'))));
  readme = replaceBlock(readme, 'build', paragraph(names.build.map(pic)));
  readme = replaceBlock(readme, 'projects', paragraph(profile.projects.map((p) => link(p.url, pic(`project-${p.id}`)))));
  readme = replaceBlock(readme, 'toolbox', paragraph(names.toolbox.map(pic)));
  readme = replaceBlock(readme, 'stats', paragraph([pic('stats-figures'), pic('stats-weeks')]));
  readme = replaceBlock(readme, 'buttons', paragraph(profile.buttons.map((b) => link(b.url, pic(`button-${b.id}`)))));
  readme = readme.replace(/(<!-- updated:start -->)[\s\S]*?(<!-- updated:end -->)/, (m, a, b) => `${a}Updated ${stamp(data.fetchedAt)}${b}`);
  write(README, readme);

  const sizes = [...keep].map((f) => fs.statSync(path.join(ASSETS, f)).size);
  console.log(`${keep.size} graphics, largest ${Math.round(Math.max(...sizes) / 1024)} KB. Age ${age === null ? 'left out (no BIRTHDATE)' : age}.`);
  console.log(`${summary.total} contributions, ${summary.activeDays} active days, longest streak ${summary.longest}.`);
};

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
