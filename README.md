# Tikinti Gedişatı Hesabatı — Generator

Bu repozitoriya tikinti gedişatı hesabatlarını **Excel faylından avtomatik** yaradır.
Hər yeni şəhər/kənd üçün AI lazım deyil — sadəcə Excel şablonunu doldurub GitHub-a
göndərirsiniz, Vercel isə hesabatı avtomatik dərc edir.

## Necə işləyir

```
cities/<şəhər>/source.xlsx   (Excel — rəqəmlər)        ┐
cities/<şəhər>/source.pdf    (PDF — mənbə sənəd, ops.) ┘─► npm run build ─► public/<şəhər>/  (veb hesabat)
engine/report.html           (şablon — hər şəhər üçün eyni)
engine/config.js             (tema, etiketlər, qaydalar — hər şəhər üçün eyni)
```

- **`engine/report.html`** — hesabat şablonu (HTML + CSS + qrafik motoru). Heç bir layihə rəqəmi yoxdur.
  - **İdarəçi paneli (CEO toolbar):** yuxarıda yapışqan zolaq — status (yaşıl/sarı/qırmızı), icra vs plan, qalan günlər.
  - **📄 PDF** düyməsi — hesabatı PDF kimi yadda saxlayır/çap edir (təmiz çap görünüşü ilə).
  - **📊 Excel** düyməsi — hesabatın məlumatını `data.xlsx` kimi yükləyir.
- **`engine/config.js`** — rəng teması, etiketlər və insight qaydaları (bütün şəhərlər üçün eyni).
- **`cities/<şəhər>/source.xlsx`** — həmin şəhərin rəqəmləri. Dəyişən yeganə fayl budur.
- **`cities/<şəhər>/source.pdf`** — (istəyə bağlı) rəsmi mənbə sənəd; hesabatda “📄 Mənbə sənədi” düyməsi kimi görünür.
- ECharts qrafik kitabxanası CDN-dən yüklənir, ona görə hər hesabat ~50 KB-dır (əvvəlki 1.1 MB əvəzinə).

## Yeni şəhər üçün hesabat yaratmaq

1. `template/data-template.xlsx` faylını açın (boş şablon, izahlar `Oxu` vərəqindədir).
   Nümunə üçün `template/example-qervend.xlsx` faylına baxın.
2. Vərəqləri doldurun: `Meta`, `KPI`, `Overall`, `Packages`, `WorkItems`, `Velocity`, və s.
3. Faylı `cities/<şəhər-adı>/source.xlsx` kimi yadda saxlayın.
4. (İstəyə bağlı) rəsmi PDF-i `cities/<şəhər-adı>/source.pdf` kimi əlavə edin.
5. GitHub-a `git push` edin. **Vercel avtomatik yenidən qurub dərc edəcək.**

Yerli yoxlama:

```bash
npm install
npm run build          # public/ qovluğunu yaradır
npx serve public       # brauzerdə baxın (və ya hər hansı statik server)
```

## Vercel avtomatik dərc (push → deploy)

Bir dəfəlik quraşdırma:

1. [vercel.com/new](https://vercel.com/new) → bu GitHub repozitoriyasını **Import** edin.
2. Vercel `vercel.json`-u oxuyur:
   - Build Command: `npm run build`
   - Output Directory: `public`
   - Install Command: `npm install`
3. **Deploy** düyməsini basın.

Bundan sonra `main` (və ya istənilən) budağa hər `git push`:
- Production deploy yaradır (default budaq üçün),
- digər budaqlar/PR-lar üçün Preview deploy yaradır.

Yeni Excel/PDF əlavə edib push etmək kifayətdir — başqa heç nə lazım deyil.

## Skriptlər

| Əmr | İş |
|-----|----|
| `npm run build` | Bütün `cities/*` üçün `public/` qurur (Vercel bunu çağırır). |
| `npm run template` | `template/data-template.xlsx` boş şablonunu yaradır. |
| `node scripts/data-to-xlsx.mjs <city|index.html> <out.xlsx>` | Mövcud məlumatdan Excel yaradır (nümunə/seed üçün). |
| `node scripts/xlsx-to-data.mjs <in.xlsx> <city>` | Excel-i `cities/<city>/data.js`-ə çevirir. |

## Excel vərəqlərinin sxemi

- **Meta** (Sahə/Dəyər): `projectTitle, village, district, contractor, reportDate, cutoffDate, startDate, plannedFinish, revisedFinish, baselineDays, extraDays, daysRemaining, officialOverall, officialPlan, primaveraCode, note, sourcePdf`
- **KPI**: `id, value, unit, label, sub, accent, deltaSign, pending` — `value` boş = “daxil edilməyib”
- **Overall**: `name, plan, fakt`
- **Packages**: `name, ev, plan, fakt` · **PackagesTrend**: `date, fakt`
- **WorkItems**: `lot_id, lot_name, lot_ev, item, plan, fakt` (eyni `lot_id` sətirləri bir tab altında qruplaşır)
- **Other**: `name, plan, fakt, status`
- **Infrastructure**: `name, plan, fakt`
- **Velocity**: `obyekt, plan, fakt, finish, priorFakt, dev1, dev2, dev3`
- **WorkforceDaily**: `date, sahe, texniki, idari` · **WorkforceMachinery**: `name, count`
- **Notes** (Sahə/Dəyər): uzun mətnlər (weeklyNote, contractNote və s.) və əlavə parametrlər

## Qeydlər

- `index.html` köhnə (tək-fayllı, 1.1 MB) versiyadır — yalnız istinad üçün saxlanılır; deploy-a daxil edilmir (`.vercelignore`).
- Excel ↔ data çevrilməsi **itkisizdir**: `scripts/lib/roundtrip-test.mjs` bütün bölmələrin eyni qaldığını yoxlayır.
