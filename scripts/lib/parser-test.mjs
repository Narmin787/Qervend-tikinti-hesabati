// Unit test for webapp/parsers.js parseExcelRows.
// Builds the "sheets" arrays exactly as SheetJS (the browser lib) would produce
// them for a tricky contractor file — including a MERGED "Layihə adı" header that
// leaves one name column blank (the bug that hid most rows). No real data, no
// binary fixtures: deterministic and fast.
// parsers.js is an IIFE that registers globalThis.REPORT_PARSERS (browser file).
await import('../../webapp/parsers.js');
const P = globalThis.REPORT_PARSERS;

let fails = 0;
const eq = (name, got, want) => {
  const g = JSON.stringify(got), w = JSON.stringify(want);
  if (g === w) console.log('  OK   ', name);
  else { fails++; console.log('  FAIL ', name, '\n    got :', g, '\n    want:', w); }
};

// Header row: note col 2 = "Layihə adı", col 3 = "" (merged-away → blank), like SheetJS.
const HDR = ['№','Podratçı Təşkilatın adı','Layihə adı','','Başlama tarixi','Bitmə tarixi',
  'Planlanlaşdırılan iş həcmi %','Faktiki iş həcmi %','Əvvəlki ayın sonuna Gecikmə %','04.06.2026 Gecikmə %','11.06.2026 Gecikmə %'];
// Row layout: [№, podratçı, NAME-col2, NAME-col3, start, finish, plan, fakt, dPrior, d0406, d1106]
const row = (c2, c3, plan, fakt, d) => ['1','“SEA BREEZE” MMC', c2, c3, '01.11.2025','30.10.2026', plan, fakt, d[0], d[1], d[2]];

const newSheet = { name: 'Sheet1', rows: [
  ['Füzuli rayonu Pirəhmədli kəndi üzrə Tikinti Hesabatı','','','','','','','','','','11.06.2026'],
  [],
  HDR,
  row('Ümumi','',                 0.5606, 0.4964, [-0.086, -0.0699, -0.0642]),  // name in col2, col3 blank
  row('Fizuli rayonu','FYE (146 ev)', 0.6022, 0.5257, [-0.098, -0.082, -0.0765]),
  ['','','','O cümlədən','','','','','','',''],                                  // separator — must be skipped
  row('','FYE Sahə 1 (60 ev)',    0.6022, 0.5344, [-0.0795, -0.072, -0.0678]),
  row('','FYE Sahə 2 (86 ev)',    0.6022, 0.5170, [-0.117, -0.092, -0.0852]),
  row('','Məktəb (480 yerlik)',   0.4289, 0.3931, [-0.0642, -0.0416, -0.0358]),
  row('','Bağça (100 yerlik)',    0.3113, 0.3210, [0.0015, 0.0064, 0.0097]),
  row('','Tibb məntəqəsi',        0.4296, 0.4372, [-0.0151, 0.001, 0.0076]),
]};
// Older snapshot (different date) — only FYE present, for the week-over-week trend.
const oldSheet = { name: 'Köhnə', rows: [
  ['Füzuli rayonu Pirəhmədli kəndi','','','','','','','','','','23.04.2026'],
  [],
  HDR,
  row('Fizuli rayonu','FYE (146 ev)', 0.5451, 0.3587, [-0.196, -0.1864, '']),
]};

const d = P.parseExcelRows([oldSheet, newSheet]);

eq('village', d.meta.village, 'Pirəhmədli kəndi');
eq('district', d.meta.district, 'Füzuli rayonu');
eq('officialOverall', d.meta.officialOverall, 49.64);
eq('officialPlan', d.meta.officialPlan, 56.06);
eq('overall object count', d.overall.objects.length, 6);          // FYE + 2 Sahə + 3 civic
eq('package names', d.packages.items.map(p => p.name), ['Sahə 1 (60 ev)','Sahə 2 (86 ev)']);
eq('package ev counts', d.packages.items.map(p => p.ev), [60, 86]);
eq('other-object names', d.otherObjects.objects.map(o => o.name), ['Məktəb (480 yerlik)','Bağça (100 yerlik)','Tibb məntəqəsi']);
eq('velocity row count', d.velocity.rows.length, 7);              // Ümumi + 6
eq('velocity points', d.velocity.points, ['Əvvəlki ay','04.06','11.06']);
eq('Ümumi dev3', d.velocity.rows[0].dev3, [-8.6, -6.99, -6.42]);
eq('trend (FYE, 2 dates)', d.packages.trend, [{date:'23.04.2026',fakt:35.87},{date:'11.06.2026',fakt:52.57}]);

// ---- Primavera WBS-rollup PDF (Schedule%/Performance% summary rows) ----
const PDF = [
  'Pirehmedli kendi is qrafiki Pirehmedli kendi is qrafiki 513 06-Aug-25 30-Oct-26 56.06% 49.64%',
  'Qeyri-Yasayis Binalari Qeyri-Yasayis Binalari 400 40.32% 37.96%',
  'Horgu isleri Horgu isleri 100 100% 100%',                 // civic stage — must be ignored (before residential)
  'Ferdi yasayis evler ve teserrufat tikilileri Ferdi yasayis evler ve teserrufat tikilileri 273 60.22% 52.57%',
  'Sah? 1 (60 ev) Sah? 1 (60 ev) 251 60.22% 53.44%',
  'Torpaq islari Torpaq islari 50 100% 100%',
  'Horgu isleri Horgu isleri 155 100% 89.31%',
  'Dam örtüyü Dam örtüyü 180 93.63% 59.54%',
  'Daxili bezek isleri Daxili bezek isleri 150 31.14% 23.83%',
  'Xarici bezek isleri Xarici bezek isleri 100 34.82% 38.36%',
  'MEP MEP 100 48.63% 31.14%',
  'Elektik/ Zeif axin Elektik/ Zeif axin 90 73.98% 41.38%',
  'Su kanalizasiya Su kanalizasiya 60 5.56% 0%',
].join('\n');
const pd = P.parsePrimaveraText(PDF);
const lots = pd.workItems.lots || [];
eq('PDF: lot count (Cəmi + Sahə 1)', lots.length, 2);
eq('PDF: Sahə 1 ev', (lots.find(l=>/Sahə 1/.test(l.name))||{}).ev, 60);
const s1 = (lots.find(l=>/Sahə 1/.test(l.name))||{items:[]}).items.reduce((m,i)=>(m[i.name]=i.fakt,m),{});
eq('PDF: Sahə 1 Qaba işlər (Torpaq+Hörgü avg)', s1['Qaba işlər'], 94.66);
eq('PDF: Sahə 1 Dam örtüyü', s1['Dam örtüyü'], 59.54);
eq('PDF: Sahə 1 MEP', s1['MEP'], 31.14);
const infra = (pd.infrastructure.items||[]).reduce((m,i)=>(m[i.name]=i.fakt,m),{});
eq('PDF infra: Elektrik', infra['Elektrik / zəif axın'], 41.38);
eq('PDF infra: Su kanalizasiya', infra['Su kanalizasiya'], 0);
eq('PDF infra: per-package lots', (pd.infrastructure.lots||[]).length, 1);
eq('PDF infra: lot named for package', (pd.infrastructure.lots||[{}])[0].name, 'Sahə 1 (60 ev)');
eq('PDF: FYE total', pd.meta._fye, {fakt:52.57, plan:60.22});

console.log(fails ? `\n${fails} parser assertion(s) failed` : '\nPARSER TEST PASSED — Excel + Primavera-PDF parsing extracts all sections.');
process.exit(fails ? 1 : 0);
