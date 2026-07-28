const AdmZip = require('adm-zip');
const iconv = require('iconv-lite');

const DATA_URL = 'https://cdn.tse.jus.br/estatistica/sead/odsele/consulta_cand/consulta_cand_2026.zip';
const CACHE_TTL = 15 * 60 * 1000;
const ALLOWED_OFFICES = new Set([
  'Governador',
  'Senador',
  'Deputado Federal',
  'Deputado Estadual',
  'Deputado Distrital'
]);

let memoryCache = null;
let memoryCacheAt = 0;

function parseCsv(text, delimiter = ';') {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];

    if (character === '"') {
      if (quoted && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === delimiter && !quoted) {
      row.push(field);
      field = '';
    } else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && text[index + 1] === '\n') index += 1;
      row.push(field);
      field = '';
      if (row.some((value) => value !== '')) rows.push(row);
      row = [];
    } else {
      field += character;
    }
  }

  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

function cleanKey(value) {
  return String(value || '').replace(/^\uFEFF/, '').trim().toUpperCase();
}

function cleanValue(value) {
  const result = String(value || '').trim();
  return result === '#NULO#' || result === '-1' ? '' : result;
}

function first(record, aliases) {
  for (const alias of aliases) {
    const value = cleanValue(record[alias]);
    if (value) return value;
  }
  return '';
}

function normalizeOffice(value) {
  const office = String(value || '').toUpperCase();
  if (office.includes('GOVERN')) return 'Governador';
  if (office.includes('SENADOR')) return 'Senador';
  if (office.includes('DEPUTADO FEDERAL')) return 'Deputado Federal';
  if (office.includes('DEPUTADO ESTADUAL')) return 'Deputado Estadual';
  if (office.includes('DEPUTADO DISTRITAL')) return 'Deputado Distrital';
  return '';
}

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function decodeCsvEntry(entry) {
  const raw = entry.getData();
  let text = iconv.decode(raw, 'latin1');
  const firstLine = text.split(/\r?\n/, 1)[0] || '';

  if ((firstLine.match(/;/g) || []).length < (firstLine.match(/,/g) || []).length) {
    text = iconv.decode(raw, 'utf8');
  }

  const headerLine = text.split(/\r?\n/, 1)[0] || '';
  const delimiter = (headerLine.match(/;/g) || []).length >= (headerLine.match(/,/g) || []).length ? ';' : ',';
  return { text, delimiter };
}

function candidatePhotoUrl(candidate) {
  const query = new URLSearchParams({
    uf: candidate.uf || 'BR',
    election: candidate.electionId || '',
    id: candidate.id || '',
    name: candidate.name || candidate.fullName || ''
  });
  return `/api/tse-candidate-photo?${query.toString()}`;
}

function normalizeCandidate(record, fallbackUf) {
  const office = normalizeOffice(first(record, ['DS_CARGO', 'NM_CARGO', 'CARGO']));
  if (!ALLOWED_OFFICES.has(office)) return null;

  const id = first(record, ['SQ_CANDIDATO', 'ID_CANDIDATO', 'CD_CANDIDATO']);
  const name = first(record, ['NM_URNA_CANDIDATO', 'NM_CANDIDATO', 'NOME_URNA']);
  const fullName = first(record, ['NM_CANDIDATO', 'NM_COMPLETO', 'NOME_CANDIDATO']) || name;
  const party = first(record, ['SG_PARTIDO', 'NM_PARTIDO', 'PARTIDO']);
  const number = first(record, ['NR_CANDIDATO', 'NUMERO_CANDIDATO']);
  const uf = first(record, ['SG_UF', 'SG_UE', 'UF']) || fallbackUf;
  const electionId = first(record, ['CD_ELEICAO', 'SQ_ELEICAO', 'ID_ELEICAO']);
  const status = first(record, [
    'DS_SITUACAO_CANDIDATURA',
    'DS_DETALHE_SITUACAO_CAND',
    'DS_SITUACAO_CANDIDATO',
    'DS_SITUACAO'
  ]) || 'Candidatura registrada';
  const coalition = first(record, ['NM_COLIGACAO', 'DS_COMPOSICAO_COLIGACAO']);
  const gender = first(record, ['DS_GENERO', 'DS_SEXO']);

  if (!id || !name || !uf) return null;

  const candidate = {
    id,
    name,
    fullName,
    party,
    number,
    uf,
    office,
    electionId,
    status,
    coalition,
    gender
  };

  candidate.photo = candidatePhotoUrl(candidate);
  candidate.search = normalizeText([name, fullName, party, number, uf, office].join(' '));
  return candidate;
}

