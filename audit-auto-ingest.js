(() => {
  'use strict';

  const AUDIT = window.ELECTION_AUDIT_DATA;
  const BASE = window.ELECTION_DATA;
  if (!AUDIT || !Array.isArray(AUDIT.polls) || !Array.isArray(BASE?.polls)) return;

  const normalize = value => String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  const numericSample = value => {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    const digits = String(value || '').replace(/[^0-9]/g, '');
    return digits ? Number(digits) : null;
  };

  const formatPublication = poll => {
    if (poll.publication) return poll.publication;
    const match = String(poll.date || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return match ? `${match[3]}/${match[2]}/${match[1]}` : String(poll.date || 'Não informado');
  };

  const sortKey = value => {
    const match = String(value || '').match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    return match ? `${match[3]}-${match[2]}-${match[1]}` : String(value || '');
  };

  const existingRegistry = new Set(AUDIT.polls.map(poll => String(poll.registry || '').trim()).filter(value => value && !/consultar/i.test(value)));
  const existingNatural = new Set(AUDIT.polls.map(poll => `${normalize(poll.institute)}|${formatPublication(poll)}`));

  const automatic = BASE.polls.flatMap((poll, index) => {
    const publication = formatPublication(poll);
    const registry = String(poll.registry || 'Registro ainda não vinculado').trim();
    const naturalKey = `${normalize(poll.institute)}|${publication}`;
    if ((registry && !/consultar|não vinculado/i.test(registry) && existingRegistry.has(registry)) || existingNatural.has(naturalKey)) return [];

    const publishedValues = Object.entries(poll.values || {})
      .filter(([, value]) => Number.isFinite(Number(value)))
      .map(([label, value]) => [label, Number(value), 'candidate']);
    if (!publishedValues.length) return [];

    const publishedSum = publishedValues.reduce((total, item) => total + item[1], 0);
    const difference = Number((100 - publishedSum).toFixed(1));
    const values = [...publishedValues];
    let note = 'Registro importado automaticamente da base que alimenta o gráfico principal. Somente os percentuais presentes nessa base são tratados como publicados.';

    if (difference > 0.05) {
      values.push(['Parcela não discriminada na fonte usada pelo gráfico', difference, 'unknown']);
      note += ' A diferença até 100% permanece visível e não foi distribuída artificialmente entre branco, nulo, indecisos ou outros nomes.';
    } else if (difference < -0.05) {
      note += ` A soma supera 100% em ${Math.abs(difference).toLocaleString('pt-BR', {maximumFractionDigits:1})} ponto(s), possivelmente por arredondamento ou sobreposição; requer conferência do relatório integral.`;
    }

    const sample = numericSample(poll.sample);
    const registryKnown = registry && !/consultar|não vinculado/i.test(registry);
    const marginKnown = poll.margin && !/não informad/i.test(String(poll.margin));

    return [{
      id: `auto-${normalize(poll.institute)}-${normalize(poll.date || publication)}-${index}`,
      institute: poll.institute || 'Instituto não identificado',
      registry,
      publication,
      field: poll.field || 'Período de campo não informado',
      sample: sample || 0,
      sampleDisplay: sample ? sample.toLocaleString('pt-BR') : 'Não informado',
      margin: marginKnown ? poll.margin : 'Não informada',
      confidence: 'Não informado na fonte usada pelo gráfico',
      method: 'Não informado na fonte usada pelo gráfico; conferir questionário, relatório e PesqEle.',
      primaryUrl: poll.source || 'https://dadosabertos.tse.jus.br/dataset/pesquisas-eleitorais-2026',
      auditOrigin: 'Importação automática — publicação parcial',
      evidence: poll.source ? [{label:'Publicação usada pelo gráfico principal', url:poll.source, kind:'secundária / descoberta'}] : [],
      scenarios:[{
        id:`auto-${index}-cenario-publicado`,
        title:'Cenário publicado no gráfico principal',
        type:'Cenário parcial — turno não confirmado no documento primário',
        question:'Pergunta integral não localizada nesta importação automática.',
        values,
        note
      }],
      crossTabs:[],
      completeness:{
        registry:registryKnown?'ok':'pending', sample:sample?'ok':'missing', margin:marginKnown?'ok':'missing', confidence:'missing',
        questionnaire:'pending', fullReport:'pending', contractor:'pending', payer:'pending', method:'missing', firstRound:'partial',
        secondRound:'missing', residuals:difference>0.05?'partial':'missing', rejection:'missing', gender:'missing', age:'missing',
        education:'missing', income:'missing', region:'missing', religion:'missing', municipalityDetail:'pending'
      }
    }];
  });

  AUDIT.polls = [...AUDIT.polls, ...automatic].sort((a, b) => sortKey(b.publication).localeCompare(sortKey(a.publication)));
  AUDIT.statistics = {
    ...(AUDIT.statistics || {}),
    curatedPolls: AUDIT.polls.length - automatic.length,
    automaticPolls: automatic.length,
    totalPolls: AUDIT.polls.length,
    totalScenarios: AUDIT.polls.reduce((total, poll) => total + (poll.scenarios?.length || 0), 0),
    sourceCount: AUDIT.sources?.length || 0
  };
})();