/* Report builder app. Vanilla JS. */
(function () {
  const $ = id => document.getElementById(id);
  const P = window.REPORT_PARSERS;
  let data = P.blankData();
  let mode = 'new';
  let pickedFiles = [];
  let pdfBase64 = null;
  let curSlug = 'new';      // which draft key we are editing
  let dirty = false;
  if (window.pdfjsLib) pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';

  // ---------- mode ----------
  $('mNew').onclick = () => setMode('new');
  $('mUpd').onclick = () => setMode('upd');
  function setMode(m){ mode = m; $('mNew').classList.toggle('on',m==='new'); $('mUpd').classList.toggle('on',m==='upd');
    $('updPick').style.display = m==='upd' ? '' : 'none';
    $('inputPanel').querySelector('.drop').style.display = m==='upd' ? 'none' : '';
    if(m==='upd') loadCityList(); else { curSlug='new'; } }
  $('citySearch').oninput = function(){ renderCityList(this.value); };
  $('refreshCities').onclick = function(){ loadCityList(); };

  let ALL_CITIES=[];
  async function loadCityList(){
    $('cityList').innerHTML='<div class="city-empty">Yüklənir…</div>';
    try{ ALL_CITIES = await fetch('./cities.json?cb='+Date.now()).then(r=>r.json());
      renderCityList($('citySearch').value||'');
    }catch(e){ $('cityList').innerHTML='<div class="city-empty">Siyahı yüklənmədi.</div>'; }
  }
  function statusCls(o,p){ if(o==null||p==null) return ''; const d=o-p; return d<=-15?'risk':(d<0?'warn':'good'); }
  function escH(s){ return String(s==null?'':s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])); }
  function ageDays(dmy){ const d=parseDMY(dmy); if(!d) return null; return Math.round((Date.now()-d.getTime())/864e5); }
  function ageLabel(dmy){ const a=ageDays(dmy); if(a==null) return ''; if(a<=0) return 'bu gün'; if(a===1) return 'dünən'; return a+' gün əvvəl'; }
  function renderCityList(filter){
    const q=(filter||'').toLowerCase().trim();
    const list=ALL_CITIES.filter(c=>!q || (c.village||'').toLowerCase().includes(q) || (c.district||'').toLowerCase().includes(q) || (c.slug||'').toLowerCase().includes(q));
    $('cityCount').textContent=ALL_CITIES.length+' şəhər'+(q?(' · '+list.length+' uyğun'):'')+' · klikləyib redaktə edin';
    if(!list.length){ $('cityList').innerHTML='<div class="city-empty">'+(ALL_CITIES.length?'Tapılmadı.':'Hələ şəhər yoxdur.')+'</div>'; return; }
    $('cityList').innerHTML=list.map(c=>{ const cls=statusCls(c.overall,c.plan); const age=ageDays(c.reportDate);
      const stale=age!=null&&age>14; const draft=hasDraft(c.slug);
      return '<div class="city-item" data-slug="'+String(c.slug).replace(/"/g,'&quot;')+'">'+
        '<div style="min-width:0"><div class="cv">'+escH(c.village||c.slug)+(draft?' <span class="tagd" title="Yadda saxlanmamış qaralama var">qaralama</span>':'')+'</div>'+
        '<div class="cd">'+escH(c.district||'')+(c.reportDate?(' · '+escH(c.reportDate)+(c.reportDate?(' <span class="'+(stale?'stale':'')+'">('+ageLabel(c.reportDate)+')</span>'):'')):'')+
        ' · <a href="../'+escH(c.slug)+'/" target="_blank" rel="noopener" onclick="event.stopPropagation()">canlı ↗</a></div></div>'+
        '<div class="cp '+cls+'">'+(c.overall!=null?(c.overall+'%'):'—')+'</div></div>';
    }).join('');
    [...$('cityList').querySelectorAll('.city-item')].forEach(el=>{ el.onclick=()=>{
      if(dirty && !confirm('Yadda saxlanmamış dəyişikliklər var. Davam edək?')) return;
      [...$('cityList').querySelectorAll('.city-item')].forEach(x=>x.classList.remove('sel')); el.classList.add('sel');
      loadCityData(el.getAttribute('data-slug')); }; });
  }
  async function loadCityData(slug){
    status('parseStatus','“'+slug+'” yüklənir…'); curSlug=slug;
    try{
      const draft=loadDraft(slug);
      if(draft && confirm('Bu şəhər üçün yadda saxlanmamış qaralama tapıldı. Onu bərpa edək? (Ləğv = canlı versiyanı yüklə)')){
        data=Object.assign(P.blankData(), draft);
      } else {
        const js = await fetch('../'+slug+'/data.js?cb='+Date.now()).then(r=>r.text());
        const sb = { window:{DASH:{}} }; (new Function('window', js))(sb.window);
        data = Object.assign(P.blankData(), sb.window.DASH);
        clearDraft(slug);
      }
      $('cityName').value = (data.meta&&data.meta.village)||slug;
      dirty=false; renderEditor(); refresh(); status('parseStatus','“'+((data.meta&&data.meta.village)||slug)+'” yükləndi — bütün məlumatı redaktə edə bilərsiniz.','ok');
    }catch(e){ status('parseStatus','Yüklənmədi: '+e.message,'err'); }
  }

  // ---------- drafts (autosave) ----------
  const DK = slug => 'qrv-draft:'+(slug||'new');
  function saveDraft(){ try{ localStorage.setItem(DK(curSlug), JSON.stringify(data)); }catch(e){} }
  function loadDraft(slug){ try{ const s=localStorage.getItem(DK(slug)); return s?JSON.parse(s):null; }catch(e){ return null; } }
  function clearDraft(slug){ try{ localStorage.removeItem(DK(slug)); }catch(e){} }
  function hasDraft(slug){ try{ return !!localStorage.getItem(DK(slug)); }catch(e){ return false; } }
  function markDirty(){ dirty=true; saveDraft(); $('dirtyFlag').textContent='● yadda saxlanmamış (lokal qaralama saxlanıldı)'; $('dirtyFlag').className='note dirty'; }
  window.addEventListener('beforeunload', e=>{ if(dirty){ e.preventDefault(); e.returnValue=''; } });

  // ---------- file upload ----------
  const drop = $('drop'), fileInput = $('fileInput');
  drop.onclick = () => fileInput.click();
  drop.ondragover = e => { e.preventDefault(); drop.classList.add('drag'); };
  drop.ondragleave = () => drop.classList.remove('drag');
  drop.ondrop = e => { e.preventDefault(); drop.classList.remove('drag'); addFiles(e.dataTransfer.files); };
  fileInput.onchange = () => addFiles(fileInput.files);
  function addFiles(fl){ for(const f of fl) pickedFiles.push(f);
    $('fileList').innerHTML = pickedFiles.map(f=>`• ${f.name} <span class="note">(${(f.size/1024|0)} KB)</span>`).join('<br>');
    $('parseBtn').disabled = pickedFiles.length===0; }

  $('blankBtn').onclick = () => { data = P.blankData(); curSlug='new'; dirty=false; renderEditor(); refresh(); status('parseStatus','Boş şablon.','ok'); };

  // ---------- parse ----------
  $('parseBtn').onclick = async () => {
    status('parseStatus','Oxunur…');
    try{
      let exData=null, pdfData=null;
      for(const f of pickedFiles){
        const lower=f.name.toLowerCase();
        if(lower.endsWith('.xlsx')||lower.endsWith('.xls')){
          const wb = XLSX.read(await f.arrayBuffer(), {type:'array', cellDates:false});
          const sheets = wb.SheetNames.map(n=>({name:n, rows:XLSX.utils.sheet_to_json(wb.Sheets[n],{header:1,raw:true,defval:''})}));
          exData = P.parseExcelRows(sheets);
        } else if(lower.endsWith('.pdf')){
          const bytes = new Uint8Array(await f.arrayBuffer());
          const parsed = P.parsePrimaveraText(await pdfText(bytes.slice())); // copy: pdf.js may detach
          if(parsed.workItems.lots.length || !pdfData){ pdfData = parsed; pdfBase64 = bytesToB64(bytes); }
        }
      }
      // When updating an existing city, merge new numbers onto the loaded data (keep manual edits where the import is blank).
      const base = (mode==='upd' && data && data.meta) ? data : P.blankData();
      data = merge(base, exData, pdfData);
      if(pdfBase64) data.meta.sourcePdf = 'source.pdf';
      defaults(data);
      dirty=true; saveDraft(); renderEditor(); refresh();
      status('parseStatus','Oxundu — aşağıda yoxlayın və redaktə edin.','ok');
    }catch(e){ status('parseStatus','Xəta: '+e.message,'err'); console.error(e); }
  };

  function bytesToB64(bytes){ var bin='', CH=0x8000;
    for(var i=0;i<bytes.length;i+=CH) bin+=String.fromCharCode.apply(null, bytes.subarray(i,i+CH));
    return btoa(bin); }

  async function pdfText(buf){
    const pdf = await pdfjsLib.getDocument({data:buf}).promise; let out='';
    for(let i=1;i<=pdf.numPages;i++){
      const tc = await (await pdf.getPage(i)).getTextContent();
      let lastY=null, line='';
      for(const it of tc.items){ const y=Math.round(it.transform[5]);
        if(lastY!==null && Math.abs(y-lastY)>2){ out+=line+'\n'; line=''; }
        line += it.str+' '; lastY=y; }
      out += line+'\n';
    }
    return out;
  }

  function merge(base, ex, pdf){
    const d = base;
    if(ex){ Object.assign(d.meta, prune(ex.meta));
      if(ex.overall&&ex.overall.objects&&ex.overall.objects.length) d.overall=ex.overall;
      if(ex.packages&&ex.packages.items&&ex.packages.items.length) d.packages.items=ex.packages.items;
      if(ex.velocity&&ex.velocity.rows&&ex.velocity.rows.length) d.velocity.rows=ex.velocity.rows;
      if(ex.infrastructure&&ex.infrastructure.overallFakt!=null){ d.infrastructure.overallFakt=ex.infrastructure.overallFakt; d.infrastructure.overallPlan=ex.infrastructure.overallPlan; } }
    if(pdf){ if(pdf.workItems.lots.length) d.workItems=pdf.workItems;
      if(pdf.infrastructure.items.length) d.infrastructure.items=pdf.infrastructure.items;
      if(pdf.packages.items.length){
        d.packages.items = pdf.packages.items.map(p=>({name:p.name,ev:p.ev,plan:p.plan,fakt:p.fakt}));
        d.overall.objects = (d.overall.objects||[]).map(o=>{ const m=pdf.packages.items.find(p=>sameEv(p.name,o.name)); return m?{...o,plan:m.plan,fakt:m.fakt}:o; });
      }
      if(pdf.meta.primaveraCode) d.meta.primaveraCode=pdf.meta.primaveraCode;
    }
    return d;
  }
  const sameEv=(a,b)=>{ const ea=(a.match(/\d+/)||[])[0], eb=(b.match(/\d+/)||[])[0]; return ea&&ea===eb; };
  const prune=o=>{ const r={}; for(const k in o) if(o[k]!=null&&o[k]!=='') r[k]=o[k]; return r; };

  function parseDMY(s){ const m=String(s||'').match(/(\d{2})\.(\d{2})\.(\d{4})/); return m?new Date(+m[3],+m[2]-1,+m[1]):null; }
  function recompute(d){   // refresh auto-derived fields from current data (non-destructive to manual figures)
    const m=d.meta;
    const a=parseDMY(m.cutoffDate), b=parseDMY(m.revisedFinish||m.plannedFinish);
    if(a&&b) m.daysRemaining=Math.max(0, Math.round((b-a)/864e5));
    // KPI sub-texts that depend on meta
    const dev=(v,p)=>(v!=null&&p!=null)?((v-p>=0?'+':'')+(v-p).toFixed(2)+'%'):'';
    (d.kpi||[]).forEach(k=>{
      if(k.id==='umumi' && m.officialOverall!=null){ k.value=String(m.officialOverall); k.sub=m.officialPlan!=null?('Plan: '+m.officialPlan+'% | '+dev(m.officialOverall,m.officialPlan)):k.sub; }
      if(k.id==='qalan' && m.daysRemaining!=null){ k.value='~'+m.daysRemaining; k.sub=(m.revisedFinish||m.plannedFinish)?('Hədəf: '+(m.revisedFinish||m.plannedFinish)):k.sub; }
    });
    // workforce totals/KPIs from daily rows
    const wf=d.workforce;
    if(wf && wf.daily && wf.daily.length){
      wf.available=true;
      wf.totalSeries=wf.daily.map(x=>({date:x.date,total:(+x.sahe||0)+(+x.texniki||0)+(+x.idari||0)}));
      const last=wf.daily[wf.daily.length-1]; const tot=(+last.sahe||0)+(+last.texniki||0)+(+last.idari||0);
      const ki=(d.kpi||[]).find(k=>k.id==='isciler'); if(ki){ ki.value=String(tot); ki.unit=''; ki.pending=false; ki.sub=last.date?('Son hesabat: '+last.date):''; }
      const km=(d.kpi||[]).find(k=>k.id==='texnika'); if(km){ km.value=String((wf.machinery||[]).reduce((s,x)=>s+(+x.count||0),0)); km.pending=(wf.machinery||[]).length===0; }
    }
  }
  function defaults(d){
    const m=d.meta;
    if(!m.projectTitle && m.village) m.projectTitle = (m.village+' — Tikinti Gedişatı Hesabatı').toUpperCase();
    if(m.daysRemaining==null){ const a=parseDMY(m.cutoffDate), b=parseDMY(m.revisedFinish||m.plannedFinish);
      if(a&&b) m.daysRemaining=Math.max(0, Math.round((b-a)/864e5)); }
    const fye=(d.overall.objects||[]).find(o=>/Fərdi|Ferdi|FYE|851/i.test(o.name));
    const dev=(v,p)=>(v!=null&&p!=null)?((v-p>=0?'+':'')+(v-p).toFixed(2)+'%'):'';
    if(!d.kpi.length){
      d.kpi=[
        {id:'umumi',value:m.officialOverall!=null?String(m.officialOverall):'',unit:'%',label:'ÜMUMİ İCRA (RƏSMİ)',sub:m.officialPlan!=null?('Plan: '+m.officialPlan+'% | '+dev(m.officialOverall,m.officialPlan)):'',accent:'teal',deltaSign:'neg',pending:m.officialOverall==null},
        {id:'evler',value:fye&&fye.fakt!=null?String(fye.fakt):'',unit:'%',label:'FƏRDİ EVLƏR'+(fye&&/\((\d+)\)/.test(fye.name)?(' ('+fye.name.match(/\((\d+)\)/)[1]+')'):''),sub:fye&&fye.plan!=null?('Plan: '+fye.plan+'% | '+dev(fye.fakt,fye.plan)):'',accent:'teal',deltaSign:'neg',pending:!(fye&&fye.fakt!=null)},
        {id:'isciler',value:'',unit:'',label:'İŞÇİ SAYI (GÜNDƏLİK)',sub:'Məlumat əlavə edilməyib',accent:'violet',deltaSign:'none',pending:true},
        {id:'texnika',value:'',unit:'',label:'TEXNİKA VAHİDİ',sub:'Məlumat əlavə edilməyib',accent:'orange',deltaSign:'none',pending:true},
        {id:'qalan',value:m.daysRemaining!=null?('~'+m.daysRemaining):'',unit:' gün',label:'BİTMƏYƏ QALAN',sub:(m.revisedFinish||m.plannedFinish)?('Hədəf: '+(m.revisedFinish||m.plannedFinish)):'',accent:'red',deltaSign:'none',pending:false},
      ];
    }
    if(!d.workforce.emptyNote) d.workforce.emptyNote='İşçi heyəti və texnika üzrə gündəlik hesabat hələ əlavə edilməyib.';
    if(!d.velocity.cutoff && m.cutoffDate) d.velocity.cutoff=m.cutoffDate.replace(/(\d{2})\.(\d{2})\.(\d{4})/,'$3-$2-$1');
    if(!d.velocity.points || !d.velocity.points.length) d.velocity.points=['','','' ];
    if(!d.packages.trendNote && d.packages.trend && d.packages.trend.length) d.packages.trendNote='Ümumi icra trendi (faktiki %).';
  }

  // ---------- validation / health-check ----------
  function validate(d){
    const errs=[], warns=[]; const m=d.meta||{};
    const pctBad=v=>v!=null&&v!==''&&(isNaN(+v)||+v<0||+v>100);
    if(!m.village) errs.push('Kənd/Şəhər adı boşdur.');
    ['reportDate','cutoffDate','startDate','plannedFinish'].forEach(k=>{ if(m[k]&&!parseDMY(m[k])) warns.push('Tarix formatı yanlış ('+k+'): GG.AA.İLİL gözlənilir.'); });
    if(pctBad(m.officialOverall)) errs.push('Ümumi icra %  0–100 aralığında olmalıdır.');
    if(pctBad(m.officialPlan)) errs.push('Ümumi plan %  0–100 aralığında olmalıdır.');
    const chk=(arr,lbl)=>(arr||[]).forEach((r,i)=>{ if(pctBad(r.plan)||pctBad(r.fakt)) errs.push(lbl+' #'+(i+1)+' ('+(r.name||r.obyekt||'')+'): plan/fakt 0–100 olmalıdır.');
      if(r.plan!=null&&r.fakt!=null&&+r.fakt>+r.plan+0.01) warns.push(lbl+' “'+(r.name||r.obyekt||'')+'”: fakt ('+r.fakt+') plandan ('+r.plan+') böyükdür.'); });
    chk(d.overall&&d.overall.objects,'Ümumi obyekt'); chk(d.packages&&d.packages.items,'Paket'); chk(d.infrastructure&&d.infrastructure.items,'İnfrastruktur'); chk(d.velocity&&d.velocity.rows,'Sürət');
    // overall vs weighted package average
    const pk=(d.packages&&d.packages.items)||[]; const wsum=pk.reduce((s,p)=>s+(+p.ev||0),0);
    if(wsum>0 && m.officialOverall!=null){ const avg=pk.reduce((s,p)=>s+(+p.ev||0)*(+p.fakt||0),0)/wsum;
      if(Math.abs(avg-(+m.officialOverall))>8) warns.push('Ümumi icra ('+m.officialOverall+'%) paketlərin çəkili ortalamasından ('+avg.toFixed(1)+'%) çox fərqlənir.'); }
    return {errs, warns};
  }
  function renderHealth(){
    const {errs,warns}=validate(data); const el=$('healthCheck');
    if(!errs.length && !warns.length){ el.innerHTML='<div class="hc ok">✓ Yoxlama: problem tapılmadı.</div>'; return {errs,warns}; }
    el.innerHTML=
      (errs.length?'<div class="hc err"><b>✕ '+errs.length+' xəta:</b><ul>'+errs.map(e=>'<li>'+escH(e)+'</li>').join('')+'</ul></div>':'')+
      (warns.length?'<div class="hc warn"><b>⚠ '+warns.length+' xəbərdarlıq:</b><ul>'+warns.map(e=>'<li>'+escH(e)+'</li>').join('')+'</ul></div>':'');
    return {errs,warns};
  }

  // ---------- editor primitives ----------
  function num(x){ return (x==null||x==='')?'':x; }
  function toNum(s){ if(s===''||s==null) return null; const n=parseFloat(String(s).replace(',','.')); return isNaN(n)?null:n; }
  function devDot(plan,fakt){ if(plan==null||fakt==null||plan===''||fakt==='') return '';
    const d=+fakt-+plan; const cls=d<=-15?'risk':(d<0?'warn':'good'); return '<span class="dot '+cls+'" title="Fərq: '+d.toFixed(2)+'%"></span>'; }

  // cols: {key,label,type:'text'|'num'|'select'|'bool', options:[...]}  opts:{derived:[{label,fn}], dot:true}
  function tableEditor(arr, cols, opts){
    opts=opts||{};
    const t=document.createElement('table'); t.className='ed-table';
    const head='<tr>'+(opts.dot?'<th></th>':'')+cols.map(c=>`<th>${c.label}</th>`).join('')+(opts.derived||[]).map(d=>`<th>${d.label}</th>`).join('')+'<th></th></tr>';
    function cell(row,i,c){
      const val=num(row[c.key]);
      if(c.type==='select') return `<td><select data-i="${i}" data-k="${c.key}">`+ (c.options||[]).map(o=>`<option ${String(val)===o?'selected':''}>${o}</option>`).join('') +`</select></td>`;
      if(c.type==='bool') return `<td style="text-align:center"><input type="checkbox" data-i="${i}" data-k="${c.key}" data-t="bool" ${val===true||val==='true'?'checked':''}></td>`;
      const inv=c.type==='num'?'inputmode="decimal"':'';
      return `<td><input ${inv} data-i="${i}" data-k="${c.key}" data-t="${c.type||'text'}" value="${String(val).replace(/"/g,'&quot;')}"></td>`;
    }
    function draw(){
      t.innerHTML=head+arr.map((row,i)=>'<tr>'+
        (opts.dot?('<td class="dotcell">'+devDot(row.plan,row.fakt)+'</td>'):'')+
        cols.map(c=>cell(row,i,c)).join('')+
        (opts.derived||[]).map(d=>`<td class="derived">${escH(d.fn(row))}</td>`).join('')+
        `<td><button class="mini" data-del="${i}">✕</button></td></tr>`).join('')+
      `<tr><td colspan="${cols.length+(opts.dot?1:0)+(opts.derived||[]).length+1}"><button class="mini" data-add="1">＋ sətir</button>
        <span class="note" style="margin-left:8px">Excel-dən xanaları kopyalayıb buraya yapışdıra bilərsiniz.</span></td></tr>`;
    }
    draw();
    t.addEventListener('input', e=>{ const el=e.target; if(el.dataset.k==null) return;
      const i=+el.dataset.i, k=el.dataset.k;
      arr[i][k] = el.dataset.t==='num'? toNum(el.value): (el.type==='checkbox'? el.checked : el.value);
      if(opts.dot){ const dc=el.closest('tr').querySelector('.dotcell'); if(dc) dc.innerHTML=devDot(arr[i].plan,arr[i].fakt); }
      if((opts.derived||[]).length){ const tds=el.closest('tr').querySelectorAll('.derived'); (opts.derived||[]).forEach((d,di)=>{ if(tds[di]) tds[di].textContent=d.fn(arr[i]); }); }
      onEdit(); });
    t.addEventListener('change', e=>{ if(e.target.dataset.k!=null && e.target.tagName==='SELECT'){ const i=+e.target.dataset.i; arr[i][e.target.dataset.k]=e.target.value; onEdit(); } });
    t.addEventListener('click', e=>{ const el=e.target;
      if(el.dataset.del!=null){ arr.splice(+el.dataset.del,1); draw(); onEdit(); }
      else if(el.dataset.add){ const o={}; cols.forEach(c=>o[c.key]=c.type==='num'?null:(c.type==='bool'?false:'')); arr.push(o); draw(); onEdit(); } });
    // paste-from-Excel: fill grid starting at the focused cell
    t.addEventListener('paste', e=>{ const el=e.target; if(el.dataset.k==null) return;
      const txt=(e.clipboardData||window.clipboardData).getData('text'); if(!/\t|\n/.test(txt)) return; // single value → default paste
      e.preventDefault();
      const rows=txt.replace(/\r/g,'').replace(/\n+$/,'').split('\n').map(r=>r.split('\t'));
      const startI=+el.dataset.i, startK=el.dataset.k, startCol=cols.findIndex(c=>c.key===startK);
      rows.forEach((cells,ri)=>{ const ti=startI+ri; if(!arr[ti]){ const o={}; cols.forEach(c=>o[c.key]=c.type==='num'?null:''); arr[ti]=o; }
        cells.forEach((val,ci)=>{ const col=cols[startCol+ci]; if(!col) return; arr[ti][col.key]= col.type==='num'? toNum(val): val; }); });
      draw(); onEdit();
    });
    return t;
  }
  function kvEditor(obj, fields){
    const wrap=document.createElement('div'); wrap.className='kv';
    fields.forEach(f=>{
      const lab=document.createElement('label'); lab.textContent=f.label||f.key;
      let inp;
      if(f.type==='select'){ inp=document.createElement('select'); (f.options||[]).forEach(o=>{ const op=document.createElement('option'); op.textContent=o; op.value=o; inp.appendChild(op); }); inp.value=num(obj[f.key]); }
      else if(f.type==='bool'){ inp=document.createElement('select'); ['true','false'].forEach(o=>{ const op=document.createElement('option'); op.textContent=o; op.value=o; inp.appendChild(op); }); inp.value=String(!!obj[f.key]); }
      else { inp=f.area?document.createElement('textarea'):document.createElement('input'); if(f.area) inp.rows=2; if(f.type==='num') inp.setAttribute('inputmode','decimal'); inp.value=num(obj[f.key]); }
      inp.oninput=inp.onchange=()=>{ obj[f.key]= f.type==='num'? toNum(inp.value): (f.type==='bool'? (inp.value==='true'): inp.value); onEdit(); };
      wrap.appendChild(lab); wrap.appendChild(inp);
    });
    return wrap;
  }
  function section(title, node, open){
    const d=document.createElement('details'); if(open) d.open=true;
    d.innerHTML=`<summary>${title}</summary>`; const c=document.createElement('div'); c.appendChild(node); d.appendChild(c); return d;
  }

  const ACCENTS=['teal','violet','orange','red','blue'], SIGNS=['pos','neg','none'];
  const devCol={label:'Fərq', fn:r=>(r.plan!=null&&r.fakt!=null&&r.plan!==''&&r.fakt!=='')?((+r.fakt-+r.plan>=0?'+':'')+(+r.fakt-+r.plan).toFixed(2)+'%'):''};

  function renderEditor(){
    const ed=$('editor'); ed.innerHTML='';
    const recalc=document.createElement('button'); recalc.className='btn'; recalc.textContent='↻ Avtomatik sahələri yenilə';
    recalc.title='Qalan gün, KPI alt-mətnləri və işçi cəmlərini cari məlumatdan yenidən hesablayır';
    recalc.onclick=()=>{ recompute(data); renderEditor(); onEdit(); };
    ed.appendChild(recalc);

    ed.appendChild(section('Layihə (Meta)', kvEditor(data.meta,[
      {key:'projectTitle',label:'Başlıq'},{key:'village',label:'Kənd/Şəhər'},{key:'district',label:'Rayon'},
      {key:'contractor',label:'Podratçı'},{key:'reportDate',label:'Hesabat tarixi'},{key:'cutoffDate',label:'Rəsmi kəsim'},
      {key:'startDate',label:'Başlama'},{key:'plannedFinish',label:'Plan bitmə'},{key:'revisedFinish',label:'Yenilənmiş bitmə'},
      {key:'baselineDays',label:'Baza gün',type:'num'},{key:'extraDays',label:'Əlavə gün',type:'num'},{key:'daysRemaining',label:'Qalan gün',type:'num'},
      {key:'officialOverall',label:'Ümumi icra %',type:'num'},{key:'officialPlan',label:'Ümumi plan %',type:'num'},
      {key:'primaveraCode',label:'Primavera kodu'},{key:'sourcePdf',label:'Mənbə PDF'},
    ]),true));
    ed.appendChild(section('KPI kartları', tableEditor(data.kpi,[
      {key:'label',label:'Etiket'},{key:'value',label:'Dəyər'},{key:'unit',label:'Vahid'},{key:'sub',label:'Alt mətn'},
      {key:'accent',label:'Rəng',type:'select',options:ACCENTS},{key:'deltaSign',label:'Δ',type:'select',options:SIGNS},{key:'pending',label:'Gözləmə',type:'bool'}])));
    ed.appendChild(section('Ümumi mənzərə (obyektlər)', tableEditor(data.overall.objects,[
      {key:'name',label:'Obyekt'},{key:'plan',label:'Plan',type:'num'},{key:'fakt',label:'Fakt',type:'num'}],{dot:true,derived:[devCol]})));
    ed.appendChild(section('Paketlər', tableEditor(data.packages.items,[
      {key:'name',label:'Ad'},{key:'ev',label:'Ev',type:'num'},{key:'plan',label:'Plan',type:'num'},{key:'fakt',label:'Fakt',type:'num'}],{dot:true,derived:[devCol]})));
    ed.appendChild(section('Trend (faktiki + plan)', wrapNote(tableEditor(data.packages.trend,[
      {key:'date',label:'Tarix'},{key:'fakt',label:'Fakt',type:'num'},{key:'plan',label:'Plan',type:'num'}]),
      data.packages,'trendNote','Trend qeydi')));
    ed.appendChild(section('Görülən işlər (lotlar)', workItemsEditor()));
    ed.appendChild(section('İnfrastruktur', infraEditor()));
    ed.appendChild(section('Digər obyektlər (məktəb, bağça və s.)', otherEditor()));
    ed.appendChild(section('Həftəlik sürət', velocityEditor()));
    ed.appendChild(section('İşçi heyəti və texnika', workforceEditor()));
    ed.appendChild(section('Əl ilə şərhlər (Təkliflər/risklər)', pinnedEditor()));
    renderHealth();
  }
  function wrapNote(node, obj, key, label){ const w=document.createElement('div'); w.appendChild(node);
    const k=kvEditor(obj,[{key,label,area:true}]); w.appendChild(k); return w; }

  function workItemsEditor(){
    const wrap=document.createElement('div');
    function draw(){ wrap.innerHTML='';
      data.workItems.lots.forEach((lot,li)=>{
        const box=document.createElement('div'); box.style.marginBottom='8px';
        box.appendChild(kvEditor(lot,[{key:'name',label:'Lot adı'},{key:'id',label:'id'},{key:'ev',label:'Ev',type:'num'}]));
        box.appendChild(tableEditor(lot.items,[{key:'name',label:'İş'},{key:'plan',label:'Plan',type:'num'},{key:'fakt',label:'Fakt',type:'num'}],{dot:true,derived:[devCol]}));
        const del=document.createElement('button'); del.className='mini'; del.textContent='✕ lotu sil';
        del.onclick=()=>{ data.workItems.lots.splice(li,1); draw(); onEdit(); }; box.appendChild(del);
        wrap.appendChild(box);
      });
      const add=document.createElement('button'); add.className='mini'; add.textContent='＋ lot əlavə et';
      add.onclick=()=>{ data.workItems.lots.push({id:'lot'+(data.workItems.lots.length+1),name:'Yeni lot',ev:null,items:[]}); draw(); onEdit(); };
      wrap.appendChild(add);
    }
    draw(); return wrap;
  }
  function infraEditor(){
    const w=document.createElement('div');
    w.appendChild(kvEditor(data.infrastructure,[{key:'overallPlan',label:'Ümumi plan',type:'num'},{key:'overallFakt',label:'Ümumi fakt',type:'num'},{key:'asOf',label:'Tarix'}]));
    w.appendChild(tableEditor(data.infrastructure.items,[{key:'name',label:'Komponent'},{key:'plan',label:'Plan',type:'num'},{key:'fakt',label:'Fakt',type:'num'}],{dot:true,derived:[devCol]}));
    w.appendChild(kvEditor(data.infrastructure,[{key:'weeklyNote',label:'Qeyd',area:true}]));
    return w;
  }
  function otherEditor(){
    const o=data.otherObjects=data.otherObjects||{objects:[],asOf:'',contractNote:''};
    o.objects=o.objects||[];
    const w=document.createElement('div');
    w.appendChild(tableEditor(o.objects,[{key:'name',label:'Obyekt'},{key:'plan',label:'Plan',type:'num'},{key:'fakt',label:'Fakt',type:'num'},{key:'status',label:'Status'}],{dot:true}));
    w.appendChild(kvEditor(o,[{key:'asOf',label:'Tarix'},{key:'contractNote',label:'Müqavilə qeydi',area:true}]));
    return w;
  }
  function velocityEditor(){
    const v=data.velocity; v.points=v.points||['','',''];
    const w=document.createElement('div');
    w.appendChild(kvEditor(v,[{key:'cutoff',label:'Kəsim tarixi'},{key:'priorDate',label:'Əvvəlki tarix'},{key:'priorWeeks',label:'Həftə sayı',type:'num'}]));
    const pts={p0:v.points[0]||'',p1:v.points[1]||'',p2:v.points[2]||''};
    const pe=kvEditor(pts,[{key:'p0',label:'Nöqtə 1 (ən köhnə)'},{key:'p1',label:'Nöqtə 2'},{key:'p2',label:'Nöqtə 3 (cari)'}]);
    pe.addEventListener('input',()=>{ v.points=[pts.p0,pts.p1,pts.p2]; });
    w.appendChild(pe);
    w.appendChild(tableEditor(v.rows,[
      {key:'obyekt',label:'Obyekt'},{key:'plan',label:'Plan',type:'num'},{key:'fakt',label:'Fakt',type:'num'},
      {key:'finish',label:'Bitmə'},{key:'priorFakt',label:'Əvvəlki fakt',type:'num'}],{dot:true}));
    const note=document.createElement('div'); note.className='note';
    note.textContent='dev3 (3 həftəlik gecikmə) Excel-dən gəlir. Hər sətir üçün dəqiqləşdirmək lazım olsa, data.js / Excel-də redaktə edin.';
    w.appendChild(note); return w;
  }
  function workforceEditor(){
    const wf=data.workforce; wf.daily=wf.daily||[]; wf.machinery=wf.machinery||[];
    const w=document.createElement('div');
    w.appendChild(kvEditor(wf,[{key:'available',label:'Məlumat var',type:'bool'},{key:'period',label:'Dövr'}]));
    const h1=document.createElement('div'); h1.className='subh'; h1.textContent='Gündəlik işçi sayı'; w.appendChild(h1);
    w.appendChild(tableEditor(wf.daily,[{key:'date',label:'Tarix'},{key:'sahe',label:'Sahə',type:'num'},{key:'texniki',label:'Texniki',type:'num'},{key:'idari',label:'İdari',type:'num'}],
      {derived:[{label:'Cəmi',fn:r=>String((+r.sahe||0)+(+r.texniki||0)+(+r.idari||0))}]}));
    const h2=document.createElement('div'); h2.className='subh'; h2.textContent='Texnika tərkibi'; w.appendChild(h2);
    w.appendChild(tableEditor(wf.machinery,[{key:'name',label:'Texnika'},{key:'count',label:'Sayı',type:'num'}]));
    w.appendChild(kvEditor(wf,[{key:'emptyNote',label:'Boş qeyd (məlumat yoxdursa)',area:true},{key:'alert',label:'Xəbərdarlıq',area:true}]));
    const note=document.createElement('div'); note.className='note';
    note.textContent='Gündəlik sətir əlavə etdikdə “Avtomatik sahələri yenilə” düyməsi İşçi/Texnika KPI-larını və cəm qrafikini dolduracaq.';
    w.appendChild(note); return w;
  }

  function pinnedEditor(){
    data.insightsPinned=data.insightsPinned||[];
    const w=document.createElement('div');
    const note=document.createElement('div'); note.className='note';
    note.innerHTML='Bu şərhlər avtomatik analizə əlavə olunur. Kateqoriya: <b>kritik / diqqet</b> → “Problemlər” bloku, <b>musbet</b> → “İrəliləyiş” bloku.';
    w.appendChild(note);
    w.appendChild(tableEditor(data.insightsPinned,[
      {key:'category',label:'Kateqoriya',type:'select',options:['kritik','diqqet','musbet']},
      {key:'title',label:'Başlıq'},{key:'body',label:'Mətn'}]));
    return w;
  }

  // ---------- edit hook: autosave + debounced live preview + health ----------
  let prevTimer=null;
  function onEdit(){ markDirty(); renderHealth(); clearTimeout(prevTimer); prevTimer=setTimeout(refresh, 450); }

  // ---------- preview ----------
  let tpl=null, cfg=null;
  async function loadEngine(){ if(tpl&&cfg) return; tpl=await fetch('./report-template.html').then(r=>r.text()); cfg=await fetch('./config.js').then(r=>r.text()); }
  async function refresh(){
    try{ await loadEngine();
      const js=window.dataToJs(data);
      const html=tpl.replace('<script src="./config.js"><\/script>','<script>'+cfg+'<\/script>')
                    .replace('<script src="./data.js"><\/script>','<script>'+js+'<\/script>');
      $('preview').srcdoc=html;
    }catch(e){ status('deployStatus','Önizləmə xətası: '+e.message,'err'); }
  }
  $('refreshBtn').onclick = refresh;

  // ---------- download ----------
  $('dlData').onclick=()=>dl(window.dataToJs(data),'data.js','application/javascript');
  $('dlXlsx').onclick=()=>{ const b64=window.dataToXlsxBase64(data); dlB64(b64,'source.xlsx'); };
  function dl(text,name,type){ const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([text],{type})); a.download=name; a.click(); }
  function dlB64(b64,name){ const bin=atob(b64); const arr=new Uint8Array(bin.length); for(let i=0;i<bin.length;i++)arr[i]=bin.charCodeAt(i);
    const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([arr])); a.download=name; a.click(); }

  // ---------- deploy ----------
  // remember password for the session only
  try{ const pw=sessionStorage.getItem('qrv-pw'); if(pw) $('pwd').value=pw; }catch(e){}
  $('pwd').oninput=function(){ try{ sessionStorage.setItem('qrv-pw',this.value); }catch(e){} };

  async function doDeploy(previewMode){
    const cityName=$('cityName').value.trim(), password=$('pwd').value;
    if(!cityName){ status('deployStatus','Şəhər adı daxil edin.','err'); return; }
    if(!password){ status('deployStatus','Parol daxil edin.','err'); return; }
    if(!data.meta.village) data.meta.village=cityName;
    const {errs}=renderHealth();
    if(errs.length && !previewMode){ if(!confirm(errs.length+' xəta var. Yenə də canlıya göndərək?')) { status('deployStatus','Deploy dayandırıldı — xətaları düzəldin.','err'); return; } }
    if(!previewMode && !confirm('“'+cityName+'” canlı sayta (production) göndərilsin?')) return;
    status('deployStatus', previewMode?'Önizləmə filialına göndərilir…':'Göndərilir…');
    try{
      const body={ password, cityName, mode: previewMode?'preview':'production',
        dataJs: window.dataToJs(data, cityName),
        xlsxBase64: window.dataToXlsxBase64(data),
        pdfBase64: pdfBase64 || undefined };
      const res=await fetch('/api/deploy',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
      const j=await res.json().catch(()=>({error:'HTTP '+res.status}));
      if(res.ok && j.ok){ status('deployStatus','✅ '+j.message+' → '+j.url,'ok');
        if(!previewMode){ dirty=false; clearDraft(curSlug); $('dirtyFlag').textContent=''; }
        if(mode==='upd' && !previewMode) setTimeout(loadCityList, 1500); }
      else if(/not configured/i.test(j.error||'')) status('deployStatus','⚙️ Deploy hələ qurulmayıb: Vercel-də GITHUB_TOKEN və DEPLOY_PASSWORD əlavə edin.','err');
      else status('deployStatus','❌ '+(j.error||res.status),'err');
    }catch(e){ status('deployStatus','❌ '+e.message,'err'); }
  }
  $('deployBtn').onclick = ()=>doDeploy(false);
  $('previewDeployBtn').onclick = ()=>doDeploy(true);

  function status(id,msg,cls){ const el=$(id); el.textContent=msg; el.className='status '+(cls||''); }

  // init
  renderEditor(); refresh();
})();
