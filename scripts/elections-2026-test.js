const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

async function main() {
  const publicDir = path.join(process.cwd(), 'public');
  const html = fs.readFileSync(path.join(publicDir, 'index.html'), 'utf8');
  const polls = fs.readFileSync(path.join(publicDir, 'polls-data.js'), 'utf8');
  const extraPolls = fs.readFileSync(path.join(publicDir, 'polls-data-extra.js'), 'utf8');
  const dashboard = fs.readFileSync(path.join(publicDir, 'dashboard.js'), 'utf8');

  const dom = new JSDOM(html, {
    runScripts: 'outside-only',
    url: 'https://example.test/#elections2026',
    pretendToBeVisual: true
  });

  const { window } = dom;
  window.scrollTo = () => {};
  window.HTMLElement.prototype.scrollIntoView = () => {};
  window.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {} });
  window.HTMLDialogElement.prototype.showModal = function showModal() { this.open = true; };
  window.HTMLDialogElement.prototype.close = function close() { this.open = false; };

  const historical = {
    ok: true,
    live: false,
    year: 2022,
    round: 1,
    cargo: 'president',
    scope: 'BR',
    updatedDate: '02/10/2022',
    updatedTime: '23:59:59',
    sectionsPercentage: 100,
    candidates: [
      { name: 'LULA', party: 'PT', number: '13', votes: 57258115, percentage: 48.43 },
      { name: 'JAIR BOLSONARO', party: 'PL', number: '22', votes: 51071277, percentage: 43.2 },
      { name: 'SIMONE TEBET', party: 'MDB', number: '15', votes: 4915306, percentage: 4.16 }
    ],
    sourceUrl: 'https://resultados.tse.jus.br/oficial/ele2022/544/dados-simplificados/br/br-c0001-e000544-r.json'
  };

  const map = {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', properties: { sigla: 'SP' }, geometry: { type: 'Polygon', coordinates: [[[-52,-25],[-44,-25],[-44,-20],[-52,-20],[-52,-25]]] } },
      { type: 'Feature', properties: { sigla: 'RJ' }, geometry: { type: 'Polygon', coordinates: [[[-44,-24],[-40,-24],[-40,-21],[-44,-21],[-44,-24]]] } }
    ]
  };

  window.fetch = async (url) => {
    const target = String(url);
    if (target.startsWith('/api/tse-registry-v2')) {
      return { ok: true, async json() { return { ok: true, records: [], meta: { total: 0, byOffice: {}, byUf: {} } }; } };
    }
    if (target === '/api/brazil-map') {
      return { ok: true, async json() { return map; } };
    }
    if (target.includes('/api/election-results?action=status')) {
      return { ok: true, async json() { return { ok: true, live: false, phase: 'pre-election', electionDate: '2026-10-04' }; } };
    }
    if (target.includes('action=summary') && target.includes('year=2026')) {
      return { ok: true, async json() { return { ok: true, live: false, waiting: true, year: 2026, round: 1, cargo: 'president', scope: 'BR', candidates: [] }; } };
    }
    if (target.includes('action=summary') && target.includes('year=2022')) {
      return { ok: true, async json() { return historical; } };
    }
    if (target.includes('action=states')) {
      return { ok: true, async json() { return { ok: true, states: [
        { uf: 'SP', available: true, winner: historical.candidates[1], candidates: historical.candidates },
        { uf: 'RJ', available: true, winner: historical.candidates[0], candidates: historical.candidates }
      ] }; } };
    }
    if (target.includes('action=municipalities')) {
      return { ok: true, async json() { return { ok: true, municipalities: [{ uf: 'RJ', code: '60011', name: 'Rio de Janeiro' }] }; } };
    }
    if (target.includes('action=municipality')) {
      return { ok: true, async json() { return { ok: true, municipality: { type: 'MU', code: '60011', name: 'Rio de Janeiro', candidates: historical.candidates }, zones: [{ type: 'ZE', code: '0004', name: 'Zona 4', candidates: historical.candidates }] }; } };
    }
    if (target.includes('action=sections')) {
      return { ok: true, async json() { return { ok: true, sections: [{ municipality: '60011', zone: '0004', section: '0123', location: 'Escola Municipal Teste', neighborhood: 'Centro' }] }; } };
    }
    return { ok: false, async json() { return { ok: false, error: `URL não simulada: ${target}` }; } };
  };

  const errors = [];
  window.addEventListener('error', (event) => errors.push(event.error || event.message));
  window.console.error = (...args) => errors.push(args.join(' '));

  window.eval(polls);
  window.eval(extraPolls);
  window.eval(dashboard);
  window.document.dispatchEvent(new window.Event('DOMContentLoaded', { bubbles: true }));
  await new Promise((resolve) => window.setTimeout(resolve, 350));

  const page = window.document.getElementById('elections2026');
  if (!page || page.classList.contains('hidden')) throw new Error('Página Eleições 2026 não abriu pelo hash.');
  if (!page.textContent.includes('Eleições 2026')) throw new Error('Título da nova página ausente.');
  if (!page.textContent.includes('Aguardando abertura da apuração 2026')) throw new Error('Estado pré-apuração não foi informado.');
  if (!page.textContent.includes('Última eleição · 2022')) throw new Error('Comparação com a eleição anterior ausente.');
  if (page.querySelectorAll('[data-election-candidate-index]').length < 3) throw new Error('Candidatos históricos com fotos não foram renderizados.');
  if (!page.querySelector('[data-election-map]')) throw new Error('Mapa interativo estadual não foi renderizado.');
  if (page.querySelectorAll('[data-election-map-uf]').length !== 2) throw new Error('Estados clicáveis não foram criados no mapa.');
  if (!page.querySelector('[data-election-year]') || !page.querySelector('[data-election-cargo]') || !page.querySelector('[data-election-uf]')) throw new Error('Filtros principais da apuração estão incompletos.');

  const yearSelect = page.querySelector('[data-election-year]');
  yearSelect.value = '2022';
  yearSelect.dispatchEvent(new window.Event('change', { bubbles: true }));
  await new Promise((resolve) => window.setTimeout(resolve, 180));

  const refreshed = window.document.getElementById('elections2026');
  if (!refreshed.textContent.includes('Resultado histórico')) throw new Error('Troca para a base de 2022 falhou.');

  const candidateButton = refreshed.querySelector('[data-election-candidate-index="0"]');
  candidateButton?.click();
  await new Promise((resolve) => window.setTimeout(resolve, 20));
  if (!window.document.getElementById('pollDialog')?.open) throw new Error('Detalhes do candidato não abriram ao clicar.');
  if (!window.document.getElementById('dialogBody')?.textContent.includes('57.258.115')) throw new Error('Quantidade de votos não apareceu no detalhe.');

  if (errors.length) throw new Error(`Erros de execução: ${errors.map(String).join(' | ')}`);
  window.close();
  process.stdout.write('Teste da central Eleições 2026, histórico, fotos, mapa e filtros: OK\n');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
