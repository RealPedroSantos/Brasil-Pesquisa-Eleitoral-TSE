const AdmZip = require('adm-zip');
const iconv = require('iconv-lite');

const DATA_URL = 'https://cdn.tse.jus.br/estatistica/sead/odsele/pesquisa_eleitoral/pesquisa_eleitoral_2026.zip';
let memoryCache = null;
let memoryCacheAt = 0;
const CACHE_TTL = 15 * 60 * 1000;

function parseCsv(text, delimiter = ';') {
  const rows = [];
  let row = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (quoted && text[i + 1] === '"') { field += '"'; i++; }
      else quoted = !quoted;
    } else if (char === delimiter && !quoted) {
      row.push(field); field = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some(value => value !== '')) rows.push(row);
      row = [];
    } else field += char;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}

function encodingPenalty(value) {
  const text = String(value || '');
  const replacement = (text.match(/�/g) || []).length;
  const mojibake = (text.match(/Ã.|Â.|â[€-¿]/g) || []).length;
  const nullBytes = (text.match(/\u0000/g) || []).length;
  return replacement * 30 + mojibake * 8 + nullBytes * 50;
}

function repairMojibake(value) {
  const text = String(value || '');
  if (!/[ÃÂâ]/.test(text)) return text;
  try {
    const repaired = iconv.decode(Buffer.from(text, 'latin1'), 'utf8');
    return encodingPenalty(repaired) < encodingPenalty(text) ? repaired : text;
  } catch {
    return text;
  }
}

function cleanKey(value) {
  return repairMojibake(value).replace(/^\uFEFF/, '').trim().toUpperCase();
}
function cleanValue(value) {
  const result = repairMojibake(value).trim();
  return ['#NULO#', '#NE', '-1'].includes(result.toUpperCase()) ? '' : result;
}
function first(record, aliases) {
  for (const alias of aliases) {
    if (record[alias] !== undefined && cleanValue(record[alias])) return cleanValue(record[alias]);
  }
  return '';
}
function firstByPattern(record, pattern) {
  for (const [key, value] of Object.entries(record)) {
    if (pattern.test(key) && cleanValue(value)) return cleanValue(value);
  }
  return '';
}
function normalizeOffice(value) {
  const v = String(value || '').toUpperCase();
  if (v.includes('PRESIDENT')) return 'Presidente';
  if (v.includes('GOVERN')) return 'Governador';
  if (v.includes('SENADOR')) return 'Senador';
  if (v.includes('DEPUTADO FEDERAL')) return 'Deputado Federal';
  if (v.includes('DEPUTADO ESTADUAL')) return 'Deputado Estadual';
  if (v.includes('DEPUTADO DISTRITAL')) return 'Deputado Distrital';
  return value ? value.replace(/\b\w/g, c => c.toUpperCase()) : 'Não identificado';
}
function normalizeDate(value) {
  if (!value) return '';
  const raw = String(value).trim();
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;
  const compact = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (compact) return `${compact[1]}/${compact[2]}/${compact[3]}`;
  return raw;
}
function dateKey(value) {
  const match = String(value || '').match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : String(value || '');
}
function normalizeRecord(record, fallbackUf) {
  const registry = first(record, ['NR_PESQUISA','NR_REGISTRO','NR_REGISTRO_PESQUISA','NUMERO_PESQUISA','NUMERO_REGISTRO','CD_PESQUISA']) || firstByPattern(record, /REGISTRO.*PESQUISA|PESQUISA.*REGISTRO|^NR_.*PESQUISA$/);
  const officeRaw = first(record, ['DS_CARGO','DS_CARGO_PESQUISADO','CARGO','NM_CARGO']) || firstByPattern(record, /CARGO/);
  const uf = first(record, ['SG_UF','UF','SG_UF_PESQUISA']) || fallbackUf;
  const municipality = first(record, ['NM_MUNICIPIO','MUNICIPIO','NM_LOCALIDADE']);
  const electionUnit = first(record, ['NM_UE','DS_UNIDADE_ELEITORAL']);
  const stateName = first(record, ['NM_UF','NM_ESTADO']);
  const location = municipality || electionUnit || stateName || (uf === 'BR' ? 'Brasil' : '');
  const institute = first(record, ['NM_EMPRESA','NM_INSTITUTO','NM_RAZAO_SOCIAL','EMPRESA','INSTITUTO','NM_EMPRESA_CONTRATADA']) || firstByPattern(record, /NM_.*EMPRESA|NM_.*INSTITUTO|RAZAO_SOCIAL/);
  const company = first(record, ['NR_CNPJ_EMPRESA','CNPJ_EMPRESA','NR_CNPJ_INSTITUTO']) || firstByPattern(record, /CNPJ/);
  const fieldStart = normalizeDate(first(record, ['DT_INICIO_PESQUISA','DT_INICIO','DATA_INICIO','DT_INICIO_CAMPO']) || firstByPattern(record, /DT_.*INICIO|DATA_.*INICIO/));
  const fieldEnd = normalizeDate(first(record, ['DT_FIM_PESQUISA','DT_FIM','DATA_FIM','DT_FIM_CAMPO']) || firstByPattern(record, /DT_.*FIM|DATA_.*FIM/));
  const publication = normalizeDate(first(record, ['DT_DIVULGACAO','DT_PUBLICACAO','DATA_DIVULGACAO']) || firstByPattern(record, /DIVULGACAO|PUBLICACAO/));
  const sample = first(record, ['QT_ENTREVISTADOS','QT_PESSOAS_ENTREVISTADAS','TAMANHO_AMOSTRA','QT_AMOSTRA']) || firstByPattern(record, /ENTREVIST|AMOSTRA/);
  const margin = first(record, ['VR_MARGEM_ERRO','MARGEM_ERRO','DS_MARGEM_ERRO']);
  const status = first(record, ['DS_SITUACAO_PESQUISA','DS_SITUACAO','SITUACAO']) || firstByPattern(record, /SITUACAO/);
  const scope = first(record, ['DS_ABRANGENCIA','TP_ABRANGENCIA','ABRANGENCIA']);
  return { registry, office: normalizeOffice(officeRaw), uf: uf === 'BR' ? 'BR' : uf, location, institute, company, fieldStart, fieldEnd, publication, sample, margin, status: status || 'Registrada', scope, hasResults: false };
}

