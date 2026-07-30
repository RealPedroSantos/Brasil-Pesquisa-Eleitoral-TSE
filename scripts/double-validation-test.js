const fs = require('node:fs');
const path = require('node:path');

function read(file) {
  return fs.readFileSync(path.join(process.cwd(), file), 'utf8');
}

function assert(condition, message) {
  if (!condition) throw new Error(`VALIDAÇÃO DUPLA: ${message}`);
}

const dashboard = read('public/dashboard.js');
const api = read('api/tse-registry-v2.js');
const finalRenderer = read('dashboard-parts/part-05z-final-integrity.txt');
const finalRegistry = read('dashboard-parts/part-05zz-double-validation.txt');

// Validação 1: integridade estrutural dos gráficos.
assert(dashboard.includes("timelineValidation = 'verified-v2'"), 'renderizador final não foi incorporado ao bundle.');
assert(dashboard.includes("timelineScale = 'proportional-date'"), 'eixo temporal proporcional não está ativo.');
assert(dashboard.includes("portraitRailInside = 'disabled'"), 'trilho de retratos ainda pode ser ativado.');
assert(finalRenderer.includes("verifiedTimelineScenarioKey(item)"), 'cenários não possuem chave própria.');
assert(finalRenderer.includes("uniqueDates.size === sorted.length"), 'pesquisas na mesma data ainda podem formar linha.');
assert(finalRenderer.includes("scenario") && finalRenderer.includes("candidates"), 'a comparabilidade não considera cenário e composição.');
assert(!/svgEl\([^\n]*chart-photo-connector/.test(finalRenderer), 'o renderizador final ainda cria conectores externos.');
assert(!finalRenderer.includes("chart-candidate-photo-border"), 'o renderizador final ainda posiciona retratos sobre o gráfico.');

// Validação 2: completude da importação oficial de 2026.
assert(api.includes("'NR_PROTOCOLO_REGISTRO'"), 'cabeçalho oficial de protocolo não é reconhecido.');
assert(api.includes("return `ROW|${record.sourceFile}|${record.sourceRow}`"), 'linhas sem protocolo ainda podem ser descartadas por colisão.');
assert(api.includes('truncated: false'), 'a API não declara explicitamente ausência de truncamento.');
assert(api.includes('records.length + duplicateRows === rawRows'), 'a reconciliação entre linhas brutas e registros não existe.');
assert(finalRegistry.includes('meta.truncated === false'), 'o cliente não bloqueia resposta truncada.');
assert(finalRegistry.includes('new Set(identities).size === records.length'), 'o cliente não valida identidades duplicadas.');
assert(finalRegistry.includes("dataset.registryValidation = 'passed-twice'"), 'o resultado das duas validações não fica exposto na produção.');

console.log('Validação dupla concluída: gráficos e base oficial de 2026 passaram nas verificações estruturais.');
