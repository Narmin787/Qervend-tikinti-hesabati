// Builds engine/report.html: original skeleton + engine scripts, but with
// data/config externalized, ECharts from CDN, and UX enhancements (Excel/PDF
// export bar, colored title, plan-line on trend). All enhancements are applied
// here so report.html stays reproducible.
import fs from 'node:fs';

const lines = fs.readFileSync('index.html', 'utf8').split('\n');
const L = (a, b) => lines.slice(a - 1, b).join('\n'); // 1-based inclusive

const skeleton = L(1, 272);          // <!doctype> + head(css) + body skeleton
const engine = L(1337, 1960);        // engine scripts (charts.js + insights + render)
const tail = L(1961, lines.length);  // </body></html>

const includes = `
<!-- ============================================================
     KONFİQ + MƏLUMAT + KİTABXANA
     report.html bütün şəhərlər üçün eynidir. Hər şəhər üçün yalnız
     ./data.js dəyişir (Excel şablonundan avtomatik yaradılır).
     ============================================================ -->
<script src="https://cdn.jsdelivr.net/npm/echarts@5.5.1/dist/echarts.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/html2pdf.js@0.10.2/dist/html2pdf.bundle.min.js"></script>
<script src="./config.js"></script>
<script src="./data.js"></script>
`;

// engine already contains its own <script>…</script> blocks → do NOT re-wrap.
let html = [skeleton, includes, engine, tail].join('\n');

// ------------------------------------------------------------------
// 1) Footer source-PDF link CSS  (also holds export-bar CSS)
// ------------------------------------------------------------------
const uxCss = `.foot .prep{margin-top:4px; color:var(--faint)}
.foot .src-pdf{margin-bottom:8px}
.foot .src-pdf a{display:inline-block; padding:6px 12px; border:1px solid var(--border); border-radius:var(--radius-sm); color:var(--blue); text-decoration:none; font-weight:600}
.foot .src-pdf a:hover{background:var(--page)}

/* ---------- Export bar (sticky PDF/Excel actions) ---------- */
.exec-toolbar{position:sticky; top:0; z-index:50; display:flex; align-items:center; justify-content:flex-end; gap:8px;
  background:rgba(255,255,255,.92); -webkit-backdrop-filter:saturate(1.1) blur(6px); backdrop-filter:saturate(1.1) blur(6px);
  border:1px solid var(--border); border-radius:var(--radius); box-shadow:var(--shadow); padding:8px 12px; margin-bottom:10px}
.et-btn{display:inline-flex; align-items:center; gap:6px; font-family:inherit; font-size:12.5px; font-weight:700; color:var(--ink); background:var(--card);
  border:1px solid var(--border); border-radius:var(--radius-sm); padding:8px 13px; cursor:pointer; text-decoration:none; transition:all .12s}
.et-btn:hover{border-color:#cfd5e0; box-shadow:var(--shadow)}

@media print{
  .exec-toolbar{display:none}
  .tip{display:none !important}
  body{font-size:11.5px; background:#fff}
  .wrap{max-width:none; padding:0}
  .section,.chart-card,.kpi{break-inside:avoid}
}`;
html = html.replace('.foot .prep{margin-top:4px; color:var(--faint)}', uxCss);

// ------------------------------------------------------------------
// 2) Export bar markup (PDF + Excel buttons), at top of .wrap
// ------------------------------------------------------------------
const toolbar = `  <div class="exec-toolbar" id="execToolbar">
    <button class="et-btn" id="btnPrint" type="button" title="Hesabatı PDF kimi yüklə">📄 PDF</button>
    <a class="et-btn" id="btnXlsx" href="./data.xlsx" download title="Excel məlumatını yüklə">📊 Excel</a>
  </div>

  <!-- BÖLMƏ 1 — Başlıq və layihə kimliyi -->`;
html = html.replace('  <!-- BÖLMƏ 1 — Başlıq və layihə kimliyi -->', toolbar);

// ------------------------------------------------------------------
// 3) Harden esc() to also escape quotes (XSS-safe attributes)
// ------------------------------------------------------------------
html = html.replace(
  `const esc = s => String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));`,
  `const esc = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));`
);

// ------------------------------------------------------------------
// 4) Footer source-PDF link, with URL sanitization (no javascript: etc.)
// ------------------------------------------------------------------
html = html.replace(
  `  function renderFooter(){
    const fo=(L.footer)||{};
    $('footer').innerHTML = \`<div>\${esc(fo.sources||'')}</div><div class="prep">\${esc(fo.prepared||'')}</div>\`;
  }`,
  `  function renderFooter(){
    const fo=(L.footer)||{}; let pdf=(D.meta&&D.meta.sourcePdf)||'';
    if(pdf && !/^https?:\\/\\//i.test(pdf) && !/^[\\w./-]+$/.test(pdf)) pdf=''; // allow http(s) or relative paths only
    const pdfLink = pdf
      ? \`<div class="src-pdf"><a href="\${esc(pdf)}" target="_blank" rel="noopener">📄 Mənbə sənədi (PDF)</a></div>\`
      : '';
    $('footer').innerHTML = \`\${pdfLink}<div>\${esc(fo.sources||'')}</div><div class="prep">\${esc(fo.prepared||'')}</div>\`;
  }`
);

