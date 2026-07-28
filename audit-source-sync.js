(() => {
  'use strict';

  const AUDIT = window.ELECTION_AUDIT_DATA;
  const app = window.ElectionApp;
  if (!AUDIT?.sources?.length || !app?.renderSources || !app?.state) return;

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const existing = [...document.scripts].find(script => script.getAttribute('src') === src);
      if (existing) {
        if (existing.dataset.loaded === 'true') resolve();
        else {
          existing.addEventListener('load', resolve, {once:true});
          existing.addEventListener('error', reject, {once:true});
          setTimeout(resolve, 250);
        }
        return;
      }
      const script = document.createElement('script');
      script.src = src;
      script.defer = true;
      script.onload = () => { script.dataset.loaded = 'true'; resolve(); };
      script.onerror = reject;
      document.body.appendChild(script);
    });
  }

  function loadStyle(href) {
    if (document.querySelector(`link[href="${href}"]`)) return;
    const stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = href;
    document.head.appendChild(stylesheet);
  }

  async function rebuildAuditWithAllPolls() {
    try {
      await loadScript('audit-auto-ingest.js');
      const current = document.getElementById('audit');
      const wasActive = current?.classList.contains('active');
      current?.remove();
      document.querySelector('.nav-item[data-view="audit"]')?.remove();
      document.querySelector('.audit-shortcut')?.remove();

      await loadScript(`audit-system.js?integral=${Date.now()}`);
      loadStyle('audit-registry-coverage.css');
      await loadScript('audit-registry-coverage.js');

      if (wasActive) document.querySelector('.nav-item[data-view="audit"]')?.click();
    } catch (error) {
      console.error('[audit-bootstrap]', error);
    }
  }

  function normalizedCatalog() {
    return AUDIT.sources.map((source, index) => ({
      id: `audit-${index}-${String(source.name).toLowerCase().replace(/[^a-z0-9]+/g,'-')}`,
      name: source.name,
      kind: `${source.type} — fonte ${source.tier}`,
      coverage: [source.scope],
      online: true,
      url: source.url,
      description: source.tier === 'primária'
        ? 'Documento, instituto ou base oficial usada para confirmação dos números.'
        : source.tier === 'verificação'
          ? 'Fonte de checagem usada para verificar alegações e divergências.'
          : 'Veículo usado para descoberta, comparação editorial e rastreamento da publicação.'
    }));
  }

  function mergeCatalog() {
    const existing = Array.isArray(app.state.sources) ? app.state.sources : [];
    const byName = new Map();
    [...existing, ...normalizedCatalog()].forEach(source => {
      const key = String(source.name || '').trim().toLowerCase();
      if (!key) return;
      const previous = byName.get(key);
      byName.set(key, previous ? {...source, ...previous, online: previous.online !== false} : source);
    });
    app.state.sources = [...byName.values()];
  }

  if (!app.__auditSourceWrapped) {
    const originalRenderSources = app.renderSources.bind(app);
    app.renderSources = function renderAuditedSources() {
      mergeCatalog();
      originalRenderSources();
    };
    app.__auditSourceWrapped = true;
  }

  mergeCatalog();
  app.renderSources();
  rebuildAuditWithAllPolls();
})();