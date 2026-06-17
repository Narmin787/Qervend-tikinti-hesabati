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

  root.dataToJs = function (data, label) {
    const keys = ['meta','kpi','overall','packages','workItems','otherObjects','infrastructure','workforce','velocity','insightsPinned'];
    let out = `/* data.js — ${label||(data.meta&&data.meta.village)||''}\n   Hesabat Generatoru ilə yaradılıb (${new Date().toISOString().slice(0,10)}). */\n`;
    out += `window.DASH = window.DASH || {};\n`;
    for (const k of keys) if (data[k] !== undefined) out += `window.DASH.${k} = ${JSON.stringify(data[k], null, 2)};\n`;
    return out;
  };
})();
