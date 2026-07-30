const URL = 'https://resultados.tse.jus.br/oficial/ele2022/arquivo-urna/406/config/rj/rj-p000406-cs.json';

module.exports = async function handler(req, res) {
  try {
    const response = await fetch(URL, { headers: { Accept: 'application/json', 'User-Agent': 'Brasil-Pesquisa-Eleitoral-TSE/2.0' } });
    if (!response.ok) throw new Error(`TSE ${response.status}`);
    const payload = await response.json();
    const municipalities = payload?.abr?.[0]?.mu || [];
    const itaborai = municipalities.find((item) => String(item.cd) === '58378');
    const rio = municipalities.find((item) => String(item.cd) === '60011');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    return res.end(JSON.stringify({
      ok: true,
      itaborai,
      rioSample: rio ? { cd: rio.cd, nm: rio.nm, zones: (rio.zon || []).slice(0, 2) } : null
    }));
  } catch (error) {
    res.statusCode = 502;
    return res.end(JSON.stringify({ ok: false, error: error.message }));
  }
};
