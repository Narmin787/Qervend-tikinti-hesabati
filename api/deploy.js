// Vercel serverless function: commits a generated report to GitHub, which then
// triggers Vercel's auto-deploy. Gated by a password so the hidden app URL alone
// cannot push to the repo.
//
// Required Vercel environment variables:
//   GITHUB_TOKEN     - fine-grained PAT with Contents: read/write on this repo
//   DEPLOY_PASSWORD  - shared secret the app must send
//   (optional) GITHUB_OWNER, GITHUB_REPO, GITHUB_BRANCH
//   (optional) NOTIFY_WEBHOOK - URL that receives a POST {text} after a deploy
const OWNER  = process.env.GITHUB_OWNER  || 'Narmin787';
const REPO   = process.env.GITHUB_REPO   || 'Qervend-tikinti-hesabati';
const MAIN   = process.env.GITHUB_BRANCH || 'main';

const slugify = s => String(s || '').toLowerCase()
  .replace(/ə/g,'e').replace(/ç/g,'c').replace(/ğ/g,'g').replace(/ı/g,'i')
  .replace(/ö/g,'o').replace(/ş/g,'s').replace(/ü/g,'u')
  .normalize('NFD').replace(/[̀-ͯ]/g,'')
  .replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,40);

async function gh(path, opts = {}) {
  const res = await fetch(`https://api.github.com${path}`, {
    ...opts,
    headers: {
      'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
  });
  return res;
}

// Make sure `branch` exists; if not, create it from MAIN's current head.
async function ensureBranch(branch) {
  if (branch === MAIN) return;
  const ref = await gh(`/repos/${OWNER}/${REPO}/git/ref/heads/${encodeURIComponent(branch)}`);
  if (ref.status === 200) return;
  const main = await gh(`/repos/${OWNER}/${REPO}/git/ref/heads/${encodeURIComponent(MAIN)}`);
  if (!main.ok) throw new Error(`base branch lookup: ${main.status}`);
  const sha = (await main.json()).object.sha;
  const mk = await gh(`/repos/${OWNER}/${REPO}/git/refs`, {
    method: 'POST',
    body: JSON.stringify({ ref: `refs/heads/${branch}`, sha }),
  });
  if (!mk.ok && mk.status !== 422) throw new Error(`create branch: ${mk.status} ${(await mk.text()).slice(0,120)}`);
}

async function putFile(path, base64Content, message, branch) {
  const enc = encodeURIComponent(path).replace(/%2F/g, '/');
  let sha;
  const cur = await gh(`/repos/${OWNER}/${REPO}/contents/${enc}?ref=${encodeURIComponent(branch)}`);
  if (cur.status === 200) sha = (await cur.json()).sha;
  const res = await gh(`/repos/${OWNER}/${REPO}/contents/${enc}`, {
    method: 'PUT',
    body: JSON.stringify({ message, content: base64Content, branch, ...(sha ? { sha } : {}) }),
  });
  if (!res.ok) throw new Error(`${path}: ${res.status} ${(await res.text()).slice(0,200)}`);
  return res.json();
}

async function notify(text) {
  const url = process.env.NOTIFY_WEBHOOK;
  if (!url) return;
  try { await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) }); }
  catch (_) { /* best-effort */ }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  if (!process.env.GITHUB_TOKEN || !process.env.DEPLOY_PASSWORD)
    return res.status(500).json({ error: 'Server not configured: set GITHUB_TOKEN and DEPLOY_PASSWORD env vars.' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  const { password, cityName, dataJs, xlsxBase64, pdfBase64, mode } = body || {};

  if (password !== process.env.DEPLOY_PASSWORD) return res.status(401).json({ error: 'Yanlış parol.' });
  const slug = slugify(cityName);
  if (!slug) return res.status(400).json({ error: 'Şəhər adı tələb olunur.' });
  if (!dataJs || !xlsxBase64) return res.status(400).json({ error: 'data.js və xlsx tələb olunur.' });

  const preview = mode === 'preview';
  const branch = preview ? `report-preview/${slug}` : MAIN;

  try {
    await ensureBranch(branch);
    const b64 = s => Buffer.from(s, 'utf8').toString('base64');
    const msg = `Report: ${cityName} (via builder app${preview ? ', preview' : ''})`;
    await putFile(`cities/${slug}/data.js`, b64(dataJs), msg, branch);
    await putFile(`cities/${slug}/source.xlsx`, xlsxBase64, msg, branch);
    if (pdfBase64) await putFile(`cities/${slug}/source.pdf`, pdfBase64, msg, branch);

    if (preview) {
      const compare = `https://github.com/${OWNER}/${REPO}/tree/${branch}`;
      await notify(`🔎 Preview report: ${cityName} → branch ${branch}`);
      return res.status(200).json({
        ok: true, slug, branch,
        url: compare,
        message: `Önizləmə “${branch}” filialına göndərildi. Vercel filial üçün preview deploy yaradacaq; hazır olduqda production-a “Deploy” edin.`,
      });
    }

    const url = `https://qervend-tikinti-hesabati.vercel.app/${slug}/`;
    await notify(`✅ Report deployed: ${cityName} → ${url}`);
    return res.status(200).json({
      ok: true, slug, url,
      message: 'GitHub-a göndərildi. Vercel 1-5 dəqiqəyə dərc edəcək.',
    });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
}
