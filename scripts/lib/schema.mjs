// Shared schema: converts between the nested window.DASH data model and a flat
// Excel workbook. Used by both data->xlsx and xlsx->data so they stay in sync.
import ExcelJS from 'exceljs';

const num = v => {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'object' && 'result' in v) v = v.result; // exceljs formula cell
  const n = typeof v === 'number' ? v : parseFloat(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};
const rawStr = v => {
  if (v === null || v === undefined) return '';
  if (typeof v === 'object' && 'result' in v) v = v.result;
  if (typeof v === 'object' && 'text' in v) v = v.text; // rich text
  return String(v);
};
const str = v => rawStr(v).trim();
const bool = v => {
  if (typeof v === 'boolean') return v;
  const s = str(v).toLowerCase();
  return s === 'true' || s === '1' || s === 'bəli' || s === 'yes';
};

// ---- generic table helpers ----
function addTable(wb, name, cols, rows) {
  const ws = wb.addWorksheet(name);
  ws.addRow(cols);
  ws.getRow(1).font = { bold: true };
  for (const r of rows) ws.addRow(cols.map(c => (r[c] === undefined ? null : r[c])));
  ws.columns.forEach(c => { c.width = 22; });
  return ws;
}
function readTable(ws) {
  if (!ws) return [];
  const cols = [];
  ws.getRow(1).eachCell((cell, i) => { cols[i] = str(cell.value); });
  const out = [];
  ws.eachRow((row, idx) => {
    if (idx === 1) return;
    const o = {};
    let any = false;
    cols.forEach((c, i) => { if (!c) return; const v = row.getCell(i).value; o[c] = v; if (str(v) !== '') any = true; });
    if (any) out.push(o);
  });
  return out;
}
function addKV(wb, name, entries) {
  const ws = wb.addWorksheet(name);
  ws.addRow(['Sahə', 'Dəyər']);
  ws.getRow(1).font = { bold: true };
  for (const [k, v] of entries) ws.addRow([k, v === undefined ? null : v]);
  ws.getColumn(1).width = 26; ws.getColumn(2).width = 70;
  return ws;
}
function readKV(ws) {
  const m = {};
  if (!ws) return m;
  ws.eachRow((row, idx) => { if (idx === 1) return; const k = str(row.getCell(1).value); if (k) m[k] = row.getCell(2).value; });
  return m;
}

