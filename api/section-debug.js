const URL = 'https://resultados.tse.jus.br/oficial/ele2022/arquivo-urna/406/config/rj/rj-p000406-cs.json';

function describe(value, depth = 0) {
  if (depth > 4) return Array.isArray(value) ? `[array:${value.length}]` : typeof value;
  if (Array.isArray(value)) return { type: 'array', length: value.length, samples: value.slice(0, 2).map((item) => describe(item, depth + 1)) };
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value).slice(0, 16).map(([key, item]) => [key, describe(item, depth + 1)]));
}

module.exports = async function handler(req, res) {
  try {
    const response = await fetch(URL, { headers: { Accept: 'application/json', 'User-Agent': 'Brasil-Pesquisa-Eleitoral-TSE/2.0' } });
    if (!response.ok) throw new Error(`TSE ${response.status}`);
    const payload = await response.json();
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    return res.end(JSON.stringify({ ok: true, description: describe(payload) }));
  } catch (error) {
    res.statusCode = 502;
    return res.end(JSON.stringify({ ok: false, error: error.message }));
  }
};