async function loadCandidates() {
  if (memoryCache && Date.now() - memoryCacheAt < CACHE_TTL) return memoryCache;

  const response = await fetch(DATA_URL, {
    headers: { 'User-Agent': 'Pesquisas-Eleitorais-2026/4.0' },
    cache: 'no-store'
  });

  if (!response.ok) throw new Error(`TSE respondeu HTTP ${response.status}`);

  const buffer = Buffer.from(await response.arrayBuffer());
  const zip = new AdmZip(buffer);
  const entries = zip
    .getEntries()
    .filter((entry) => !entry.isDirectory && entry.entryName.toLowerCase().endsWith('.csv'));

  if (!entries.length) throw new Error('Arquivos CSV de candidaturas não encontrados.');

  const candidates = [];
  const seen = new Set();

  for (const entry of entries) {
    const ufMatch = entry.entryName.match(/_([A-Z]{2}|BR)\.csv$/i);
    const fallbackUf = ufMatch ? ufMatch[1].toUpperCase() : '';
    const { text, delimiter } = decodeCsvEntry(entry);
    const rows = parseCsv(text, delimiter);
    const headers = (rows.shift() || []).map(cleanKey);

    for (const values of rows) {
      const rawRecord = Object.fromEntries(headers.map((header, index) => [header, values[index] || '']));
      const candidate = normalizeCandidate(rawRecord, fallbackUf);
      if (!candidate) continue;

      const key = candidate.id || [
        candidate.office,
        candidate.uf,
        candidate.number,
        candidate.name
      ].join('|');

      if (seen.has(key)) continue;
      seen.add(key);
      candidates.push(candidate);
    }
  }

  candidates.sort((a, b) => (
    a.office.localeCompare(b.office, 'pt-BR') ||
    a.uf.localeCompare(b.uf, 'pt-BR') ||
    Number(a.number || 999999) - Number(b.number || 999999) ||
    a.name.localeCompare(b.name, 'pt-BR')
  ));

  memoryCache = {
    candidates,
    meta: {
      total: candidates.length,
      source: DATA_URL,
      generatedAt: new Date().toISOString()
    }
  };
  memoryCacheAt = Date.now();
  return memoryCache;
}

function requestedOffice(value) {
  const normalized = normalizeOffice(value);
  if (normalized) return normalized;

  const map = {
    governor: 'Governador',
    senate: 'Senador',
    chamber: 'Deputado Federal',
    assembly: 'Deputado Estadual',
    district: 'Deputado Distrital'
  };
  return map[String(value || '').toLowerCase()] || '';
}

module.exports = async function handler(req, res) {
  try {
    const { candidates, meta } = await loadCandidates();
    const office = requestedOffice(req.query.office);
    const uf = String(req.query.uf || '').toUpperCase();
    const query = normalizeText(req.query.q || '');
    const offset = Math.max(0, Number.parseInt(req.query.offset, 10) || 0);
    const limit = Math.min(120, Math.max(1, Number.parseInt(req.query.limit, 10) || 24));

    let filtered = candidates;

    if (office) filtered = filtered.filter((candidate) => candidate.office === office);
    if (uf && uf !== 'TODAS' && uf !== 'ALL') filtered = filtered.filter((candidate) => candidate.uf === uf);
    if (query) filtered = filtered.filter((candidate) => candidate.search.includes(query));

    const total = filtered.length;
    const page = filtered.slice(offset, offset + limit).map(({ search, ...candidate }) => candidate);

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=900, stale-while-revalidate=3600');
    return res.status(200).json({
      ok: true,
      candidates: page,
      meta: {
        ...meta,
        filteredTotal: total,
        offset,
        limit,
        hasMore: offset + page.length < total
      }
    });
  } catch (error) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(503).json({
      ok: false,
      candidates: [],
      error: 'Não foi possível carregar as candidaturas oficiais do TSE.',
      detail: error.message
    });
  }
};
