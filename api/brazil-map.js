const MAP_SOURCE = 'https://geo.infrasa.gov.br/server/rest/services/Hosted/Unidades_da_Federa%C3%A7%C3%A3o_Brasileira/FeatureServer/0/query?where=1%3D1&outFields=sigla%2Cnomeabrev&returnGeometry=true&outSR=4326&f=geojson';

module.exports = async function handler(req, res) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const upstream = await fetch(MAP_SOURCE, {
      signal: controller.signal,
      headers: {
        Accept: 'application/geo+json, application/json',
        'User-Agent': 'Brasil-Pesquisa-Eleitoral-TSE/1.0'
      }
    });

    if (!upstream.ok) throw new Error(`IBGE map source returned ${upstream.status}`);

    const geojson = await upstream.json();
    if (geojson?.type !== 'FeatureCollection' || !Array.isArray(geojson.features) || geojson.features.length < 27) {
      throw new Error('Invalid Brazilian federation map payload');
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/geo+json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=2592000, stale-while-revalidate=604800');
    res.setHeader('X-Map-Source', 'IBGE');
    return res.end(JSON.stringify(geojson));
  } catch (error) {
    console.error('[brazil-map]', error?.name || 'Error', error?.message || 'Unknown error');
    res.statusCode = 502;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    return res.end(JSON.stringify({ ok: false, error: 'Não foi possível carregar a malha oficial do Brasil.' }));
  } finally {
    clearTimeout(timeout);
  }
};
