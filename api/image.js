const SOURCES = {
  lula: 'https://upload.wikimedia.org/wikipedia/commons/3/3f/Foto_oficial_de_Luiz_In%C3%A1cio_Lula_da_Silva_%28rosto%29.jpg',
  flavio: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Fl%C3%A1vio_Bolsonaro_04_2026.jpg/500px-Fl%C3%A1vio_Bolsonaro_04_2026.jpg',
  renan: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Renan_Santos.jpg/500px-Renan_Santos.jpg',
  caiado: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/Foto_oficial_de_Ronaldo_Caiado.jpg/250px-Foto_oficial_de_Ronaldo_Caiado.jpg',
  zema: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/Romeu_Zema_2025_%28cropped%29.jpg/500px-Romeu_Zema_2025_%28cropped%29.jpg',
  cury: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/Augusto_Cury.jpg/500px-Augusto_Cury.jpg',
  daciolo: 'https://upload.wikimedia.org/wikipedia/commons/9/95/Cabo_Daciolo_em_2022.jpg'
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

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);

  try {
    const upstream = await fetch(source, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Brasil-Pesquisa-Eleitoral-TSE/1.0' }
    });
    if (!upstream.ok) throw new Error(`upstream ${upstream.status}`);

    const contentType = upstream.headers.get('content-type') || 'image/jpeg';
    const buffer = Buffer.from(await upstream.arrayBuffer());
    console.info(`[candidate-photo] ${id} upstream ${contentType} ${buffer.length} bytes`);

    res.statusCode = 200;
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=2592000, stale-while-revalidate=604800');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    return res.end(buffer);
  } catch (error) {
    console.warn(`[candidate-photo] ${id} fallback ${error?.name || 'Error'} ${error?.message || ''}`);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=3600');
    return res.end(fallbackSvg(id));
  } finally {
    clearTimeout(timeout);
  }
};