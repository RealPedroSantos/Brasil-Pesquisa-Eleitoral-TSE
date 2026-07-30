const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const wait = (window, ms = 120) => new Promise((resolve) => window.setTimeout(resolve, ms));

async function main() {
  const root = process.cwd();
  const publicDir = path.join(root, 'public');
  const html = fs.readFileSync(path.join(publicDir, 'index.html'), 'utf8');
  const polls = fs.readFileSync(path.join(publicDir, 'polls-data.js'), 'utf8');
  const extraPolls = fs.readFileSync(path.join(publicDir, 'polls-data-extra.js'), 'utf8');
  const dashboard = fs.readFileSync(path.join(publicDir, 'dashboard.js'), 'utf8');
  const complete = fs.readFileSync(path.join(publicDir, 'elections-2026-complete.js'), 'utf8');
  const sectionApi = fs.readFileSync(path.join(root, 'api', 'election-section-detail.js'), 'utf8');

  const requiredStaticMarkers = [
    'data-elections-complete-root',
    '2022 × 2026',
    'Comparecimento',
    'Zonas eleitorais',
    'data-e26-section-button',
    '/api/election-section-detail',
    'Bairro ainda não associado pela fonte',
    'Nenhum voto de seção é simulado'
  ];
  for (const marker of requiredStaticMarkers) {
    const found = complete.includes(marker) || sectionApi.includes(marker);
    if (!found) throw new Error(`Marcador obrigatório ausente na central final: ${marker}`);
  }
  if (!html.includes('<script src="elections-2026-complete.js"></script>')) throw new Error('A camada final não está carregada no HTML.');
  if (!sectionApi.includes('-aux.json') || !sectionApi.includes('.imgbu') || !sectionApi.includes('.rdv')) throw new Error('Endpoint de seção não referencia os artefatos oficiais da urna.');

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
    sectionsTotalized: 472075,
    sectionsTotal: 472075,
    electorate: 156454011,
    turnout: 123682372,
    abstentions: 32770982,
    validVotes: 118229719,
    blankVotes: 1964779,
    nullVotes: 3487874,
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
      { type: 'Feature', properties: { sigla: 'SP' }, geometry: { type: 'Polygon', coordinates: [[[-52, -25], [-44, -25], [-44, -20], [-52, -20], [-52, -25]]] } },
      { type: 'Feature', properties: { sigla: 'RJ' }, geometry: { type: 'Polygon', coordinates: [[[-44, -24], [-40, -24], [-40, -21], [-44, -21], [-44, -24]]] } }
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
    if (target.includes('/api/election-section-detail')) {
      return {
        ok: true,
        async json() {
          return {
            ok: true,
            year: 2022,
            round: 1,
            uf: 'RJ',
            municipality: '58378',
            zone: '0104',
            section: '0001',
            status: 'available',
            candidates: [
              { name: 'JAIR BOLSONARO', party: 'PL', number: '22', votes: 176, percentage: 55.7 },
              { name: 'LULA', party: 'PT', number: '13', votes: 140, percentage: 44.3 }
            ],
            files: [
              { filename: 'p000406-rj-m58378-z0104-s0001.imgbu', type: 'Imagem do Boletim de Urna', url: 'https://resultados.tse.jus.br/oficial/teste.imgbu' },
              { filename: 'p000406-rj-m58378-z0104-s0001.rdv', type: 'Registro Digital do Voto', url: 'https://resultados.tse.jus.br/oficial/teste.rdv' }
            ],
            sourceUrl: 'https://resultados.tse.jus.br/oficial/teste-aux.json',
            tseResultsUrl: 'https://resultados.tse.jus.br/oficial/app/index.html',
            note: 'Votos da seção extraídos de arquivo JSON oficial do TSE.'
          };
        }
      };
    }
    if (target.includes('action=status')) {
      return { ok: true, async json() { return { ok: true, live: false, phase: 'pre-election', electionDate: '2026-10-04' }; } };
    }
    if (target.includes('action=summary') && target.includes('year=2026')) {
      return { ok: true, async json() { return { ok: true, live: false, waiting: true, year: 2026, round: 1, cargo: 'president', scope: 'BR', candidates: [] }; } };
    }
    if (target.includes('action=summary') && target.includes('year=2022')) {
      return { ok: true, async json() { return historical; } };
    }
    if (target.includes('action=states')) {
      return {
        ok: true,
        async json() {
          return {
            ok: true,
            states: [
              { uf: 'SP', available: true, winner: historical.candidates[1], candidates: historical.candidates },
              { uf: 'RJ', available: true, winner: historical.candidates[0], candidates: historical.candidates }
            ]
          };
        }
      };
    }
    if (target.includes('action=municipalities')) {
      return { ok: true, async json() { return { ok: true, municipalities: [{ uf: 'RJ', code: '58378', name: 'ITABORAÍ', zones: ['0104', '0151'] }] }; } };
    }
    if (target.includes('action=municipality')) {
      return {
        ok: true,
        async json() {
          return {
            ok: true,
            municipality: { type: 'MU', code: '58378', name: 'ITABORAÍ', candidates: historical.candidates },
            zones: [
              { type: 'ZONA', code: '0104', name: '', candidates: historical.candidates },
              { type: 'ZONA', code: '0151', name: '', candidates: historical.candidates.slice().reverse() }
            ]
          };
        }
      };
    }
    if (target.includes('action=sections')) {
      return {
        ok: true,
        async json() {
          return {
            ok: true,
            sections: [
              { municipality: '58378', municipalityName: 'ITABORAÍ', zone: '0104', section: '0001', originalSection: '0001', location: '', neighborhood: '' },
              { municipality: '58378', municipalityName: 'ITABORAÍ', zone: '0104', section: '0002', originalSection: '0002', location: '', neighborhood: '' }
            ]
          };
        }
      };
    }
    return { ok: false, async json() { return { ok: false, error: `URL não simulada: ${target}` }; } };
  };

  const errors = [];
  window.addEventListener('error', (event) => errors.push(event.error || event.message));
  window.console.error = (...args) => errors.push(args.join(' '));

  window.eval(polls);
  window.eval(extraPolls);
  window.eval(dashboard);
  window.eval(complete);
  window.document.dispatchEvent(new window.Event('DOMContentLoaded', { bubbles: true }));
  await wait(window, 700);

  let page = window.document.getElementById('elections2026');
  if (!page || page.classList.contains('hidden')) throw new Error('Página Eleições 2026 não abriu pelo hash.');
  if (!page.querySelector('[data-elections-complete-root]')) throw new Error('A camada completa não assumiu a página.');
  if (!page.textContent.includes('Aguardando abertura da apuração 2026')) throw new Error('Estado pré-apuração não foi informado.');
  if (!page.textContent.includes('Resultado final de 2022')) throw new Error('Comparação histórica de 2022 ausente.');
  if (page.querySelectorAll('[data-e26-chart]').length !== 3) throw new Error('Os três modos de gráfico não foram renderizados.');
  if (!page.textContent.includes('2022 × 2026') || !page.textContent.includes('Comparecimento') || !page.textContent.includes('Zonas eleitorais')) throw new Error('Rótulos dos gráficos estão incompletos.');
  if (page.querySelectorAll('[data-election-complete-photo]').length < 3) throw new Error('Fotos ou fallbacks dos candidatos históricos ausentes.');
  if (page.querySelectorAll('[data-e26-map-uf]').length !== 2) throw new Error('Mapa estadual clicável não foi renderizado.');

  page.querySelector('[data-e26-chart="participation"]')?.click();
  await wait(window, 40);
  page = window.document.getElementById('elections2026');
  if (page.querySelectorAll('[data-e26-donut]').length !== 2) throw new Error('Gráficos animados de comparecimento não foram criados.');

  const year = page.querySelector('[data-e26-year]');
  year.value = '2022';
  year.dispatchEvent(new window.Event('change', { bubbles: true }));
  await wait(window, 450);

  page = window.document.getElementById('elections2026');
  const uf = page.querySelector('[data-e26-uf]');
  uf.value = 'rj';
  uf.dispatchEvent(new window.Event('change', { bubbles: true }));
  await wait(window, 600);

  page = window.document.getElementById('elections2026');
  const municipality = page.querySelector('[data-e26-municipality]');
  if (!municipality || ![...municipality.options].some((option) => option.value === '58378')) throw new Error('Município de Itaboraí não foi carregado.');
  municipality.value = '58378';
  municipality.dispatchEvent(new window.Event('change', { bubbles: true }));
  await wait(window, 350);

  page = window.document.getElementById('elections2026');
  const zone = page.querySelector('[data-e26-zone]');
  if (!zone || ![...zone.options].some((option) => option.value === '0104')) throw new Error('Zona 0104 não foi carregada.');
  zone.value = '0104';
  zone.dispatchEvent(new window.Event('change', { bubbles: true }));
  await wait(window, 350);

  page = window.document.getElementById('elections2026');
  if (page.querySelectorAll('[data-e26-section-button]').length !== 2) throw new Error('Seções eleitorais não foram listadas.');
  if (!page.textContent.includes('Bairro ainda não associado pela fonte')) throw new Error('Limite de cobertura por bairro não foi informado com transparência.');

  page.querySelector('[data-e26-section-button="0001"]')?.click();
  await wait(window, 400);
  page = window.document.getElementById('elections2026');
  if (!page.textContent.includes('Zona 0104 · Seção 0001')) throw new Error('Detalhe individual da seção não abriu.');
  if (!page.textContent.includes('Imagem do Boletim de Urna') || !page.textContent.includes('Registro Digital do Voto')) throw new Error('Artefatos oficiais do Boletim de Urna não foram exibidos.');
  if (!page.textContent.includes('176 votos')) throw new Error('Votos estruturados da seção não foram renderizados quando disponíveis.');

  page.querySelector('[data-e26-chart="zones"]')?.click();
  await wait(window, 40);
  page = window.document.getElementById('elections2026');
  if (page.querySelectorAll('[data-e26-zone-button]').length !== 2) throw new Error('Gráfico interativo por zonas não foi renderizado.');

  if (errors.length) throw new Error(`Erros de execução: ${errors.map(String).join(' | ')}`);
  window.close();
  process.stdout.write('Teste completo Eleições 2026: gráficos, mapa, municípios, zonas, seções e BU: OK\n');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