// ------------------------------------------------------------------
// 5) Post-boot script: wires the Excel link and the single-page PDF export.
//     The PDF is rendered as ONE continuous page (a full clone of the report),
//     so nothing is cut across page boundaries.
// ------------------------------------------------------------------
const enhance = `<script>
/* Export actions — Excel link + client-side single-page PDF. Runs after boot. */
(function(){
  function ready(fn){ if(document.readyState!=='loading'){fn();} else {document.addEventListener('DOMContentLoaded',fn);} }
  ready(function(){
    var bp=document.getElementById('btnPrint');
    if(bp){ bp.addEventListener('click', function(){
      var wrap=document.querySelector('.wrap');
      if(typeof html2pdf==='undefined' || !wrap){ window.print(); return; }
      var tb=document.getElementById('execToolbar');
      var label=bp.textContent; bp.disabled=true; bp.textContent='PDF hazırlanır…';
      if(tb){ tb.style.display='none'; }       // keep the buttons out of the file
      window.scrollTo(0,0);
      var w=Math.ceil(wrap.scrollWidth), h=Math.ceil(wrap.scrollHeight);
      var fname=((window.DASH&&window.DASH.meta&&window.DASH.meta.village)||'tikinti')+' hesabati.pdf';
      var done=function(){ if(tb){ tb.style.display=''; } bp.disabled=false; bp.textContent=label; };
      html2pdf().set({
        margin:0, filename:fname,
        image:{type:'jpeg', quality:0.96},
        html2canvas:{scale:2, useCORS:true, backgroundColor:'#ffffff', scrollX:0, scrollY:0, windowWidth:w, windowHeight:h},
        jsPDF:{unit:'px', format:[w, h+24], orientation:'portrait', hotfixes:['px_scaling']}, // +24 absorbs sub-pixel rounding -> exactly 1 page
        pagebreak:{mode:'avoid-all'}        // single continuous page — no cuts
      }).from(wrap).save().then(done).catch(function(){ done(); window.print(); });
    }); }
    var bx=document.getElementById('btnXlsx');
    if(bx){ try{ fetch(bx.getAttribute('href'),{method:'HEAD'}).then(function(r){ if(!r.ok){bx.style.display='none';} }).catch(function(){ bx.style.display='none'; }); }catch(e){} }
  });
})();
</script>
`;
html = html.replace('</body>', enhance + '</body>');

// ------------------------------------------------------------------
// 6) Colored title banner (the report header line gets a colored background)
// ------------------------------------------------------------------
html = html.replace(
  `.report-title{
  font-size:19px; font-weight:800; letter-spacing:.04em; color:var(--faint);
  text-transform:uppercase; margin:0 0 8px;
}`,
  `.report-title{
  font-size:19px; font-weight:800; letter-spacing:.04em; color:#fff;
  text-transform:uppercase; margin:0 0 12px;
  background:linear-gradient(90deg,#1F3F66,#2A6FA8); padding:14px 18px;
  border-radius:var(--radius); box-shadow:var(--shadow);
}`
);

