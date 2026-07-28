function initialsSvg(name) {
  const safeName = String(name || 'Candidato').trim();
  const initials = safeName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .replace(/[^A-ZÀ-Ü0-9]/g, '') || 'C';

  const escaped = safeName
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 560" role="img" aria-label="Foto ainda não disponível para ${escaped}">
    <rect width="480" height="560" fill="#0b1a28"/>
    <circle cx="240" cy="190" r="105" fill="#385268"/>
    <path d="M58 560c16-151 84-232 182-232s166 81 182 232" fill="#385268"/>
    <rect x="0" y="455" width="480" height="105" fill="#07121d"/>
    <text x="240" y="515" text-anchor="middle" fill="#eef4f8" font-family="Arial, sans-serif" font-size="54" font-weight="700">${initials}</text>
  </svg>`;
}

function sendFallback(res, name, maxAge = 3600) {
  res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
  res.setHeader('Cache-Control', `public, s-maxage=${maxAge}, stale-while-revalidate=86400`);
  return res.status(200).send(initialsSvg(name));
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
    return sendFallback(res, name);
  }

  const detailUrl = `https://divulgacandcontas.tse.jus.br/divulga/rest/v1/candidatura/buscar/2026/${encodeURIComponent(uf)}/${encodeURIComponent(election)}/candidato/${encodeURIComponent(id)}`;

  try {
    const detailResponse = await fetch(detailUrl, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Pesquisas-Eleitorais-2026/4.0'
      },
      cache: 'no-store'
    });

    if (!detailResponse.ok) return sendFallback(res, name);

    const data = await detailResponse.json();
    const photoUrl = resolvePhotoUrl(data);
    if (!photoUrl) return sendFallback(res, name);

    const photoResponse = await fetch(photoUrl, {
      headers: { 'User-Agent': 'Pesquisas-Eleitorais-2026/4.0' },
      cache: 'no-store'
    });

    if (!photoResponse.ok) return sendFallback(res, name);

    const contentType = photoResponse.headers.get('content-type') || 'image/jpeg';
    const bytes = Buffer.from(await photoResponse.arrayBuffer());

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
    return res.status(200).send(bytes);
  } catch {
    return sendFallback(res, name);
  }
};
