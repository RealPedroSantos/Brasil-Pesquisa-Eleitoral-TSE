const AdmZip = require('adm-zip');
const iconv = require('iconv-lite');

const DATA_URL = 'https://cdn.tse.jus.br/estatistica/sead/odsele/pesquisa_eleitoral/pesquisa_eleitoral_2026.zip';
const CACHE_TTL = 15 * 60 * 1000;
let cache = null;
let cacheAt = 0;

function parseCsv(text, delimiter) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === '"') {
      if (quoted && text[index + 1] === '"') { field += '"'; index += 1; }
      else quoted = !quoted;
    } else if (char === delimiter && !quoted) {
      row.push(field); field = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && text[index + 1] === '\n') index += 1;
      row.push(field); field = '';
      if (row.some(Boolean)) rows.push(row);
      row = [];
    } else field += char;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}

function penalty(value) {
  const text = String(value || '');
  return (text.match(/�/g) || []).length * 30 + (text.match(/(?:Ã.|Â.|â.)/g) || []).length * 8 + (text.match(/\u0000/g) || []).length * 50;
}

function repair(value) {
  const text = String(value || '');
  if (!/[ÃÂâ]/.test(text)) return text;
  try {
    const repaired = iconv.decode(Buffer.from(text, 'latin1'), 'utf8');
    return penalty(repaired) < penalty(text) ? repaired : text;
  } catch { return text; }
}

function cleanKey(value) { return repair(value).replace(/^\uFEFF/, '').trim().toUpperCase(); }
function cleanValue(value) {
  const result = repair(value).trim();
  return ['#NULO#', '#NULO', '#NE#', '#NE', '-1'].includes(result.toUpperCase()) ? '' : result;
}
function first(record, aliases) {
  for (const alias of aliases) if (cleanValue(record[alias])) return cleanValue(record[alias]);
  return '';
}
function patternValue(record, pattern) {
  for (const [key, value] of Object.entries(record)) if (pattern.test(key) && cleanValue(value)) return cleanValue(value);
  return '';
}
function normalizeOffice(value) {
  const office = String(value || '').toUpperCase();
  if (office.includes('PRESIDENT')) return 'Presidente';
  if (office.includes('GOVERN')) return 'Governador';
  if (office.includes('SENADOR')) return 'Senador';
  if (office.includes('DEPUTADO FEDERAL')) return 'Deputado Federal';
  if (office.includes('DEPUTADO ESTADUAL')) return 'Deputado Estadual';
  if (office.includes('DEPUTADO DISTRITAL')) return 'Deputado Distrital';
  return value ? value.replace(/\b\w/g, (letter) => letter.toUpperCase()) : 'Não identificado';
}
function normalizeDate(value) {
  const raw = String(value || '').trim();
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;
  const br = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  return br ? `${br[1]}/${br[2]}/${br[3]}` : raw;
}
function dateKey(value) {
  const match = String(value || '').match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : String(value || '');
}

