(() => {
  'use strict';

  const OFFICE_NAMES = {
    governor: 'Governador',
    senate: 'Senador',
    chamber: 'Deputado Federal',
    assembly: 'Deputado Estadual',
    district: 'Deputado Distrital'
  };

  const OFFICE_LABELS = {
    governor: 'Governadores',
    senate: 'Senado Federal',
    chamber: 'Deputados Federais',
    assembly: 'Deputados Estaduais',
    district: 'Deputados Distritais'
  };

  const POLLS = {
    governor: {
      SP: [{
        institute: 'Datafolha',
        publication: '05/07/2026',
        field: '1 a 3/07/2026',
        sample: '1.608',
        margin: '±2 p.p.',
        registry: 'SP-01703/2026',
        scenario: 'Primeiro turno',
        source: 'https://www.cnnbrasil.com.br/eleicoes/datafolha-tarcisio-tem-46-no-1-turno-da-disputa-em-sp-haddad-30/',
        candidates: [
          { name: 'Tarcísio de Freitas', value: 46, wiki: 'Tarcísio de Freitas' },
          { name: 'Fernando Haddad', value: 30, wiki: 'Fernando Haddad' },
          { name: 'Vera Lúcia', value: 5, wiki: 'Vera Lúcia Salgado' },
          { name: 'Vivian Mendes', value: 4, wiki: 'Vivian Mendes' },
          { name: 'Carlos Machado', value: 4, wiki: 'Carlos Machado político' }
        ]
      }],
      RJ: [{
        institute: 'Paraná Pesquisas',
        publication: '02/07/2026',
        field: '29/06 a 1/07/2026',
        sample: '1.600',
        margin: '±2,5 p.p.',
        registry: 'RJ-04259/2026',
        scenario: 'Cenário 1 · primeiro turno',
        source: 'https://www.cnnbrasil.com.br/eleicoes/parana-pesquisas-paes-mantem-lideranca-na-disputa-pelo-governo-do-rj/',
        candidates: [
          { name: 'Eduardo Paes', value: 54.2, wiki: 'Eduardo Paes' },
          { name: 'Douglas Ruas', value: 14.6, wiki: 'Douglas Ruas' },
          { name: 'André Marinho', value: 4.9, wiki: 'André Marinho' },
          { name: 'Wilson Witzel', value: 3.5, wiki: 'Wilson Witzel' },
          { name: 'Rafa Luz', value: 2.2, wiki: 'Rafa Luz' },
          { name: 'André Português', value: 1.9, wiki: 'André Português' },
          { name: 'William Siri', value: 1.1, wiki: 'William Siri' }
        ]
      }],
      CE: [{
        institute: 'Real Time Big Data',
        publication: '15/07/2026',
        field: '13 a 14/07/2026',
        sample: '1.600',
        margin: '±2 p.p.',
        registry: 'CE-05682/2026',
        scenario: 'Primeiro turno',
        source: 'https://www.cnnbrasil.com.br/eleicoes/real-time-big-data-elmano-tem-44-ao-governo-do-ce-no-1o-turno-ciro-40/',
        candidates: [
          { name: 'Elmano de Freitas', value: 44, wiki: 'Elmano de Freitas' },
          { name: 'Ciro Gomes', value: 40, wiki: 'Ciro Gomes' },
          { name: 'Eduardo Girão', value: 7, wiki: 'Eduardo Girão' },
          { name: 'Jarir Pereira', value: 1, wiki: 'Jarir Pereira' },
          { name: 'Giovani Sampaio', value: 1, wiki: 'Giovani Sampaio' },
          { name: 'Delegado Huggo Leonardo', value: 1, wiki: 'Huggo Leonardo' },
          { name: 'Zé Batista', value: 0, wiki: 'Zé Batista político' }
        ]
      }]
    },
    senate: {
      SP: [{
        institute: 'Datafolha',
        publication: '06/07/2026',
        field: '1 a 3/07/2026',
        sample: '1.608',
        margin: '±2 p.p.',
        registry: 'SP-01703/2026 · BR-06481/2026',
        scenario: 'Intenção de voto para o Senado',
        source: 'https://www.cnnbrasil.com.br/eleicoes/datafolha-marina-e-tebet-lideram-disputa-ao-senado-em-sao-paulo/',
        candidates: [
          { name: 'Marina Silva', value: 18, wiki: 'Marina Silva' },
          { name: 'Simone Tebet', value: 16, wiki: 'Simone Tebet' },
          { name: 'Ricardo Salles', value: 13, wiki: 'Ricardo Salles' },
          { name: 'André do Prado', value: 11, wiki: 'André do Prado' },
          { name: 'Guilherme Derrite', value: 10, wiki: 'Guilherme Derrite' },
          { name: 'Paulinho da Força', value: 8, wiki: 'Paulinho da Força' }
        ]
      }],
      RJ: [{
        institute: 'Paraná Pesquisas',
        publication: '02/07/2026',
        field: '29/06 a 1/07/2026',
        sample: '1.600',
        margin: '±2,5 p.p.',
        registry: 'RJ-04259/2026',
        scenario: 'Cenário 1 · duas escolhas',
        source: 'https://www.cnnbrasil.com.br/eleicoes/parana-pesquisas-benedita-lidera-para-senado-no-rj-2a-vaga-esta-em-aberto/',
        candidates: [
          { name: 'Benedita da Silva', value: 33, wiki: 'Benedita da Silva' },
          { name: 'Marcelo Crivella', value: 25.9, wiki: 'Marcelo Crivella' },
          { name: 'Márcio Canella', value: 21.9, wiki: 'Márcio Canella' },
          { name: 'Pedro Paulo', value: 21.5, wiki: 'Pedro Paulo Carvalho Teixeira' },
          { name: 'Carlos Jordy', value: 12.1, wiki: 'Carlos Jordy' },
          { name: 'Mauro Campos', value: 10, wiki: 'Mauro Campos político' },
          { name: 'Mônica Benício', value: 9.9, wiki: 'Mônica Benício' },
          { name: 'Helio Secco', value: 4.9, wiki: 'Helio Secco' }
        ]
      }],
      CE: [{
        institute: 'Real Time Big Data',
        publication: '15/07/2026',
        field: '13 a 14/07/2026',
        sample: '1.600',
        margin: '±2 p.p.',
        registry: 'CE-05682/2026',
        scenario: 'Intenção de voto para o Senado',
        source: 'https://www.cnnbrasil.com.br/eleicoes/real-time-big-data-cid-e-capitao-wagner-lideram-corrida-ao-senado-no-ce/',
        candidates: [
          { name: 'Cid Gomes', value: 26, wiki: 'Cid Gomes' },
          { name: 'Capitão Wagner', value: 22, wiki: 'Capitão Wagner' },
          { name: 'Luizianne Lins', value: 14, wiki: 'Luizianne Lins' },
          { name: 'Alcides Fernandes', value: 14, wiki: 'Alcides Fernandes' },
          { name: 'General Theophilo', value: 5, wiki: 'Guilherme Theophilo' },
          { name: 'Anna Karina', value: 4, wiki: 'Anna Karina política' },
          { name: 'Cândido Albuquerque', value: 3, wiki: 'Cândido Albuquerque' }
        ]
      }]
    }
  };

  const sectionState = new Map();
  const dataBySection = new Map();
  let sequence = 0;
  let mutationTimer = null;

  const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  })[character]);

  const normalizeName = (value) => String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\b(de|da|do|das|dos|e)\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const formatValue = (value) => Number(value).toLocaleString('pt-BR', {
    minimumFractionDigits: Number(value) % 1 ? 1 : 0,
    maximumFractionDigits: 1
  });

  function getSectionId(section) {
    if (!section.dataset.candidateDirectoryId) {
      sequence += 1;
      section.dataset.candidateDirectoryId = `candidate-directory-${sequence}`;
    }
    return section.dataset.candidateDirectoryId;
  }

  function getState(section) {
    const id = getSectionId(section);
    if (!sectionState.has(id)) {
      sectionState.set(id, {
        query: '',
        offset: 0,
        limit: 24,
        raceUf: '',
        loading: false
      });
    }
    return sectionState.get(id);
  }

  function selectedUf(section) {
    const value = section.querySelector('[data-office-uf]')?.value || 'Todas';
    return value === 'Todas' ? '' : value;
  }

  function pollFor(key, uf) {
    return POLLS[key]?.[uf]?.[0] || null;
  }

  function pollStates(key) {
    return Object.keys(POLLS[key] || {});
  }

  function matchOfficialCandidate(pollCandidate, officialCandidates) {
    const target = normalizeName(pollCandidate.name);
    if (!target) return null;

    const exact = officialCandidates.find((candidate) => (
      normalizeName(candidate.name) === target ||
      normalizeName(candidate.fullName) === target
    ));
    if (exact) return exact;

    return officialCandidates.find((candidate) => {
      const names = [candidate.name, candidate.fullName].map(normalizeName);
      return names.some((name) => name.includes(target) || target.includes(name));
    }) || null;
  }

  function publicPhoto(candidate) {
    const query = new URLSearchParams({
      name: candidate.name,
      wiki: candidate.wiki || candidate.name
    });
    return `/api/public-figure-photo?${query.toString()}`;
  }

  async function fetchOfficialCandidates(key, uf, state) {
    const params = new URLSearchParams({
      office: key,
      limit: String(state.limit),
      offset: String(state.offset)
    });

    if (uf) params.set('uf', uf);
    if (state.query) params.set('q', state.query);

    const response = await fetch(`/api/tse-candidates?${params.toString()}`, {
      headers: { Accept: 'application/json' }
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.ok) {
      throw new Error(data.detail || data.error || 'Candidaturas oficiais indisponíveis.');
    }
    return data;
  }

  function loadingMarkup() {
    return `<div class="candidate-directory-status" aria-live="polite">
      <span class="candidate-directory-spinner" aria-hidden="true"></span>
      <strong>Carregando candidatos e fotos</strong>
      <p>Consultando a base de candidaturas do TSE.</p>
    </div>`;
  }

  function errorMarkup(message) {
    return `<div class="candidate-directory-status" aria-live="polite">
      <strong>Candidaturas oficiais temporariamente indisponíveis</strong>
      <p>${escapeHtml(message)}</p>
    </div>`;
  }

  function emptyMarkup(key, uf) {
    return `<div class="candidate-directory-status">
      <strong>Nenhum candidato oficial localizado</strong>
      <p>${uf
        ? `A base do TSE ainda não retornou candidaturas de ${escapeHtml(OFFICE_NAMES[key])} para ${escapeHtml(uf)}.`
        : 'Selecione uma UF ou aguarde a atualização diária dos registros de candidatura.'}</p>
    </div>`;
  }

  function stateTabsMarkup(key, activeUf) {
    const states = pollStates(key);
    if (!states.length) return '';

    return `<div class="candidate-race-tabs" role="group" aria-label="Estado da pesquisa">
      ${states.map((uf) => `<button type="button" data-race-uf="${uf}" class="${activeUf === uf ? 'active' : ''}">${uf}</button>`).join('')}
    </div>`;
  }

  function pollCandidatesMarkup(key, uf, poll, officialCandidates) {
    return poll.candidates.map((candidate, index) => {
      const official = matchOfficialCandidate(candidate, officialCandidates);
      const photo = official?.photo || publicPhoto(candidate);
      const party = official?.party || 'Partido conforme registro oficial';
      const number = official?.number ? `Nº ${official.number}` : '';
      const status = official?.status || 'Candidato citado na pesquisa';

      return {
        type: 'poll',
        key,
        uf,
        rank: index + 1,
        name: candidate.name,
        party,
        number,
        status,
        photo,
        value: candidate.value,
        poll
      };
    });
  }

  function officialCandidatesMarkup(key, officialCandidates) {
    return officialCandidates.map((candidate, index) => ({
      type: 'official',
      key,
      uf: candidate.uf,
      rank: index + 1,
      name: candidate.name,
      fullName: candidate.fullName,
      party: candidate.party || 'Partido não informado',
      number: candidate.number ? `Nº ${candidate.number}` : 'Número não informado',
      status: candidate.status || 'Candidatura registrada',
      photo: candidate.photo,
      office: candidate.office
    }));
  }

  function cardMarkup(item, index) {
    const valueMarkup = item.type === 'poll'
      ? `<strong class="candidate-result-value">${formatValue(item.value)}%</strong>
         <span class="candidate-result-bar" aria-hidden="true"><i style="--candidate-result:${Math.max(0, Math.min(100, item.value))}%"></i></span>`
      : `<strong class="candidate-official-number">${escapeHtml(item.number)}</strong>
         <span class="candidate-no-result">Sem percentual publicado</span>`;

    return `<button type="button" class="candidate-race-card" data-candidate-index="${index}">
      <span class="candidate-race-photo">
        <img src="${escapeHtml(item.photo)}" alt="Foto de ${escapeHtml(item.name)}" loading="lazy" decoding="async">
        <i>${escapeHtml(item.uf || '')}</i>
        <b>${item.rank}</b>
      </span>
      <span class="candidate-race-copy">
        <strong>${escapeHtml(item.name)}</strong>
        <small>${escapeHtml([item.party, item.number].filter(Boolean).join(' · '))}</small>
        ${valueMarkup}
        <em>${escapeHtml(item.type === 'poll' ? item.poll.institute : item.status)}</em>
      </span>
    </button>`;
  }

  function controlsMarkup(key, state, hasPoll) {
    const isLegislative = ['chamber', 'assembly', 'district'].includes(key);
    if (!isLegislative && hasPoll) return '';

    return `<div class="candidate-directory-controls">
      <label>
        <span>Buscar candidato</span>
        <input type="search" data-candidate-search value="${escapeHtml(state.query)}" placeholder="Nome, partido ou número">
      </label>
      <button type="button" data-candidate-apply>Buscar</button>
    </div>`;
  }

  function pollNoticeMarkup(poll) {
    return `<div class="candidate-poll-meta">
      <span><b>Instituto</b>${escapeHtml(poll.institute)}</span>
      <span><b>Publicação</b>${escapeHtml(poll.publication)}</span>
      <span><b>Campo</b>${escapeHtml(poll.field)}</span>
      <span><b>Amostra</b>${escapeHtml(poll.sample)}</span>
      <span><b>Margem</b>${escapeHtml(poll.margin)}</span>
      <span><b>Registro</b>${escapeHtml(poll.registry)}</span>
      <a href="${escapeHtml(poll.source)}" target="_blank" rel="noopener noreferrer">Abrir fonte</a>
    </div>`;
  }

  function renderDirectory(section, key, state, items, options = {}) {
    const card = section.querySelector('.office-profile-card');
    if (!card) return;

    const id = getSectionId(section);
    dataBySection.set(id, items);

    const title = options.poll
      ? `${OFFICE_LABELS[key]} · ${options.uf}`
      : `${OFFICE_LABELS[key]}${options.uf ? ` · ${options.uf}` : ' · Brasil'}`;

    card.classList.add('candidate-directory-card');
    card.innerHTML = `
      <div class="office-card-heading">
        <div>
          <span>${options.poll ? 'Pesquisa separada por candidato' : 'Candidaturas oficiais separadas'}</span>
          <strong>${escapeHtml(title)}</strong>
        </div>
        <small>${options.poll ? escapeHtml(options.poll.scenario) : 'Fotos e dados da base do TSE'}</small>
      </div>
      ${options.tabs || ''}
      ${controlsMarkup(key, state, Boolean(options.poll))}
      ${options.poll ? pollNoticeMarkup(options.poll) : ''}
      ${items.length
        ? `<div class="candidate-race-grid">${items.map(cardMarkup).join('')}</div>`
        : emptyMarkup(key, options.uf)}
      ${options.hasMore
        ? '<button type="button" class="candidate-load-more" data-candidate-more>Carregar mais candidatos</button>'
        : ''}
      <p class="candidate-directory-note">${options.poll
        ? 'Os percentuais pertencem ao cenário e à pesquisa indicados acima. Fotos oficiais do TSE são usadas quando o registro já está disponível; nos demais casos, o painel usa uma foto pública identificada ou um marcador neutro.'
        : 'A listagem mostra candidaturas registradas no TSE. A ausência de percentual significa que não há pesquisa nominal verificável associada a este painel.'}</p>`;

    bindDirectoryEvents(section, key, state);
  }

  function showLoading(section) {
    const card = section.querySelector('.office-profile-card');
    if (!card) return;
    card.classList.add('candidate-directory-card');
    card.innerHTML = loadingMarkup();
  }

  function showError(section, message) {
    const card = section.querySelector('.office-profile-card');
    if (!card) return;
    card.classList.add('candidate-directory-card');
    card.innerHTML = errorMarkup(message);
  }

  async function enhanceSection(section) {
    if (section.dataset.candidateDirectoryLoading === 'true') return;

    const key = section.dataset.officeKey;
    if (!OFFICE_NAMES[key]) return;

    const card = section.querySelector('.office-profile-card');
    if (!card || card.dataset.candidateDirectoryReady === 'true') return;

    card.dataset.candidateDirectoryReady = 'true';
    section.dataset.candidateDirectoryLoading = 'true';

    const state = getState(section);
    const filterUf = selectedUf(section);
    const availablePollStates = pollStates(key);
    const raceUf = filterUf || state.raceUf || availablePollStates[0] || '';
    state.raceUf = raceUf;

    showLoading(section);

    try {
      const poll = raceUf ? pollFor(key, raceUf) : null;
      const officialData = await fetchOfficialCandidates(key, poll ? raceUf : filterUf, state);
      const officialCandidates = officialData.candidates || [];

      if (poll) {
        const items = pollCandidatesMarkup(key, raceUf, poll, officialCandidates);
        renderDirectory(section, key, state, items, {
          poll,
          uf: raceUf,
          tabs: filterUf ? '' : stateTabsMarkup(key, raceUf),
          hasMore: false
        });
      } else {
        const items = officialCandidatesMarkup(key, officialCandidates);
        renderDirectory(section, key, state, items, {
          uf: filterUf,
          tabs: '',
          hasMore: Boolean(officialData.meta?.hasMore)
        });
      }
    } catch (error) {
      const poll = raceUf ? pollFor(key, raceUf) : null;
      if (poll) {
        const items = pollCandidatesMarkup(key, raceUf, poll, []);
        renderDirectory(section, key, state, items, {
          poll,
          uf: raceUf,
          tabs: filterUf ? '' : stateTabsMarkup(key, raceUf),
          hasMore: false
        });
      } else {
        showError(section, error.message);
      }
    } finally {
      section.dataset.candidateDirectoryLoading = 'false';
    }
  }

  function bindDirectoryEvents(section, key, state) {
    section.querySelectorAll('[data-race-uf]').forEach((button) => {
      button.addEventListener('click', () => {
        state.raceUf = button.dataset.raceUf;
        state.offset = 0;
        const card = section.querySelector('.office-profile-card');
        if (card) card.dataset.candidateDirectoryReady = 'false';
        enhanceSection(section);
      });
    });

    const search = section.querySelector('[data-candidate-search]');
    const apply = section.querySelector('[data-candidate-apply]');

    const runSearch = () => {
      state.query = search?.value.trim() || '';
      state.offset = 0;
      const card = section.querySelector('.office-profile-card');
      if (card) card.dataset.candidateDirectoryReady = 'false';
      enhanceSection(section);
    };

    apply?.addEventListener('click', runSearch);
    search?.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') runSearch();
    });

    section.querySelector('[data-candidate-more]')?.addEventListener('click', () => {
      state.limit = Math.min(120, state.limit + 24);
      state.offset = 0;
      const card = section.querySelector('.office-profile-card');
      if (card) card.dataset.candidateDirectoryReady = 'false';
      enhanceSection(section);
    });

    section.querySelectorAll('[data-candidate-index]').forEach((button) => {
      button.addEventListener('click', () => openCandidateDialog(
        section,
        Number(button.dataset.candidateIndex)
      ));
    });

    section.querySelectorAll('.candidate-race-photo img').forEach((image) => {
      image.addEventListener('error', () => {
        const name = image.alt.replace(/^Foto de\s+/i, '');
        const query = new URLSearchParams({ name });
        image.src = `/api/public-figure-photo?${query.toString()}`;
      }, { once: true });
    });
  }

  function openCandidateDialog(section, index) {
    const id = getSectionId(section);
    const item = dataBySection.get(id)?.[index];
    const dialog = document.getElementById('detailDialog');
    const body = document.getElementById('dialogBody');
    if (!item || !dialog || !body) return;

    const pollDetails = item.type === 'poll'
      ? `<div class="candidate-dialog-metrics">
          <div><span>Resultado</span><strong>${formatValue(item.value)}%</strong></div>
          <div><span>Instituto</span><strong>${escapeHtml(item.poll.institute)}</strong></div>
          <div><span>Publicação</span><strong>${escapeHtml(item.poll.publication)}</strong></div>
          <div><span>Campo</span><strong>${escapeHtml(item.poll.field)}</strong></div>
          <div><span>Amostra</span><strong>${escapeHtml(item.poll.sample)}</strong></div>
          <div><span>Margem</span><strong>${escapeHtml(item.poll.margin)}</strong></div>
          <div><span>Registro</span><strong>${escapeHtml(item.poll.registry)}</strong></div>
          <div><span>Cenário</span><strong>${escapeHtml(item.poll.scenario)}</strong></div>
        </div>
        <a class="wide-action candidate-dialog-source" href="${escapeHtml(item.poll.source)}" target="_blank" rel="noopener noreferrer">Abrir publicação da pesquisa</a>`
      : `<div class="candidate-dialog-metrics">
          <div><span>Cargo</span><strong>${escapeHtml(item.office || OFFICE_NAMES[item.key])}</strong></div>
          <div><span>UF</span><strong>${escapeHtml(item.uf)}</strong></div>
          <div><span>Partido</span><strong>${escapeHtml(item.party)}</strong></div>
          <div><span>Número</span><strong>${escapeHtml(item.number)}</strong></div>
          <div><span>Situação</span><strong>${escapeHtml(item.status)}</strong></div>
          <div><span>Percentual</span><strong>Não publicado</strong></div>
        </div>`;

    body.innerHTML = `<div class="candidate-dialog-hero">
      <img src="${escapeHtml(item.photo)}" alt="Foto de ${escapeHtml(item.name)}">
      <div>
        <span>${escapeHtml(OFFICE_LABELS[item.key])} · ${escapeHtml(item.uf)}</span>
        <h2>${escapeHtml(item.name)}</h2>
        <p>${escapeHtml([item.party, item.number].filter(Boolean).join(' · '))}</p>
        <small>${escapeHtml(item.status)}</small>
      </div>
    </div>
    ${pollDetails}`;

    dialog.showModal();
  }

  function enhanceAll() {
    document.querySelectorAll('.office-experience[data-office-key]').forEach((section) => {
      enhanceSection(section);
    });
  }

  function observeOfficeRenders() {
    const observer = new MutationObserver(() => {
      clearTimeout(mutationTimer);
      mutationTimer = setTimeout(enhanceAll, 80);
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function init() {
    enhanceAll();
    observeOfficeRenders();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
