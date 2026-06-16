// Generates template/data-template.xlsx: an empty workbook with the correct
// sheets/headers plus an "Oxu" (instructions) sheet. Fill it in and drop it as
// cities/<city>/source.xlsx to generate a new report.
import fs from 'node:fs';
import ExcelJS from 'exceljs';
import { dataToWorkbook } from './lib/schema.mjs';

// Build an empty data skeleton so the workbook has all sheets/headers.
const empty = {
  meta: {}, kpi: [], overall: { objects: [] }, packages: { items: [], trend: [], trendNote: '' },
  workItems: { lots: [] }, otherObjects: { objects: [] }, infrastructure: { items: [] },
  workforce: { daily: [], machinery: [] }, velocity: { rows: [] },
};
const wb = dataToWorkbook(empty);

// Instructions sheet (first)
const oxu = wb.addWorksheet('Oxu');
wb.worksheets.splice(wb.worksheets.indexOf(oxu), 1);
wb.worksheets.unshift(oxu);
const rows = [
  ['TİKİNTİ HESABATI — EXCEL ŞABLONU'],
  [''],
  ['Bu faylı doldurun və cities/<şəhər>/source.xlsx kimi yadlandırıb GitHub-a göndərin.'],
  ['Vercel avtomatik olaraq yeni hesabatı yaradacaq. AI lazım deyil.'],
  [''],
  ['VƏRƏQLƏR:'],
  ['Meta', 'Layihə kimliyi (Sahə/Dəyər). sourcePdf = mənbə PDF (cities/<şəhər>/source.pdf qoyun).'],
  ['KPI', 'Yuxarı kartlar. value boş = "daxil edilməyib". pending=true gözləmədə.'],
  ['Overall', 'Ümumi icra: name, plan, fakt (faiz).'],
  ['Packages', 'Ev paketləri: name, ev, plan, fakt.'],
  ['PackagesTrend', 'Trend nöqtələri: date, fakt.'],
  ['WorkItems', 'İş maddələri: lot_id, lot_name, lot_ev, item, plan, fakt. Eyni lot_id sətirləri qruplaşır.'],
  ['Other', 'Digər obyektlər: name, plan, fakt, status.'],
  ['Infrastructure', 'İnfrastruktur: name, plan, fakt.'],
  ['Velocity', 'Sürət: obyekt, plan, fakt, finish, priorFakt, dev1, dev2, dev3.'],
  ['WorkforceDaily', 'Gündəlik işçi: date, sahe, texniki, idari.'],
  ['WorkforceMachinery', 'Texnika: name, count.'],
  ['Notes', 'Uzun mətnlər və əlavə parametrlər (Sahə/Dəyər).'],
];
rows.forEach((r, i) => { const row = oxu.addRow(r); if (i === 0) row.font = { bold: true, size: 14 }; });
oxu.getColumn(1).width = 22; oxu.getColumn(2).width = 90;

fs.mkdirSync('template', { recursive: true });
await wb.xlsx.writeFile('template/data-template.xlsx');
console.log('Wrote template/data-template.xlsx');
