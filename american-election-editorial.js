(() => {
  'use strict';

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
