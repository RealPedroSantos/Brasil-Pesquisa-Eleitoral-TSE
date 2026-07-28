(() => {
  'use strict';

  function loadFlatFixes() {
    if (document.querySelector('link[href="american-election-flat-fixes.css"]')) return;
    const stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = 'american-election-flat-fixes.css';
    document.head.appendChild(stylesheet);
  }

  function addEditorialContext() {
    const toolbarCopy = document.querySelector('.presidential-panel .chart-toolbar > div:first-child');
    if (!toolbarCopy || toolbarCopy.querySelector('.editorial-chart-context')) return;

    const context = document.createElement('span');
    context.className = 'editorial-chart-context';
    context.textContent = 'Média nacional · intenção de voto (%)';
    toolbarCopy.appendChild(context);
  }

  function styleChartElements() {
    const chart = document.getElementById('mainChart');
    if (!chart) return;

    chart.querySelectorAll('.series-line').forEach((line) => {
      const color = line.getAttribute('stroke');
      if (color) line.style.setProperty('--series-color', color);
      line.setAttribute('vector-effect', 'non-scaling-stroke');
    });

    chart.querySelectorAll('.series-area').forEach((area) => {
      const color = area.getAttribute('fill');
      if (color) area.style.setProperty('--series-color', color);
      area.setAttribute('vector-effect', 'non-scaling-stroke');
    });

    chart.querySelectorAll('.point').forEach((point) => {
      const color = point.getAttribute('fill');
      if (color) point.style.setProperty('--series-color', color);
      point.classList.add('editorial-point');
      point.classList.remove('point-pulse');
      point.setAttribute('r', point.classList.contains('ux-focused') ? '4.8' : '4.1');
      point.setAttribute('vector-effect', 'non-scaling-stroke');
    });

    chart.querySelectorAll('rect').forEach((rect) => {
      rect.setAttribute('rx', '0');
      rect.setAttribute('ry', '0');
    });
  }

  function normalizeInterfaceCopy() {
    const tickerLabel = document.querySelector('.ticker-label');
    if (tickerLabel) tickerLabel.textContent = 'BASE DE PESQUISAS';

    const chartStage = document.querySelector('.chart-stage');
    if (chartStage) chartStage.setAttribute('data-editorial-chart', 'true');
  }

  function init() {
    document.documentElement.classList.add('us-election-editorial');
    loadFlatFixes();
    addEditorialContext();
    normalizeInterfaceCopy();
    styleChartElements();

    const chart = document.getElementById('mainChart');
    if (chart) {
      const observer = new MutationObserver(() => {
        requestAnimationFrame(styleChartElements);
      });
      observer.observe(chart, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
    }

    const candidateCards = document.getElementById('candidateCards');
    if (candidateCards) {
      const observer = new MutationObserver(() => requestAnimationFrame(styleChartElements));
      observer.observe(candidateCards, { childList: true, subtree: true });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();

(() => {
  'use strict';

  function loadAuditSourceSync() {
    if (document.querySelector('script[src="audit-source-sync.js"]')) return;
    const script = document.createElement('script');
    script.src = 'audit-source-sync.js';
    script.defer = true;
    document.body.appendChild(script);
  }

  function loadAuditApp() {
    if (document.querySelector('script[src="audit-system.js"]')) {
      loadAuditSourceSync();
      return;
    }
    const script = document.createElement('script');
    script.src = 'audit-system.js';
    script.defer = true;
    script.onload = loadAuditSourceSync;
    document.body.appendChild(script);
  }

  function loadAuditSystem() {
    if (!document.querySelector('link[href="audit-system.css"]')) {
      const stylesheet = document.createElement('link');
      stylesheet.rel = 'stylesheet';
      stylesheet.href = 'audit-system.css';
      document.head.appendChild(stylesheet);
    }

    if (window.ELECTION_AUDIT_DATA) {
      loadAuditApp();
      return;
    }

    if (!document.querySelector('script[src="audit-data.js"]')) {
      const dataScript = document.createElement('script');
      dataScript.src = 'audit-data.js';
      dataScript.onload = loadAuditApp;
      document.body.appendChild(dataScript);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadAuditSystem, { once: true });
  } else {
    loadAuditSystem();
  }
})();

(() => {
  'use strict';

  const TOOLTIP_GAP = 12;
  const VIEWPORT_PADDING = 8;

  function positionChartTooltip(clientX, clientY) {
    const tooltip = document.getElementById('chartTooltip');
    if (!tooltip || tooltip.classList.contains('hidden')) return;

    tooltip.style.position = 'fixed';
    tooltip.style.transform = 'none';
    tooltip.style.margin = '0';
    tooltip.style.maxWidth = `${Math.max(180, Math.min(280, window.innerWidth - VIEWPORT_PADDING * 2))}px`;

    const rect = tooltip.getBoundingClientRect();
    let left = clientX + TOOLTIP_GAP;
    let top = clientY + TOOLTIP_GAP;

    if (left + rect.width > window.innerWidth - VIEWPORT_PADDING) {
      left = clientX - rect.width - TOOLTIP_GAP;
    }

    if (top + rect.height > window.innerHeight - VIEWPORT_PADDING) {
      top = clientY - rect.height - TOOLTIP_GAP;
    }

    left = Math.max(VIEWPORT_PADDING, Math.min(left, window.innerWidth - rect.width - VIEWPORT_PADDING));
    top = Math.max(VIEWPORT_PADDING, Math.min(top, window.innerHeight - rect.height - VIEWPORT_PADDING));

    tooltip.style.left = `${Math.round(left)}px`;
    tooltip.style.top = `${Math.round(top)}px`;
  }

  function isChartPoint(target) {
    return Boolean(target?.closest?.('#mainChart .point'));
  }

  document.addEventListener('mousemove', (event) => {
    if (!isChartPoint(event.target)) return;
    positionChartTooltip(event.clientX, event.clientY);
  });

  document.addEventListener('mouseover', (event) => {
    if (!isChartPoint(event.target)) return;
    const { clientX, clientY } = event;
    requestAnimationFrame(() => positionChartTooltip(clientX, clientY));
  });

  window.addEventListener('resize', () => {
    document.getElementById('chartTooltip')?.classList.add('hidden');
  });
})();

(() => {
  'use strict';

  function mountTooltipAtViewportRoot() {
    const tooltip = document.getElementById('chartTooltip');
    if (!tooltip) return;

    if (tooltip.parentElement !== document.body) {
      document.body.appendChild(tooltip);
    }

    tooltip.style.position = 'fixed';
    tooltip.style.pointerEvents = 'none';
    tooltip.style.zIndex = '1000';
  }

  function hideTooltip() {
    document.getElementById('chartTooltip')?.classList.add('hidden');
  }

  function init() {
    mountTooltipAtViewportRoot();
    window.addEventListener('scroll', hideTooltip, { passive: true, capture: true });
    window.addEventListener('blur', hideTooltip);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();

(() => {
  'use strict';

  const ALL_VALUES = new Set(['', 'todas', 'todos', 'all']);

  function normalizedValue(value) {
    return String(value || '').trim();
  }

  function isAllStates(value) {
    return ALL_VALUES.has(normalizedValue(value).toLowerCase());
  }

  function stateName(uf, select) {
    const names = window.ELECTION_DATA?.stateNames || {};
    const option = Array.from(select?.options || []).find((item) => item.value === uf);
    return names[uf] || option?.textContent?.trim() || uf;
  }

  function ensureSelectionStatus(map) {
    const card = map.closest('.map-card');
    if (!card) return null;

    let status = card.querySelector('.map-selection-status');
    if (status) return status;

    status = document.createElement('div');
    status.className = 'map-selection-status';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');

    const legend = card.querySelector('.map-legend');
    if (legend) card.insertBefore(status, legend);
    else card.appendChild(status);

    return status;
  }

  function prepareStatePaths(map) {
    map.querySelectorAll('.official-state').forEach((path) => {
      const uf = normalizedValue(path.dataset.uf).toUpperCase();
      if (!uf) return;

      path.setAttribute('aria-pressed', path.classList.contains('is-selected') ? 'true' : 'false');
      path.setAttribute('data-touch-target', 'state');
      path.setAttribute('vector-effect', 'non-scaling-stroke');
    });
  }

  function applySelectedState(map, select) {
    const selectedUf = normalizedValue(select.value).toUpperCase();
    const hasSelection = !isAllStates(selectedUf);

    map.querySelectorAll('.official-state').forEach((path) => {
      const selected = hasSelection && normalizedValue(path.dataset.uf).toUpperCase() === selectedUf;
      path.classList.toggle('is-selected', selected);
      path.setAttribute('aria-pressed', selected ? 'true' : 'false');
      if (selected) path.setAttribute('aria-current', 'true');
      else path.removeAttribute('aria-current');
    });

    const status = ensureSelectionStatus(map);
    if (!status) return;

    status.classList.toggle('has-selection', hasSelection);
    status.innerHTML = hasSelection
      ? `<span>Estado selecionado</span><strong>${selectedUf} · ${stateName(selectedUf, select)}</strong>`
      : '<span>Selecione uma unidade da Federação no mapa</span><strong>Brasil</strong>';
  }

  function bindStateMap() {
    const map = document.getElementById('brazilMap');
    const select = document.getElementById('localUf');
    if (!map || !select || map.dataset.selectionUxBound === 'true') return;

    map.dataset.selectionUxBound = 'true';
    map.setAttribute('role', 'group');
    map.setAttribute('aria-label', 'Mapa do Brasil. Selecione um estado para filtrar as pesquisas.');

    const refresh = () => {
      prepareStatePaths(map);
      applySelectedState(map, select);
    };

    select.addEventListener('change', refresh);

    map.addEventListener('pointerover', (event) => {
      const path = event.target.closest?.('.official-state');
      if (path && map.contains(path)) path.classList.add('is-hovered');
    });

    map.addEventListener('pointerout', (event) => {
      const path = event.target.closest?.('.official-state');
      if (path && map.contains(path)) path.classList.remove('is-hovered');
    });

    const mapObserver = new MutationObserver(() => requestAnimationFrame(refresh));
    mapObserver.observe(map, { childList: true, subtree: true });

    const selectObserver = new MutationObserver(() => requestAnimationFrame(refresh));
    selectObserver.observe(select, { childList: true, subtree: true });

    refresh();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindStateMap, { once: true });
  } else {
    bindStateMap();
  }
})();
