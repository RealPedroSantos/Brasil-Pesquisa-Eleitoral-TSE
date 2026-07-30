const TSE_BASE = 'https://resultados.tse.jus.br/oficial';

const ROUND_CONFIG = {
  1: { pleito: '406', election: '544' },
  2: { pleito: '407', election: '545' }
};

function send(res, status, payload, cache = 'public, s-maxage=86400, stale-while-revalidate=604800') {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', cache);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('X-Election-Section-Source', 'TSE-EA18-EA17');
  return res.end(JSON.stringify(payload));
}

function digits(value, size = 0) {
  const normalized = String(value ?? '').replace(/\D/g, '');
  return size ? normalized.padStart(size, '0') : normalized;
}

function text(value) {
  return String(value ?? '').replace(/&amp;/gi, '&').trim();
}

function numeric(value) {
  if (typeof value === 'number') return value;
  const parsed = Number(String(value ?? '').replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : 0;
}

async function fetchResponse(url, timeoutMs = 12000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      signal: controller.signal,
      cache: 'no-store',
      headers: {
        Accept: 'application/json, text/plain, */*',
        'User-Agent': 'Brasil-Pesquisa-Eleitoral-TSE/3.0'
      }
    });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchJson(url) {
  const response = await fetchResponse(url);
  if (!response.ok) throw new Error(`TSE respondeu ${response.status}`);
  return response.json();
}

function walk(value, visitor, path = []) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => walk(item, visitor, [...path, index]));
    return;
  }
  if (!value || typeof value !== 'object') {
    visitor(value, path);
    return;
  }
  Object.entries(value).forEach(([key, item]) => walk(item, visitor, [...path, key]));
}

function humanFileType(filename) {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.imgbu')) return 'Imagem do Boletim de Urna';
  if (lower.endsWith('.bu')) return 'Boletim de Urna';
  if (lower.endsWith('.rdv')) return 'Registro Digital do Voto';
  if (lower.includes('log') || lower.endsWith('.logjez')) return 'Log da urna';
  if (lower.endsWith('.json')) return 'Arquivo JSON';
  if (lower.endsWith('.zip')) return 'Pacote compactado';
  return 'Arquivo oficial';
}

