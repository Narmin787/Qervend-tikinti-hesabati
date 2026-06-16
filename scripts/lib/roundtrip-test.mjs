import { extractDASH } from './extract.mjs';
import { dataToWorkbook, workbookToData } from './schema.mjs';

const DATA_KEYS = ['meta','kpi','overall','packages','workItems','otherObjects','infrastructure','workforce','velocity'];
const orig = extractDASH('index.html');
const back = await workbookToData(await dataToWorkbook(orig).xlsx.writeBuffer());

// Fields that are intentionally added/derived by the new schema (not data loss):
function normalize(k, o) {
  const c = JSON.parse(JSON.stringify(o ?? null));
  if (k === 'meta' && c) delete c.sourcePdf;          // new optional field
  if (k === 'workforce' && c) delete c.totalSeries;   // derived at render time
  return c;
}
let fails = 0;
for (const k of DATA_KEYS) {
  const A = JSON.stringify(normalize(k, orig[k]));
  const B = JSON.stringify(normalize(k, back[k]));
  if (A === B) console.log('  OK   ', k);
  else { fails++; console.log('  DIFF ', k, '\n    orig:', A.slice(0,200), '\n    back:', B.slice(0,200)); }
}
console.log(fails ? `\n${fails} section(s) differ` : '\nALL DATA SECTIONS MATCH — Excel pipeline is lossless.');
process.exit(fails ? 1 : 0);
