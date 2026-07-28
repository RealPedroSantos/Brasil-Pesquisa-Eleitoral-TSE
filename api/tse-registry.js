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

function cleanKey(value) {
  return String(value || '').replace(/^\uFEFF/, '').trim().toUpperCase();
}
function cleanValue(value) {
  const result = String(value || '').trim();
  return result === '#NULO#' || result === '-1' ? '' : result;
}
function first(record, aliases) {
  for (const alias of aliases) {
    if (record[alias] !== undefined && cleanValue(record[alias])) return cleanValue(record[alias]);
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
  return raw;
}
function normalizeRecord(record) {
  const registry = first(record, ['NR_PESQUISA','NR_REGISTRO','NUMERO_PESQUISA','NUMERO_REGISTRO','CD_PESQUISA']);
  const officeRaw = first(record, ['DS_CARGO','DS_CARGO_PESQUISADO','CARGO','NM_CARGO']);
  const uf = first(record, ['SG_UF','UF','SG_UF_PESQUISA','SG_UE']);
  const municipality = first(record, ['NM_MUNICIPIO','MUNICIPIO','NM_LOCALIDADE','DS_ABRANGENCIA']);
  const state = first(record, ['NM_UF','NM_ESTADO']);
  const location = municipality || state || first(record, ['DS_UNIDADE_ELEITORAL','NM_UE']);
  const institute = first(record, ['NM_EMPRESA','NM_INSTITUTO','NM_RAZAO_SOCIAL','EMPRESA','INSTITUTO','NM_EMPRESA_CONTRATADA']);
  const company = first(record, ['NR_CNPJ_EMPRESA','CNPJ_EMPRESA','NR_CNPJ_INSTITUTO']);
  const fieldStart = normalizeDate(first(record, ['DT_INICIO_PESQUISA','DT_INICIO','DATA_INICIO','DT_INICIO_CAMPO']));
  const fieldEnd = normalizeDate(first(record, ['DT_FIM_PESQUISA','DT_FIM','DATA_FIM','DT_FIM_CAMPO']));
  const publication = normalizeDate(first(record, ['DT_DIVULGACAO','DT_PUBLICACAO','DATA_DIVULGACAO']));
  const sample = first(record, ['QT_ENTREVISTADOS','QT_PESSOAS_ENTREVISTADAS','TAMANHO_AMOSTRA','QT_AMOSTRA']);
  const margin = first(record, ['VR_MARGEM_ERRO','MARGEM_ERRO','DS_MARGEM_ERRO']);
  const status = first(record, ['DS_SITUACAO_PESQUISA','DS_SITUACAO','SITUACAO']);
  const scope = first(record, ['DS_ABRANGENCIA','TP_ABRANGENCIA','ABRANGENCIA']);
  return { registry, office: normalizeOffice(officeRaw), uf: uf === 'BR' ? 'BR' : uf, location, institute, company, fieldStart, fieldEnd, publication, sample, margin, status: status || 'Registrada', scope, hasResults: false };
}

async function loadRegistry() {
  if (memoryCache && Date.now() - memoryCacheAt < CACHE_TTL) return memoryCache;
  const response = await fetch(DATA_URL, { headers: { 'User-Agent': 'Pesquisas-Eleitorais-2026/3.0' }, cache: 'no-store' });
  if (!response.ok) throw new Error(`TSE respondeu HTTP ${response.status}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  const zip = new AdmZip(buffer);
  const entry = zip.getEntries().find(item => !item.isDirectory && item.entryName.toLowerCase().endsWith('.csv'));
  if (!entry) throw new Error('CSV de pesquisas não encontrado no arquivo do TSE.');
  const raw = entry.getData();
  let text = iconv.decode(raw, 'latin1');
  if ((text.match(/;/g) || []).length < (text.match(/,/g) || []).length) text = iconv.decode(raw, 'utf8');
  const delimiter = (text.split('\n')[0].match(/;/g) || []).length >= (text.split('\n')[0].match(/,/g) || []).length ? ';' : ',';
  const rows = parseCsv(text, delimiter);
  const headers = (rows.shift() || []).map(cleanKey);
  const seen = new Set();
  const records = [];
  for (const values of rows) {
    const rawRecord = Object.fromEntries(headers.map((header, index) => [header, values[index] || '']));
    const normalized = normalizeRecord(rawRecord);
    const key = normalized.registry || [normalized.office,normalized.uf,normalized.institute,normalized.fieldStart,normalized.fieldEnd].join('|');
    if (!key || seen.has(key)) continue;
    seen.add(key);
    records.push(normalized);
  }
  records.sort((a,b) => `${b.fieldEnd||b.publication||''}`.localeCompare(`${a.fieldEnd||a.publication||''}`));
  const byOffice = records.reduce((acc,item)=>{acc[item.office]=(acc[item.office]||0)+1;return acc;},{});
  const byUf = records.reduce((acc,item)=>{const key=item.uf||'BR';acc[key]=(acc[key]||0)+1;return acc;},{});
  memoryCache = { records, meta: { total: records.length, byOffice, byUf, source: DATA_URL, generatedAt: new Date().toISOString(), file: entry.entryName } };
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
