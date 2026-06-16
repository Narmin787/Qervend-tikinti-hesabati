import fs from 'node:fs';
import { JSDOM } from 'jsdom';

const html = fs.readFileSync('public/qervend/index.html','utf8');
const dom = new JSDOM(html.replace(/<script[^>]*src="[^"]*"[^>]*><\/script>/g,''), { runScripts:'outside-only', pretendToBeVisual:true });
const { window } = dom;
const errors = [];
window.addEventListener('error', e => errors.push(e.message));

let charts = 0, setOptions = 0;
const fakeChart = { setOption(){ setOptions++; }, resize(){}, on(){}, getZr(){return{on(){},off(){}}}, dispose(){}, clear(){} };
window.echarts = { init(){ charts++; return fakeChart; }, graphic:{}, };

const run = code => window.eval(code);
run(fs.readFileSync('engine/config.js','utf8'));
run(fs.readFileSync('public/qervend/data.js','utf8'));
// Run every INLINE engine <script> block in order (charts.js, insights, render).
const inline = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]).filter(s=>s.trim());
for (const block of inline) run(block);

window.document.dispatchEvent(new window.Event('DOMContentLoaded'));

const $ = id => window.document.getElementById(id);
console.log('reportTitle :', JSON.stringify($('reportTitle').textContent.slice(0,50)));
console.log('kpiRow cards:', $('kpiRow').children.length, '(expect 5)');
console.log('insights    :', $('insightsList').children.length, 'item(s)');
console.log('footer html :', $('footer').innerHTML.length, 'chars');
console.log('charts init :', charts, '| setOption calls:', setOptions);
console.log('JS errors   :', errors.length ? errors : 'none');
if (errors.length || charts === 0) process.exit(1);
console.log('\nSMOKE TEST PASSED — engine renders all sections without runtime errors.');
