// Converts a filled Excel workbook into a city's data.js. (No AI — deterministic.)
// Usage: node scripts/xlsx-to-data.mjs <in.xlsx> <city>
import fs from 'node:fs';
import { workbookToData } from './lib/schema.mjs';

const inFile = process.argv[2];
const city = process.argv[3];
if (!inFile || !city) { console.error('Usage: node scripts/xlsx-to-data.mjs <in.xlsx> <city>'); process.exit(1); }

const data = await workbookToData(inFile);
const keys = ['meta','kpi','overall','packages','workItems','otherObjects','infrastructure','workforce','velocity'];
let out = `/* data.js — ${data.meta.village || city} layihə rəqəmləri.\n   Excel şablonundan avtomatik yaradılıb (${new Date().toISOString().slice(0,10)}). */\n`;
out += `window.DASH = window.DASH || {};\n`;
for (const k of keys) out += `window.DASH.${k} = ${JSON.stringify(data[k], null, 2)};\n`;

fs.mkdirSync(`cities/${city}`, { recursive: true });
fs.writeFileSync(`cities/${city}/data.js`, out);
console.log(`Wrote cities/${city}/data.js`);
