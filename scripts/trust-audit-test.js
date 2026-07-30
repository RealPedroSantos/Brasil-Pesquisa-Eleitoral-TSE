const fs = require('fs');

function fail(message) {
  console.error(`Teste de confiança falhou: ${message}`);
  process.exit(1);
}

const dashboard = fs.readFileSync('public/dashboard.js', 'utf8');

const requiredMarkers = [
  'officeParityComparableObservations',
  'data-trust-methodology',
  "svg.dataset.trustLineMode = signatures.size > 1 ? 'points-only' : 'comparable-series'",
  "svg.dataset.portraitRailInside = 'true'",
  'data-trust-coverage',
  'governor-ce-quaest-2026-04-30',
  'governor-go-quaest-2026-04-30',
  'governor-pi-atlas-2026-07-21',
  'governor-rn-atlas-2026-07-22',
  'datafolha-2026-07-24-r1-principal',
  'nexus-2026-07-27-r1-principal',
  'atlas-2026-07-29-r2-lula-flavio'
];

for (const marker of requiredMarkers) {
  if (!dashboard.includes(marker)) fail(`marcador ausente: ${marker}`);
}

const stateIds = [...dashboard.matchAll(/governor-(?:ce|go|pi|rn)-[a-z0-9-]+/g)].map((match) => match[0]);
if (new Set(stateIds).size < 4) fail('menos de quatro novos levantamentos estaduais auditados');

if (!dashboard.includes('Cenários alternativos da mesma pesquisa nunca são conectados')) {
  fail('aviso metodológico explícito ausente');
}

console.log('Teste de confiança: cenários comparáveis, retratos internos e cobertura auditada: OK');
