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

/* ---------- Title-bar export actions (PDF/Excel on the report-name line) ---------- */
.et-actions{display:flex; gap:8px; flex:0 0 auto}
.et-btn{display:inline-flex; align-items:center; gap:6px; font-family:inherit; font-size:12px; font-weight:700; color:#fff;
  background:rgba(255,255,255,.16); border:1px solid rgba(255,255,255,.55); border-radius:var(--radius-sm);
  padding:7px 12px; cursor:pointer; text-decoration:none; transition:all .12s; white-space:nowrap}
.et-btn:hover{background:rgba(255,255,255,.30)}

@media print{
  .et-actions{display:none}
  .tip{display:none !important}
  body{font-size:11.5px; background:#fff}
  .wrap{max-width:none; padding:0}
  .section,.chart-card,.kpi{break-inside:avoid}
}

/* ---------- Responsive (mobile): stack grids, keep desktop look elsewhere ---------- */
@media (max-width:820px){
  .wrap{padding:16px 12px 40px}
  .kpi-row{grid-template-columns:repeat(2,1fr)}
  .grid-2,.grid-5050,.grid-6535{grid-template-columns:1fr}
  .report-title{flex-wrap:wrap; font-size:15px; padding:12px 14px}
  .et-actions{margin-left:auto}
}
@media (max-width:440px){ .kpi-row{grid-template-columns:1fr} }`;
html = html.replace('.foot .prep{margin-top:4px; color:var(--faint)}', uxCss);

// ------------------------------------------------------------------
// 2) Move the PDF + Excel buttons ONTO the report-title line (compact)
// ------------------------------------------------------------------
html = html.replace(
  `    <h1 class="report-title" id="reportTitle">—</h1>`,
  `    <div class="report-title"><span id="reportTitle">—</span>
      <span class="et-actions">
        <button class="et-btn" id="btnPrint" type="button" title="Hesabatı PDF kimi yüklə">📄 PDF</button>
        <a class="et-btn" id="btnXlsx" href="./data.xlsx" download title="Excel məlumatını yüklə">📊 Excel</a>
      </span>
    </div>`
);

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
    var DESK=1180;   // always render the PDF at desktop width (looks like the web, mobile included)
    var bp=document.getElementById('btnPrint');
    if(bp){ bp.addEventListener('click', function(){
      var wrap=document.querySelector('.wrap');
      if(typeof html2pdf==='undefined' || !wrap){ window.print(); return; }
      var acts=document.querySelector('.et-actions');
      var label=bp.textContent; bp.disabled=true; bp.textContent='PDF hazırlanır…';
      if(acts){ acts.style.visibility='hidden'; }   // keep buttons out of the file
      // Force desktop layout + resize charts, then capture as one continuous page.
      var pw=wrap.style.width, pmw=wrap.style.maxWidth, pm=wrap.style.margin;
      wrap.style.width=DESK+'px'; wrap.style.maxWidth=DESK+'px'; wrap.style.margin='0 auto';
      try{ if(window.CHARTS&&CHARTS.resizeAll) CHARTS.resizeAll(); }catch(e){}
      var fname=((window.DASH&&window.DASH.meta&&window.DASH.meta.village)||'tikinti')+' hesabati.pdf';
      var restore=function(){ wrap.style.width=pw; wrap.style.maxWidth=pmw; wrap.style.margin=pm;
        try{ if(window.CHARTS&&CHARTS.resizeAll) CHARTS.resizeAll(); }catch(e){}
        if(acts){ acts.style.visibility=''; } bp.disabled=false; bp.textContent=label; };
      setTimeout(function(){
        var h=Math.ceil(wrap.scrollHeight);
        window.scrollTo(0,0);
        html2pdf().set({
          margin:0, filename:fname,
          image:{type:'jpeg', quality:0.96},
          html2canvas:{scale:2, useCORS:true, backgroundColor:'#ffffff', scrollX:0, scrollY:0, windowWidth:DESK, windowHeight:h, width:DESK},
          jsPDF:{unit:'px', format:[DESK, h+24], orientation:'portrait', hotfixes:['px_scaling']}, // +24 -> exactly 1 page
          pagebreak:{mode:'avoid-all'}        // single continuous page — no cuts
        }).from(wrap).save().then(restore).catch(function(){ restore(); window.print(); });
      }, 450);   // let the desktop re-layout + chart resize settle
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
  background:linear-gradient(90deg,#1F3F66,#2A6FA8); padding:13px 16px;
  border-radius:var(--radius); box-shadow:var(--shadow);
  display:flex; align-items:center; justify-content:space-between; gap:14px;
}
.report-title>span:first-child{line-height:1.25}`
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
// 11) Header: show "415 gün" (no "+ 0") when there is no extension
// ------------------------------------------------------------------
html = html.replace(
  "if(m.baselineDays) items.push(`<span class=\"mi\">${m.baselineDays} + ${m.extraDays} gün</span>`);",
  "if(m.baselineDays) items.push(`<span class=\"mi\">${m.baselineDays}${m.extraDays?(' + '+m.extraDays):''} gün</span>`);"
);

// ------------------------------------------------------------------
// Guards: ensure every enhancement actually applied
// ------------------------------------------------------------------
for (const [marker, name] of [
  ['src-pdf', 'footer PDF CSS'],
  ['class="et-actions"', 'title-bar buttons'],
  ['btnXlsx', 'Excel button'],
  ['&#39;', 'esc hardening'],
  ['linear-gradient(90deg,#1F3F66', 'colored title banner'],
  ['var hasPlan=points.some', 'trend plan-dots'],
  ["secOther.style.display='none'", 'hide empty other-objects'],
  ["secWI.style.display='none'", 'hide empty work-items'],
  ['html2pdf.bundle.min.js', 'html2pdf library'],
  ['PDF hazırlanır', 'PDF download handler'],
  ["pagebreak:{mode:'avoid-all'}", 'single-page PDF'],
  ['windowWidth:DESK', 'desktop-width PDF'],
]) {
  if (!html.includes(marker)) { console.error('ERROR: enhancement missing:', name); process.exit(1); }
}

fs.writeFileSync('engine/report.html', html);
console.log('Wrote engine/report.html (' + html.length + ' bytes)');
