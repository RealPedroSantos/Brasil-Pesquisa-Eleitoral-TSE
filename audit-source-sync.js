(() => {
  'use strict';

  const AUDIT = window.ELECTION_AUDIT_DATA;
  const app = window.ElectionApp;
  if (!AUDIT?.sources?.length || !app?.renderSources || !app?.state) return;

  const originalRenderSources = app.renderSources.bind(app);

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

  app.renderSources = function renderAuditedSources() {
    mergeCatalog();
    originalRenderSources();
  };

  app.renderSources();
})();
