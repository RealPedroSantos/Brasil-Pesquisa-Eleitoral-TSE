const TSE_BASE = 'https://resultados.tse.jus.br/oficial';
const COMMON_CONFIG = `${TSE_BASE}/comum/config/ele-c.json`;
const ELECTION_DATE_2026 = '2026-10-04';
const SECOND_ROUND_DATE_2026 = '2026-10-25';
const UFS = ['ac','al','ap','am','ba','ce','df','es','go','ma','mt','ms','mg','pa','pb','pr','pe','pi','rj','rn','rs','ro','rr','sc','sp','se','to'];

const HISTORICAL_2022 = {
  president: {
    1: { electionCode: '544', pleitoCode: '406', cargoCode: '0001' },
    2: { electionCode: '545', pleitoCode: '407', cargoCode: '0001' }
  },
  governor: {
    1: { electionCode: '546', pleitoCode: '406', cargoCode: '0003' },
    2: { electionCode: '547', pleitoCode: '407', cargoCode: '0003' }
  },
  senator: {
    1: { electionCode: '546', pleitoCode: '406', cargoCode: '0005' }
  },
  federalDeputy: {
    1: { electionCode: '546', pleitoCode: '406', cargoCode: '0006' }
  },
  stateDeputy: {
    1: { electionCode: '546', pleitoCode: '406', cargoCode: '0007' }
  }
};

const CARGO_LABELS = {
  president: 'Presidente',
  governor: 'Governador',
  senator: 'Senador',
  federalDeputy: 'Deputado Federal',
  stateDeputy: 'Deputado Estadual/Distrital'
};

function send(res, status, payload, cache = 'public, s-maxage=60, stale-while-revalidate=300') {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', cache);
  res.setHeader('Access-Control-Allow-Origin', '*');
  return res.end(JSON.stringify(payload));
}

