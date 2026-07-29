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
  await new Promise((resolve) => window.setTimeout(resolve, 120));

  const overview = window.document.getElementById('overview');
  const presidentialChart = overview?.querySelector('svg[aria-label="Gráfico de pesquisas eleitorais"]');
  if (!overview?.textContent.includes('Pesquisa por pesquisa')) throw new Error('Visão geral não renderizou.');
  if (!presidentialChart || presidentialChart.querySelectorAll('.chart-point').length < 12) throw new Error('Gráfico presidencial não renderizou a série expandida.');
  if (presidentialChart.querySelectorAll('.chart-candidate-photo').length < 8) throw new Error('Fotos não foram colocadas nas linhas do gráfico presidencial.');

  const officeSections = overview.querySelectorAll('[data-overview-office]');
  if (officeSections.length !== 5) throw new Error(`Visão geral contínua deveria mostrar 5 categorias, mas mostrou ${officeSections.length}.`);

  ['governors', 'senate', 'chamber', 'assemblies', 'district'].forEach((id) => {
    const section = overview.querySelector(`[data-overview-office="${id}"]`);
    if (!section) throw new Error(`Categoria ${id} ausente da visão geral.`);
    if (!section.querySelector(`[data-office-parity-explorer="${id}"]`)) throw new Error(`Categoria ${id} não reutiliza o explorador da Presidência.`);
    if (!section.querySelector('[data-office-parity-chart]')) throw new Error(`Categoria ${id} não contém gráfico no mesmo padrão presidencial.`);
    if (!section.querySelector('[data-office-parity-ranking]')) throw new Error(`Categoria ${id} não contém ranking lateral.`);
    if (!section.textContent.includes('Últimos levantamentos')) throw new Error(`Categoria ${id} não contém últimos levantamentos.`);
    if (!section.textContent.includes('Duas camadas independentes')) throw new Error(`Categoria ${id} não contém auditoria de dados.`);
  });

  const governorSection = overview.querySelector('[data-overview-office="governors"]');
  const governorUf = governorSection.querySelector('[data-office-parity-uf]');
  if (!governorUf || governorUf.options.length < 5) throw new Error('Governadores não oferecem pelo menos cinco estados.');
  governorUf.value = 'SP';
  governorUf.dispatchEvent(new window.Event('change', { bubbles: true }));
  await new Promise((resolve) => window.setTimeout(resolve, 30));

  const refreshedGovernor = overview.querySelector('[data-overview-office="governors"]');
  const governorSecondRound = refreshedGovernor.querySelector('[data-office-parity-round="second"]');
  if (!governorSecondRound) throw new Error('Governadores não exibem segundo turno quando publicado.');
  governorSecondRound.click();
  await new Promise((resolve) => window.setTimeout(resolve, 30));
  if (!overview.querySelector('[data-overview-office="governors"]')?.textContent.includes('Segundo turno')) throw new Error('Troca de turno dos governadores falhou.');

  const governorScenario = overview.querySelector('[data-overview-office="governors"] [data-office-parity-scenario]');
  if (!governorScenario || governorScenario.options.length < 2) throw new Error('Seletor de confronto dos governadores não foi carregado.');

  const senateSection = overview.querySelector('[data-overview-office="senate"]');
  if (senateSection.querySelector('[data-office-parity-round="second"]')) throw new Error('Senado não deve exibir segundo turno.');
  if (!senateSection.textContent.includes('Turno único')) throw new Error('Senado não está identificado como turno único.');

  const chamberSimulation = overview.querySelector('[data-seat-simulation="chamber"]');
  const senateSimulation = overview.querySelector('[data-seat-simulation="senate"]');
  const assemblySimulation = overview.querySelector('[data-seat-simulation="assemblies"]');
  const districtSimulation = overview.querySelector('[data-seat-simulation="district"]');
  if (!chamberSimulation || chamberSimulation.querySelectorAll('svg circle').length !== 513) throw new Error('Simulação da Câmara não contém exatamente 513 cadeiras.');
  if (!senateSimulation || senateSimulation.querySelectorAll('svg circle').length !== 54) throw new Error('Simulação do Senado não contém exatamente 54 cadeiras.');
  if (!assemblySimulation || assemblySimulation.querySelectorAll('svg circle').length < 70) throw new Error('Estrutura de cadeiras da Assembleia não foi renderizada.');
  if (!districtSimulation || districtSimulation.querySelectorAll('svg circle').length !== 24) throw new Error('Estrutura da Câmara Legislativa do DF não contém 24 cadeiras.');
  if (chamberSimulation.dataset.seatCompact !== 'true' || senateSimulation.dataset.seatCompact !== 'true') throw new Error('Simuladores da visão geral não usam layout compacto.');

  const presidentialSecondRound = overview.querySelector('[data-round="2"]');
  presidentialSecondRound?.click();
  await new Promise((resolve) => window.setTimeout(resolve, 40));
  if (!window.document.getElementById('overview')?.textContent.includes('Segundo turno')) throw new Error('Alternância presidencial para segundo turno falhou.');
  if (window.document.querySelectorAll('#overview [data-overview-office]').length !== 5) throw new Error('Página contínua desapareceu após trocar o turno presidencial.');

  for (const viewId of ['governors', 'senate', 'chamber', 'assemblies', 'district']) {
    const nav = window.document.querySelector(`[data-view="${viewId}"]`);
    nav?.click();
    await new Promise((resolve) => window.setTimeout(resolve, 35));
    const page = window.document.getElementById(viewId);
    if (!page?.querySelector('.candidate-roster-grid')) throw new Error(`Página ${viewId} não possui catálogo visual igual ao presidencial.`);
    if (!page.querySelector(`[data-office-parity-explorer="${viewId}"]`)) throw new Error(`Página ${viewId} não possui explorador igual ao presidencial.`);
    if (!page.querySelector('.data-table')) throw new Error(`Página ${viewId} não possui tabela completa pesquisa por pesquisa.`);
    if (!page.querySelector('[data-office-parity-ranking]')) throw new Error(`Página ${viewId} não possui ranking com fotos.`);
  }

  const fullChamberSimulation = window.document.getElementById('chamber')?.querySelector('[data-seat-simulation="chamber"]');
  if (!fullChamberSimulation || fullChamberSimulation.querySelectorAll('svg circle').length !== 513) throw new Error('Página completa da Câmara perdeu a simulação.');
  if (fullChamberSimulation.dataset.seatCompact !== 'false') throw new Error('Página completa da Câmara não usa simulador completo.');

  window.document.querySelector('[data-view="governors"]')?.click();
  await new Promise((resolve) => window.setTimeout(resolve, 30));
  const governorPage = window.document.getElementById('governors');
  const detailPoint = governorPage?.querySelector('[data-office-parity-chart] .chart-hit-area');
  detailPoint?.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  await new Promise((resolve) => window.setTimeout(resolve, 10));
  if (!window.document.getElementById('pollDialog')?.open) throw new Error('Detalhes de pesquisa estadual não abriram.');
  if (!window.document.querySelector('.poll-dialog-candidate img[data-candidate-photo]')) throw new Error('Detalhes estaduais não exibem fotos.');

  const presidentNav = window.document.querySelector('[data-view="president"]');
  presidentNav?.click();
  await new Promise((resolve) => window.setTimeout(resolve, 20));
  const president = window.document.getElementById('president');
  if (!president?.textContent.includes('Catálogo completo')) throw new Error('Página presidencial não renderizou.');
  if (president.querySelectorAll('.candidate-roster-card').length !== window.POLL_RESULTS.candidates.length) throw new Error('Catálogo visual presidencial não mostra todos os candidatos.');

  if (errors.length) throw new Error(`Erros de execução: ${errors.map(String).join(' | ')}`);

  window.close();
  process.stdout.write('Smoke test de paridade entre cargos, gráficos, tabelas, fotos e cadeiras: OK\n');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
