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

  const EDGE_GAP = 10;
  const CURSOR_GAP = 14;
  let pointerX = 0;
  let pointerY = 0;
  let frame = 0;

  const getTooltip = () => document.getElementById('chartTooltip');

  function positionTooltip() {
    frame = 0;
    const tooltip = getTooltip();
    if (!tooltip || tooltip.classList.contains('hidden')) return;

    tooltip.style.position = 'fixed';
    tooltip.style.maxWidth = `min(280px, calc(100vw - ${EDGE_GAP * 2}px))`;
    tooltip.style.pointerEvents = 'none';

    const rect = tooltip.getBoundingClientRect();
    const viewportWidth = document.documentElement.clientWidth;
    const viewportHeight = document.documentElement.clientHeight;

    let left = pointerX + CURSOR_GAP;
    let top = pointerY + CURSOR_GAP;

    if (left + rect.width > viewportWidth - EDGE_GAP) {
      left = pointerX - rect.width - CURSOR_GAP;
    }

    if (top + rect.height > viewportHeight - EDGE_GAP) {
      top = pointerY - rect.height - CURSOR_GAP;
    }

    left = Math.max(EDGE_GAP, Math.min(left, viewportWidth - rect.width - EDGE_GAP));
    top = Math.max(EDGE_GAP, Math.min(top, viewportHeight - rect.height - EDGE_GAP));

    tooltip.style.left = `${Math.round(left)}px`;
    tooltip.style.top = `${Math.round(top)}px`;
  }

  function schedulePosition() {
    if (frame) cancelAnimationFrame(frame);
    frame = requestAnimationFrame(positionTooltip);
  }

  function trackPointer(event) {
    pointerX = event.clientX;
    pointerY = event.clientY;
    if (event.target.closest?.('#mainChart .point')) schedulePosition();
  }

  function bindTooltipPosition() {
    const tooltip = getTooltip();
    if (!tooltip || tooltip.dataset.viewportPositionBound === 'true') return;
    tooltip.dataset.viewportPositionBound = 'true';

    document.addEventListener('mousemove', trackPointer, { passive: true });
    document.addEventListener('pointermove', trackPointer, { passive: true });
    window.addEventListener('resize', schedulePosition, { passive: true });

    const observer = new MutationObserver(schedulePosition);
    observer.observe(tooltip, {
      attributes: true,
      attributeFilter: ['class'],
      childList: true,
      subtree: true
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindTooltipPosition, { once: true });
  } else {
    bindTooltipPosition();
  }
})();