// ============================================================
// DATA  ->  WORKBOOK
// ============================================================
export function dataToWorkbook(d) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Tikinti Hesabatı Generator';

  const meta = d.meta || {};
  addKV(wb, 'Meta', [
    ['projectTitle', meta.projectTitle], ['village', meta.village], ['district', meta.district],
    ['contractor', meta.contractor], ['reportDate', meta.reportDate], ['cutoffDate', meta.cutoffDate],
    ['startDate', meta.startDate], ['plannedFinish', meta.plannedFinish], ['revisedFinish', meta.revisedFinish],
    ['baselineDays', meta.baselineDays], ['extraDays', meta.extraDays], ['daysRemaining', meta.daysRemaining],
    ['officialOverall', meta.officialOverall], ['officialPlan', meta.officialPlan],
    ['primaveraCode', meta.primaveraCode], ['note', meta.note],
    ['sourcePdf', meta.sourcePdf || ''],
  ]);

  addTable(wb, 'KPI', ['id', 'value', 'unit', 'label', 'sub', 'accent', 'deltaSign', 'pending'],
    (d.kpi || []).map(k => ({ ...k, value: k.value === null ? '' : k.value, pending: !!k.pending })));

  addTable(wb, 'Overall', ['name', 'plan', 'fakt'], (d.overall?.objects) || []);

  addTable(wb, 'Packages', ['name', 'ev', 'plan', 'fakt'], (d.packages?.items) || []);
  addTable(wb, 'PackagesTrend', ['date', 'fakt', 'plan'], (d.packages?.trend) || []);

  // WorkItems: flatten lots -> rows
  const wiRows = [];
  for (const lot of (d.workItems?.lots) || [])
    for (const it of lot.items || [])
      wiRows.push({ lot_id: lot.id, lot_name: lot.name, lot_ev: lot.ev, item: it.name, plan: it.plan, fakt: it.fakt });
  addTable(wb, 'WorkItems', ['lot_id', 'lot_name', 'lot_ev', 'item', 'plan', 'fakt'], wiRows);

  addTable(wb, 'Other', ['name', 'plan', 'fakt', 'status'], (d.otherObjects?.objects) || []);
  addTable(wb, 'Infrastructure', ['name', 'plan', 'fakt'], (d.infrastructure?.items) || []);
  // Infrastructure detail: per-phase components (lots) -> flat rows
  const infRows = [];
  for (const lot of (d.infrastructure?.lots) || [])
    for (const it of lot.items || [])
      infRows.push({ lot_id: lot.id, lot_name: lot.name, item: it.name, plan: it.plan, fakt: it.fakt });
  addTable(wb, 'InfraItems', ['lot_id', 'lot_name', 'item', 'plan', 'fakt'], infRows);

  const vel = d.velocity || {};
  addTable(wb, 'Velocity', ['obyekt', 'plan', 'fakt', 'finish', 'priorFakt', 'dev1', 'dev2', 'dev3'],
    (vel.rows || []).map(r => ({ obyekt: r.obyekt, plan: r.plan, fakt: r.fakt, finish: r.finish, priorFakt: r.priorFakt,
      dev1: r.dev3?.[0], dev2: r.dev3?.[1], dev3: r.dev3?.[2] })));

  const wf = d.workforce || {};
  addTable(wb, 'WorkforceDaily', ['date', 'sahe', 'texniki', 'idari'], wf.daily || []);
  addTable(wb, 'WorkforceMachinery', ['name', 'count'], wf.machinery || []);

  // Manual (pinned) insights, written by the builder app — kept per city.
  addTable(wb, 'Pinned', ['category', 'title', 'body'], d.insightsPinned || []);

  const o = d.otherObjects || {}, inf = d.infrastructure || {};
  addKV(wb, 'Notes', [
    ['packagesTrendNote', d.packages?.trendNote],
    ['otherAsOf', o.asOf], ['otherContractNote', o.contractNote],
    ['infraAsOf', inf.asOf], ['infraOverallPlan', inf.overallPlan], ['infraOverallFakt', inf.overallFakt],
    ['infraWeeklyNote', inf.weeklyNote],
    ['velCutoff', vel.cutoff], ['velPriorDate', vel.priorDate], ['velPriorWeeks', vel.priorWeeks],
    ['velPoint1', vel.points?.[0]], ['velPoint2', vel.points?.[1]], ['velPoint3', vel.points?.[2]],
    ['workforceAvailable', wf.available ? 'true' : 'false'], ['workforcePeriod', wf.period],
    ['workforceEmptyNote', wf.emptyNote], ['workforceAlert', wf.alert],
  ]);

  return wb;
}

