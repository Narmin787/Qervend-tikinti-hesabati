// Builds public/ for Vercel. For each folder in cities/:
//   - if source.xlsx exists -> convert to data (Excel is the source of truth)
//   - else use the existing data.js
//   - copy the engine (report.html, config.js), the data, and source.pdf
// Then writes a public/index.html listing all reports.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { workbookToData } from './lib/schema.mjs';
import { dataToJs } from './lib/serialize.mjs';

const ROOT = process.cwd();
const CITIES = path.join(ROOT, 'cities');
const OUT = path.join(ROOT, 'public');

function loadDataJs(file) {
  const sandbox = { window: { DASH: {} } };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(file, 'utf8'), sandbox);
  return sandbox.window.DASH;
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const engineHtml = fs.readFileSync(path.join(ROOT, 'engine/report.html'), 'utf8');
const configJs = fs.readFileSync(path.join(ROOT, 'engine/config.js'), 'utf8');

const cityDirs = fs.existsSync(CITIES)
  ? fs.readdirSync(CITIES).filter(d => fs.statSync(path.join(CITIES, d)).isDirectory())
  : [];

const built = [];
for (const city of cityDirs) {
  const dir = path.join(CITIES, city);
  const xlsx = path.join(dir, 'source.xlsx');
  const dataJsPath = path.join(dir, 'data.js');
  let data;
  if (fs.existsSync(xlsx)) data = await workbookToData(xlsx);
  else if (fs.existsSync(dataJsPath)) data = loadDataJs(dataJsPath);
  else { console.warn(`skip ${city}: no source.xlsx or data.js`); continue; }

  data.meta = data.meta || {};
  const pdf = path.join(dir, 'source.pdf');
  if (fs.existsSync(pdf)) data.meta.sourcePdf = 'source.pdf';

  const outDir = path.join(OUT, city);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'index.html'), engineHtml);
  fs.writeFileSync(path.join(outDir, 'config.js'), configJs);
  fs.writeFileSync(path.join(outDir, 'data.js'), dataToJs(data, data.meta.village || city));
  if (fs.existsSync(pdf)) fs.copyFileSync(pdf, path.join(outDir, 'source.pdf'));
  // keep cities/<city>/data.js in sync when built from Excel
  if (fs.existsSync(xlsx)) fs.writeFileSync(dataJsPath, dataToJs(data, data.meta.village || city));

  built.push({ city, meta: data.meta });
  console.log('built', city, '->', `public/${city}/`);
}

// Landing page
const cards = built.map(b => {
  const m = b.meta;
  return `    <a class="card" href="./${b.city}/">
      <div class="t">${esc(m.village || b.city)}</div>
      <div class="d">${esc(m.district || '')}</div>
      <div class="r">${esc(m.reportDate || '')} · İcra: ${m.officialOverall ?? '—'}%</div>
    </a>`;
}).join('\n');
function esc(s){ return String(s ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

fs.writeFileSync(path.join(OUT, 'index.html'), `<!DOCTYPE html>
<html lang="az"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Tikinti Gedişatı Hesabatları</title>
<style>
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;background:#F4F6F9;color:#1F2440;margin:0;padding:40px 20px}
.wrap{max-width:900px;margin:0 auto}
h1{font-size:20px;letter-spacing:.04em;text-transform:uppercase;color:#9AA1AB}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px;margin-top:20px}
.card{display:block;background:#fff;border:1px solid #E6E9EF;border-radius:12px;padding:18px;text-decoration:none;color:inherit;box-shadow:0 1px 3px rgba(16,24,40,.06)}
.card:hover{border-color:#7FB3E3}
.card .t{font-weight:800;font-size:16px}
.card .d{color:#6B7280;font-size:13px;margin-top:2px}
.card .r{color:#9AA1AB;font-size:12px;margin-top:10px}
</style></head>
<body><div class="wrap"><h1>Tikinti Gedişatı Hesabatları</h1><div class="grid">
${cards || '<p>Hələ hesabat yoxdur.</p>'}
</div></div></body></html>`);

console.log(`\nDone. ${built.length} report(s) in public/.`);
