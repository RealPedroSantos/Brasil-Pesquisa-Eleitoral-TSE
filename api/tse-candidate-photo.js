function initialsRedirect(res, name) {
  const query = new URLSearchParams({ name: String(name || 'Candidato') });
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  return res.redirect(302, `/api/public-figure-photo?${query.toString()}`);
}

function resolvePhotoUrl(data) {
  const possible = [
    data?.fotoUrl,
    data?.urlFoto,
    data?.foto,
    data?.candidato?.fotoUrl,
    data?.candidato?.urlFoto
  ].find(Boolean);

  if (!possible) return '';
  if (/^https?:\/\//i.test(possible)) return possible;
  return new URL(possible, 'https://divulgacandcontas.tse.jus.br').toString();
}

module.exports = async function handler(req, res) {
  const uf = String(req.query.uf || '').toUpperCase();
  const election = String(req.query.election || '');
  const id = String(req.query.id || '');
  const name = String(req.query.name || 'Candidato');

  if (!/^[A-Z]{2}$/.test(uf) || !/^\d+$/.test(election) || !/^\d+$/.test(id)) {
    return initialsRedirect(res, name);
  }

  const detailUrl = `https://divulgacandcontas.tse.jus.br/divulga/rest/v1/candidatura/buscar/2026/${encodeURIComponent(uf)}/${encodeURIComponent(election)}/candidato/${encodeURIComponent(id)}`;

  try {
    const detailResponse = await fetch(detailUrl, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Pesquisas-Eleitorais-2026/4.2'
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(5000)
    });

    if (!detailResponse.ok) return initialsRedirect(res, name);

    const data = await detailResponse.json();
    const photoUrl = resolvePhotoUrl(data);
    if (!photoUrl) return initialsRedirect(res, name);

    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
    return res.redirect(302, photoUrl);
  } catch {
    return initialsRedirect(res, name);
  }
};
