/* config.js — Tema, etiketlər və insight qaydaları (bütün şəhərlər üçün eyni).
   Avtomatik yaradılıb — əl ilə redaktə etmək əvəzinə Excel şablonundan istifadə edin. */
window.DASH = window.DASH || {};
window.DASH.theme = {
  "colors": {
    "plan": "#7FB3E3",
    "fakt": "#EF6F6C",
    "good": "#1FA67E",
    "warn": "#F2A93B",
    "risk": "#E0483D",
    "violet": "#7C5CE6",
    "blue": "#3B9BE8",
    "orange": "#F2A93B",
    "teal": "#1FA67E",
    "red": "#E0483D",
    "ink": "#1F2440",
    "muted": "#6B7280",
    "faint": "#9AA1AB",
    "grid": "#EEF1F5",
    "cardBorder": "#E6E9EF",
    "wfSahe": "#7C5CE6",
    "wfTexniki": "#F2A93B",
    "wfIdari": "#3B9BE8"
  },
  "completion": {
    "greenMin": 90,
    "orangeMin": 50
  },
  "compliance": {
    "greenMin": 90,
    "yellowMin": 75
  },
  "deviationAheadEps": 0.5,
  "trendStates": {
    "qabaqda": {
      "label": "Qabaqda",
      "dot": "good"
    },
    "plan": {
      "label": "Plan üzrə",
      "dot": "good"
    },
    "suretlenir": {
      "label": "Sürətlənir",
      "dot": "good"
    },
    "sicrayis": {
      "label": "Sıçrayış",
      "dot": "good"
    },
    "ela": {
      "label": "Əla",
      "dot": "good"
    },
    "yaxin": {
      "label": "Yaxın",
      "dot": "warn"
    },
    "normal": {
      "label": "Normal",
      "dot": "warn"
    },
    "yavas": {
      "label": "Yavaş",
      "dot": "risk"
    },
    "cox_yavas": {
      "label": "Çox yavaş",
      "dot": "risk"
    }
  }
};
window.DASH.labels = {
  "sections": {
    "s2": "",
    "s3": "Tikinti üzrə planlaşdırılan və faktiki icra faizi",
    "s4": "Evlərin tikinti gedişatı (paket üzrə)",
    "s5": "Paketlər üzrə görülən işlər",
    "s6": "Digər obyektlərin vəziyyəti",
    "s7": "Paketlər üzrə sahədaxili kommunikasiya işləri",
    "s8": "İşçi heyəti və texnika",
    "s9": "Həftəlik dəyişiklik analizi (28.05 → 04.06 → 11.06)",
    "s10": "Təkliflər, risklər və analiz"
  },
  "charts": {
    "overallBar": "Bütün Obyektlər — Plan vs Fakt (%)",
    "overallDev": "Plandan kənarlaşma faizi",
    "pkgBar": "Paketlər Üzrə Plan vs Fakt (%)",
    "pkgTrend": "Keçən həftələrə nisbətən ümumi icra trendi",
    "workItems": "İş Maddələri Üzrə Tamamlanma",
    "otherBar": "Obyektlər — Plan vs Fakt (%)",
    "otherGap": "Tamamlanma Boşluğu (Plan − Fakt, %)",
    "infra": "İnfrastruktur İcrası (%) — 11.06.2026",
    "wfDaily": "Personal Kateqoriyaları (gündəlik)",
    "wfTotal": "Ümumi Personal Sayı",
    "machinery": "Texnika Tərkibi",
    "velDev": "Son həftələr tikinti gedişatının icrasında müşahidə olunan gecikmə faizi",
    "velTempo": "Həftəlik Tempo — Tələb vs Faktiki (%/həftə)",
    "velCompliance": "Sürət Göstəricisi — Plana Uyğunluq (%)"
  },
  "legend": {
    "plan": "Plan %",
    "fakt": "Fakt %"
  },
  "table": {
    "headers": [
      "Obyekt",
      "Plan %",
      "Fakt %",
      "Fərq",
      "Tələb (%/hft)",
      "Faktiki (%/hft)",
      "Uyğunluq",
      "Trend"
    ],
    "tips": [
      "",
      "Cədvəl kəsim tarixinə plan üzrə tamamlanma",
      "Faktiki tamamlanma",
      "Fakt mənfi Plan",
      "Bitməyə qədər həftəlik tələb olunan tempo: (100−Fakt)/qalan həftə",
      "Son ölçülən dövrdə real həftəlik tempo",
      "Faktiki tempo bölünür tələb olunan tempoya",
      "Kənarlaşma istiqaməti və uyğunluq əsasında"
    ]
  },
  "footer": {
    "sources": "Mənbə: Hesabat icmalı — Ağdam rayonu Qərvənd kəndi (11.06.2026) | QRVND_Upd Primavera cədvəli (11.06.2026) | Həftəlik Sürət Analizi (11.06.2026) | İMA Energy MMC",
    "prepared": "Hazırlanma tarixi: 17.06.2026"
  }
};
window.DASH.insightsConfig = {
  "thresholds": {
    "criticalDeviation": -15,
    "attentionDeviation": -8,
    "stagnantFaktMax": 1,
    "deltaWorseningMin": 0.3,
    "goodCompliance": 80,
    "strongComplianceFakti": 2,
    "structureAheadMin": 70
  },
  "pinned": [],
  "note": "Bu bölmədəki şərhlər data/09, data/07, data/03 fayllarındakı rəqəmlərdən qaydalar əsasında avtomatik yaradılır. Sabit (əl ilə yazılmış) şərh əlavə etmək üçün pinned massivinə {category, title, body} obyekti yazın. category: kritik | diqqet | analiz | musbet."
};
