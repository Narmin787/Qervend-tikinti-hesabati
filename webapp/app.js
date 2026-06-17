/* Report builder app. Vanilla JS. */
(function () {
  const $ = id => document.getElementById(id);
  const P = window.REPORT_PARSERS;
  let data = P.blankData();
  let mode = 'new';
  let pickedFiles = [];
  let pdfBase64 = null;
  if (window.pdfjsLib) pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';

  // ---------- mode ----------
  $('mNew').onclick = () => setMode('new');
  $('mUpd').onclick = () => setMode('upd');
  function setMode(m){ mode = m; $('mNew').classList.toggle('on',m==='new'); $('mUpd').classList.toggle('on',m==='upd');
    $('updPick').style.display = m==='upd' ? '' : 'none'; if(m==='upd') loadCityList(); }

  async function loadCityList(){
    try{ const list = await fetch('./cities.json').then(r=>r.json());
      $('citySel').innerHTML = list.map(c=>`<option value="${c.slug}">${c.village||c.slug}</option>`).join('');
    }catch(e){ $('citySel').innerHTML = '<option>(siyahı yüklənmədi)</option>'; }
  }
  $('loadCity').onclick = async () => {
    const slug = $('citySel').value; if(!slug) return;
    try{
      const js = await fetch(`../${slug}/data.js`).then(r=>r.text());
      const sb = { window:{DASH:{}} }; const fn = new Function('window', js); fn(sb.window);
      data = Object.assign(P.blankData(), sb.window.DASH);
      $('cityName').value = (data.meta&&data.meta.village)||slug;
      renderEditor(); refresh(); status('parseStatus','“'+slug+'” yükləndi.','ok');
    }catch(e){ status('parseStatus','Yüklənmədi: '+e.message,'err'); }
  };

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

  $('blankBtn').onclick = () => { data = P.blankData(); renderEditor(); refresh(); status('parseStatus','Boş şablon.','ok'); };

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
          const buf = await f.arrayBuffer();
          pdfBase64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
          pdfData = P.parsePrimaveraText(await pdfText(buf));
        }
      }
      data = merge(P.blankData(), exData, pdfData);
      if(pdfBase64) data.meta.sourcePdf = 'source.pdf';
      defaults(data);
      renderEditor(); refresh();
      status('parseStatus','Oxundu — aşağıda yoxlayın və redaktə edin.','ok');
    }catch(e){ status('parseStatus','Xəta: '+e.message,'err'); console.error(e); }
  };

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
    if(ex){ Object.assign(d.meta, prune(ex.meta)); d.overall=ex.overall; d.packages.items=ex.packages.items; d.velocity.rows=ex.velocity.rows;
      if(ex.infrastructure.overallFakt!=null){ d.infrastructure.overallFakt=ex.infrastructure.overallFakt; d.infrastructure.overallPlan=ex.infrastructure.overallPlan; } }
    if(pdf){ if(pdf.workItems.lots.length) d.workItems=pdf.workItems;
      if(pdf.infrastructure.items.length) d.infrastructure.items=pdf.infrastructure.items;
      if(pdf.packages.items.length){ // prefer Primavera plan/fakt for packets (authoritative)
        d.packages.items = pdf.packages.items.map(p=>({name:p.name,ev:p.ev,plan:p.plan,fakt:p.fakt}));
        // also reflect into overall packet rows
        d.overall.objects = (d.overall.objects||[]).map(o=>{ const m=pdf.packages.items.find(p=>sameEv(p.name,o.name)); return m?{...o,plan:m.plan,fakt:m.fakt}:o; });
      }
      if(pdf.meta.primaveraCode) d.meta.primaveraCode=pdf.meta.primaveraCode;
    }
    return d;
  }
  const sameEv=(a,b)=>{ const ea=(a.match(/\d+/)||[])[0], eb=(b.match(/\d+/)||[])[0]; return ea&&ea===eb; };
  const prune=o=>{ const r={}; for(const k in o) if(o[k]!=null&&o[k]!=='') r[k]=o[k]; return r; };

  function defaults(d){
    const m=d.meta;
    if(!m.projectTitle && m.village) m.projectTitle = (m.village+' — Tikinti Gedişatı Hesabatı').toUpperCase();
    if(!d.kpi.length){
      d.kpi=[
        {id:'umumi',value:m.officialOverall!=null?String(m.officialOverall):'',unit:'%',label:'ÜMUMİ İCRA (RƏSMİ)',sub:m.officialPlan!=null?('Plan: '+m.officialPlan+'%'):'',accent:'teal',deltaSign:'neg',pending:m.officialOverall==null},
        {id:'evler',value:'',unit:'%',label:'FƏRDİ EVLƏR',sub:'',accent:'teal',deltaSign:'neg',pending:true},
        {id:'isciler',value:'',unit:'',label:'İŞÇİ SAYI (GÜNDƏLİK)',sub:'Gündəlik hesabat daxil edilməyib',accent:'violet',deltaSign:'none',pending:true},
        {id:'texnika',value:'',unit:'',label:'TEXNİKA VAHİDİ',sub:'Gündəlik hesabat daxil edilməyib',accent:'orange',deltaSign:'none',pending:true},
        {id:'qalan',value:m.daysRemaining!=null?('~'+m.daysRemaining):'',unit:' gün',label:'BİTMƏYƏ QALAN',sub:m.revisedFinish?('Hədəf: '+m.revisedFinish):'',accent:'red',deltaSign:'none',pending:false},
      ];
    }
    if(!d.workforce.emptyNote) d.workforce.emptyNote='İşçi heyəti və texnika üzrə gündəlik hesabat hələ əlavə edilməyib.';
    if(!d.velocity.cutoff && m.cutoffDate) d.velocity.cutoff=m.cutoffDate;
  }

  // ---------- editor ----------
  function num(x){ return (x==null||x==='')?'':x; }
  function toNum(s){ if(s===''||s==null) return null; const n=parseFloat(String(s).replace(',','.')); return isNaN(n)?null:n; }

  function tableEditor(arr, cols){
    const t=document.createElement('table');
    const head='<tr>'+cols.map(c=>`<th>${c.label}</th>`).join('')+'<th></th></tr>';
    function draw(){
      t.innerHTML=head+arr.map((row,i)=>'<tr>'+cols.map(c=>{
        const val=num(row[c.key]);
        return `<td><input data-i="${i}" data-k="${c.key}" data-t="${c.type||'text'}" value="${String(val).replace(/"/g,'&quot;')}"></td>`;
      }).join('')+`<td><button class="mini" data-del="${i}">✕</button></td></tr>`).join('')+
      `<tr><td colspan="${cols.length+1}"><button class="mini" data-add="1">＋ sətir</button></td></tr>`;
    }
    draw();
    t.addEventListener('input', e=>{ const el=e.target; if(el.dataset.k==null) return;
      const i=+el.dataset.i, k=el.dataset.k; arr[i][k] = el.dataset.t==='num'? toNum(el.value): el.value; });
    t.addEventListener('click', e=>{ const el=e.target;
      if(el.dataset.del!=null){ arr.splice(+el.dataset.del,1); draw(); }
      else if(el.dataset.add){ const o={}; cols.forEach(c=>o[c.key]=c.type==='num'?null:''); arr.push(o); draw(); } });
    return t;
  }
  function kvEditor(obj, fields){
    const wrap=document.createElement('div'); wrap.className='kv';
    fields.forEach(f=>{
      const lab=document.createElement('label'); lab.textContent=f.label||f.key;
      const inp=f.area?document.createElement('textarea'):document.createElement('input');
      if(f.area) inp.rows=2; inp.value=num(obj[f.key]);
      inp.oninput=()=>{ obj[f.key]= f.type==='num'? toNum(inp.value): (f.type==='bool'? (inp.value==='true'||inp.checked): inp.value); };
      wrap.appendChild(lab); wrap.appendChild(inp);
    });
    return wrap;
  }
  function section(title, node, open){
    const d=document.createElement('details'); if(open) d.open=true;
    d.innerHTML=`<summary>${title}</summary>`; const c=document.createElement('div'); c.appendChild(node); d.appendChild(c); return d;
  }

  function renderEditor(){
    const ed=$('editor'); ed.innerHTML='';
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
      {key:'accent',label:'Rəng'},{key:'deltaSign',label:'Δ'},{key:'pending',label:'Gözləmə'}])));
    ed.appendChild(section('Ümumi mənzərə (obyektlər)', tableEditor(data.overall.objects,[
      {key:'name',label:'Obyekt'},{key:'plan',label:'Plan',type:'num'},{key:'fakt',label:'Fakt',type:'num'}])));
    ed.appendChild(section('Paketlər', tableEditor(data.packages.items,[
      {key:'name',label:'Ad'},{key:'ev',label:'Ev',type:'num'},{key:'plan',label:'Plan',type:'num'},{key:'fakt',label:'Fakt',type:'num'}])));
    ed.appendChild(section('Trend (faktiki + plan)', wrapNote(tableEditor(data.packages.trend,[
      {key:'date',label:'Tarix'},{key:'fakt',label:'Fakt',type:'num'},{key:'plan',label:'Plan',type:'num'}]),
      data.packages,'trendNote','Trend qeydi')));
    ed.appendChild(section('Görülən işlər (lotlar)', workItemsEditor()));
    ed.appendChild(section('İnfrastruktur', infraEditor()));
    ed.appendChild(section('Həftəlik sürət', velocityEditor()));
    ed.appendChild(section('İşçi heyəti / qeydlər', kvEditor(data.workforce,[
      {key:'available',label:'Məlumat var (true/false)'},{key:'period',label:'Dövr'},{key:'emptyNote',label:'Boş qeyd',area:true},{key:'alert',label:'Xəbərdarlıq',area:true}])));
  }
  function wrapNote(node, obj, key, label){ const w=document.createElement('div'); w.appendChild(node);
    const k=kvEditor(obj,[{key,label,area:true}]); w.appendChild(k); return w; }

  function workItemsEditor(){
    const wrap=document.createElement('div');
    function draw(){ wrap.innerHTML='';
      data.workItems.lots.forEach((lot,li)=>{
        const box=document.createElement('div'); box.style.marginBottom='8px';
        box.appendChild(kvEditor(lot,[{key:'name',label:'Lot adı'},{key:'id',label:'id'},{key:'ev',label:'Ev',type:'num'}]));
        box.appendChild(tableEditor(lot.items,[{key:'name',label:'İş'},{key:'plan',label:'Plan',type:'num'},{key:'fakt',label:'Fakt',type:'num'}]));
        const del=document.createElement('button'); del.className='mini'; del.textContent='✕ lotu sil';
        del.onclick=()=>{ data.workItems.lots.splice(li,1); draw(); }; box.appendChild(del);
        wrap.appendChild(box);
      });
      const add=document.createElement('button'); add.className='mini'; add.textContent='＋ lot əlavə et';
      add.onclick=()=>{ data.workItems.lots.push({id:'lot'+(data.workItems.lots.length+1),name:'Yeni lot',ev:null,items:[]}); draw(); };
      wrap.appendChild(add);
    }
    draw(); return wrap;
  }
  function infraEditor(){
    const w=document.createElement('div');
    w.appendChild(kvEditor(data.infrastructure,[{key:'overallPlan',label:'Ümumi plan',type:'num'},{key:'overallFakt',label:'Ümumi fakt',type:'num'},{key:'asOf',label:'Tarix'}]));
    w.appendChild(tableEditor(data.infrastructure.items,[{key:'name',label:'Komponent'},{key:'plan',label:'Plan',type:'num'},{key:'fakt',label:'Fakt',type:'num'}]));
    w.appendChild(kvEditor(data.infrastructure,[{key:'weeklyNote',label:'Qeyd',area:true}]));
    return w;
  }
  function velocityEditor(){
    const w=document.createElement('div');
    w.appendChild(kvEditor(data.velocity,[{key:'cutoff',label:'Kəsim tarixi'},{key:'priorDate',label:'Əvvəlki tarix'},{key:'priorWeeks',label:'Həftə sayı',type:'num'}]));
    w.appendChild(tableEditor(data.velocity.rows,[
      {key:'obyekt',label:'Obyekt'},{key:'plan',label:'Plan',type:'num'},{key:'fakt',label:'Fakt',type:'num'},
      {key:'finish',label:'Bitmə'},{key:'priorFakt',label:'Əvvəlki fakt',type:'num'}]));
    const note=document.createElement('div'); note.className='note';
    note.textContent='dev3 (3 həftəlik gecikmə) Excel-dən gəlir; lazım olsa data.js-də dəqiqləşdirin.';
    w.appendChild(note); return w;
  }

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
  $('deployBtn').onclick = async () => {
    const cityName=$('cityName').value.trim(), password=$('pwd').value;
    if(!cityName){ status('deployStatus','Şəhər adı daxil edin.','err'); return; }
    if(!password){ status('deployStatus','Parol daxil edin.','err'); return; }
    if(!data.meta.village) data.meta.village=cityName;
    status('deployStatus','Göndərilir…');
    try{
      const body={ password, cityName,
        dataJs: window.dataToJs(data, cityName),
        xlsxBase64: window.dataToXlsxBase64(data),
        pdfBase64: pdfBase64 || undefined };
      const res=await fetch('/api/deploy',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
      const j=await res.json();
      if(res.ok && j.ok) status('deployStatus','✅ '+j.message+' → '+j.url,'ok');
      else status('deployStatus','❌ '+(j.error||res.status),'err');
    }catch(e){ status('deployStatus','❌ '+e.message,'err'); }
  };

  function status(id,msg,cls){ const el=$(id); el.textContent=msg; el.className='status '+(cls||''); }

  // init
  renderEditor(); refresh();
})();
