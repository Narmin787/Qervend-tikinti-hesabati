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

// Commit several files in ONE atomic commit via the Git Data API. This avoids the
// partial/intermediate state (and multiple rebuilds) of committing files one-by-one,
// so a half-finished deploy can never leave a city's live report broken.
async function commitFiles(branch, message, files) {
  const refRes = await gh(`/repos/${OWNER}/${REPO}/git/ref/heads/${encodeURIComponent(branch)}`);
  if (!refRes.ok) throw new Error(`ref: ${refRes.status}`);
  const headSha = (await refRes.json()).object.sha;
  const commitRes = await gh(`/repos/${OWNER}/${REPO}/git/commits/${headSha}`);
  const baseTree = (await commitRes.json()).tree.sha;

  const tree = [];
  for (const f of files) {
    const blob = await gh(`/repos/${OWNER}/${REPO}/git/blobs`, {
      method: 'POST', body: JSON.stringify({ content: f.base64, encoding: 'base64' }),
    });
    if (!blob.ok) throw new Error(`blob ${f.path}: ${blob.status}`);
    tree.push({ path: f.path, mode: '100644', type: 'blob', sha: (await blob.json()).sha });
  }
  const treeRes = await gh(`/repos/${OWNER}/${REPO}/git/trees`, {
    method: 'POST', body: JSON.stringify({ base_tree: baseTree, tree }),
  });
  if (!treeRes.ok) throw new Error(`tree: ${treeRes.status} ${(await treeRes.text()).slice(0,120)}`);
  const newTree = (await treeRes.json()).sha;
  const mkCommit = await gh(`/repos/${OWNER}/${REPO}/git/commits`, {
    method: 'POST', body: JSON.stringify({ message, tree: newTree, parents: [headSha] }),
  });
  if (!mkCommit.ok) throw new Error(`commit: ${mkCommit.status}`);
  const newCommit = (await mkCommit.json()).sha;
  const upd = await gh(`/repos/${OWNER}/${REPO}/git/refs/heads/${encodeURIComponent(branch)}`, {
    method: 'PATCH', body: JSON.stringify({ sha: newCommit }),
  });
  if (!upd.ok) throw new Error(`update ref: ${upd.status}`);
}

// Best-effort: ask the Vercel API for the latest deployment of a branch and
// return its public URL. No-op (returns null) unless VERCEL_TOKEN is configured.
async function vercelPreviewUrl(branch) {
  const tok = process.env.VERCEL_TOKEN;
  const proj = process.env.VERCEL_PROJECT_ID || 'qervend-tikinti-hesabati';
  if (!tok) return null;
  try {
    const team = process.env.VERCEL_TEAM_ID ? `&teamId=${process.env.VERCEL_TEAM_ID}` : '';
    // give Vercel a moment to register the branch push, then poll a few times
    for (let i = 0; i < 6; i++) {
      const r = await fetch(`https://api.vercel.com/v6/deployments?projectId=${proj}&limit=5${team}`,
        { headers: { Authorization: `Bearer ${tok}` } });
      if (r.ok) {
        const ds = (await r.json()).deployments || [];
        const hit = ds.find(d => d.meta && d.meta.githubCommitRef === branch);
        if (hit && hit.url) return `https://${hit.url}`;
      }
      await new Promise(s => setTimeout(s, 2500));
    }
  } catch (_) { /* fall back to GitHub link */ }
  return null;
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
    const files = [
      { path: `cities/${slug}/data.js`, base64: b64(dataJs) },
      { path: `cities/${slug}/source.xlsx`, base64: xlsxBase64 },
    ];
    if (pdfBase64) files.push({ path: `cities/${slug}/source.pdf`, base64: pdfBase64 });
    await commitFiles(branch, msg, files);   // single atomic commit

    if (preview) {
      const github = `https://github.com/${OWNER}/${REPO}/tree/${branch}`;
      const previewUrl = await vercelPreviewUrl(branch);   // real URL if VERCEL_TOKEN is set
      await notify(`🔎 Preview report: ${cityName} → ${previewUrl || github}`);
      return res.status(200).json({
        ok: true, slug, branch,
        url: previewUrl || github,
        previewUrl: previewUrl || undefined,
        message: previewUrl
          ? `Önizləmə hazırdır (filial: ${branch}).`
          : `Önizləmə “${branch}” filialına göndərildi. Vercel preview deploy yaradır; bir-iki dəqiqəyə hazır olacaq.`,
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
