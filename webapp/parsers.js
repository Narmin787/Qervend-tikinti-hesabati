/* Browser parsers: contractor Excel (delay %) + Primavera PDF (WBS) -> report data.
   Deterministic, no AI. Best-effort pre-fill; the editor is the safety net.
   Exposes window.REPORT_PARSERS = { parseExcelRows, parsePrimaveraText, blankData }. */
(function () {
  const pct = v => (v == null || v === '' || isNaN(+v)) ? null : Math.round(+v * 10000) / 100; // 0.4496 -> 44.96
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
    };
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
    const cName = (() => { // 4th column ("Layihə adı" detail) — last header matching "Layihə adı"
      let idx = -1; hdr.forEach((h,i)=>{ if(/Layih[əe] ad/i.test(h)) idx = i; }); return idx >= 0 ? idx : 3;
    })();
    const cPlan = find(/Planlan/i), cFakt = find(/Faktiki/i);
    const cStart = find(/Başlama|Baslama/i), cFin = find(/Bitmə|Bitme/i);
    const cDelays = hdr.map((h,i)=>/Gecikmə|Gecikme/i.test(h)?i:-1).filter(i=>i>=0);
    const cWeekly = find(/Həftəlik|Heftelik/i);

    const objects = [], packets = [], vrows = [];
    for (let r = hi + 1; r < rows.length; r++) {
      const row = rows[r] || []; let name = clean(row[cName]);
      if (!name || /^O cümlədən|^O cumleden|Layih[əe] ad|Gecikmə|İrəliləmə|Ireliləme/i.test(name)) continue;
      if (/^FYE\s+Paket/i.test(name)) name = name.replace(/^FYE\s+/i, '');           // "FYE Paket 1" -> "Paket 1"
      else if (/^FYE\b/i.test(name)) name = name.replace(/^FYE/i, 'Fərdi evlər');      // "FYE (851)" -> "Fərdi evlər (851)"
      const plan = pct(row[cPlan]), fakt = pct(row[cFakt]);
      if (plan == null && fakt == null) continue;
      const delays = cDelays.map(c => pct(row[c])).filter(v => v != null);
      const finish = excelDate(row[cFin]);
      const rec = { name, plan, fakt, finish, delays, weekly: clean(row[cWeekly]) };
      if (/^Ümumi|^Umumi/i.test(name)) { out.meta.officialOverall = fakt; out.meta.officialPlan = plan; out.meta.revisedFinish = finish; }
      else if (/FYE|Fərdi|Ferdi/i.test(name)) objects.push(rec);
      else if (/Paket|Merhele|Mərhələ/i.test(name)) { objects.push(rec); packets.push(rec); }
      else if (/Sahədaxili|Sahedaxili|kommunikasiya/i.test(name)) { objects.push(rec); out.infrastructure.overallFakt = fakt; out.infrastructure.overallPlan = plan; }
      else objects.push(rec);
      vrows.push(rec);
    }
    out.overall.objects = objects.map(o => ({ name:o.name, plan:o.plan, fakt:o.fakt }));
    out.packages.items = packets.map(p => ({ name:p.name, ev:evCount(p.name), plan:p.plan, fakt:p.fakt }));
    out.velocity.rows = vrows.map(v => ({
      obyekt:v.name, plan:v.plan, fakt:v.fakt, finish:v.finish, priorFakt:null,
      dev3: v.delays.slice(-3),
    }));
    out.velocity.points = ['Keçən ay','','11.06'];
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
    for (let i = 1; i <= 12; i++) {
      const n = node(new RegExp(`${R}\\.3\\.1\\.${i}\\s.*(Merhele|Mərhələ|Phase)`, 'i'));
      if (!n) break;
      const nm = (n.line.match(/Merhele\s*\d+\s*\(([^)]*ev)\)/i) || [])[1] || `Paket ${i}`;
      const ev = evCount(n.line);
      const rooms = [];
      for (let j = 1; j <= 6; j++) {
        const rn = node(new RegExp(`${R}\\.3\\.1\\.${i}\\.${j}\\s.*Otaqli`, 'i'));
        if (!rn) break;
        const dm = (rn.line.match(/(\d+)\s*Otaqli/i) || [])[1];
        rooms.push({ name: dm ? `${dm} otaqlı evlər` : `Tip ${j}`, fakt: rn.fakt, plan: rn.plan });
      }
      packets.push({ name:`Paket ${i} (${ev||'?'} ev)`, ev, fakt:n.fakt, plan:n.plan, rooms });
    }
    // infrastructure 3.3 phases
    const infra = node(new RegExp(`${R}\\.3\\.3\\s`, 'i'));
    const phases = [];
    for (let i = 1; i <= 8; i++) {
      const ph = node(new RegExp(`${R}\\.3\\.3\\.${i}\\s`, 'i'));
      if (!ph) break;
      phases.push({ name:`Mərhələ ${i}`, fakt:ph.fakt, plan:ph.plan });
    }

    // Build workItems: a "Cəmi" overview + a lot per packet (room types)
    const lots = [];
    if (packets.length) {
      lots.push({ id:'cemi', name:`Cəmi (${packets.reduce((s,p)=>s+(p.ev||0),0)} ev)`,
        ev: packets.reduce((s,p)=>s+(p.ev||0),0),
        items: packets.map(p => ({ name:p.name, fakt:p.fakt, plan:p.plan })) });
      packets.forEach((p,k) => lots.push({ id:'p'+(k+1), name:p.name, ev:p.ev, items:p.rooms }));
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