// ------------------------------------------------------------------
// 7) Trend chart: also draw the PLAN line as blue dots when trend points
//     carry a 'plan' value (alongside the red 'fakt' line).
// ------------------------------------------------------------------
html = html.replace(
  `  function trendLine(id, points, color){
    var ch=mk(id); if(!ch) return; color=color||C.fakt;
    ch.setOption({
      animationDuration:ANIM, textStyle:{fontFamily:FONT},
      tooltip:Object.assign({trigger:'axis', valueFormatter:function(v){return pct(v);}},tooltipBase),
      grid:{left:8,right:18,top:18,bottom:8,containLabel:true},
      xAxis:Object.assign({type:'category', data:points.map(function(p){return p.date;}), boundaryGap:false},axisCommon,{splitLine:{show:false}}),
      yAxis:Object.assign({type:'value', scale:true, axisLabel:{formatter:'{value}%', color:C.muted, fontFamily:FONT, fontSize:11}},axisCommon),
      series:[{type:'line', data:points.map(function(p){return p.fakt;}), smooth:false, symbol:'circle', symbolSize:8,
        lineStyle:{color:color, width:2.5}, itemStyle:{color:color},
        areaStyle:{color:{type:'linear',x:0,y:0,x2:0,y2:1,colorStops:[{offset:0,color:'rgba(239,111,108,.22)'},{offset:1,color:'rgba(239,111,108,.02)'}]}},
        label:{show:true, position:'top', formatter:function(p){return pct(p.value);}, color:C.ink, fontFamily:FONT, fontSize:11, fontWeight:600}}]
    });
  }`,
  `  function trendLine(id, points, color){
    var ch=mk(id); if(!ch) return; color=color||C.fakt;
    var planColor=C.plan||'#3B9BE8';
    var hasPlan=points.some(function(p){return p.plan!=null&&p.plan!=='';});
    var series=[{type:'line', name:'Faktiki', data:points.map(function(p){return p.fakt;}), smooth:false, symbol:'circle', symbolSize:8,
        lineStyle:{color:color, width:2.5}, itemStyle:{color:color},
        areaStyle:{color:{type:'linear',x:0,y:0,x2:0,y2:1,colorStops:[{offset:0,color:'rgba(239,111,108,.22)'},{offset:1,color:'rgba(239,111,108,.02)'}]}},
        label:{show:true, position:'top', formatter:function(p){return pct(p.value);}, color:C.ink, fontFamily:FONT, fontSize:11, fontWeight:600}}];
    if(hasPlan){ series.push({type:'line', name:'Plan', data:points.map(function(p){return (p.plan==null||p.plan==='')?null:p.plan;}),
        smooth:false, symbol:'circle', symbolSize:8, connectNulls:true,
        lineStyle:{color:planColor, width:2, type:'dotted'}, itemStyle:{color:planColor},
        label:{show:false}}); }
    ch.setOption({
      animationDuration:ANIM, textStyle:{fontFamily:FONT},
      tooltip:Object.assign({trigger:'axis', valueFormatter:function(v){return pct(v);}},tooltipBase),
      legend:hasPlan?{data:['Faktiki','Plan'], top:0, right:6, icon:'roundRect', itemWidth:14, itemHeight:9, textStyle:{color:C.muted,fontFamily:FONT,fontSize:11}}:undefined,
      grid:{left:8,right:18,top:hasPlan?30:18,bottom:8,containLabel:true},
      xAxis:Object.assign({type:'category', data:points.map(function(p){return p.date;}), boundaryGap:false},axisCommon,{splitLine:{show:false}}),
      yAxis:Object.assign({type:'value', scale:true, axisLabel:{formatter:'{value}%', color:C.muted, fontFamily:FONT, fontSize:11}},axisCommon),
      series:series
    });
  }`
);

// ------------------------------------------------------------------
// 8) Hide the "Digər obyektlər" section entirely when it has no objects
// ------------------------------------------------------------------
html = html.replace(
  `  function renderOther(){
    const o=D.otherObjects; if(!o) return;`,
  `  function renderOther(){
    const o=D.otherObjects; var secOther=document.getElementById('sec-other');
    if(!o || !o.objects || !o.objects.length){ if(secOther) secOther.style.display='none'; return; }
    if(secOther) secOther.style.display='';`
);

// ------------------------------------------------------------------
// 9) Hide the "Görülən işlər" section when there are no lots (robustness)
// ------------------------------------------------------------------
html = html.replace(
  `  function renderWorkItems(){
    const w=D.workItems; if(!w) return;`,
  `  function renderWorkItems(){
    const w=D.workItems; var secWI=document.getElementById('sec-workitems');
    if(!w || !w.lots || !w.lots.length){ if(secWI) secWI.style.display='none'; return; }
    if(secWI) secWI.style.display='';`
);

// ------------------------------------------------------------------
// 10) Hide the "Paketlər" section when there are no packets (robustness)
// ------------------------------------------------------------------
html = html.replace(
  `  function renderPackages(){
    const p=D.packages; if(!p) return;`,
  `  function renderPackages(){
    const p=D.packages; var secPk=document.getElementById('sec-packages');
    if(!p || !p.items || !p.items.length){ if(secPk) secPk.style.display='none'; return; }
    if(secPk) secPk.style.display='';`
);

// ------------------------------------------------------------------
// Guards: ensure every enhancement actually applied
// ------------------------------------------------------------------
for (const [marker, name] of [
  ['src-pdf', 'footer PDF CSS'],
  ['exec-toolbar', 'export bar'],
  ['btnXlsx', 'Excel button'],
  ['&#39;', 'esc hardening'],
  ['linear-gradient(90deg,#1F3F66', 'colored title banner'],
  ['var hasPlan=points.some', 'trend plan-dots'],
  ["secOther.style.display='none'", 'hide empty other-objects'],
  ["secWI.style.display='none'", 'hide empty work-items'],
  ['html2pdf.bundle.min.js', 'html2pdf library'],
  ['PDF hazırlanır', 'PDF download handler'],
  ["pagebreak:{mode:'avoid-all'}", 'single-page PDF'],
]) {
  if (!html.includes(marker)) { console.error('ERROR: enhancement missing:', name); process.exit(1); }
}

fs.writeFileSync('engine/report.html', html);
console.log('Wrote engine/report.html (' + html.length + ' bytes)');
