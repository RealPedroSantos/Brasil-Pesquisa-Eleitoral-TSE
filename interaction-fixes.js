(() => {
  'use strict';

  const DATA = window.ELECTION_DATA;
  if (!DATA?.candidates?.length) return;

  const interactiveSelector = '.candidate-card, .legend-item, .series-line, .series-area, .point';
  const normalizeColor = (value) => String(value || '').trim().toLowerCase().replace(/\s+/g, '');

  let pinnedId = null;
  let hoverId = null;
  let syntheticClick = false;

  const getPanel = () => document.querySelector('.presidential-panel');
  const getDetailPanel = () => document.querySelector('.candidate-detail-panel');
  const getDashboard = () => document.querySelector('.dashboard-grid');

  function setCandidateDetailsVisible(visible, options = {}) {
    const detailPanel = getDetailPanel();
    const dashboard = getDashboard();
    if (!detailPanel) return;

    detailPanel.hidden = !visible;
    detailPanel.classList.toggle('is-point-open', visible);
    detailPanel.setAttribute('aria-hidden', visible ? 'false' : 'true');
    dashboard?.classList.toggle('candidate-details-visible', visible);

    if (visible && options.scroll && window.matchMedia('(max-width: 980px)').matches) {
      requestAnimationFrame(() => detailPanel.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    }
  }

  function candidateFromElement(element) {
    if (!element) return null;
    const id = element.dataset?.id;
    if (id) return DATA.candidates.find((candidate) => candidate.id === id) || null;

    const color = normalizeColor(
      element.getAttribute?.('stroke') || element.getAttribute?.('fill') || ''
    );
    if (!color || color === 'none') return null;
    return DATA.candidates.find((candidate) => normalizeColor(candidate.color) === color) || null;
  }

  function applyVisualFocus(id) {
    const panel = getPanel();
    if (!panel) return;

    const candidate = DATA.candidates.find((item) => item.id === id) || null;
    panel.dataset.chartFocus = candidate?.id || 'all';

    panel.querySelectorAll('.candidate-card, .legend-item').forEach((item) => {
      const focused = Boolean(candidate && item.dataset.id === candidate.id);
      item.classList.toggle('ux-focused', focused);
      item.classList.toggle('ux-muted', Boolean(candidate && !focused));
      item.setAttribute('aria-pressed', focused ? 'true' : 'false');
    });

    const selectedColor = normalizeColor(candidate?.color);

    panel.querySelectorAll('.series-line').forEach((line) => {
      const focused = Boolean(candidate && normalizeColor(line.getAttribute('stroke')) === selectedColor);
      line.classList.toggle('ux-focused', focused);
      line.classList.toggle('ux-muted', Boolean(candidate && !focused));
    });

    panel.querySelectorAll('.series-area').forEach((area) => {
      const focused = Boolean(candidate && normalizeColor(area.getAttribute('fill')) === selectedColor);
      area.classList.toggle('ux-focused', focused);
      area.classList.toggle('ux-muted', Boolean(candidate && !focused));
    });

    panel.querySelectorAll('.point').forEach((point) => {
      const focused = Boolean(candidate && normalizeColor(point.getAttribute('fill')) === selectedColor);
      point.classList.toggle('ux-focused', focused);
      point.classList.toggle('ux-muted', Boolean(candidate && !focused));
      point.setAttribute('tabindex', focused ? '0' : '-1');
    });
  }

  function invokeBuiltInReset() {
    const reset = document.querySelector('.chart-reset-focus');
    if (reset) {
      reset.click();
      return true;
    }
    return false;
  }

  function clearSelection() {
    const panel = getPanel();
    pinnedId = null;
    hoverId = null;
    panel?.classList.remove('interaction-hovering');
    setCandidateDetailsVisible(false);

    if (!invokeBuiltInReset()) {
      document.querySelector('.chart-focus-hud')?.remove();
      applyVisualFocus(null);
    }

    requestAnimationFrame(() => applyVisualFocus(null));
  }

  function focusTemporarily(id) {
    const panel = getPanel();
    if (!panel || !id) return;

    hoverId = id;
    panel.classList.toggle('interaction-hovering', Boolean(pinnedId && pinnedId !== id));
    applyVisualFocus(id);
  }

  function restoreAfterHover() {
    const panel = getPanel();
    hoverId = null;
    panel?.classList.remove('interaction-hovering');
    applyVisualFocus(pinnedId);
  }

  function selectFromChart(candidate, revealDetails = false) {
    const panel = getPanel();
    if (!panel || !candidate) return;

    if (pinnedId === candidate.id) {
      if (revealDetails) {
        setCandidateDetailsVisible(true, { scroll: true });
        return;
      }
      clearSelection();
      return;
    }

    pinnedId = candidate.id;
    hoverId = null;
    panel.classList.remove('interaction-hovering');

    const card = [...panel.querySelectorAll('.candidate-card')]
      .find((item) => item.dataset.id === candidate.id);

    if (card) {
      syntheticClick = true;
      card.click();
      syntheticClick = false;
    }

    requestAnimationFrame(() => {
      applyVisualFocus(candidate.id);
      setCandidateDetailsVisible(revealDetails, { scroll: revealDetails });
    });
  }

  function bindInteractions() {
    const panel = getPanel();
    const chart = document.getElementById('mainChart');
    if (!panel || !chart || panel.dataset.interactionFixBound === 'true') return;
    panel.dataset.interactionFixBound = 'true';

    setCandidateDetailsVisible(false);

    panel.addEventListener('pointerover', (event) => {
      const trigger = event.target.closest(interactiveSelector);
      if (!trigger || !panel.contains(trigger)) return;

      const candidate = candidateFromElement(trigger);
      if (!candidate) return;

      const previous = event.relatedTarget?.closest?.(interactiveSelector);
      if (candidateFromElement(previous)?.id === candidate.id) return;

      focusTemporarily(candidate.id);
    });

    panel.addEventListener('pointerout', (event) => {
      const trigger = event.target.closest(interactiveSelector);
      if (!trigger || !panel.contains(trigger)) return;

      const currentCandidate = candidateFromElement(trigger);
      const next = event.relatedTarget?.closest?.(interactiveSelector);
      const nextCandidate = candidateFromElement(next);

      if (currentCandidate && nextCandidate?.id === currentCandidate.id) return;
      restoreAfterHover();
    });

    panel.addEventListener('pointerleave', () => {
      if (hoverId) restoreAfterHover();
    });

    document.addEventListener('click', (event) => {
      const resetButton = event.target.closest('.chart-reset-focus');
      if (resetButton) {
        pinnedId = null;
        hoverId = null;
        panel.classList.remove('interaction-hovering');
        setCandidateDetailsVisible(false);
        return;
      }

      const trigger = event.target.closest(interactiveSelector);
      if (trigger && panel.contains(trigger)) {
        const candidate = candidateFromElement(trigger);
        if (!candidate) return;

        if (trigger.matches('.point')) {
          event.preventDefault();
          event.stopImmediatePropagation();
          selectFromChart(candidate, true);
          return;
        }

        if (trigger.matches('.series-line, .series-area')) {
          event.preventDefault();
          event.stopImmediatePropagation();
          setCandidateDetailsVisible(false);
          selectFromChart(candidate, false);
          return;
        }

        if (syntheticClick) return;

        setCandidateDetailsVisible(false);

        if (pinnedId === candidate.id) {
          event.preventDefault();
          event.stopImmediatePropagation();
          clearSelection();
          return;
        }

        pinnedId = candidate.id;
        hoverId = null;
        panel.classList.remove('interaction-hovering');
        requestAnimationFrame(() => applyVisualFocus(candidate.id));
        return;
      }

      if (!event.target.closest('.chart-focus-hud, .candidate-detail-panel')) clearSelection();
    }, true);

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') clearSelection();
    });

    const observer = new MutationObserver(() => {
      requestAnimationFrame(() => applyVisualFocus(hoverId || pinnedId));
    });
    observer.observe(chart, { childList: true, subtree: true });

    clearSelection();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindInteractions, { once: true });
  } else {
    bindInteractions();
  }
})();

