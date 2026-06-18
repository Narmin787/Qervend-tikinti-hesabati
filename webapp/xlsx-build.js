/* Browser: build a schema-correct source.xlsx (base64) from a data object,
   mirroring scripts/lib/schema.mjs dataToWorkbook so the Node build can read it.
   Exposes window.dataToXlsxBase64(data) and window.dataToJs(data). */
(function () {
  const root = (typeof window !== 'undefined') ? window : globalThis;
  const getXLSX = () => root.XLSX || (typeof require !== 'undefined' ? require('xlsx') : null);
  const v = x => (x === undefined ? null : x);

  function build(data) {
    const XLSX = getXLSX(), S = XLSX.utils;
    const wb = S.book_new();
    const add = (name, aoa) => S.book_append_sheet(wb, S.aoa_to_sheet(aoa), name);
    const tbl = (cols, rows) => [cols, ...rows.map(r => cols.map(c => v(r[c])))];

    const m = data.meta || {};
    add('Meta', [['Sahə','Dəyər'], ...[
      ['projectTitle',m.projectTitle],['village',m.village],['district',m.district],['contractor',m.contractor],
      ['reportDate',m.reportDate],['cutoffDate',m.cutoffDate],['startDate',m.startDate],['plannedFinish',m.plannedFinish],
      ['revisedFinish',m.revisedFinish],['baselineDays',m.baselineDays],['extraDays',m.extraDays],['daysRemaining',m.daysRemaining],
      ['officialOverall',m.officialOverall],['officialPlan',m.officialPlan],['primaveraCode',m.primaveraCode],
      ['note',m.note],['sourcePdf',m.sourcePdf||''],
    ].map(([k,x])=>[k,v(x)])]);

    add('KPI', tbl(['id','value','unit','label','sub','accent','deltaSign','pending'],
      (data.kpi||[]).map(k=>({...k, value:k.value==null?'':k.value, pending:!!k.pending}))));
    add('Overall', tbl(['name','plan','fakt'], (data.overall&&data.overall.objects)||[]));
    add('Packages', tbl(['name','ev','plan','fakt'], (data.packages&&data.packages.items)||[]));
    add('PackagesTrend', tbl(['date','fakt','plan'], (data.packages&&data.packages.trend)||[]));

    const wi=[]; ((data.workItems&&data.workItems.lots)||[]).forEach(lot=>(lot.items||[]).forEach(it=>
      wi.push({lot_id:lot.id,lot_name:lot.name,lot_ev:lot.ev,item:it.name,plan:it.plan,fakt:it.fakt})));
    add('WorkItems', tbl(['lot_id','lot_name','lot_ev','item','plan','fakt'], wi));

    add('Other', tbl(['name','plan','fakt','status'], (data.otherObjects&&data.otherObjects.objects)||[]));
    add('Infrastructure', tbl(['name','plan','fakt'], (data.infrastructure&&data.infrastructure.items)||[]));
    const infRows=[]; ((data.infrastructure&&data.infrastructure.lots)||[]).forEach(lot=>(lot.items||[]).forEach(it=>
      infRows.push({lot_id:lot.id,lot_name:lot.name,item:it.name,plan:it.plan,fakt:it.fakt})));
    add('InfraItems', tbl(['lot_id','lot_name','item','plan','fakt'], infRows));

    const vel=data.velocity||{};
    add('Velocity', tbl(['obyekt','plan','fakt','finish','priorFakt','dev1','dev2','dev3'],
      (vel.rows||[]).map(r=>({obyekt:r.obyekt,plan:r.plan,fakt:r.fakt,finish:r.finish,priorFakt:r.priorFakt,
        dev1:(r.dev3||[])[0],dev2:(r.dev3||[])[1],dev3:(r.dev3||[])[2]}))));

    const wf=data.workforce||{};
    add('WorkforceDaily', tbl(['date','sahe','texniki','idari'], wf.daily||[]));
    add('WorkforceMachinery', tbl(['name','count'], wf.machinery||[]));
    add('Pinned', tbl(['category','title','body'], data.insightsPinned||[]));

    const o=data.otherObjects||{}, inf=data.infrastructure||{};
    add('Notes', [['Sahə','Dəyər'], ...[
      ['packagesTrendNote',data.packages&&data.packages.trendNote],
      ['otherAsOf',o.asOf],['otherContractNote',o.contractNote],
      ['infraAsOf',inf.asOf],['infraOverallPlan',inf.overallPlan],['infraOverallFakt',inf.overallFakt],['infraWeeklyNote',inf.weeklyNote],
      ['velCutoff',vel.cutoff],['velPriorDate',vel.priorDate],['velPriorWeeks',vel.priorWeeks],
      ['velPoint1',(vel.points||[])[0]],['velPoint2',(vel.points||[])[1]],['velPoint3',(vel.points||[])[2]],
      ['workforceAvailable',wf.available?'true':'false'],['workforcePeriod',wf.period],
      ['workforceEmptyNote',wf.emptyNote],['workforceAlert',wf.alert],
    ].map(([k,x])=>[k,v(x)])]);

    return wb;
  }

  root.dataToXlsxBase64 = data => getXLSX().write(build(data), { type:'base64', bookType:'xlsx' });

  // Read a COMPLETE data workbook (same schema dataToXlsxBase64 writes / the app's
  // ⬇ source.xlsx). Returns a full data object, or null if it isn't this format.
  // Mirrors scripts/lib/schema.mjs workbookToData.
  root.xlsxToData = function (arrayBuffer) {
    const XLSX = getXLSX(); if (!XLSX) return null;
    let wb; try { wb = XLSX.read(arrayBuffer, { type:'array', cellDates:false }); } catch (e) { return null; }
    if (!wb.Sheets['Meta'] || !wb.Sheets['Velocity']) return null;   // not the schema format
    const aoa = n => wb.Sheets[n] ? XLSX.utils.sheet_to_json(wb.Sheets[n], { header:1, raw:true, defval:'' }) : [];
    const str = v => (v == null ? '' : String(v)).trim();
    const num = v => { if (v == null || v === '') return null; const n = parseFloat(String(v).replace(',','.')); return isNaN(n) ? null : n; };
    const bool = v => v === true || /^true$/i.test(String(v));
    const readKV = n => { const o = {}; aoa(n).slice(1).forEach(r => { if (r[0] != null && r[0] !== '') o[r[0]] = r[1]; }); return o; };
    const readTable = n => { const rows = aoa(n); if (!rows.length) return []; const h = rows[0].map(x => String(x).trim());
      return rows.slice(1).map(r => { const o = {}; h.forEach((k, i) => o[k] = r[i]); return o; }).filter(o => h.some(k => o[k] !== '' && o[k] != null)); };

    const M = readKV('Meta'), N = readKV('Notes');
    const meta = { projectTitle:str(M.projectTitle), village:str(M.village), district:str(M.district),
      contractor:str(M.contractor), reportDate:str(M.reportDate), cutoffDate:str(M.cutoffDate),
      startDate:str(M.startDate), plannedFinish:str(M.plannedFinish), revisedFinish:str(M.revisedFinish),
      baselineDays:num(M.baselineDays), extraDays:num(M.extraDays), daysRemaining:num(M.daysRemaining),
      officialOverall:num(M.officialOverall), officialPlan:num(M.officialPlan),
      primaveraCode:str(M.primaveraCode), note:str(M.note), sourcePdf:str(M.sourcePdf) };
    const kpi = readTable('KPI').map(r => ({ id:str(r.id), value:str(r.value)===''?null:str(r.value), unit:(r.unit==null?'':String(r.unit)),
      label:str(r.label), sub:str(r.sub), accent:str(r.accent)||'teal', deltaSign:str(r.deltaSign)||'none', pending:bool(r.pending) }));
    const overall = { objects: readTable('Overall').map(r => ({ name:str(r.name), plan:num(r.plan), fakt:num(r.fakt) })) };
    const packages = { items: readTable('Packages').map(r => ({ name:str(r.name), ev:num(r.ev), plan:num(r.plan), fakt:num(r.fakt) })),
      trend: readTable('PackagesTrend').map(r => { const t={ date:str(r.date), fakt:num(r.fakt) }; if (num(r.plan)!=null) t.plan=num(r.plan); return t; }),
      trendNote: str(N.packagesTrendNote) };
    const lotsMap = new Map();
    readTable('WorkItems').forEach(r => { const id=str(r.lot_id); if(!lotsMap.has(id)) lotsMap.set(id,{ id, name:str(r.lot_name), ev:num(r.lot_ev), items:[] });
      lotsMap.get(id).items.push({ name:str(r.item), fakt:num(r.fakt), plan:num(r.plan) }); });
    const workItems = { lots:[...lotsMap.values()] };
    const otherObjects = { asOf:str(N.otherAsOf), contractNote:str(N.otherContractNote),
      objects: readTable('Other').map(r => ({ name:str(r.name), plan:num(r.plan), fakt:num(r.fakt), status:str(r.status) })) };
    const infrastructure = { asOf:str(N.infraAsOf), overallFakt:num(N.infraOverallFakt), overallPlan:num(N.infraOverallPlan),
      items: readTable('Infrastructure').map(r => ({ name:str(r.name), fakt:num(r.fakt), plan:num(r.plan) })), weeklyNote:str(N.infraWeeklyNote) };
    const infLotsMap = new Map();   // per-package infrastructure (tabs)
    readTable('InfraItems').forEach(r => { const id=str(r.lot_id); if(!infLotsMap.has(id)) infLotsMap.set(id,{ id, name:str(r.lot_name), items:[] });
      infLotsMap.get(id).items.push({ name:str(r.item), fakt:num(r.fakt), plan:num(r.plan) }); });
    if(infLotsMap.size) infrastructure.lots=[...infLotsMap.values()];
    const wfDaily = readTable('WorkforceDaily').map(r => ({ date:str(r.date), sahe:num(r.sahe), texniki:num(r.texniki), idari:num(r.idari) }));
    const workforce = { available:bool(N.workforceAvailable), period:str(N.workforcePeriod), daily:wfDaily, totalSeries:[],
      machinery: readTable('WorkforceMachinery').map(r => ({ name:str(r.name), count:num(r.count) })),
      emptyNote:str(N.workforceEmptyNote), alert:str(N.workforceAlert) };
    const velocity = { cutoff:str(N.velCutoff), priorDate:str(N.velPriorDate), priorWeeks:num(N.velPriorWeeks),
      points:[str(N.velPoint1), str(N.velPoint2), str(N.velPoint3)],
      rows: readTable('Velocity').map(r => ({ obyekt:str(r.obyekt), plan:num(r.plan), fakt:num(r.fakt), finish:str(r.finish),
        priorFakt:num(r.priorFakt), dev3:[num(r.dev1), num(r.dev2), num(r.dev3)] })) };
    const insightsPinned = readTable('Pinned').map(r => ({ category:str(r.category), title:str(r.title), body:str(r.body) }))
      .filter(p => p.category && p.title && p.body);
    const out = { meta, kpi, overall, packages, workItems, otherObjects, infrastructure, workforce, velocity };
    if (insightsPinned.length) out.insightsPinned = insightsPinned;
    return out;
  };

  root.dataToJs = function (data, label) {
    const keys = ['meta','kpi','overall','packages','workItems','otherObjects','infrastructure','workforce','velocity','insightsPinned'];
    let out = `/* data.js — ${label||(data.meta&&data.meta.village)||''}\n   Hesabat Generatoru ilə yaradılıb (${new Date().toISOString().slice(0,10)}). */\n`;
    out += `window.DASH = window.DASH || {};\n`;
    for (const k of keys) if (data[k] !== undefined) out += `window.DASH.${k} = ${JSON.stringify(data[k], null, 2)};\n`;
    return out;
  };
})();
