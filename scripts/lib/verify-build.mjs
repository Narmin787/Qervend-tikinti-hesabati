import vm from 'node:vm'; import fs from 'node:fs';
import { extractDASH } from './extract.mjs';
const orig = extractDASH('index.html');
const sb = { window:{DASH:{}} }; vm.createContext(sb);
vm.runInContext(fs.readFileSync('public/qervend/data.js','utf8'), sb);
const built = sb.window.DASH;
const keys = ['meta','kpi','overall','packages','workItems','otherObjects','infrastructure','workforce','velocity'];
let fails=0;
for (const k of keys){
  const norm=(kk,o)=>{const c=JSON.parse(JSON.stringify(o??null)); if(kk==='meta'&&c)delete c.sourcePdf; if(kk==='workforce'&&c)delete c.totalSeries; return c;};
  const A=JSON.stringify(norm(k,orig[k])), B=JSON.stringify(norm(k,built[k]));
  if(A===B) console.log('  OK   ',k); else {fails++; console.log('  DIFF ',k);}
}
console.log(fails?`${fails} differ`:'public/qervend/data.js matches original via Excel pipeline.');
process.exit(fails?1:0);
