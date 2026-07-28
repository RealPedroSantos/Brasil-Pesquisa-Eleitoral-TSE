(() => {
  const card = document.getElementById('tseLiveCard');
  const dot = document.getElementById('tseLiveDot');
  const title = document.getElementById('tseLiveTitle');
  const details = document.getElementById('tseLiveDetails');
  const checked = document.getElementById('tseLiveChecked');
  const link = document.getElementById('tseLiveLink');
  if (!card) return;

  const fmtDate = value => value ? new Date(value).toLocaleString('pt-BR', {
    dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo'
  }) : 'não informada';

  async function updateTseStatus() {
    card.classList.add('checking');
    try {
      const response = await fetch('/api/tse-live?ts=' + Date.now(), { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || 'Falha na consulta');

      const previous = localStorage.getItem('tseDatasetFingerprint');
      const changed = Boolean(previous && data.fingerprint && previous !== data.fingerprint);
      if (data.fingerprint) localStorage.setItem('tseDatasetFingerprint', data.fingerprint);

      dot.className = 'live-dot online';
      title.textContent = changed ? 'Nova atualização detectada no TSE' : 'Conectado ao Portal de Dados do TSE';
      details.textContent = changed
        ? 'O arquivo oficial de pesquisas eleitorais foi alterado desde sua última visita.'
        : `Base oficial com atualização ${data.frequency}. Última modificação: ${fmtDate(data.lastModified)}.`;
      checked.textContent = `Verificado em ${fmtDate(data.checkedAt)}`;
      link.href = data.portalUrl;
      card.classList.toggle('has-update', changed);
    } catch (error) {
      dot.className = 'live-dot offline';
      title.textContent = 'TSE temporariamente indisponível';
      details.textContent = 'O painel continuará exibindo os dados já verificados e tentará novamente automaticamente.';
      checked.textContent = `Última tentativa: ${fmtDate(new Date().toISOString())}`;
    } finally {
      card.classList.remove('checking');
    }
  }

  updateTseStatus();
  setInterval(updateTseStatus, 5 * 60 * 1000);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') updateTseStatus();
  });
})();