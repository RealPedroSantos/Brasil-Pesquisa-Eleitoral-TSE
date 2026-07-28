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
