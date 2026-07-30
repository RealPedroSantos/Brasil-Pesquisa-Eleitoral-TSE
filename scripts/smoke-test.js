const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function main() {
  const publicDir = path.join(process.cwd(), 'public');
  const html = fs.readFileSync(path.join(publicDir, 'index.html'), 'utf8');
  const polls = fs.readFileSync(path.join(publicDir, 'polls-data.js'), 'utf8');
  const extraPolls = fs.readFileSync(path.join(publicDir, 'polls-data-extra.js'), 'utf8');
  const dashboard = fs.readFileSync(path.join(publicDir, 'dashboard.js'), 'utf8');

  const dom = new JSDOM(html, { runScripts: 'outside-only', url: 'https://example.test/#overview', pretendToBeVisual: true });
  const { window } = dom;
  window.scrollTo = () => {};
  window.HTMLElement.prototype.scrollIntoView = () => {};
  window.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {} });
  window.HTMLDialogElement.prototype.showModal = function showModal() { this.open = true; };
  window.HTMLDialogElement.prototype.close = function close() { this.open = false; };

  const registryFixture = {
    registry: 'BR-00001/2026', office: 'Presidente', uf: 'BR', location: 'Brasil', institute: 'Instituto Teste',
    company: '00.000.000/0001-00', contractor: 'Contratante Teste', contractorDocument: '11.111.111/0001-11',
    fieldStart: '01/07/2026', fieldEnd: '03/07/2026', publication: '05/07/2026', sample: '2.000', margin: '±2 p.p.',
    status: 'Registrada', scope: 'Brasil', amount: 'R$ 100.000,00', statistician: 'Profissional Teste',
    statisticianRegistry: 'CONRE 0000', methodology: 'Pesquisa quantitativa por amostragem.',
    sourceFile: 'pesquisa_eleitoral_2026_BR.csv', sourceRow: 2
  };

  window.fetch = async () => ({
    ok: true,
    async json() {
      return {
        ok: true,
        records: [registryFixture],
        meta: {
          total: 1, rawRows: 1, uniqueRecords: 1, duplicateRows: 0, missingRegistry: 0,
          complete: true, truncated: false, byOffice: { Presidente: 1 }, byUf: { BR: 1 },
          source: 'https://cdn.tse.jus.br/estatistica/sead/odsele/pesquisa_eleitoral/pesquisa_eleitoral_2026.zip'
        }
      };
    }
  });

  const errors = [];
  window.addEventListener('error', (event) => errors.push(event.error || event.message));
  window.console.error = (...args) => errors.push(args.join(' '));

  window.eval(polls);
  window.eval(extraPolls);
  assert(window.POLL_RESULTS?.polls?.length >= 55, 'Catálogo expandido não foi carregado.');
  window.eval(dashboard);
  window.document.dispatchEvent(new window.Event('DOMContentLoaded', { bubbles: true }));
  await new Promise((resolve) => window.setTimeout(resolve, 220));

  const overview = window.document.getElementById('overview');
  const presidentialChart = overview?.querySelector('svg[aria-label="Gráfico de pesquisas eleitorais"]');
  assert(overview?.textContent.includes('Pesquisa por pesquisa'), 'Visão geral não renderizou.');
  assert(presidentialChart?.querySelectorAll('.chart-point').length >= 12, 'Gráfico presidencial não renderizou os pontos.');
  assert(presidentialChart.dataset.timelineValidation === 'verified-v2', 'Gráfico presidencial não usa o renderizador final.');
  assert(presidentialChart.dataset.timelineScale === 'proportional-date', 'Eixo temporal não é proporcional às datas.');
  assert(presidentialChart.dataset.portraitRailInside === 'disabled', 'Trilho externo de fotos ainda está ativo.');
  assert(!presidentialChart.querySelector('.chart-photo-connector, .chart-photo-rail'), 'Conectores ou trilhos externos ainda foram desenhados.');

  presidentialChart.querySelectorAll('.chart-series-line').forEach((line) => {
    assert(line.dataset.seriesScenario, 'Linha sem assinatura de cenário comparável.');
    const xs = [...String(line.getAttribute('d') || '').matchAll(/[ML]\s+([\d.]+)/g)].map((match) => Number(match[1]));
    assert(new Set(xs).size === xs.length, 'Uma linha conecta pesquisas na mesma data.');
  });

  const clipRect = presidentialChart.querySelector('clipPath rect');
  assert(clipRect, 'Área de recorte do gráfico não existe.');
  const minX = Number(clipRect.getAttribute('x'));
  const maxX = minX + Number(clipRect.getAttribute('width'));
  presidentialChart.querySelectorAll('.chart-point').forEach((point) => {
    const cx = Number(point.getAttribute('cx'));
    assert(cx >= minX && cx <= maxX, 'Ponto ultrapassou os limites do gráfico.');
  });

  const officeSections = overview.querySelectorAll('[data-overview-office]');
  assert(officeSections.length === 5, `Visão geral deveria mostrar 5 categorias, mas mostrou ${officeSections.length}.`);
  officeSections.forEach((section) => {
    const chart = section.querySelector('[data-office-parity-chart]');
    assert(chart, 'Categoria sem gráfico estadual/federal.');
    assert(chart.dataset.timelineValidation === 'verified-v2', 'Categoria não usa renderizador final.');
    assert(!chart.querySelector('.chart-photo-connector, .chart-photo-rail'), 'Categoria ainda contém trilho externo de fotos.');
  });

  assert(window.document.documentElement.dataset.registryValidation === 'passed-twice', 'Base oficial não passou pelas duas validações.');
  assert(window.__POLL_SYSTEM_VALIDATION__?.officialRecords === 1, 'Contagem validada da base oficial está incorreta.');

  window.document.querySelector('[data-view="registry"]')?.click();
  await new Promise((resolve) => window.setTimeout(resolve, 50));
  const registryRow = window.document.querySelector('#registry tr[data-registry-document]');
  assert(registryRow, 'Registro oficial não foi utilizado na página de integridade.');

  const chamberSimulation = overview.querySelector('[data-seat-simulation="chamber"]');
  assert(chamberSimulation?.querySelectorAll('svg circle').length === 513, 'Simulação da Câmara perdeu as 513 cadeiras.');

  if (errors.length) throw new Error(`Erros de execução: ${errors.map(String).join(' | ')}`);
  window.close();
  process.stdout.write('Smoke test: gráficos temporais, limites, cenários e base oficial validada duas vezes: OK\n');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
