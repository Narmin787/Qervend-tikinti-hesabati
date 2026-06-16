// Splits extracted DASH into shared config (same for every city) and per-city data.
import fs from 'node:fs';
import { extractDASH } from './extract.mjs';

const CONFIG_KEYS = ['theme', 'labels', 'insightsConfig'];
const DATA_KEYS = ['meta','kpi','overall','packages','workItems','otherObjects','infrastructure','workforce','velocity'];

function emit(obj, keys, banner) {
  let out = `/* ${banner}\n   Avtomatik yaradılıb — əl ilə redaktə etmək əvəzinə Excel şablonundan istifadə edin. */\n`;
  out += `window.DASH = window.DASH || {};\n`;
  for (const k of keys) {
    if (obj[k] === undefined) continue;
    out += `window.DASH.${k} = ${JSON.stringify(obj[k], null, 2)};\n`;
  }
  return out;
}

const dash = extractDASH('index.html');
fs.writeFileSync('engine/config.js', emit(dash, CONFIG_KEYS, 'config.js — Tema, etiketlər və insight qaydaları (bütün şəhərlər üçün eyni).'));
fs.mkdirSync('cities/qervend', { recursive: true });
fs.writeFileSync('cities/qervend/data.js', emit(dash, DATA_KEYS, 'data.js — Qərvənd kəndi layihə rəqəmləri.'));
console.log('Wrote engine/config.js and cities/qervend/data.js');
