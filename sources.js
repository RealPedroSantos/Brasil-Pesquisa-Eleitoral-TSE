(() => {
  'use strict';
  async function refreshSources() {
    const app = window.ElectionApp;
    if (!app) return;
    try {
      const response = await fetch(`/api/sources?ts=${Date.now()}`, { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || 'Falha ao consultar fontes');
      app.state.sources = data.sources || app.state.sources;
      app.renderSources();
    } catch {
      app.renderSources();
    }
  }
  document.addEventListener('DOMContentLoaded', () => {
    refreshSources();
    setInterval(refreshSources, 15 * 60 * 1000);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') refreshSources();
    });
  });
})();
