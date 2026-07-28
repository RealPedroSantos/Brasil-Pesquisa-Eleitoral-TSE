(() => {
  'use strict';

  const TOOLTIP_GAP = 12;
  const VIEWPORT_PADDING = 8;
  const TAILWIND_SCRIPT_ID = 'tailwind-play-charts';
  let decorationFrame = 0;

  const addClasses = (element, classes) => {
    if (!element || !classes) return;
    classes.split(/\s+/).filter(Boolean).forEach((className) => {
      if (!element.classList.contains(className)) element.classList.add(className);
    });
  };

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

  function normalizeInterfaceCopy() {
    const tickerLabel = document.querySelector('.ticker-label');
    if (tickerLabel) tickerLabel.textContent = 'BASE DE PESQUISAS';

    const chartStage = document.querySelector('.chart-stage');
    if (chartStage) chartStage.setAttribute('data-editorial-chart', 'true');
  }

  function configureTailwind() {
    window.tailwind = window.tailwind || {};
    window.tailwind.config = {
      important: '.tw-chart-scope',
      corePlugins: {
        preflight: false
      },
      theme: {
        extend: {
          fontFamily: {
            newsroom: ['Barlow Condensed', 'Arial Narrow', 'Arial', 'sans-serif']
          }
        }
      }
    };
  }

  function loadTailwind(callback) {
    configureTailwind();

    const existing = document.getElementById(TAILWIND_SCRIPT_ID);
    if (existing) {
      if (existing.dataset.ready === 'true') callback();
      else existing.addEventListener('load', callback, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = TAILWIND_SCRIPT_ID;
    script.src = 'https://cdn.tailwindcss.com';
    script.async = true;
    script.addEventListener('load', () => {
      script.dataset.ready = 'true';
      configureTailwind();
      callback();
    }, { once: true });
    document.head.appendChild(script);
  }

  function chartScopeFor(element) {
    if (!element) return null;
    const scope = element.closest('.panel, .candidate-directory-card, .office-profile-card') || element.parentElement;
    if (scope) scope.classList.add('tw-chart-scope');
    return scope;
  }

  function syncModeButtons() {
    document.querySelectorAll('.presidential-panel .chart-mode').forEach((button) => {
      addClasses(button, '!min-h-10 !rounded-none !border !px-4 !py-2 !font-newsroom !text-sm !font-black !uppercase !tracking-wider !transition-colors');
      const active = button.classList.contains('active');
      button.classList.toggle('!border-red-600', active);
      button.classList.toggle('!bg-red-700', active);
      button.classList.toggle('!text-white', active);
      button.classList.toggle('!border-slate-600', !active);
      button.classList.toggle('!bg-slate-950', !active);
      button.classList.toggle('!text-slate-300', !active);
    });
  }

  function decorateMainChartShell() {
    const panel = document.querySelector('.presidential-panel');
    const toolbar = panel?.querySelector('.chart-toolbar');
    const stage = panel?.querySelector('.chart-stage');
    const chart = document.getElementById('mainChart');
    const legend = document.getElementById('chartLegend');
    const disclaimer = panel?.querySelector('.disclaimer');
    const context = panel?.querySelector('.editorial-chart-context');

    if (!panel || !toolbar || !stage || !chart || !legend) return;
    panel.classList.add('tw-chart-scope');

    addClasses(toolbar, '!mt-6 !flex !flex-col sm:!flex-row sm:!items-end sm:!justify-between !gap-3 !rounded-none !border !border-slate-700 !border-t-4 !border-t-red-700 !bg-slate-900 !px-4 !py-3');
    addClasses(toolbar.querySelector(':scope > div:first-child'), '!flex !flex-col !gap-1');
    addClasses(toolbar.querySelector('strong'), '!font-newsroom !text-xl !font-black !uppercase !tracking-wide !text-white');
    addClasses(toolbar.querySelector(':scope > div:first-child > span:not(.editorial-chart-context)'), '!text-sm !font-semibold !text-slate-400');
    addClasses(context, '!mt-1 !w-fit !border-l-4 !border-red-600 !bg-slate-950 !px-2 !py-1 !font-newsroom !text-xs !font-bold !uppercase !tracking-widest !text-slate-300');
    addClasses(toolbar.querySelector('.chart-modes'), '!flex !flex-wrap !gap-1');

    addClasses(stage, '!relative !min-h-[290px] !overflow-hidden !rounded-none !border-x !border-b !border-slate-700 !bg-slate-950 !p-2 sm:!p-4');
    addClasses(chart, '!block !h-auto !min-h-[260px] !w-full !overflow-visible');
    addClasses(legend, '!flex !flex-wrap !items-center !gap-2 !rounded-none !border-x !border-b !border-slate-700 !bg-slate-900 !px-4 !py-3');
    addClasses(disclaimer, '!m-0 !border-x !border-b !border-slate-700 !bg-slate-950 !px-4 !py-3 !text-xs !font-medium !leading-relaxed !text-slate-400');

    legend.querySelectorAll('.legend-item').forEach((item) => {
      addClasses(item, '!inline-flex !min-h-10 !items-center !gap-2 !rounded-none !border !border-slate-700 !bg-slate-950 !px-3 !py-2 !font-newsroom !text-sm !font-bold !uppercase !tracking-wide !transition-colors hover:!border-slate-400 hover:!bg-slate-800');
      addClasses(item.querySelector('i'), '!h-3 !w-3 !shrink-0 !rounded-none');
    });

    syncModeButtons();
  }

  function styleMainChartElements() {
    const chart = document.getElementById('mainChart');
    if (!chart) return;

    chart.querySelectorAll('.grid-line').forEach((line) => {
      addClasses(line, '!stroke-slate-700/70');
      line.setAttribute('vector-effect', 'non-scaling-stroke');
    });

    chart.querySelectorAll('.axis-label').forEach((label) => {
      addClasses(label, '!fill-slate-400 !font-newsroom !text-[11px] !font-bold !tracking-wide');
    });

    chart.querySelectorAll('.series-line').forEach((line) => {
      const color = line.getAttribute('stroke');
      if (color) line.style.setProperty('--series-color', color);
      addClasses(line, '!fill-none !transition-opacity !duration-200');
      line.setAttribute('vector-effect', 'non-scaling-stroke');
    });

    chart.querySelectorAll('.series-area').forEach((area) => {
      const color = area.getAttribute('fill');
      if (color) area.style.setProperty('--series-color', color);
      addClasses(area, '!transition-opacity !duration-200');
      area.setAttribute('vector-effect', 'non-scaling-stroke');
    });

    chart.querySelectorAll('.point').forEach((point) => {
      const color = point.getAttribute('fill');
      if (color) point.style.setProperty('--series-color', color);
      point.classList.add('editorial-point');
      point.classList.remove('point-pulse');
      point.setAttribute('r', point.classList.contains('ux-focused') ? '5.2' : '4.4');
      point.setAttribute('vector-effect', 'non-scaling-stroke');
      addClasses(point, '!stroke-slate-950 !stroke-2 !transition-all !duration-150 hover:!stroke-white');
    });

    chart.querySelectorAll('rect').forEach((rect) => {
      rect.setAttribute('rx', '0');
      rect.setAttribute('ry', '0');
      addClasses(rect, '!transition-all !duration-500');
    });
  }

  function hemicycleTitle(container) {
    const labels = {
      senateHemicycle: 'PROJEÇÃO DE CADEIRAS · SENADO FEDERAL',
      chamberHemicycle: 'PROJEÇÃO DE CADEIRAS · CÂMARA FEDERAL',
      districtHemicycle: 'PROJEÇÃO DE CADEIRAS · DISTRITO FEDERAL',
      simulationSeats: 'COMPOSIÇÃO PROJETADA · SIMULAÇÃO'
    };
    return labels[container.id] || 'COMPOSIÇÃO PROJETADA';
  }

  function decorateHemicycles() {
    document.querySelectorAll('.hemicycle').forEach((container) => {
      chartScopeFor(container);
      addClasses(container, '!overflow-hidden !rounded-none !border !border-slate-700 !border-t-4 !border-t-red-700 !bg-slate-950');

      let header = container.querySelector('[data-tailwind-chart-header]');
      if (!header) {
        header = document.createElement('div');
        header.dataset.tailwindChartHeader = 'true';
        header.innerHTML = `<strong>${hemicycleTitle(container)}</strong><span>MODELO DE DISTRIBUIÇÃO</span>`;
        container.prepend(header);
      }

      addClasses(header, '!flex !items-center !justify-between !gap-3 !border-b !border-slate-700 !bg-slate-900 !px-4 !py-3');
      addClasses(header.querySelector('strong'), '!font-newsroom !text-base !font-black !uppercase !tracking-wide !text-white');
      addClasses(header.querySelector('span'), '!border !border-slate-600 !bg-slate-950 !px-2 !py-1 !font-newsroom !text-[10px] !font-bold !uppercase !tracking-widest !text-slate-400');

      const svg = container.querySelector('svg');
      addClasses(svg, '!block !h-auto !w-full !p-3 sm:!p-5');
      svg?.querySelectorAll('.seat').forEach((seat) => {
        addClasses(seat, '!stroke-slate-950 !stroke-1 !transition-opacity !duration-150 hover:!opacity-70');
      });
      svg?.querySelectorAll('text').forEach((text) => {
        addClasses(text, '!font-newsroom');
      });
    });
  }

  function decoratePartyBars() {
    document.querySelectorAll('.party-table').forEach((table) => {
      chartScopeFor(table);
      addClasses(table, '!mt-4 !divide-y !divide-slate-800 !overflow-hidden !rounded-none !border !border-slate-700 !bg-slate-950');

      table.querySelectorAll('.party-row').forEach((row) => {
        addClasses(row, '!grid !grid-cols-[minmax(74px,1fr)_minmax(90px,2fr)_52px_52px] !items-center !gap-3 !px-3 !py-3 !font-newsroom !text-sm !text-slate-200');
        addClasses(row.querySelector('strong'), '!font-black !uppercase !tracking-wide !text-white');
        row.querySelectorAll('span').forEach((span) => addClasses(span, '!text-right !font-bold !text-slate-300'));

        const bar = row.querySelector('.party-bar');
        const fill = bar?.querySelector('i');
        addClasses(bar, '!h-3 !overflow-hidden !rounded-none !bg-slate-800');
        addClasses(fill, '!block !h-full !rounded-none');
      });
    });
  }

  function decorateCandidateResultBars() {
    document.querySelectorAll('.candidate-result-bar').forEach((bar) => {
      const directory = bar.closest('.candidate-directory-card, .office-profile-card');
      (directory?.parentElement || directory)?.classList.add('tw-chart-scope');
      addClasses(bar, '!mt-2 !block !h-3 !overflow-hidden !rounded-none !bg-slate-800');
      addClasses(bar.querySelector('i'), '!block !h-full !rounded-none !bg-red-600');
    });
  }

  function decorateProbabilityBars() {
    document.querySelectorAll('.probability-bar').forEach((bar) => {
      chartScopeFor(bar);
      addClasses(bar, '!mt-3 !h-4 !overflow-hidden !rounded-none !border !border-slate-700 !bg-slate-900');
      addClasses(bar.querySelector('i'), '!block !h-full !rounded-none !bg-red-600 !transition-all !duration-700');
    });
  }

  function ensureTooltipPortal() {
    const tooltip = document.getElementById('chartTooltip');
    if (!tooltip) return null;

    let portal = document.getElementById('tailwindChartPortal');
    if (!portal) {
      portal = document.createElement('div');
      portal.id = 'tailwindChartPortal';
      portal.className = 'tw-chart-scope';
      document.body.appendChild(portal);
    }

    if (tooltip.parentElement !== portal) portal.appendChild(tooltip);
    tooltip.style.position = 'fixed';
    tooltip.style.pointerEvents = 'none';
    tooltip.style.zIndex = '1000';
    addClasses(tooltip, '!rounded-none !border !border-slate-600 !bg-slate-950/95 !px-3 !py-2 !font-newsroom !text-sm !font-semibold !leading-relaxed !text-white !shadow-2xl');
    tooltip.querySelectorAll('strong').forEach((strong) => addClasses(strong, '!mb-1 !block !font-black !uppercase !tracking-wide !text-white'));
    tooltip.querySelectorAll('span').forEach((span) => addClasses(span, '!block !text-xs !text-slate-300'));
    return tooltip;
  }

  function decorateAllCharts() {
    addEditorialContext();
    normalizeInterfaceCopy();
    decorateMainChartShell();
    styleMainChartElements();
    decorateHemicycles();
    decoratePartyBars();
    decorateCandidateResultBars();
    decorateProbabilityBars();
    ensureTooltipPortal();
  }

  function scheduleDecoration() {
    cancelAnimationFrame(decorationFrame);
    decorationFrame = requestAnimationFrame(decorateAllCharts);
  }

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

    if (left + rect.width > window.innerWidth - VIEWPORT_PADDING) left = clientX - rect.width - TOOLTIP_GAP;
    if (top + rect.height > window.innerHeight - VIEWPORT_PADDING) top = clientY - rect.height - TOOLTIP_GAP;

    left = Math.max(VIEWPORT_PADDING, Math.min(left, window.innerWidth - rect.width - VIEWPORT_PADDING));
    top = Math.max(VIEWPORT_PADDING, Math.min(top, window.innerHeight - rect.height - VIEWPORT_PADDING));

    tooltip.style.left = `${Math.round(left)}px`;
    tooltip.style.top = `${Math.round(top)}px`;
  }

  function isChartPoint(target) {
    return Boolean(target?.closest?.('#mainChart .point'));
  }

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

  function bindGlobalEvents() {
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
      scheduleDecoration();
    });

    window.addEventListener('scroll', () => {
      document.getElementById('chartTooltip')?.classList.add('hidden');
    }, { passive: true, capture: true });

    window.addEventListener('blur', () => {
      document.getElementById('chartTooltip')?.classList.add('hidden');
    });
  }

  function observeDynamicCharts() {
    const observer = new MutationObserver(scheduleDecoration);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class']
    });
  }

  function init() {
    document.documentElement.classList.add('us-election-editorial');
    loadFlatFixes();
    loadAuditSystem();
    bindGlobalEvents();

    loadTailwind(() => {
      decorateAllCharts();
      observeDynamicCharts();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();