/* Browser parsers: contractor Excel (delay %) + Primavera PDF (WBS) -> report data.
   Deterministic, no AI. Best-effort pre-fill; the editor is the safety net.
   Exposes window.REPORT_PARSERS = { parseExcelRows, parsePrimaveraText, blankData }. */
(function () {
  const pct = v => (v == null || v === '' || isNaN(+v)) ? null : Math.round(+v * 10000) / 100; // 0.4496 -> 44.96
  const round2 = n => Math.round(n * 100) / 100;
  const clean = s => String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
  const isNum = v => v != null && v !== '' && !isNaN(+v);

  function blankData() {
    return {
      meta: { projectTitle:'', village:'', district:'', contractor:'', reportDate:'', cutoffDate:'',
        startDate:'', plannedFinish:'', revisedFinish:'', baselineDays:null, extraDays:null,
        daysRemaining:null, officialOverall:null, officialPlan:null, primaveraCode:'', note:'', sourcePdf:'' },
      kpi: [], overall:{objects:[]}, packages:{items:[], trend:[], trendNote:''},
      workItems:{lots:[]}, otherObjects:{asOf:'', contractNote:'', objects:[]},
      infrastructure:{asOf:'', overallFakt:null, overallPlan:null, items:[], weeklyNote:''},
      workforce:{available:false, period:'', daily:[], totalSeries:[], machinery:[], emptyNote:'', alert:''},
      velocity:{cutoff:'', priorDate:'', priorWeeks:3, points:[], rows:[]},
      insightsPinned:[],
    };
  }

  const dmy = s => { const m = String(s||'').match(/(\d{2})\.(\d{2})\.(\d{4})/); return m ? new Date(+m[3], +m[2]-1, +m[1]) : null; };

  // Text-richest name column(s), handling merged "Layihə adı" headers.
  function pickNameCols(rows, hi, hdr, cStart) {
    let hint = -1; hdr.forEach((h,i)=>{ if(/Layih[əe] ad/i.test(h)) hint = i; });
    const right = cStart > 0 ? cStart : 6, lo = hint >= 0 ? hint : 0, scored = [];
    for (let c = lo; c < Math.max(right, lo + 2); c++) {
      const seen = {}; let n = 0;
      for (let r = hi + 1; r < rows.length; r++) { const v = clean((rows[r] || [])[c]);
        // ignore the location-fragment column ("… rayonu / … kəndi") so the real
        // project-name column always outranks it, even when only a few rows exist.
        if (v && isNaN(+v) && !/^O cümlədən|^O cumleden/i.test(v) && !/rayon|kənd|kend/i.test(v) && !seen[v]) { seen[v] = 1; n++; } }
      if (n) scored.push([c, n]);
    }
    scored.sort((a,b)=>b[1]-a[1]);
    const cols = scored.slice(0,2).map(s=>s[0]);
    return cols.length ? cols : [hint >= 0 ? hint : 3];
  }

  // One (date, overall-fakt) snapshot from a sheet — for the week-over-week trend.
  function sheetOverallPoint(sheet) {
    const rows = sheet.rows || [];
    let date = '';
    for (const row of rows.slice(0, 3)) for (const c of (row || [])) { const d = excelDate(c);
      if (/^\d{2}\.\d{2}\.\d{4}$/.test(d)) { date = d; break; } }
    let hi = rows.findIndex(r => r && r.some(c => /Faktiki/i.test(clean(c))) && r.some(c => /Planlan/i.test(clean(c))));
    if (hi < 0 || !date) return null;
    const hdr = (rows[hi] || []).map(clean);
    const cFakt = hdr.findIndex(h => /Faktiki/i.test(h));
    const cStart = hdr.findIndex(h => /Başlama|Baslama/i.test(h));
    const nameCols = pickNameCols(rows, hi, hdr, cStart);
    const readName = row => { for (const c of nameCols) { const v = clean(row[c]); if (v) return v; } return ''; };
    let umumi = null, fye = null;
    for (let r = hi + 1; r < rows.length; r++) { const nm = readName(rows[r] || []); const f = pct((rows[r] || [])[cFakt]);
      if (f == null) continue;
      if (/^Ümumi|^Umumi/i.test(nm)) umumi = f;
      else if (fye == null && /^FYE\b|Fərdi|Ferdi/i.test(nm)) fye = f;
    }
    return (umumi != null || fye != null) ? { date, umumi, fye } : null;
  }

  // ---- Excel (array-of-rows per sheet) ----
  // sheets: [{name, rows:[[...],[...]]}]  rows are raw cell values.
  function parseExcelRows(sheets) {
    const out = blankData();
    if (!sheets || !sheets.length) return out;
    // choose the sheet whose name suggests "newest", else the last one
    let pick = sheets.find(s => /yeni\)?$/i.test(s.name)) || sheets[sheets.length - 1];
    const rows = pick.rows || [];
    // find header row: contains "Faktiki" and "Plan"
    let hi = rows.findIndex(r => r && r.some(c => /Faktiki/i.test(clean(c))) && r.some(c => /Planlan/i.test(clean(c))));
    if (hi < 0) hi = 2;
    const hdr = (rows[hi] || []).map(clean);
    const find = re => hdr.findIndex(h => re.test(h));
    const cPlan = find(/Planlan/i), cFakt = find(/Faktiki/i);
    const cStart = find(/Başlama|Baslama/i), cFin = find(/Bitmə|Bitme/i);
    // Name column(s): "Layihə adı" headers may be MERGED across two columns, so the
    // browser's reader leaves one of them blank. Pick the text-richest column(s)
    // left of the dates and read names by coalescing them per row.
    const nameCols = pickNameCols(rows, hi, hdr, cStart);
    const readName = row => { for (const c of nameCols) { const v = clean(row[c]); if (v) return v; } return ''; };
    const cName = nameCols[0];
    const cDelays = hdr.map((h,i)=>/Gecikmə|Gecikme/i.test(h)?i:-1).filter(i=>i>=0);
    const cWeekly = find(/Həftəlik|Heftelik/i);

    // Project identity (village / district / contractor / report date) from the sheet.
    const allcells = [];
    rows.forEach(row => (row || []).forEach(c => allcells.push(clean(c))));
    for (const s of allcells) { const m = s.match(/([\wçğıöşüəÇĞİÖŞÜƏ ]+?rayonu)\s+([\wçğıöşüəÇĞİÖŞÜƏ ]+?kəndi)/i);
      if (m) { out.meta.district = m[1].trim(); out.meta.village = m[2].trim(); break; } }
    for (const s of allcells) { if (/MMC/.test(s) && s.length < 45) { out.meta.contractor = s.replace(/[“”"]/g, '').trim(); break; } }
    for (const row of rows.slice(0, 3)) for (const c of (row || [])) { const d = excelDate(c);
      if (/^\d{2}\.\d{2}\.\d{4}$/.test(d)) { out.meta.cutoffDate = d; out.meta.reportDate = d; break; } }

    const objects = [], packets = [], others = [], vrows = [];
    // Civic / non-residential buildings -> "Digər obyektlər".
    const civicRe = /Məktəb|Mekteb|Bağça|Bagca|Tibb|Xəstəxana|Xestexana|Poliklinika|Ambulator|İnzibati|Inzibati|İdarə|Məscid|Mescid|Klub|Mədəniyyət|Medeniyyet|İdman|Idman|qəbiristan|qebiristan/i;
    // Residential sub-areas / packets -> "Paketlər".
    const pkgRe = /Paket|Mərhələ|Merhele|Phase|Sahə\s*\d|Sahe\s*\d/i;
    const infraRe = /Sahədaxili|Sahedaxili|kommunikasiya|infrastruktur/i;
    for (let r = hi + 1; r < rows.length; r++) {
      const row = rows[r] || []; let name = readName(row);
      if (!name || /^O cümlədən|^O cumleden|Layih[əe] ad|Gecikmə|İrəliləmə|Ireliləme/i.test(name)) continue;
      if (/^FYE\s+Paket/i.test(name)) name = name.replace(/^FYE\s+/i, '');           // "FYE Paket 1" -> "Paket 1"
      else if (/^FYE\s+Sah[əe]/i.test(name)) name = name.replace(/^FYE\s+/i, '');     // "FYE Sahə 1 (60 ev)" -> "Sahə 1 (60 ev)"
      else if (/^FYE\b/i.test(name)) name = name.replace(/^FYE/i, 'Fərdi evlər');      // "FYE (146 ev)" -> "Fərdi evlər (146 ev)"
      const plan = pct(row[cPlan]), fakt = pct(row[cFakt]);
      if (plan == null && fakt == null) continue;
      const delays = cDelays.map(c => pct(row[c])).filter(v => v != null);
      const finish = excelDate(row[cFin]);
      const rec = { name, plan, fakt, finish, delays, weekly: clean(row[cWeekly]) };
      if (/^Ümumi|^Umumi/i.test(name)) { out.meta.officialOverall = fakt; out.meta.officialPlan = plan; out.meta.revisedFinish = finish; out.meta.plannedFinish = finish; out.meta.startDate = excelDate(row[cStart]); }
      else if (infraRe.test(name)) { objects.push(rec); out.infrastructure.overallFakt = fakt; out.infrastructure.overallPlan = plan; }
      else if (civicRe.test(name)) { objects.push(rec); others.push(rec); }
      else if (pkgRe.test(name)) { objects.push(rec); packets.push(rec); }
      else objects.push(rec);   // residential total (FYE/Fərdi) and anything else
      vrows.push(rec);
    }
    out.overall.objects = objects.map(o => ({ name:o.name, plan:o.plan, fakt:o.fakt }));
    out.packages.items = packets.map(p => ({ name:p.name, ev:evCount(p.name), plan:p.plan, fakt:p.fakt }));
    out.otherObjects.objects = others.map(o => ({ name:o.name, plan:o.plan, fakt:o.fakt, status:'' }));
    if (others.length) out.otherObjects.asOf = out.meta.cutoffDate || '';
    out.velocity.rows = vrows.map(v => ({
      obyekt:v.name, plan:v.plan, fakt:v.fakt, finish:v.finish, priorFakt:null,
      dev3: v.delays.slice(-3),
    }));
    // Velocity x-axis labels from the delay-column dates ("Əvvəlki ay", "04.06", "11.06").
    out.velocity.points = cDelays.map(i => { const m = (hdr[i] || '').match(/(\d{2})\.(\d{2})\.\d{4}/); return m ? (m[1] + '.' + m[2]) : 'Əvvəlki ay'; }).slice(-3);
    while (out.velocity.points.length < 3) out.velocity.points.unshift('');

    // Trend: fakt across ALL sheets (chronological snapshots) — real data only, ONE
    // consistent metric. Prefer "Ümumi"; if fewer than 2 sheets have it, fall back to
    // the residential (FYE) total so the line isn't a mix of different measures.
    const pts = sheets.map(sheetOverallPoint).filter(Boolean);
    const build = key => { const m = {}; pts.forEach(p => { if (p[key] != null) m[p.date] = p[key]; });
      return Object.keys(m).map(d => ({ date: d, fakt: m[d] })).sort((a, b) => (dmy(a.date) || 0) - (dmy(b.date) || 0)); };
    const umumiTrend = build('umumi'), fyeTrend = build('fye');
    if (umumiTrend.length >= 2) { out.packages.trend = umumiTrend;
      out.packages.trendNote = 'Ümumi icra (faktiki %) — hesabat vərəqlərinin tarixləri üzrə.'; }
    else if (fyeTrend.length >= 2) { out.packages.trend = fyeTrend;
      out.packages.trendNote = 'Fərdi evlər üzrə faktiki icra (%) — hesabat vərəqlərinin tarixləri üzrə.'; }
    return out;
  }

  // ---- Primavera text ----
  function parsePrimaveraText(text) {
    const out = blankData();
    if (!text) return out;
    const lines = text.split('\n');
    // root code like QRVND_Upd
    const rootM = text.match(/([A-Z0-9]+_Upd)\b/);
    const root = rootM ? rootM[1] : null;
    out.meta.primaveraCode = root || '';
    const pctPair = ln => { const m = (ln.match(/(-?\d+(?:\.\d+)?)%/g) || []).slice(-2).map(x => +x.replace('%','')); return m.length === 2 ? m : null; };

    const node = (codeRe) => {
      for (const ln of lines) { if (codeRe.test(ln)) { const p = pctPair(ln); if (p) return { fakt:p[0], plan:p[1], line:ln }; } }
      return null;
    };
    if (!root) return out;
    const R = root.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // FYE (3.1)
    const fye = node(new RegExp(`${R}\\.3\\.1\\s.*(Yasayis|Yaşayış|Residential)`, 'i'));
    // packets 3.1.1..3.1.N (Merhele)
    const packets = [];
    const allStages = {};   // stage -> all house-type nodes across packets (for the "Cəmi" row)
    for (let i = 1; i <= 12; i++) {
      const n = node(new RegExp(`${R}\\.3\\.1\\.${i}\\s.*(Merhele|Mərhələ|Phase)`, 'i'));
      if (!n) break;
      const ev = evCount(n.line);
      // Work stages, averaged across the (up to 4) house types of this packet.
      const stages = [];
      const stageNames = ['Qaba işlər','Dam örtüyü','Daxili bəzək','MEP (mex/elektrik/santexnika)','Xarici bəzək (fasad)','Təsərrüfat tikililəri'];
      for (let st = 1; st <= 6; st++) {
        const vals = [];
        for (let room = 1; room <= 4; room++) {
          const sn = node(new RegExp(`${R}\\.3\\.1\\.${i}\\.${room}\\.${st}\\s`, 'i'));
          if (sn) { vals.push(sn); allStages[st] = (allStages[st]||[]).concat([sn]); }
        }
        if (vals.length) stages.push({ name: stageNames[st-1],
          fakt: round2(vals.reduce((s,v)=>s+v.fakt,0)/vals.length),
          plan: round2(vals.reduce((s,v)=>s+v.plan,0)/vals.length) });
      }
      packets.push({ name:`Paket ${i} (${ev||'?'} ev)`, ev, fakt:n.fakt, plan:n.plan, stages });
    }
    // infrastructure 3.3 phases
    const infra = node(new RegExp(`${R}\\.3\\.3\\s`, 'i'));
    const phases = [];
    for (let i = 1; i <= 8; i++) {
      const ph = node(new RegExp(`${R}\\.3\\.3\\.${i}\\s`, 'i'));
      if (!ph) break;
      phases.push({ name:`Mərhələ ${i}`, fakt:ph.fakt, plan:ph.plan });
    }

    // Build workItems: "Cəmi" (all house types averaged) + a lot per packet (work stages)
    const lots = [];
    if (packets.length) {
      const stageNames = ['Qaba işlər','Dam örtüyü','Daxili bəzək','MEP (mex/elektrik/santexnika)','Xarici bəzək (fasad)','Təsərrüfat tikililəri'];
      const cemi = [];
      for (let st = 1; st <= 6; st++) { const v = allStages[st]; if (v && v.length)
        cemi.push({ name: stageNames[st-1], fakt: round2(v.reduce((s,x)=>s+x.fakt,0)/v.length), plan: round2(v.reduce((s,x)=>s+x.plan,0)/v.length) }); }
      lots.push({ id:'cemi', name:`Cəmi (${packets.reduce((s,p)=>s+(p.ev||0),0)} ev)`,
        ev: packets.reduce((s,p)=>s+(p.ev||0),0), items: cemi });
      packets.forEach((p,k) => lots.push({ id:'p'+(k+1), name:p.name, ev:p.ev, items:p.stages }));
    }
    out.workItems.lots = lots;
    out.packages.items = packets.map(p => ({ name:p.name, ev:p.ev, plan:p.plan, fakt:p.fakt }));
    out.infrastructure.items = phases;
    if (infra) { out.infrastructure.overallFakt = infra.fakt; out.infrastructure.overallPlan = infra.plan; }
    if (fye) { out.meta._fye = { fakt:fye.fakt, plan:fye.plan }; }
    return out;
  }

  function evCount(s){ const m = String(s).match(/(\d+)\s*ev/i); return m ? +m[1] : null; }
  function excelDate(v){
    if (v == null || v === '') return '';
    if (v instanceof Date) return fmtD(v);
    if (typeof v === 'number') { const d = new Date(Date.UTC(1899,11,30)+v*864e5); return fmtD(d); }
    const s = clean(v); const m = s.match(/(\d{4})-(\d{2})-(\d{2})/); if (m) return `${m[3]}.${m[2]}.${m[1]}`;
    return s.replace('T00:00:00.000Z','');
  }
  function fmtD(d){ const p=n=>String(n).padStart(2,'0'); return `${p(d.getUTCDate())}.${p(d.getUTCMonth()+1)}.${d.getUTCFullYear()}`; }

  const root = (typeof window !== 'undefined') ? window : globalThis;
  root.REPORT_PARSERS = { parseExcelRows, parsePrimaveraText, blankData };
  if (typeof module !== 'undefined') module.exports = root.REPORT_PARSERS;
})();
