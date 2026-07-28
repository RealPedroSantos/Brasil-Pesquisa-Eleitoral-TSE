const { candidates, polls } = window.ELECTION_DATA;
const active = new Set(candidates.map(candidate => candidate.name));
const svg = document.getElementById('timelineChart');
const chartWrap = document.getElementById('chartWrap');
const tooltip = document.getElementById('tooltip');
const dialog = document.getElementById('detailDialog');
const NS = 'http://www.w3.org/2000/svg';
const fmt = value => Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '%';
const isMobile = () => window.matchMedia('(max-width: 560px)').matches;

function make(name, attrs = {}) {
  const node = document.createElementNS(NS, name);
  Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
  return node;
}

function monthlyData() {
  const grouped = {};
  polls.forEach(poll => {
    const month = poll.date.slice(0, 7);
    if (!grouped[month]) {
      grouped[month] = {
        date: month + '-15',
        label: ({ '2026-02':'fev', '2026-03':'mar', '2026-04':'abr', '2026-05':'mai', '2026-06':'jun', '2026-07':'jul' })[month] || month,
        institute: 'Média mensal', field: 'mês completo', publication: month,
        sample: 'múltiplas pesquisas', margin: 'não aplicável', registry: 'diversos registros', source: '', values: {}, raw: {}
      };
    }
    Object.entries(poll.values).forEach(([name, value]) => (grouped[month].raw[name] ??= []).push(value));
  });
  return Object.values(grouped).sort((a,b) => a.date.localeCompare(b.date)).map(item => {
    Object.entries(item.raw).forEach(([name, values]) => item.values[name] = values.reduce((sum, value) => sum + value, 0) / values.length);
    return item;
  });
}

function latestFor(candidate) {
  for (let index = polls.length - 1; index >= 0; index--) {
    if (Object.prototype.hasOwnProperty.call(polls[index].values, candidate.name)) {
      return { poll: polls[index], value: polls[index].values[candidate.name] };
    }
  }
  return null;
}

function imageMarkup(candidate, className) {
  return `<img class="${className}" style="--candidate-color:${candidate.color}" src="${candidate.photo}" alt="Foto de ${candidate.name}" loading="lazy" decoding="async">`;
}

function renderSummary() {
  const latest = polls[polls.length - 1];
  const ranked = Object.entries(latest.values).sort((a,b) => b[1] - a[1]);
  const cards = [
    ['Pesquisas', polls.length],
    ['Candidatos', candidates.length],
    ['Líder recente', ranked[0][0]],
    ['Última publicação', latest.publication]
  ];
  document.getElementById('summary').innerHTML = cards.map(([label, value]) => `<div class="summary-card"><span>${label}</span><strong>${value}</strong></div>`).join('');
}

function renderFilters() {
  const box = document.getElementById('candidateFilters');
  box.innerHTML = candidates.map(candidate => `
    <button type="button" class="filter" data-name="${candidate.name}" aria-pressed="true" style="--candidate-color:${candidate.color}">
      ${imageMarkup(candidate, 'filter-photo')}
      <span>${candidate.name}</span>
    </button>`).join('');
  box.querySelectorAll('button').forEach(button => button.addEventListener('click', () => {
    const name = button.dataset.name;
    if (active.has(name)) {
      active.delete(name); button.classList.add('off'); button.setAttribute('aria-pressed','false');
    } else {
      active.add(name); button.classList.remove('off'); button.setAttribute('aria-pressed','true');
    }
    renderChart(); renderLegend();
  }));
}

function renderLegend() {
  document.getElementById('chartLegend').innerHTML = candidates.filter(candidate => active.has(candidate.name)).map(candidate => `
    <span class="legend-item"><span class="legend-dot" style="background:${candidate.color}"></span>${candidate.name}</span>`).join('');
}

function showTooltip(event, candidate, poll, value) {
  if (isMobile()) return;
  tooltip.innerHTML = `<strong>${candidate.name}: ${fmt(value)}</strong><span>${poll.institute}</span><span>${poll.publication}</span>`;
  tooltip.classList.remove('hidden');
  tooltip.style.left = Math.min(window.innerWidth - 270, event.clientX + 14) + 'px';
  tooltip.style.top = Math.max(10, event.clientY - 20) + 'px';
}
function hideTooltip() { tooltip.classList.add('hidden'); }

