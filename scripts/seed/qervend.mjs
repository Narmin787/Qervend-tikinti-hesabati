// ============================================================================
// Qərvənd — məlumatın YENİDƏN QURULMASI (yalnız real mənbələrdən)
// Mənbələr:
//   [P] Primavera PDF (QRVND_Upd, kəsim 11.06.2026): Performance % = Faktiki,
//       Schedule % = Plan. WBS kodları aşağıda qeyd olunub.
//   [E] Excel "Qərvənd (yeni)" vərəqi (11.06.2026) + "Sheet1" (21.05.2026):
//       gecikmə faizləri və əvvəlki həftə faktiki dəyərləri.
// Uydurma / şablon məlumatı YOXDUR. Müqaviləsi olmayan obyektlər (məktəb,
// bağça, inzibati bina, tibb məntəqəsi, qəbiristanlıq) Primavera-da yoxdur —
// çıxarılıb.
// ============================================================================
import fs from 'node:fs';
import { dataToWorkbook } from '../lib/schema.mjs';

const data = {
  meta: {
    projectTitle: 'Qərvənd kəndi üzrə tikinti gedişatı hesabatı',
    village: 'Qərvənd kəndi', district: 'Ağdam rayonu', contractor: 'İMA Energy MMC',
    reportDate: '16.06.2026', cutoffDate: '11.06.2026',
    startDate: '06.10.2025', plannedFinish: '30.11.2026', revisedFinish: '30.11.2026', // [P] BL Finish 30-Nov-26
    baselineDays: 415, extraDays: 0, daysRemaining: 172, // [P] BL Project Duration 415 gün
    officialOverall: 31.52, officialPlan: 54.86, // [P] QRVND_Upd 31.52% / 54.86%
    primaveraCode: 'QRVND_Upd', note: '', sourcePdf: 'source.pdf',
  },

  kpi: [
    { id:'umumi',   value:'31.52', unit:'%', label:'ÜMUMİ İCRA (RƏSMİ)', sub:'Plan: 54.86% | -23.34%', accent:'teal',   deltaSign:'neg',  pending:false },
    { id:'evler',   value:'40.90', unit:'%', label:'FƏRDİ EVLƏR (851)',   sub:'Plan: 55.64% | -14.74%', accent:'teal',   deltaSign:'neg',  pending:false },
    { id:'isciler', value:null,    unit:'',  label:'İŞÇİ SAYI (GÜNDƏLİK)', sub:'Məlumat əlavə edilməyib', accent:'violet', deltaSign:'none', pending:true },
    { id:'texnika', value:null,    unit:'',  label:'TEXNİKA VAHİDİ',       sub:'Məlumat əlavə edilməyib', accent:'orange', deltaSign:'none', pending:true },
    { id:'qalan',   value:'~172',  unit:' gün', label:'BİTMƏYƏ QALAN',     sub:'Hədəf: 30.11.2026', accent:'red', deltaSign:'none', pending:false },
  ],

  // [P] FYE 3.1, packets 3.1.1–3.1.4, infra 3.3. Paket 3 plan = 44.69 (Primavera).
  overall: { objects: [
    { name:'Fərdi evlər (851)',          plan:55.64, fakt:40.90 },
    { name:'Paket 1 (150)',              plan:70.76, fakt:52.92 },
    { name:'Paket 2 (200)',              plan:62.04, fakt:42.49 },
    { name:'Paket 3 (205)',              plan:44.69, fakt:33.07 },
    { name:'Paket 4 (296)',              plan:45.56, fakt:35.18 },
    { name:'Sahədaxili kommunikasiya',   plan:53.24, fakt:12.31 },
  ]},

  packages: {
    items: [
      { name:'Paket 1 (150)', ev:150, plan:70.76, fakt:52.92 },
      { name:'Paket 2 (200)', ev:200, plan:62.04, fakt:42.49 },
      { name:'Paket 3 (205)', ev:205, plan:44.69, fakt:33.07 },
      { name:'Paket 4 (296)', ev:296, plan:45.56, fakt:35.18 },
    ],
    // [E] YALNIZ ÜMUMİ icra, üç həftəlik hesabat: 28.05, 04.06, 11.06.
    //     plan/fakt həmin tarixli hesabatların "Ümumi" sətrindən.
    trend: [
      { date:'28.05.2026', fakt:30.17, plan:49.64 },
      { date:'04.06.2026', fakt:31.03, plan:51.74 },
      { date:'11.06.2026', fakt:31.52, plan:54.86 },
    ],
    trendNote: 'Yalnız ÜMUMİ icra. Qırmızı = faktiki, mavi nöqtəli = plan. Mənbə: həftəlik hesabatlar (28.05, 04.06, 11.06). Plan 49.64% → 54.86% qalxdığı, faktiki isə 30.17% → 31.52% qaldığı üçün plandan geriləmə həftədən-həftəyə artır.',
  },

  // [P] Görülən işlər — hər ev tipi (2/3/4/5 otaqlı) üzrə iş mərhələləri.
  //     Faiz = həmin Primavera qovşağının Performance%/Schedule%-i (ev tiplərinin
  //     ortalaması yalnız 'Cəmi' və paket-orta sətirlərində).
  workItems: { lots: [
    { id:'cemi', name:'Cəmi (851 ev)', ev:851, items:[
      { name:'Qaba işlər', fakt:84.26, plan:89.8 },
      { name:'Dam örtüyü', fakt:6.69, plan:21.79 },
      { name:'Daxili bəzək', fakt:5.87, plan:21.96 },
      { name:'MEP', fakt:7.71, plan:32.95 },
      { name:'Xarici bəzək', fakt:0.0, plan:6.43 },
      { name:'Təsərrüfat', fakt:0.0, plan:59.46 }
    ] },
    { id:'p1', name:'Paket 1 (150 ev) — orta', ev:150, items:[
      { name:'Qaba işlər', fakt:95.56, plan:98.55 },
      { name:'Dam örtüyü', fakt:26.77, plan:33.66 },
      { name:'Daxili bəzək', fakt:8.1, plan:43.18 },
      { name:'MEP', fakt:14.86, plan:52.78 },
      { name:'Xarici bəzək', fakt:0.0, plan:9.44 },
      { name:'Təsərrüfat', fakt:0.0, plan:59.72 }
    ] },
    { id:'p1r1', name:'Paket 1 — 2 otaqlı', items:[
      { name:'Qaba işlər', fakt:94.7, plan:100.0 },
      { name:'Dam örtüyü', fakt:8.29, plan:83.87 },
      { name:'Daxili bəzək', fakt:6.74, plan:67.94 },
      { name:'MEP', fakt:5.61, plan:50.57 },
      { name:'Xarici bəzək', fakt:0.0, plan:34.23 },
      { name:'Təsərrüfat', fakt:0.0, plan:9.01 }
    ] },
    { id:'p1r2', name:'Paket 1 — 3 otaqlı', items:[
      { name:'Qaba işlər', fakt:97.33, plan:99.12 },
      { name:'Dam örtüyü', fakt:11.56, plan:30.55 },
      { name:'Daxili bəzək', fakt:10.35, plan:60.88 },
      { name:'MEP', fakt:19.04, plan:68.06 },
      { name:'Xarici bəzək', fakt:0.0, plan:1.11 },
      { name:'Təsərrüfat', fakt:0.0, plan:76.62 }
    ] },
    { id:'p1r3', name:'Paket 1 — 4 otaqlı', items:[
      { name:'Qaba işlər', fakt:94.47, plan:96.65 },
      { name:'Dam örtüyü', fakt:9.51, plan:0.0 },
      { name:'Daxili bəzək', fakt:8.41, plan:20.41 },
      { name:'MEP', fakt:13.97, plan:43.91 },
      { name:'Xarici bəzək', fakt:0.0, plan:0.0 },
      { name:'Təsərrüfat', fakt:0.0, plan:76.62 }
    ] },
    { id:'p1r4', name:'Paket 1 — 5 otaqlı', items:[
      { name:'Qaba işlər', fakt:95.74, plan:98.43 },
      { name:'Dam örtüyü', fakt:77.71, plan:20.24 },
      { name:'Daxili bəzək', fakt:6.88, plan:23.5 },
      { name:'MEP', fakt:20.8, plan:48.58 },
      { name:'Xarici bəzək', fakt:0.0, plan:2.44 },
      { name:'Təsərrüfat', fakt:0.0, plan:76.62 }
    ] },
    { id:'p2', name:'Paket 2 (200 ev) — orta', ev:200, items:[
      { name:'Qaba işlər', fakt:88.59, plan:91.66 },
      { name:'Dam örtüyü', fakt:0.0, plan:40.54 },
      { name:'Daxili bəzək', fakt:7.74, plan:24.27 },
      { name:'MEP', fakt:7.96, plan:42.09 },
      { name:'Xarici bəzək', fakt:0.0, plan:15.5 },
      { name:'Təsərrüfat', fakt:0.0, plan:66.28 }
    ] },
    { id:'p2r1', name:'Paket 2 — 2 otaqlı', items:[
      { name:'Qaba işlər', fakt:94.09, plan:100.0 },
      { name:'Dam örtüyü', fakt:0.0, plan:100.0 },
      { name:'Daxili bəzək', fakt:7.92, plan:36.63 },
      { name:'MEP', fakt:3.34, plan:51.75 },
      { name:'Xarici bəzək', fakt:0.0, plan:14.8 },
      { name:'Təsərrüfat', fakt:0.0, plan:76.62 }
    ] },
    { id:'p2r2', name:'Paket 2 — 3 otaqlı', items:[
      { name:'Qaba işlər', fakt:92.72, plan:97.81 },
      { name:'Dam örtüyü', fakt:0.0, plan:62.15 },
      { name:'Daxili bəzək', fakt:11.13, plan:34.16 },
      { name:'MEP', fakt:18.13, plan:46.28 },
      { name:'Xarici bəzək', fakt:0.0, plan:35.63 },
      { name:'Təsərrüfat', fakt:0.0, plan:76.62 }
    ] },
    { id:'p2r3', name:'Paket 2 — 4 otaqlı', items:[
      { name:'Qaba işlər', fakt:90.36, plan:89.33 },
      { name:'Dam örtüyü', fakt:0.0, plan:0.0 },
      { name:'Daxili bəzək', fakt:9.72, plan:26.29 },
      { name:'MEP', fakt:3.75, plan:70.33 },
      { name:'Xarici bəzək', fakt:0.0, plan:11.57 },
      { name:'Təsərrüfat', fakt:0.0, plan:55.93 }
    ] },
    { id:'p2r4', name:'Paket 2 — 5 otaqlı', items:[
      { name:'Qaba işlər', fakt:77.2, plan:79.5 },
      { name:'Dam örtüyü', fakt:0.0, plan:0.0 },
      { name:'Daxili bəzək', fakt:2.19, plan:0.0 },
      { name:'MEP', fakt:6.61, plan:0.0 },
      { name:'Xarici bəzək', fakt:0.0, plan:0.0 },
      { name:'Təsərrüfat', fakt:0.0, plan:55.93 }
    ] },
    { id:'p3', name:'Paket 3 (205 ev) — orta', ev:205, items:[
      { name:'Qaba işlər', fakt:74.53, plan:84.77 },
      { name:'Dam örtüyü', fakt:0.0, plan:0.0 },
      { name:'Daxili bəzək', fakt:4.31, plan:8.7 },
      { name:'MEP', fakt:7.42, plan:22.88 },
      { name:'Xarici bəzək', fakt:0.0, plan:0.0 },
      { name:'Təsərrüfat', fakt:0.0, plan:55.93 }
    ] },
    { id:'p3r1', name:'Paket 3 — 2 otaqlı', items:[
      { name:'Qaba işlər', fakt:78.95, plan:89.54 },
      { name:'Dam örtüyü', fakt:0.0, plan:0.0 },
      { name:'Daxili bəzək', fakt:2.78, plan:8.68 },
      { name:'MEP', fakt:2.18, plan:23.96 },
      { name:'Xarici bəzək', fakt:0.0, plan:0.0 },
      { name:'Təsərrüfat', fakt:0.0, plan:55.93 }
    ] },
    { id:'p3r2', name:'Paket 3 — 3 otaqlı', items:[
      { name:'Qaba işlər', fakt:78.78, plan:80.91 },
      { name:'Dam örtüyü', fakt:0.0, plan:0.0 },
      { name:'Daxili bəzək', fakt:7.97, plan:8.78 },
      { name:'MEP', fakt:14.65, plan:27.33 },
      { name:'Xarici bəzək', fakt:0.0, plan:0.0 },
      { name:'Təsərrüfat', fakt:0.0, plan:55.93 }
    ] },
    { id:'p3r3', name:'Paket 3 — 4 otaqlı', items:[
      { name:'Qaba işlər', fakt:73.01, plan:90.05 },
      { name:'Dam örtüyü', fakt:0.0, plan:0.0 },
      { name:'Daxili bəzək', fakt:4.44, plan:9.02 },
      { name:'MEP', fakt:3.85, plan:26.55 },
      { name:'Xarici bəzək', fakt:0.0, plan:0.0 },
      { name:'Təsərrüfat', fakt:0.0, plan:55.93 }
    ] },
    { id:'p3r4', name:'Paket 3 — 5 otaqlı', items:[
      { name:'Qaba işlər', fakt:67.4, plan:78.56 },
      { name:'Dam örtüyü', fakt:0.0, plan:0.0 },
      { name:'Daxili bəzək', fakt:2.04, plan:8.3 },
      { name:'MEP', fakt:8.98, plan:13.66 },
      { name:'Xarici bəzək', fakt:0.0, plan:0.0 },
      { name:'Təsərrüfat', fakt:0.0, plan:55.93 }
    ] },
    { id:'p4', name:'Paket 4 (296 ev) — orta', ev:296, items:[
      { name:'Qaba işlər', fakt:78.36, plan:84.21 },
      { name:'Dam örtüyü', fakt:0.0, plan:12.97 },
      { name:'Daxili bəzək', fakt:3.33, plan:11.69 },
      { name:'MEP', fakt:0.61, plan:14.05 },
      { name:'Xarici bəzək', fakt:0.0, plan:0.78 },
      { name:'Təsərrüfat', fakt:0.0, plan:55.93 }
    ] },
    { id:'p4r1', name:'Paket 4 — 2 otaqlı', items:[
      { name:'Qaba işlər', fakt:72.55, plan:98.97 },
      { name:'Dam örtüyü', fakt:0.0, plan:51.88 },
      { name:'Daxili bəzək', fakt:3.0, plan:34.2 },
      { name:'MEP', fakt:0.0, plan:33.63 },
      { name:'Xarici bəzək', fakt:0.0, plan:3.13 },
      { name:'Təsərrüfat', fakt:0.0, plan:55.93 }
    ] },
    { id:'p4r2', name:'Paket 4 — 3 otaqlı', items:[
      { name:'Qaba işlər', fakt:79.42, plan:66.93 },
      { name:'Dam örtüyü', fakt:0.0, plan:0.0 },
      { name:'Daxili bəzək', fakt:2.92, plan:0.0 },
      { name:'MEP', fakt:2.43, plan:0.0 },
      { name:'Xarici bəzək', fakt:0.0, plan:0.0 },
      { name:'Təsərrüfat', fakt:0.0, plan:55.93 }
    ] },
    { id:'p4r3', name:'Paket 4 — 4 otaqlı', items:[
      { name:'Qaba işlər', fakt:81.03, plan:93.01 },
      { name:'Dam örtüyü', fakt:0.0, plan:0.0 },
      { name:'Daxili bəzək', fakt:5.04, plan:12.28 },
      { name:'MEP', fakt:0.0, plan:22.58 },
      { name:'Xarici bəzək', fakt:0.0, plan:0.0 },
      { name:'Təsərrüfat', fakt:0.0, plan:55.93 }
    ] },
    { id:'p4r4', name:'Paket 4 — 5 otaqlı', items:[
      { name:'Qaba işlər', fakt:80.45, plan:77.93 },
      { name:'Dam örtüyü', fakt:0.0, plan:0.0 },
      { name:'Daxili bəzək', fakt:2.38, plan:0.28 },
      { name:'MEP', fakt:0.0, plan:0.0 },
      { name:'Xarici bəzək', fakt:0.0, plan:0.0 },
      { name:'Təsərrüfat', fakt:0.0, plan:55.93 }
    ] },
  ]},

  // Müqaviləsi olmayan obyektlər Primavera-da yoxdur — bölmə boşdur (gizlədilir).
  otherObjects: { asOf:'', contractNote:'', objects: [] },

  // [P] Sahədaxili Kommunikasiya 3.3 → mərhələ üzrə komponentlər (real qovşaqlar).
  infrastructure: {
    asOf:'11.06.2026', overallFakt:12.31, overallPlan:53.24,
    items: [
      { name:'Mərhələ 1', fakt:12.59, plan:44.64 },
      { name:'Mərhələ 2', fakt:13.34, plan:41.2 },
      { name:'Mərhələ 3', fakt:12.44, plan:52.54 },
      { name:'Mərhələ 4', fakt:11.21, plan:69.53 }
    ],
    lots: [
      { id:'umumi', name:'Mərhələ üzrə', items:[
        { name:'Mərhələ 1', fakt:12.59, plan:44.64 },
        { name:'Mərhələ 2', fakt:13.34, plan:41.2 },
        { name:'Mərhələ 3', fakt:12.44, plan:52.54 },
        { name:'Mərhələ 4', fakt:11.21, plan:69.53 }
      ] },
      { id:'m1', name:'Mərhələ 1', items:[
        { name:'Xarici su kanalizasiyası', fakt:19.37, plan:40.0 },
        { name:'Xarici su şəbəkəsi', fakt:0.0, plan:16.94 },
        { name:'Qaz təchizatı', fakt:0.0, plan:0.0 },
        { name:'35 kV kabel xətti', fakt:0.0, plan:0.0 },
        { name:'0.4 kV kabel xətti', fakt:0.0, plan:0.0 },
        { name:'Rabitə şəbəkəsi', fakt:0.0, plan:0.0 },
        { name:'PTM və KTM', fakt:0.0, plan:6.03 },
        { name:'Yollar və səkilər', fakt:19.24, plan:78.04 }
      ] },
      { id:'m2', name:'Mərhələ 2', items:[
        { name:'Xarici su kanalizasiyası', fakt:14.73, plan:59.43 },
        { name:'Xarici su şəbəkəsi', fakt:0.0, plan:16.64 },
        { name:'Qaz təchizatı', fakt:0.0, plan:0.0 },
        { name:'35 kV kabel xətti', fakt:0.0, plan:0.0 },
        { name:'0.4 kV kabel xətti', fakt:0.0, plan:0.0 },
        { name:'Rabitə şəbəkəsi', fakt:0.0, plan:0.0 },
        { name:'PTM və KTM', fakt:0.0, plan:0.0 },
        { name:'Yollar və səkilər', fakt:25.49, plan:54.51 }
      ] },
      { id:'m3', name:'Mərhələ 3', items:[
        { name:'Xarici su kanalizasiyası', fakt:19.32, plan:57.09 },
        { name:'Xarici su şəbəkəsi', fakt:0.0, plan:32.36 },
        { name:'Qaz təchizatı', fakt:0.0, plan:0.0 },
        { name:'35 kV kabel xətti', fakt:0.0, plan:0.0 },
        { name:'0.4 kV kabel xətti', fakt:0.0, plan:0.0 },
        { name:'Rabitə şəbəkəsi', fakt:0.0, plan:0.0 },
        { name:'PTM və KTM', fakt:0.0, plan:0.0 },
        { name:'Yollar və səkilər', fakt:16.85, plan:82.34 }
      ] },
      { id:'m4', name:'Mərhələ 4', items:[
        { name:'Xarici su kanalizasiyası', fakt:17.28, plan:86.93 },
        { name:'Xarici su şəbəkəsi', fakt:0.0, plan:67.66 },
        { name:'Qaz təchizatı', fakt:0.0, plan:8.77 },
        { name:'35 kV kabel xətti', fakt:0.0, plan:0.0 },
        { name:'0.4 kV kabel xətti', fakt:0.0, plan:0.0 },
        { name:'Rabitə şəbəkəsi', fakt:0.0, plan:0.0 },
        { name:'PTM və KTM', fakt:0.0, plan:0.0 },
        { name:'Yollar və səkilər', fakt:15.16, plan:89.13 }
      ] },
    ],
    weeklyNote:'Sahədaxili kommunikasiya üzrə ümumi icra 12.31%, plandan 40.93% geri. Hər mərhələ daxilində yollar, kanalizasiya, su, qaz, elektrik və rabitə ayrıca izlənilir.',
  },

  workforce: {
    available:false, period:'', daily:[], totalSeries:[], machinery:[],
    emptyNote:'',
    alert:'',
  },

  // [E] yeni (11.06) gecikmələri + Sheet1 (21.05) faktiki = priorFakt.
  velocity: {
    cutoff:'2026-06-11', priorDate:'2026-05-21', priorWeeks:3.0,
    points:['28.05','04.06','11.06'],
    rows: [
      { obyekt:'Ümumi',              plan:54.86, fakt:31.52, finish:'2026-11-30', priorFakt:26.05, dev3:[-19.47,-20.71,-23.34] },
      { obyekt:'FYE (851 ev)',       plan:55.64, fakt:40.90, finish:'2026-11-30', priorFakt:35.24, dev3:[-10.65,-12.40,-14.74] },
      { obyekt:'Paket 1 (150 ev)',   plan:70.76, fakt:52.92, finish:'2026-09-30', priorFakt:48.13, dev3:[-12.25,-14.67,-17.84] },
      { obyekt:'Paket 2 (200 ev)',   plan:62.04, fakt:42.49, finish:'2026-10-31', priorFakt:38.28, dev3:[-15.03,-17.20,-19.55] },
      { obyekt:'Paket 3 (205 ev)',   plan:44.69, fakt:33.07, finish:'2026-11-15', priorFakt:25.81, dev3:[-7.76,-9.25,-11.89] },
      { obyekt:'Paket 4 (296 ev)',   plan:45.56, fakt:35.18, finish:'2026-11-30', priorFakt:28.76, dev3:[-7.78,-8.77,-10.38] },
      { obyekt:'Sahədaxili komm.',   plan:53.24, fakt:12.31, finish:'2026-11-30', priorFakt:7.25,  dev3:[-37.51,-37.71,-40.93] },
    ],
  },
};

const wb = dataToWorkbook(data);
await wb.xlsx.writeFile('cities/qervend/source.xlsx');
console.log('Wrote cities/qervend/source.xlsx from Primavera + Excel (real data only).');
