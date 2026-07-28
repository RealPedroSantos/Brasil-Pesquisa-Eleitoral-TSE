(() => {
  'use strict';

  const DATA = window.ELECTION_DATA;
  const APP = window.ElectionApp;
  if (!DATA || !APP) return;

  const $ = (id) => document.getElementById(id);
  const qs = (selector, root = document) => root.querySelector(selector);
  const qsa = (selector, root = document) => [...root.querySelectorAll(selector)];
  const esc = (value) => String(value ?? '').replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  })[char]);
  const fmt = (value, digits = 0) => Number(value || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  });

  const OFFICE_META = [
    {
      key: 'governor', office: 'Governador', view: 'governors', nav: 'governors',
      eyebrow: '27 disputas estaduais', title: 'Governadores',
      description: 'Cobertura por unidade da Federação, instituto, período de campo e situação do registro.',
      accent: '#2f7df6', icon: 'GOV'
    },
    {
      key: 'senate', office: 'Senador', view: 'senate', nav: 'senate',
      eyebrow: '54 cadeiras em disputa', title: 'Senado Federal',
      description: 'Duas vagas por estado, com leitura separada por UF e sem misturar cenários incompatíveis.',
      accent: '#ef304a', icon: 'SEN'
    },
    {
      key: 'chamber', office: 'Deputado Federal', view: 'chamber', nav: 'chamber',
      eyebrow: '513 cadeiras', title: 'Deputados Federais',
      description: 'Monitoramento de pesquisas nominais, partidárias e registros oficiais para a Câmara.',
      accent: '#12b981', icon: 'CDF'
    },
    {
      key: 'assembly', office: 'Deputado Estadual', view: 'assemblies', nav: 'assemblies',
      eyebrow: 'Assembleias legislativas', title: 'Deputados Estaduais',
      description: 'Visão contínua por estado, com recorte de cobertura e transparência sobre a disponibilidade dos resultados.',
      accent: '#f4b740', icon: 'ALE'
    },
    {
      key: 'district', office: 'Deputado Distrital', view: 'district', nav: 'district',
      eyebrow: 'Distrito Federal', title: 'Deputados Distritais',
      description: 'Acompanhamento dos registros e publicações relativas às 24 cadeiras da Câmara Legislativa.',
      accent: '#a76bf3', icon: 'CLDF'
    }
  ];

  const uiState = {
    chartFocus: DATA.candidates[0]?.id || 'all',
    registrySize: -1,
    officeFilters: Object.fromEntries(OFFICE_META.map((item) => [item.key, { uf: 'Todas', tab: 'panorama' }])),
    renderTimer: null
  };

  function candidateLatest(candidate) {
    const rows = DATA.polls.filter((poll) => Object.hasOwn(poll.values, candidate.name));
    if (!rows.length) return null;
    const latest = rows.at(-1);
    const current = latest.values[candidate.name];
    const previous = rows.length > 1 ? rows.at(-2).values[candidate.name] : current;
    return { latest, current, previous, change: current - previous, rows };
  }

  function normalizeColor(value) {
    return String(value || '').trim().toLowerCase().replace(/\s+/g, '');
  }

  function createLiveRegion() {
    if ($('uxLiveRegion')) return;
    const region = document.createElement('div');
    region.id = 'uxLiveRegion';
    region.className = 'sr-only';
    region.setAttribute('aria-live', 'polite');
    region.setAttribute('aria-atomic', 'true');
    document.body.appendChild(region);
  }

  function announce(message) {
    const region = $('uxLiveRegion');
    if (!region) return;
    region.textContent = '';
    requestAnimationFrame(() => { region.textContent = message; });
  }

  function buildPlaceholderPhoto(label = 'Foto') {
    const safeLabel = String(label).slice(0, 4).toUpperCase();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 420">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#183a5c"/><stop offset="1" stop-color="#071521"/></linearGradient></defs>
      <rect width="360" height="420" fill="url(#g)"/>
      <circle cx="180" cy="142" r="76" fill="#7590a8" opacity=".7"/>
      <path d="M55 420c10-111 57-169 125-169s115 58 125 169" fill="#7590a8" opacity=".7"/>
      <text x="180" y="382" text-anchor="middle" font-family="Arial" font-weight="700" font-size="34" fill="#e8f2fb">${safeLabel}</text>
    </svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }

  function selectedCandidate() {
    return DATA.candidates.find((candidate) => candidate.id === uiState.chartFocus) || null;
  }

  function renderChartFocusHud(candidate) {
    const stage = qs('.presidential-panel .chart-stage');
    if (!stage) return;
    let hud = qs('.chart-focus-hud', stage);
    if (!candidate) {
      hud?.remove();
      return;
    }
    const latest = candidateLatest(candidate);
    if (!latest) return;
    const direction = latest.change > .05 ? 'up' : latest.change < -.05 ? 'down' : 'stable';
    const directionText = latest.change > .05 ? `subiu ${fmt(Math.abs(latest.change), 1)} p.p.` : latest.change < -.05 ? `caiu ${fmt(Math.abs(latest.change), 1)} p.p.` : 'estável';
    if (!hud) {
      hud = document.createElement('div');
      hud.className = 'chart-focus-hud';
      stage.appendChild(hud);
    }
    hud.style.setProperty('--focus-color', candidate.color);
    hud.innerHTML = `
      <img src="${esc(candidate.photo)}" alt="Retrato de ${esc(candidate.name)}" style="object-position:${esc(candidate.focus || '50% 20%')}">
      <div class="chart-focus-copy">
        <span>Candidato selecionado</span>
        <strong>${esc(candidate.name)}</strong>
        <small>${esc(candidate.party)} · ${esc(latest.latest.institute)}</small>
      </div>
      <div class="chart-focus-value">
        <strong>${fmt(latest.current, 1)}%</strong>
        <span class="${direction}">${esc(directionText)}</span>
      </div>
      <button type="button" class="chart-reset-focus" aria-label="Voltar a exibir todos os candidatos">Mostrar todos</button>`;
    qs('.chart-reset-focus', hud)?.addEventListener('click', () => applyChartFocus('all', true));
  }

  function applyChartFocus(id, shouldAnnounce = false) {
    const candidate = DATA.candidates.find((item) => item.id === id) || null;
    uiState.chartFocus = candidate?.id || 'all';
    const panel = qs('.presidential-panel');
    if (!panel) return;
    panel.dataset.chartFocus = uiState.chartFocus;

    qsa('.candidate-card', panel).forEach((card) => {
      const focused = candidate && card.dataset.id === candidate.id;
      card.classList.toggle('ux-focused', Boolean(focused));
      card.classList.toggle('ux-muted', Boolean(candidate && !focused));
      card.setAttribute('aria-pressed', focused ? 'true' : 'false');
    });

    qsa('.legend-item', panel).forEach((item) => {
      const focused = candidate && item.dataset.id === candidate.id;
      item.classList.toggle('ux-focused', Boolean(focused));
      item.classList.toggle('ux-muted', Boolean(candidate && !focused));
      item.setAttribute('aria-pressed', focused ? 'true' : 'false');
    });

    const selectedColor = normalizeColor(candidate?.color);
    qsa('.series-line', panel).forEach((line) => {
      const focused = candidate && normalizeColor(line.getAttribute('stroke')) === selectedColor;
      line.classList.toggle('ux-focused', Boolean(focused));
      line.classList.toggle('ux-muted', Boolean(candidate && !focused));
    });
    qsa('.series-area', panel).forEach((area) => {
      const focused = candidate && normalizeColor(area.getAttribute('fill')) === selectedColor;
      area.classList.toggle('ux-focused', Boolean(focused));
      area.classList.toggle('ux-muted', Boolean(candidate && !focused));
    });
    qsa('.point', panel).forEach((point) => {
      const focused = candidate && normalizeColor(point.getAttribute('fill')) === selectedColor;
      point.classList.toggle('ux-focused', Boolean(focused));
      point.classList.toggle('ux-muted', Boolean(candidate && !focused));
      point.setAttribute('tabindex', focused ? '0' : '-1');
    });

    renderChartFocusHud(candidate);
    if (shouldAnnounce) announce(candidate ? `${candidate.name} selecionado no gráfico.` : 'Todos os candidatos estão visíveis no gráfico.');
  }

  function bindCandidateExperience() {
    const panel = qs('.presidential-panel');
    const chart = $('mainChart');
    if (!panel || !chart) return;

    panel.addEventListener('click', (event) => {
      const trigger = event.target.closest('.candidate-card, .legend-item');
      if (!trigger?.dataset.id) return;
      setTimeout(() => applyChartFocus(trigger.dataset.id, true), 0);
    });

    panel.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') applyChartFocus('all', true);
    });

    const chartObserver = new MutationObserver(() => {
      clearTimeout(window.__modernChartFocusTimer);
      window.__modernChartFocusTimer = setTimeout(() => applyChartFocus(uiState.chartFocus), 30);
    });
    chartObserver.observe(chart, { childList: true, subtree: true });

    qsa('.chart-mode', panel).forEach((button) => button.addEventListener('click', () => {
      panel.classList.add('chart-switching');
      setTimeout(() => panel.classList.remove('chart-switching'), 560);
    }));

    applyChartFocus(uiState.chartFocus);
  }

  function bindChartCrosshair() {
    const stage = qs('.presidential-panel .chart-stage');
    if (!stage || qs('.ux-chart-crosshair', stage)) return;
    const crosshair = document.createElement('div');
    crosshair.className = 'ux-chart-crosshair';
    crosshair.innerHTML = '<i></i><span></span>';
    stage.appendChild(crosshair);

    stage.addEventListener('pointermove', (event) => {
      const rect = stage.getBoundingClientRect();
      const x = Math.max(0, Math.min(rect.width, event.clientX - rect.left));
      const ratio = rect.width ? x / rect.width : 0;
      const index = Math.min(DATA.polls.length - 1, Math.max(0, Math.round(ratio * (DATA.polls.length - 1))));
      const poll = DATA.polls[index];
      crosshair.style.setProperty('--crosshair-x', `${x}px`);
      qs('span', crosshair).textContent = poll ? `${poll.publication} · ${poll.institute}` : '';
      crosshair.classList.add('visible');
    });
    stage.addEventListener('pointerleave', () => crosshair.classList.remove('visible'));
  }

  function createStoryNavigation() {
    const overview = $('overview');
    const dashboard = qs('.dashboard-grid', overview);
    if (!overview || !dashboard || $('electionStoryNav')) return;

    dashboard.id = 'overviewPresident';
    const nav = document.createElement('nav');
    nav.id = 'electionStoryNav';
    nav.className = 'election-story-nav';
    nav.setAttribute('aria-label', 'Seções da visão geral');
    nav.innerHTML = `
      <div class="story-nav-title"><span>Central 2026</span><strong>Visão eleitoral completa</strong></div>
      <div class="story-nav-items">
        <button type="button" class="active" data-target="overviewPresident">Presidente</button>
        ${OFFICE_META.map((item) => `<button type="button" data-target="overview-${item.key}">${esc(item.title)}</button>`).join('')}
      </div>
      <div class="story-nav-progress"><i></i></div>`;
    overview.insertBefore(nav, dashboard);

    qsa('button[data-target]', nav).forEach((button) => button.addEventListener('click', () => {
      const target = $(button.dataset.target);
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }));

    const observed = [dashboard];
    OFFICE_META.forEach((item) => {
      const section = $(`overview-${item.key}`);
      if (section) observed.push(section);
    });
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      qsa('button[data-target]', nav).forEach((button) => button.classList.toggle('active', button.dataset.target === visible.target.id));
    }, { rootMargin: '-18% 0px -68% 0px', threshold: [0, .15, .4] });
    observed.forEach((item) => observer.observe(item));

    addEventListener('scroll', () => {
      const doc = document.documentElement;
      const progress = doc.scrollHeight > innerHeight ? scrollY / (doc.scrollHeight - innerHeight) : 0;
      nav.style.setProperty('--story-progress', `${Math.max(0, Math.min(1, progress)) * 100}%`);
    }, { passive: true });
  }

  function officeRecords(meta, uf = 'Todas') {
    return (APP.state.registry || []).filter((record) => record.office === meta.office && (uf === 'Todas' || record.uf === uf));
  }

  function parseBrazilianDate(value) {
    const match = String(value || '').match(/^(\d{2})\/(\d{2})\/(\d{4})/);
    if (!match) return 0;
    return new Date(`${match[3]}-${match[2]}-${match[1]}T12:00:00`).getTime();
  }

  function recordsMetrics(records) {
    const ufs = new Set(records.map((record) => record.uf).filter(Boolean));
    const institutes = new Set(records.map((record) => record.institute).filter(Boolean));
    const sorted = records.slice().sort((a, b) => parseBrazilianDate(b.publication || b.fieldEnd) - parseBrazilianDate(a.publication || a.fieldEnd));
    return {
      total: records.length,
      ufs: ufs.size,
      institutes: institutes.size,
      latest: sorted[0]?.publication || sorted[0]?.fieldEnd || '—',
      results: records.filter((record) => record.hasResults).length
    };
  }

  function topGroups(records, key, limit = 5) {
    const counts = new Map();
    records.forEach((record) => {
      const value = record[key];
      if (!value) return;
      counts.set(value, (counts.get(value) || 0) + 1);
    });
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit);
  }

  function monthlySeries(records) {
    const months = new Map();
    records.forEach((record) => {
      const value = record.publication || record.fieldEnd || record.fieldStart;
      const match = String(value || '').match(/^(\d{2})\/(\d{2})\/(\d{4})/);
      if (!match) return;
      const key = `${match[3]}-${match[2]}`;
      months.set(key, (months.get(key) || 0) + 1);
    });
    const ordered = [...months.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(-7);
    if (ordered.length) return ordered;
    return [['2026-02', 0], ['2026-03', 0], ['2026-04', 0], ['2026-05', 0], ['2026-06', 0], ['2026-07', records.length]];
  }

  function monthLabel(key) {
    const [year, month] = key.split('-');
    return new Date(`${year}-${month}-01T12:00:00`).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '').toUpperCase();
  }

  function externalProfiles(meta, uf) {
    const source = window.ELECTION_OFFICE_DATA?.[meta.key]?.candidates;
    if (!Array.isArray(source)) return [];
    return source.filter((candidate) => uf === 'Todas' || candidate.uf === uf).slice(0, 6);
  }

  function buildProfiles(meta, records, uf) {
    const provided = externalProfiles(meta, uf);
    if (provided.length) {
      return provided.map((profile) => ({
        kind: 'candidate',
        name: profile.name,
        party: profile.party || 'Partido não informado',
        uf: profile.uf || uf,
        photo: profile.photo || buildPlaceholderPhoto(profile.uf || meta.icon),
        value: Number.isFinite(profile.value) ? `${fmt(profile.value, 1)}%` : '—',
        trend: profile.trend || 'Dados em atualização',
        detail: profile
      }));
    }

    const groups = topGroups(records, 'uf', 6);
    const fallbackGroups = groups.length ? groups : (uf !== 'Todas' ? [[uf, 0]] : DATA.ufs.slice(0, 6).map((stateUf) => [stateUf, 0]));
    return fallbackGroups.map(([stateUf, count]) => ({
      kind: 'coverage',
      name: DATA.stateNames[stateUf] || stateUf || meta.title,
      party: `${count} registro${count === 1 ? '' : 's'} oficial${count === 1 ? '' : 'is'}`,
      uf: stateUf,
      photo: buildPlaceholderPhoto(stateUf || meta.icon),
      value: count ? fmt(count) : '—',
      trend: count ? 'Cobertura ativa' : 'Aguardando publicação',
      detail: null
    }));
  }

  function renderTimeline(records, accent) {
    const series = monthlySeries(records);
    const max = Math.max(1, ...series.map(([, value]) => value));
    return `<div class="office-timeline" style="--office-accent:${accent}">
      <div class="office-chart-grid" aria-hidden="true"><i></i><i></i><i></i></div>
      <div class="office-bars">${series.map(([month, value], index) => `
        <button type="button" class="office-bar" data-month="${esc(month)}" title="${esc(monthLabel(month))}: ${fmt(value)} registros" style="--bar-height:${Math.max(4, value / max * 100)}%;--bar-delay:${index * 55}ms">
          <span>${fmt(value)}</span><i></i><small>${monthLabel(month)}</small>
        </button>`).join('')}</div>
    </div>`;
  }

  function renderOfficeRecords(records) {
    const sorted = records.slice().sort((a, b) => parseBrazilianDate(b.publication || b.fieldEnd) - parseBrazilianDate(a.publication || a.fieldEnd)).slice(0, 8);
    if (!sorted.length) {
      return `<div class="office-empty"><span>Base oficial conectada</span><strong>Nenhum registro localizado neste filtro</strong><p>O painel preserva o estado vazio em vez de criar percentuais ou candidaturas sem fonte verificável.</p></div>`;
    }
    return `<div class="office-record-list">${sorted.map((record) => `
      <button type="button" class="office-record" data-registry="${esc(record.registry)}">
        <span class="record-date">${esc(record.publication || record.fieldEnd || 'Data não informada')}</span>
        <span class="record-main"><strong>${esc(record.institute || 'Instituto não informado')}</strong><small>${esc([record.uf, record.location].filter(Boolean).join(' · ') || 'Brasil')}</small></span>
        <span class="record-meta"><b>${esc(record.sample || 'Amostra —')}</b><small>${esc(record.registry || 'Registro TSE')}</small></span>
        <i aria-hidden="true">→</i>
      </button>`).join('')}</div>`;
  }

  function renderSourceRanking(records) {
    const groups = topGroups(records, 'institute', 8);
    if (!groups.length) return '<div class="office-empty compact"><strong>Institutos ainda não consolidados neste filtro</strong></div>';
    const max = Math.max(...groups.map(([, count]) => count), 1);
    return `<div class="office-source-ranking">${groups.map(([name, count], index) => `
      <div class="source-rank-row"><span>${index + 1}</span><strong>${esc(name)}</strong><div><i style="--rank-width:${count / max * 100}%"></i></div><b>${fmt(count)}</b></div>`).join('')}</div>`;
  }

  function officeSectionMarkup(meta, mode = 'overview') {
    const filter = uiState.officeFilters[meta.key];
    const records = officeRecords(meta, filter.uf);
    const metrics = recordsMetrics(records);
    const profiles = buildProfiles(meta, records, filter.uf);
    const ufOptions = DATA.ufs.map((uf) => `<option value="${uf}" ${filter.uf === uf ? 'selected' : ''}>${uf} — ${esc(DATA.stateNames[uf])}</option>`).join('');
    const isFull = mode === 'full';

    return `<section class="office-experience ${isFull ? 'office-full' : ''}" data-office-key="${meta.key}" style="--office-accent:${meta.accent}">
      <header class="office-header">
        <div class="office-index">${meta.icon}</div>
        <div><span>${esc(meta.eyebrow)}</span><h2>${esc(meta.title)}</h2><p>${esc(meta.description)}</p></div>
        <div class="office-live"><i></i><span>Base TSE</span><strong>${metrics.latest}</strong></div>
      </header>

      <div class="office-kpis">
        <div><span>Registros oficiais</span><strong>${fmt(metrics.total)}</strong><small>neste filtro</small></div>
        <div><span>UFs cobertas</span><strong>${fmt(metrics.ufs)}</strong><small>de 27 unidades</small></div>
        <div><span>Institutos</span><strong>${fmt(metrics.institutes)}</strong><small>fontes identificadas</small></div>
        <div><span>Resultados publicados</span><strong>${fmt(metrics.results)}</strong><small>localizados pelo painel</small></div>
      </div>

      <div class="office-controls">
        <div class="office-tabs" role="tablist" aria-label="Visualização de ${esc(meta.title)}">
          <button type="button" role="tab" data-office-tab="panorama" class="${filter.tab === 'panorama' ? 'active' : ''}">Panorama</button>
          <button type="button" role="tab" data-office-tab="registros" class="${filter.tab === 'registros' ? 'active' : ''}">Registros</button>
          <button type="button" role="tab" data-office-tab="fontes" class="${filter.tab === 'fontes' ? 'active' : ''}">Fontes</button>
        </div>
        <label><span>Unidade da Federação</span><select data-office-uf><option value="Todas">Brasil · todas as UFs</option>${ufOptions}</select></label>
        ${!isFull ? `<button type="button" class="office-open-view" data-open-view="${meta.nav}">Abrir painel completo <span>→</span></button>` : ''}
      </div>

      <div class="office-tab-panel ${filter.tab === 'panorama' ? 'active' : ''}" data-tab-panel="panorama">
        <div class="office-main-grid">
          <article class="office-chart-card">
            <div class="office-card-heading"><div><span>Atividade da cobertura</span><strong>Registros por mês</strong></div><small>Não representa intenção de voto</small></div>
            ${renderTimeline(records, meta.accent)}
            <div class="office-chart-note"><i></i><p>O gráfico mostra volume de pesquisas registradas. Percentuais eleitorais só aparecem quando há resultado público verificável.</p></div>
          </article>
          <article class="office-profile-card">
            <div class="office-card-heading"><div><span>Disputas em destaque</span><strong>${filter.uf === 'Todas' ? 'Cobertura por estado' : esc(DATA.stateNames[filter.uf] || filter.uf)}</strong></div><small>${profiles.some((profile) => profile.kind === 'candidate') ? 'Candidatos com dados publicados' : 'Fotos preparadas para dados oficiais'}</small></div>
            <div class="office-profile-grid">${profiles.map((profile, index) => `
              <button type="button" class="office-profile" data-profile-index="${index}" style="--profile-delay:${index * 65}ms">
                <span class="office-photo"><img src="${esc(profile.photo)}" alt="${profile.kind === 'candidate' ? `Foto de ${esc(profile.name)}` : `Espaço de foto para a disputa de ${esc(profile.name)}`}"><i>${esc(profile.uf || meta.icon)}</i></span>
                <span class="office-profile-copy"><strong>${esc(profile.name)}</strong><small>${esc(profile.party)}</small><b>${esc(profile.value)}</b><em>${esc(profile.trend)}</em></span>
              </button>`).join('')}</div>
          </article>
        </div>
      </div>

      <div class="office-tab-panel ${filter.tab === 'registros' ? 'active' : ''}" data-tab-panel="registros">
        <div class="office-records-heading"><div><span>Registros mais recentes</span><strong>${esc(meta.title)} · ${filter.uf === 'Todas' ? 'Brasil' : esc(filter.uf)}</strong></div><small>Clique para abrir os metadados disponíveis</small></div>
        ${renderOfficeRecords(records)}
      </div>

      <div class="office-tab-panel ${filter.tab === 'fontes' ? 'active' : ''}" data-tab-panel="fontes">
        <div class="office-records-heading"><div><span>Distribuição das fontes</span><strong>Institutos com mais registros</strong></div><small>Contagem cadastral da base oficial</small></div>
        ${renderSourceRanking(records)}
      </div>
    </section>`;
  }

  function renderOverviewOffices() {
    const overview = $('overview');
    const dashboard = qs('.dashboard-grid', overview);
    if (!overview || !dashboard) return;
    let wrapper = $('overviewOfficeStream');
    if (!wrapper) {
      wrapper = document.createElement('div');
      wrapper.id = 'overviewOfficeStream';
      wrapper.className = 'overview-office-stream';
      dashboard.insertAdjacentElement('afterend', wrapper);
    }
    wrapper.innerHTML = OFFICE_META.map((meta) => `<div id="overview-${meta.key}" class="office-anchor">${officeSectionMarkup(meta, 'overview')}</div>`).join('');
    bindOfficeInteractions(wrapper);
  }

  function renderFullOfficeViews() {
    OFFICE_META.forEach((meta) => {
      const view = $(meta.view);
      if (!view) return;
      view.classList.add('has-modern-office-view');
      qsa(':scope > .state-grid, :scope > .content-grid', view).forEach((legacy) => { legacy.hidden = true; });
      let host = qs('.modern-office-host', view);
      if (!host) {
        host = document.createElement('div');
        host.className = 'modern-office-host';
        view.appendChild(host);
      }
      host.innerHTML = officeSectionMarkup(meta, 'full');
      bindOfficeInteractions(host);
    });
  }

  function bindOfficeInteractions(root) {
    qsa('.office-experience', root).forEach((section) => {
      const key = section.dataset.officeKey;
      const meta = OFFICE_META.find((item) => item.key === key);
      if (!meta) return;

      qs('[data-office-uf]', section)?.addEventListener('change', (event) => {
        uiState.officeFilters[key].uf = event.target.value;
        renderAllOfficeExperiences();
        announce(`${meta.title}: filtro alterado para ${event.target.value === 'Todas' ? 'todas as UFs' : event.target.value}.`);
      });

      qsa('[data-office-tab]', section).forEach((button) => button.addEventListener('click', () => {
        uiState.officeFilters[key].tab = button.dataset.officeTab;
        qsa('[data-office-tab]', section).forEach((item) => item.classList.toggle('active', item === button));
        qsa('[data-tab-panel]', section).forEach((panel) => panel.classList.toggle('active', panel.dataset.tabPanel === button.dataset.officeTab));
      }));

      qs('[data-open-view]', section)?.addEventListener('click', (event) => {
        const nav = qs(`.nav-item[data-view="${event.currentTarget.dataset.openView}"]`);
        nav?.click();
      });

      qsa('.office-profile', section).forEach((button) => button.addEventListener('click', () => {
        openOfficeDetail(meta, Number(button.dataset.profileIndex));
      }));

      qsa('.office-record', section).forEach((button) => button.addEventListener('click', () => {
        openRegistryDetail(button.dataset.registry, meta);
      }));
    });
  }

  function openOfficeDetail(meta, profileIndex) {
    const filter = uiState.officeFilters[meta.key];
    const records = officeRecords(meta, filter.uf);
    const profiles = buildProfiles(meta, records, filter.uf);
    const profile = profiles[profileIndex];
    if (!profile) return;
    const dialog = $('detailDialog');
    const body = $('dialogBody');
    if (!dialog || !body) return;

    const matching = profile.uf ? records.filter((record) => record.uf === profile.uf).slice(0, 12) : records.slice(0, 12);
    body.innerHTML = `<div class="modern-dialog-hero" style="--office-accent:${meta.accent}">
      <img src="${esc(profile.photo)}" alt="${profile.kind === 'candidate' ? `Foto de ${esc(profile.name)}` : 'Foto oficial ainda não disponível'}">
      <div><span>${esc(meta.eyebrow)}</span><h2>${esc(profile.name)}</h2><p>${esc(profile.party)}</p><strong>${esc(profile.value)}</strong><small>${esc(profile.trend)}</small></div>
    </div>
    <div class="modern-dialog-copy"><h3>Dados disponíveis</h3><p>${profile.kind === 'candidate' ? 'Os percentuais exibidos foram fornecidos pela camada editorial conectada ao painel.' : 'A base do TSE registra a pesquisa, mas não fornece automaticamente fotos de candidaturas nem percentuais publicados. O sistema mantém o espaço visual preparado e identifica claramente a ausência desses dados.'}</p></div>
    ${renderOfficeRecords(matching)}`;
    dialog.showModal();
  }

  function openRegistryDetail(registry, meta) {
    const record = (APP.state.registry || []).find((item) => item.registry === registry);
    if (!record) return;
    const dialog = $('detailDialog');
    const body = $('dialogBody');
    if (!dialog || !body) return;
    body.innerHTML = `<div class="modern-registry-detail" style="--office-accent:${meta.accent}">
      <span>Registro oficial TSE</span><h2>${esc(record.registry || 'Pesquisa registrada')}</h2>
      <div class="modern-detail-grid">
        <div><small>Cargo</small><strong>${esc(record.office)}</strong></div>
        <div><small>UF/local</small><strong>${esc([record.uf, record.location].filter(Boolean).join(' · ') || 'Brasil')}</strong></div>
        <div><small>Instituto</small><strong>${esc(record.institute || '—')}</strong></div>
        <div><small>Amostra</small><strong>${esc(record.sample || '—')}</strong></div>
        <div><small>Campo</small><strong>${esc([record.fieldStart, record.fieldEnd].filter(Boolean).join(' a ') || '—')}</strong></div>
        <div><small>Divulgação</small><strong>${esc(record.publication || '—')}</strong></div>
        <div><small>Margem</small><strong>${esc(record.margin || '—')}</strong></div>
        <div><small>Situação</small><strong>${esc(record.status || 'Registrada')}</strong></div>
      </div>
      <div class="modern-data-warning"><i></i><p>${record.hasResults ? 'Resultado público localizado e associado ao registro.' : 'Registro oficial localizado. Os percentuais e fotos de candidatos não são inventados quando a publicação primária ainda não está disponível.'}</p></div>
    </div>`;
    dialog.showModal();
  }

  function renderAllOfficeExperiences() {
    clearTimeout(uiState.renderTimer);
    uiState.renderTimer = setTimeout(() => {
      renderOverviewOffices();
      renderFullOfficeViews();
      $('electionStoryNav')?.remove();
      createStoryNavigation();
      observeReveals();
    }, 20);
  }

  function observeRegistryChanges() {
    const target = $('registrySummary');
    if (target) {
      const observer = new MutationObserver(() => {
        const size = APP.state.registry?.length || 0;
        if (size === uiState.registrySize) return;
        uiState.registrySize = size;
        renderAllOfficeExperiences();
      });
      observer.observe(target, { childList: true, subtree: true, characterData: true });
    }
    const check = () => {
      const size = APP.state.registry?.length || 0;
      if (size !== uiState.registrySize) {
        uiState.registrySize = size;
        renderAllOfficeExperiences();
      }
    };
    setInterval(check, 2500);
  }

  function enhanceHeader() {
    const header = qs('.broadcast-header');
    if (!header || qs('.header-edition', header)) return;
    const edition = document.createElement('div');
    edition.className = 'header-edition';
    edition.innerHTML = '<span>Edição de dados</span><strong>ELEIÇÕES 2026</strong>';
    header.insertBefore(edition, qs('.live-clock', header));
  }

  function observeReveals() {
    const items = qsa('.office-experience:not(.reveal-ready)');
    if (!items.length) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      });
    }, { threshold: .08, rootMargin: '80px 0px' });
    items.forEach((item) => { item.classList.add('reveal-ready'); observer.observe(item); });
  }

  function init() {
    document.documentElement.classList.add('modern-election-ui');
    createLiveRegion();
    enhanceHeader();
    renderAllOfficeExperiences();
    bindCandidateExperience();
    bindChartCrosshair();
    observeRegistryChanges();
    observeReveals();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
