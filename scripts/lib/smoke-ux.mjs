import fs from 'node:fs';
import { JSDOM } from 'jsdom';
import ExcelJS from 'exceljs';

const html = fs.readFileSync('public/qervend/index.html','utf8');
const dom = new JSDOM(html.replace(/<script[^>]*src="[^"]*"[^>]*><\/script>/g,''), { runScripts:'outside-only', pretendToBeVisual:true, url:'https://example.com/qervend/' });
const { window } = dom;
const errors=[]; window.addEventListener('error',e=>errors.push(e.message));
window.fetch = () => Promise.resolve({ ok:true }); // stub HEAD check
let charts=0; window.echarts={ init(){charts++; return {setOption(){},resize(){},on(){},getZr(){return{on(){},off(){}}},dispose(){},clear(){}};} };
const run = c => window.eval(c);
run(fs.readFileSync('engine/config.js','utf8'));
run(fs.readFileSync('public/qervend/data.js','utf8'));
for (const m of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) if(m[1].trim()) run(m[1]);
window.document.dispatchEvent(new window.Event('DOMContentLoaded'));

const $ = id => window.document.getElementById(id);
const btnsInTitle = !!(window.document.querySelector('.report-title .et-actions #btnPrint')
  && window.document.querySelector('.report-title .et-actions #btnXlsx'));
console.log('Buttons on title bar:', btnsInTitle);
console.log('PDF button          :', !!$('btnPrint'));
console.log('Excel button + href :', !!$('btnXlsx'), $('btnXlsx') && $('btnXlsx').getAttribute('href'));
console.log('No red status pill  :', !/status-pill/.test(html));
console.log('Per-section PDF     :', /pdf\.addImage/.test(html) && /jspdf\.umd\.min\.js/.test(html));
console.log('Desktop-width PDF   :', /windowWidth:DESK/.test(html));
console.log('Responsive CSS      :', /@media \(max-width:820px\)/.test(html));
console.log('JS errors           :', errors.length?errors:'none');

const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile('public/qervend/data.xlsx');
console.log('data.xlsx sheets    :', wb.worksheets.map(w=>w.name).join(', '));

const ok = btnsInTitle && $('btnPrint') && $('btnXlsx') && !/status-pill/.test(html)
  && /pdf\.addImage/.test(html) && /windowWidth:DESK/.test(html) && !errors.length && wb.worksheets.length>=10;
console.log(ok ? '\nUX SMOKE PASSED' : '\nUX SMOKE FAILED');
process.exit(ok?0:1);
