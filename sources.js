(() => {
  const directory = document.getElementById('sourceDirectory');
  const itemsBox = document.getElementById('sourceItems');
  const status = document.getElementById('sourceStatus');
  const search = document.getElementById('sourceSearch');
  const scope = document.getElementById('sourceScope');
  const refresh = document.getElementById('sourceRefresh');
  if (!directory || !itemsBox) return;

  let payload = { sources: [], items: [] };

  const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const fmtDate = value => new Date(value).toLocaleString('pt-BR', {
    dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo'
  });

  function sourceCard(source) {
    const coverage = source.coverage.map(item => `<span>${item}</span>`).join('');
    return `<article class="source-card">
      <div class="source-card-top">
        <div>
          <span class="source-kind">${source.kind}</span>
          <h3>${source.name}</h3>
        </div>
        <span class="source-health ${source.online ? 'online' : 'limited'}">${source.online ? 'ON-LINE' : 'LINK DIRETO'}</span>
      </div>
      <p>${source.description}</p>
      <div class="source-coverage">${coverage}</div>
      <a href="${source.url}" target="_blank" rel="noopener">Abrir fonte</a>
    </article>`;
  }

  function render() {
    const query = normalize(search.value);
    const selectedScope = scope.value;

    const sources = payload.sources.filter(source => {
      const text = normalize([source.name, source.description, source.coverage.join(' ')].join(' '));
      return (!query || text.includes(query)) && (selectedScope === 'Todas' || source.coverage.includes(selectedScope));
    });

    const items = payload.items.filter(item => {
      const text = normalize([item.title, item.source, item.scope].join(' '));
      return (!query || text.includes(query)) && (selectedScope === 'Todas' || item.scope === selectedScope);
    });

    directory.innerHTML = sources.length ? sources.map(sourceCard).join('') : '<div class="source-empty">Nenhuma fonte corresponde aos filtros.</div>';
    itemsBox.innerHTML = items.length ? `
      <div class="source-feed-heading"><h3>Publicações encontradas nas fontes primárias</h3><span>${items.length} resultados</span></div>
      <div class="source-feed">${items.map(item => `
        <a class="source-item" href="${item.url}" target="_blank" rel="noopener">
          <span class="source-item-scope">${item.scope}</span>
          <strong>${item.title}</strong>
          <small>${item.source} · fonte primária</small>
        </a>`).join('')}</div>` : `
      <div class="source-empty">
        Nenhuma publicação local foi identificada com estes filtros. Use os cartões acima para consultar diretamente os institutos e o detalhamento de município/bairro do TSE.
      </div>`;
  }

  async function loadSources() {
    refresh.disabled = true;
    status.className = 'source-status checking';
    status.textContent = 'Consultando fontes confiáveis…';
    try {
      const response = await fetch('/api/sources?ts=' + Date.now(), { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error('Falha na consulta');
      payload = data;
      status.className = 'source-status online';
      status.textContent = `Fontes verificadas em ${fmtDate(data.checkedAt)}. Atualização automática a cada 15 minutos.`;
      render();
    } catch {
      status.className = 'source-status limited';
      status.textContent = 'Não foi possível atualizar o radar agora. Os links diretos continuam disponíveis.';
      payload = {
        sources: [
          {name:'TSE / PesqEle',kind:'Fonte oficial',coverage:['Nacional','Estadual','Municipal','Bairro'],url:'https://dadosabertos.tse.jus.br/dataset/pesquisas-eleitorais-2026',description:'Registro oficial, questionários e detalhamento de município e bairro.',online:true},
          {name:'AtlasIntel',kind:'Instituto — fonte primária',coverage:['Nacional','Estadual','Municipal'],url:'https://atlasintel.org/polls/exclusive-polls',description:'Relatórios públicos nacionais, estaduais e locais.',online:true},
          {name:'Quaest',kind:'Instituto — fonte primária',coverage:['Nacional','Estadual','Municipal'],url:'https://quaest.com.br/categoria/analises-de-pesquisas/',description:'Análises e relatórios eleitorais.',online:true},
          {name:'Paraná Pesquisas',kind:'Instituto — fonte primária',coverage:['Nacional','Estadual','Municipal'],url:'https://paranapesquisas.com.br/pesquisas/',description:'Arquivo público de levantamentos registrados.',online:true},
          {name:'GERP',kind:'Instituto — fonte primária',coverage:['Nacional','Estadual','Municipal'],url:'https://www.gerp.com.br/eleitoral.html',description:'Pesquisas eleitorais e políticas.',online:true}
        ],
        items: []
      };
      render();
    } finally {
      refresh.disabled = false;
    }
  }

  search.addEventListener('input', render);
  scope.addEventListener('change', render);
  refresh.addEventListener('click', loadSources);
  loadSources();
  setInterval(loadSources, 15 * 60 * 1000);
})();