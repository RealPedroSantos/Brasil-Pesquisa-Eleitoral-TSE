(() => {
  'use strict';
  const parts = [
    'dashboard-parts/part-00.txt',
    'dashboard-parts/part-01.txt',
    'dashboard-parts/part-02.txt',
    'dashboard-parts/part-03.txt',
    'dashboard-parts/part-04.txt',
    'dashboard-parts/part-05.txt',
    'dashboard-parts/part-06.txt'
  ];

  Promise.all(parts.map(async (path) => {
    const response = await fetch(path, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Falha ao carregar ${path}: HTTP ${response.status}`);
    return response.text();
  }))
    .then((chunks) => Function(chunks.join('\n'))())
    .catch((error) => {
      console.error(error);
      const boot = document.getElementById('bootScreen');
      if (boot) boot.innerHTML = '<strong>Falha ao carregar o painel eleitoral</strong>';
    });
})();