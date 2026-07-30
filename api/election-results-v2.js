const baseHandler = require('./election-results.js');

const SECTION_CONFIG = {
  1: { pleitoCode: '406' },
  2: { pleitoCode: '407' }
};

function captureResponse() {
  const headers = {};
  let resolve;
  const completed = new Promise((done) => { resolve = done; });
  const response = {
    statusCode: 200,
    setHeader(name, value) { headers[String(name).toLowerCase()] = value; },
    end(body = '') { resolve({ statusCode: response.statusCode, headers, body: String(body) }); }
  };
  return { response, completed };
}

async function invokeBase(req, query) {
  const capture = captureResponse();
  await baseHandler({ ...req, query }, capture.response);
  const output = await capture.completed;
  let payload;
  try {
    payload = JSON.parse(output.body || '{}');
  } catch {
    payload = { ok: false, error: 'Resposta inválida da camada eleitoral.' };
  }
  return { ...output, payload };
}

function candidateKey(candidate) {
  return String(candidate?.number || candidate?.n || '').replace(/\D/g, '').replace(/^0+/, '') || String(candidate?.number || '');
}

function mergeCandidate(candidate, identity) {
  if (!identity) return candidate;
  return {
    ...candidate,
    name: candidate.name || identity.name,
    ballotName: candidate.ballotName || identity.ballotName,
    party: candidate.party || identity.party,
    coalition: candidate.coalition || identity.coalition,
    rawStatus: candidate.rawStatus || identity.rawStatus
  };
}

function enrichCandidateCollections(value, identities) {
  if (!value || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map((item) => enrichCandidateCollections(item, identities));

  const result = { ...value };
  if (Array.isArray(result.candidates)) {
    result.candidates = result.candidates.map((candidate) => mergeCandidate(candidate, identities.get(candidateKey(candidate))));
  }
  Object.keys(result).forEach((key) => {
    if (key !== 'candidates') result[key] = enrichCandidateCollections(result[key], identities);
  });
  return result;
}

function sendCaptured(res, output, payload) {
  Object.entries(output.headers || {}).forEach(([name, value]) => res.setHeader(name, value));
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('X-Election-Data-Enriched', 'candidate-number-and-sections');
  res.statusCode = output.statusCode;
  return res.end(JSON.stringify(payload));
}

function normalizedCode(value) {
  return String(value || '').replace(/\D/g, '').replace(/^0+/, '') || '0';
}

async function officialSections(query) {
  const round = Number(query.round || 1);
  const pleitoCode = SECTION_CONFIG[round]?.pleitoCode || '406';
  const uf = String(query.uf || '').toLowerCase();
  const municipalityCode = String(query.municipality || '');
  const zone = normalizedCode(query.zone || '');
  if (!uf || !municipalityCode) throw new Error('UF e município são obrigatórios para listar seções.');

  const sourceUrl = `https://resultados.tse.jus.br/oficial/ele2022/arquivo-urna/${pleitoCode}/config/${uf}/${uf}-p000${pleitoCode}-cs.json`;
  const response = await fetch(sourceUrl, {
    headers: { Accept: 'application/json', 'User-Agent': 'Brasil-Pesquisa-Eleitoral-TSE/2.0' }
  });
  if (!response.ok) throw new Error(`TSE respondeu ${response.status} ao consultar seções.`);
  const payload = await response.json();
  const state = (payload.abr || []).find((item) => String(item.cd || '').toLowerCase() === uf) || payload.abr?.[0];
  const municipality = (state?.mu || []).find((item) => normalizedCode(item.cd) === normalizedCode(municipalityCode));
  const zones = (municipality?.zon || []).filter((item) => !query.zone || normalizedCode(item.cd) === zone);
  const sections = zones.flatMap((zoneItem) => (zoneItem.sec || []).map((section) => ({
    municipality: String(municipality?.cd || municipalityCode),
    municipalityName: String(municipality?.nm || ''),
    zone: String(zoneItem.cd || '').padStart(4, '0'),
    section: String(section.ns || section.nsp || '').padStart(4, '0'),
    originalSection: String(section.nsp || section.ns || '').padStart(4, '0'),
    location: '',
    neighborhood: ''
  })));

  return {
    ok: true,
    year: 2022,
    cargo: query.cargo || 'president',
    round,
    uf: uf.toUpperCase(),
    municipalityCode,
    municipalityName: municipality?.nm || '',
    zone: query.zone || null,
    sections,
    neighborhoodCoverage: 'not-provided-in-section-config',
    sourceUrl,
    checkedAt: new Date().toISOString()
  };
}

module.exports = async function handler(req, res) {
  const query = req.query || {};
  const isHistoricalSections = Number(query.year || 2026) === 2022 && String(query.action || '') === 'sections';

  if (isHistoricalSections) {
    try {
      const payload = await officialSections(query);
      return sendCaptured(res, { statusCode: 200, headers: { 'cache-control': 'public, s-maxage=604800, stale-while-revalidate=2592000' } }, payload);
    } catch (error) {
      return sendCaptured(res, { statusCode: 502, headers: { 'cache-control': 'no-store' } }, {
        ok: false,
        error: 'Não foi possível listar as seções oficiais.',
        detail: error.message,
        checkedAt: new Date().toISOString()
      });
    }
  }

  const output = await invokeBase(req, query);
  const needsIdentity = Number(query.year || 2026) === 2022 && String(query.action || '') === 'municipality' && output.payload?.ok;

  if (!needsIdentity) return sendCaptured(res, output, output.payload);

  try {
    const summaryOutput = await invokeBase(req, {
      action: 'summary',
      year: 2022,
      cargo: query.cargo || 'president',
      round: query.round || 1,
      uf: query.uf || 'br'
    });
    const identities = new Map((summaryOutput.payload?.candidates || []).map((candidate) => [candidateKey(candidate), candidate]));
    const enriched = enrichCandidateCollections(output.payload, identities);
    enriched.enrichment = {
      method: 'candidate-number',
      source: summaryOutput.payload?.sourceUrl || null,
      description: 'Nomes, partidos e fotos são associados pelo número oficial do candidato no mesmo cargo, turno e UF.'
    };
    return sendCaptured(res, output, enriched);
  } catch (error) {
    output.payload.enrichment = { method: 'candidate-number', ok: false, detail: error.message };
    return sendCaptured(res, output, output.payload);
  }
};
