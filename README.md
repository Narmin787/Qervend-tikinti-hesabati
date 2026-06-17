# Tikinti Gedişatı Hesabatı — Generator

Tikinti gedişatı hesabatlarını **Excel faylından avtomatik** yaradan, AI tələb
etməyən statik veb-hesabat sistemi. Hər kənd/şəhər üçün yalnız bir Excel (və
istəyə bağlı PDF) doldurub GitHub-a göndərirsiniz — Vercel hesabatı avtomatik
dərc edir.

**Canlı nümunə:** https://qervend-tikinti-hesabati.vercel.app

---

## Necə işləyir

```
cities/<şəhər>/source.xlsx   (rəqəmlər — Primavera/hesabat)  ┐
cities/<şəhər>/source.pdf    (mənbə sənəd, istəyə bağlı)      ├─►  npm run build  ─►  public/<şəhər>/
engine/report.html  +  engine/config.js   (şablon — bütün şəhərlər üçün eyni)  ┘
```

- **`engine/report.html`** — hesabat şablonu (HTML + CSS + qrafik motoru). Layihə
  rəqəmi YOXDUR. Yuxarıda PDF/Excel yükləmə düymələri var.
- **`engine/config.js`** — rəng teması, etiketlər, insight qaydaları (hamı üçün eyni).
- **`cities/<şəhər>/source.xlsx`** — həmin şəhərin rəqəmləri. Dəyişən yeganə fayl.
- **`cities/<şəhər>/source.pdf`** — istəyə bağlı rəsmi mənbə; hesabatda
  “📄 Mənbə sənədi” kimi görünür.
- ECharts CDN-dən yüklənir, ona görə hər hesabat ~55 KB-dır.

Hesabatdakı **bütün rəqəmlər yalnız `source.xlsx`-dən gəlir** — sistem heç nə
uydurmur. Excel-də nə varsa, hesabatda yalnız o olur.

## Hesabat funksiyaları

- **📊 Excel** düyməsi — məlumatı `data.xlsx` kimi yükləyir.
- **📄 PDF** düyməsi — bütün səhifəni **tam, kəsilməyən bir PDF** kimi yükləyir
  (çap pəncərəsi açmadan, Excel düyməsi kimi avtomatik).
- Ümumi İcra Trendində faktiki (qırmızı) və plan (mavi nöqtəli) xətləri.
- Boş bölmələr (məs. obyekt yoxdursa “Digər obyektlər”) avtomatik gizlənir.

## Yeni şəhər üçün hesabat

1. `template/data-template.xlsx` faylını açın (`Oxu` vərəqində izahlar var).
   Nümunə: `template/example-qervend.xlsx`.
2. Vərəqləri doldurun (aşağıdakı sxemə bax).
3. `cities/<şəhər-adı>/source.xlsx` kimi yadda saxlayın (+ istəyə bağlı `source.pdf`).
4. GitHub-a `git push` edin — **Vercel avtomatik qurub dərc edir.**

Yerli yoxlama:

```bash
npm install
npm run build      # public/ qovluğunu yaradır
npx serve public   # brauzerdə baxın
```

## Vercel avtomatik dərc

