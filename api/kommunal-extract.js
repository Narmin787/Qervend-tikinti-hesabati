// Vercel serverless function: extract the kommunal weekly-report numbers from an
// uploaded PDF or Excel (sent as text) using the Anthropic API, returning JSON in
// the report's exact data shape. No password (one-click).
//
// Env: ANTHROPIC_API_KEY, ANTHROPIC_MODEL (optional, default claude-sonnet-4-6)

const SCHEMA = `{
  "title": string,                 // e.g. "Füzulidə kommunal yığımlara dair"
  "subtitle": string,              // e.g. "Həftəlik İcmal"
  "period": { "label": string, "previousLabel": string },  // "08.06–12.06.2026", "01.06–05.06"
  "month": string,                 // e.g. "İYUN 2026"
  "kpis": { "hotWaterStopped": number, "heatingRestored": number, "weeklyCollection": number, "nextCutoff": number },
  "changes": [ { "dir": "up"|"down", "text": string, "value": string } ],  // value already formatted, e.g. "−3641,45 AZN"
  "weeks": [ { "label": string, "collection": number|null, "hotWaterStopped": number|null, "contracts": number|null } ],
  "totals": { "collection": number, "hotWaterStopped": number, "contracts": number, "rangeLabel": string },
  "comparisonLabels": { "w1": string, "w2": string },
  "comparison": [ { "metric": string, "w1": number, "w2": number, "diff": number|null } ],
  "categories": [ { "name": string, "total": number, "noContract": number, "stopped": number, "restored": number, "nextCutoff": number, "collected": number } ],
  "categoryTotal": { "total": number, "noContract": number, "stopped": number, "restored": number, "nextCutoff": number, "collected": number },
  "preparedDate": string
}`;

const PROMPT = `You are extracting data for an Azerbaijani weekly communal-utility (isti su / istilik / yığım) report for a residential complex.
From the attached source document, extract the numbers and return ONLY a single JSON object that exactly matches this TypeScript-like schema (no markdown, no commentary):

${SCHEMA}

Rules:
- Numbers must be plain JSON numbers (use a dot decimal, e.g. 3977.85). Do NOT format them.
- "changes[].value" is the one field that stays a formatted display string (e.g. "−3641,45 AZN", "+7 mənzil").
- Keep all labels/text in Azerbaijani exactly as in the source.
- "weeks" lists every week of the month; weeks with no data yet → null values.
- If a value is genuinely absent, use null (numbers) or "" (strings). Never invent numbers.
- Return valid JSON only.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not set.' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  const { kind, base64, text } = body || {};
  if (!base64 && !text) return res.status(400).json({ error: 'A file is required.' });

  const content = [];
  if (kind === 'pdf' && base64) {
    content.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } });
  } else {
    content.push({ type: 'text', text: 'MƏNBƏ MƏLUMAT:\n' + (text || '') });
  }
  content.push({ type: 'text', text: PROMPT });

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
        max_tokens: 4000,
        messages: [{ role: 'user', content }],
      }),
    });
    if (!r.ok) return res.status(502).json({ error: 'Anthropic API: ' + r.status + ' ' + (await r.text()).slice(0, 300) });
    const j = await r.json();
    let out = (j.content || []).filter(c => c.type === 'text').map(c => c.text).join('');
    const m = out.match(/\{[\s\S]*\}/);          // strip any stray prose/markdown fences
    if (!m) return res.status(502).json({ error: 'The model did not return JSON.' });
    let data;
    try { data = JSON.parse(m[0]); } catch (e) { return res.status(502).json({ error: 'JSON parse: ' + e.message }); }
    return res.status(200).json({ ok: true, data });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
}
