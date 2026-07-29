(() => {
  'use strict';
  const data = window.POLL_RESULTS;
  if (!data) return;

  const extraCandidates = [
    { id: 'ratinho', name: 'Ratinho Júnior', party: 'PSD', color: '#0f766e' },
    { id: 'tarcisio', name: 'Tarcísio de Freitas', party: 'Republicanos', color: '#9333ea' },
    { id: 'aecio', name: 'Aécio Neves', party: 'PSDB', color: '#0284c7' },
    { id: 'samara', name: 'Samara Martins', party: 'UP', color: '#be123c' },
    { id: 'joaquim', name: 'Joaquim Barbosa', party: 'DC', color: '#475569' },
    { id: 'rui', name: 'Rui Costa Pimenta', party: 'PCO', color: '#b91c1c' },
    { id: 'michelle', name: 'Michelle Bolsonaro', party: 'PL', color: '#e11d48' },
    { id: 'jair', name: 'Jair Bolsonaro', party: 'PL', color: '#ca8a04' }
  ];

  const extraPolls = [
    {
      id: 'datafolha-2026-03-07-r1-principal', round: 1, scenario: 'Cenário principal', matchup: null,
      date: '2026-03-07', publication: '07/03/2026', institute: 'Datafolha', scope: 'Brasil',
      field: '03 a 05/03/2026', sample: '2.004', margin: '±2 p.p.', registry: 'BR-03715/2026',
      source: 'https://noticias.uol.com.br/ultimas-noticias/agencia-estado/2026/03/07/datafolha-lula-e-flavio-bolsonaro-despontam-como-favoritos-em-todos-os-cenarios.amp.htm',
      values: { lula: 38, flavio: 32, ratinho: 7, zema: 4 }
    },
    {
      id: 'datafolha-2026-03-07-r2-lula-flavio', round: 2, scenario: 'Lula × Flávio Bolsonaro', matchup: 'lula-flavio',
      date: '2026-03-07', publication: '07/03/2026', institute: 'Datafolha', scope: 'Brasil',
      field: '03 a 05/03/2026', sample: '2.004', margin: '±2 p.p.', registry: 'BR-03715/2026',
      source: 'https://noticias.uol.com.br/ultimas-noticias/agencia-estado/2026/03/07/datafolha-lula-marca-46-das-intencoes-de-voto-no-2-turno-flavio-tem-43.htm',
      values: { lula: 46, flavio: 43 }
    },
    {
      id: 'datafolha-2026-03-07-r2-lula-tarcisio', round: 2, scenario: 'Lula × Tarcísio de Freitas', matchup: 'lula-tarcisio',
      date: '2026-03-07', publication: '07/03/2026', institute: 'Datafolha', scope: 'Brasil',
      field: '03 a 05/03/2026', sample: '2.004', margin: '±2 p.p.', registry: 'BR-03715/2026',
      source: 'https://www.reuters.com/world/americas/flavio-bolsonaro-draws-even-with-lula-brazil-election-matchup-datafolha-shows-2026-03-07/',
      values: { lula: 45, tarcisio: 42 }
    },
    {
      id: 'nexus-2026-03-30-r2-lula-flavio', round: 2, scenario: 'Lula × Flávio Bolsonaro', matchup: 'lula-flavio',
      date: '2026-03-30', publication: '30/03/2026', institute: 'BTG/Nexus', scope: 'Brasil',
      field: 'Março de 2026', sample: '2.000', margin: '±2 p.p.', registry: 'BR-07875/2026',
      source: 'https://www.nexus.fsb.com.br/estudos-divulgados/pesquisa-btg-nexus-de-intencao-de-votos-para-presidente-marco-2026/',
      values: { lula: 46, flavio: 46 }
    },
    {
      id: 'datafolha-2026-05-16-r1-principal', round: 1, scenario: 'Cenário principal', matchup: null,
      date: '2026-05-16', publication: '16/05/2026', institute: 'Datafolha', scope: 'Brasil',
      field: 'Maio de 2026', sample: '2.004', margin: '±2 p.p.', registry: '',
      source: 'https://www1.folha.uol.com.br/poder/2026/05/datafolha-lula-abre-vantagem-sobre-flavio-apos-dark-horse.shtml',
      values: { lula: 38, flavio: 35 }
    },
    {
      id: 'datafolha-2026-05-16-r2-lula-flavio', round: 2, scenario: 'Lula × Flávio Bolsonaro', matchup: 'lula-flavio',
      date: '2026-05-16', publication: '16/05/2026', institute: 'Datafolha', scope: 'Brasil',
      field: 'Maio de 2026', sample: '2.004', margin: '±2 p.p.', registry: '',
      source: 'https://www.reuters.com/world/americas/brazils-lula-tied-with-senator-flavio-bolsonaro-second-round-datafolha-poll-2026-05-16/',
      values: { lula: 45, flavio: 45 }
    },
    {
      id: 'datafolha-2026-05-22-r1-principal', round: 1, scenario: 'Cenário principal', matchup: null,
      date: '2026-05-22', publication: '22/05/2026', institute: 'Datafolha', scope: 'Brasil',
      field: '20 a 21/05/2026', sample: '2.004', margin: '±2 p.p.', registry: '',
      source: 'https://www1.folha.uol.com.br/poder/2026/05/datafolha-lula-abre-vantagem-sobre-flavio-apos-dark-horse.shtml',
      values: { lula: 40, flavio: 31, caiado: 4, zema: 3, renan: 3, samara: 3 }
    },
    {
      id: 'datafolha-2026-05-22-r2-lula-flavio', round: 2, scenario: 'Lula × Flávio Bolsonaro', matchup: 'lula-flavio',
      date: '2026-05-22', publication: '22/05/2026', institute: 'Datafolha', scope: 'Brasil',
      field: '20 a 21/05/2026', sample: '2.004', margin: '±2 p.p.', registry: '',
      source: 'https://www.reuters.com/world/americas/lula-leads-flavio-bolsonaro-brazil-election-poll-after-banco-master-scandal-2026-05-22/',
      values: { lula: 47, flavio: 43 }
    },
    {
      id: 'nexus-2026-06-15-r1-principal', round: 1, scenario: 'Cenário principal', matchup: null,
      date: '2026-06-15', publication: '15/06/2026', institute: 'BTG/Nexus', scope: 'Brasil',
      field: '12 a 14/06/2026', sample: '2.017', margin: '±2 p.p.', registry: 'BR-06645/2026',
      source: 'https://www.nexus.fsb.com.br/estudos-divulgados/pesquisa-btg-nexus-de-intencao-de-votos-para-presidente-do-brasil-15-de-junho-de-2026/',
      values: { lula: 42, flavio: 33 }
    },
    {
      id: 'nexus-2026-06-15-r2-lula-flavio', round: 2, scenario: 'Lula × Flávio Bolsonaro', matchup: 'lula-flavio',
      date: '2026-06-15', publication: '15/06/2026', institute: 'BTG/Nexus', scope: 'Brasil',
      field: '12 a 14/06/2026', sample: '2.017', margin: '±2 p.p.', registry: 'BR-06645/2026',
      source: 'https://www.nexus.fsb.com.br/estudos-divulgados/pesquisa-btg-nexus-de-intencao-de-votos-para-presidente-do-brasil-15-de-junho-de-2026/',
      values: { lula: 49, flavio: 43 }
    },
    {
      id: 'cnt-mda-2026-06-16-r1-principal', round: 1, scenario: 'Cenário principal', matchup: null,
      date: '2026-06-16', publication: '16/06/2026', institute: 'CNT/MDA', scope: 'Brasil',
      field: '10 a 14/06/2026', sample: '2.002', margin: '±2,2 p.p.', registry: 'BR-04256/2026',
      source: 'https://noticias.uol.com.br/politica/ultimas-noticias/2026/06/16/cntmda-lula-lidera-contra-flavio-e-outros-nomes-da-direita-em-1-e-2-turnos.ghtm',
      values: { lula: 41.8, flavio: 28.2, caiado: 4, zema: 2.8, joaquim: 2.3, renan: 2 }
    },
    {
      id: 'cnt-mda-2026-06-16-r2-lula-flavio', round: 2, scenario: 'Lula × Flávio Bolsonaro', matchup: 'lula-flavio',
      date: '2026-06-16', publication: '16/06/2026', institute: 'CNT/MDA', scope: 'Brasil',
      field: '10 a 14/06/2026', sample: '2.002', margin: '±2,2 p.p.', registry: 'BR-04256/2026',
      source: 'https://www.reuters.com/world/americas/lula-widens-lead-over-flavio-bolsonaro-brazil-election-second-round-cntmda-poll-2026-06-16/',
      values: { lula: 49.3, flavio: 36.8 }
    },
    {
      id: 'datafolha-2026-06-20-r1-principal', round: 1, scenario: 'Cenário principal', matchup: null,
      date: '2026-06-20', publication: '20/06/2026', institute: 'Datafolha', scope: 'Brasil',
      field: '17 a 18/06/2026', sample: '2.004', margin: '±2 p.p.', registry: 'BR-09956/2026',
      source: 'https://www1.folha.uol.com.br/poder/2026/06/datafolha-lula-mantem-vantagem-com-41-no-1o-turno-contra-31-de-flavio.shtml',
      values: { lula: 41, flavio: 31, caiado: 3, renan: 3, aecio: 2, cury: 2, zema: 2, samara: 2, daciolo: 1, joaquim: 1, rui: 1 }
    },
    {
      id: 'datafolha-2026-06-20-r2-lula-flavio', round: 2, scenario: 'Lula × Flávio Bolsonaro', matchup: 'lula-flavio',
      date: '2026-06-20', publication: '20/06/2026', institute: 'Datafolha', scope: 'Brasil',
      field: '17 a 18/06/2026', sample: '2.004', margin: '±2 p.p.', registry: 'BR-09956/2026',
      source: 'https://www1.folha.uol.com.br/poder/2026/06/datafolha-lula-mantem-vantagem-com-41-no-1o-turno-contra-31-de-flavio.shtml',
      values: { lula: 47, flavio: 43 }
    },
    {
      id: 'datafolha-2026-06-20-r2-lula-caiado', round: 2, scenario: 'Lula × Ronaldo Caiado', matchup: 'lula-caiado',
      date: '2026-06-20', publication: '20/06/2026', institute: 'Datafolha', scope: 'Brasil',
      field: '17 a 18/06/2026', sample: '2.004', margin: '±2 p.p.', registry: 'BR-09956/2026',
      source: 'https://www1.folha.uol.com.br/poder/2026/06/datafolha-lula-mantem-vantagem-com-41-no-1o-turno-contra-31-de-flavio.shtml',
      values: { lula: 47, caiado: 41 }
    },
    {
      id: 'nexus-2026-06-29-r1-principal', round: 1, scenario: 'Cenário principal', matchup: null,
      date: '2026-06-29', publication: '29/06/2026', institute: 'BTG/Nexus', scope: 'Brasil',
      field: '26 a 28/06/2026', sample: '2.009', margin: '±2 p.p.', registry: 'BR-08521/2026',
      source: 'https://www.nexus.fsb.com.br/estudos-divulgados/pesquisa-btg-nexus-de-intencao-de-votos-para-presidente-do-brasil-29-de-junho-de-2026/',
      values: { lula: 42, flavio: 34, caiado: 5, renan: 4, zema: 3, joaquim: 2 }
    },
    {
      id: 'nexus-2026-06-29-r2-lula-flavio', round: 2, scenario: 'Lula × Flávio Bolsonaro', matchup: 'lula-flavio',
      date: '2026-06-29', publication: '29/06/2026', institute: 'BTG/Nexus', scope: 'Brasil',
      field: '26 a 28/06/2026', sample: '2.009', margin: '±2 p.p.', registry: 'BR-08521/2026',
      source: 'https://www.bol.uol.com.br/noticias/2026/06/29/lula-tem-47-contra-44-de-flavio-bolsonaro-no-2-turno-em-empate-tecnico-aponta-btgnexus.amp.htm',
      values: { lula: 47, flavio: 44 }
    },
    {
      id: 'nexus-2026-06-29-r2-lula-zema', round: 2, scenario: 'Lula × Romeu Zema', matchup: 'lula-zema',
      date: '2026-06-29', publication: '29/06/2026', institute: 'BTG/Nexus', scope: 'Brasil',
      field: '26 a 28/06/2026', sample: '2.009', margin: '±2 p.p.', registry: 'BR-08521/2026',
      source: 'https://www.bol.uol.com.br/noticias/2026/06/29/lula-tem-47-contra-44-de-flavio-bolsonaro-no-2-turno-em-empate-tecnico-aponta-btgnexus.amp.htm',
      values: { lula: 48, zema: 38 }
    },
    {
      id: 'nexus-2026-06-29-r2-lula-caiado', round: 2, scenario: 'Lula × Ronaldo Caiado', matchup: 'lula-caiado',
      date: '2026-06-29', publication: '29/06/2026', institute: 'BTG/Nexus', scope: 'Brasil',
      field: '26 a 28/06/2026', sample: '2.009', margin: '±2 p.p.', registry: 'BR-08521/2026',
      source: 'https://www.bol.uol.com.br/noticias/2026/06/29/lula-tem-47-contra-44-de-flavio-bolsonaro-no-2-turno-em-empate-tecnico-aponta-btgnexus.amp.htm',
      values: { lula: 47, caiado: 39 }
    },
    {
      id: 'nexus-2026-06-29-r2-lula-renan', round: 2, scenario: 'Lula × Renan Santos', matchup: 'lula-renan',
      date: '2026-06-29', publication: '29/06/2026', institute: 'BTG/Nexus', scope: 'Brasil',
      field: '26 a 28/06/2026', sample: '2.009', margin: '±2 p.p.', registry: 'BR-08521/2026',
      source: 'https://www.bol.uol.com.br/noticias/2026/06/29/lula-tem-47-contra-44-de-flavio-bolsonaro-no-2-turno-em-empate-tecnico-aponta-btgnexus.amp.htm',
      values: { lula: 48, renan: 36 }
    },
    {
      id: 'atlas-2026-07-01-r2-lula-caiado', round: 2, scenario: 'Lula × Ronaldo Caiado', matchup: 'lula-caiado',
      date: '2026-07-01', publication: '01/07/2026', institute: 'AtlasIntel/Bloomberg', scope: 'Brasil',
      field: '26 a 30/06/2026', sample: '4.999', margin: '±1 p.p.', registry: '',
      source: 'https://noticias.uol.com.br/ultimas-noticias/reuters/2026/07/01/lula-teria-488-dos-votos-contra-423-de-flavio-no-2-turno-aponta-pesquisa-atlas.amp.htm',
      values: { lula: 48, caiado: 39 }
    },
    {
      id: 'atlas-2026-07-01-r2-lula-zema', round: 2, scenario: 'Lula × Romeu Zema', matchup: 'lula-zema',
      date: '2026-07-01', publication: '01/07/2026', institute: 'AtlasIntel/Bloomberg', scope: 'Brasil',
      field: '26 a 30/06/2026', sample: '4.999', margin: '±1 p.p.', registry: '',
      source: 'https://noticias.uol.com.br/ultimas-noticias/reuters/2026/07/01/lula-teria-488-dos-votos-contra-423-de-flavio-no-2-turno-aponta-pesquisa-atlas.amp.htm',
      values: { lula: 48.2, zema: 38.5 }
    },
    {
      id: 'atlas-2026-07-01-r2-lula-renan', round: 2, scenario: 'Lula × Renan Santos', matchup: 'lula-renan',
      date: '2026-07-01', publication: '01/07/2026', institute: 'AtlasIntel/Bloomberg', scope: 'Brasil',
      field: '26 a 30/06/2026', sample: '4.999', margin: '±1 p.p.', registry: '',
      source: 'https://noticias.uol.com.br/ultimas-noticias/reuters/2026/07/01/lula-teria-488-dos-votos-contra-423-de-flavio-no-2-turno-aponta-pesquisa-atlas.amp.htm',
      values: { lula: 49.2, renan: 28.9 }
    },
    {
      id: 'atlas-2026-07-01-r2-lula-michelle', round: 2, scenario: 'Lula × Michelle Bolsonaro', matchup: 'lula-michelle',
      date: '2026-07-01', publication: '01/07/2026', institute: 'AtlasIntel/Bloomberg', scope: 'Brasil',
      field: '26 a 30/06/2026', sample: '4.999', margin: '±1 p.p.', registry: '',
      source: 'https://noticias.uol.com.br/ultimas-noticias/reuters/2026/07/01/lula-teria-488-dos-votos-contra-423-de-flavio-no-2-turno-aponta-pesquisa-atlas.amp.htm',
      values: { lula: 48.7, michelle: 38.9 }
    },
    {
      id: 'atlas-2026-07-01-r2-lula-jair', round: 2, scenario: 'Lula × Jair Bolsonaro', matchup: 'lula-jair',
      date: '2026-07-01', publication: '01/07/2026', institute: 'AtlasIntel/Bloomberg', scope: 'Brasil',
      field: '26 a 30/06/2026', sample: '4.999', margin: '±1 p.p.', registry: '',
      source: 'https://noticias.uol.com.br/ultimas-noticias/reuters/2026/07/01/lula-teria-488-dos-votos-contra-423-de-flavio-no-2-turno-aponta-pesquisa-atlas.amp.htm',
      values: { lula: 48.6, jair: 43.1 }
    },
    {
      id: 'meio-ideia-2026-07-08-r2-lula-flavio', round: 2, scenario: 'Lula × Flávio Bolsonaro', matchup: 'lula-flavio',
      date: '2026-07-08', publication: '08/07/2026', institute: 'Meio/Ideia', scope: 'Brasil',
      field: '03 a 06/07/2026', sample: '1.500', margin: '±2,5 p.p.', registry: 'BR-05628/2026',
      source: 'https://www1.folha.uol.com.br/poder/2026/07/lula-mantem-vantagem-sobre-flavio-bolsonaro-no-2o-turno-aponta-meio-ideia.shtml',
      values: { lula: 45, flavio: 40 }
    },
    {
      id: 'nexus-2026-07-13-r1-principal', round: 1, scenario: 'Cenário principal', matchup: null,
      date: '2026-07-13', publication: '13/07/2026', institute: 'BTG/Nexus', scope: 'Brasil',
      field: '10 a 12/07/2026', sample: '2.003', margin: '±2 p.p.', registry: 'BR-07981/2026',
      source: 'https://www.nexus.fsb.com.br/estudos-divulgados/pesquisa-btg-nexus-de-intencao-de-votos-para-presidente-do-brasil-13-de-julho-de-2026/',
      values: { lula: 40, flavio: 34, caiado: 5, renan: 4, zema: 4 }
    },
    {
      id: 'nexus-2026-07-13-r2-lula-flavio', round: 2, scenario: 'Lula × Flávio Bolsonaro', matchup: 'lula-flavio',
      date: '2026-07-13', publication: '13/07/2026', institute: 'BTG/Nexus', scope: 'Brasil',
      field: '10 a 12/07/2026', sample: '2.003', margin: '±2 p.p.', registry: 'BR-07981/2026',
      source: 'https://www.nexus.fsb.com.br/estudos-divulgados/pesquisa-btg-nexus-de-intencao-de-votos-para-presidente-do-brasil-13-de-julho-de-2026/',
      values: { lula: 47, flavio: 44 }
    },
    {
      id: 'datafolha-2026-07-24-r2-lula-caiado', round: 2, scenario: 'Lula × Ronaldo Caiado', matchup: 'lula-caiado',
      date: '2026-07-24', publication: '24/07/2026', institute: 'Datafolha', scope: 'Brasil',
      field: '22 a 24/07/2026', sample: '2.004', margin: '±2 p.p.', registry: 'BR-01166/2026',
      source: 'https://noticias.uol.com.br/ultimas-noticias/agencia-estado/2026/07/24/lula-tem-48-e-flavio-bolsonaro-soma-43-no-segundo-turno-aponta-pesquisa-datafolha.htm',
      values: { lula: 47, caiado: 40 }
    },
    {
      id: 'datafolha-2026-07-24-r2-lula-zema', round: 2, scenario: 'Lula × Romeu Zema', matchup: 'lula-zema',
      date: '2026-07-24', publication: '24/07/2026', institute: 'Datafolha', scope: 'Brasil',
      field: '22 a 24/07/2026', sample: '2.004', margin: '±2 p.p.', registry: 'BR-01166/2026',
      source: 'https://noticias.uol.com.br/ultimas-noticias/agencia-estado/2026/07/24/lula-tem-48-e-flavio-bolsonaro-soma-43-no-segundo-turno-aponta-pesquisa-datafolha.htm',
      values: { lula: 48, zema: 40 }
    },
    {
      id: 'nexus-2026-07-27-r2-lula-zema', round: 2, scenario: 'Lula × Romeu Zema', matchup: 'lula-zema',
      date: '2026-07-27', publication: '27/07/2026', institute: 'BTG/Nexus', scope: 'Brasil',
      field: '24 a 26/07/2026', sample: '2.004', margin: '±2 p.p.', registry: 'BR-01489/2026',
      source: 'https://www1.folha.uol.com.br/poder/2026/07/btgnexus-lula-tem-47-e-flavio-bolsonaro-43-em-eventual-segundo-turno.shtml',
      values: { lula: 46, zema: 42 }
    },
    {
      id: 'nexus-2026-07-27-r2-lula-caiado', round: 2, scenario: 'Lula × Ronaldo Caiado', matchup: 'lula-caiado',
      date: '2026-07-27', publication: '27/07/2026', institute: 'BTG/Nexus', scope: 'Brasil',
      field: '24 a 26/07/2026', sample: '2.004', margin: '±2 p.p.', registry: 'BR-01489/2026',
      source: 'https://www1.folha.uol.com.br/poder/2026/07/btgnexus-lula-tem-47-e-flavio-bolsonaro-43-em-eventual-segundo-turno.shtml',
      values: { lula: 45, caiado: 43 }
    },
    {
      id: 'nexus-2026-07-27-r2-lula-renan', round: 2, scenario: 'Lula × Renan Santos', matchup: 'lula-renan',
      date: '2026-07-27', publication: '27/07/2026', institute: 'BTG/Nexus', scope: 'Brasil',
      field: '24 a 26/07/2026', sample: '2.004', margin: '±2 p.p.', registry: 'BR-01489/2026',
      source: 'https://www1.folha.uol.com.br/poder/2026/07/btgnexus-lula-tem-47-e-flavio-bolsonaro-43-em-eventual-segundo-turno.shtml',
      values: { lula: 47, renan: 39 }
    }
  ];

  const candidateIds = new Set(data.candidates.map((candidate) => candidate.id));
  extraCandidates.forEach((candidate) => {
    if (!candidateIds.has(candidate.id)) data.candidates.push(candidate);
  });

  const pollIds = new Set(data.polls.map((poll) => poll.id));
  extraPolls.forEach((poll) => {
    if (!pollIds.has(poll.id)) data.polls.push(poll);
  });

  data.polls.sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
  data.version = '2026-07-28.2';
  data.updatedAt = '2026-07-28T22:30:00-03:00';
})();
