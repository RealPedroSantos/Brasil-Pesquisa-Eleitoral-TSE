const DATASET_URL = 'https://cdn.tse.jus.br/estatistica/sead/odsele/pesquisa_eleitoral/pesquisa_eleitoral_2026.zip';
const PORTAL_URL = 'https://dadosabertos.tse.jus.br/dataset/pesquisas-eleitorais-2026';

module.exports = async function handler(req, res) {
  try {
    const response = await fetch(DATASET_URL, {
      method: 'HEAD',
      headers: { 'User-Agent': 'Brasil-Pesquisa-Eleitoral-TSE/1.0' },
      cache: 'no-store'
    });

    if (!response.ok) throw new Error(`TSE respondeu ${response.status}`);

    const lastModified = response.headers.get('last-modified');
    const etag = response.headers.get('etag');
    const contentLength = response.headers.get('content-length');
    const fingerprint = [lastModified, etag, contentLength].filter(Boolean).join('|');

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    return res.status(200).json({
      ok: true,
      source: 'Portal de Dados Abertos do TSE',
      dataset: 'Pesquisas Eleitorais 2026',
      frequency: 'diária',
      checkedAt: new Date().toISOString(),
      lastModified,
      etag,
      contentLength: contentLength ? Number(contentLength) : null,
      fingerprint,
      dataUrl: DATASET_URL,
      portalUrl: PORTAL_URL,
      scope: 'registros e metadados oficiais; percentuais dependem dos relatórios dos institutos'
    });
  } catch (error) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(503).json({
      ok: false,
      checkedAt: new Date().toISOString(),
      error: 'Não foi possível consultar o arquivo oficial do TSE neste momento.'
    });
  }
};