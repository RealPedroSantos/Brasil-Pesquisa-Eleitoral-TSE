(() => {
  'use strict';

  const CARD_SELECTOR = '.office-chart-card';
  let cleanupFrame = 0;

  function removeCoverageCharts(root = document) {
    root.querySelectorAll(CARD_SELECTOR).forEach((card) => {
      const grid = card.closest('.office-main-grid');
      card.remove();

      if (!grid) return;

      grid.classList.add('office-main-grid--profiles-only');
      grid.style.gridTemplateColumns = 'minmax(0, 1fr)';

      const profileCard = grid.querySelector('.office-profile-card');
      if (profileCard) {
        profileCard.style.gridColumn = '1 / -1';
        profileCard.style.width = '100%';
        profileCard.style.maxWidth = 'none';
      }

      if (!grid.children.length) grid.remove();
    });
  }

  function scheduleCleanup() {
    cancelAnimationFrame(cleanupFrame);
    cleanupFrame = requestAnimationFrame(() => removeCoverageCharts());
  }

  function init() {
    removeCoverageCharts();

    const observer = new MutationObserver((mutations) => {
      if (mutations.some((mutation) => mutation.addedNodes.length)) scheduleCleanup();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();