#!/usr/bin/env node
'use strict';

// Makes the small font files in fonts/ that every graphic embeds. This is
// not part of the daily build and only needs to run again when a font,
// a weight or the character set below changes.
//
// An SVG shown as an <img> may not load anything from elsewhere, so a web
// font has to travel inside the file. Shipping whole fonts would make every
// graphic heavy, so each weight is cut down to the characters below and
// saved as WOFF2. The variable Nunito is pinned to one weight per file.
// Next to the fonts it writes fonts/metrics.json with the advance widths
// and kerning pairs, so the build can measure text without a font library.
//
//   npm install --no-save subset-font harfbuzzjs
//   node scripts/make-fonts.js <Nunito[wght].ttf> <JetBrainsMono-Medium.ttf> <JetBrainsMono-Bold.ttf>
//
// Both fonts are under the SIL Open Font License 1.1, see fonts/OFL.txt.

const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const OUT = path.join(__dirname, '..', 'fonts');

// Basic Latin, the German letters and the few signs the texts use.
const CHARS = (() => {
  let s = '';
  for (let c = 0x20; c <= 0x7e; c += 1) s += String.fromCharCode(c);
  return `${s}ÄÖÜäöüß’“”…·–→`;
})();

const main = async () => {
  const [nunito, monoMedium, monoBold] = process.argv.slice(2);
  if (!nunito || !monoMedium || !monoBold) {
    console.error('Usage: node scripts/make-fonts.js <Nunito[wght].ttf> <JetBrainsMono-Medium.ttf> <JetBrainsMono-Bold.ttf>');
    process.exit(1);
  }
  const subsetFont = require('subset-font');
  const hb = await import(pathToFileURL(require.resolve('harfbuzzjs')).href);

  const faces = [
    { id: 'nunito-700', family: 'Nunito', weight: 700, source: nunito, axes: { wght: 700 }, kern: true },
    { id: 'nunito-800', family: 'Nunito', weight: 800, source: nunito, axes: { wght: 800 }, kern: true },
    { id: 'nunito-900', family: 'Nunito', weight: 900, source: nunito, axes: { wght: 900 }, kern: true },
    { id: 'mono-500', family: 'JetBrains Mono', weight: 500, source: monoMedium, kern: false },
    { id: 'mono-700', family: 'JetBrains Mono', weight: 700, source: monoBold, kern: false },
  ];

  const metrics = {};
  fs.mkdirSync(OUT, { recursive: true });
  for (const f of faces) {
    const source = fs.readFileSync(f.source);
    const options = { noHinting: true, keepFeatures: ['kern'], ...(f.axes ? { variationAxes: f.axes } : {}) };
    const ttf = await subsetFont(source, CHARS, { ...options, targetFormat: 'truetype' });
    const woff2 = await subsetFont(source, CHARS, { ...options, targetFormat: 'woff2' });
    fs.writeFileSync(path.join(OUT, `${f.id}.woff2`), woff2);

    // Widths come from shaping with HarfBuzz itself, so they include the
    // kerning the browser applies to the same file.
    const face = new hb.Face(new hb.Blob(ttf));
    const font = new hb.Font(face);
    const advance = (text) => {
      const buffer = new hb.Buffer();
      buffer.addText(text);
      buffer.guessSegmentProperties();
      hb.shape(font, buffer);
      return buffer.getGlyphPositions().reduce((sum, p) => sum + p.xAdvance, 0);
    };
    const covered = new Set(Array.from(face.collectUnicodes(), (c) => String.fromCodePoint(c)));
    const chars = Array.from(CHARS).filter((c) => covered.has(c));
    const advances = {};
    for (const c of chars) advances[c] = advance(c);
    const kern = {};
    if (f.kern) {
      for (const a of chars) {
        for (const b of chars) {
          const d = advance(a + b) - advances[a] - advances[b];
          if (d !== 0) kern[a + b] = d;
        }
      }
    }
    const table = (tag) => {
      const bytes = face.referenceTable(tag);
      return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    };
    const os2 = table('OS/2');
    const hhea = table('hhea');
    metrics[f.id] = {
      family: f.family,
      weight: f.weight,
      file: `${f.id}.woff2`,
      upem: face.upem,
      ascender: hhea.getInt16(4),
      descender: hhea.getInt16(6),
      capHeight: os2.getInt16(88),
      xHeight: os2.getInt16(86),
      advances,
      kern,
    };
    console.log(`${f.id}: ${woff2.length} bytes, ${chars.length} characters, ${Object.keys(kern).length} kerning pairs`);
  }
  fs.writeFileSync(path.join(OUT, 'metrics.json'), `${JSON.stringify(metrics)}\n`);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
