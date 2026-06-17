// Serializes a data object into a data.js file (window.DASH.*).
export function dataToJs(data, label) {
  const keys = ['meta','kpi','overall','packages','workItems','otherObjects','infrastructure','workforce','velocity','insightsPinned'];
  let out = `/* data.js — ${label}\n   Avtomatik yaradılıb (${new Date().toISOString().slice(0,10)}). Əl ilə redaktə etmək əvəzinə Excel şablonundan istifadə edin. */\n`;
  out += `window.DASH = window.DASH || {};\n`;
  for (const k of keys) if (data[k] !== undefined) out += `window.DASH.${k} = ${JSON.stringify(data[k], null, 2)};\n`;
  return out;
}