function collectOfficialFiles(payload, directoryUrl) {
  const names = new Set();
  walk(payload, (value) => {
    if (typeof value !== 'string') return;
    const decoded = value.trim();
    const matches = decoded.match(/(?:https?:\/\/[^\s"'<>]+|[\w.-]+\.(?:imgbu|bu|rdv|logjez|json|zip|pdf))/gi) || [];
    matches.forEach((match) => names.add(match));
  });

  return [...names]
    .filter((name) => !name.toLowerCase().endsWith('-aux.json'))
    .map((name) => {
      const url = /^https?:\/\//i.test(name) ? name : `${directoryUrl}/${name}`;
      const filename = url.split('/').pop();
      return { filename, type: humanFileType(filename), url };
    })
    .filter((item, index, rows) => rows.findIndex((row) => row.url === item.url) === index);
}

function findCandidateArrays(value, output = []) {
  if (Array.isArray(value)) {
    const possible = value.filter((item) => item && typeof item === 'object');
    const hasVotes = possible.some((item) => (
      item.vap !== undefined || item.votos !== undefined || item.qtVotos !== undefined ||
      item.qtdVotos !== undefined || item.quantidadeVotos !== undefined
    ));
    const hasNumber = possible.some((item) => (
      item.n !== undefined || item.nr !== undefined || item.numero !== undefined ||
      item.numeroVotavel !== undefined || item.cd !== undefined
    ));
    if (possible.length && hasVotes && hasNumber) output.push(possible);
    value.forEach((item) => findCandidateArrays(item, output));
    return output;
  }
  if (value && typeof value === 'object') Object.values(value).forEach((item) => findCandidateArrays(item, output));
  return output;
}

function normalizeCandidate(item, index) {
  const number = text(item.n ?? item.nr ?? item.numero ?? item.numeroVotavel ?? item.cd);
  const name = text(item.nm ?? item.nome ?? item.nomeVotavel ?? item.nmurna ?? item.nmu);
  const party = text(item.sg ?? item.partido ?? item.sgp ?? item.siglaPartido);
  const votes = numeric(item.vap ?? item.votos ?? item.qtVotos ?? item.qtdVotos ?? item.quantidadeVotos);
  return {
    sequence: Number(item.seq ?? index + 1),
    number,
    name,
    ballotName: text(item.nv ?? item.nomeUrna ?? name),
    party,
    votes
  };
}

function extractCandidates(payload) {
  const arrays = findCandidateArrays(payload);
  const candidates = arrays.flatMap((items) => items.map(normalizeCandidate))
    .filter((item) => item.number && item.votes >= 0);
  const map = new Map();
  candidates.forEach((item) => {
    const key = `${digits(item.number)}|${item.name}`;
    const previous = map.get(key);
    if (!previous || item.votes > previous.votes) map.set(key, item);
  });
  const rows = [...map.values()].sort((a, b) => b.votes - a.votes);
  const total = rows.reduce((sum, item) => sum + item.votes, 0);
  return rows.map((item) => ({
    ...item,
    percentage: total ? Number(((item.votes / total) * 100).toFixed(2)) : 0
  }));
}

async function firstAvailableJson(urls) {
  for (const url of urls) {
    try {
      const response = await fetchResponse(url, 6500);
      if (!response.ok) continue;
      const type = response.headers.get('content-type') || '';
      if (!type.includes('json')) continue;
      const payload = await response.json();
      return { url, payload };
    } catch {
      // Tenta o próximo padrão oficial conhecido.
    }
  }
  return null;
}

async function historicalSectionDetail(query) {
  const round = Number(query.round || 1);
  const config = ROUND_CONFIG[round];
  if (!config) throw new Error('Turno histórico inválido.');

  const uf = String(query.uf || '').toLowerCase();
  const municipality = digits(query.municipality, 5);
  const zone = digits(query.zone, 4);
  const section = digits(query.section, 4);
  if (!/^[a-z]{2}$/.test(uf) || !municipality || !zone || !section) {
    throw new Error('UF, município, zona e seção são obrigatórios.');
  }

  const directoryUrl = `${TSE_BASE}/ele2022/arquivo-urna/${config.pleito}/dados/${uf}/${municipality}/${zone}/${section}`;
  const baseName = `p000${config.pleito}-${uf}-m${municipality}-z${zone}-s${section}`;
  const auxUrl = `${directoryUrl}/${baseName}-aux.json`;
  const aux = await fetchJson(auxUrl);
  const files = collectOfficialFiles(aux, directoryUrl);

  const possibleBulletinJson = await firstAvailableJson([
    `${directoryUrl}/${baseName}-bu.json`,
    `${directoryUrl}/${baseName}.json`,
    `${directoryUrl}/${baseName}-v.json`
  ]);
  const candidates = possibleBulletinJson ? extractCandidates(possibleBulletinJson.payload) : extractCandidates(aux);

  const generatedDate = text(aux.dg ?? aux.dataGeracao ?? aux.data);
  const generatedTime = text(aux.hg ?? aux.horaGeracao ?? aux.hora);
  const status = files.length || candidates.length ? 'available' : 'metadata-only';

  return {
    ok: true,
    live: false,
    year: 2022,
    round,
    uf: uf.toUpperCase(),
    municipality,
    zone,
    section,
    status,
    generatedAt: [generatedDate, generatedTime].filter(Boolean).join(' · ') || null,
    candidates,
    files,
    bulletinJsonUrl: possibleBulletinJson?.url || null,
    sourceUrl: auxUrl,
    directoryUrl,
    tseResultsUrl: 'https://resultados.tse.jus.br/oficial/app/index.html',
    note: candidates.length
      ? 'Votos da seção extraídos de arquivo JSON oficial do TSE.'
      : 'O TSE disponibiliza os artefatos oficiais da urna nesta seção. Quando o JSON do boletim não expõe votos em formato estruturado, os arquivos oficiais permanecem disponíveis para conferência.',
    checkedAt: new Date().toISOString()
  };
}

async function liveSectionDetail(query) {
  const commonUrl = `${TSE_BASE}/comum/config/ele-c.json`;
  const config = await fetchJson(commonUrl);
  const is2026 = String(config?.c || '').toLowerCase() === 'ele2026';
  return {
    ok: true,
    live: false,
    waiting: !is2026,
    year: 2026,
    round: Number(query.round || 1),
    uf: String(query.uf || '').toUpperCase(),
    municipality: digits(query.municipality, 5),
    zone: digits(query.zone, 4),
    section: digits(query.section, 4),
    status: is2026 ? 'configuration-detected' : 'pre-election',
    candidates: [],
    files: [],
    sourceUrl: commonUrl,
    note: is2026
      ? 'A configuração 2026 foi detectada. Os arquivos por seção serão consultados quando a estrutura EA18 estiver disponível.'
      : 'A apuração de 2026 ainda não foi aberta pelo TSE. Nenhum voto de seção é simulado.',
    checkedAt: new Date().toISOString()
  };
}

module.exports = async function handler(req, res) {
  try {
    const query = req.query || {};
    const year = Number(query.year || 2022);
    const payload = year === 2026
      ? await liveSectionDetail(query)
      : await historicalSectionDetail(query);
    return send(res, 200, payload, year === 2026
      ? 'public, s-maxage=15, stale-while-revalidate=30'
      : 'public, s-maxage=86400, stale-while-revalidate=604800');
  } catch (error) {
    return send(res, 502, {
      ok: false,
      error: 'Não foi possível consultar o detalhe oficial da seção.',
      detail: error.message,
      checkedAt: new Date().toISOString()
    }, 'no-store');
  }
};
