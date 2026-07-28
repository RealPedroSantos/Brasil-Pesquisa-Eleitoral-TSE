(() => {
  'use strict';

  const AUDIT = window.ELECTION_AUDIT_DATA;
  if (!AUDIT?.polls?.length) return;

  const statusLabels = {
    ok: 'Publicado', partial: 'Publicação parcial', pending: 'Aguardando documento',
    missing: 'Não divulgado', gated: 'Relatório com barreira de acesso'
  };
  const fieldLabels = {
    registry:'Registro TSE',sample:'Tamanho da amostra',margin:'Margem de erro',confidence:'Nível de confiança',
    questionnaire:'Questionário integral',fullReport:'Relatório completo',contractor:'Contratante',payer:'Pagante',method:'Método de coleta',
    firstRound:'Primeiro turno',secondRound:'Segundo turno',residuals:'Brancos, nulos e NS/NR',rejection:'Rejeição',gender:'Gênero',age:'Idade',
    education:'Escolaridade',income:'Renda',region:'Região',religion:'Religião',municipalityDetail:'Municípios e bairros'
  };

  let activePollId = AUDIT.polls[0].id;
  let activeScenarioId = AUDIT.polls[0].scenarios[0].id;

  const esc = value => String(value ?? '').replace(/[&<>'"]/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[character]));
  const percent = value => `${Number(value).toLocaleString('pt-BR',{maximumFractionDigits:1})}%`;
  const getPoll = () => AUDIT.polls.find(poll => poll.id === activePollId) || AUDIT.polls[0];
  const getScenario = poll => poll.scenarios.find(scenario => scenario.id === activeScenarioId) || poll.scenarios[0];

  function showAuditView() {
    document.querySelectorAll('.view').forEach(view => view.classList.toggle('active', view.id === 'audit'));
    document.querySelectorAll('.nav-item').forEach(item => item.classList.toggle('active', item.dataset.view === 'audit'));
    document.getElementById('sidebar')?.classList.remove('open');
    window.scrollTo({top:0,behavior:'smooth'});
  }

  function sourceCard(source) {
    return `<a class="audit-source-card" data-tier="${esc(source.tier)}" data-type="${esc(source.type)}" data-scope="${esc(source.scope)}" href="${esc(source.url)}" target="_blank" rel="noopener noreferrer"><strong>${esc(source.name)}</strong><span>${esc(source.type)} · ${esc(source.scope)}</span><small>${esc(source.tier)}</small></a>`;
  }

  function renderSources() {
    const grid = document.getElementById('auditSourceGrid');
    if (!grid) return;
    const query = (document.getElementById('auditSourceSearch')?.value || '').trim().toLowerCase();
    const tier = document.getElementById('auditSourceTier')?.value || 'Todos';
    const type = document.getElementById('auditSourceType')?.value || 'Todos';
    const filtered = AUDIT.sources.filter(source => {
      const searchable = `${source.name} ${source.type} ${source.scope} ${source.tier}`.toLowerCase();
      return (!query || searchable.includes(query)) && (tier === 'Todos' || source.tier === tier) && (type === 'Todos' || source.type === type);
    });
    grid.innerHTML = filtered.length ? filtered.map(sourceCard).join('') : '<div class="audit-empty">Nenhuma fonte encontrada com estes filtros.</div>';
    const count = document.getElementById('auditSourceCount');
    if (count) count.textContent = filtered.length.toLocaleString('pt-BR');
  }

  function renderPollList() {
    const list = document.getElementById('auditPollList');
    if (!list) return;
    list.innerHTML = AUDIT.polls.map(poll => `<button class="audit-poll-button ${poll.id === activePollId ? 'active' : ''}" type="button" data-poll="${esc(poll.id)}"><strong>${esc(poll.institute)}</strong><span>${esc(poll.publication)} · ${esc(poll.registry)}</span></button>`).join('');
    list.querySelectorAll('[data-poll]').forEach(button => button.addEventListener('click', () => {
      activePollId = button.dataset.poll;
      activeScenarioId = getPoll().scenarios[0].id;
      renderPollList();
      renderPollDocument();
    }));
  }

  function renderBars(scenario) {
    return scenario.values.map(([label,value,kind]) => `<div class="audit-bar-row" data-kind="${esc(kind)}"><span class="audit-bar-label" title="${esc(label)}">${esc(label)}</span><span class="audit-bar-track"><i class="audit-bar-fill" style="--value:${Math.max(0,Math.min(100,Number(value)))}%"></i></span><strong class="audit-bar-value">${percent(value)}</strong></div>`).join('');
  }

  function renderCompleteness(poll) {
    return Object.entries(fieldLabels).map(([key,label]) => {
      const status = poll.completeness?.[key] || 'missing';
      return `<div class="audit-status" data-status="${esc(status)}"><span>${esc(label)}</span><strong>${esc(statusLabels[status] || status)}</strong></div>`;
    }).join('');
  }

  function renderCrossTabs(poll) {
    if (!poll.crossTabs?.length) return '<div class="audit-empty">Nenhum cruzamento demográfico foi localizado nas fontes abertas consultadas.</div>';
    return `<table class="audit-cross-table"><thead><tr><th>Segmento</th><th>Peso na amostra</th><th>Métrica</th><th>Valores publicados</th><th>Completude</th></tr></thead><tbody>${poll.crossTabs.map(row => `<tr><td><strong>${esc(row.segment)}</strong></td><td>${row.share == null ? 'Não informado' : percent(row.share)}</td><td>${esc(row.metric)}</td><td><code>${esc(Object.entries(row.published || {}).map(([name,value]) => `${name}: ${percent(value)}`).join(' · '))}</code></td><td>${row.status === 'parcial' ? 'Parcial — faltam as demais respostas do cruzamento' : esc(row.status)}</td></tr>`).join('')}</tbody></table>`;
  }

  function renderEvidence(poll) {
    return poll.evidence.map(item => `<a href="${esc(item.url)}" target="_blank" rel="noopener noreferrer"><span>${esc(item.label)}</span><strong>${esc(item.kind)}</strong></a>`).join('');
  }

  function renderPollDocument() {
    const documentPanel = document.getElementById('auditPollDocument');
    if (!documentPanel) return;
    const poll = getPoll();
    if (!poll.scenarios.some(scenario => scenario.id === activeScenarioId)) activeScenarioId = poll.scenarios[0].id;
    const scenario = getScenario(poll);
    const sum = scenario.values.reduce((total,item) => total + Number(item[1] || 0), 0);
    const difference = 100 - sum;

    documentPanel.innerHTML = `
      <div class="audit-document-header"><div><span>LEVANTAMENTO AUDITADO</span><h3>${esc(poll.institute)}</h3><span>${esc(poll.publication)} · campo ${esc(poll.field)}</span></div><span class="audit-registry">${esc(poll.registry)}</span></div>
      <div class="audit-meta-grid">
        <div><span>Amostra</span><strong>${Number(poll.sample).toLocaleString('pt-BR')}</strong></div>
        <div><span>Margem</span><strong>${esc(poll.margin)}</strong></div>
        <div><span>Confiança</span><strong>${esc(poll.confidence)}</strong></div>
        <div><span>Coleta</span><strong>${esc(poll.field)}</strong></div>
        <div><span>Instituto</span><strong>${esc(poll.institute)}</strong></div>
        <div><span>Método</span><strong>${esc(poll.method)}</strong></div>
      </div>
      <div class="audit-scenario-tabs">${poll.scenarios.map(item => `<button type="button" data-scenario="${esc(item.id)}" class="${item.id === scenario.id ? 'active' : ''}">${esc(item.title)}</button>`).join('')}</div>
      <div class="audit-scenario-content">
        <div class="audit-scenario-title"><div><h4>${esc(scenario.title)}</h4><span>${esc(scenario.type)}${scenario.question ? ` · ${esc(scenario.question)}` : ''}</span></div></div>
        <div class="audit-bars">${renderBars(scenario)}</div>
        ${scenario.note ? `<p class="audit-scenario-note"><strong>Nota de auditoria:</strong> ${esc(scenario.note)}</p>` : ''}
        <div class="audit-sum"><span>Soma dos percentuais exibidos</span><strong>${percent(sum)}</strong></div>
        ${Math.abs(difference) > .01 ? `<div class="audit-sum"><span>Diferença em relação a 100%</span><strong>${difference > 0 ? '+' : ''}${percent(difference)}</strong></div>` : ''}
      </div>
      <div class="audit-completeness"><h4>Matriz de transparência</h4><div class="audit-status-grid">${renderCompleteness(poll)}</div></div>
      <div class="audit-cross-tabs"><h4>Recortes demográficos publicados</h4>${renderCrossTabs(poll)}</div>
      <div class="audit-evidence"><h4>Trilha documental e fontes</h4><div class="audit-evidence-list"><a href="${esc(poll.primaryUrl)}" target="_blank" rel="noopener noreferrer"><span>Fonte principal / página do instituto</span><strong>primária</strong></a>${renderEvidence(poll)}</div></div>
    `;

    documentPanel.querySelectorAll('[data-scenario]').forEach(button => button.addEventListener('click', () => {
      activeScenarioId = button.dataset.scenario;
      renderPollDocument();
    }));
  }

  function buildView() {
    if (document.getElementById('audit')) return;
    const section = document.createElement('section');
    section.id = 'audit';
    section.className = 'view audit-view';
    section.innerHTML = `
      <div class="audit-hero">
        <div><span class="audit-hero-label">SISTEMA DE AUDITORIA ELEITORAL</span><h1>Nenhum cenário, resposta ou ausência passa despercebido</h1><p>O painel separa resultados publicados, documentos primários, matérias secundárias, respostas residuais e lacunas de transparência. A ausência de um dado não é escondida: torna-se um achado de auditoria.</p></div>
        <div class="audit-principles"><div><strong>Descoberta ampla</strong><span>${esc(AUDIT.policy.discovery)}</span></div><div><strong>Confirmação documental</strong><span>${esc(AUDIT.policy.evidence)}</span></div><div><strong>Sem preenchimento artificial</strong><span>${esc(AUDIT.policy.missing)}</span></div></div>
      </div>
      <div class="audit-layout">
        <article class="audit-panel audit-green"><div class="audit-panel-head"><div><span class="audit-hero-label">FONTES ABERTAS</span><h2>Catálogo nacional, regional e independente</h2><p>Veículos pequenos e grandes entram na descoberta; a força probatória é informada separadamente.</p></div><div class="audit-count"><strong id="auditSourceCount">0</strong><span>fontes visíveis</span></div></div>
          <div class="audit-controls"><input id="auditSourceSearch" type="search" placeholder="Buscar veículo, instituto, estado ou tipo…"><select id="auditSourceTier"><option>Todos</option><option value="primária">Primária</option><option value="secundária">Secundária</option><option value="verificação">Verificação</option></select><select id="auditSourceType"><option>Todos</option></select></div>
          <div id="auditSourceGrid" class="audit-source-grid"></div>
        </article>
        <article class="audit-panel"><div class="audit-panel-head"><div><span class="audit-hero-label">AMOSTRA COMPLETA</span><h2>Explorador de cenários e respostas</h2><p>Primeiro turno, segundo turno, rejeição, recortes e parcelas não discriminadas são exibidos separadamente.</p></div><div class="audit-count"><strong>${AUDIT.polls.length}</strong><span>levantamentos estruturados</span></div></div>
          <div class="audit-workbench"><aside id="auditPollList" class="audit-poll-list"></aside><div id="auditPollDocument" class="audit-document"></div></div>
          <div class="audit-method-warning"><strong>Regra de auditoria</strong>Uma matéria jornalística pode resumir uma pesquisa e omitir tabelas. O painel não conclui que houve má-fé: registra a diferença entre o que consta no relatório, no PesqEle e no texto publicado. Quando a fonte aberta só divulga parte de um cruzamento — por exemplo, apenas o resultado de Lula entre mulheres — os demais valores permanecem marcados como não divulgados.</div>
        </article>
      </div>`;
    const registry = document.getElementById('registry');
    registry?.parentNode?.insertBefore(section, registry);
  }

  function buildNavigation() {
    const nav = document.getElementById('mainNav');
    if (!nav || nav.querySelector('[data-view="audit"]')) return;
    const button = document.createElement('button');
    button.className = 'nav-item';
    button.dataset.view = 'audit';
    button.innerHTML = '<span>▣</span>Auditoria integral';
    const sources = nav.querySelector('[data-view="sources"]');
    nav.insertBefore(button, sources || null);
    button.addEventListener('click', showAuditView);
  }

  function addAuditShortcut() {
    const toolbar = document.querySelector('.presidential-panel .chart-toolbar');
    if (!toolbar || toolbar.querySelector('.audit-shortcut')) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'audit-shortcut action-button';
    button.textContent = 'Ver dados brutos e cenários';
    button.addEventListener('click', showAuditView);
    toolbar.appendChild(button);
  }

  function initializeFilters() {
    const typeSelect = document.getElementById('auditSourceType');
    if (typeSelect) {
      [...new Set(AUDIT.sources.map(source => source.type))].sort((a,b) => a.localeCompare(b,'pt-BR')).forEach(type => {
        const option = document.createElement('option'); option.value = type; option.textContent = type; typeSelect.appendChild(option);
      });
    }
    ['auditSourceSearch','auditSourceTier','auditSourceType'].forEach(id => {
      const element = document.getElementById(id);
      element?.addEventListener(id === 'auditSourceSearch' ? 'input' : 'change', renderSources);
    });
  }

  function init() {
    buildView();
    buildNavigation();
    addAuditShortcut();
    initializeFilters();
    renderSources();
    renderPollList();
    renderPollDocument();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();
