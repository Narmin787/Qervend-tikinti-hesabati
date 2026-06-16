// Builds engine/report.html: original skeleton + engine scripts, but with
// data/config externalized and ECharts loaded from CDN.
import fs from 'node:fs';

const lines = fs.readFileSync('index.html', 'utf8').split('\n');
const L = (a, b) => lines.slice(a - 1, b).join('\n'); // 1-based inclusive

// Part A: <!doctype> + head(css) + body skeleton, up to the line before <!-- KONFİG -->
const skeleton = L(1, 272);
// Part B: engine scripts (charts.js + insights + render). After the inlined ECharts block.
const engine = L(1337, 1960);
// Tail
const tail = L(1961, lines.length);

const includes = `
<!-- ============================================================
     KONFİQ + MƏLUMAT + KİTABXANA
     report.html bütün şəhərlər üçün eynidir. Hər şəhər üçün yalnız
     ./data.js dəyişir (Excel şablonundan avtomatik yaradılır).
     ============================================================ -->
<script src="https://cdn.jsdelivr.net/npm/echarts@5.5.1/dist/echarts.min.js"></script>
<script src="./config.js"></script>
<script src="./data.js"></script>
`;

// `engine` already contains its own <script>…</script> blocks (charts.js,
// insights, render), so it must NOT be wrapped in another <script>.
let html = [skeleton, includes, engine, tail].join('\n');

// --- Enhancement: optional source-PDF link in the footer (meta.sourcePdf) ---
html = html.replace(
  '.foot .prep{margin-top:4px; color:var(--faint)}',
  `.foot .prep{margin-top:4px; color:var(--faint)}
.foot .src-pdf{margin-bottom:8px}
.foot .src-pdf a{display:inline-block; padding:6px 12px; border:1px solid var(--border); border-radius:var(--radius-sm); color:var(--blue); text-decoration:none; font-weight:600}
.foot .src-pdf a:hover{background:var(--page)}`
);
html = html.replace(
  `  function renderFooter(){
    const fo=(L.footer)||{};
    $('footer').innerHTML = \`<div>\${esc(fo.sources||'')}</div><div class="prep">\${esc(fo.prepared||'')}</div>\`;
  }`,
  `  function renderFooter(){
    const fo=(L.footer)||{}; const pdf=(D.meta&&D.meta.sourcePdf)||'';
    const pdfLink = pdf
      ? \`<div class="src-pdf"><a href="\${esc(pdf)}" target="_blank" rel="noopener">📄 Mənbə sənədi (PDF)</a></div>\`
      : '';
    $('footer').innerHTML = \`\${pdfLink}<div>\${esc(fo.sources||'')}</div><div class="prep">\${esc(fo.prepared||'')}</div>\`;
  }`
);

if (!html.includes('src-pdf')) { console.error('WARN: footer/CSS enhancement did not apply'); process.exit(1); }
fs.writeFileSync('engine/report.html', html);
console.log('Wrote engine/report.html (' + html.length + ' bytes)');
