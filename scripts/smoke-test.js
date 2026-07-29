const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

async function main() {
  const publicDir = path.join(process.cwd(), 'public');
  const html = fs.readFileSync(path.join(publicDir, 'index.html'), 'utf8');
  const polls = fs.readFileSync(path.join(publicDir, 'polls-data.js'), 'utf8');
  const dashboard = fs.readFileSync(path.join(publicDir, 'dashboard.js'), 'utf8');

  const dom = new JSDOM(html, {
    runScripts: 'outside-only',
    url: 'https://example.test/#overview',
    pretendToBeVisual: true
  });

  const { window } = dom;
  window.scrollTo = () => {};
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
  window.eval(dashboard);
  window.document.dispatchEvent(new window.Event('DOMContentLoaded', { bubbles: true }));
  await new Promise((resolve) => window.setTimeout(resolve, 50));

  const overview = window.document.getElementById('overview');
  const chart = overview?.querySelector('svg[aria-label="Gráfico de pesquisas eleitorais"]');
  if (!overview?.textContent.includes('Pesquisa por pesquisa')) throw new Error('Visão geral não renderizou.');
  if (!chart || chart.querySelectorAll('.chart-point').length < 2) throw new Error('Gráfico presidencial não renderizou pontos suficientes.');
  if (window.document.getElementById('bootScreen')) throw new Error('Tela de carregamento não foi removida.');

  const secondRound = overview.querySelector('[data-round="2"]');
  secondRound?.click();
  await new Promise((resolve) => window.setTimeout(resolve, 20));
  if (!window.document.getElementById('overview')?.textContent.includes('Segundo turno')) throw new Error('Alternância para segundo turno falhou.');

  const presidentNav = window.document.querySelector('[data-view="president"]');
  presidentNav?.click();
  await new Promise((resolve) => window.setTimeout(resolve, 20));
  if (!window.document.getElementById('president')?.textContent.includes('Catálogo completo')) throw new Error('Página presidencial não renderizou.');

  if (errors.length) throw new Error(`Erros de execução: ${errors.map(String).join(' | ')}`);

  window.close();
  process.stdout.write('Smoke test do painel: OK\n');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