Bir dəfəlik: [vercel.com/new](https://vercel.com/new) → repozitoriyanı **Import**
edin. Vercel `vercel.json`-u oxuyur (build `npm run build`, çıxış `public`).
Bundan sonra hər `git push` avtomatik deploy yaradır.

## Excel vərəqlərinin sxemi

| Vərəq | Sütunlar / məzmun |
|------|--------------------|
| **Meta** | Sahə/Dəyər: projectTitle, village, district, contractor, reportDate, cutoffDate, startDate, plannedFinish, revisedFinish, baselineDays, extraDays, daysRemaining, officialOverall, officialPlan, primaveraCode, sourcePdf |
| **KPI** | id, value, unit, label, sub, accent, deltaSign, pending — `value` boş = “daxil edilməyib” |
| **Overall** | name, plan, fakt |
| **Packages** | name, ev, plan, fakt |
| **PackagesTrend** | date, fakt, plan (plan = mavi nöqtəli xətt; boş ola bilər) |
| **WorkItems** | lot_id, lot_name, lot_ev, item, plan, fakt (eyni `lot_id` bir tab altında) |
| **Other** | name, plan, fakt, status (boşdursa bölmə gizlənir) |
| **Infrastructure** | name, plan, fakt |
| **Velocity** | obyekt, plan, fakt, finish, priorFakt, dev1, dev2, dev3 |
| **WorkforceDaily** | date, sahe, texniki, idari · **WorkforceMachinery**: name, count |
| **Notes** | uzun mətnlər və əlavə parametrlər (Sahə/Dəyər) |

## Fayl strukturu

```
engine/        report.html, config.js        — şablon + motor (deploy olunur)
cities/        <şəhər>/source.xlsx|pdf|data.js — şəhər məlumatı
scripts/
  build.mjs                 — public/ qurur (Vercel bunu çağırır)
  make-template.mjs         — boş Excel şablonu yaradır
  xlsx-to-data.mjs          — Excel → data.js (köməkçi)
  seed/qervend.mjs          — Qərvənd məlumatının mənbə-istinadlı yenidən qurulması
  lib/                      — schema (Excel↔data), serialize, make-engine, testlər
template/      data-template.xlsx, example-qervend.xlsx
index.html     — şablonun mənbəyi (make-engine.mjs bundan report.html qurur; deploy olunmur)
```

## Skriptlər

| Əmr | İş |
|-----|-----|
| `npm run build` | Bütün `cities/*` üçün `public/` qurur |
| `npm run engine` | `index.html`-dən `engine/report.html` yenidən qurur |
| `npm run template` | `template/data-template.xlsx` yaradır |
| `npm test` | Excel↔data round-trip + render smoke testləri |

## Hesabat Generatoru (gizli builder app)

Gizli ünvanda işləyən, brauzerdə çalışan generator (heç bir AI yoxdur):

**`/narminreportwebapp`** (məs. `https://qervend-tikinti-hesabati.vercel.app/narminreportwebapp`)

- **Yeni** hesabat yarat və ya **mövcudu** seçib yenilə.
- Xam **Excel + Primavera PDF** yüklə → avtomatik oxunur (deterministik).
- Hər detalı (rəqəm, ad, qeyd, KPI) **redaktə et**, yanında **canlı önizləmə**.
- **⬇ source.xlsx / data.js** yüklə (tam offline) **və ya 🚀 Deploy** —
  GitHub-a göndərir, Vercel 1-5 dəqiqəyə canlı versiyanı yeniləyir.

Mənbə faylları `webapp/`-də; `npm run build` onları `public/narminreportwebapp/`-ə
köçürür. Səhifəyə görünən keçid yoxdur (yalnız ünvanı bilən açır).

### Deploy düyməsi üçün Vercel parametrləri (bir dəfəlik)

Deploy düyməsi `api/deploy.js` serverless funksiyasını çağırır. Vercel
layihəsinin **Settings → Environment Variables** bölməsində təyin edin:

| Dəyişən | İzah |
|--------|------|
| `GITHUB_TOKEN` | Bu repo üçün **Contents: read/write** icazəli fine-grained token |
| `DEPLOY_PASSWORD` | Gizli parol — appdə bu parolu daxil etməsən push olmur |
| `GITHUB_OWNER` / `GITHUB_REPO` / `GITHUB_BRANCH` | (istəyə bağlı; default Narmin787 / Qervend-tikinti-hesabati / main) |

Bu dəyişənlər təyin edilməyənə qədər **yükləmə/redaktə/önizləmə işləyir**,
yalnız Deploy düyməsi gözləyir.

## Keyfiyyət

- **Excel ↔ data çevrilməsi itkisizdir** (`scripts/lib/roundtrip-test.mjs`).
- Render smoke testləri (`smoke.mjs`, `smoke-ux.mjs`) hesabatın səhvsiz
  render olunduğunu yoxlayır.
- **CI** (`.github/workflows/ci.yml`) hər push-da build + testləri işə salır —
  yanlış Excel deploy olunmadan dayanır.
