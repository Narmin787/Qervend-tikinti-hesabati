// Builds engine/report.html: original skeleton + engine scripts, but with
// data/config externalized, ECharts from CDN, and executive UX enhancements
// (status strip + Excel/PDF download + print styles). All enhancements are
// applied here so report.html stays reproducible.
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
// 1) Footer source-PDF link CSS  (also holds executive-toolbar CSS)
// ------------------------------------------------------------------
const uxCss = `.foot .prep{margin-top:4px; color:var(--faint)}
.foot .src-pdf{margin-bottom:8px}
.foot .src-pdf a{display:inline-block; padding:6px 12px; border:1px solid var(--border); border-radius:var(--radius-sm); color:var(--blue); text-decoration:none; font-weight:600}
.foot .src-pdf a:hover{background:var(--page)}

/* ---------- Executive toolbar (UX) ---------- */
.exec-toolbar{position:sticky; top:0; z-index:50; display:flex; flex-wrap:wrap; gap:10px 14px; align-items:center; justify-content:space-between;
  background:rgba(255,255,255,.93); -webkit-backdrop-filter:saturate(1.1) blur(6px); backdrop-filter:saturate(1.1) blur(6px);
  border:1px solid var(--border); border-radius:var(--radius); box-shadow:var(--shadow); padding:10px 14px; margin-bottom:8px}
.et-left{display:flex; flex-wrap:wrap; align-items:center; gap:8px 14px; font-size:12.5px; color:var(--muted)}
.et-fig b{color:var(--ink); font-weight:800; font-size:14.5px}
.status-pill{display:inline-flex; align-items:center; font-weight:800; font-size:11px; letter-spacing:.05em; text-transform:uppercase; padding:5px 11px; border-radius:999px; color:#fff}
.status-pill.good{background:var(--good)} .status-pill.warn{background:var(--warn)} .status-pill.risk{background:var(--risk)}
.et-left .good{color:var(--good); font-weight:700} .et-left .warn{color:var(--warn); font-weight:700} .et-left .risk{color:var(--risk); font-weight:700}
.et-actions{display:flex; gap:8px}
.et-btn{display:inline-flex; align-items:center; gap:6px; font-family:inherit; font-size:12.5px; font-weight:700; color:var(--ink); background:var(--card);
  border:1px solid var(--border); border-radius:var(--radius-sm); padding:8px 13px; cursor:pointer; text-decoration:none; transition:all .12s}
.et-btn:hover{border-color:#cfd5e0; box-shadow:var(--shadow)}

@media print{
  .exec-toolbar{position:static; box-shadow:none; -webkit-backdrop-filter:none; backdrop-filter:none; border-color:#ddd}
  .et-actions{display:none}
  .tip{display:none !important}
  body{font-size:11.5px; background:#fff}
  .wrap{max-width:none; padding:0}
  .section,.chart-card,.kpi{break-inside:avoid}
}`;
html = html.replace('.foot .prep{margin-top:4px; color:var(--faint)}', uxCss);

