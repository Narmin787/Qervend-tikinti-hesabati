// Vercel serverless function: publish the kommunal report by committing
// kommunal/report.json to GitHub in ONE atomic commit — Vercel's Git integration
// then redeploys. Password-gated. Does not touch any other file.
//
// Env: GITHUB_TOKEN, KOMMUNAL_PASSWORD (or DEPLOY_PASSWORD),
//      GITHUB_OWNER, GITHUB_REPO, GITHUB_BRANCH (optional)

const OWNER  = process.env.GITHUB_OWNER  || 'Narmin787';
const REPO   = process.env.GITHUB_REPO   || 'Qervend-tikinti-hesabati';
const BRANCH = process.env.GITHUB_BRANCH || 'main';
const PATH   = 'kommunal/report.json';

async function gh(path, opts = {}) {
  return fetch(`https://api.github.com${path}`, {
    ...opts,
    headers: {
      'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  if (!process.env.GITHUB_TOKEN) return res.status(500).json({ error: 'GITHUB_TOKEN təyin edilməyib.' });
  const pass = process.env.KOMMUNAL_PASSWORD || process.env.DEPLOY_PASSWORD;

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  const { password, data } = body || {};
  if (pass && password !== pass) return res.status(401).json({ error: 'Yanlış parol.' });
  if (!data || typeof data !== 'object') return res.status(400).json({ error: 'Məlumat tələb olunur.' });

  const content = JSON.stringify(data, null, 2) + '\n';
  const b64 = Buffer.from(content, 'utf8').toString('base64');

  try {
    // atomic commit via the Git Data API (blob -> tree -> commit -> update ref)
    const ref = await gh(`/repos/${OWNER}/${REPO}/git/ref/heads/${encodeURIComponent(BRANCH)}`);
    if (!ref.ok) throw new Error(`ref: ${ref.status}`);
    const headSha = (await ref.json()).object.sha;
    const baseTree = (await (await gh(`/repos/${OWNER}/${REPO}/git/commits/${headSha}`)).json()).tree.sha;
    const blob = await gh(`/repos/${OWNER}/${REPO}/git/blobs`, { method: 'POST', body: JSON.stringify({ content: b64, encoding: 'base64' }) });
    if (!blob.ok) throw new Error(`blob: ${blob.status}`);
    const tree = await gh(`/repos/${OWNER}/${REPO}/git/trees`, {
      method: 'POST',
      body: JSON.stringify({ base_tree: baseTree, tree: [{ path: PATH, mode: '100644', type: 'blob', sha: (await blob.json()).sha }] }),
    });
    if (!tree.ok) throw new Error(`tree: ${tree.status}`);
    const commit = await gh(`/repos/${OWNER}/${REPO}/git/commits`, {
      method: 'POST',
      body: JSON.stringify({ message: `Kommunal report: ${data.period?.label || ''} (via upload app)`, tree: (await tree.json()).sha, parents: [headSha] }),
    });
    if (!commit.ok) throw new Error(`commit: ${commit.status}`);
    const upd = await gh(`/repos/${OWNER}/${REPO}/git/refs/heads/${encodeURIComponent(BRANCH)}`, {
      method: 'PATCH', body: JSON.stringify({ sha: (await commit.json()).sha }),
    });
    if (!upd.ok) throw new Error(`update ref: ${upd.status}`);

    return res.status(200).json({
      ok: true,
      url: 'https://qervend-tikinti-hesabati.vercel.app/kommunalhesabat/',
      message: 'Dərc edildi. Vercel 1-3 dəqiqəyə yeni versiyanı yayımlayacaq.',
    });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
}