function monthTicks(data) {
  const seen = new Set();
  return data.filter(item => {
    const month = item.date.slice(0,7);
    if (seen.has(month)) return false;
    seen.add(month); return true;
  });
}

function spreadLabels(items, top, bottom, minGap) {
  const sorted = [...items].sort((a,b) => a.targetY - b.targetY);
  let current = top;
  sorted.forEach(item => { item.displayY = Math.max(item.targetY, current); current = item.displayY + minGap; });
  const overflow = current - minGap - bottom;
  if (overflow > 0) sorted.forEach(item => item.displayY -= overflow);
  for (let index = sorted.length - 2; index >= 0; index--) {
    if (sorted[index + 1].displayY - sorted[index].displayY < minGap) sorted[index].displayY = sorted[index + 1].displayY - minGap;
  }
  if (sorted.length && sorted[0].displayY < top) {
    const shift = top - sorted[0].displayY; sorted.forEach(item => item.displayY += shift);
  }
  return sorted;
}

function renderChart() {
  svg.innerHTML = '';
  const data = document.getElementById('viewMode').value === 'monthly' ? monthlyData() : polls;
  const width = Math.max(300, Math.round(chartWrap.clientWidth));
  const mobile = width < 600;
  const height = mobile ? 410 : 540;
  const left = mobile ? 42 : 58;
  const right = mobile ? 48 : 76;
  const top = 24;
  const bottom = mobile ? 48 : 58;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('height', height);

  const times = data.map(poll => new Date(poll.date + 'T12:00:00').getTime());
  const min = Math.min(...times), max = Math.max(...times);
  const x = time => left + (time - min) / (max - min || 1) * plotWidth;
  const y = value => top + plotHeight - (value / 50) * plotHeight;

  for (let value = 0; value <= 50; value += 10) {
    const yy = y(value);
    svg.appendChild(make('line', { x1:left, y1:yy, x2:left+plotWidth, y2:yy, class:'grid-line' }));
    const label = make('text', { x:left-7, y:yy+4, class:'axis-label', 'text-anchor':'end' });
    label.textContent = value + '%'; svg.appendChild(label);
  }
  svg.appendChild(make('line', { x1:left, y1:top+plotHeight, x2:left+plotWidth, y2:top+plotHeight, class:'axis-line' }));
  svg.appendChild(make('line', { x1:left, y1:top, x2:left, y2:top+plotHeight, class:'axis-line' }));

  const ticks = document.getElementById('viewMode').value === 'monthly' ? data : monthTicks(data);
  ticks.forEach((poll, index) => {
    const xx = x(new Date(poll.date + 'T12:00:00').getTime());
    const label = make('text', { x:xx, y:height-20, class:'axis-label', 'text-anchor': index === 0 ? 'start' : index === ticks.length - 1 ? 'end' : 'middle' });
    label.textContent = poll.label.replace(/^\d+\s/, ''); svg.appendChild(label);
  });

  const endpoints = [];
  candidates.filter(candidate => active.has(candidate.name)).forEach(candidate => {
    const points = data.filter(poll => Object.prototype.hasOwnProperty.call(poll.values, candidate.name)).map(poll => ({
      poll, value:poll.values[candidate.name], x:x(new Date(poll.date + 'T12:00:00').getTime()), y:y(poll.values[candidate.name])
    }));
    if (!points.length) return;

    svg.appendChild(make('polyline', { points:points.map(point => `${point.x},${point.y}`).join(' '), class:'series-line', stroke:candidate.color }));
    points.forEach(point => {
      const group = make('g', { role:'button', tabindex:'0', 'aria-label':`${candidate.name}, ${fmt(point.value)}, ${point.poll.institute}` });
      const hit = make('circle', { cx:point.x, cy:point.y, r:mobile ? 15 : 13, class:'point-hit' });
      const circle = make('circle', { cx:point.x, cy:point.y, r:mobile ? 5.5 : 6.5, fill:candidate.color, class:'point' });
      const open = () => openDetail(candidate, point.poll, point.value);
      group.addEventListener('mouseenter', event => showTooltip(event, candidate, point.poll, point.value));
      group.addEventListener('mousemove', event => showTooltip(event, candidate, point.poll, point.value));
      group.addEventListener('mouseleave', hideTooltip);
      group.addEventListener('click', open);
      group.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(); } });
      group.append(hit, circle); svg.appendChild(group);
    });
    const last = points[points.length - 1];
    endpoints.push({ candidate, point:last, targetY:last.y });
  });

  const railX = left + plotWidth + (mobile ? 22 : 34);
  spreadLabels(endpoints, top + 18, top + plotHeight - 18, mobile ? 34 : 42).forEach(({candidate, point, displayY}) => {
    svg.appendChild(make('path', { d:`M ${point.x} ${point.y} L ${Math.min(railX-20, point.x+15)} ${point.y} L ${railX-20} ${displayY}`, fill:'none', stroke:candidate.color, 'stroke-width':'1.5', opacity:'.65' }));
    const clipId = `photo-${candidate.id}`;
    const defs = make('defs');
    const clip = make('clipPath', { id:clipId });
    clip.appendChild(make('circle', { cx:railX, cy:displayY, r:mobile ? 14 : 18 }));
    defs.appendChild(clip); svg.appendChild(defs);
    const group = make('g', { role:'button', tabindex:'0', 'aria-label':`Abrir dados mais recentes de ${candidate.name}` });
    group.appendChild(make('circle', { cx:railX, cy:displayY, r:mobile ? 17 : 21, class:'photo-ring', stroke:candidate.color }));
    group.appendChild(make('image', { x:railX-(mobile?14:18), y:displayY-(mobile?14:18), width:mobile?28:36, height:mobile?28:36, href:candidate.photo, 'clip-path':`url(#${clipId})`, preserveAspectRatio:'xMidYMid slice' }));
    const open = () => openDetail(candidate, point.poll, point.value);
    group.addEventListener('click', open);
    group.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(); } });
    svg.appendChild(group);
  });
}

