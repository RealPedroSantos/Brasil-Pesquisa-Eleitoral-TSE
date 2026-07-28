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

  const VIEWPORT_MARGIN = 12;
  const CURSOR_OFFSET = 14;

  function getTooltip() {
    return document.getElementById('chartTooltip');
  }

  function mountTooltipInViewport() {
    const tooltip = getTooltip();
    if (!tooltip) return null;

    if (tooltip.parentElement !== document.body) {
      document.body.appendChild(tooltip);
    }

    tooltip.style.position = 'fixed';
    tooltip.style.transform = 'none';
    tooltip.style.margin = '0';
    tooltip.style.pointerEvents = 'none';
    tooltip.style.zIndex = '1000';
    tooltip.style.maxWidth = 'min(320px, calc(100vw - 24px))';

    return tooltip;
  }

  function positionTooltip(event) {
    const point = event.target?.closest?.('.point');
    if (!point) return;

    const tooltip = mountTooltipInViewport();
    if (!tooltip || tooltip.classList.contains('hidden')) return;

    const rect = tooltip.getBoundingClientRect();
    const viewportWidth = document.documentElement.clientWidth;
    const viewportHeight = document.documentElement.clientHeight;

    let left = event.clientX + CURSOR_OFFSET;
    let top = event.clientY + CURSOR_OFFSET;

    if (left + rect.width > viewportWidth - VIEWPORT_MARGIN) {
      left = event.clientX - rect.width - CURSOR_OFFSET;
    }

    if (top + rect.height > viewportHeight - VIEWPORT_MARGIN) {
      top = event.clientY - rect.height - CURSOR_OFFSET;
    }

    left = Math.min(
      Math.max(VIEWPORT_MARGIN, left),
      Math.max(VIEWPORT_MARGIN, viewportWidth - rect.width - VIEWPORT_MARGIN)
    );

    top = Math.min(
      Math.max(VIEWPORT_MARGIN, top),
      Math.max(VIEWPORT_MARGIN, viewportHeight - rect.height - VIEWPORT_MARGIN)
    );

    tooltip.style.left = `${Math.round(left)}px`;
    tooltip.style.top = `${Math.round(top)}px`;
  }

  function hideTooltip() {
    getTooltip()?.classList.add('hidden');
  }

  function initTooltipPositioning() {
    if (!mountTooltipInViewport()) return;

    document.addEventListener('mousemove', positionTooltip, { passive: true });
    document.addEventListener('mouseover', (event) => {
      if (!event.target?.closest?.('.point')) return;
      requestAnimationFrame(() => positionTooltip(event));
    }, { passive: true });

    window.addEventListener('scroll', hideTooltip, { passive: true, capture: true });
    window.addEventListener('resize', hideTooltip, { passive: true });
    window.addEventListener('blur', hideTooltip);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTooltipPositioning, { once: true });
  } else {
    initTooltipPositioning();
  }
})();
