window.ELECTION_AUDIT_DATA = {
  updatedAt: '2026-07-28T15:55:00-03:00',
  policy: {
    title: 'Auditoria integral das pesquisas eleitorais',
    discovery: 'Qualquer veículo, instituto, portal regional, blog jornalístico ou fonte pública pode iniciar uma verificação.',
    evidence: 'Percentuais só são tratados como confirmados quando vinculados ao relatório do instituto, ao PesqEle/TSE ou a documento primário equivalente.',
    missing: 'Campos ausentes permanecem visíveis como “não divulgado” ou “não localizado”; nunca são preenchidos por estimativa.',
    rounding: 'Diferenças para 100% são identificadas como arredondamento, não resposta ou parcela não discriminada, conforme a fonte.'
  },
  sources: [
    {name:'TSE / PesqEle',type:'Oficial',scope:'Brasil',tier:'primária',url:'https://dadosabertos.tse.jus.br/dataset/pesquisas-eleitorais-2026'},
    {name:'Datafolha',type:'Instituto',scope:'Nacional e local',tier:'primária',url:'https://datafolha.folha.uol.com.br/'},
    {name:'Quaest',type:'Instituto',scope:'Nacional e local',tier:'primária',url:'https://quaest.com.br/'},
    {name:'AtlasIntel',type:'Instituto',scope:'Nacional e local',tier:'primária',url:'https://atlasintel.org/'},
    {name:'Paraná Pesquisas',type:'Instituto',scope:'Nacional e local',tier:'primária',url:'https://paranapesquisas.com.br/'},
    {name:'PoderData',type:'Instituto e mídia',scope:'Nacional',tier:'primária',url:'https://www.poder360.com.br/poderdata/'},
    {name:'Nexus',type:'Instituto',scope:'Nacional',tier:'primária',url:'https://www.nexus.fsb.com.br/estudos-divulgados/'},
    {name:'Real Time Big Data',type:'Instituto',scope:'Nacional e local',tier:'primária',url:'https://realtimebigdata.com.br/'},
    {name:'Futura Inteligência',type:'Instituto',scope:'Nacional e local',tier:'primária',url:'https://futurapesquisa.com.br/'},
    {name:'Ipespe',type:'Instituto',scope:'Nacional e local',tier:'primária',url:'https://ipespe.org.br/'},
    {name:'GERP',type:'Instituto',scope:'Nacional e local',tier:'primária',url:'https://www.gerp.com.br/'},
    {name:'Indexa Pesquisas',type:'Instituto',scope:'Nacional e local',tier:'primária',url:'https://indexapesquisas.com.br/'},
    {name:'Ideia',type:'Instituto',scope:'Nacional e local',tier:'primária',url:'https://ideia.bigdata.com/'},
    {name:'MDA Pesquisa',type:'Instituto',scope:'Nacional',tier:'primária',url:'https://mda-pesquisa.com.br/'},
    {name:'Vox Populi',type:'Instituto',scope:'Nacional e local',tier:'primária',url:'https://voxpopuli.com.br/'},
    {name:'Reuters',type:'Agência internacional',scope:'Brasil e exterior',tier:'secundária',url:'https://www.reuters.com/world/americas/'},
    {name:'Agência Brasil',type:'Agência pública',scope:'Nacional',tier:'secundária',url:'https://agenciabrasil.ebc.com.br/'},
    {name:'CNN Brasil',type:'Mídia nacional',scope:'Nacional e local',tier:'secundária',url:'https://www.cnnbrasil.com.br/eleicoes/'},
    {name:'Folha de S.Paulo',type:'Mídia nacional',scope:'Nacional e local',tier:'secundária',url:'https://www1.folha.uol.com.br/poder/'},
    {name:'Estadão',type:'Mídia nacional',scope:'Nacional e local',tier:'secundária',url:'https://www.estadao.com.br/politica/'},
    {name:'O Globo',type:'Mídia nacional',scope:'Nacional e local',tier:'secundária',url:'https://oglobo.globo.com/politica/'},
    {name:'Valor Econômico',type:'Mídia nacional',scope:'Nacional',tier:'secundária',url:'https://valor.globo.com/politica/'},
    {name:'UOL',type:'Mídia nacional',scope:'Nacional e local',tier:'secundária',url:'https://noticias.uol.com.br/politica/'},
    {name:'Poder360',type:'Mídia nacional',scope:'Nacional',tier:'secundária',url:'https://www.poder360.com.br/'},
    {name:'R7',type:'Mídia nacional',scope:'Nacional e local',tier:'secundária',url:'https://noticias.r7.com/eleicoes/2026/'},
    {name:'Metrópoles',type:'Mídia nacional',scope:'Nacional e DF',tier:'secundária',url:'https://www.metropoles.com/brasil/politica-brasil'},
    {name:'Band',type:'Mídia nacional',scope:'Nacional e local',tier:'secundária',url:'https://www.band.com.br/politica/eleicoes/2026'},
    {name:'SBT News',type:'Mídia nacional',scope:'Nacional',tier:'secundária',url:'https://sbtnews.sbt.com.br/categoria/politica'},
    {name:'Jovem Pan',type:'Mídia nacional',scope:'Nacional',tier:'secundária',url:'https://jovempan.com.br/noticias/politica'},
    {name:'Exame',type:'Mídia nacional',scope:'Nacional',tier:'secundária',url:'https://exame.com/brasil/'},
    {name:'InfoMoney',type:'Mídia nacional',scope:'Nacional',tier:'secundária',url:'https://www.infomoney.com.br/politica/'},
    {name:'Veja',type:'Mídia nacional',scope:'Nacional',tier:'secundária',url:'https://veja.abril.com.br/politica/'},
    {name:'CartaCapital',type:'Mídia nacional',scope:'Nacional',tier:'secundária',url:'https://www.cartacapital.com.br/politica/'},
    {name:'Brasil de Fato',type:'Mídia nacional',scope:'Nacional e local',tier:'secundária',url:'https://www.brasildefato.com.br/politica/'},
    {name:'Gazeta do Povo',type:'Mídia nacional e regional',scope:'Paraná e Brasil',tier:'secundária',url:'https://www.gazetadopovo.com.br/republica/'},
    {name:'JOTA',type:'Mídia especializada',scope:'Nacional',tier:'secundária',url:'https://www.jota.info/eleicoes/'},
    {name:'Nexo Jornal',type:'Mídia nacional',scope:'Nacional',tier:'secundária',url:'https://www.nexojornal.com.br/politica/'},
    {name:'O Tempo',type:'Mídia regional',scope:'Minas Gerais',tier:'secundária',url:'https://www.otempo.com.br/politica'},
    {name:'Estado de Minas',type:'Mídia regional',scope:'Minas Gerais',tier:'secundária',url:'https://www.em.com.br/politica/'},
    {name:'GZH',type:'Mídia regional',scope:'Rio Grande do Sul',tier:'secundária',url:'https://gauchazh.clicrbs.com.br/politica/'},
    {name:'Correio do Povo',type:'Mídia regional',scope:'Rio Grande do Sul',tier:'secundária',url:'https://www.correiodopovo.com.br/not%C3%ADcias/pol%C3%ADtica'},
    {name:'NSC Total',type:'Mídia regional',scope:'Santa Catarina',tier:'secundária',url:'https://www.nsctotal.com.br/noticias/politica'},
    {name:'Diário do Nordeste',type:'Mídia regional',scope:'Ceará',tier:'secundária',url:'https://diariodonordeste.verdesmares.com.br/pontopoder'},
    {name:'O Povo',type:'Mídia regional',scope:'Ceará',tier:'secundária',url:'https://www.opovo.com.br/noticias/politica/'},
    {name:'A Crítica',type:'Mídia regional',scope:'Amazonas',tier:'secundária',url:'https://www.acritica.com/politica'},
    {name:'O Liberal',type:'Mídia regional',scope:'Pará',tier:'secundária',url:'https://www.oliberal.com/politica'},
    {name:'Correio 24 Horas',type:'Mídia regional',scope:'Bahia',tier:'secundária',url:'https://www.correio24horas.com.br/minha-bahia/politica/'},
    {name:'A Gazeta',type:'Mídia regional',scope:'Espírito Santo',tier:'secundária',url:'https://www.agazeta.com.br/es/politica/'},
    {name:'Tribuna do Norte',type:'Mídia regional',scope:'Rio Grande do Norte',tier:'secundária',url:'https://tribunadonorte.com.br/politica/'},
    {name:'Jornal do Commercio',type:'Mídia regional',scope:'Pernambuco',tier:'secundária',url:'https://jc.ne10.uol.com.br/politica/'},
    {name:'Jornal Opção',type:'Mídia regional',scope:'Goiás',tier:'secundária',url:'https://www.jornalopcao.com.br/politica/'},
    {name:'Mais Goiás',type:'Mídia regional',scope:'Goiás',tier:'secundária',url:'https://www.maisgoias.com.br/politica/'},
    {name:'Campo Grande News',type:'Mídia regional',scope:'Mato Grosso do Sul',tier:'secundária',url:'https://www.campograndenews.com.br/politica'},
    {name:'Midiamax',type:'Mídia regional',scope:'Mato Grosso do Sul',tier:'secundária',url:'https://midiamax.uol.com.br/politica/'},
    {name:'Gazeta Digital',type:'Mídia regional',scope:'Mato Grosso',tier:'secundária',url:'https://www.gazetadigital.com.br/editorias/politica-de-mt/'},
    {name:'Diário de Pernambuco',type:'Mídia regional',scope:'Pernambuco',tier:'secundária',url:'https://www.diariodepernambuco.com.br/politica/'},
    {name:'Portal do Holanda',type:'Mídia regional',scope:'Amazonas',tier:'secundária',url:'https://www.portaldoholanda.com.br/politica'},
    {name:'Brasil 247',type:'Mídia independente',scope:'Nacional',tier:'secundária',url:'https://www.brasil247.com/poder'},
    {name:'O Antagonista',type:'Mídia independente',scope:'Nacional',tier:'secundária',url:'https://oantagonista.com.br/brasil/'},
    {name:'Congresso em Foco',type:'Mídia especializada',scope:'Nacional',tier:'secundária',url:'https://congressoemfoco.uol.com.br/'},
    {name:'Aos Fatos',type:'Checagem',scope:'Nacional',tier:'verificação',url:'https://www.aosfatos.org/'},
    {name:'Agência Lupa',type:'Checagem',scope:'Nacional',tier:'verificação',url:'https://lupa.uol.com.br/'},
    {name:'Projeto Comprova',type:'Checagem colaborativa',scope:'Nacional',tier:'verificação',url:'https://projetocomprova.com.br/'}
  ],
  polls: [
    {
      id:'datafolha-2026-07-24',
      institute:'Datafolha', registry:'BR-01166/2026', publication:'24/07/2026', field:'22 a 24/07/2026', sample:2004, margin:'±2 p.p.', confidence:'95%', method:'Não informado nas matérias abertas usadas nesta etapa; conferir relatório e PesqEle.',
      primaryUrl:'https://datafolha.folha.uol.com.br/',
      evidence:[
        {label:'CNN Brasil — primeiro turno',url:'https://www.cnnbrasil.com.br/eleicoes/datafolha-lula-tem-40-das-intencoes-de-voto-no-1o-turno-flavio-32/',kind:'secundária'},
        {label:'CNN Brasil — segundo turno',url:'https://www.cnnbrasil.com.br/eleicoes/datafolha-lula-tem-48-das-intencoes-de-voto-no-2o-turno-flavio-43/',kind:'secundária'},
        {label:'Band — cenário e votos válidos',url:'https://www.band.com.br/politica/eleicoes/2026/datafolha-lula-tem-40-contra-32-de-flavio-bolsonaro-no-primeiro-turno-202607242027',kind:'secundária'}
      ],
      scenarios:[
        {id:'df-1t',title:'1º turno — estimulado, 12 nomes',type:'Primeiro turno',question:'Texto integral da pergunta não localizado na matéria aberta.',values:[
          ['Lula',40,'candidate'],['Flávio Bolsonaro',32,'candidate'],['Ronaldo Caiado',4,'candidate'],['Romeu Zema',3,'candidate'],['Renan Santos',3,'candidate'],['Augusto Cury',2,'candidate'],['Samara Martins',1,'candidate'],['Cabo Daciolo',1,'candidate'],['Rui Costa Pimenta',1,'candidate'],['Heitor Dias',0,'candidate'],['Edmilson Costa',0,'candidate'],['Leonardo Avalanche',0,'candidate'],['Branco, nulo ou nenhum',8,'residual'],['Indecisos / não sabe',3,'residual'] ], note:'A soma publicada resulta em 98% por arredondamento.'},
        {id:'df-2t-flavio',title:'2º turno — Lula × Flávio Bolsonaro',type:'Segundo turno',values:[['Lula',48,'candidate'],['Flávio Bolsonaro',43,'candidate'],['Branco, nulo ou nenhum',9,'residual'],['Indecisos / não sabe',1,'residual']],note:'A soma publicada resulta em 101% por arredondamento.'},
        {id:'df-2t-caiado',title:'2º turno — Lula × Ronaldo Caiado',type:'Segundo turno',values:[['Lula',47,'candidate'],['Ronaldo Caiado',40,'candidate'],['Branco, nulo ou nenhum',11,'residual'],['Indecisos / não sabe',2,'residual']]},
        {id:'df-2t-zema',title:'2º turno — Lula × Romeu Zema',type:'Segundo turno',values:[['Lula',48,'candidate'],['Romeu Zema',40,'candidate'],['Branco, nulo ou nenhum',10,'residual'],['Indecisos / não sabe',2,'residual']]},
        {id:'df-rejeicao',title:'Rejeição — nomes com percentual divulgado',type:'Rejeição',values:[['Flávio Bolsonaro',48,'negative'],['Lula',46,'negative']],note:'Os demais foram descritos apenas como inferiores a 13%; sem números individuais na fonte consultada.'},
        {id:'df-mulheres-2t',title:'Mulheres — 2º turno Lula × Flávio',type:'Recorte demográfico',values:[['Lula',50,'candidate'],['Flávio Bolsonaro',40,'candidate'],['Demais respostas não discriminadas',10,'unknown']],note:'Mulheres representam 53% da amostra segundo a matéria consultada.'}
      ],
      crossTabs:[
        {segment:'Mulheres',share:53,metric:'2º turno',published:{Lula:50,'Flávio Bolsonaro':40},status:'parcial'},
        {segment:'Nordeste',share:25,metric:'1º turno',published:{Lula:55},status:'parcial'},
        {segment:'Até ensino fundamental',share:30,metric:'1º turno',published:{Lula:51},status:'parcial'},
        {segment:'Renda mais baixa',share:50,metric:'1º turno',published:{Lula:47},status:'parcial'},
        {segment:'Católicos',share:49,metric:'1º turno',published:{Lula:46},status:'parcial'},
        {segment:'Renda de 2 a 5 salários mínimos',share:34,metric:'1º turno',published:{'Flávio Bolsonaro':38},status:'parcial'},
        {segment:'Sul',share:15,metric:'1º turno',published:{'Flávio Bolsonaro':41},status:'parcial'},
        {segment:'Evangélicos',share:25,metric:'1º turno',published:{'Flávio Bolsonaro':47},status:'parcial'}
      ],
      completeness:{registry:'ok',sample:'ok',margin:'ok',confidence:'ok',questionnaire:'pending',fullReport:'pending',contractor:'pending',payer:'pending',method:'pending',firstRound:'ok',secondRound:'ok',residuals:'ok',rejection:'partial',gender:'partial',age:'missing',education:'partial',income:'partial',region:'partial',religion:'partial',municipalityDetail:'pending'}
    },
    {
      id:'nexus-2026-07-27',
      institute:'Nexus / BTG Pactual', registry:'BR-01489/2026', publication:'27/07/2026', field:'24 a 26/07/2026', sample:2004, margin:'±2 p.p.', confidence:'95%', method:'Entrevistas por telefone em todas as regiões do país.',
      primaryUrl:'https://www.nexus.fsb.com.br/estudos-divulgados/pesquisa-btg-nexus-de-intencao-de-votos-para-presidente-do-brasil-27-de-julho-de-2026/',
      evidence:[
        {label:'Nexus — resumo primário',url:'https://www.nexus.fsb.com.br/estudos-divulgados/pesquisa-btg-nexus-de-intencao-de-votos-para-presidente-do-brasil-27-de-julho-de-2026/',kind:'primária'},
        {label:'Folha — cenários e rejeição',url:'https://www1.folha.uol.com.br/poder/2026/07/btgnexus-lula-tem-47-e-flavio-bolsonaro-43-em-eventual-segundo-turno.shtml',kind:'secundária'},
        {label:'Reuters — confirmação do levantamento',url:'https://www.reuters.com/world/americas/brazils-lula-holds-lead-over-bolsonaro-btgnexus-election-poll-2026-07-27/',kind:'secundária'}
      ],
      scenarios:[
        {id:'nx-1t',title:'1º turno — cenário principal estimulado',type:'Primeiro turno',values:[['Lula',42,'candidate'],['Flávio Bolsonaro',33,'candidate'],['Ronaldo Caiado',6,'candidate'],['Renan Santos',5,'candidate'],['Romeu Zema',3,'candidate'],['Augusto Cury',2,'candidate'],['Cabo Daciolo',1,'candidate'],['Parcela não discriminada no resumo público',8,'unknown']],note:'Os 8% são a diferença matemática até 100%; o resumo público não separa branco, nulo, nenhum e não sabe.'},
        {id:'nx-2t-flavio',title:'2º turno — Lula × Flávio Bolsonaro',type:'Segundo turno',values:[['Lula',47,'candidate'],['Flávio Bolsonaro',43,'candidate'],['Parcela não discriminada no resumo público',10,'unknown']]},
        {id:'nx-2t-zema',title:'2º turno — Lula × Romeu Zema',type:'Segundo turno',values:[['Lula',46,'candidate'],['Romeu Zema',42,'candidate'],['Parcela não discriminada no resumo público',12,'unknown']]},
        {id:'nx-2t-renan',title:'2º turno — Lula × Renan Santos',type:'Segundo turno',values:[['Lula',47,'candidate'],['Renan Santos',39,'candidate'],['Parcela não discriminada no resumo público',14,'unknown']]},
        {id:'nx-2t-caiado',title:'2º turno — Lula × Ronaldo Caiado',type:'Segundo turno',values:[['Lula',45,'candidate'],['Ronaldo Caiado',43,'candidate'],['Parcela não discriminada no resumo público',12,'unknown']]},
        {id:'nx-rejeicao',title:'Rejeição aos candidatos',type:'Rejeição',values:[['Flávio Bolsonaro',50,'negative'],['Lula',48,'negative'],['Cabo Daciolo',38,'negative'],['Romeu Zema',32,'negative'],['Ronaldo Caiado',29,'negative'],['Renan Santos',27,'negative'],['Augusto Cury',26,'negative']]},
        {id:'nx-decisao',title:'Grau de decisão do voto',type:'Comportamento',values:[['Decisão tomada',73,'positive'],['Ainda pode mudar',25,'neutral'],['Não soube responder',1,'residual'],['Diferença de arredondamento',1,'unknown']]},
        {id:'nx-governo',title:'Avaliação do governo Lula',type:'Avaliação',values:[['Negativa',43,'negative'],['Positiva',36,'positive'],['Regular',20,'neutral'],['Diferença de arredondamento',1,'unknown']]}
      ],
      crossTabs:[
        {segment:'Lulistas convictos',metric:'Decisão tomada',published:{'Decisão tomada':83},status:'parcial'},
        {segment:'Bolsonaristas convictos',metric:'Decisão tomada',published:{'Decisão tomada':82},status:'parcial'}
      ],
      completeness:{registry:'ok',sample:'ok',margin:'ok',confidence:'ok',questionnaire:'pending',fullReport:'gated',contractor:'ok',payer:'pending',method:'ok',firstRound:'ok',secondRound:'ok',residuals:'partial',rejection:'ok',gender:'missing',age:'missing',education:'missing',income:'missing',region:'partial',religion:'missing',municipalityDetail:'pending'}
    },
    {
      id:'poderdata-2026-07-16',
      institute:'PoderData / Aya', registry:'BR-00059/2026', publication:'16/07/2026', field:'12 a 15/07/2026', sample:2400, margin:'±2 p.p.', confidence:'95%', method:'URA por telefone fixo e celular; 685 municípios nas 27 UFs.',
      primaryUrl:'https://www.poder360.com.br/poderdata/lula-tem-40-e-flavio-34-no-1o-turno-diz-poderdata-aya/',
      evidence:[
        {label:'PoderData — primeiro turno e metodologia',url:'https://www.poder360.com.br/poderdata/lula-tem-40-e-flavio-34-no-1o-turno-diz-poderdata-aya/',kind:'primária'},
        {label:'PoderData — segundo turno',url:'https://www.poder360.com.br/poderdata/lula-tem-45-contra-43-de-flavio-no-2o-turno-diz-poderdata-aya/',kind:'primária'},
        {label:'PoderData — rejeição',url:'https://www.poder360.com.br/poder-eleicoes-2026/lula-e-flavio-tem-48-de-rejeicao-cada-um-diz-poderdata-aya/',kind:'primária'}
      ],
      scenarios:[
        {id:'pd-1t',title:'1º turno — cenário estimulado',type:'Primeiro turno',values:[['Lula',40,'candidate'],['Flávio Bolsonaro',34,'candidate'],['Renan Santos',6,'candidate'],['Ronaldo Caiado',4,'candidate'],['Romeu Zema',4,'candidate'],['Augusto Cury',3,'candidate'],['Parcela não discriminada no texto aberto',9,'unknown']],note:'O relatório completo em PDF deve ser usado para separar respostas residuais e demais nomes.'},
        {id:'pd-2t-flavio',title:'2º turno — Lula × Flávio Bolsonaro',type:'Segundo turno',values:[['Lula',45,'candidate'],['Flávio Bolsonaro',43,'candidate'],['Parcela não discriminada no texto aberto',12,'unknown']]},
        {id:'pd-2t-caiado',title:'2º turno — Lula × Ronaldo Caiado',type:'Segundo turno',values:[['Lula',44,'candidate'],['Ronaldo Caiado',43,'candidate'],['Parcela não discriminada no texto aberto',13,'unknown']]},
        {id:'pd-rejeicao',title:'Rejeição — Lula e Flávio',type:'Rejeição',values:[['Lula',48,'negative'],['Flávio Bolsonaro',48,'negative']]},
        {id:'pd-mulheres-1t',title:'Mulheres — 1º turno',type:'Recorte demográfico',values:[['Lula',40,'candidate'],['Flávio Bolsonaro',30,'candidate'],['Demais candidatos e respostas',30,'unknown']]},
        {id:'pd-mulheres-2t',title:'Mulheres — 2º turno',type:'Recorte demográfico',values:[['Lula',48,'candidate'],['Flávio Bolsonaro',39,'candidate'],['Demais respostas',13,'unknown']]},
        {id:'pd-homens-2t',title:'Homens — 2º turno',type:'Recorte demográfico',values:[['Flávio Bolsonaro',48,'candidate'],['Lula',43,'candidate'],['Demais respostas',9,'unknown']]},
        {id:'pd-motivacao',title:'Motivação principal do voto',type:'Comportamento',values:[['Propostas do candidato',61,'positive'],['Rejeição aos demais',17,'negative'],['Outras motivações / não resposta',22,'unknown']]}
      ],
      crossTabs:[
        {segment:'Mulheres',metric:'1º turno',published:{Lula:40,'Flávio Bolsonaro':30},status:'parcial'},
        {segment:'Mulheres',metric:'2º turno',published:{Lula:48,'Flávio Bolsonaro':39},status:'parcial'},
        {segment:'Homens',metric:'2º turno',published:{Lula:43,'Flávio Bolsonaro':48},status:'parcial'},
        {segment:'Nordeste',metric:'2º turno',published:{Lula:50},status:'parcial'},
        {segment:'Até ensino fundamental',metric:'2º turno',published:{Lula:45},status:'parcial'},
        {segment:'Ensino superior',metric:'2º turno',published:{Lula:48},status:'parcial'},
        {segment:'Renda até 2 salários mínimos',metric:'2º turno',published:{Lula:47},status:'parcial'}
      ],
      completeness:{registry:'ok',sample:'ok',margin:'ok',confidence:'ok',questionnaire:'pending',fullReport:'ok',contractor:'ok',payer:'partial',method:'ok',firstRound:'ok',secondRound:'partial',residuals:'partial',rejection:'partial',gender:'partial',age:'pending',education:'partial',income:'partial',region:'partial',religion:'pending',municipalityDetail:'pending'}
    }
  ]
};