function normalizeRecord(raw, fallbackUf, sourceFile, sourceRow) {
  const registry = first(raw, [
    'NR_PROTOCOLO_REGISTRO', 'NR_REGISTRO_PESQUISA', 'NR_PESQUISA', 'NR_REGISTRO',
    'NUMERO_PESQUISA', 'NUMERO_REGISTRO', 'CD_PESQUISA', 'DS_PROTOCOLO_REGISTRO'
  ]) || patternValue(raw, /PROTOCOLO.*REGISTRO|REGISTRO.*PESQUISA|PESQUISA.*REGISTRO|^NR_.*PESQUISA$/);
  const officeRaw = first(raw, ['DS_CARGO','DS_CARGO_PESQUISADO','CARGO','NM_CARGO']) || patternValue(raw, /CARGO/);
  const uf = first(raw, ['SG_UF','UF','SG_UF_PESQUISA']) || fallbackUf;
  const municipality = first(raw, ['NM_MUNICIPIO','MUNICIPIO','NM_LOCALIDADE']);
  const electionUnit = first(raw, ['NM_UE','DS_UNIDADE_ELEITORAL']);
  const stateName = first(raw, ['NM_UF','NM_ESTADO']);
  const location = municipality || electionUnit || stateName || (uf === 'BR' ? 'Brasil' : '');
  const institute = first(raw, ['NM_EMPRESA','NM_INSTITUTO','NM_RAZAO_SOCIAL','EMPRESA','INSTITUTO','NM_EMPRESA_CONTRATADA']) || patternValue(raw, /NM_.*EMPRESA|NM_.*INSTITUTO|RAZAO_SOCIAL/);
  const company = first(raw, ['NR_CNPJ_EMPRESA','CNPJ_EMPRESA','NR_CNPJ_INSTITUTO']) || patternValue(raw, /CNPJ.*EMPRESA|EMPRESA.*CNPJ|CNPJ.*INSTITUTO/);
  const contractor = first(raw, ['NM_CONTRATANTE','NM_PESSOA_CONTRATANTE','NM_RAZAO_SOCIAL_CONTRATANTE','NM_CONTRATANTE_PESQUISA']) || patternValue(raw, /NM_.*CONTRATANTE|CONTRATANTE.*RAZAO|CONTRATANTE.*NOME/);
  const contractorDocument = first(raw, ['NR_CPF_CNPJ_CONTRATANTE','NR_CNPJ_CONTRATANTE','NR_CPF_CONTRATANTE','CPF_CNPJ_CONTRATANTE']) || patternValue(raw, /CPF.*CONTRATANTE|CNPJ.*CONTRATANTE|CONTRATANTE.*DOCUMENTO/);
  const fieldStart = normalizeDate(first(raw, ['DT_INICIO_PESQUISA','DT_INICIO','DATA_INICIO','DT_INICIO_CAMPO']) || patternValue(raw, /DT_.*INICIO|DATA_.*INICIO/));
  const fieldEnd = normalizeDate(first(raw, ['DT_FIM_PESQUISA','DT_FIM','DATA_FIM','DT_FIM_CAMPO']) || patternValue(raw, /DT_.*FIM|DATA_.*FIM/));
  const publication = normalizeDate(first(raw, ['DT_DIVULGACAO','DT_PUBLICACAO','DATA_DIVULGACAO']) || patternValue(raw, /DIVULGACAO|PUBLICACAO/));
  const sample = first(raw, ['QT_ENTREVISTADOS','QT_PESSOAS_ENTREVISTADAS','TAMANHO_AMOSTRA','QT_AMOSTRA']) || patternValue(raw, /ENTREVIST|AMOSTRA/);
  const margin = first(raw, ['VR_MARGEM_ERRO','MARGEM_ERRO','DS_MARGEM_ERRO']);
  const status = first(raw, ['DS_SITUACAO_PESQUISA','DS_SITUACAO','SITUACAO']) || patternValue(raw, /SITUACAO/);
  const scope = first(raw, ['DS_ABRANGENCIA','TP_ABRANGENCIA','ABRANGENCIA']);
  const amount = first(raw, ['VR_PESQUISA','VR_CONTRATO','VALOR_PESQUISA','VALOR_CONTRATO']) || patternValue(raw, /VR_.*PESQUISA|VALOR.*PESQUISA|VR_.*CONTRATO/);
  const statistician = first(raw, ['NM_ESTATISTICO','NM_ESTATISTICO_RESPONSAVEL','NM_RESPONSAVEL_ESTATISTICO']) || patternValue(raw, /NM_.*ESTATIST|ESTATIST.*RESPONSAVEL/);
  const statisticianRegistry = first(raw, ['NR_REGISTRO_ESTATISTICO','NR_CONRE','REGISTRO_ESTATISTICO']) || patternValue(raw, /REGISTRO.*ESTATIST|NR_.*CONRE/);
  const methodology = first(raw, ['DS_METODOLOGIA','METODOLOGIA','DS_PLANO_AMOSTRAL','DS_METODO_PESQUISA']) || patternValue(raw, /METODOLOGIA|PLANO.*AMOSTRAL|METODO.*PESQUISA/);
  return {
    registry, office: normalizeOffice(officeRaw), uf, location, institute, company, contractor,
    contractorDocument, fieldStart, fieldEnd, publication, sample, margin, status: status || 'Registrada',
    scope, amount, statistician, statisticianRegistry, methodology, sourceFile, sourceRow
  };
}

