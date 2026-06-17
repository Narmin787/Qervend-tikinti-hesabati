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
<script src="https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js"></script>
<script src="./config.js"></script>
<script src="./data.js"></script>
`;

// engine already contains its own <script>…</script> blocks → do NOT re-wrap.
let html = [skeleton, includes, engine, tail].join('\n');

// ------------------------------------------------------------------
// 1) Footer source-PDF link CSS  (also holds export-bar CSS)
// ------------------------------------------------------------------
const uxCss = `.foot .prep{margin-top:4px; color:var(--faint)}
.foot .src-pdf{margin-bottom:10px; display:flex; flex-wrap:wrap; gap:8px; align-items:center}
.foot .src-pdf .src-title{width:100%; font-weight:700; color:var(--ink); margin-bottom:2px}
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
    var fo=(L.footer)||{}, m=D.meta||{};
    var src = Array.isArray(m.sources) ? m.sources.slice() : [];
    if(!src.length && m.sourcePdf) src=[{label:'Mənbə sənədi (PDF)', file:m.sourcePdf}];
    var ok=function(u){ return /^https?:\\/\\//i.test(u) || /^[\\w./ -]+$/.test(u); };
    var icon=function(u){ return /\\.(xlsx|xls|csv)$/i.test(u)?'📊':(/\\.pdf$/i.test(u)?'📄':'📎'); };
    var links=src.map(function(s){ var u=String(s.file||''); if(!ok(u)) return '';
      return '<a href="'+esc(encodeURI(u))+'" target="_blank" rel="noopener" download>'+icon(u)+' '+esc(s.label||u)+'</a>'; }).filter(Boolean).join('');
    var block = links ? ('<div class="src-pdf"><span class="src-title">Mənbə sənədləri:</span>'+links+'</div>') : '';
    $('footer').innerHTML = block + '<div>'+esc(fo.sources||'')+'</div><div class="prep">'+esc(fo.prepared||'')+'</div>';
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
      var jsPDFns=window.jspdf&&window.jspdf.jsPDF;
      if(typeof html2canvas==='undefined' || !jsPDFns || !wrap){ window.print(); return; }
      var acts=document.querySelector('.et-actions');
      var label=bp.textContent; bp.disabled=true; bp.textContent='PDF hazırlanır…';
      if(acts){ acts.style.visibility='hidden'; }   // keep buttons out of the file
      // Force desktop layout + resize charts.
      var pw=wrap.style.width, pmw=wrap.style.maxWidth, pm=wrap.style.margin;
      wrap.style.width=DESK+'px'; wrap.style.maxWidth=DESK+'px'; wrap.style.margin='0 auto';
      try{ if(window.CHARTS&&CHARTS.resizeAll) CHARTS.resizeAll(); }catch(e){}
      var fname=((window.DASH&&window.DASH.meta&&window.DASH.meta.village)||'tikinti')+' hesabati.pdf';
      var restore=function(){ wrap.style.width=pw; wrap.style.maxWidth=pmw; wrap.style.margin=pm;
        try{ if(window.CHARTS&&CHARTS.resizeAll) CHARTS.resizeAll(); }catch(e){}
        if(acts){ acts.style.visibility=''; } bp.disabled=false; bp.textContent=label; };
      window.scrollTo(0,0);
      // Capture EACH block separately (small, safe canvases) and stack them into ONE
      // continuous page. This avoids the single huge-canvas that some browsers truncate.
      setTimeout(function(){
        var blocks=[].slice.call(wrap.children).filter(function(el){ return el.offsetHeight>2 && getComputedStyle(el).display!=='none'; });
        var SC=2, GAP=14, PAD=16, idx=0, imgs=[], total=PAD*2;
        function next(){
          if(idx>=blocks.length) return build();
          html2canvas(blocks[idx], {scale:SC, useCORS:true, backgroundColor:'#ffffff', windowWidth:DESK, width:blocks[idx].offsetWidth, height:blocks[idx].offsetHeight})
            .then(function(cv){ var w=cv.width/SC, h=cv.height/SC; imgs.push({d:cv.toDataURL('image/jpeg',0.95), w:w, h:h});
              total+=h+(idx<blocks.length-1?GAP:0); idx++; next(); })
            .catch(function(){ idx++; next(); });
        }
        function build(){
          try{
            var W=DESK, H=Math.ceil(total);
            var pdf=new jsPDFns({unit:'px', format:[W,H], orientation:'portrait', hotfixes:['px_scaling']});
            var y=PAD; for(var i=0;i<imgs.length;i++){ var x=Math.max(0,(W-imgs[i].w)/2); pdf.addImage(imgs[i].d,'JPEG',x,y,imgs[i].w,imgs[i].h); y+=imgs[i].h+GAP; }
            pdf.save(fname); restore();
          }catch(e){ restore(); window.print(); }
        }
        next();
      }, 400);   // let the desktop re-layout + chart resize settle
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
// 11) Detailed dashboards: room-level work items (plan+fakt), per-phase
//     infrastructure tabs, tempo "?" help, and a weekly delay-change chart.
// ------------------------------------------------------------------
// Work items: grouped plan + fakt bars per stage (plan now visible).
html = html.replace(
  `    CHARTS.completionBars('ch-workItems', lot.items, {small:true});`,
  `    CHARTS.groupedBar('ch-workItems', lot.items.map(function(i){return i.name;}), lot.items.map(function(i){return i.plan;}), lot.items.map(function(i){return i.fakt;}), {showLabels:true, rotate:14});`
);
// Infrastructure: phase tabs.
html = html.replace(
  `    <div class="chart-card"><div class="chart-title" id="ct-infra"></div><div class="chart" id="ch-infra" style="height:360px"></div></div>`,
  `    <div class="tabs" id="infraTabs"></div>
    <div class="chart-card"><div class="chart-title" id="ct-infra"></div><div class="chart" id="ch-infra" style="height:380px"></div></div>`
);
html = html.replace(
  `  function renderInfra(){
    const inf=D.infrastructure; if(!inf) return;
    $('t-infra').textContent=(L.sections&&L.sections.s7)||'';
    $('ct-infra').textContent=(L.charts&&L.charts.infra)||'';
    const items=inf.items.slice().sort((a,b)=>b.fakt-a.fakt);
    CHARTS.completionBars('ch-infra', items, {});
    $('note-infra').innerHTML = \`<div class="note note-amber"><span class="lead">04.06 → 11.06 dəyişiklik:</span> \${esc(inf.weeklyNote)}</div>\`;
  }`,
  `  var INFRA_ACTIVE=null;
  function renderInfra(){
    var inf=D.infrastructure; if(!inf) return;
    $('t-infra').textContent=(L.sections&&L.sections.s7)||'';
    var lots=(inf.lots&&inf.lots.length)?inf.lots:[{id:'_',name:'Mərhələ üzrə',items:inf.items||[]}];
    if(!INFRA_ACTIVE||!lots.some(function(l){return l.id===INFRA_ACTIVE;})) INFRA_ACTIVE=lots[0].id;
    var tabs=$('infraTabs'); if(tabs){ tabs.innerHTML=''; lots.forEach(function(lot){
      var b=document.createElement('button'); b.className='tab'+(lot.id===INFRA_ACTIVE?' active':'');
      b.textContent=lot.name; b.onclick=function(){INFRA_ACTIVE=lot.id; renderInfra();}; tabs.appendChild(b); }); }
    var lot=lots[0]; for(var i=0;i<lots.length;i++){ if(lots[i].id===INFRA_ACTIVE) lot=lots[i]; }
    $('ct-infra').textContent=((L.charts&&L.charts.infra)||'İcra')+' — '+lot.name+' (Plan vs Fakt %)';
    CHARTS.groupedBar('ch-infra', lot.items.map(function(i){return i.name;}), lot.items.map(function(i){return i.plan;}), lot.items.map(function(i){return i.fakt;}), {rotate:26});
    $('note-infra').innerHTML='<div class="note note-amber"><span class="lead">04.06 → 11.06 dəyişiklik:</span> '+esc(inf.weeklyNote)+'</div>';
  }`
);
// Velocity: weekly-change chart card after compliance.
html = html.replace(
  `    <div class="chart-card" style="margin-top:16px"><div class="chart-title" id="ct-velCompliance"></div><div class="chart" id="ch-velCompliance" style="height:320px"></div></div>`,
  `    <div class="chart-card" style="margin-top:16px"><div class="chart-title" id="ct-velCompliance"></div><div class="chart" id="ch-velCompliance" style="height:320px"></div></div>
    <div class="chart-card" style="margin-top:16px"><div class="chart-title" id="ct-velWeekly"></div><div class="chart" id="ch-velWeekly" style="height:300px"></div></div>`
);
// Tempo "?" help tooltip.
html = html.replace(
  `    $('ct-velTempo').textContent=(L.charts&&L.charts.velTempo)||'';`,
  `    $('ct-velTempo').innerHTML=esc((L.charts&&L.charts.velTempo)||'')+' <span class="tip" title="Tələb = (100 − faktiki%) ÷ qalan həftə sayı → vaxtında bitirmək üçün həftədə lazım olan faiz.&#10;Faktiki = (bu həftə faktiki − əvvəlki faktiki) ÷ keçən həftələr → real həftəlik templ.&#10;Planla müqayisə nə qədər geridəyik deyir; tempo isə bu templə vaxtında çatırıqmı sualına cavab verir. Tələb faktiki templdən böyükdürsə, geriləmə daha da artacaq.">?</span>';`
);
// Render the weekly-change chart.
html = html.replace(
  `    CHARTS.complianceBars('ch-velCompliance', velRows);`,
  `    CHARTS.complianceBars('ch-velCompliance', velRows);
    $('ct-velWeekly').textContent='Həftəlik dəyişiklik (04.06 → 11.06) — gecikmənin artması (qırmızı) / azalması (yaşıl)';
    CHARTS.weeklyBars('ch-velWeekly', velRows);`
);
// weeklyBars chart fn + register in the CHARTS api.
html = html.replace(
  `  window.CHARTS = {
    groupedBar:groupedBar, deviationBar:deviationBar, trendLine:trendLine,`,
  `  function weeklyBars(id, rows){
    var ch=mk(id); if(!ch) return;
    var cats=rows.map(function(r){return r.short||r.obyekt;});
    var vals=rows.map(function(r){ var d=r.dev3||[]; return d.length>=2 ? +(d[d.length-2]-d[d.length-1]).toFixed(2) : 0; });
    ch.setOption({
      animationDuration:ANIM, textStyle:{fontFamily:FONT},
      tooltip:Object.assign({trigger:'axis', axisPointer:{type:'shadow'}, formatter:function(ps){var v=ps[0].value; return ps[0].name+'<br/>'+(v>0?'Gecikmə <b>'+v+'%</b> artdı':(v<0?'Gecikmə <b>'+(-v)+'%</b> azaldı':'Dəyişiklik yoxdur'));}},tooltipBase),
      grid:{left:8,right:66,top:10,bottom:8,containLabel:true},
      xAxis:Object.assign({type:'value', axisLabel:{formatter:'{value}%',color:C.muted,fontFamily:FONT,fontSize:11}},axisCommon),
      yAxis:Object.assign({type:'category', data:cats, inverse:true},axisCommon,{splitLine:{show:false},axisLabel:{color:C.muted,fontFamily:FONT,fontSize:10.5}}),
      series:[{type:'bar', barMaxWidth:14, data:vals.map(function(v){return {value:v, itemStyle:{color: v>0?C.risk:(v<0?C.good:'#9AA1AB'), borderRadius:3}};}),
        label:{show:true, position:'right', formatter:function(p){return (p.value>0?'+':'')+p.value+'%';}, color:C.muted, fontFamily:FONT, fontSize:10}}]
    });
  }

  window.CHARTS = {
    groupedBar:groupedBar, deviationBar:deviationBar, trendLine:trendLine, weeklyBars:weeklyBars,`
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
  ['jspdf.umd.min.js', 'jsPDF library'],
  ['html2canvas@1.4.1', 'html2canvas library'],
  ['PDF hazırlanır', 'PDF download handler'],
  ['pdf.addImage', 'per-section PDF builder'],
  ['weeklyBars:weeklyBars', 'weekly-change chart'],
  ['id="infraTabs"', 'infrastructure phase tabs'],
  ['ch-velWeekly', 'weekly-change card'],
  ['vaxtında bitirmək', 'tempo help tooltip'],
  ['windowWidth:DESK', 'desktop-width PDF'],
]) {
  if (!html.includes(marker)) { console.error('ERROR: enhancement missing:', name); process.exit(1); }
}

fs.writeFileSync('engine/report.html', html);
console.log('Wrote engine/report.html (' + html.length + ' bytes)');
