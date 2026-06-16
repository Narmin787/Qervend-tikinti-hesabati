// Extracts window.DASH.* objects from the original index.html (byte-accurate),
// by evaluating only the data <script> blocks in a sandbox.
import fs from 'node:fs';
import vm from 'node:vm';

export function extractDASH(htmlPath) {
  const html = fs.readFileSync(htmlPath, 'utf8');
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  // Only keep blocks that assign window.DASH.<key> = ... (the data/config blocks),
  // and skip the big ECharts/engine blocks.
  const dataBlocks = scripts.filter(s =>
    /window\.DASH\.\w+\s*=/.test(s) && !/echarts/i.test(s) && s.length < 200000
  );
  const sandbox = { window: { DASH: {} } };
  sandbox.window.DASH = sandbox.window.DASH || {};
  vm.createContext(sandbox);
  for (const block of dataBlocks) {
    vm.runInContext(block, sandbox);
  }
  return sandbox.window.DASH;
}

// Run standalone for a quick sanity print.
if (import.meta.url === `file://${process.argv[1]}`) {
  const dash = extractDASH(process.argv[2] || 'index.html');
  console.log('Keys:', Object.keys(dash).join(', '));
  console.log('meta.village:', dash.meta?.village);
  console.log('workItems lots:', dash.workItems?.lots?.length);
  console.log('velocity rows:', dash.velocity?.rows?.length);
}