// ------------------------------------------------------------------
// 2) Executive toolbar markup (status + Excel/PDF buttons), at top of .wrap
// ------------------------------------------------------------------
const toolbar = `  <div class="exec-toolbar" id="execToolbar">
    <div class="et-left" id="etStatus"></div>
    <div class="et-actions">
      <button class="et-btn" id="btnPrint" type="button" title="PDF kimi yadda saxla / çap et">📄 PDF</button>
      <a class="et-btn" id="btnXlsx" href="./data.xlsx" download title="Excel məlumatını yüklə">📊 Excel</a>
    </div>
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
// 5) Post-boot enhancement script: fills status strip + wires buttons.
//     Written with string concatenation (no ${} / backticks) to keep it
//     out of this file's own template interpolation.
// ------------------------------------------------------------------
const enhance = `<script>
/* Executive toolbar — status strip + Excel/PDF actions. Runs after the report boots. */
(function(){
  function ready(fn){ if(document.readyState!=='loading'){fn();} else {document.addEventListener('DOMContentLoaded',fn);} }
  function esc(s){ s=(s==null?'':String(s)); return s.replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  function fmt(n){ return (n==null||(typeof n==='number'&&isNaN(n)))?'—':String(n); }
  ready(function(){
    var D=window.DASH||{}, m=D.meta||{};
    var f=(typeof m.officialOverall==='number')?m.officialOverall:null;
    var p=(typeof m.officialPlan==='number')?m.officialPlan:null;
    var dev=(f!=null&&p!=null)?(f-p):null;
    var cls='good', txt='Qrafik üzrə';
    if(dev!=null){
      if(dev<=-15){cls='risk'; txt='Ciddi geri qalma';}
      else if(dev<=-5){cls='warn'; txt='Cədvəldən geri';}
      else if(dev<0){cls='warn'; txt='Cüzi geri qalma';}
      else {cls='good'; txt='Qrafik üzrə';}
    }
    var devStr=(dev!=null)?((dev>0?'+':'')+dev.toFixed(2)+'%'):'—';
    var s=
      '<span class="status-pill '+cls+'">'+esc(txt)+'</span>'+
      '<span class="et-fig"><b>'+fmt(f)+(f!=null?'%':'')+'</b> icra · plan '+fmt(p)+(p!=null?'%':'')+' · <span class="'+cls+'">'+esc(devStr)+'</span></span>'+
      '<span class="et-fig">Qalan <b>~'+fmt(m.daysRemaining)+'</b> gün · Hədəf '+esc(m.revisedFinish||m.plannedFinish||'—')+'</span>';
    var es=document.getElementById('etStatus'); if(es){ es.innerHTML=s; }
    var bp=document.getElementById('btnPrint');
    if(bp){ bp.addEventListener('click', function(){
      var wrap=document.querySelector('.wrap');
      if(typeof html2pdf==='undefined' || !wrap){ window.print(); return; }
      var actions=document.querySelector('.et-actions');
      var label=bp.textContent;
      bp.disabled=true; bp.textContent='PDF hazırlanır…';
      if(actions) actions.style.visibility='hidden';
      var fname=((window.DASH&&window.DASH.meta&&window.DASH.meta.village)||'tikinti')+' hesabati.pdf';
      var done=function(){ if(actions) actions.style.visibility=''; bp.disabled=false; bp.textContent=label; };
      window.scrollTo(0,0);
      html2pdf().set({
        margin:[5,5,5,5], filename:fname,
        image:{type:'jpeg', quality:0.95},
        html2canvas:{scale:2, useCORS:true, backgroundColor:'#ffffff', scrollX:0, scrollY:0, windowWidth:wrap.scrollWidth},
        jsPDF:{unit:'mm', format:'a4', orientation:'portrait'},
        pagebreak:{mode:['css','legacy'], avoid:['.section','.chart-card','.kpi','.insight']}
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
// Guards: ensure every enhancement actually applied
// ------------------------------------------------------------------
for (const [marker, name] of [
  ['src-pdf', 'footer PDF CSS'],
  ['exec-toolbar', 'executive toolbar'],
  ['btnXlsx', 'Excel button'],
  ['&#39;', 'esc hardening'],
  ['etStatus', 'status strip script'],
  ['linear-gradient(90deg,#1F3F66', 'colored title banner'],
  ['var hasPlan=points.some', 'trend plan-dots'],
  ["secOther.style.display='none'", 'hide empty other-objects'],
  ['html2pdf.bundle.min.js', 'html2pdf library'],
  ['PDF hazırlanır', 'PDF download handler'],
]) {
  if (!html.includes(marker)) { console.error('ERROR: enhancement missing:', name); process.exit(1); }
}

fs.writeFileSync('engine/report.html', html);
console.log('Wrote engine/report.html (' + html.length + ' bytes)');
