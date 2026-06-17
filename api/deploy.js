// Vercel serverless function: commits a generated report to GitHub, which then
// triggers Vercel's auto-deploy. Gated by a password so the hidden app URL alone
// cannot push to the repo.
//
// Required Vercel environment variables:
//   GITHUB_TOKEN     - fine-grained PAT with Contents: read/write on this repo
//   DEPLOY_PASSWORD  - shared secret the app must send
//   (optional) GITHUB_OWNER, GITHUB_REPO, GITHUB_BRANCH
const OWNER  = process.env.GITHUB_OWNER  || 'Narmin787';
const REPO   = process.env.GITHUB_REPO   || 'Qervend-tikinti-hesabati';
const BRANCH = process.env.GITHUB_BRANCH || 'main';

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

async function putFile(path, base64Content, message) {
  // Look up existing sha (needed to update)
  let sha;
  const cur = await gh(`/repos/${OWNER}/${REPO}/contents/${encodeURIComponent(path).replace(/%2F/g,'/')}?ref=${BRANCH}`);
  if (cur.status === 200) sha = (await cur.json()).sha;
  const res = await gh(`/repos/${OWNER}/${REPO}/contents/${encodeURIComponent(path).replace(/%2F/g,'/')}`, {
    method: 'PUT',
    body: JSON.stringify({ message, content: base64Content, branch: BRANCH, ...(sha ? { sha } : {}) }),
  });
  if (!res.ok) throw new Error(`${path}: ${res.status} ${(await res.text()).slice(0,200)}`);
  return res.json();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  if (!process.env.GITHUB_TOKEN || !process.env.DEPLOY_PASSWORD)
    return res.status(500).json({ error: 'Server not configured: set GITHUB_TOKEN and DEPLOY_PASSWORD env vars.' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  const { password, cityName, dataJs, xlsxBase64, pdfBase64 } = body || {};

  if (password !== process.env.DEPLOY_PASSWORD) return res.status(401).json({ error: 'Yanlış parol.' });
  const slug = slugify(cityName);
  if (!slug) return res.status(400).json({ error: 'Şəhər adı tələb olunur.' });
  if (!dataJs || !xlsxBase64) return res.status(400).json({ error: 'data.js və xlsx tələb olunur.' });

  try {
    const b64 = s => Buffer.from(s, 'utf8').toString('base64');
    const msg = `Report: ${cityName} (via builder app)`;
    await putFile(`cities/${slug}/data.js`, b64(dataJs), msg);
    await putFile(`cities/${slug}/source.xlsx`, xlsxBase64, msg);
    if (pdfBase64) await putFile(`cities/${slug}/source.pdf`, pdfBase64, msg);
    return res.status(200).json({
      ok: true, slug,
      url: `https://qervend-tikinti-hesabati.vercel.app/${slug}/`,
      message: 'GitHub-a göndərildi. Vercel 1-5 dəqiqəyə dərc edəcək.',
    });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
}
