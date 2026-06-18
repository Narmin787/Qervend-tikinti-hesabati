/* data.js — Pirəhmədli kəndi
   Avtomatik yaradılıb (2026-06-18). Əl ilə redaktə etmək əvəzinə Excel şablonundan istifadə edin. */
window.DASH = window.DASH || {};
window.DASH.meta = {
  "projectTitle": "PIRƏHMƏDLI KƏNDI — TIKINTI GEDIŞATI HESABATI demo",
  "village": "Pirəhmədli kəndi",
  "district": "Füzuli rayonu",
  "contractor": "SEA BREEZE MMC",
  "reportDate": "11.06.2026",
  "cutoffDate": "11.06.2026",
  "startDate": "06.08.2025",
  "plannedFinish": "30.10.2026",
  "revisedFinish": "30.10.2026",
  "baselineDays": null,
  "extraDays": null,
  "daysRemaining": 141,
  "officialOverall": 49.64,
  "officialPlan": 56.06,
  "primaveraCode": "",
  "note": "",
  "sourcePdf": "source.pdf",
  "sources": [
    {
      "label": "Mənbə sənədi (PDF)",
      "file": "source.pdf"
    }
  ]
};
window.DASH.kpi = [
  {
    "id": "umumi",
    "value": "49.64",
    "unit": "%",
    "label": "ÜMUMİ İCRA (RƏSMİ)",
    "sub": "Plan: 56.06% | -6.42%",
    "accent": "teal",
    "deltaSign": "neg",
    "pending": false
  },
  {
    "id": "evler",
    "value": "52.57",
    "unit": "%",
    "label": "FƏRDİ EVLƏR",
    "sub": "Plan: 60.22% | -7.65%",
    "accent": "teal",
    "deltaSign": "neg",
    "pending": false
  },
  {
    "id": "isciler",
    "value": null,
    "unit": "",
    "label": "İŞÇİ SAYI (GÜNDƏLİK)",
    "sub": "Məlumat əlavə edilməyib",
    "accent": "violet",
    "deltaSign": "none",
    "pending": true
  },
  {
    "id": "texnika",
    "value": null,
    "unit": "",
    "label": "TEXNİKA VAHİDİ",
    "sub": "Məlumat əlavə edilməyib",
    "accent": "orange",
    "deltaSign": "none",
    "pending": true
  },
  {
    "id": "qalan",
    "value": "~141",
    "unit": " gün",
    "label": "BİTMƏYƏ QALAN",
    "sub": "Hədəf: 30.10.2026",
    "accent": "red",
    "deltaSign": "none",
    "pending": false
  }
];
window.DASH.overall = {
  "objects": [
    {
      "name": "Fərdi evlər (146 ev)",
      "plan": 60.22,
      "fakt": 52.57
    },
    {
      "name": "Sahə 1 (60 ev)",
      "plan": 60.22,
      "fakt": 53.44
    },
    {
      "name": "Sahə 2 (86 ev)",
      "plan": 60.22,
      "fakt": 51.7
    },
    {
      "name": "Məktəb (480 yerlik)",
      "plan": 42.89,
      "fakt": 39.31
    },
    {
      "name": "Bağça (100 yerlik)",
      "plan": 31.13,
      "fakt": 32.1
    },
    {
      "name": "Tibb məntəqəsi",
      "plan": 42.96,
      "fakt": 43.72
    }
  ]
};
window.DASH.packages = {
  "items": [
    {
      "name": "Sahə 1 (60 ev)",
      "ev": 60,
      "plan": 60.22,
      "fakt": 53.44
    },
    {
      "name": "Sahə 2 (86 ev)",
      "ev": 86,
      "plan": 60.22,
      "fakt": 51.7
    }
  ],
  "trend": [],
  "trendNote": ""
};
window.DASH.workItems = {
  "lots": []
};
window.DASH.otherObjects = {
  "asOf": "11.06.2026",
  "contractNote": "",
  "objects": [
    {
      "name": "Məktəb (480 yerlik)",
      "plan": 42.89,
      "fakt": 39.31,
      "status": ""
    },
    {
      "name": "Bağça (100 yerlik)",
      "plan": 31.13,
      "fakt": 32.1,
      "status": ""
    },
    {
      "name": "Tibb məntəqəsi",
      "plan": 42.96,
      "fakt": 43.72,
      "status": ""
    }
  ]
};
window.DASH.infrastructure = {
  "asOf": "",
  "overallFakt": null,
  "overallPlan": null,
  "items": [],
  "weeklyNote": ""
};
window.DASH.workforce = {
  "available": false,
  "period": "",
  "daily": [],
  "totalSeries": [],
  "machinery": [],
  "emptyNote": "İşçi heyəti və texnika üzrə gündəlik hesabat hələ əlavə edilməyib.",
  "alert": ""
};
window.DASH.velocity = {
  "cutoff": "2026-06-11",
  "priorDate": "",
  "priorWeeks": 3,
  "points": [
    "Əvvəlki ay",
    "04.06",
    "11.06"
  ],
  "rows": [
    {
      "obyekt": "Ümumi",
      "plan": 56.06,
      "fakt": 49.64,
      "finish": "30.10.2026",
      "priorFakt": null,
      "dev3": [
        -8.6,
        -6.99,
        -6.42
      ]
    },
    {
      "obyekt": "Fərdi evlər (146 ev)",
      "plan": 60.22,
      "fakt": 52.57,
      "finish": "23.10.2026",
      "priorFakt": null,
      "dev3": [
        -9.82,
        -8.2,
        -7.65
      ]
    },
    {
      "obyekt": "Sahə 1 (60 ev)",
      "plan": 60.22,
      "fakt": 53.44,
      "finish": "23.10.2026",
      "priorFakt": null,
      "dev3": [
        -7.95,
        -7.2,
        -6.78
      ]
    },
    {
      "obyekt": "Sahə 2 (86 ev)",
      "plan": 60.22,
      "fakt": 51.7,
      "finish": "23.11.2026",
      "priorFakt": null,
      "dev3": [
        -11.7,
        -9.2,
        -8.52
      ]
    },
    {
      "obyekt": "Məktəb (480 yerlik)",
      "plan": 42.89,
      "fakt": 39.31,
      "finish": "23.10.2026",
      "priorFakt": null,
      "dev3": [
        -6.42,
        -4.16,
        -3.58
      ]
    },
    {
      "obyekt": "Bağça (100 yerlik)",
      "plan": 31.13,
      "fakt": 32.1,
      "finish": "07.10.2026",
      "priorFakt": null,
      "dev3": [
        0.15,
        0.64,
        0.97
      ]
    },
    {
      "obyekt": "Tibb məntəqəsi",
      "plan": 42.96,
      "fakt": 43.72,
      "finish": "21.10.2026",
      "priorFakt": null,
      "dev3": [
        -1.51,
        0.1,
        0.76
      ]
    }
  ]
};
