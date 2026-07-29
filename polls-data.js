window.POLL_RESULTS = {
  version: '2026-07-28.1',
  updatedAt: '2026-07-28T22:30:00-03:00',
  methodology: 'O catálogo inclui somente percentuais publicados em fonte verificável. Cada cenário permanece separado; não há média automática entre cenários incompatíveis.',
  candidates: [
    { id: 'lula', name: 'Lula', party: 'PT', color: '#2563eb', photo: '/api/image?id=lula&v=7' },
    { id: 'flavio', name: 'Flávio Bolsonaro', party: 'PL', color: '#dc2626', photo: '/api/image?id=flavio&v=3' },
    { id: 'renan', name: 'Renan Santos', party: 'Missão', color: '#7c3aed', photo: '/api/image?id=renan&v=3' },
    { id: 'caiado', name: 'Ronaldo Caiado', party: 'PSD', color: '#ea580c', photo: '/api/image?id=caiado&v=3' },
    { id: 'zema', name: 'Romeu Zema', party: 'Novo', color: '#0891b2', photo: '/api/image?id=zema&v=3' },
    { id: 'cury', name: 'Augusto Cury', party: 'Avante', color: '#64748b', photo: '/api/image?id=cury&v=3' },
    { id: 'daciolo', name: 'Cabo Daciolo', party: 'Mobiliza', color: '#16a34a', photo: '/api/image?id=daciolo&v=3' },
    { id: 'ciro', name: 'Ciro Gomes', party: 'PSDB', color: '#ca8a04', photo: '/api/public-figure-photo?name=Ciro%20Gomes' }
  ],
  polls: [
    {
      id: 'atlas-2026-02-27-r1', round: 1, scenario: 'Cenário principal', matchup: null,
      date: '2026-02-27', publication: '27/02/2026', institute: 'AtlasIntel/Bloomberg', scope: 'Brasil',
      field: 'Fevereiro de 2026', sample: 'Não informado na publicação consultada', margin: 'Não informada', registry: '',
      source: 'https://elpais.com/america/2026-02-27/bolsonaro-hijo-empata-con-lula-por-primera-vez-en-una-encuesta-electoral-en-brasil.html',
      values: { lula: 45, flavio: 39 }
    },
    {
      id: 'atlas-2026-02-27-r2-lula-flavio', round: 2, scenario: 'Lula × Flávio Bolsonaro', matchup: 'lula-flavio',
      date: '2026-02-27', publication: '27/02/2026', institute: 'AtlasIntel/Bloomberg', scope: 'Brasil',
      field: 'Fevereiro de 2026', sample: 'Não informado na publicação consultada', margin: 'Não informada', registry: '',
      source: 'https://elpais.com/america/2026-02-27/bolsonaro-hijo-empata-con-lula-por-primera-vez-en-una-encuesta-electoral-en-brasil.html',
      values: { lula: 46.2, flavio: 46.3 }
    },
    {
      id: 'rtbd-2026-03-03-r1', round: 1, scenario: 'Cenário divulgado', matchup: null,
      date: '2026-03-03', publication: '03/03/2026', institute: 'Real Time Big Data', scope: 'Brasil',
      field: 'Fim de fevereiro e início de março', sample: 'Não informado na publicação consultada', margin: 'Não informada', registry: '',
      source: 'https://noticias.uol.com.br/ultimas-noticias/agencia-estado/2026/03/03/lula-tem-39-no-1-turno-e-flavio-bolsonaro-32-aponta-pesquisa-realtimebigdata.htm',
      values: { lula: 39, flavio: 32, renan: 2, zema: 2 }
    },
    {
      id: 'atlas-2026-03-25-r1', round: 1, scenario: 'Cenário principal', matchup: null,
      date: '2026-03-25', publication: '25/03/2026', institute: 'AtlasIntel/Bloomberg', scope: 'Brasil',
      field: 'Março de 2026', sample: 'Não informado na publicação consultada', margin: 'Não informada', registry: '',
      source: 'https://www.brasildefato.com.br/2026/03/25/atlasintel-lula-lidera-1o-turno-para-presidente-pela-primeira-vez-flavio-bolsonaro-aparece-a-frente-no-2o/',
      values: { lula: 45, flavio: 42.4 }
    },
    {
      id: 'rtbd-2026-05-05-r1-c1', round: 1, scenario: 'Cenário 1', matchup: null,
      date: '2026-05-05', publication: '05/05/2026', institute: 'Real Time Big Data', scope: 'Brasil',
      field: '02 a 04/05/2026', sample: '2.000', margin: '±2 p.p.', registry: 'BR-03627/2026',
      source: 'https://www.poder360.com.br/poder-eleicoes/lula-aparece-a-frente-de-flavio-no-1o-turno-diz-pesquisa/',
      values: { lula: 40, flavio: 34 }
    },
    {
      id: 'rtbd-2026-05-05-r1-c2', round: 1, scenario: 'Cenário 2', matchup: null,
      date: '2026-05-05', publication: '05/05/2026', institute: 'Real Time Big Data', scope: 'Brasil',
      field: '02 a 04/05/2026', sample: '2.000', margin: '±2 p.p.', registry: 'BR-03627/2026',
      source: 'https://www.poder360.com.br/poder-eleicoes/lula-aparece-a-frente-de-flavio-no-1o-turno-diz-pesquisa/',
      values: { lula: 38, flavio: 33 }
    },
    {
      id: 'rtbd-2026-05-05-r2-lula-flavio', round: 2, scenario: 'Lula × Flávio Bolsonaro', matchup: 'lula-flavio',
      date: '2026-05-05', publication: '05/05/2026', institute: 'Real Time Big Data', scope: 'Brasil',
      field: '02 a 04/05/2026', sample: '2.000', margin: '±2 p.p.', registry: 'BR-03627/2026',
      source: 'https://www.poder360.com.br/poder-eleicoes/lula-aparece-a-frente-de-flavio-no-1o-turno-diz-pesquisa/',
      values: { lula: 43, flavio: 44 }
    },
    {
      id: 'atlas-2026-05-19-r1', round: 1, scenario: 'Cenário principal', matchup: null,
      date: '2026-05-19', publication: '19/05/2026', institute: 'AtlasIntel/Bloomberg', scope: 'Brasil',
      field: 'Maio de 2026', sample: 'Não informado na publicação consultada', margin: 'Não informada', registry: '',
      source: 'https://www.cnnbrasil.com.br/eleicoes/atlas-lula-tem-47-das-intencoes-de-voto-no-1o-turno-flavio-343/',
      values: { lula: 47, flavio: 34.3 }
    },
    {
      id: 'indexa-2026-05-27-r1', round: 1, scenario: 'Cenário principal', matchup: null,
      date: '2026-05-27', publication: '27/05/2026', institute: 'Indexa Pesquisas', scope: 'Brasil',
      field: 'Maio de 2026', sample: 'Não informado na publicação consultada', margin: 'Não informada', registry: '',
      source: 'https://www.jota.info/eleicoes/eleicoes-2026/lula-lidera-com-39-e-flavio-bolsonaro-tem-30-no-1o-turno-diz-indexa-pesquisas',
      values: { lula: 39, flavio: 30 }
    },
    {
      id: 'poderdata-2026-06-25-r1', round: 1, scenario: 'Cenário principal', matchup: null,
      date: '2026-06-25', publication: '25/06/2026', institute: 'PoderData/Aya', scope: 'Brasil',
      field: '21 a 24/06/2026', sample: '2.400', margin: '±2 p.p.', registry: 'BR-05722/2026',
      source: 'https://www.poder360.com.br/poderdata/poderdata-aya-1o-turno-lula-40-flavio-36-renan-4-e-caiado-4/',
      values: { lula: 40, flavio: 36, renan: 4, caiado: 4 }
    },
    {
      id: 'poderdata-2026-06-25-r2-lula-flavio', round: 2, scenario: 'Lula × Flávio Bolsonaro', matchup: 'lula-flavio',
      date: '2026-06-25', publication: '25/06/2026', institute: 'PoderData/Aya', scope: 'Brasil',
      field: '21 a 24/06/2026', sample: '2.400', margin: '±2 p.p.', registry: 'BR-05722/2026',
      source: 'https://www.poder360.com.br/poderdata/lula-tem-46-contra-43-de-flavio-no-2o-turno-diz-poderdata/',
      values: { lula: 46, flavio: 43 }
    },
    {
      id: 'atlas-2026-07-01-r1', round: 1, scenario: 'Cenário principal', matchup: null,
      date: '2026-07-01', publication: '01/07/2026', institute: 'AtlasIntel/Bloomberg', scope: 'Brasil',
      field: '26 a 30/06/2026', sample: '4.999', margin: '±1 p.p.', registry: '',
      source: 'https://www.reuters.com/world/americas/lula-leads-senator-bolsonaro-brazil-presidential-run-off-poll-shows-2026-07-01/',
      values: { lula: 46.3, flavio: 36.6, renan: 7.8, caiado: 2.9, zema: 2 }
    },
    {
      id: 'atlas-2026-07-01-r2-lula-flavio', round: 2, scenario: 'Lula × Flávio Bolsonaro', matchup: 'lula-flavio',
      date: '2026-07-01', publication: '01/07/2026', institute: 'AtlasIntel/Bloomberg', scope: 'Brasil',
      field: '26 a 30/06/2026', sample: '4.999', margin: '±1 p.p.', registry: '',
      source: 'https://www.poder360.com.br/poder-eleicoes/lula-tem-488-e-flavio-423-em-eventual-2o-turno-diz-pesquisa/',
      values: { lula: 48.8, flavio: 42.3 }
    },
    {
      id: 'meio-ideia-2026-07-08-r1', round: 1, scenario: 'Cenário principal', matchup: null,
      date: '2026-07-08', publication: '08/07/2026', institute: 'Meio/Ideia', scope: 'Brasil',
      field: '03 a 06/07/2026', sample: '1.500', margin: '±2,5 p.p.', registry: 'BR-05628/2026',
      source: 'https://www.poder360.com.br/poder-eleicoes/lula-e-flavio-estao-tecnicamente-empatados-no-2o-turno-diz-pesquisa/',
      values: { lula: 40.4, flavio: 32, renan: 5.4, caiado: 4.2, zema: 3.1, cury: 1.8, daciolo: 1.2 }
    },
    {
      id: 'gerp-2026-07-08-r2-lula-flavio', round: 2, scenario: 'Lula × Flávio Bolsonaro', matchup: 'lula-flavio',
      date: '2026-07-08', publication: '08/07/2026', institute: 'Gerp', scope: 'Brasil',
      field: '03 a 07/07/2026', sample: '2.000', margin: '±2,2 p.p.', registry: 'BR-03067/2026',
      source: 'https://www.poder360.com.br/poder-eleicoes/flavio-tem-45-e-lula-42-em-eventual-2o-turno-diz-pesquisa/',
      values: { lula: 42, flavio: 45 }
    },
    {
      id: 'quaest-2026-07-15-r1', round: 1, scenario: 'Cenário principal', matchup: null,
      date: '2026-07-15', publication: '15/07/2026', institute: 'Genial/Quaest', scope: 'Brasil',
      field: '10 a 13/07/2026', sample: '2.004', margin: '±2 p.p.', registry: '',
      source: 'https://noticias.r7.com/eleicoes/2026/genialquaest-lula-lidera-1-turno-com-40-dos-votos-flavio-bolsonaro-tem-28-15072026/',
      values: { lula: 40, flavio: 28, renan: 3, caiado: 4, zema: 2, cury: 1, daciolo: 1 }
    },
    {
      id: 'poderdata-2026-07-16-r1', round: 1, scenario: 'Cenário principal', matchup: null,
      date: '2026-07-16', publication: '16/07/2026', institute: 'PoderData/Aya', scope: 'Brasil',
      field: '12 a 15/07/2026', sample: '2.400', margin: '±2 p.p.', registry: 'BR-00059/2026',
      source: 'https://www.poder360.com.br/poder-eleicoes-2026/lula-tem-40-e-flavio-34-no-1o-turno-diz-poderdata-aya/',
      values: { lula: 40, flavio: 34, renan: 6, caiado: 4, zema: 4, cury: 3 }
    },
    {
      id: 'poderdata-2026-07-16-r2-lula-flavio', round: 2, scenario: 'Lula × Flávio Bolsonaro', matchup: 'lula-flavio',
      date: '2026-07-16', publication: '16/07/2026', institute: 'PoderData/Aya', scope: 'Brasil',
      field: '12 a 15/07/2026', sample: '2.400', margin: '±2 p.p.', registry: 'BR-00059/2026',
      source: 'https://www.poder360.com.br/poder-eleicoes-2026/lula-tem-45-contra-43-de-flavio-no-2o-turno-diz-poderdata-aya/',
      values: { lula: 45, flavio: 43 }
    },
    {
      id: 'poderdata-2026-07-16-r2-lula-caiado', round: 2, scenario: 'Lula × Ronaldo Caiado', matchup: 'lula-caiado',
      date: '2026-07-16', publication: '16/07/2026', institute: 'PoderData/Aya', scope: 'Brasil',
      field: '12 a 15/07/2026', sample: '2.400', margin: '±2 p.p.', registry: 'BR-00059/2026',
      source: 'https://www.poder360.com.br/poder-eleicoes-2026/psd-lanca-caiado-a-presidencia-e-mira-rejeicao-de-lula-e-flavio/',
      values: { lula: 44, caiado: 43 }
    },
    {
      id: 'indexa-2026-07-21-r1', round: 1, scenario: 'Cenário principal', matchup: null,
      date: '2026-07-21', publication: '21/07/2026', institute: 'Indexa Pesquisas', scope: 'Brasil',
      field: '16 a 19/07/2026', sample: '2.000', margin: '±2,2 p.p.', registry: '',
      source: 'https://www.cnnbrasil.com.br/eleicoes/indexa-lula-tem-41-das-intencoes-de-voto-no-1o-turno-flavio-30/',
      values: { lula: 41, flavio: 30 }
    },
    {
      id: 'rtbd-2026-07-21-r2-lula-flavio', round: 2, scenario: 'Lula × Flávio Bolsonaro', matchup: 'lula-flavio',
      date: '2026-07-21', publication: '21/07/2026', institute: 'Real Time Big Data', scope: 'Brasil',
      field: '18 a 20/07/2026', sample: '2.000', margin: '±2 p.p.', registry: '',
      source: 'https://www.poder360.com.br/poder-eleicoes-2026/lula-tem-45-contra-42-de-flavio-no-2o-turno-diz-pesquisa/',
      values: { lula: 45, flavio: 42 }
    },
    {
      id: 'rtbd-2026-07-21-r2-lula-caiado', round: 2, scenario: 'Lula × Ronaldo Caiado', matchup: 'lula-caiado',
      date: '2026-07-21', publication: '21/07/2026', institute: 'Real Time Big Data', scope: 'Brasil',
      field: '18 a 20/07/2026', sample: '2.000', margin: '±2 p.p.', registry: '',
      source: 'https://www.poder360.com.br/poder-eleicoes-2026/lula-tem-45-contra-42-de-flavio-no-2o-turno-diz-pesquisa/',
      values: { lula: 43, caiado: 44 }
    },
    {
      id: 'rtbd-2026-07-21-r2-lula-zema', round: 2, scenario: 'Lula × Romeu Zema', matchup: 'lula-zema',
      date: '2026-07-21', publication: '21/07/2026', institute: 'Real Time Big Data', scope: 'Brasil',
      field: '18 a 20/07/2026', sample: '2.000', margin: '±2 p.p.', registry: '',
      source: 'https://www.poder360.com.br/poder-eleicoes-2026/lula-tem-45-contra-42-de-flavio-no-2o-turno-diz-pesquisa/',
      values: { lula: 44, zema: 38 }
    },
    {
      id: 'rtbd-2026-07-21-r2-lula-renan', round: 2, scenario: 'Lula × Renan Santos', matchup: 'lula-renan',
      date: '2026-07-21', publication: '21/07/2026', institute: 'Real Time Big Data', scope: 'Brasil',
      field: '18 a 20/07/2026', sample: '2.000', margin: '±2 p.p.', registry: '',
      source: 'https://www.poder360.com.br/poder-eleicoes-2026/lula-tem-45-contra-42-de-flavio-no-2o-turno-diz-pesquisa/',
      values: { lula: 44, renan: 35 }
    },
    {
      id: 'gerp-2026-07-22-r2-lula-flavio', round: 2, scenario: 'Lula × Flávio Bolsonaro', matchup: 'lula-flavio',
      date: '2026-07-22', publication: '22/07/2026', institute: 'Gerp', scope: 'Brasil',
      field: '15 a 17/07/2026', sample: '2.000', margin: '±2,19 p.p.', registry: '',
      source: 'https://www.poder360.com.br/poder-eleicoes-2026/flavio-e-lula-tem-empate-tecnico-no-2o-turno-diz-pesquisa/',
      values: { lula: 45, flavio: 46 }
    },
    {
      id: 'datafolha-2026-07-24-r1', round: 1, scenario: 'Cenário principal', matchup: null,
      date: '2026-07-24', publication: '24/07/2026', institute: 'Datafolha', scope: 'Brasil',
      field: '22 a 23/07/2026', sample: '2.004', margin: '±2 p.p.', registry: 'BR-01166/2026',
      source: 'https://www.reuters.com/world/americas/lula-leads-flavio-bolsonaro-brazil-election-poll-2026-07-24/',
      values: { lula: 40, flavio: 32, renan: 3, caiado: 4, zema: 3, cury: 2, daciolo: 1 }
    },
    {
      id: 'datafolha-2026-07-24-r2-lula-flavio', round: 2, scenario: 'Lula × Flávio Bolsonaro', matchup: 'lula-flavio',
      date: '2026-07-24', publication: '24/07/2026', institute: 'Datafolha', scope: 'Brasil',
      field: '22 a 23/07/2026', sample: '2.004', margin: '±2 p.p.', registry: 'BR-01166/2026',
      source: 'https://www.poder360.com.br/poder-eleicoes-2026/datafolha-lula-tem-48-e-flavio-43-em-2o-turno/',
      values: { lula: 48, flavio: 43 }
    },
    {
      id: 'nexus-2026-07-27-r1', round: 1, scenario: 'Cenário principal', matchup: null,
      date: '2026-07-27', publication: '27/07/2026', institute: 'BTG/Nexus', scope: 'Brasil',
      field: '24 a 26/07/2026', sample: '2.004', margin: '±2 p.p.', registry: 'BR-01489/2026',
      source: 'https://www.reuters.com/world/americas/brazils-lula-holds-lead-over-bolsonaro-btgnexus-election-poll-2026-07-27/',
      values: { lula: 42, flavio: 33, renan: 5, caiado: 6, zema: 3, cury: 2, daciolo: 1 }
    },
    {
      id: 'nexus-2026-07-27-r2-lula-flavio', round: 2, scenario: 'Lula × Flávio Bolsonaro', matchup: 'lula-flavio',
      date: '2026-07-27', publication: '27/07/2026', institute: 'BTG/Nexus', scope: 'Brasil',
      field: '24 a 26/07/2026', sample: '2.004', margin: '±2 p.p.', registry: 'BR-01489/2026',
      source: 'https://www.poder360.com.br/poder-eleicoes-2026/lula-tem-47-contra-43-de-flavio-no-2o-turno-diz-btg-nexus/',
      values: { lula: 47, flavio: 43 }
    }
  ]
};