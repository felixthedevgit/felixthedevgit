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
const header = require('./render/header');
const river = require('./render/river');
const stats = require('./render/stats');
const stack = require('./render/stack');

const ROOT = path.join(__dirname, '..');
const DATA_FILE = path.join(ROOT, 'data', 'contributions.json');
const README = path.join(ROOT, 'README.md');

const write = (file, content) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const before = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
  if (before === content) return;
  fs.writeFileSync(file, content);
  console.log(`geschrieben: ${path.relative(ROOT, file)}`);
};

// Without a token the stored numbers stay as they are. Fetching with a
// weaker token instead would quietly replace a complete calendar with one
// that lacks every private contribution, and the profile would look idle.
const loadData = async (profile) => {
  const token = process.env.PROFILE_TOKEN;
  const offline = process.argv.includes('--offline') || !token;
  if (offline) {
    if (!fs.existsSync(DATA_FILE)) {
      throw new Error('Kein PROFILE_TOKEN gesetzt und keine gespeicherten Zahlen in data/contributions.json.');
    }
    if (!token) console.warn('Hinweis: kein PROFILE_TOKEN gesetzt, die Grafiken entstehen aus den gespeicherten Zahlen.');
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  }
  const data = await fetchProfile(profile.login, token);
  write(DATA_FILE, `${JSON.stringify(data, null, 2)}\n`);
  return data;
};

const stamp = (iso) => new Intl.DateTimeFormat('de-DE', {
  day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Berlin',
}).format(new Date(iso));

// The README keeps one line between two markers, everything else in it is
// written by hand and stays untouched.
const updateReadme = (text) => {
  const readme = fs.readFileSync(README, 'utf8');
  const pattern = /(<!-- updated:start -->)[\s\S]*?(<!-- updated:end -->)/;
  if (!pattern.test(readme)) throw new Error('README.md hat keine updated-Markierung.');
  write(README, readme.replace(pattern, `$1${text}$2`));
};

const main = async () => {
  const profile = JSON.parse(fs.readFileSync(path.join(ROOT, 'profile.json'), 'utf8'));
  const data = await loadData(profile);
  const summary = analyse(data.days);
  for (const theme of Object.values(THEMES)) {
    const asset = (name) => path.join(ROOT, 'assets', `${name}-${theme.name}.svg`);
    write(asset('header'), header.render(theme, profile));
    write(asset('river'), river.render(theme, summary));
    write(asset('stats'), stats.render(theme, summary));
    write(asset('stack'), stack.render(theme, profile));
  }
  updateReadme(`Stand: ${stamp(data.fetchedAt)}`);
  console.log(`${summary.total} Beiträge, ${summary.activeDays} aktive Tage, längste Serie ${summary.longest}, Lieblingstag ${summary.busiestWeekday}.`);
};

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