function recordKey(record) {
  const registry = String(record.registry || '').trim().toUpperCase();
  if (registry) return `REGISTRY|${registry}`;
  return `ROW|${record.sourceFile}|${record.sourceRow}`;
}

async function loadRegistry() {
  if (cache && Date.now() - cacheAt < CACHE_TTL) return cache;
  const response = await fetch(DATA_URL, { headers: { 'User-Agent': 'Pesquisas-Eleitorais-2026/5.0' }, cache: 'no-store' });
  if (!response.ok) throw new Error(`TSE respondeu HTTP ${response.status}`);
  const zip = new AdmZip(Buffer.from(await response.arrayBuffer()));
  const entries = zip.getEntries().filter((entry) => !entry.isDirectory && entry.entryName.toLowerCase().endsWith('.csv'));
  if (!entries.length) throw new Error('CSVs de pesquisas não encontrados no arquivo do TSE.');

  const seen = new Set();
  const records = [];
  const headersByFile = {};
  let rawRows = 0;
  let duplicateRows = 0;
  let missingRegistry = 0;

  for (const entry of entries) {
    const raw = entry.getData();
    const utf8 = iconv.decode(raw, 'utf8');
    const latin1 = iconv.decode(raw, 'latin1');
    const text = penalty(utf8) <= penalty(latin1) ? utf8 : latin1;
    const firstLine = text.split(/\r?\n/, 1)[0] || '';
    const delimiter = (firstLine.match(/;/g) || []).length >= (firstLine.match(/,/g) || []).length ? ';' : ',';
    const rows = parseCsv(text, delimiter);
    const headers = (rows.shift() || []).map(cleanKey);
    headersByFile[entry.entryName] = headers;
    const ufMatch = entry.entryName.match(/_([A-Z]{2}|BR)\.csv$/i);
    const fallbackUf = ufMatch ? ufMatch[1].toUpperCase() : '';

    rows.forEach((values, index) => {
      rawRows += 1;
      const rawRecord = Object.fromEntries(headers.map((header, column) => [header, values[column] || '']));
      const record = normalizeRecord(rawRecord, fallbackUf, entry.entryName, index + 2);
      if (!record.registry) missingRegistry += 1;
      const key = recordKey(record);
      if (seen.has(key)) { duplicateRows += 1; return; }
      seen.add(key);
      records.push(record);
    });
  }

  records.sort((a, b) => dateKey(b.publication || b.fieldEnd).localeCompare(dateKey(a.publication || a.fieldEnd)) || String(a.registry).localeCompare(String(b.registry)));
  const byOffice = records.reduce((acc, item) => { acc[item.office] = (acc[item.office] || 0) + 1; return acc; }, {});
  const byUf = records.reduce((acc, item) => { const key = item.uf || 'BR'; acc[key] = (acc[key] || 0) + 1; return acc; }, {});
  cache = {
    records,
    meta: {
      total: records.length,
      rawRows,
      uniqueRecords: records.length,
      duplicateRows,
      missingRegistry,
      complete: records.length + duplicateRows === rawRows,
      truncated: false,
      byOffice,
      byUf,
      source: DATA_URL,
      generatedAt: new Date().toISOString(),
      files: entries.map((entry) => entry.entryName),
      headersByFile,
      dedupe: 'número oficial do registro; na ausência, arquivo+linha sem descarte silencioso'
    }
  };
  cacheAt = Date.now();
  return cache;
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
