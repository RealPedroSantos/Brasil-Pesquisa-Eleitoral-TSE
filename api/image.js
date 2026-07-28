const SOURCES = {
  lula: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/17.06.2025%20-%20Foto%20Oficial%20(54596867483).jpg?width=640',
  flavio: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Fl%C3%A1vio%20Bolsonaro%2004%202026.jpg?width=640',
  renan: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Renan%20Santos.jpg?width=640',
  caiado: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Foto%20oficial%20de%20Ronaldo%20Caiado.jpg?width=640',
  zema: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Romeu%20Zema%202025%20(cropped).jpg?width=640',
  cury: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Augusto%20Cury.jpg?width=640',
  daciolo: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Cabo%20Daciolo%20em%202022.jpg?width=640'
};

const INITIALS = { lula:'LU', flavio:'FB', renan:'RS', caiado:'RC', zema:'RZ', cury:'AC', daciolo:'CD' };

function fallbackSvg(id) {
  const initials = INITIALS[id] || '?';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="640" viewBox="0 0 640 640"><rect width="640" height="640" fill="#10243a"/><circle cx="320" cy="320" r="250" fill="#17324d" stroke="#4aa8ff" stroke-width="18"/><text x="320" y="355" text-anchor="middle" font-family="Arial,sans-serif" font-size="150" font-weight="700" fill="#f4f7fb">${initials}</text></svg>`;
}

module.exports = async function handler(req, res) {
  const id = String(req.query.id || '').toLowerCase();
  const source = SOURCES[id];

  if (!source) {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
    return res.end(fallbackSvg(id));
  }

  try {
    const upstream = await fetch(source, {
      redirect: 'follow',
      headers: { 'User-Agent': 'Brasil-Pesquisa-Eleitoral-TSE/1.0 (public visualization)' }
    });
    if (!upstream.ok) throw new Error(`upstream ${upstream.status}`);

    const contentType = upstream.headers.get('content-type') || 'image/jpeg';
    const buffer = Buffer.from(await upstream.arrayBuffer());
    res.statusCode = 200;
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=2592000, stale-while-revalidate=604800');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    return res.end(buffer);
  } catch (error) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=3600');
    return res.end(fallbackSvg(id));
  }
};
