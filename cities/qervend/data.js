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
  "plannedFinish": "05.11.2026",
  "revisedFinish": "30.11.2026",
  "baselineDays": 395,
  "extraDays": 25,
  "daysRemaining": 172,
  "officialOverall": 31.52,
  "officialPlan": 54.86,
  "primaveraCode": "QRVND_Upd",
  "note": "",
  "sourcePdf": ""
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
      "plan": 44.96,
      "fakt": 33.07
    },
    {
      "name": "Paket 4 (296)",
      "plan": 45.56,
      "fakt": 35.18
    },
    {
      "name": "Sahədaxili komm.",
      "plan": 53.24,
      "fakt": 12.31
    },
    {
      "name": "Məktəb (840)",
      "plan": 14.75,
      "fakt": 0.8
    },
    {
      "name": "Bağça (120)",
      "plan": 17.35,
      "fakt": 1.36
    },
    {
      "name": "Bağça (100)",
      "plan": 10.82,
      "fakt": 0.92
    },
    {
      "name": "İnzibati bina",
      "plan": 11.85,
      "fakt": 0.55
    },
    {
      "name": "Tibb məntəqəsi",
      "plan": 10.14,
      "fakt": 0.88
    },
    {
      "name": "Qəbiristanlıq",
      "plan": 4.48,
      "fakt": 0
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
      "plan": 44.96,
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
      "date": "21.05.2026",
      "fakt": 26.05
    },
    {
      "date": "04.06.2026",
      "fakt": 31.08
    },
    {
      "date": "11.06.2026",
      "fakt": 31.52
    }
  ],
  "trendNote": "Ümumi icra (fakt %). 04.06 dəyəri kənarlaşma və plan interpolyasiyasından çıxarılmışdır."
};
window.DASH.workItems = {
  "lots": [
    {
      "id": "cemi",
      "name": "Cəmi (851 ev)",
      "ev": 851,
      "items": [
        {
          "name": "Qaba işlər — aşağı səviyyə",
          "fakt": 92.2,
          "plan": 98.1
        },
        {
          "name": "Qaba işlər — yuxarı səviyyə",
          "fakt": 53.2,
          "plan": 57
        },
        {
          "name": "Dam örtüyü",
          "fakt": 4.7,
          "plan": 20
        },
        {
          "name": "Hörgü",
          "fakt": 28.4,
          "plan": 40.6
        },
        {
          "name": "Divar bəzəyi",
          "fakt": 0,
          "plan": 8.4
        },
        {
          "name": "Tavan bəzəyi",
          "fakt": 0,
          "plan": 10.3
        },
        {
          "name": "Döşəmə bəzəyi",
          "fakt": 0,
          "plan": 11.2
        },
        {
          "name": "Pəncərə və qapılar",
          "fakt": 7.9,
          "plan": 52.2
        },
        {
          "name": "Mebellənmə və tamamlama",
          "fakt": 0,
          "plan": 0
        },
        {
          "name": "Elektrik təchizatı",
          "fakt": 13.6,
          "plan": 30.8
        },
        {
          "name": "Su və kanalizasiya",
          "fakt": 8,
          "plan": 48
        },
        {
          "name": "Ventilyasiya",
          "fakt": 0,
          "plan": 24.4
        },
        {
          "name": "Günəş panelləri",
          "fakt": 0,
          "plan": 0.4
        },
        {
          "name": "Qaz təchizatı",
          "fakt": 0,
          "plan": 0
        },
        {
          "name": "Xarici bəzək (fasad)",
          "fakt": 0,
          "plan": 5.6
        },
        {
          "name": "Təsərrüfat tikililəri",
          "fakt": 0,
          "plan": 59
        }
      ]
    },
    {
      "id": "lot1",
      "name": "Lot 1 (150 ev)",
      "ev": 150,
      "items": [
        {
          "name": "Qaba işlər — aşağı səviyyə",
          "fakt": 98.3,
          "plan": 100
        },
        {
          "name": "Qaba işlər — yuxarı səviyyə",
          "fakt": 86.1,
          "plan": 91.7
        },
        {
          "name": "Dam örtüyü",
          "fakt": 26.8,
          "plan": 33.7
        },
        {
          "name": "Hörgü",
          "fakt": 45.8,
          "plan": 76.2
        },
        {
          "name": "Divar bəzəyi",
          "fakt": 0,
          "plan": 26.6
        },
        {
          "name": "Tavan bəzəyi",
          "fakt": 0,
          "plan": 29.3
        },
        {
          "name": "Döşəmə bəzəyi",
          "fakt": 0,
          "plan": 36.4
        },
        {
          "name": "Pəncərə və qapılar",
          "fakt": 11.7,
          "plan": 82.6
        },
        {
          "name": "Mebellənmə və tamamlama",
          "fakt": 0,
          "plan": 0
        },
        {
          "name": "Elektrik təchizatı",
          "fakt": 32.6,
          "plan": 62.6
        },
        {
          "name": "Su və kanalizasiya",
          "fakt": 21.2,
          "plan": 89.1
        },
        {
          "name": "Ventilyasiya",
          "fakt": 0,
          "plan": 42
        },
        {
          "name": "Günəş panelləri",
          "fakt": 0,
          "plan": 0
        },
        {
          "name": "Qaz təchizatı",
          "fakt": 0,
          "plan": 0
        },
        {
          "name": "Xarici bəzək (fasad)",
          "fakt": 0,
          "plan": 9.4
        },
        {
          "name": "Təsərrüfat tikililəri",
          "fakt": 0,
          "plan": 59.7
        }
      ]
    },
    {
      "id": "lot2",
      "name": "Lot 2 (200 ev)",
      "ev": 200,
      "items": [
        {
          "name": "Qaba işlər — aşağı səviyyə",
          "fakt": 93.8,
          "plan": 98.9
        },
        {
          "name": "Qaba işlər — yuxarı səviyyə",
          "fakt": 68.5,
          "plan": 65
        },
        {
          "name": "Dam örtüyü",
          "fakt": 0,
          "plan": 40.5
        },
        {
          "name": "Hörgü",
          "fakt": 37.1,
          "plan": 53.1
        },
        {
          "name": "Divar bəzəyi",
          "fakt": 0,
          "plan": 10.2
        },
        {
          "name": "Tavan bəzəyi",
          "fakt": 0,
          "plan": 13.6
        },
        {
          "name": "Döşəmə bəzəyi",
          "fakt": 0,
          "plan": 13.5
        },
        {
          "name": "Pəncərə və qapılar",
          "fakt": 12.6,
          "plan": 51.7
        },
        {
          "name": "Mebellənmə və tamamlama",
          "fakt": 0,
          "plan": 0
        },
        {
          "name": "Elektrik təchizatı",
          "fakt": 15.7,
          "plan": 42.9
        },
        {
          "name": "Su və kanalizasiya",
          "fakt": 8.9,
          "plan": 63.7
        },
        {
          "name": "Ventilyasiya",
          "fakt": 0,
          "plan": 40.9
        },
        {
          "name": "Günəş panelləri",
          "fakt": 0,
          "plan": 1.8
        },
        {
          "name": "Qaz təchizatı",
          "fakt": 0,
          "plan": 0
        },
        {
          "name": "Xarici bəzək (fasad)",
          "fakt": 0,
          "plan": 15.5
        },
        {
          "name": "Təsərrüfat tikililəri",
          "fakt": 0,
          "plan": 66.3
        }
      ]
    },
    {
      "id": "lot3",
      "name": "Lot 3 (205 ev)",
      "ev": 205,
      "items": [
        {
          "name": "Qaba işlər — aşağı səviyyə",
          "fakt": 90.9,
          "plan": 100
        },
        {
          "name": "Qaba işlər — yuxarı səviyyə",
          "fakt": 28.8,
          "plan": 44.3
        },
        {
          "name": "Dam örtüyü",
          "fakt": 0,
          "plan": 0
        },
        {
          "name": "Hörgü",
          "fakt": 18.7,
          "plan": 27.5
        },
        {
          "name": "Divar bəzəyi",
          "fakt": 0,
          "plan": 0
        },
        {
          "name": "Tavan bəzəyi",
          "fakt": 0,
          "plan": 0
        },
        {
          "name": "Döşəmə bəzəyi",
          "fakt": 0,
          "plan": 0
        },
        {
          "name": "Pəncərə və qapılar",
          "fakt": 11.9,
          "plan": 43.1
        },
        {
          "name": "Mebellənmə və tamamlama",
          "fakt": 0,
          "plan": 0
        },
        {
          "name": "Elektrik təchizatı",
          "fakt": 15.5,
          "plan": 18.6
        },
        {
          "name": "Su və kanalizasiya",
          "fakt": 7.8,
          "plan": 40
        },
        {
          "name": "Ventilyasiya",
          "fakt": 0,
          "plan": 18.6
        },
        {
          "name": "Günəş panelləri",
          "fakt": 0,
          "plan": 0
        },
        {
          "name": "Qaz təchizatı",
          "fakt": 0,
          "plan": 0
        },
        {
          "name": "Xarici bəzək (fasad)",
          "fakt": 0,
          "plan": 0
        },
        {
          "name": "Təsərrüfat tikililəri",
          "fakt": 0,
          "plan": 55.9
        }
      ]
    },
    {
      "id": "lot4",
      "name": "Lot 4 (296 ev)",
      "ev": 296,
      "items": [
        {
          "name": "Qaba işlər — aşağı səviyyə",
          "fakt": 88.8,
          "plan": 95.2
        },
        {
          "name": "Qaba işlər — yuxarı səviyyə",
          "fakt": 43.2,
          "plan": 42.8
        },
        {
          "name": "Dam örtüyü",
          "fakt": 0,
          "plan": 13
        },
        {
          "name": "Hörgü",
          "fakt": 20.4,
          "plan": 23.2
        },
        {
          "name": "Divar bəzəyi",
          "fakt": 0,
          "plan": 3.8
        },
        {
          "name": "Tavan bəzəyi",
          "fakt": 0,
          "plan": 5.6
        },
        {
          "name": "Döşəmə bəzəyi",
          "fakt": 0,
          "plan": 4.7
        },
        {
          "name": "Pəncərə və qapılar",
          "fakt": 0,
          "plan": 43.3
        },
        {
          "name": "Mebellənmə və tamamlama",
          "fakt": 0,
          "plan": 0
        },
        {
          "name": "Elektrik təchizatı",
          "fakt": 1.1,
          "plan": 15
        },
        {
          "name": "Su və kanalizasiya",
          "fakt": 0.8,
          "plan": 22
        },
        {
          "name": "Ventilyasiya",
          "fakt": 0,
          "plan": 8.4
        },
        {
          "name": "Günəş panelləri",
          "fakt": 0,
          "plan": 0
        },
        {
          "name": "Qaz təchizatı",
          "fakt": 0,
          "plan": 0
        },
        {
          "name": "Xarici bəzək (fasad)",
          "fakt": 0,
          "plan": 0.8
        },
        {
          "name": "Təsərrüfat tikililəri",
          "fakt": 0,
          "plan": 55.9
        }
      ]
    }
  ]
};
window.DASH.otherObjects = {
  "asOf": "23.04.2026",
  "contractNote": "Bu obyektlər üzrə tikinti müqaviləsi hələ bağlanmamışdır. Göstərilən rəqəmlər ən son mövcud qiymətləndirməyə əsaslanır və icra faktiki olaraq başlanğıc səviyyəsindədir.",
  "objects": [
    {
      "name": "Məktəb (840 yer)",
      "plan": 14.75,
      "fakt": 0.8,
      "status": "Müqavilə yoxdur"
    },
    {
      "name": "Bağça (120 yer)",
      "plan": 17.35,
      "fakt": 1.36,
      "status": "Müqavilə yoxdur"
    },
    {
      "name": "Bağça (100 yer)",
      "plan": 10.82,
      "fakt": 0.92,
      "status": "Müqavilə yoxdur"
    },
    {
      "name": "İnzibati bina",
      "plan": 11.85,
      "fakt": 0.55,
      "status": "Müqavilə yoxdur"
    },
    {
      "name": "Tibb məntəqəsi",
      "plan": 10.14,
      "fakt": 0.88,
      "status": "Müqavilə yoxdur"
    },
    {
      "name": "Qəbiristanlıq",
      "plan": 4.48,
      "fakt": 0,
      "status": "Müqavilə yoxdur"
    }
  ]
};
window.DASH.infrastructure = {
  "asOf": "11.06.2026",
  "overallFakt": 12.31,
  "overallPlan": 53.24,
  "items": [
    {
      "name": "Yollar və səkilər",
      "fakt": 19.18,
      "plan": 76
    },
    {
      "name": "Xarici su kanalizasiyası",
      "fakt": 17.68,
      "plan": 60.86
    },
    {
      "name": "Xarici su şəbəkəsi",
      "fakt": 0,
      "plan": 33.4
    },
    {
      "name": "Qaz təchizatı",
      "fakt": 0,
      "plan": 2.19
    },
    {
      "name": "PTM və KTM",
      "fakt": 0,
      "plan": 1.51
    },
    {
      "name": "35 kV kabel xətti",
      "fakt": 0,
      "plan": 0
    },
    {
      "name": "0.4 kV kabel xətti",
      "fakt": 0,
      "plan": 0
    },
    {
      "name": "Rabitə şəbəkəsi",
      "fakt": 0,
      "plan": 0
    }
  ],
  "weeklyNote": "Sahədaxili kommunikasiya üzrə ümumi icra 11.06 tarixinə 12.31% təşkil edir və plandan 40.93% geri qalır. Son üç həftədə yalnız yollar və kanalizasiya xətti üzrə məhdud irəliləyiş qeydə alınmışdır. Su şəbəkəsi, qaz, elektrik və rabitə şəbəkələri faktiki olaraq başlanılmamış vəziyyətdə qalır."
};
window.DASH.workforce = {
  "available": false,
  "period": "",
  "daily": [],
  "totalSeries": [],
  "machinery": [],
  "emptyNote": "İşçi heyəti və texnika üzrə gündəlik hesabat hələ bu hesabata əlavə edilməmişdir. Məlumat hazır olduqda bu bölmə avtomatik olaraq qrafikləri göstərəcək. Doldurmaq üçün data/08_workforce_machinery.js faylında available dəyərini true edin, daily massivinə hər gün üçün {date, sahe, texniki, idari} yazın, machinery massivinə isə {name, count} dəyərlərini əlavə edin.",
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
      "plan": 44.96,
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