(() => {
  'use strict';

  function loadCandidateDirectory() {
    if (!document.querySelector('link[href="office-candidates.css"]')) {
      const stylesheet = document.createElement('link');
      stylesheet.rel = 'stylesheet';
      stylesheet.href = 'office-candidates.css';
      document.head.appendChild(stylesheet);
    }

    if (!document.querySelector('script[src="office-candidates.js"]')) {
      const script = document.createElement('script');
      script.src = 'office-candidates.js';
      script.defer = true;
      document.body.appendChild(script);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadCandidateDirectory, { once: true });
  } else {
    loadCandidateDirectory();
  }
})();

(() => {
  'use strict';

  function loadElectionCountdown() {
    if (!document.querySelector('link[href="header-countdown.css"]')) {
      const stylesheet = document.createElement('link');
      stylesheet.rel = 'stylesheet';
      stylesheet.href = 'header-countdown.css';
      document.head.appendChild(stylesheet);
    }

    if (!document.querySelector('script[src="header-countdown.js"]')) {
      const script = document.createElement('script');
      script.src = 'header-countdown.js';
      script.defer = true;
      document.body.appendChild(script);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadElectionCountdown, { once: true });
  } else {
    loadElectionCountdown();
  }
})();

(() => {
  'use strict';

  function loadAmericanElectionEditorial() {
    if (!document.querySelector('link[href="american-election-editorial.css"]')) {
      const stylesheet = document.createElement('link');
      stylesheet.rel = 'stylesheet';
      stylesheet.href = 'american-election-editorial.css';
      document.head.appendChild(stylesheet);
    }

    if (!document.querySelector('script[src="american-election-editorial.js"]')) {
      const script = document.createElement('script');
      script.src = 'american-election-editorial.js';
      script.defer = true;
      document.body.appendChild(script);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadAmericanElectionEditorial, { once: true });
  } else {
    loadAmericanElectionEditorial();
  }
})();
