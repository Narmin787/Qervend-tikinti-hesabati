// Seeds an Excel workbook from an existing city's data.js (or the original index.html).
// Usage: node scripts/data-to-xlsx.mjs <city|index.html> <out.xlsx>
import vm from 'node:vm';
import fs from 'node:fs';
import { extractDASH } from './lib/extract.mjs';
import { dataToWorkbook } from './lib/schema.mjs';

const src = process.argv[2] || 'index.html';
const out = process.argv[3] || 'template/example-qervend.xlsx';

let data;
if (src.endsWith('.html')) {
  data = extractDASH(src);
} else {
  const sandbox = { window: { DASH: {} } };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(`cities/${src}/data.js`, 'utf8'), sandbox);
  data = sandbox.window.DASH;
}
const wb = dataToWorkbook(data);
fs.mkdirSync(out.substring(0, out.lastIndexOf('/')) || '.', { recursive: true });
await wb.xlsx.writeFile(out);
console.log('Wrote', out);
