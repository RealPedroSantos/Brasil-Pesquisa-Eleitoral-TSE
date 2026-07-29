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
    url: 'https://example.test/#overview',
    pretendToBeVisual: true
  });

  const { window } = dom;
  window.scrollTo = () => {};
  window.HTMLElement.prototype.scrollIntoView = () => {};
  window.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {} });
  window.HTMLDialogElement.prototype.showModal = function showModal() { this.open = true; };
  window.HTMLDialogElement.prototype.close = function close() { this.open = false; };
  window.fetch = async () => ({
    ok: true,
    async json() {
      return { ok: true, records: [], meta: { total: 0, byOffice: {}, byUf: {} } };
    }
  });

  const errors = [];
  window.addEventListener('error', (event) => errors.push(event.error || event.message));
  window.console.error = (...args) => errors.push(args.join(' '));

  window.eval(polls);
  window.eval(extraPolls);
  if (!window.POLL_RESULTS || window.POLL_RESULTS.polls.length < 55) throw new Error('Catálogo expandido não foi carregado.');
  if (!window.POLL_RESULTS.polls.some((poll) => poll.id === 'datafolha-2026-06-20-r1-principal')) throw new Error('Datafolha de 20/06 ausente.');
  if (!window.POLL_RESULTS.polls.some((poll) => poll.id === 'nexus-2026-07-27-r2-lula-caiado')) throw new Error('Cenário Nexus Lula × Caiado ausente.');

  window.eval(dashboard);
  window.document.dispatchEvent(new window.Event('DOMContentLoaded', { bubbles: true }));
  await new Promise((resolve) => window.setTimeout(resolve, 80));

  const overview = window.document.getElementById('overview');
  const chart = overview?.querySelector('svg[aria-label="Gráfico de pesquisas eleitorais"]');
  if (!overview?.textContent.includes('Pesquisa por pesquisa')) throw new Error('Visão geral não renderizou.');
  if (!chart || chart.querySelectorAll('.chart-point').length < 12) throw new Error('Gráfico presidencial não renderizou a série expandida.');
  if (chart.querySelectorAll('.chart-candidate-photo').length < 8) throw new Error('Fotos não foram colocadas nas linhas do gráfico.');
  if (overview.querySelectorAll('.candidate-photo-card img[data-candidate-photo]').length < 8) throw new Error('Seletor com fotos dos candidatos não renderizou.');
  if (overview.querySelectorAll('.chart-ranking-row img[data-candidate-photo]').length < 8) throw new Error('Ranking lateral com fotos não renderizou.');

  const officeSections = overview.querySelectorAll('[data-overview-office]');
  if (officeSections.length !== 5) throw new Error(`Visão geral contínua deveria mostrar 5 categorias, mas mostrou ${officeSections.length}.`);
  ['governors', 'senate', 'chamber', 'assemblies', 'district'].forEach((id) => {
    if (!overview.querySelector(`[data-overview-office="${id}"]`)) throw new Error(`Categoria ${id} ausente da visão geral.`);
  });
  if (overview.querySelectorAll('[data-overview-office] img[data-candidate-photo]').length < 30) throw new Error('Categorias inferiores não exibem fotos suficientes.');

  const chamberSimulation = overview.querySelector('[data-seat-simulation="chamber"]');
  const senateSimulation = overview.querySelector('[data-seat-simulation="senate"]');
  if (!chamberSimulation || chamberSimulation.querySelectorAll('svg circle').length !== 513) throw new Error('Simulação da Câmara não contém exatamente 513 cadeiras.');
  if (!senateSimulation || senateSimulation.querySelectorAll('svg circle').length !== 54) throw new Error('Simulação do Senado não contém exatamente 54 cadeiras em disputa.');
  if (!overview.textContent.includes('Limite do modelo')) throw new Error('Avisos metodológicos das simulações não renderizaram.');
  if (window.document.getElementById('bootScreen')) throw new Error('Tela de carregamento não foi removida.');

  const secondRound = overview.querySelector('[data-round="2"]');
  secondRound?.click();
  await new Promise((resolve) => window.setTimeout(resolve, 30));
  if (!window.document.getElementById('overview')?.textContent.includes('Segundo turno')) throw new Error('Alternância para segundo turno falhou.');
  if (window.document.querySelectorAll('#overview [data-overview-office]').length !== 5) throw new Error('Página contínua desapareceu após trocar o turno.');

  const matchup = window.document.getElementById('matchupFilter');
  if (!matchup || matchup.options.length < 4) throw new Error('Confrontos de segundo turno não foram carregados.');

  const chamberNav = window.document.querySelector('[data-view="chamber"]');
  chamberNav?.click();
  await new Promise((resolve) => window.setTimeout(resolve, 30));
  const chamber = window.document.getElementById('chamber');
  if (!chamber?.querySelector('[data-seat-simulation="chamber"]')) throw new Error('Página completa da Câmara não exibe a simulação.');
  if (chamber.querySelectorAll('[data-seat-simulation="chamber"] svg circle').length !== 513) throw new Error('Página completa da Câmara perdeu cadeiras.');
  if (chamber.querySelectorAll('img[data-candidate-photo]').length < 6) throw new Error('Página da Câmara não exibe os perfis com fotos.');

  const senateNav = window.document.querySelector('[data-view="senate"]');
  senateNav?.click();
  await new Promise((resolve) => window.setTimeout(resolve, 30));
  const senate = window.document.getElementById('senate');
  if (!senate?.querySelector('[data-seat-simulation="senate"]')) throw new Error('Página completa do Senado não exibe a simulação.');
  if (senate.querySelectorAll('[data-seat-simulation="senate"] svg circle').length !== 54) throw new Error('Página completa do Senado perdeu cadeiras.');
  if (senate.querySelectorAll('[data-office-poll] img[data-candidate-photo]').length < 6) throw new Error('Página do Senado não exibe candidatos com fotos.');

  const presidentNav = window.document.querySelector('[data-view="president"]');
  presidentNav?.click();
  await new Promise((resolve) => window.setTimeout(resolve, 20));
  const president = window.document.getElementById('president');
  if (!president?.textContent.includes('Catálogo completo')) throw new Error('Página presidencial não renderizou.');
  if (president.querySelectorAll('.candidate-roster-card').length !== window.POLL_RESULTS.candidates.length) throw new Error('Catálogo visual não mostra todos os candidatos.');
  if (president.querySelectorAll('.candidate-roster-card img[data-candidate-photo]').length !== window.POLL_RESULTS.candidates.length) throw new Error('Nem todos os candidatos receberam foto no catálogo visual.');

  const detailButton = president.querySelector('.chart-ranking-row[data-poll-id]');
  detailButton?.click();
  await new Promise((resolve) => window.setTimeout(resolve, 10));
  if (!window.document.getElementById('pollDialog')?.open) throw new Error('Detalhes da pesquisa não abriram.');
  if (!window.document.querySelector('.poll-dialog-candidate img[data-candidate-photo]')) throw new Error('Detalhes da pesquisa não exibem fotos dos candidatos.');

  if (errors.length) throw new Error(`Erros de execução: ${errors.map(String).join(' | ')}`);

  window.close();
  process.stdout.write('Smoke test do painel, página contínua, cadeiras e fotos: OK\n');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});