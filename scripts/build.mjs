// Builds public/ for Vercel. For each folder in cities/:
//   - if source.xlsx exists -> convert to data (Excel is the source of truth)
//   - else use the existing data.js
//   - copy the engine (report.html, config.js), the data, and source.pdf
// Then writes a public/index.html listing all reports.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { workbookToData, dataToWorkbook } from './lib/schema.mjs';
import { dataToJs } from './lib/serialize.mjs';

// Derive the "total workers over time" series from the daily rows, since the
// engine reads workforce.totalSeries directly and the Excel schema doesn't carry it.
function deriveWorkforceTotals(data) {
  const wf = data.workforce;
  if (!wf || !wf.available) return;
  if (Array.isArray(wf.totalSeries) && wf.totalSeries.length) return; // already provided
  wf.totalSeries = (wf.daily || []).map(d => ({
    date: d.date,
    total: (Number(d.sahe) || 0) + (Number(d.texniki) || 0) + (Number(d.idari) || 0),
  }));
}

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
  deriveWorkforceTotals(data);
  const pdf = path.join(dir, 'source.pdf');
  if (fs.existsSync(pdf)) data.meta.sourcePdf = 'source.pdf';

  const outDir = path.join(OUT, city);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'index.html'), engineHtml);
  fs.writeFileSync(path.join(outDir, 'config.js'), configJs);
  fs.writeFileSync(path.join(outDir, 'data.js'), dataToJs(data, data.meta.village || city));
  // Excel download served next to the report ("📊 Excel" button)
  await dataToWorkbook(data).xlsx.writeFile(path.join(outDir, 'data.xlsx'));
  if (fs.existsSync(pdf)) fs.copyFileSync(pdf, path.join(outDir, 'source.pdf'));
  // keep cities/<city>/data.js in sync when built from Excel
  if (fs.existsSync(xlsx)) fs.writeFileSync(dataJsPath, dataToJs(data, data.meta.village || city));

  built.push({ city, meta: data.meta });
  console.log('built', city, '->', `public/${city}/`);
}

// Landing page — executive overview with status badges, "most behind" first.
function esc(s){ return String(s ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
function status(m){
  const f = typeof m.officialOverall === 'number' ? m.officialOverall : null;
  const p = typeof m.officialPlan === 'number' ? m.officialPlan : null;
  const dev = (f != null && p != null) ? f - p : null;
  let cls = 'na', txt = 'Məlumat yox';
  if (dev != null) {
    if (dev <= -15) { cls = 'risk'; txt = 'Ciddi geri'; }
    else if (dev <= -5) { cls = 'warn'; txt = 'Geri qalır'; }
    else if (dev < 0) { cls = 'warn'; txt = 'Cüzi geri'; }
    else { cls = 'good'; txt = 'Qrafik üzrə'; }
  }
  return { f, p, dev, cls, txt };
}
const ordered = [...built].sort((a, b) => (status(a.meta).dev ?? 1e9) - (status(b.meta).dev ?? 1e9));
const cards = ordered.map(b => {
  const m = b.meta, s = status(m);
  const devStr = s.dev != null ? `${s.dev > 0 ? '+' : ''}${s.dev.toFixed(2)}%` : '—';
  return `    <a class="card ${s.cls}" href="./${esc(b.city)}/">
      <div class="row"><div class="t">${esc(m.village || b.city)}</div><span class="badge ${s.cls}">${esc(s.txt)}</span></div>
      <div class="d">${esc(m.district || '')}</div>
      <div class="figs"><b>${s.f != null ? s.f + '%' : '—'}</b> icra · plan ${s.p != null ? s.p + '%' : '—'} · <span class="${s.cls}">${devStr}</span></div>
      <div class="r">Hesabat: ${esc(m.reportDate || '—')}</div>
    </a>`;
}).join('\n');

fs.writeFileSync(path.join(OUT, 'index.html'), `<!DOCTYPE html>
<html lang="az"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Tikinti Gedişatı Hesabatları</title>
<style>
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;background:#F4F6F9;color:#1F2440;margin:0;padding:40px 20px}
.wrap{max-width:980px;margin:0 auto}
h1{font-size:20px;letter-spacing:.04em;text-transform:uppercase;color:#9AA1AB;margin:0 0 4px}
.sub{color:#6B7280;font-size:13px;margin-bottom:18px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px}
.card{display:block;background:#fff;border:1px solid #E6E9EF;border-left-width:5px;border-radius:12px;padding:16px 18px;text-decoration:none;color:inherit;box-shadow:0 1px 3px rgba(16,24,40,.06);transition:border-color .12s,box-shadow .12s}
.card:hover{box-shadow:0 4px 14px rgba(16,24,40,.10)}
.card.good{border-left-color:#1FA67E}.card.warn{border-left-color:#F2A93B}.card.risk{border-left-color:#E0483D}.card.na{border-left-color:#9AA1AB}
.row{display:flex;align-items:center;justify-content:space-between;gap:8px}
.t{font-weight:800;font-size:16px}
.badge{font-size:10.5px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;color:#fff;padding:4px 9px;border-radius:999px;white-space:nowrap}
.badge.good{background:#1FA67E}.badge.warn{background:#F2A93B}.badge.risk{background:#E0483D}.badge.na{background:#9AA1AB}
.d{color:#6B7280;font-size:13px;margin-top:2px}
.figs{font-size:12.5px;color:#6B7280;margin-top:12px}.figs b{color:#1F2440;font-weight:800;font-size:15px}
.figs .good{color:#1FA67E;font-weight:700}.figs .warn{color:#B8841B;font-weight:700}.figs .risk{color:#E0483D;font-weight:700}
.r{color:#9AA1AB;font-size:11.5px;margin-top:8px}
</style></head>
<body><div class="wrap"><h1>Tikinti Gedişatı Hesabatları</h1>
<div class="sub">${ordered.length} hesabat · ən çox geri qalanlar öncə</div>
<div class="grid">
${cards || '<p>Hələ hesabat yoxdur.</p>'}
</div></div></body></html>`);

console.log(`\nDone. ${built.length} report(s) in public/.`);
