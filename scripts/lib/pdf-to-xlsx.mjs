// Build a COMPLETE data workbook (the app's source.xlsx schema) from a contractor
// delay Excel + a Primavera "WBS rollup" PDF. The result fills every dashboard —
// including "Paketlər üzrə sahədaxili kommunikasiya işləri" (infrastructure) and
// "Görülən işlər" — which the in-browser PDF reader can't reliably do.
//
//   node scripts/lib/pdf-to-xlsx.mjs <contractor.xlsx> <primavera.pdf> <out.xlsx>
import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire(import.meta.url);
const XLSX = require('xlsx');
const pdfjs = require('pdfjs-dist/legacy/build/pdf.js');
await import('../../webapp/parsers.js');
const P = globalThis.REPORT_PARSERS;
const { dataToWorkbook } = await import('./schema.mjs');

async function pdfText(path) {
  const data = new Uint8Array(fs.readFileSync(path));
  const pdf = await pdfjs.getDocument({ data, useSystemFonts: true, standardFontDataUrl: 'node_modules/pdfjs-dist/standard_fonts/' }).promise;
  let out = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const tc = await (await pdf.getPage(i)).getTextContent();
    let lastY = null, line = '';
    for (const it of tc.items) { const y = Math.round(it.transform[5]);
      if (lastY !== null && Math.abs(y - lastY) > 2) { out += line + '\n'; line = ''; }
      line += it.str + ' '; lastY = y; }
    out += line + '\n';
  }
  return out;
}

export async function buildCompleteData(xlsxPath, pdfPath) {
  const wb = XLSX.read(fs.readFileSync(xlsxPath), { type: 'buffer', cellDates: false });
  const sheets = wb.SheetNames.map(n => ({ name: n, rows: XLSX.utils.sheet_to_json(wb.Sheets[n], { header: 1, raw: true, defval: '' }) }));
  const d = P.parseExcelRows(sheets);                 // identity, packages, civic, velocity, trend

  if (pdfPath) {
    const pdf = P.parsePrimaveraText(await pdfText(pdfPath));
    if (pdf.workItems.lots.length) d.workItems = pdf.workItems;           // Görülən işlər per package
    if (pdf.infrastructure.items.length) {                                // sahədaxili kommunikasiya
      d.infrastructure.items = pdf.infrastructure.items;
      if (d.infrastructure.overallFakt == null) {
        d.infrastructure.overallFakt = pdf.infrastructure.overallFakt;
        d.infrastructure.overallPlan = pdf.infrastructure.overallPlan;
      }
      d.infrastructure.weeklyNote = 'Sahədaxili kommunikasiya işləri üzrə icra Primavera qrafikindən paketlərin orta göstəricisi kimi hesablanmışdır.';
    }
    d.meta.sourcePdf = 'source.pdf';
  }
  return d;
}

// CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  const [xlsxPath, pdfPath, outPath] = process.argv.slice(2);
  if (!xlsxPath || !outPath) { console.error('usage: pdf-to-xlsx.mjs <contractor.xlsx> <primavera.pdf|-> <out.xlsx>'); process.exit(1); }
  const d = await buildCompleteData(xlsxPath, pdfPath === '-' ? null : pdfPath);
  await dataToWorkbook(d).xlsx.writeFile(outPath);
  const wi = (d.workItems.lots || []).length, inf = (d.infrastructure.items || []).length;
  console.log(`Wrote ${outPath}`);
  console.log(`  village: ${d.meta.village} | packages: ${d.packages.items.length} | civic: ${d.otherObjects.objects.length}`);
  console.log(`  Görülən işlər lots: ${wi} | İnfrastruktur components: ${inf} (overall ${d.infrastructure.overallFakt}%)`);
}