function openDetail(candidate, poll, value) {
  document.getElementById('detailPhoto').innerHTML = imageMarkup(candidate, 'portrait');
  document.getElementById('detailName').textContent = candidate.name;
  document.getElementById('detailParty').textContent = candidate.party;
  document.getElementById('detailStats').innerHTML = [
    ['Resultado', fmt(value)], ['Instituto', poll.institute], ['Publicação', poll.publication], ['Amostra', poll.sample]
  ].map(([label, result]) => `<div class="stat"><span>${label}</span><strong>${result}</strong></div>`).join('');
  document.getElementById('detailMeta').innerHTML = `
    <div class="meta"><span>Período de campo</span><div>${poll.field}</div></div>
    <div class="meta"><span>Margem e registro</span><div>${poll.margin}<br>${poll.registry}</div></div>
    <div class="meta"><span>Fontes e fotografia</span><div>${poll.source ? `<a href="${poll.source}" target="_blank" rel="noopener">Abrir pesquisa</a><br>` : 'Média calculada pelo painel<br>'}<a href="${candidate.credit}" target="_blank" rel="noopener">Crédito da foto</a></div></div>`;
  if (typeof dialog.showModal === 'function') dialog.showModal(); else dialog.setAttribute('open','');
}

function renderRanking() {
  const rows = candidates.map(candidate => ({ candidate, ...latestFor(candidate) })).filter(item => item.poll).sort((a,b) => b.value - a.value);
  document.getElementById('ranking').innerHTML = rows.map(({candidate, poll, value}) => `
    <button type="button" class="rank-row" data-name="${candidate.name}" style="--candidate-color:${candidate.color}">
      ${imageMarkup(candidate, 'rank-photo')}
      <div class="rank-info"><div class="rank-name">${candidate.name}</div><div class="rank-party">${candidate.party} · ${poll.institute}</div></div>
      <div class="bar-track"><div class="bar-fill" style="width:${Math.min(100,value/50*100)}%;background:${candidate.color}"></div></div>
      <div class="rank-value">${fmt(value)}</div>
    </button>`).join('');
  document.querySelectorAll('.rank-row').forEach(button => button.addEventListener('click', () => {
    const candidate = candidates.find(item => item.name === button.dataset.name);
    const latest = latestFor(candidate); openDetail(candidate, latest.poll, latest.value);
  }));
}

const viewMode = document.getElementById('viewMode');
if (isMobile()) viewMode.value = 'monthly';
viewMode.addEventListener('change', renderChart);
document.getElementById('closeDetail').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
window.addEventListener('resize', () => { clearTimeout(window.__chartResize); window.__chartResize = setTimeout(renderChart, 120); });

renderSummary();
renderFilters();
renderLegend();
renderChart();
renderRanking();
