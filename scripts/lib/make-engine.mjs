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
    var block = links ? ('<div class="src-pdf"><span class="src-title">Mənbə kimi istifadə olunan sənədlər:</span>'+links+'</div>') : '';
    $('footer').innerHTML = block + '<div>'+esc(fo.sources||'')+'</div><div class="prep">'+esc(fo.prepared||'')+'</div>'+'<div class="built-by">Built by Emin İsmayilov</div>';
  }`
);
// Tiny, low-visibility build credit on every report.
html = html.replace(
  '.foot .prep{margin-top:4px; color:var(--faint)}',
  '.foot .prep{margin-top:4px; color:var(--faint)}\n.foot .built-by{margin-top:6px; font-size:8.5px; letter-spacing:.02em; color:var(--faint); opacity:.45}'
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
    // Hide whole sections turned off in the editor (data.meta.hiddenSections).
    try{ var hsec=(window.DASH&&window.DASH.meta&&window.DASH.meta.hiddenSections)||[];
      hsec.forEach(function(id){ var s=document.getElementById(id); if(s) s.style.display='none'; }); }catch(e){}
    // Collapsible sections — click the section heading to minimize / expand.
    [].forEach.call(document.querySelectorAll('.section > .section-title'), function(t){
      t.setAttribute('role','button'); t.setAttribute('tabindex','0');
      var toggle=function(){ t.parentNode.classList.toggle('collapsed');
        setTimeout(function(){ try{ if(window.CHARTS&&CHARTS.resizeAll) CHARTS.resizeAll(); }catch(e){} }, 60); };
      t.addEventListener('click', toggle);
      t.addEventListener('keydown', function(e){ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); toggle(); } });
    });
    var DESK=1180;   // always render the PDF at desktop width (looks like the web, mobile included)
    var bp=document.getElementById('btnPrint');
    if(bp){ bp.addEventListener('click', function(){
      var wrap=document.querySelector('.wrap');
      var jsPDFns=window.jspdf&&window.jspdf.jsPDF;
      if(typeof html2canvas==='undefined' || !jsPDFns || !wrap){ window.print(); return; }
      var acts=document.querySelector('.et-actions');
      var label=bp.textContent; bp.disabled=true; bp.textContent='PDF hazırlanır…';
      if(acts){ acts.style.visibility='hidden'; }   // keep buttons out of the file
      // Expand any collapsed sections so the PDF includes every section in full.
      var wasCollapsed=[].slice.call(document.querySelectorAll('.section.collapsed'));
      wasCollapsed.forEach(function(s){ s.classList.remove('collapsed'); });
      // Force desktop layout + resize charts.
      var pw=wrap.style.width, pmw=wrap.style.maxWidth, pm=wrap.style.margin;
      wrap.style.width=DESK+'px'; wrap.style.maxWidth=DESK+'px'; wrap.style.margin='0 auto';
      try{ if(window.CHARTS&&CHARTS.resizeAll) CHARTS.resizeAll(); }catch(e){}
      var fname=((window.DASH&&window.DASH.meta&&window.DASH.meta.village)||'tikinti')+' hesabati.pdf';
      var restore=function(){ wrap.style.width=pw; wrap.style.maxWidth=pmw; wrap.style.margin=pm;
        wasCollapsed.forEach(function(s){ s.classList.add('collapsed'); });
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
  text-transform:none; margin:0 0 12px;
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
// Remove the Tempo chart (redundant with Sürət göstəricisi) — drop its card + render.
html = html.replace(
  `    <div class="grid grid-6535">
      <div class="chart-card"><div class="chart-title" id="ct-velDev"></div><div class="chart" id="ch-velDev" style="height:300px"></div></div>
      <div class="chart-card"><div class="chart-title" id="ct-velTempo"></div><div class="chart" id="ch-velTempo" style="height:300px"></div></div>
    </div>`,
  `    <div class="chart-card"><div class="chart-title" id="ct-velDev"></div><div class="chart" id="ch-velDev" style="height:320px"></div></div>`
);
html = html.replace(`    $('ct-velTempo').textContent=(L.charts&&L.charts.velTempo)||'';\n`, '');
html = html.replace(`    CHARTS.tempoBars('ch-velTempo', velRows);\n`, '');
// Sürət göstəricisi "?" — official, passive-voice explanation (how it is calculated + why).
html = html.replace(
  `    $('ct-velCompliance').textContent=(L.charts&&L.charts.velCompliance)||'';`,
  `    $('ct-velCompliance').innerHTML=esc((L.charts&&L.charts.velCompliance)||'')+' <span class="tip" title="Plana uyğunluq faktiki həftəlik templin (son həftələrdə görülən iş) tələb olunan templə — tikinti işini vaxtında bitirmək üçün həftədə lazım olan faizə — nisbəti kimi hesablanır. Göstəricinin 100%-dən aşağı olması işlərin cari templə vaxtında tamamlanmayacağını bildirir.">?</span>';`
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
// 12) "Görülən işlər" — 2-level grouped navigation (Cəmi + Paket groups,
//     each with Orta / 2-3-4-5 otaqlı sub-options). Modern block buttons.
// ------------------------------------------------------------------
html = html.replace(
  `.tabs{display:flex; flex-wrap:wrap; gap:8px; margin-bottom:14px}`,
  `.tabs{display:flex; flex-wrap:wrap; gap:8px; margin-bottom:14px}
