import { extractDASH } from './extract.mjs';
import { dataToWorkbook, workbookToData } from './schema.mjs';
const orig = extractDASH('index.html');
const wb = dataToWorkbook(orig);
const back = await workbookToData(await wb.xlsx.writeBuffer());
for (const k of ['meta','kpi']) {
  const a = JSON.stringify(orig[k]), b = JSON.stringify(back[k]);
  console.log(`\n===== ${k} =====`);
  // find first differing index
  let i = 0; while (i < a.length && i < b.length && a[i] === b[i]) i++;
  console.log('first diff at', i);
  console.log('orig:', a.slice(Math.max(0,i-40), i+60));
  console.log('back:', b.slice(Math.max(0,i-40), i+60));
}
