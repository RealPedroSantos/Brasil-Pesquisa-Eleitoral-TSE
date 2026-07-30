const baseHandler = require('./election-results.js');

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
  res.setHeader('X-Election-Data-Enriched', 'candidate-number');
  res.statusCode = output.statusCode;
  return res.end(JSON.stringify(payload));
}

module.exports = async function handler(req, res) {
  const query = req.query || {};
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