function decodeCsvEntry(entry) {
  const raw = entry.getData();
  const utf8 = iconv.decode(raw, 'utf8');
  const latin1 = iconv.decode(raw, 'latin1');
  const text = encodingPenalty(utf8) <= encodingPenalty(latin1) ? utf8 : latin1;
  const headerLine = text.split(/\r?\n/, 1)[0] || '';
  const delimiter = (headerLine.match(/;/g) || []).length >= (headerLine.match(/,/g) || []).length ? ';' : ',';
  return { text, delimiter };
}

async function loadRegistry() {
  if (memoryCache && Date.now() - memoryCacheAt < CACHE_TTL) return memoryCache;
  const response = await fetch(DATA_URL, { headers: { 'User-Agent': 'Pesquisas-Eleitorais-2026/3.3' }, cache: 'no-store' });
  if (!response.ok) throw new Error(`TSE respondeu HTTP ${response.status}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  const zip = new AdmZip(buffer);
  const entries = zip.getEntries().filter(item => !item.isDirectory && item.entryName.toLowerCase().endsWith('.csv'));
  if (!entries.length) throw new Error('CSVs de pesquisas não encontrados no arquivo do TSE.');

  const seen = new Set();
  const records = [];
  const fileHeaders = {};
  for (const entry of entries) {
    const ufMatch = entry.entryName.match(/_([A-Z]{2}|BR)\.csv$/i);
    const fallbackUf = ufMatch ? ufMatch[1].toUpperCase() : '';
    const { text, delimiter } = decodeCsvEntry(entry);
    const rows = parseCsv(text, delimiter);
    const headers = (rows.shift() || []).map(cleanKey);
    fileHeaders[entry.entryName] = headers;
    for (const values of rows) {
      const rawRecord = Object.fromEntries(headers.map((header, index) => [header, values[index] || '']));
      const normalized = normalizeRecord(rawRecord, fallbackUf);
      const key = normalized.registry || [normalized.office,normalized.uf,normalized.institute,normalized.fieldStart,normalized.fieldEnd,normalized.publication].join('|');
      if (!key || seen.has(key)) continue;
      seen.add(key);
      records.push(normalized);
    }
  }
  records.sort((a,b) => dateKey(b.fieldEnd || b.publication).localeCompare(dateKey(a.fieldEnd || a.publication)));
  const byOffice = records.reduce((acc,item)=>{acc[item.office]=(acc[item.office]||0)+1;return acc;},{});
  const byUf = records.reduce((acc,item)=>{const key=item.uf||'BR';acc[key]=(acc[key]||0)+1;return acc;},{});
  memoryCache = { records, meta: { total: records.length, byOffice, byUf, source: DATA_URL, generatedAt: new Date().toISOString(), files: entries.map(entry => entry.entryName), sampleHeaders: fileHeaders[entries[0].entryName] || [] } };
  memoryCacheAt = Date.now();
  return memoryCache;
}

module.exports = async function handler(req, res) {
  try {
    const data = await loadRegistry();
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=900, stale-while-revalidate=3600');
    return res.status(200).json({ ok: true, ...data });
  } catch (error) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(503).json({ ok: false, error: 'Não foi possível processar a base oficial de pesquisas do TSE.', detail: error.message });
  }
};