.wi-groups{gap:8px; margin-bottom:0}
.wi-groups .tab{font-size:13px; font-weight:700; padding:9px 17px; border-radius:9px; box-shadow:var(--shadow)}
.wi-groups .tab.active{background:linear-gradient(90deg,#1F3F66,#2A6FA8); color:#fff; border-color:#1F3F66}
.wi-subs{gap:6px; margin-top:9px; margin-bottom:14px; padding-left:2px}
.subtab{font-size:12px; font-weight:600; color:var(--muted); background:#fff; border:1px solid var(--border); border-radius:999px; padding:5px 14px; cursor:pointer; font-family:inherit; transition:all .12s}
.subtab:hover{border-color:#cfd5e0; color:var(--ink)}
.subtab.active{background:var(--blue); color:#fff; border-color:var(--blue)}`
);
html = html.replace(
  `    <div class="tabs" id="lotTabs"></div>`,
  `    <div class="tabs wi-groups" id="lotTabs"></div>
    <div class="tabs wi-subs" id="lotSubs"></div>`
);
html = html.replace(
  `  function renderWorkItems(){
    const w=D.workItems; var secWI=document.getElementById('sec-workitems');
    if(!w || !w.lots || !w.lots.length){ if(secWI) secWI.style.display='none'; return; }
    if(secWI) secWI.style.display='';
    $('t-workitems').textContent=(L.sections&&L.sections.s5)||'';
    const tabs=$('lotTabs'); tabs.innerHTML='';
    w.lots.forEach(lot=>{
      const b=document.createElement('button'); b.className='tab'+(lot.id===WI_ACTIVE?' active':'');
      b.textContent=lot.name; b.onclick=()=>{WI_ACTIVE=lot.id; renderWorkItems();};
      tabs.appendChild(b);
    });
    const lot=w.lots.find(l=>l.id===WI_ACTIVE)||w.lots[0];
    $('ct-workItems').textContent=\`\${(L.charts&&L.charts.workItems)||'İş Maddələri'} — \${lot.name} (%)\`;
    CHARTS.groupedBar('ch-workItems', lot.items.map(function(i){return i.name;}), lot.items.map(function(i){return i.plan;}), lot.items.map(function(i){return i.fakt;}), {showLabels:true, rotate:14});
  }`,
  `  var WI_GROUP=null, WI_SUB=null;
  function wiSubLabel(lot){ if(/^p\\d+$/.test(lot.id||'')) return 'Orta'; var m=String(lot.name||'').match(/—\\s*(.+)$/); return m?m[1].trim():(lot.name||''); }
  function wiGroups(lots){ var groups=[], by={};
    lots.forEach(function(lot){ var key; if(lot.id==='cemi') key='cemi'; else { var m=String(lot.id||'').match(/^(p\\d+)/); key=m?m[1]:lot.id; }
      if(!by[key]){ by[key]={key:key,label:'',lots:[]}; groups.push(by[key]); } by[key].lots.push(lot); });
    groups.forEach(function(g){ if(g.key==='cemi') g.label=g.lots[0].name; else { var orta=g.lots.filter(function(l){return /^p\\d+$/.test(l.id);})[0]||g.lots[0]; g.label=String(orta.name).replace(/\\s*—\\s*orta$/i,''); } });
    return groups; }
  function renderWorkItems(){
    var w=D.workItems; var secWI=document.getElementById('sec-workitems');
    if(!w || !w.lots || !w.lots.length){ if(secWI) secWI.style.display='none'; return; }
    if(secWI) secWI.style.display='';
    $('t-workitems').textContent=(L.sections&&L.sections.s5)||'';
    var groups=wiGroups(w.lots);
    if(!WI_GROUP||!groups.some(function(g){return g.key===WI_GROUP;})) WI_GROUP=groups[0].key;
    var g=groups.filter(function(x){return x.key===WI_GROUP;})[0]||groups[0];
    var gt=$('lotTabs'); gt.innerHTML='';
    groups.forEach(function(grp){ var b=document.createElement('button'); b.className='tab'+(grp.key===WI_GROUP?' active':'');
      b.textContent=grp.label; b.onclick=function(){ WI_GROUP=grp.key; WI_SUB=null; renderWorkItems(); }; gt.appendChild(b); });
    var st=document.getElementById('lotSubs');
    if(st){ if(g.lots.length>1){ st.style.display='';
        if(!WI_SUB||!g.lots.some(function(l){return l.id===WI_SUB;})) WI_SUB=g.lots[0].id;
        st.innerHTML=''; g.lots.forEach(function(lot){ var b=document.createElement('button'); b.className='subtab'+(lot.id===WI_SUB?' active':'');
          b.textContent=wiSubLabel(lot); b.onclick=function(){ WI_SUB=lot.id; renderWorkItems(); }; st.appendChild(b); });
      } else { st.style.display='none'; WI_SUB=g.lots[0].id; } }
    var lot=g.lots.filter(function(l){return l.id===WI_SUB;})[0]||g.lots[0];
    $('ct-workItems').textContent=((L.charts&&L.charts.workItems)||'İş Maddələri')+' — '+lot.name+' (%)';
    CHARTS.groupedBar('ch-workItems', lot.items.map(function(i){return i.name;}), lot.items.map(function(i){return i.plan;}), lot.items.map(function(i){return i.fakt;}), {showLabels:true, rotate:14});
  }`
);

// ------------------------------------------------------------------
// 13) Bold sentence-case + collapsible headings, regrouped insights,
//     single velocity note.
// ------------------------------------------------------------------
html = html.replace(
  `.section-title{
  font-size:12px; font-weight:700; letter-spacing:.09em; color:var(--faint);
  text-transform:uppercase; margin:0 0 14px;
}`,
  `.section-title{
  font-size:18px; font-weight:800; letter-spacing:.005em; color:var(--ink);
  text-transform:none; margin:0 0 16px; cursor:pointer; user-select:none;
  display:flex; align-items:center; gap:12px;
  padding:14px 18px; border-radius:12px;
  background:#F1F4F9; border:1px solid var(--border);
  transition:background .12s, box-shadow .12s;
}
.section-title:hover{background:#E7ECF4; box-shadow:0 1px 4px rgba(16,24,40,.08)}
.section-title::before{content:'▾'; font-size:18px; line-height:1; color:var(--blue);
  transition:transform .15s; flex:0 0 auto; width:22px; height:22px;
  display:inline-flex; align-items:center; justify-content:center;
  background:#fff; border:1px solid var(--border); border-radius:7px}
.section.collapsed .section-title::before{transform:rotate(-90deg)}
.section.collapsed .section-title{margin:0}
.section.collapsed > *:not(.section-title):not(script){display:none !important}
.insight .i-list{margin:7px 0 0; padding-left:20px}
.insight .i-list li{margin-bottom:5px; line-height:1.55}`
);
// Velocity: replace the verbose qeyd + nəticə with one brief summary note.
html = html.replace(
  `    // qeyd + netice (auto)
    const umumi=velRows.find(r=>/Ümumi/i.test(r.obyekt));
    const aheadAny = velRows.some(r=>r.ferq>0.5);
    const qeyd = aheadAny
      ? \`Bəzi obyektlər plandan qabaqda olduğu üçün onların aşağı həftəlik tempi hələlik risk yaratmır.\`
      : \`Hazırda bütün obyektlər plandan geri qalır. Plana uyğunluğun 100 faizdən aşağı olması kənarlaşmanın hər həftə artması deməkdir. Geriliyin bərpası üçün faktiki tempin tələb olunan tempi keçməsi zəruridir.\`;
    $('note-velQeyd').innerHTML=\`<div class="note note-qeyd"><span class="lead">Qeyd:</span> \${esc(qeyd)}</div>\`;
    if(umumi){
      const best=velRows.filter(r=>!/Ümumi/i.test(r.obyekt)).slice().sort((a,b)=>b.uygunluq-a.uygunluq)[0];
      const worst=velRows.filter(r=>!/Ümumi/i.test(r.obyekt)).slice().sort((a,b)=>a.uygunluq-b.uygunluq)[0];
      const netice = \`Ümumi layihə tələb olunan tempin \${Math.round(umumi.uygunluq)} faizi ilə irəliləyir. Hər həftə \${f2(umumi.teleb)} faiz irəliləmə tələb olunduğu halda faktiki olaraq \${f2(umumi.faktiki)} faiz əldə edilir. \`+
        \`Nisbətən yaxşı tempə malik sahə \${esc(best.short)} (\${Math.round(best.uygunluq)} faiz), ən böyük risk isə \${esc(worst.short)} (\${Math.round(worst.uygunluq)} faiz) üzərindədir. Əsas risk ümumi tempin tələbdən davamlı aşağı qalmasıdır.\`;
      $('note-velNetice').innerHTML=\`<div class="note note-blue"><span class="lead">Nəticə:</span> \${esc(netice)}</div>\`;
    }`,
  `    $('note-velQeyd').innerHTML='<div class="note note-blue"><span class="lead">Qeyd:</span> Bu bölmə hər obyekt üzrə gecikmənin həftədən-həftəyə dəyişməsini və cari iş templi ilə layihənin vaxtında tamamlanma ehtimalını əks etdirir.</div>';
    $('note-velNetice').innerHTML='';`
);
// Velocity table: drop the "Tələb" and "Faktiki" (%/həftə) columns — keep
// Obyekt / Plan / Fakt / Gecikmə / Plana uyğunluq / Sürət (matches config headers).
html = html.replace(
  `        \`<td><span class="\${r.ferq>=0?'pos':'neg'}">\${f2(r.teleb)}</span></td>\`+
        \`<td>\${f2(r.faktiki)}</td>\`+
`,
  ''
);
// Insights: regroup into concise bullet blocks (problems / progress / short analiz).
html = html.replace(
  `    const cats={kritik:'KRİTİK',diqqet:'DİQQƏT',analiz:'ANALİZ',musbet:'MÜSBƏT'};
    $('insightsList').innerHTML = list.map(i=>
      \`<div class="insight \${i.category}"><div class="i-title">\${cats[i.category]||''} — \${esc(i.title)}</div><div class="i-body">\${boldNums(i.body)}</div></div>\`
    ).join('');`,
  `    var L2 = list.filter(function(i){ return !/işçi heyəti|texnika|gündəlik məlumat|gündəlik hesabat|daxil edilməyib/i.test((i.title||'')+' '+(i.body||'')); });
    L2.forEach(function(i){ if(i.category==='analiz'){ var mm=String(i.body||'').match(/^[^.]*\\./); if(mm) i.body=mm[0]; } });
    function insBlock(title, items, cls){ if(!items.length) return '';
      return '<div class="insight '+cls+'"><div class="i-title">'+title+'</div><ul class="i-list">'+items.map(function(i){return '<li>'+boldNums(i.body)+'</li>';}).join('')+'</ul></div>'; }
    $('insightsList').innerHTML =
      insBlock('Tikinti gedişatında müəyyən olunan problemlər', L2.filter(function(i){return i.category==='kritik'||i.category==='diqqet';}), 'kritik')+
      insBlock('İcra gedişatındakı irəliləyiş', L2.filter(function(i){return i.category==='musbet';}), 'musbet');`
);
// Per-city manual insights: feed data.insightsPinned into the generator…
html = html.replace(
  `      otherObjects:D.otherObjects, workforce:D.workforce, velRows, cfg:D.insightsConfig,`,
  `      otherObjects:D.otherObjects, workforce:D.workforce, velRows, cfg:D.insightsConfig, pinned:D.insightsPinned,`
);
// …and emit them alongside the shared config pinned list.
html = html.replace(
  `    if(cfg && Array.isArray(cfg.pinned)){
      cfg.pinned.forEach(p=>{ if(p && p.category && p.title && p.body) add(p.category,p.title,p.body); });
    }`,
  `    if(cfg && Array.isArray(cfg.pinned)){
      cfg.pinned.forEach(p=>{ if(p && p.category && p.title && p.body) add(p.category,p.title,p.body); });
    }
    if(ctx && Array.isArray(ctx.pinned)){
      ctx.pinned.forEach(p=>{ if(p && p.category && p.title && p.body) add(p.category,p.title,p.body); });
    }`
);

// Per-report label overrides: merge data.labelOverrides over the shared config labels.
html = html.replace(
  `  const L = D.labels || {}; const TH = D.theme || {}; const C = (TH.colors||{});`,
  `  const L = D.labels || {}; const TH = D.theme || {}; const C = (TH.colors||{});
  (function(){ var o=D.labelOverrides; if(!o) return; ['sections','charts','table','footer','legend'].forEach(function(g){
    if(!o[g]) return; if(!L[g]) L[g]={}; for(var k in o[g]){ var val=o[g][k]; if(val!=null && val!=='') L[g][k]=val; } }); })();`
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
  ['function wiGroups', 'work-items grouped nav'],
  ['id="lotSubs"', 'work-items sub-tabs'],
  ['.subtab.active', 'sub-tab styling'],
  ['windowWidth:DESK', 'desktop-width PDF'],
  ['.section.collapsed > *', 'collapsible-section CSS'],
  ["classList.toggle('collapsed')", 'collapsible-section toggle'],
  ['function insBlock', 'regrouped insights bullets'],
  ['Mənbə kimi istifadə olunan sənədlər', 'sources footer label'],
  ['ctx.pinned.forEach', 'per-city manual insights'],
  ['D.labelOverrides', 'per-report label overrides'],
  ['hiddenSections', 'section show/hide'],
  ['Built by Emin', 'build credit'],
  ['Tikinti gedişatında müəyyən olunan problemlər', 'insights problem block'],
  ['cari iş templi ilə layihənin', 'single velocity note'],
]) {
  if (!html.includes(marker)) { console.error('ERROR: enhancement missing:', name); process.exit(1); }
}

fs.writeFileSync('engine/report.html', html);
console.log('Wrote engine/report.html (' + html.length + ' bytes)');
