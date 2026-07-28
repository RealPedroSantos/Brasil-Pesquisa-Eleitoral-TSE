const TRUSTED_SOURCES = [
  {
    id: 'tse',
    name: 'TSE / PesqEle',
    kind: 'Fonte oficial',
    coverage: ['Nacional', 'Estadual', 'Municipal', 'Bairro'],
    url: 'https://dadosabertos.tse.jus.br/dataset/pesquisas-eleitorais-2026',
    description: 'Registro oficial, questionários, contratantes e detalhamento de município e bairro.',
    fetchUrl: null
  },
  {
    id: 'atlas',
    name: 'AtlasIntel',
    kind: 'Instituto — fonte primária',
    coverage: ['Nacional', 'Estadual', 'Municipal'],
    url: 'https://atlasintel.org/polls/exclusive-polls',
    description: 'Relatórios públicos nacionais, estaduais e levantamentos locais contratados por veículos regionais.',
    fetchUrl: 'https://atlasintel.org/polls/exclusive-polls'
  },
  {
    id: 'quaest',
    name: 'Quaest',
    kind: 'Instituto — fonte primária',
    coverage: ['Nacional', 'Estadual', 'Municipal'],
    url: 'https://quaest.com.br/categoria/analises-de-pesquisas/',
    description: 'Análises e relatórios eleitorais nacionais, estaduais e municipais.',
    fetchUrl: 'https://quaest.com.br/categoria/analises-de-pesquisas/'
  },
  {
    id: 'parana',
    name: 'Paraná Pesquisas',
    kind: 'Instituto — fonte primária',
    coverage: ['Nacional', 'Estadual', 'Municipal'],
    url: 'https://paranapesquisas.com.br/pesquisas/',
    description: 'Arquivo público com levantamentos registrados, incluindo estados e municípios.',
    fetchUrl: 'https://paranapesquisas.com.br/pesquisas/'
  },
  {
    id: 'gerp',
    name: 'GERP',
    kind: 'Instituto — fonte primária',
    coverage: ['Nacional', 'Estadual', 'Municipal'],
    url: 'https://www.gerp.com.br/eleitoral.html',
    description: 'Pesquisas eleitorais e políticas com publicações nacionais e regionais.',
    fetchUrl: 'https://www.gerp.com.br/eleitoral.html'
  },
  {
    id: 'datafolha',
    name: 'Datafolha',
    kind: 'Instituto — fonte primária',
    coverage: ['Nacional', 'Estadual', 'Municipal'],
    url: 'https://www1.folha.uol.com.br/folha-topicos/datafolha/',
    description: 'Resultados e cobertura editorial dos levantamentos do Datafolha.',
    fetchUrl: 'https://www1.folha.uol.com.br/folha-topicos/datafolha/'
  }
];

const KEYWORDS = /pesquisa|eleitoral|eleiç|prefeit|município|municipio|cidade|bairro|governador|governo|presidente|senador|voto|intenção/i;
const IGNORE = /login|contato|sobre|privacidade|cookie|facebook|instagram|linkedin|youtube|whatsapp|ver todas|view all|download$/i;

function decodeEntities(value) {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

function stripHtml(value) {
  return decodeEntities(value.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

function absoluteUrl(base, href) {
  try { return new URL(href, base).toString(); } catch { return null; }
}

function classify(title) {
  const text = title.toLowerCase();
  if (/bairro|distrito|zona da cidade|região administrativa/.test(text)) return 'Bairro';
  if (/município|municipio|prefeit|cidade|capital|curitiba|recife|salvador|fortaleza|manaus|belém|belem|goiânia|goiania|itaboraí|itaborai|niterói|niteroi/.test(text)) return 'Municipal';
  if (/estado|governador|governo de |rio de janeiro|são paulo|sao paulo|minas gerais|bahia|paraná|parana|pernambuco|ceará|ceara|tocantins|piauí|piaui|goiás|goias|amazonas|maranhão|maranhao|santa catarina|rio grande do norte|rio grande do sul|espírito santo|espirito santo/.test(text)) return 'Estadual';
  return 'Nacional';
}

function extractLinks(html, source) {
  const items = [];
  const seen = new Set();
  const anchorRegex = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = anchorRegex.exec(html)) && items.length < 12) {
    const title = stripHtml(match[2]);
    if (title.length < 18 || title.length > 220 || !KEYWORDS.test(title) || IGNORE.test(title)) continue;
    const url = absoluteUrl(source.fetchUrl, match[1]);
    if (!url || seen.has(url) || !/^https?:/.test(url)) continue;
    seen.add(url);
    items.push({
      title,
      url,
      source: source.name,
      sourceId: source.id,
      scope: classify(title),
      verifiedPrimarySource: true
    });
  }
  return items;
}

async function fetchSource(source) {
  if (!source.fetchUrl) return { sourceId: source.id, online: true, items: [] };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5500);
  try {
    const response = await fetch(source.fetchUrl, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Brasil-Pesquisa-Eleitoral-TSE/2.0 (+https://brasil-pesquisa-eleitoral-tse.vercel.app)' }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const html = await response.text();
    return { sourceId: source.id, online: true, items: extractLinks(html, source) };
  } catch {
    return { sourceId: source.id, online: false, items: [] };
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = async function handler(req, res) {
  const results = await Promise.all(TRUSTED_SOURCES.map(fetchSource));
  const status = Object.fromEntries(results.map(item => [item.sourceId, item.online]));
  const items = results.flatMap(item => item.items).slice(0, 36);
  const sources = TRUSTED_SOURCES.map(source => ({ ...source, fetchUrl: undefined, online: status[source.id] !== false }));

  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=900, stale-while-revalidate=1800');
  return res.status(200).json({
    ok: true,
    checkedAt: new Date().toISOString(),
    sources,
    items,
    policy: 'Somente fontes oficiais, páginas primárias dos institutos e publicações identificáveis. Percentuais só entram no gráfico após validação do cenário, amostra, período, margem e registro.'
  });
};