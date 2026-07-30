(() => {
  'use strict';

  const HOST_ID = 'elections2026';
  const API = '/api/election-results-v2';
  const SECTION_API = '/api/election-section-detail';
  const COLORS = ['#047857', '#1d4ed8', '#dc2626', '#7e22ce', '#ea580c', '#0f766e', '#be123c', '#334155', '#ca8a04', '#0891b2', '#4f46e5', '#64748b'];
  const UFS = {
    br: 'Brasil', ac: 'Acre', al: 'Alagoas', ap: 'Amapá', am: 'Amazonas', ba: 'Bahia', ce: 'Ceará', df: 'Distrito Federal',
    es: 'Espírito Santo', go: 'Goiás', ma: 'Maranhão', mt: 'Mato Grosso', ms: 'Mato Grosso do Sul', mg: 'Minas Gerais',
    pa: 'Pará', pb: 'Paraíba', pr: 'Paraná', pe: 'Pernambuco', pi: 'Piauí', rj: 'Rio de Janeiro', rn: 'Rio Grande do Norte',
    rs: 'Rio Grande do Sul', ro: 'Rondônia', rr: 'Roraima', sc: 'Santa Catarina', sp: 'São Paulo', se: 'Sergipe', to: 'Tocantins'
  };
  const CARGOS = [
    ['president', 'Presidente'],
    ['governor', 'Governador'],
    ['senator', 'Senador'],
    ['federalDeputy', 'Deputado Federal'],
    ['stateDeputy', 'Deputado Estadual/Distrital']
  ];
  const WIKI = {
    LULA: 'Luiz Inácio Lula da Silva',
    'JAIR BOLSONARO': 'Jair Bolsonaro',
    'SIMONE TEBET': 'Simone Tebet',
    'CIRO GOMES': 'Ciro Gomes',
    'SORAYA THRONICKE': 'Soraya Thronicke',
    "FELIPE D'AVILA": "Felipe d'Avila",
    'PADRE KELMON': 'Padre Kelmon',
    'LÉO PÉRICLES': 'Léo Péricles',
    'SOFIA MANZANO': 'Sofia Manzano',
    VERA: 'Vera Lúcia Salgado',
    'CONSTITUINTE EYMAEL': 'José Maria Eymael'
  };

  const ui = {
    active: false,
    rendering: false,
    loaded: false,
    year: 2026,
    round: 1,
    cargo: 'president',
    uf: 'br',
    municipality: '',
    zone: '',
    section: '',
    sectionSearch: '',
    chartMode: 'comparison',
    selectedCandidate: '',
    status: null,
    summary: null,
    historical: null,
    states: [],
    municipalities: [],
    municipalityResult: null,
    sections: [],
    sectionDetail: null,
    map: null,
    loading: false,
    granularLoading: false,
    sectionLoading: false,
    error: '',
    granularError: '',
    sectionError: '',
    requestId: 0,
    timer: null,
    lastUpdated: null
  };

  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
    }[char]));
  }

  function fmtInt(value) {
    const number = Number(value || 0);
    return Number.isFinite(number) ? number.toLocaleString('pt-BR', { maximumFractionDigits: 0 }) : '0';
  }

  function fmtPct(value, digits = 2) {
    const number = Number(value || 0);
    return Number.isFinite(number)
      ? `${number.toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits })}%`
      : '0%';
  }

  function cargoLabel() {
    return CARGOS.find(([id]) => id === ui.cargo)?.[1] || ui.cargo;
  }

  function ufLabel(value = ui.uf) {
    return UFS[String(value || 'br').toLowerCase()] || String(value || '').toUpperCase();
  }

  function candidateKey(candidate) {
    return String(candidate?.number || candidate?.name || candidate?.ballotName || '').trim().toUpperCase();
  }

  function colorFor(candidate, index = 0) {
    const signature = `${candidate?.number || ''}|${candidate?.party || ''}|${candidate?.name || ''}`;
    let hash = 0;
    for (let i = 0; i < signature.length; i += 1) hash = ((hash << 5) - hash + signature.charCodeAt(i)) | 0;
    return COLORS[Math.abs(hash || index) % COLORS.length];
  }

  function person(candidate, index = 0) {
    const name = String(candidate?.name || candidate?.ballotName || `Candidato ${candidate?.number || ''}`).trim();
    const wiki = WIKI[name.toUpperCase()] || name;
    return {
      ...candidate,
      name,
      party: candidate?.party || 'Partido não informado',
      color: colorFor(candidate, index),
      key: candidateKey(candidate),
      photo: `/api/public-figure-photo?name=${encodeURIComponent(name)}&wiki=${encodeURIComponent(wiki)}`
    };
  }

  function initials(name) {
    return String(name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  }

  function photo(candidate, size = 'md') {
    const sizes = {
      sm: 'h-10 w-10 text-xs',
      md: 'h-14 w-14 text-sm',
      lg: 'h-20 w-20 text-lg',
      xl: 'h-28 w-28 text-2xl'
    };
    const cls = sizes[size] || sizes.md;
    return `<span class="relative grid ${cls} shrink-0 place-items-center overflow-hidden border border-slate-300 bg-slate-200 font-display font-black text-slate-600">
      <span>${esc(initials(candidate.name))}</span>
      <img data-election-complete-photo class="absolute inset-0 h-full w-full object-cover" src="${esc(candidate.photo)}" alt="Foto de ${esc(candidate.name)}" loading="lazy">
    </span>`;
  }

  function query(params) {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== '' && value !== null && value !== undefined) search.set(key, String(value));
    });
    return `${API}?${search}`;
  }

  async function json(url) {
    const response = await fetch(url, { cache: 'no-store' });
    const payload = await response.json();
    if (!response.ok || !payload.ok) throw new Error(payload.detail || payload.error || 'Falha ao consultar os dados eleitorais.');
    return payload;
  }

  function countdown() {
    const target = new Date('2026-10-04T08:00:00-03:00').getTime();
    const diff = target - Date.now();
    if (diff <= 0) return 'Dia da votação';
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    return `${days}d ${hours}h`;
  }

  function headerMarkup() {
    return `<header class="border border-slate-200 bg-white" data-election-complete-motion>
      <div class="grid gap-5 border-t-4 border-emerald-500 p-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div>
          <span class="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">Apuração, território e auditoria</span>
          <h1 class="mt-2 font-display text-4xl font-black uppercase leading-none text-slate-950 sm:text-5xl">Eleições 2026</h1>
          <p class="mt-3 max-w-4xl text-sm leading-relaxed text-slate-600 sm:text-base">Central eleitoral com o resultado final de 2022, preparação para a apuração oficial de 2026, fotos dos candidatos, gráficos interativos e navegação do Brasil até município, zona e seção.</p>
        </div>
        <div class="flex flex-wrap gap-2 lg:justify-end">
          <span class="status-chip"><i class="bg-emerald-500"></i>Fonte oficial TSE</span>
          <span class="status-chip"><i class="bg-blue-500"></i>2022 × 2026</span>
          <span class="status-chip"><i class="bg-amber-500"></i>Sem votos simulados</span>
        </div>
      </div>
    </header>`;
  }

  function statusMarkup() {
    const live = Boolean(ui.status?.live && ui.summary?.live);
    const sourceUnavailable = ui.status?.phase === 'source-unavailable';
    const title = live ? 'Apuração oficial em andamento' : sourceUnavailable ? 'Fonte oficial temporariamente indisponível' : 'Aguardando abertura da apuração 2026';
    const text = live
      ? 'A tela atualiza automaticamente os arquivos oficiais do TSE. A data e o horário de cada atualização ficam visíveis no painel.'
      : 'O painel não preenche 2026 com pesquisa, projeção ou número inventado. Até a totalização ser liberada, 2022 permanece como base histórica.';
    return `<section class="border-l-4 ${live ? 'border-emerald-500 bg-emerald-50' : 'border-amber-500 bg-amber-50'} p-4" data-election-complete-motion>
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex items-start gap-3"><i class="mt-1 h-3 w-3 shrink-0 ${live ? 'animate-pulse bg-emerald-500' : 'bg-amber-500'}"></i><div><strong class="font-display text-2xl uppercase text-slate-950">${esc(title)}</strong><p class="mt-1 text-sm leading-relaxed text-slate-700">${esc(text)}</p></div></div>
        <div class="shrink-0 border border-slate-300 bg-white px-4 py-2 text-right"><span class="block text-[10px] font-bold uppercase tracking-widest text-slate-500">1º turno · 4 de outubro</span><b class="font-display text-2xl text-slate-950">${esc(countdown())}</b></div>
      </div>
    </section>`;
  }

  function controlsMarkup() {
    const historical = ui.year === 2022;
    const ufs = Object.entries(UFS).filter(([id]) => ui.cargo === 'president' || id !== 'br');
    const zones = ui.municipalityResult?.zones || [];
    return `<section class="border border-slate-200 bg-white" data-election-complete-motion>
      <div class="border-b border-slate-200 bg-slate-50 p-3">
        <span class="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700">Navegação ponta a ponta</span>
        <strong class="mt-1 block font-display text-xl uppercase text-slate-950">Ano, cargo, turno, estado, município, zona e seção</strong>
      </div>
      <div class="grid gap-3 p-3 sm:grid-cols-2 xl:grid-cols-4">
        <label class="control-label"><span>Base exibida</span><select class="control-select" data-e26-year><option value="2026" ${ui.year === 2026 ? 'selected' : ''}>2026 · apuração ao vivo</option><option value="2022" ${historical ? 'selected' : ''}>2022 · resultado final</option></select></label>
        <label class="control-label"><span>Cargo</span><select class="control-select" data-e26-cargo>${CARGOS.map(([id, label]) => `<option value="${id}" ${ui.cargo === id ? 'selected' : ''}>${esc(label)}</option>`).join('')}</select></label>
        <label class="control-label"><span>Turno</span><select class="control-select" data-e26-round><option value="1" ${ui.round === 1 ? 'selected' : ''}>1º turno</option>${['president', 'governor'].includes(ui.cargo) ? `<option value="2" ${ui.round === 2 ? 'selected' : ''}>2º turno</option>` : ''}</select></label>
        <label class="control-label"><span>Estado</span><select class="control-select" data-e26-uf>${ufs.map(([id, label]) => `<option value="${id}" ${ui.uf === id ? 'selected' : ''}>${esc(label)}${id === 'br' ? '' : ` · ${id.toUpperCase()}`}</option>`).join('')}</select></label>
        <label class="control-label"><span>Município</span><select class="control-select" data-e26-municipality ${!historical || ui.uf === 'br' || ui.granularLoading ? 'disabled' : ''}><option value="">${historical ? 'Todos os municípios' : 'Ativado quando o TSE liberar'}</option>${ui.municipalities.map((item) => `<option value="${esc(item.code)}" ${ui.municipality === item.code ? 'selected' : ''}>${esc(item.name)}</option>`).join('')}</select></label>
        <label class="control-label"><span>Zona eleitoral</span><select class="control-select" data-e26-zone ${!zones.length ? 'disabled' : ''}><option value="">Todas as zonas</option>${zones.map((item) => `<option value="${esc(item.code)}" ${ui.zone === item.code ? 'selected' : ''}>Zona ${esc(item.code)}</option>`).join('')}</select></label>
        <label class="control-label"><span>Seção eleitoral</span><select class="control-select" data-e26-section ${!ui.sections.length ? 'disabled' : ''}><option value="">Todas as seções</option>${ui.sections.map((item) => `<option value="${esc(item.section)}" ${ui.section === item.section ? 'selected' : ''}>Seção ${esc(item.section)}</option>`).join('')}</select></label>
        <div class="flex items-end"><button type="button" data-e26-refresh class="control-button min-h-11 w-full">${ui.loading ? 'Atualizando…' : 'Atualizar fonte oficial'}</button></div>
      </div>
      ${ui.granularError ? `<p class="border-t border-red-200 bg-red-50 p-3 text-sm text-red-800">${esc(ui.granularError)}</p>` : ''}
    </section>`;
  }

  function metric(label, value, detail, accent, delay) {
    const border = { green: 'border-t-emerald-500', blue: 'border-t-blue-500', red: 'border-t-red-500', amber: 'border-t-amber-500' }[accent];
    return `<article class="border border-slate-200 border-t-4 ${border} bg-white p-4" data-election-complete-motion style="--e26-delay:${delay}ms">
      <span class="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">${esc(label)}</span>
      <strong class="mt-2 block font-display text-3xl uppercase text-slate-950">${esc(value)}</strong>
      <small class="mt-1 block text-xs leading-relaxed text-slate-500">${esc(detail)}</small>
    </article>`;
  }

  function metricsMarkup() {
    const result = ui.year === 2026 ? ui.summary : ui.historical;
    const waiting = !result || result.waiting;
    const candidateVotes = (result?.candidates || []).reduce((sum, item) => sum + Number(item.votes || 0), 0);
    const turnout = Number(result?.turnout || 0);
    const electorate = Number(result?.electorate || 0);
    const turnoutPct = electorate ? (turnout / electorate) * 100 : 0;
    const updated = [result?.updatedDate, result?.updatedTime].filter(Boolean).join(' · ') || 'Sem atualização';
    return `<section class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      ${metric('Votos nos candidatos', waiting ? '—' : fmtInt(candidateVotes), waiting ? '2026 ainda sem totalização' : `${cargoLabel()} · ${ufLabel()}`, 'green', 70)}
      ${metric('Seções totalizadas', waiting ? '0%' : fmtPct(result?.sectionsPercentage || 0), waiting ? 'Nenhuma seção de 2026 aberta' : `${fmtInt(result?.sectionsTotalized)} de ${fmtInt(result?.sectionsTotal)}`, 'blue', 110)}
      ${metric('Comparecimento', waiting ? '—' : fmtPct(turnoutPct, 1), waiting ? 'Aguardando apuração' : `${fmtInt(turnout)} eleitores`, 'red', 150)}
      ${metric('Atualização oficial', waiting ? 'Aguardando' : updated, result?.sourceUrl ? 'Arquivo TSE identificado' : 'Conexão preparada', 'amber', 190)}
    </section>`;
  }

  function resultForDisplay() {
    return ui.year === 2026 ? ui.summary : ui.historical;
  }

  function candidateCardsMarkup(result = resultForDisplay()) {
    const rows = (result?.candidates || []).slice(0, 16).map(person);
    if (!rows.length) return `<div class="grid min-h-64 place-items-center border border-dashed border-slate-300 bg-slate-50 p-6 text-center"><div><strong class="font-display text-2xl uppercase text-slate-700">Aguardando votos oficiais</strong><p class="mt-2 max-w-xl text-sm text-slate-500">Os candidatos e votos de 2026 aparecerão apenas quando a totalização do TSE estiver disponível.</p></div></div>`;
    const max = Math.max(1, ...rows.map((item) => Number(item.votes || 0)));
    return `<div class="space-y-2">${rows.map((item, index) => {
      const selected = !ui.selectedCandidate || ui.selectedCandidate === item.key;
      return `<button type="button" data-e26-candidate="${esc(item.key)}" class="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border bg-white p-3 text-left transition ${selected ? 'border-slate-200 opacity-100' : 'border-slate-100 opacity-35'} hover:border-slate-500" style="--candidate:${item.color}">
        <span class="relative"><i class="absolute -left-1 -top-1 z-10 grid h-5 min-w-5 place-items-center bg-slate-950 px-1 font-display text-xs text-white">${index + 1}</i>${photo(item, 'md')}</span>
        <span class="min-w-0"><strong class="block truncate text-sm text-slate-950">${esc(item.name)}</strong><small class="block truncate text-[10px] font-black uppercase text-slate-500">${esc(item.party)}${item.number ? ` · ${esc(item.number)}` : ''}</small><span class="mt-2 block h-2.5 overflow-hidden bg-slate-100"><i data-e26-bar class="block h-full origin-left" style="width:${(Number(item.votes || 0) / max) * 100}%;background:${item.color};--e26-delay:${index * 45}ms"></i></span></span>
        <span class="text-right"><b class="block font-display text-2xl text-slate-950">${fmtPct(item.percentage || 0)}</b><small class="text-[10px] text-slate-500">${fmtInt(item.votes)} votos</small></span>
      </button>`;
    }).join('')}</div>`;
  }

  function mergeComparison() {
    const oldRows = (ui.historical?.candidates || []).slice(0, 12);
    const newRows = (ui.summary?.candidates || []).slice(0, 12);
    const map = new Map();
    oldRows.forEach((item, index) => {
      const p = person(item, index);
      map.set(p.key, { key: p.key, label: p.name, color: p.color, old: p, current: null });
    });
    newRows.forEach((item, index) => {
      const p = person(item, index);
      const existing = map.get(p.key);
      if (existing) existing.current = p;
      else map.set(p.key, { key: p.key, label: p.name, color: p.color, old: null, current: p });
    });
    return [...map.values()].sort((a, b) => Number(b.current?.votes || b.old?.votes || 0) - Number(a.current?.votes || a.old?.votes || 0)).slice(0, 10);
  }

  function comparisonChart() {
    const rows = mergeComparison();
    if (!rows.length) return '<div class="p-6 text-sm text-slate-500">Sem dados para o gráfico.</div>';
    return `<div class="space-y-3 p-4">${rows.map((row, index) => {
      const oldPct = Number(row.old?.percentage || 0);
      const currentPct = Number(row.current?.percentage || 0);
      const selected = !ui.selectedCandidate || ui.selectedCandidate === row.key;
      return `<button type="button" data-e26-candidate="${esc(row.key)}" class="grid w-full gap-2 border-b border-slate-100 pb-3 text-left ${selected ? '' : 'opacity-30'}">
        <div class="flex items-center justify-between gap-3"><strong class="truncate text-xs text-slate-800">${esc(row.label)}</strong><span class="text-[10px] font-bold uppercase text-slate-500">${row.current ? `2026 ${fmtPct(currentPct, 1)}` : '2026 aguardando'} · 2022 ${fmtPct(oldPct, 1)}</span></div>
        <div class="grid grid-cols-[42px_minmax(0,1fr)_48px] items-center gap-2"><small class="font-black text-blue-700">2022</small><span class="h-3 bg-slate-100"><i data-e26-bar class="block h-full bg-blue-600" style="width:${Math.min(100, oldPct * 2)}%;--e26-delay:${index * 45}ms"></i></span><b class="text-right text-xs">${fmtPct(oldPct, 1)}</b></div>
        <div class="grid grid-cols-[42px_minmax(0,1fr)_48px] items-center gap-2"><small class="font-black text-emerald-700">2026</small><span class="h-3 bg-slate-100"><i data-e26-bar class="block h-full" style="width:${Math.min(100, currentPct * 2)}%;background:${row.color};--e26-delay:${80 + index * 45}ms"></i></span><b class="text-right text-xs">${row.current ? fmtPct(currentPct, 1) : '—'}</b></div>
      </button>`;
    }).join('')}</div>`;
  }

  function donut(result, title, accent) {
    const electorate = Number(result?.electorate || 0);
    const turnout = Number(result?.turnout || 0);
    const abstentions = Number(result?.abstentions || Math.max(0, electorate - turnout));
    const valid = Number(result?.validVotes || 0);
    const blank = Number(result?.blankVotes || 0);
    const nil = Number(result?.nullVotes || 0);
    const turnoutPct = electorate ? (turnout / electorate) * 100 : 0;
    const circumference = 251.2;
    const dash = (turnoutPct / 100) * circumference;
    return `<article class="border border-slate-200 bg-white p-4">
      <span class="text-[10px] font-black uppercase tracking-widest text-slate-500">${esc(title)}</span>
      <div class="mt-3 grid grid-cols-[150px_minmax(0,1fr)] items-center gap-4">
        <svg viewBox="0 0 120 120" class="h-36 w-36" role="img" aria-label="Comparecimento ${fmtPct(turnoutPct, 1)}">
          <circle cx="60" cy="60" r="40" fill="none" stroke="#e2e8f0" stroke-width="14"></circle>
          <circle data-e26-donut cx="60" cy="60" r="40" fill="none" stroke="${accent}" stroke-width="14" stroke-linecap="butt" transform="rotate(-90 60 60)" stroke-dasharray="${dash} ${circumference - dash}"></circle>
          <text x="60" y="57" text-anchor="middle" font-size="17" font-weight="800" fill="#0f172a">${fmtPct(turnoutPct, 1)}</text>
          <text x="60" y="73" text-anchor="middle" font-size="8" font-weight="700" fill="#64748b">COMPARECIMENTO</text>
        </svg>
        <dl class="space-y-2 text-xs">
          <div class="flex justify-between gap-3"><dt>Eleitorado</dt><dd class="font-bold">${fmtInt(electorate)}</dd></div>
          <div class="flex justify-between gap-3"><dt>Comparecimento</dt><dd class="font-bold">${fmtInt(turnout)}</dd></div>
          <div class="flex justify-between gap-3"><dt>Abstenções</dt><dd class="font-bold">${fmtInt(abstentions)}</dd></div>
          <div class="flex justify-between gap-3"><dt>Válidos</dt><dd class="font-bold">${fmtInt(valid)}</dd></div>
          <div class="flex justify-between gap-3"><dt>Brancos</dt><dd class="font-bold">${fmtInt(blank)}</dd></div>
          <div class="flex justify-between gap-3"><dt>Nulos</dt><dd class="font-bold">${fmtInt(nil)}</dd></div>
        </dl>
      </div>
    </article>`;
  }

  function participationChart() {
    const current = resultForDisplay();
    const currentTitle = ui.year === 2026 ? 'Apuração 2026' : 'Resultado selecionado de 2022';
    return `<div class="grid gap-4 p-4 lg:grid-cols-2">${donut(current, currentTitle, '#047857')}${donut(ui.historical, 'Base histórica 2022', '#1d4ed8')}</div>`;
  }

  function zoneChart() {
    const zones = ui.municipalityResult?.zones || [];
    if (!zones.length) return `<div class="grid min-h-72 place-items-center p-6 text-center"><div><strong class="font-display text-xl uppercase text-slate-700">Selecione um município</strong><p class="mt-2 text-sm text-slate-500">As zonas serão comparadas por volume de votos e candidatura mais votada.</p></div></div>`;
    const rows = zones.map((zone) => {
      const total = (zone.candidates || []).reduce((sum, item) => sum + Number(item.votes || 0), 0);
      return { zone, total, winner: zone.candidates?.[0] || null };
    }).sort((a, b) => b.total - a.total);
    const max = Math.max(1, ...rows.map((item) => item.total));
    return `<div class="space-y-2 p-4">${rows.map((item, index) => {
      const winner = item.winner ? person(item.winner, index) : null;
      return `<button type="button" data-e26-zone-button="${esc(item.zone.code)}" class="grid w-full grid-cols-[70px_minmax(0,1fr)_auto] items-center gap-3 border border-slate-200 bg-white p-3 text-left hover:border-emerald-500">
        <b class="font-display text-xl text-slate-950">Z ${esc(item.zone.code)}</b>
        <span class="min-w-0"><span class="flex justify-between gap-2"><strong class="truncate text-xs">${winner ? esc(winner.name) : 'Sem vencedor'}</strong><small class="text-[10px] text-slate-500">${winner ? fmtPct(winner.percentage, 1) : ''}</small></span><span class="mt-2 block h-3 bg-slate-100"><i data-e26-bar class="block h-full" style="width:${(item.total / max) * 100}%;background:${winner?.color || '#64748b'};--e26-delay:${index * 55}ms"></i></span></span>
        <span class="text-right"><strong class="font-display text-lg">${fmtInt(item.total)}</strong><small class="block text-[9px] uppercase text-slate-500">votos</small></span>
      </button>`;
    }).join('')}</div>`;
  }

  function chartsMarkup() {
    const content = ui.chartMode === 'participation' ? participationChart() : ui.chartMode === 'zones' ? zoneChart() : comparisonChart();
    return `<section class="border border-slate-200 bg-white" data-election-complete-motion>
      <div class="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div><span class="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700">Gráficos interativos</span><strong class="mt-1 block font-display text-2xl uppercase text-slate-950">Leitura da apuração</strong></div>
        <div class="flex flex-wrap gap-2">
          ${[['comparison', '2022 × 2026'], ['participation', 'Comparecimento'], ['zones', 'Zonas eleitorais']].map(([id, label]) => `<button type="button" data-e26-chart="${id}" class="min-h-10 border px-3 text-xs font-black uppercase ${ui.chartMode === id ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-300 bg-white text-slate-700'}">${esc(label)}</button>`).join('')}
        </div>
      </div>
      ${content}
      <div class="border-t border-slate-200 bg-slate-50 px-4 py-2 text-[10px] font-bold uppercase tracking-wide text-slate-500">Clique em um candidato ou zona para filtrar o restante da página. Ausência de dado em 2026 aparece como traço, nunca como zero.</div>
    </section>`;
  }

  function resultsMarkup() {
    return `<section class="grid gap-4 xl:grid-cols-[1.15fr_.85fr]" data-election-complete-motion>
      <article class="border border-slate-200 bg-white">
        <div class="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 p-4"><div><span class="text-[10px] font-black uppercase tracking-widest text-emerald-700">${ui.year === 2026 ? 'Apuração atual' : 'Resultado histórico'}</span><strong class="mt-1 block font-display text-2xl uppercase text-slate-950">${esc(cargoLabel())} · ${esc(ufLabel())}</strong></div><span class="table-badge">${ui.round}º turno · ${ui.year}</span></div>
        <div class="p-4">${candidateCardsMarkup()}</div>
      </article>
      <article class="border border-slate-200 bg-white">
        <div class="border-b border-slate-200 bg-slate-50 p-4"><span class="text-[10px] font-black uppercase tracking-widest text-blue-700">Última eleição</span><strong class="mt-1 block font-display text-2xl uppercase text-slate-950">Resultado final de 2022</strong><p class="mt-1 text-xs text-slate-500">Mesmo cargo, turno e UF selecionados.</p></div>
        <div class="p-4">${candidateCardsMarkup(ui.historical)}</div>
      </article>
    </section>`;
  }

  function mapPath(rings, bounds, width, height) {
    const [minX, minY, maxX, maxY] = bounds;
    const pad = 16;
    const scale = Math.min((width - pad * 2) / Math.max(.0001, maxX - minX), (height - pad * 2) / Math.max(.0001, maxY - minY));
    const offsetX = (width - (maxX - minX) * scale) / 2;
    const offsetY = (height - (maxY - minY) * scale) / 2;
    return rings.map((ring) => ring.map(([lon, lat], index) => {
      const x = offsetX + (lon - minX) * scale;
      const y = height - (offsetY + (lat - minY) * scale);
      return `${index ? 'L' : 'M'}${x.toFixed(2)},${y.toFixed(2)}`;
    }).join(' ') + ' Z').join(' ');
  }

  function geometryRings(geometry) {
    if (!geometry) return [];
    if (geometry.type === 'Polygon') return geometry.coordinates;
    if (geometry.type === 'MultiPolygon') return geometry.coordinates.flat();
    return [];
  }

  function mapMarkup() {
    return `<section class="border border-slate-200 bg-white" data-election-complete-motion>
      <div class="news-card-heading"><div><span>Leitura territorial</span><strong>Mapa dos estados</strong></div><small>Clique em uma UF</small></div>
      <div class="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div class="min-h-[430px]" data-e26-map><div class="grid min-h-[430px] place-items-center text-sm text-slate-500">Carregando malha territorial…</div></div>
        <aside data-e26-state-ranking class="space-y-2"><p class="text-sm text-slate-500">Os estados são coloridos pela candidatura mais votada no recorte selecionado.</p></aside>
      </div>
    </section>`;
  }

  function selectedScope() {
    const zones = ui.municipalityResult?.zones || [];
    if (ui.zone) return zones.find((item) => String(item.code) === String(ui.zone)) || null;
    return ui.municipalityResult?.municipality || null;
  }

  function neighborhoodMarkup() {
    const grouped = new Map();
    ui.sections.filter((item) => item.neighborhood).forEach((item) => {
      if (!grouped.has(item.neighborhood)) grouped.set(item.neighborhood, []);
      grouped.get(item.neighborhood).push(item);
    });
    if (!grouped.size) return `<div class="border-l-4 border-amber-500 bg-amber-50 p-4 text-sm leading-relaxed text-amber-950"><strong class="block font-display text-lg uppercase">Bairro ainda não associado pela fonte</strong>O arquivo oficial de configuração identifica município, zona e seção, mas não repete endereço ou bairro. O sistema não deduz bairro pelo número da seção. Quando a base oficial de locais permitir uma associação inequívoca, este quadro será preenchido.</div>`;
    return `<div class="grid gap-2 sm:grid-cols-2">${[...grouped.entries()].map(([name, rows]) => `<article class="border border-slate-200 bg-white p-3"><strong class="text-sm">${esc(name)}</strong><small class="mt-1 block text-xs text-slate-500">${rows.length} seções vinculadas</small></article>`).join('')}</div>`;
  }

  function sectionDetailMarkup() {
    if (!ui.section) return `<div class="grid min-h-64 place-items-center border border-dashed border-slate-300 bg-slate-50 p-5 text-center"><div><strong class="font-display text-xl uppercase text-slate-700">Selecione uma seção</strong><p class="mt-2 text-sm text-slate-500">O painel consultará o metadado oficial da urna e os artefatos publicados pelo TSE.</p></div></div>`;
    if (ui.sectionLoading) return `<div class="grid min-h-64 place-items-center border border-slate-200 bg-slate-50 text-sm font-bold text-slate-600">Consultando o Boletim de Urna oficial…</div>`;
    if (ui.sectionError) return `<div class="border-l-4 border-red-500 bg-red-50 p-4 text-sm text-red-800">${esc(ui.sectionError)}</div>`;
    const detail = ui.sectionDetail;
    if (!detail) return '';
    const candidates = detail.candidates || [];
    const files = detail.files || [];
    return `<article class="border border-slate-200 bg-white">
      <div class="flex flex-col gap-2 border-b border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"><div><span class="text-[10px] font-black uppercase tracking-widest text-emerald-700">Detalhe da urna</span><strong class="mt-1 block font-display text-2xl uppercase text-slate-950">Zona ${esc(detail.zone)} · Seção ${esc(detail.section)}</strong></div><span class="table-badge">${detail.status === 'available' ? 'BU localizado' : detail.waiting ? 'Aguardando 2026' : 'Metadado localizado'}</span></div>
      <div class="space-y-4 p-4">
        ${candidates.length ? `<div><strong class="mb-2 block text-xs font-black uppercase text-slate-600">Votos estruturados da seção</strong>${candidateCardsMarkup({ candidates })}</div>` : `<div class="border-l-4 border-blue-500 bg-blue-50 p-4 text-sm leading-relaxed text-blue-950"><strong class="block font-display text-lg uppercase">Conferência oficial da seção</strong>${esc(detail.note || 'O Boletim de Urna oficial foi localizado, mas a votação não apareceu em JSON estruturado nesta resposta.')}</div>`}
        <div class="grid gap-2 sm:grid-cols-2">${files.map((file) => `<a class="flex min-h-12 items-center justify-between gap-3 border border-slate-300 bg-white px-3 py-2 text-xs font-black uppercase text-slate-800 hover:border-emerald-600" href="${esc(file.url)}" target="_blank" rel="noopener noreferrer"><span>${esc(file.type)}</span><small class="max-w-44 truncate font-normal normal-case text-slate-500">${esc(file.filename)}</small></a>`).join('') || '<div class="col-span-full text-sm text-slate-500">Nenhum arquivo individual foi enumerado no metadado auxiliar desta seção.</div>'}</div>
        <div class="flex flex-wrap gap-2">${detail.sourceUrl ? `<a class="inline-flex min-h-11 items-center bg-emerald-700 px-4 text-xs font-black uppercase text-white" href="${esc(detail.sourceUrl)}" target="_blank" rel="noopener noreferrer">Abrir metadado oficial</a>` : ''}${detail.tseResultsUrl ? `<a class="inline-flex min-h-11 items-center border border-slate-300 bg-white px-4 text-xs font-black uppercase text-slate-800" href="${esc(detail.tseResultsUrl)}" target="_blank" rel="noopener noreferrer">Abrir Resultados TSE</a>` : ''}</div>
      </div>
    </article>`;
  }

  function territoryMarkup() {
    const scope = selectedScope();
    const selectedSection = ui.sections.find((item) => item.section === ui.section);
    const municipalityName = ui.municipalities.find((item) => item.code === ui.municipality)?.name;
    const crumbs = ['Brasil', ...(ui.uf !== 'br' ? [ufLabel()] : []), ...(municipalityName ? [municipalityName] : []), ...(ui.zone ? [`Zona ${ui.zone}`] : []), ...(selectedSection ? [`Seção ${selectedSection.section}`] : [])];
    const filteredSections = ui.sections.filter((item) => !ui.sectionSearch || item.section.includes(ui.sectionSearch) || String(item.location || '').toLowerCase().includes(ui.sectionSearch.toLowerCase()) || String(item.neighborhood || '').toLowerCase().includes(ui.sectionSearch.toLowerCase()));
    return `<section class="border border-slate-200 bg-white" data-election-complete-motion>
      <div class="news-card-heading"><div><span>Ponta a ponta</span><strong>Estado → município → zona → seção</strong></div><small>${ui.year === 2022 ? 'Resultado histórico oficial' : 'Ativação conforme feed 2026'}</small></div>
      <div class="flex flex-wrap gap-1 border-b border-slate-200 bg-slate-50 p-3">${crumbs.map((item, index) => `<span class="text-xs font-bold text-slate-600">${index ? '<i class="mx-1 text-slate-300">›</i>' : ''}${esc(item)}</span>`).join('')}</div>
      <div class="grid gap-4 p-4 xl:grid-cols-[minmax(0,1fr)_390px]">
        <div class="space-y-4">
          ${scope ? `<article class="border border-slate-200 bg-white"><div class="border-l-4 border-emerald-500 bg-emerald-50 p-3"><span class="text-[10px] font-black uppercase tracking-widest text-emerald-800">Votos do recorte</span><strong class="mt-1 block font-display text-xl uppercase text-slate-950">${esc(ui.zone ? `Zona ${ui.zone}` : municipalityName || 'Município')}</strong></div><div class="p-3">${candidateCardsMarkup({ candidates: scope.candidates || [] })}</div></article>` : `<div class="grid min-h-64 place-items-center border border-dashed border-slate-300 bg-slate-50 p-6 text-center"><div><strong class="font-display text-xl uppercase text-slate-700">Selecione estado e município</strong><p class="mt-2 max-w-xl text-sm text-slate-500">A votação exata por zona aparece após selecionar um município. Para 2026, essa camada depende da publicação oficial.</p></div></div>`}
          ${sectionDetailMarkup()}
          <article class="border border-slate-200 bg-slate-50 p-4"><span class="text-[10px] font-black uppercase tracking-widest text-slate-500">Cobertura por bairro</span><div class="mt-3">${neighborhoodMarkup()}</div></article>
        </div>
        <aside class="border border-slate-200 bg-slate-50">
          <div class="border-b border-slate-200 p-3"><span class="text-[10px] font-black uppercase tracking-widest text-slate-500">Seções eleitorais</span><strong class="mt-1 block font-display text-lg uppercase text-slate-950">${ui.sections.length ? `${ui.sections.length} seções oficiais` : 'Selecione uma zona'}</strong>${ui.sections.length ? `<input data-e26-section-search value="${esc(ui.sectionSearch)}" class="mt-3 min-h-10 w-full border border-slate-300 bg-white px-3 text-sm" type="search" placeholder="Buscar seção, local ou bairro">` : ''}</div>
          <div class="max-h-[620px] divide-y divide-slate-200 overflow-y-auto">${filteredSections.slice(0, 500).map((item) => `<button type="button" data-e26-section-button="${esc(item.section)}" class="grid w-full grid-cols-[72px_minmax(0,1fr)] gap-2 p-3 text-left transition ${ui.section === item.section ? 'bg-emerald-50' : 'bg-white hover:bg-slate-50'}"><b class="font-display text-lg text-slate-950">${esc(item.section)}</b><span class="min-w-0"><strong class="block truncate text-xs text-slate-800">${esc(item.location || 'Local não informado no EA16')}</strong><small class="mt-1 block truncate text-[10px] uppercase text-slate-500">${item.neighborhood ? `Bairro: ${esc(item.neighborhood)}` : `Zona ${esc(item.zone || ui.zone)}`}</small></span></button>`).join('') || '<div class="p-5 text-sm leading-relaxed text-slate-500">Escolha município e zona para listar as seções oficiais.</div>'}</div>
        </aside>
      </div>
    </section>`;
  }

  function methodologyMarkup() {
    return `<section class="grid gap-4 lg:grid-cols-4" data-election-complete-motion>
      ${[
        ['Resultado 2022', 'Totais oficiais por Brasil, UF, município e zona, com candidatos associados pelo número oficial.'],
        ['Apuração 2026', 'Consulta automática ao ciclo oficial. Antes da abertura, a tela mostra espera e não transforma pesquisa em voto.'],
        ['Seção e BU', 'A seção abre o metadado e os artefatos da urna publicados pelo TSE; votos estruturados aparecem apenas quando encontrados.'],
        ['Bairro', 'Só é exibido quando endereço/local oficial permite associação inequívoca. Nenhum bairro é inferido pelo número da zona ou seção.']
      ].map(([title, text], index) => `<article class="border border-slate-200 bg-white p-4"><span class="text-[10px] font-black uppercase tracking-widest text-emerald-700">Camada ${index + 1}</span><strong class="mt-2 block font-display text-xl uppercase text-slate-950">${esc(title)}</strong><p class="mt-2 text-sm leading-relaxed text-slate-600">${esc(text)}</p></article>`).join('')}
    </section>`;
  }

  function render() {
    if (!ui.active) return;
    const host = document.getElementById(HOST_ID);
    if (!host) return;
    ui.rendering = true;
    host.dataset.electionsComplete = 'true';
    host.innerHTML = `<div data-elections-complete-root class="space-y-6">
      ${headerMarkup()}
      ${statusMarkup()}
      ${controlsMarkup()}
      ${metricsMarkup()}
      ${ui.error ? `<div class="border-l-4 border-red-500 bg-red-50 p-4 text-sm text-red-800">${esc(ui.error)}</div>` : ''}
      ${chartsMarkup()}
      ${resultsMarkup()}
      ${mapMarkup()}
      ${territoryMarkup()}
      ${methodologyMarkup()}
    </div>`;
    bind(host);
    renderMap();
    requestAnimationFrame(() => {
      host.querySelectorAll('[data-election-complete-motion]').forEach((node, index) => {
        node.style.setProperty('--e26-delay', `${Math.min(360, index * 45)}ms`);
        node.classList.add('e26-enter');
      });
      ui.rendering = false;
    });
  }

  function installStyles() {
    if (document.getElementById('elections-2026-complete-style')) return;
    const style = document.createElement('style');
    style.id = 'elections-2026-complete-style';
    style.textContent = `
      @keyframes e26Enter { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:none } }
      @keyframes e26Bar { from { transform:scaleX(0); opacity:.25 } to { transform:scaleX(1); opacity:1 } }
      @keyframes e26Donut { from { stroke-dasharray:0 252 } }
      .e26-enter { animation:e26Enter 420ms ease both; animation-delay:var(--e26-delay,0ms) }
      [data-e26-bar] { transform-origin:left; animation:e26Bar 720ms cubic-bezier(.2,.8,.2,1) both; animation-delay:var(--e26-delay,0ms) }
      [data-e26-donut] { animation:e26Donut 900ms ease both }
      .e26-map-state { cursor:pointer; stroke:#fff; stroke-width:1.2; transition:opacity 160ms ease,stroke-width 160ms ease,filter 160ms ease }
      .e26-map-state:hover,.e26-map-state:focus-visible { opacity:.82; stroke:#0f172a; stroke-width:2.6; filter:drop-shadow(0 2px 3px rgba(15,23,42,.25)); outline:none }
      .e26-map-state.is-active { stroke:#0f172a; stroke-width:3 }
      @media (prefers-reduced-motion:reduce) { .e26-enter,[data-e26-bar],[data-e26-donut] { animation:none!important; transform:none!important; opacity:1!important } .e26-map-state { transition:none!important } }
    `;
    document.head.appendChild(style);
  }

  function bindPhotoFallbacks(host) {
    host.querySelectorAll('[data-election-complete-photo]').forEach((img) => {
      img.addEventListener('error', () => img.remove(), { once: true });
    });
  }

  function bind(host) {
    bindPhotoFallbacks(host);
    host.querySelector('[data-e26-year]')?.addEventListener('change', (event) => {
      ui.year = Number(event.target.value);
      clearGranular();
      loadCore();
    });
    host.querySelector('[data-e26-cargo]')?.addEventListener('change', (event) => {
      ui.cargo = event.target.value;
      if (!['president', 'governor'].includes(ui.cargo)) ui.round = 1;
      if (ui.cargo !== 'president' && ui.uf === 'br') ui.uf = 'rj';
      clearGranular();
      loadCore();
    });
    host.querySelector('[data-e26-round]')?.addEventListener('change', (event) => {
      ui.round = Number(event.target.value);
      clearGranular();
      loadCore();
    });
    host.querySelector('[data-e26-uf]')?.addEventListener('change', (event) => {
      ui.uf = event.target.value;
      clearGranular();
      loadCore();
    });
    host.querySelector('[data-e26-municipality]')?.addEventListener('change', (event) => {
      ui.municipality = event.target.value;
      ui.zone = '';
      ui.section = '';
      ui.municipalityResult = null;
      ui.sections = [];
      ui.sectionDetail = null;
      if (ui.municipality) loadMunicipality();
      else render();
    });
    host.querySelector('[data-e26-zone]')?.addEventListener('change', (event) => {
      ui.zone = event.target.value;
      ui.section = '';
      ui.sections = [];
      ui.sectionDetail = null;
      if (ui.zone) loadSections();
      else render();
    });
    host.querySelector('[data-e26-section]')?.addEventListener('change', (event) => selectSection(event.target.value));
    host.querySelector('[data-e26-refresh]')?.addEventListener('click', () => loadCore(true));
    host.querySelectorAll('[data-e26-chart]').forEach((button) => button.addEventListener('click', () => {
      ui.chartMode = button.dataset.e26Chart;
      render();
    }));
    host.querySelectorAll('[data-e26-candidate]').forEach((button) => button.addEventListener('click', () => {
      ui.selectedCandidate = ui.selectedCandidate === button.dataset.e26Candidate ? '' : button.dataset.e26Candidate;
      render();
    }));
    host.querySelectorAll('[data-e26-zone-button]').forEach((button) => button.addEventListener('click', () => {
      ui.zone = button.dataset.e26ZoneButton;
      ui.chartMode = 'zones';
      loadSections();
    }));
    host.querySelectorAll('[data-e26-section-button]').forEach((button) => button.addEventListener('click', () => selectSection(button.dataset.e26SectionButton)));
    host.querySelector('[data-e26-section-search]')?.addEventListener('input', (event) => {
      ui.sectionSearch = event.target.value;
      render();
      const input = document.querySelector('[data-e26-section-search]');
      input?.focus();
      if (input) input.setSelectionRange(input.value.length, input.value.length);
    });
  }

  function clearGranular() {
    ui.municipality = '';
    ui.zone = '';
    ui.section = '';
    ui.sectionSearch = '';
    ui.municipalities = [];
    ui.municipalityResult = null;
    ui.sections = [];
    ui.sectionDetail = null;
    ui.granularError = '';
    ui.sectionError = '';
  }

  async function loadCore(preserveGranular = false) {
    const requestId = ++ui.requestId;
    ui.loading = true;
    ui.error = '';
    if (!preserveGranular) clearGranular();
    render();
    const shared = { cargo: ui.cargo, round: ui.round, uf: ui.uf };
    try {
      const requests = [
        json(query({ action: 'status' })),
        json(query({ action: 'summary', year: 2022, ...shared })),
        json(query({ action: 'states', year: ui.year, cargo: ui.cargo, round: ui.round }))
      ];
      if (ui.year === 2026) requests.push(json(query({ action: 'summary', year: 2026, ...shared })));
      const values = await Promise.all(requests);
      if (requestId !== ui.requestId) return;
      ui.status = values[0];
      ui.historical = values[1];
      ui.states = values[2].states || [];
      ui.summary = ui.year === 2026 ? values[3] : values[1];
      ui.loaded = true;
      ui.lastUpdated = new Date();
    } catch (error) {
      if (requestId !== ui.requestId) return;
      ui.error = error.message;
    } finally {
      if (requestId !== ui.requestId) return;
      ui.loading = false;
      render();
      if (ui.year === 2022 && ui.uf !== 'br') loadMunicipalities();
      configureRefresh();
    }
  }

  async function loadMunicipalities() {
    if (ui.year !== 2022 || ui.uf === 'br') return;
    ui.granularLoading = true;
    ui.granularError = '';
    render();
    try {
      const data = await json(query({ action: 'municipalities', year: 2022, cargo: ui.cargo, round: ui.round, uf: ui.uf }));
      ui.municipalities = data.municipalities || [];
    } catch (error) {
      ui.granularError = error.message;
      ui.municipalities = [];
    } finally {
      ui.granularLoading = false;
      render();
    }
  }

  async function loadMunicipality() {
    if (ui.year !== 2022 || !ui.municipality) return;
    ui.granularLoading = true;
    ui.granularError = '';
    render();
    try {
      ui.municipalityResult = await json(query({ action: 'municipality', year: 2022, cargo: ui.cargo, round: ui.round, uf: ui.uf, municipality: ui.municipality }));
    } catch (error) {
      ui.granularError = error.message;
      ui.municipalityResult = null;
    } finally {
      ui.granularLoading = false;
      render();
    }
  }

  async function loadSections() {
    if (ui.year !== 2022 || !ui.municipality || !ui.zone) return;
    ui.granularLoading = true;
    ui.granularError = '';
    ui.section = '';
    ui.sectionDetail = null;
    render();
    try {
      const data = await json(query({ action: 'sections', year: 2022, cargo: ui.cargo, round: ui.round, uf: ui.uf, municipality: ui.municipality, zone: ui.zone }));
      ui.sections = data.sections || [];
    } catch (error) {
      ui.granularError = error.message;
      ui.sections = [];
    } finally {
      ui.granularLoading = false;
      render();
    }
  }

  function selectSection(section) {
    ui.section = section;
    ui.sectionDetail = null;
    ui.sectionError = '';
    if (section) loadSectionDetail();
    else render();
  }

  async function loadSectionDetail() {
    if (!ui.section || !ui.municipality || !ui.zone) return;
    ui.sectionLoading = true;
    ui.sectionError = '';
    render();
    try {
      const search = new URLSearchParams({
        year: String(ui.year),
        cargo: ui.cargo,
        round: String(ui.round),
        uf: ui.uf,
        municipality: ui.municipality,
        zone: ui.zone,
        section: ui.section
      });
      ui.sectionDetail = await json(`${SECTION_API}?${search}`);
    } catch (error) {
      ui.sectionError = error.message;
      ui.sectionDetail = null;
    } finally {
      ui.sectionLoading = false;
      render();
    }
  }

  async function ensureMap() {
    if (ui.map) return ui.map;
    try {
      const response = await fetch('/api/brazil-map', { cache: 'force-cache' });
      if (!response.ok) throw new Error('Mapa indisponível');
      ui.map = await response.json();
    } catch {
      ui.map = { type: 'FeatureCollection', features: [] };
    }
    return ui.map;
  }

  async function renderMap() {
    const host = document.querySelector('#elections2026 [data-e26-map]');
    const ranking = document.querySelector('#elections2026 [data-e26-state-ranking]');
    if (!host || !ranking || !ui.active) return;
    const geojson = await ensureMap();
    if (!host.isConnected) return;
    const features = geojson?.features || [];
    const all = features.flatMap((feature) => geometryRings(feature.geometry).flat());
    const stateMap = new Map((ui.states || []).filter((item) => item.available).map((item) => [String(item.uf).toUpperCase(), item]));
    if (!features.length || !all.length) {
      host.innerHTML = '<div class="grid min-h-[430px] place-items-center border border-dashed border-slate-300 bg-slate-50 p-5 text-center text-sm text-slate-500">Mapa indisponível. Use o ranking ao lado.</div>';
    } else {
      const xs = all.map((point) => point[0]);
      const ys = all.map((point) => point[1]);
      const bounds = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
      host.innerHTML = `<svg class="h-auto w-full" viewBox="0 0 640 520" role="img" aria-label="Mapa eleitoral do Brasil">${features.map((feature) => {
        const uf = String(feature.properties?.sigla || feature.properties?.SIGLA || feature.properties?.uf || '').toUpperCase();
        const result = stateMap.get(uf);
        const winner = result?.winner ? person(result.winner) : null;
        const fill = winner?.color || '#cbd5e1';
        const label = winner ? `${uf}: ${winner.name}, ${fmtPct(winner.percentage)}` : `${uf}: sem dados`;
        return `<path data-e26-map-uf="${uf.toLowerCase()}" class="e26-map-state ${ui.uf.toUpperCase() === uf ? 'is-active' : ''}" tabindex="0" role="button" aria-label="${esc(label)}" d="${mapPath(geometryRings(feature.geometry), bounds, 640, 520)}" fill="${fill}"><title>${esc(label)}</title></path>`;
      }).join('')}</svg>`;
      host.querySelectorAll('[data-e26-map-uf]').forEach((path) => {
        const activate = () => {
          ui.uf = path.dataset.e26MapUf;
          clearGranular();
          loadCore();
        };
        path.addEventListener('click', activate);
        path.addEventListener('keydown', (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            activate();
          }
        });
      });
    }
    const rows = (ui.states || []).filter((item) => item.available && item.winner).sort((a, b) => Number(b.winner.votes || 0) - Number(a.winner.votes || 0));
    ranking.innerHTML = `<div><span class="text-[10px] font-black uppercase tracking-widest text-slate-500">UFs com resultado</span><strong class="mt-1 block font-display text-xl uppercase text-slate-950">${rows.length} de 27</strong></div><div class="mt-3 max-h-[390px] space-y-1.5 overflow-y-auto">${rows.map((item) => {
      const winner = person(item.winner);
      return `<button type="button" data-e26-ranking-uf="${item.uf.toLowerCase()}" class="grid w-full grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-2 border border-slate-200 bg-white p-2 text-left hover:border-emerald-600"><b class="font-display text-lg">${esc(item.uf)}</b><span class="min-w-0"><strong class="block truncate text-xs">${esc(winner.name)}</strong><small class="block truncate text-[9px] uppercase text-slate-500">${esc(winner.party)}</small></span><b class="font-display">${fmtPct(winner.percentage, 1)}</b></button>`;
    }).join('') || '<div class="border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">Nenhuma UF com votos oficiais neste momento.</div>'}</div>`;
    ranking.querySelectorAll('[data-e26-ranking-uf]').forEach((button) => button.addEventListener('click', () => {
      ui.uf = button.dataset.e26RankingUf;
      clearGranular();
      loadCore();
    }));
  }

  function configureRefresh() {
    if (ui.timer) clearInterval(ui.timer);
    ui.timer = null;
    if (ui.year === 2026 && ui.status?.live) {
      ui.timer = setInterval(() => {
        if (ui.active && document.visibilityState === 'visible') loadCore(true);
      }, 20000);
    }
  }

  function showView() {
    installStyles();
    ui.active = true;
    document.querySelectorAll('.view-section').forEach((section) => section.classList.toggle('hidden', section.id !== HOST_ID));
    document.querySelectorAll('[data-view]').forEach((button) => button.classList.toggle('is-active', button.dataset.view === HOST_ID));
    const sidebar = document.getElementById('sidebar');
    sidebar?.classList.remove('translate-x-0');
    sidebar?.classList.add('-translate-x-full', 'lg:translate-x-0');
    history.replaceState(null, '', '#elections2026');
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (!ui.loaded && !ui.loading) loadCore();
  }

  function deactivateWhenOtherView(event) {
    const button = event.target.closest?.('[data-view]');
    if (button && button.dataset.view !== HOST_ID) ui.active = false;
  }

  document.addEventListener('click', (event) => {
    const button = event.target.closest?.(`[data-view="${HOST_ID}"]`);
    if (!button) {
      deactivateWhenOtherView(event);
      return;
    }
    event.preventDefault();
    event.stopImmediatePropagation();
    showView();
  }, true);

  window.addEventListener('hashchange', () => {
    if (location.hash === '#elections2026') showView();
  });

  const observer = new MutationObserver(() => {
    const host = document.getElementById(HOST_ID);
    if (ui.active && host && !host.querySelector('[data-elections-complete-root]') && !ui.rendering) {
      queueMicrotask(render);
    }
  });

  const start = () => {
    const host = document.getElementById(HOST_ID);
    if (host) observer.observe(host, { childList: true });
    if (location.hash === '#elections2026') setTimeout(showView, 0);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
