(() => {
  'use strict';

  const AUDIT = window.ELECTION_AUDIT_DATA;
  if (!AUDIT?.polls?.length) return;

  const esc = value => String(value ?? '').replace(/[&<>'"]/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[character]));
  const normalize = value => String(value || '').trim().toLowerCase();
  const auditedRegistries = new Set(AUDIT.polls.map(poll => normalize(poll.registry)).filter(value => value && !/consultar|não vinculado/.test(value)));
  let officialRecords = [];

  function waitForAudit(callback, attempts = 0) {
    const audit = document.getElementById('audit');
    if (audit) return callback(audit);
    if (attempts < 40) setTimeout(() => waitForAudit(callback, attempts + 1), 100);
  }

  function fixDynamicMetadata() {
    const documentPanel = document.getElementById('auditPollDocument');
    if (!documentPanel) return;
    const registry = normalize(documentPanel.querySelector('.audit-registry')?.textContent);
    const title = normalize(documentPanel.querySelector('.audit-document-header h3')?.textContent);
    const poll = AUDIT.polls.find(item => normalize(item.registry) === registry && normalize(item.institute) === title)
      || AUDIT.polls.find(item => normalize(item.registry) === registry);
    if (!poll) return;

    const sample = documentPanel.querySelector('.audit-meta-grid > div:first-child strong');
    if (sample && poll.sampleDisplay) sample.textContent = poll.sampleDisplay;

    const header = documentPanel.querySelector('.audit-document-header > div');
    if (header && poll.auditOrigin && !header.querySelector('.audit-origin')) {
      const origin = document.createElement('small');
      origin.className = 'audit-origin';
      origin.textContent = poll.auditOrigin;
      header.appendChild(origin);
    }
  }

  function scenarioCount() {
    return AUDIT.polls.reduce((total, poll) => total + (poll.scenarios?.length || 0), 0);
  }

  function missingFieldCount() {
    return AUDIT.polls.reduce((total, poll) => total + Object.values(poll.completeness || {}).filter(status => status !== 'ok').length, 0);
  }

  function buildSummary(audit) {
    if (document.getElementById('auditCoverageSummary')) return;
    const summary = document.createElement('section');
    summary.id = 'auditCoverageSummary';
    summary.className = 'audit-coverage-summary';
    summary.innerHTML = `
      <div><span>Fontes catalogadas</span><strong>${(AUDIT.sources?.length || 0).toLocaleString('pt-BR')}</strong></div>
      <div><span>Levantamentos no explorador</span><strong>${AUDIT.polls.length.toLocaleString('pt-BR')}</strong></div>
      <div><span>Cenários e recortes</span><strong>${scenarioCount().toLocaleString('pt-BR')}</strong></div>
      <div><span>Lacunas explicitamente marcadas</span><strong>${missingFieldCount().toLocaleString('pt-BR')}</strong></div>
      <div><span>Registros oficiais TSE</span><strong id="auditOfficialTotal">Consultando…</strong></div>`;
    audit.querySelector('.audit-hero')?.insertAdjacentElement('afterend', summary);
  }

  function buildRegistryPanel(audit) {
    if (document.getElementById('auditRegistryCoverage')) return;
    const panel = document.createElement('article');
    panel.id = 'auditRegistryCoverage';
    panel.className = 'audit-panel audit-registry-coverage';
    panel.innerHTML = `
      <div class="audit-panel-head">
        <div><span class="audit-hero-label">FILA OFICIAL DE CONFERÊNCIA</span><h2>Registros do TSE ainda sem todos os resultados estruturados</h2><p>O registro prova que a pesquisa foi cadastrada. Não prova que todos os cenários, tabelas e recortes foram publicados. Esta fila mostra o que ainda precisa ser localizado e conferido.</p></div>
        <div class="audit-count"><strong id="auditPendingCount">—</strong><span>pendentes visíveis</span></div>
      </div>
      <div class="audit-registry-controls">
        <input id="auditRegistrySearch" type="search" placeholder="Buscar registro, instituto, cargo, UF ou município…">
        <select id="auditRegistryOffice"><option value="Todos">Todos os cargos</option></select>
        <select id="auditRegistryUf"><option value="Todas">Todas as UFs</option></select>
      </div>
      <div class="audit-registry-note"><strong>Critério:</strong> registros já associados a um levantamento estruturado são retirados desta fila. Os demais permanecem como pendência de auditoria, sem pressupor irregularidade.</div>
      <div class="audit-registry-table-wrap"><table class="audit-registry-table"><thead><tr><th>Registro</th><th>Cargo</th><th>UF/local</th><th>Instituto</th><th>Campo</th><th>Amostra</th><th>Situação na auditoria</th></tr></thead><tbody id="auditRegistryBody"><tr><td colspan="7">Consultando a base oficial…</td></tr></tbody></table></div>`;
    audit.querySelector('.audit-layout')?.insertAdjacentElement('afterend', panel);
  }

  function populateFilters() {
    const office = document.getElementById('auditRegistryOffice');
    const uf = document.getElementById('auditRegistryUf');
    if (!office || !uf) return;
    [...new Set(officialRecords.map(item => item.office).filter(Boolean))].sort((a,b) => a.localeCompare(b,'pt-BR')).forEach(value => {
      const option = document.createElement('option'); option.value = value; option.textContent = value; office.appendChild(option);
    });
    [...new Set(officialRecords.map(item => item.uf).filter(Boolean))].sort().forEach(value => {
      const option = document.createElement('option'); option.value = value; option.textContent = value; uf.appendChild(option);
    });
  }

  function renderRegistry() {
    const body = document.getElementById('auditRegistryBody');
    if (!body) return;
    const query = normalize(document.getElementById('auditRegistrySearch')?.value);
    const office = document.getElementById('auditRegistryOffice')?.value || 'Todos';
    const uf = document.getElementById('auditRegistryUf')?.value || 'Todas';
    const pending = officialRecords.filter(item => !auditedRegistries.has(normalize(item.registry)));
    const filtered = pending.filter(item => {
      const text = normalize(`${item.registry} ${item.office} ${item.uf} ${item.location} ${item.institute} ${item.fieldStart} ${item.fieldEnd}`);
      return (!query || text.includes(query)) && (office === 'Todos' || item.office === office) && (uf === 'Todas' || item.uf === uf);
    });
    document.getElementById('auditPendingCount').textContent = filtered.length.toLocaleString('pt-BR');
    body.innerHTML = filtered.length ? filtered.slice(0, 150).map(item => `<tr>
      <td><strong>${esc(item.registry || 'Não identificado')}</strong></td>
      <td>${esc(item.office || 'Não identificado')}</td>
      <td>${esc([item.uf, item.location].filter(Boolean).join(' · ') || 'Brasil')}</td>
      <td>${esc(item.institute || 'Não identificado')}</td>
      <td>${esc([item.fieldStart, item.fieldEnd].filter(Boolean).join(' a ') || 'Não informado')}</td>
      <td>${esc(item.sample || 'Não informada')}</td>
      <td><span class="audit-pending-chip">Resultado integral não estruturado</span></td>
    </tr>`).join('') : '<tr><td colspan="7">Nenhum registro encontrado com estes filtros.</td></tr>';
  }

  async function loadRegistry() {
    const body = document.getElementById('auditRegistryBody');
    try {
      const response = await fetch('/api/tse-registry', {cache:'no-store'});
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || 'Falha ao consultar TSE');
      officialRecords = Array.isArray(data.records) ? data.records : [];
      document.getElementById('auditOfficialTotal').textContent = Number(data.meta?.total || officialRecords.length).toLocaleString('pt-BR');
      populateFilters();
      renderRegistry();
    } catch (error) {
      document.getElementById('auditOfficialTotal').textContent = 'Indisponível';
      if (body) body.innerHTML = `<tr><td colspan="7">A base oficial não pôde ser consultada agora: ${esc(error.message)}</td></tr>`;
    }
  }

  function init(audit) {
    buildSummary(audit);
    buildRegistryPanel(audit);
    ['auditRegistrySearch','auditRegistryOffice','auditRegistryUf'].forEach(id => {
      const element = document.getElementById(id);
      element?.addEventListener(id === 'auditRegistrySearch' ? 'input' : 'change', renderRegistry);
    });
    const documentPanel = document.getElementById('auditPollDocument');
    if (documentPanel) new MutationObserver(() => requestAnimationFrame(fixDynamicMetadata)).observe(documentPanel, {childList:true,subtree:true});
    fixDynamicMetadata();
    loadRegistry();
  }

  waitForAudit(init);
})();