// ============================================================
// WORKBOOK  ->  DATA
// ============================================================
export async function workbookToData(bufferOrPath) {
  const wb = new ExcelJS.Workbook();
  if (typeof bufferOrPath === 'string') await wb.xlsx.readFile(bufferOrPath);
  else await wb.xlsx.load(bufferOrPath);
  const ws = n => wb.getWorksheet(n);

  const M = readKV(ws('Meta'));
  const N = readKV(ws('Notes'));

  const meta = {
    projectTitle: str(M.projectTitle), village: str(M.village), district: str(M.district),
    contractor: str(M.contractor), reportDate: str(M.reportDate), cutoffDate: str(M.cutoffDate),
    startDate: str(M.startDate), plannedFinish: str(M.plannedFinish), revisedFinish: str(M.revisedFinish),
    baselineDays: num(M.baselineDays), extraDays: num(M.extraDays), daysRemaining: num(M.daysRemaining),
    officialOverall: num(M.officialOverall), officialPlan: num(M.officialPlan),
    primaveraCode: str(M.primaveraCode), note: str(M.note), sourcePdf: str(M.sourcePdf),
  };

  const kpi = readTable(ws('KPI')).map(r => ({
    id: str(r.id), value: str(r.value) === '' ? null : str(r.value), unit: rawStr(r.unit),
    label: str(r.label), sub: str(r.sub), accent: str(r.accent) || 'teal',
    deltaSign: str(r.deltaSign) || 'none', pending: bool(r.pending),
  }));

  const overall = { objects: readTable(ws('Overall')).map(r => ({ name: str(r.name), plan: num(r.plan), fakt: num(r.fakt) })) };

  const packages = {
    items: readTable(ws('Packages')).map(r => ({ name: str(r.name), ev: num(r.ev), plan: num(r.plan), fakt: num(r.fakt) })),
    trend: readTable(ws('PackagesTrend')).map(r => {
      const t = { date: str(r.date), fakt: num(r.fakt) };
      if (num(r.plan) != null) t.plan = num(r.plan); // optional planned line (blue dots)
      return t;
    }),
    trendNote: str(N.packagesTrendNote),
  };

  // WorkItems: regroup by lot_id preserving order
  const lotsMap = new Map();
  for (const r of readTable(ws('WorkItems'))) {
    const id = str(r.lot_id);
    if (!lotsMap.has(id)) lotsMap.set(id, { id, name: str(r.lot_name), ev: num(r.lot_ev), items: [] });
    lotsMap.get(id).items.push({ name: str(r.item), fakt: num(r.fakt), plan: num(r.plan) });
  }
  const workItems = { lots: [...lotsMap.values()] };

  const otherObjects = {
    asOf: str(N.otherAsOf), contractNote: str(N.otherContractNote),
    objects: readTable(ws('Other')).map(r => ({ name: str(r.name), plan: num(r.plan), fakt: num(r.fakt), status: str(r.status) })),
  };

  const infrastructure = {
    asOf: str(N.infraAsOf), overallFakt: num(N.infraOverallFakt), overallPlan: num(N.infraOverallPlan),
    items: readTable(ws('Infrastructure')).map(r => ({ name: str(r.name), fakt: num(r.fakt), plan: num(r.plan) })),
    weeklyNote: str(N.infraWeeklyNote),
  };
  // Infrastructure detail: regroup InfraItems rows by phase (only if present)
  const infLotsMap = new Map();
  for (const r of readTable(ws('InfraItems'))) {
    const id = str(r.lot_id);
    if (!infLotsMap.has(id)) infLotsMap.set(id, { id, name: str(r.lot_name), items: [] });
    infLotsMap.get(id).items.push({ name: str(r.item), fakt: num(r.fakt), plan: num(r.plan) });
  }
  if (infLotsMap.size) infrastructure.lots = [...infLotsMap.values()];

  const wfDaily = readTable(ws('WorkforceDaily')).map(r => ({ date: str(r.date), sahe: num(r.sahe), texniki: num(r.texniki), idari: num(r.idari) }));
  const wfMach = readTable(ws('WorkforceMachinery')).map(r => ({ name: str(r.name), count: num(r.count) }));
  const workforce = {
    available: bool(N.workforceAvailable), period: str(N.workforcePeriod),
    daily: wfDaily, totalSeries: [], machinery: wfMach,
    emptyNote: str(N.workforceEmptyNote), alert: str(N.workforceAlert),
  };

  const velocity = {
    cutoff: str(N.velCutoff), priorDate: str(N.velPriorDate), priorWeeks: num(N.velPriorWeeks),
    points: [str(N.velPoint1), str(N.velPoint2), str(N.velPoint3)],
    rows: readTable(ws('Velocity')).map(r => ({
      obyekt: str(r.obyekt), plan: num(r.plan), fakt: num(r.fakt), finish: str(r.finish),
      priorFakt: num(r.priorFakt), dev3: [num(r.dev1), num(r.dev2), num(r.dev3)],
    })),
  };

  const insightsPinned = readTable(ws('Pinned'))
    .map(r => ({ category: str(r.category), title: str(r.title), body: str(r.body) }))
    .filter(p => p.category && p.title && p.body);

  const out = { meta, kpi, overall, packages, workItems, otherObjects, infrastructure, workforce, velocity };
  if (insightsPinned.length) out.insightsPinned = insightsPinned;
  return out;
}
