const PORTRAIT_TITLES = new Map([
  ['ratinho junior', 'Ratinho Júnior'],
  ['tarcisio de freitas', 'Tarcísio de Freitas'],
  ['aecio neves', 'Aécio Neves'],
  ['samara martins', 'File:2022 SAMARA MARTINS CANDIDATO VICE-PRESIDENTE TSE (280001602703).jpg'],
  ['joaquim barbosa', 'Joaquim Barbosa'],
  ['rui costa pimenta', 'Rui Costa Pimenta'],
  ['michelle bolsonaro', 'Michelle Bolsonaro'],
  ['jair bolsonaro', 'Jair Bolsonaro']
]);

function normalizeName(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

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

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 560" role="img" aria-label="Foto pública ainda não localizada para ${escaped}">
    <rect width="480" height="560" fill="#0b1a28"/>
    <circle cx="240" cy="190" r="105" fill="#385268"/>
    <path d="M58 560c16-151 84-232 182-232s166 81 182 232" fill="#385268"/>
    <rect x="0" y="455" width="480" height="105" fill="#07121d"/>
    <text x="240" y="515" text-anchor="middle" fill="#eef4f8" font-family="Arial, sans-serif" font-size="54" font-weight="700">${initials}</text>
  </svg>`;
}

function sendFallback(res, name) {
  res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  return res.status(200).send(initialsSvg(name));
}

module.exports = async function handler(req, res) {
  const name = String(req.query.name || 'Candidato');
  const requestedTitle = String(req.query.wiki || '').trim();
  const title = requestedTitle || PORTRAIT_TITLES.get(normalizeName(name)) || name.trim();

  try {
    const params = new URLSearchParams({
      action: 'query',
      prop: 'pageimages',
      piprop: 'thumbnail',
      pithumbsize: '700',
      redirects: '1',
      format: 'json',
      formatversion: '2',
      titles: title
    });

    const response = await fetch(`https://pt.wikipedia.org/w/api.php?${params.toString()}`, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Pesquisas-Eleitorais-2026/4.1 (painel informativo)'
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(6000)
    });

    if (!response.ok) return sendFallback(res, name);

    const data = await response.json();
    const page = data?.query?.pages?.[0];
    const source = page?.thumbnail?.source;
    if (!source) return sendFallback(res, name);

    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
    return res.redirect(302, source);
  } catch {
    return sendFallback(res, name);
  }
};