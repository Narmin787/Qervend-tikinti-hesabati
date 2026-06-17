/* data.js — Qərvənd kəndi
   Avtomatik yaradılıb (2026-06-17). Əl ilə redaktə etmək əvəzinə Excel şablonundan istifadə edin. */
window.DASH = window.DASH || {};
window.DASH.meta = {
  "projectTitle": "QƏRVƏND KƏNDİ — TİKİNTİ GEDİŞATI HESABATI",
  "village": "Qərvənd kəndi",
  "district": "Ağdam rayonu",
  "contractor": "İMA Energy MMC",
  "reportDate": "16.06.2026",
  "cutoffDate": "11.06.2026",
  "startDate": "06.10.2025",
  "plannedFinish": "30.11.2026",
  "revisedFinish": "30.11.2026",
  "baselineDays": 415,
  "extraDays": 0,
  "daysRemaining": 172,
  "officialOverall": 31.52,
  "officialPlan": 54.86,
  "primaveraCode": "QRVND_Upd",
  "note": "",
  "sourcePdf": "source.pdf"
};
window.DASH.kpi = [
  {
    "id": "umumi",
    "value": "31.52",
    "unit": "%",
    "label": "ÜMUMİ İCRA (RƏSMİ)",
    "sub": "Plan: 54.86% | -23.34%",
    "accent": "teal",
    "deltaSign": "neg",
    "pending": false
  },
  {
    "id": "evler",
    "value": "40.90",
    "unit": "%",
    "label": "FƏRDİ EVLƏR (851)",
    "sub": "Plan: 55.64% | -14.74%",
    "accent": "teal",
    "deltaSign": "neg",
    "pending": false
  },
  {
    "id": "isciler",
    "value": null,
    "unit": "",
    "label": "İŞÇİ SAYI (GÜNDƏLİK)",
    "sub": "Gündəlik hesabat daxil edilməyib",
    "accent": "violet",
    "deltaSign": "none",
    "pending": true
  },
  {
    "id": "texnika",
    "value": null,
    "unit": "",
    "label": "TEXNİKA VAHİDİ",
    "sub": "Gündəlik hesabat daxil edilməyib",
    "accent": "orange",
    "deltaSign": "none",
    "pending": true
  },
  {
    "id": "qalan",
    "value": "~172",
    "unit": " gün",
    "label": "BİTMƏYƏ QALAN",
    "sub": "Hədəf: 30.11.2026",
    "accent": "red",
    "deltaSign": "none",
    "pending": false
  }
];
window.DASH.overall = {
  "objects": [
    {
      "name": "Fərdi evlər (851)",
      "plan": 55.64,
      "fakt": 40.9
    },
    {
      "name": "Paket 1 (150)",
      "plan": 70.76,
      "fakt": 52.92
    },
    {
      "name": "Paket 2 (200)",
      "plan": 62.04,
      "fakt": 42.49
    },
    {
      "name": "Paket 3 (205)",
      "plan": 44.69,
      "fakt": 33.07
    },
    {
      "name": "Paket 4 (296)",
      "plan": 45.56,
      "fakt": 35.18
    },
    {
      "name": "Sahədaxili kommunikasiya",
      "plan": 53.24,
      "fakt": 12.31
    }
  ]
};
window.DASH.packages = {
  "items": [
    {
      "name": "Paket 1 (150)",
      "ev": 150,
      "plan": 70.76,
      "fakt": 52.92
    },
    {
      "name": "Paket 2 (200)",
      "ev": 200,
      "plan": 62.04,
      "fakt": 42.49
    },
    {
      "name": "Paket 3 (205)",
      "ev": 205,
      "plan": 44.69,
      "fakt": 33.07
    },
    {
      "name": "Paket 4 (296)",
      "ev": 296,
      "plan": 45.56,
      "fakt": 35.18
    }
  ],
  "trend": [
    {
      "date": "28.05.2026",
      "fakt": 30.17,
      "plan": 49.64
    },
    {
      "date": "04.06.2026",
      "fakt": 31.03,
      "plan": 51.74
    },
    {
      "date": "11.06.2026",
      "fakt": 31.52,
      "plan": 54.86
    }
  ],
  "trendNote": "Yalnız ÜMUMİ icra. Qırmızı = faktiki, mavi nöqtəli = plan. Mənbə: həftəlik hesabatlar (28.05, 04.06, 11.06). Plan 49.64% → 54.86% qalxdığı, faktiki isə 30.17% → 31.52% qaldığı üçün plandan geriləmə həftədən-həftəyə artır."
};
window.DASH.workItems = {
  "lots": [
    {
      "id": "cemi",
      "name": "Cəmi (851 ev)",
      "ev": 851,
      "items": [
        {
          "name": "Qaba işlər",
          "fakt": 84.26,
          "plan": 89.8
        },
        {
          "name": "Dam örtüyü",
          "fakt": 6.69,
          "plan": 21.79
        },
        {
          "name": "Daxili bəzək",
          "fakt": 5.87,
          "plan": 21.96
        },
        {
          "name": "MEP (mex/elektrik/santexnika)",
          "fakt": 7.71,
          "plan": 32.95
        },
        {
          "name": "Xarici bəzək (fasad)",
          "fakt": 0,
          "plan": 6.43
        },
        {
          "name": "Təsərrüfat tikililəri",
          "fakt": 0,
          "plan": 59.46
        }
      ]
    },
    {
      "id": "p1",
      "name": "Paket 1 (150 ev)",
      "ev": 150,
      "items": [
        {
          "name": "Qaba işlər",
          "fakt": 95.56,
          "plan": 98.55
        },
        {
          "name": "Dam örtüyü",
          "fakt": 26.77,
          "plan": 33.66
        },
        {
          "name": "Daxili bəzək",
          "fakt": 8.1,
          "plan": 43.18
        },
        {
          "name": "MEP (mex/elektrik/santexnika)",
          "fakt": 14.86,
          "plan": 52.78
        },
        {
          "name": "Xarici bəzək (fasad)",
          "fakt": 0,
          "plan": 9.44
        },
        {
          "name": "Təsərrüfat tikililəri",
          "fakt": 0,
          "plan": 59.72
        }
      ]
    },
    {
      "id": "p2",
      "name": "Paket 2 (200 ev)",
      "ev": 200,
      "items": [
        {
          "name": "Qaba işlər",
          "fakt": 88.59,
          "plan": 91.66
        },
        {
          "name": "Dam örtüyü",
          "fakt": 0,
          "plan": 40.54
        },
        {
          "name": "Daxili bəzək",
          "fakt": 7.74,
          "plan": 24.27
        },
        {
          "name": "MEP (mex/elektrik/santexnika)",
          "fakt": 7.96,
          "plan": 42.09
        },
        {
          "name": "Xarici bəzək (fasad)",
          "fakt": 0,
          "plan": 15.5
        },
        {
          "name": "Təsərrüfat tikililəri",
          "fakt": 0,
          "plan": 66.28
        }
      ]
    },
    {
      "id": "p3",
      "name": "Paket 3 (205 ev)",
      "ev": 205,
      "items": [
        {
          "name": "Qaba işlər",
          "fakt": 74.53,
          "plan": 84.77
        },
        {
          "name": "Dam örtüyü",
          "fakt": 0,
          "plan": 0
        },
        {
          "name": "Daxili bəzək",
          "fakt": 4.31,
          "plan": 8.7
        },
        {
          "name": "MEP (mex/elektrik/santexnika)",
          "fakt": 7.42,
          "plan": 22.88
        },
        {
          "name": "Xarici bəzək (fasad)",
          "fakt": 0,
          "plan": 0
        },
        {
          "name": "Təsərrüfat tikililəri",
          "fakt": 0,
          "plan": 55.93
        }
      ]
    },
    {
      "id": "p4",
      "name": "Paket 4 (296 ev)",
      "ev": 296,
      "items": [
        {
          "name": "Qaba işlər",
          "fakt": 78.36,
          "plan": 84.21
        },
        {
          "name": "Dam örtüyü",
          "fakt": 0,
          "plan": 12.97
        },
        {
          "name": "Daxili bəzək",
          "fakt": 3.33,
          "plan": 11.69
        },
        {
          "name": "MEP (mex/elektrik/santexnika)",
          "fakt": 0.61,
          "plan": 14.05
        },
        {
          "name": "Xarici bəzək (fasad)",
          "fakt": 0,
          "plan": 0.78
        },
        {
          "name": "Təsərrüfat tikililəri",
          "fakt": 0,
          "plan": 55.93
        }
      ]
    }
  ]
};
window.DASH.otherObjects = {
  "asOf": "",
  "contractNote": "",
  "objects": []
};
window.DASH.infrastructure = {
  "asOf": "11.06.2026",
  "overallFakt": 12.31,
  "overallPlan": 53.24,
  "items": [
    {
      "name": "Mərhələ 1",
      "fakt": 12.59,
      "plan": 44.64
    },
    {
      "name": "Mərhələ 2",
      "fakt": 13.34,
      "plan": 41.2
    },
    {
      "name": "Mərhələ 3",
      "fakt": 12.44,
      "plan": 52.54
    },
    {
      "name": "Mərhələ 4",
      "fakt": 11.21,
      "plan": 69.53
    }
  ],
  "weeklyNote": "Sahədaxili kommunikasiya üzrə ümumi icra 11.06 tarixinə 12.31% təşkil edir və plandan 40.93% geri qalır. Hər mərhələ daxilində yollar, kanalizasiya, su, qaz, elektrik (35/0.4 kV) və rabitə şəbəkələri ayrıca izlənilir; yalnız yollar və kanalizasiya üzrə məhdud irəliləyiş var, qalan şəbəkələr faktiki olaraq başlanmamışdır."
};
window.DASH.workforce = {
  "available": false,
  "period": "",
  "daily": [],
  "totalSeries": [],
  "machinery": [],
  "emptyNote": "İşçi heyəti və texnika üzrə gündəlik hesabat hələ bu hesabata əlavə edilməyib. Məlumat Excel-ə əlavə edilib göndərildikdə bu bölmə avtomatik olaraq qrafikləri göstərəcək.",
  "alert": ""
};
window.DASH.velocity = {
  "cutoff": "2026-06-11",
  "priorDate": "2026-05-21",
  "priorWeeks": 3,
  "points": [
    "Keçən ay (≈28.05)",
    "04.06",
    "11.06"
  ],
  "rows": [
    {
      "obyekt": "Ümumi",
      "plan": 54.86,
      "fakt": 31.52,
      "finish": "2026-11-30",
      "priorFakt": 26.05,
      "dev3": [
        -19.47,
        -20.71,
        -23.34
      ]
    },
    {
      "obyekt": "FYE (851 ev)",
      "plan": 55.64,
      "fakt": 40.9,
      "finish": "2026-11-30",
      "priorFakt": 35.24,
      "dev3": [
        -10.65,
        -12.4,
        -14.74
      ]
    },
    {
      "obyekt": "Paket 1 (150 ev)",
      "plan": 70.76,
      "fakt": 52.92,
      "finish": "2026-09-30",
      "priorFakt": 48.13,
      "dev3": [
        -12.25,
        -14.67,
        -17.84
      ]
    },
    {
      "obyekt": "Paket 2 (200 ev)",
      "plan": 62.04,
      "fakt": 42.49,
      "finish": "2026-10-31",
      "priorFakt": 38.28,
      "dev3": [
        -15.03,
        -17.2,
        -19.55
      ]
    },
    {
      "obyekt": "Paket 3 (205 ev)",
      "plan": 44.69,
      "fakt": 33.07,
      "finish": "2026-11-15",
      "priorFakt": 25.81,
      "dev3": [
        -7.76,
        -9.25,
        -11.89
      ]
    },
    {
      "obyekt": "Paket 4 (296 ev)",
      "plan": 45.56,
      "fakt": 35.18,
      "finish": "2026-11-30",
      "priorFakt": 28.76,
      "dev3": [
        -7.78,
        -8.77,
        -10.38
      ]
    },
    {
      "obyekt": "Sahədaxili komm.",
      "plan": 53.24,
      "fakt": 12.31,
      "finish": "2026-11-30",
      "priorFakt": 7.25,
      "dev3": [
        -37.51,
        -37.71,
        -40.93
      ]
    }
  ]
};
