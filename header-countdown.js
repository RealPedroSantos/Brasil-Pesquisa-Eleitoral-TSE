(() => {
  'use strict';

  const ELECTION_START = new Date('2026-10-04T08:00:00-03:00').getTime();
  const ELECTION_END = new Date('2026-10-04T17:00:00-03:00').getTime();
  let intervalId = null;

  const pad = (value) => String(Math.max(0, value)).padStart(2, '0');

  function buildCountdown() {
    const header = document.querySelector('.broadcast-header');
    const liveClock = header?.querySelector('.live-clock');
    if (!header || !liveClock || document.getElementById('electionCountdown')) return null;

    const countdown = document.createElement('div');
    countdown.id = 'electionCountdown';
    countdown.className = 'election-countdown';
    countdown.setAttribute('role', 'timer');
    countdown.setAttribute('aria-live', 'off');
    countdown.innerHTML = `
      <div class="election-countdown-label">
        <span>Contagem regressiva</span>
        <strong>1º TURNO</strong>
      </div>
      <div class="election-countdown-units" aria-hidden="true">
        <span class="election-countdown-unit"><strong data-countdown-days>--</strong><small>DIAS</small></span>
        <span class="election-countdown-unit"><strong data-countdown-hours>--</strong><small>HORAS</small></span>
        <span class="election-countdown-unit"><strong data-countdown-minutes>--</strong><small>MIN</small></span>
        <span class="election-countdown-unit"><strong data-countdown-seconds>--</strong><small>SEG</small></span>
      </div>
      <strong class="election-countdown-status" data-countdown-status></strong>
      <div class="election-countdown-date">
        <span>Início da votação</span>
        <strong>04 OUT · 08H</strong>
      </div>`;

    header.insertBefore(countdown, liveClock);
    return countdown;
  }

  function updateCountdown() {
    const countdown = document.getElementById('electionCountdown') || buildCountdown();
    if (!countdown) return;

    const now = Date.now();
    const status = countdown.querySelector('[data-countdown-status]');

    if (now >= ELECTION_END) {
      countdown.classList.remove('is-live');
      countdown.classList.add('is-finished');
      status.textContent = '1º TURNO ENCERRADO';
      countdown.setAttribute('aria-label', 'O primeiro turno das Eleições 2026 foi encerrado.');
      if (intervalId) clearInterval(intervalId);
      return;
    }

    if (now >= ELECTION_START) {
      countdown.classList.add('is-live');
      countdown.classList.remove('is-finished');
      status.textContent = 'VOTAÇÃO EM ANDAMENTO';
      countdown.setAttribute('aria-label', 'Votação do primeiro turno em andamento.');
      return;
    }

    countdown.classList.remove('is-live', 'is-finished');
    const remaining = ELECTION_START - now;
    const days = Math.floor(remaining / 86400000);
    const hours = Math.floor((remaining % 86400000) / 3600000);
    const minutes = Math.floor((remaining % 3600000) / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);

    countdown.querySelector('[data-countdown-days]').textContent = pad(days);
    countdown.querySelector('[data-countdown-hours]').textContent = pad(hours);
    countdown.querySelector('[data-countdown-minutes]').textContent = pad(minutes);
    countdown.querySelector('[data-countdown-seconds]').textContent = pad(seconds);
    countdown.setAttribute(
      'aria-label',
      `Faltam ${days} dias, ${hours} horas, ${minutes} minutos e ${seconds} segundos para o início do primeiro turno.`
    );
  }

  function init() {
    buildCountdown();
    updateCountdown();
    intervalId = window.setInterval(updateCountdown, 1000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