function parseDecimal(value) {
  if (typeof value === 'number') return value;
  const parsed = Number(String(value ?? '').replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : 0;
}

function text(value) {
  return String(value ?? '').replace(/&ordm;|&#186;/gi, 'º').replace(/&amp;/gi, '&').trim();
}

async function fetchJson(url, timeoutMs = 12000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Brasil-Pesquisa-Eleitoral-TSE/2.0'
      }
    });
    if (!response.ok) throw new Error(`TSE respondeu ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

function normalizeCandidate(candidate, index = 0) {
  return {
    sequence: Number(candidate.seq || index + 1),
    number: text(candidate.n || candidate.nr || candidate.numero),
    name: text(candidate.nm || candidate.nome || candidate.nmu),
    ballotName: text(candidate.nv || candidate.nmurna || candidate.nmu || candidate.nm),
    party: text(candidate.sg || candidate.cc || candidate.partido || candidate.sgp),
    coalition: text(candidate.cc || candidate.coligacao),
    votes: parseDecimal(candidate.vap ?? candidate.votos ?? candidate.v),
    percentage: parseDecimal(candidate.pvap ?? candidate.percentual ?? candidate.pv),
    elected: String(candidate.e || candidate.st || '').toLowerCase().includes('eleit'),
    rawStatus: text(candidate.st || candidate.sit || candidate.e)
  };
}

function normalizeResult(payload, meta = {}) {
  const candidates = Array.isArray(payload?.cand)
    ? payload.cand.map(normalizeCandidate).sort((a, b) => b.votes - a.votes || a.sequence - b.sequence)
    : [];

  return {
    ok: true,
    live: Boolean(meta.live),
    year: Number(meta.year),
    round: Number(meta.round),
    cargo: meta.cargo,
    cargoLabel: CARGO_LABELS[meta.cargo] || meta.cargo,
    scope: meta.scope,
    electionCode: meta.electionCode,
    updatedDate: text(payload?.dg || payload?.dtg || payload?.date),
    updatedTime: text(payload?.hg || payload?.hrg || payload?.time),
    sectionsPercentage: parseDecimal(payload?.pst ?? payload?.psi ?? payload?.percSecoes),
    electoratePercentage: parseDecimal(payload?.pesi ?? payload?.pea ?? payload?.percEleitorado),
    sectionsTotalized: parseDecimal(payload?.st ?? payload?.sTot ?? payload?.secoesTotalizadas),
    sectionsTotal: parseDecimal(payload?.s ?? payload?.sTotal ?? payload?.secoes),
    electorate: parseDecimal(payload?.e ?? payload?.eleitorado),
    turnout: parseDecimal(payload?.c ?? payload?.comparecimento),
    abstentions: parseDecimal(payload?.a ?? payload?.abstencoes),
    validVotes: parseDecimal(payload?.vvc ?? payload?.vv ?? payload?.validos),
    blankVotes: parseDecimal(payload?.vb ?? payload?.brancos),
    nullVotes: parseDecimal(payload?.vn ?? payload?.nulos),
    candidates,
    sourceUrl: meta.sourceUrl,
    checkedAt: new Date().toISOString()
  };
}

async function get2026Config() {
  const config = await fetchJson(COMMON_CONFIG);
  const is2026 = String(config?.c || '').toLowerCase() === 'ele2026';
  const elections = (config?.pl || []).flatMap((pleito) => (pleito.e || []).map((election) => ({
    ...election,
    pleitoCode: String(pleito.cd || ''),
    pleitoDate: pleito.dt
  })));
  return { config, is2026, elections };
}

function find2026Election(elections, cargo, round) {
  const targetRound = String(round);
  const target = cargo === 'president' ? 'federal' : 'estadual';
  return elections.find((item) => {
    const name = text(item.nm).toLowerCase();
    return String(item.t) === targetRound && name.includes('2026') && name.includes(target);
  }) || null;
}

function cargoCodeFromElection(election, cargo) {
  const expected = CARGO_LABELS[cargo]?.toLowerCase();
  for (const scope of election?.abr || []) {
    const found = (scope.cp || []).find((item) => text(item.ds).toLowerCase().includes(expected));
    if (found) return String(found.cd).padStart(4, '0');
  }
  return HISTORICAL_2022[cargo]?.[1]?.cargoCode || '0001';
}

async function getLiveStatus() {
  try {
    const { config, is2026, elections } = await get2026Config();
    return {
      ok: true,
      live: is2026,
      phase: is2026 ? 'official-feed-configured' : 'pre-election',
      cycle: config?.c || null,
      generatedAt: [config?.dg, config?.hg].filter(Boolean).join(' '),
      electionDate: ELECTION_DATE_2026,
      secondRoundDate: SECOND_ROUND_DATE_2026,
      availableElections: is2026 ? elections.map((item) => ({ code: item.cd, name: text(item.nm), round: item.t })) : [],
      sourceUrl: COMMON_CONFIG,
      checkedAt: new Date().toISOString()
    };
  } catch (error) {
    return {
      ok: false,
      live: false,
      phase: 'source-unavailable',
      electionDate: ELECTION_DATE_2026,
      secondRoundDate: SECOND_ROUND_DATE_2026,
      sourceUrl: COMMON_CONFIG,
      checkedAt: new Date().toISOString(),
      detail: error.message
    };
  }
}

function historicalDefinition(cargo, round) {
  return HISTORICAL_2022[cargo]?.[round] || null;
}

async function historicalSummary({ cargo, round, uf }) {
  const definition = historicalDefinition(cargo, round);
  if (!definition) throw new Error('Cargo ou turno sem resultado histórico configurado.');
  if (cargo !== 'president' && uf === 'br') throw new Error('Selecione uma UF para este cargo.');
  const scope = String(uf || 'br').toLowerCase();
  const url = `${TSE_BASE}/ele2022/${definition.electionCode}/dados-simplificados/${scope}/${scope}-c${definition.cargoCode}-e000${definition.electionCode}-r.json`;
  const payload = await fetchJson(url);
  return normalizeResult(payload, {
    year: 2022,
    round,
    cargo,
    scope: scope.toUpperCase(),
    electionCode: definition.electionCode,
    sourceUrl: url,
    live: false
  });
}

async function liveSummary({ cargo, round, uf }) {
  const { is2026, elections } = await get2026Config();
  if (!is2026) {
    return {
      ok: true,
      live: false,
      waiting: true,
      phase: 'pre-election',
      year: 2026,
      round,
      cargo,
      scope: String(uf || 'br').toUpperCase(),
      electionDate: ELECTION_DATE_2026,
      secondRoundDate: SECOND_ROUND_DATE_2026,
      candidates: [],
      checkedAt: new Date().toISOString(),
      sourceUrl: COMMON_CONFIG
    };
  }

  const election = find2026Election(elections, cargo, round);
  if (!election) throw new Error('A eleição solicitada ainda não apareceu na configuração oficial do TSE.');
  const electionCode = String(election.cd);
  const cargoCode = cargoCodeFromElection(election, cargo);
  const scope = String(uf || 'br').toLowerCase();
  const candidates = [
    `${TSE_BASE}/ele2026/${electionCode}/dados-simplificados/${scope}/${scope}-c${cargoCode}-e${electionCode.padStart(6, '0')}-r.json`,
    `${TSE_BASE}/ele2026/${electionCode}/dados/${scope}/${scope}-c${cargoCode}-e${electionCode.padStart(6, '0')}-r.json`
  ];

  let lastError;
  for (const url of candidates) {
    try {
      const payload = await fetchJson(url);
      return normalizeResult(payload, {
        year: 2026,
        round,
        cargo,
        scope: scope.toUpperCase(),
        electionCode,
        sourceUrl: url,
        live: true
      });
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error('Arquivo oficial de resultado ainda indisponível.');
}

async function stateSummaries({ year, cargo, round }) {
  const scopes = cargo === 'president' ? UFS : UFS;
  const loader = year === 2026 ? liveSummary : historicalSummary;
  const settled = await Promise.allSettled(scopes.map((uf) => loader({ cargo, round, uf })));
  return settled.map((item, index) => {
    const uf = scopes[index].toUpperCase();
    if (item.status !== 'fulfilled' || item.value.waiting) return { uf, available: false };
    const result = item.value;
    return {
      uf,
      available: true,
      sectionsPercentage: result.sectionsPercentage,
      electoratePercentage: result.electoratePercentage,
      candidates: result.candidates.slice(0, 5),
      winner: result.candidates[0] || null,
      sourceUrl: result.sourceUrl
    };
  });
}

function flattenMunicipalities(payload) {
  const output = [];
  for (const scope of payload?.abr || []) {
    const uf = text(scope.cd || scope.sg || scope.uf).toUpperCase();
    const stateName = text(scope.ds || scope.nm || scope.nome);
    for (const municipality of scope.mu || scope.mun || []) {
      output.push({
        uf,
        stateName,
        code: text(municipality.cd || municipality.codigo).padStart(5, '0'),
        ibgeCode: text(municipality.cdi || municipality.ibge),
        name: text(municipality.nm || municipality.nome),
        zones: municipality.z || municipality.zon || municipality.zonas || []
      });
    }
  }
  return output;
}

async function municipalities2022({ cargo, round, uf }) {
  const definition = historicalDefinition(cargo, round);
  if (!definition) throw new Error('Cargo ou turno sem configuração histórica.');
  const url = `${TSE_BASE}/ele2022/${definition.electionCode}/config/mun-e000${definition.electionCode}-cm.json`;
  const payload = await fetchJson(url);
  const municipalities = flattenMunicipalities(payload)
    .filter((item) => !uf || item.uf === String(uf).toUpperCase())
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  return { ok: true, year: 2022, cargo, round, uf: uf?.toUpperCase() || null, municipalities, sourceUrl: url };
}

function collectResultScopes(payload) {
  const results = [];
  const visit = (value) => {
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    if (Array.isArray(value.cand) && (value.tpabr || value.cdabr || value.nmabr)) {
      results.push({
        type: text(value.tpabr || value.tipo),
        code: text(value.cdabr || value.codigo),
        name: text(value.nmabr || value.nome),
        candidates: value.cand.map(normalizeCandidate).sort((a, b) => b.votes - a.votes),
        sectionsPercentage: parseDecimal(value.pst ?? value.psi),
        electoratePercentage: parseDecimal(value.pesi)
      });
    }
    Object.values(value).forEach(visit);
  };
  visit(payload);
  return results;
}

async function municipalityResult2022({ cargo, round, uf, municipalityCode }) {
  const definition = historicalDefinition(cargo, round);
  if (!definition) throw new Error('Cargo ou turno sem configuração histórica.');
  if (!uf || !municipalityCode) throw new Error('UF e código do município são obrigatórios.');
  const scope = String(uf).toLowerCase();
  const code = String(municipalityCode).padStart(5, '0');
  const url = `${TSE_BASE}/ele2022/${definition.electionCode}/dados/${scope}/${scope}${code}-c${definition.cargoCode}-e000${definition.electionCode}-v.json`;
  const payload = await fetchJson(url, 16000);
  const scopes = collectResultScopes(payload);
  return {
    ok: true,
    year: 2022,
    cargo,
    round,
    uf: scope.toUpperCase(),
    municipalityCode: code,
    municipality: scopes.find((item) => item.type.toUpperCase() === 'MU') || scopes[0] || null,
    zones: scopes.filter((item) => /ZE|ZONA/i.test(item.type)),
    allScopes: scopes,
    sourceUrl: url,
    checkedAt: new Date().toISOString()
  };
}

function extractSections(payload, wantedMunicipality, wantedZone) {
  const output = [];
  const walk = (node, context = {}) => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      node.forEach((item) => walk(item, context));
      return;
    }
    const next = {
      municipality: text(node.cd || node.m || node.mu || node.mun || node.codMun || context.municipality),
      zone: text(node.z || node.zn || node.zona || node.nrZona || context.zone),
      section: text(node.s || node.se || node.sec || node.secao || node.nrSecao || context.section),
      location: text(node.nm || node.local || node.nmlocal || node.ds || context.location),
      neighborhood: text(node.bairro || node.nmbairro || context.neighborhood)
    };
    if (next.section && (!wantedMunicipality || next.municipality.endsWith(String(wantedMunicipality))) && (!wantedZone || next.zone.endsWith(String(wantedZone)))) {
      output.push(next);
    }
    Object.values(node).forEach((value) => walk(value, next));
  };
  walk(payload);
  const unique = new Map();
  output.forEach((item) => {
    const key = [item.municipality, item.zone, item.section].join('|');
    if (!unique.has(key)) unique.set(key, item);
  });
  return [...unique.values()].sort((a, b) => a.section.localeCompare(b.section, 'pt-BR', { numeric: true }));
}

async function sections2022({ cargo, round, uf, municipalityCode, zone }) {
  const definition = historicalDefinition(cargo, round);
  if (!definition) throw new Error('Cargo ou turno sem configuração histórica.');
  if (!uf) throw new Error('UF é obrigatória.');
  const scope = String(uf).toLowerCase();
  const url = `${TSE_BASE}/ele2022/arquivo-urna/${definition.pleitoCode}/config/${scope}/${scope}-p000${definition.pleitoCode}-cs.json`;
  const payload = await fetchJson(url, 20000);
  const sections = extractSections(payload, municipalityCode, zone);
  return {
    ok: true,
    year: 2022,
    cargo,
    round,
    uf: scope.toUpperCase(),
    municipalityCode: municipalityCode || null,
    zone: zone || null,
    sections,
    neighborhoodCoverage: sections.some((item) => item.neighborhood) ? 'available' : 'not-provided-in-this-file',
    sourceUrl: url,
    checkedAt: new Date().toISOString()
  };
}

module.exports = async function handler(req, res) {
  const query = req.query || {};
  const action = String(query.action || 'status');
  const year = Number(query.year || 2026);
  const round = Number(query.round || 1);
  const cargo = String(query.cargo || 'president');
  const uf = String(query.uf || (cargo === 'president' ? 'br' : '')).toLowerCase();

  try {
    if (action === 'status') return send(res, 200, await getLiveStatus(), 'public, s-maxage=30, stale-while-revalidate=90');
    if (action === 'summary') {
      const result = year === 2026
        ? await liveSummary({ cargo, round, uf })
        : await historicalSummary({ cargo, round, uf });
      return send(res, 200, result, year === 2026 ? 'public, s-maxage=10, stale-while-revalidate=20' : 'public, s-maxage=86400, stale-while-revalidate=604800');
    }
    if (action === 'states') {
      const states = await stateSummaries({ year, cargo, round });
      return send(res, 200, { ok: true, year, cargo, round, states, checkedAt: new Date().toISOString() }, year === 2026 ? 'public, s-maxage=15, stale-while-revalidate=30' : 'public, s-maxage=86400, stale-while-revalidate=604800');
    }
    if (action === 'municipalities' && year === 2022) {
      return send(res, 200, await municipalities2022({ cargo, round, uf }), 'public, s-maxage=604800, stale-while-revalidate=2592000');
    }
    if (action === 'municipality' && year === 2022) {
      return send(res, 200, await municipalityResult2022({ cargo, round, uf, municipalityCode: query.municipality }), 'public, s-maxage=604800, stale-while-revalidate=2592000');
    }
    if (action === 'sections' && year === 2022) {
      return send(res, 200, await sections2022({ cargo, round, uf, municipalityCode: query.municipality, zone: query.zone }), 'public, s-maxage=604800, stale-while-revalidate=2592000');
    }
    return send(res, 400, { ok: false, error: 'Ação não suportada para o ano solicitado.' }, 'no-store');
  } catch (error) {
    console.error('[election-results]', action, year, cargo, round, uf, error?.message || error);
    return send(res, 502, {
      ok: false,
      error: 'Não foi possível carregar este recorte do resultado oficial.',
      detail: error?.message || 'Erro desconhecido',
      action,
      year,
      cargo,
      round,
      uf,
      checkedAt: new Date().toISOString()
    }, 'no-store');
  }
};
