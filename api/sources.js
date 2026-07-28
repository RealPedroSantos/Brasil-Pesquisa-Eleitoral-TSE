const TRUSTED_SOURCES = [
  {
    id:'tse', name:'TSE / PesqEle', kind:'Fonte oficial',
    coverage:['Nacional','Estadual','Municipal','Bairro'],
    url:'https://dadosabertos.tse.jus.br/dataset/pesquisas-eleitorais-2026',
    description:'Registro oficial, questionários, contratantes e detalhamento de município e bairro.',
    fetchUrls:[]
  },
  {
    id:'atlas', name:'AtlasIntel', kind:'Instituto — fonte primária',
    coverage:['Nacional','Estadual','Municipal'],
    url:'https://atlasintel.org/polls/exclusive-polls',
    description:'Relatórios públicos nacionais, estaduais e levantamentos locais contratados por veículos regionais.',
    fetchUrls:['https://atlasintel.org/polls/exclusive-polls']
  },
  {
    id:'quaest', name:'Quaest', kind:'Instituto — fonte primária',
    coverage:['Nacional','Estadual','Municipal'],
    url:'https://quaest.com.br/categoria/analises-de-pesquisas/',
    description:'Análises e relatórios eleitorais nacionais, estaduais e municipais.',
    fetchUrls:['https://quaest.com.br/feed/','https://quaest.com.br/categoria/analises-de-pesquisas/']
  },
  {
    id:'parana', name:'Paraná Pesquisas', kind:'Instituto — fonte primária',
    coverage:['Nacional','Estadual','Municipal'],
    url:'https://paranapesquisas.com.br/pesquisas/',
    description:'Arquivo público com levantamentos registrados, incluindo estados e municípios.',
    fetchUrls:['https://paranapesquisas.com.br/feed/','https://paranapesquisas.com.br/pesquisas/','https://paranapesquisas.com.br/pesquisar-no-site/']
  },
  {
    id:'gerp', name:'GERP', kind:'Instituto — fonte primária',
    coverage:['Nacional','Estadual','Municipal'],
    url:'https://www.gerp.com.br/eleitoral.html',
    description:'Pesquisas eleitorais e políticas com publicações nacionais e regionais.',
    fetchUrls:['https://www.gerp.com.br/eleitoral.html','https://www.gerp.com.br/relatorios.html']
  },
  {
    id:'datafolha', name:'Datafolha', kind:'Instituto — fonte primária',
    coverage:['Nacional','Estadual','Municipal'],
    url:'https://www1.folha.uol.com.br/folha-topicos/datafolha/',
    description:'Resultados e cobertura dos levantamentos do Datafolha.',
    fetchUrls:['https://www1.folha.uol.com.br/folha-topicos/datafolha/']
  }
];

const IGNORE = /protegido:|anuncie|publicidade|login|contato|privacidade|cookie|facebook|instagram|linkedin|youtube|whatsapp|opinião|podcast|newsletter|assine|moraes|kassio/i;
const ELECTION_TERMS = /pesquisa|eleitoral|eleiç|intenção de voto|intenções de voto|prefeit|governador|presidente|senador|disputa|cenário/i;

function decodeEntities(value) {
  return value.replace(/&nbsp;/gi,' ').replace(/&amp;/gi,'&').replace(/&quot;/gi,'"')
    .replace(/&#39;|&apos;/gi,"'").replace(/&lt;/gi,'<').replace(/&gt;/gi,'>')
    .replace(/&#(\d+);/g,(_,code)=>String.fromCharCode(Number(code)));
}

function stripHtml(value) {
  return decodeEntities(value.replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' '))
    .replace(/\s+/g,' ').trim();
}

function absoluteUrl(base, href) {
  try { return new URL(href, base).toString(); } catch { return null; }
}

function classify(title) {
  const text = title.toLowerCase();
  if (/bairro|distrito|zona da cidade|região administrativa/.test(text)) return 'Bairro';
  if (/município|municipio|prefeit|cidade|capital|curitiba|recife|salvador|fortaleza|manaus|belém|belem|goiânia|goiania|itaboraí|itaborai|niterói|niteroi/.test(text)) return 'Municipal';
  if (/estado|governador|governo de |rio de janeiro|são paulo|sao paulo|minas gerais|bahia|paraná|parana|pernambuco|ceará|ceara|tocantins|piauí|piaui|goiás|goias|amazonas|maranhão|maranhao|santa catarina|rio grande do norte|rio grande do sul|espírito santo|espirito santo/.test(text)) return 'Estadual';
  return 'Nacional';
}

function isRelevant(title, sourceId) {
  if (title.length < 20 || title.length > 230 || IGNORE.test(title) || !ELECTION_TERMS.test(title)) return false;
  if (sourceId === 'datafolha') return /datafolha/i.test(title) && /eleiç|voto|presidente|governador|prefeit|disputa/i.test(title);
  if (sourceId === 'quaest') return /quaest|pesquisa genial/i.test(title) && /eleiç|cenário|disputa|governo|voto/i.test(title);
  if (sourceId === 'parana') return /pesquisa|eleitoral|situação eleitoral/i.test(title);
  return true;
}

function makeItem(title, url, source) {
  return { title, url, source:source.name, sourceId:source.id, scope:classify(title), verifiedPrimarySource:true };
}

function extractHtmlLinks(html, source, baseUrl) {
  const items=[]; const seen=new Set();
  const regex=/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match=regex.exec(html)) && items.length<12) {
    const title=stripHtml(match[2]);
    if (!isRelevant(title,source.id)) continue;
    const url=absoluteUrl(baseUrl,match[1]);
    if (!url || seen.has(url) || !/^https?:/.test(url)) continue;
    seen.add(url); items.push(makeItem(title,url,source));
  }
  return items;
}

function extractRss(xml, source) {
  const items=[]; const seen=new Set();
  const regex=/<item\b[\s\S]*?<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>[\s\S]*?<link>([\s\S]*?)<\/link>[\s\S]*?<\/item>/gi;
  let match;
  while ((match=regex.exec(xml)) && items.length<12) {
    const title=stripHtml(match[1]);
    const url=stripHtml(match[2]);
    if (!isRelevant(title,source.id) || !/^https?:/.test(url) || seen.has(url)) continue;
    seen.add(url); items.push(makeItem(title,url,source));
  }
  return items;
}

async function fetchOne(url) {
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),5000);
  try {
    const response=await fetch(url,{signal:controller.signal,headers:{'User-Agent':'Brasil-Pesquisa-Eleitoral-TSE/2.1'}});
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return { body:await response.text(), contentType:response.headers.get('content-type')||'', url };
  } finally { clearTimeout(timeout); }
}

async function fetchSource(source) {
  if (!source.fetchUrls.length) return {sourceId:source.id,online:true,items:[]};
  for (const url of source.fetchUrls) {
    try {
      const result=await fetchOne(url);
      const isFeed=/xml|rss|atom/.test(result.contentType)||/<rss|<feed/i.test(result.body.slice(0,500));
      const items=isFeed?extractRss(result.body,source):extractHtmlLinks(result.body,source,result.url);
      return {sourceId:source.id,online:true,items};
    } catch {}
  }
  return {sourceId:source.id,online:false,items:[]};
}

module.exports=async function handler(req,res){
  const results=await Promise.all(TRUSTED_SOURCES.map(fetchSource));
  const status=Object.fromEntries(results.map(item=>[item.sourceId,item.online]));
  const items=results.flatMap(item=>item.items).filter((item,index,array)=>array.findIndex(other=>other.url===item.url)===index).slice(0,40);
  const sources=TRUSTED_SOURCES.map(({fetchUrls,...source})=>({...source,online:status[source.id]!==false}));
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Cache-Control','public, s-maxage=900, stale-while-revalidate=1800');
  return res.status(200).json({ok:true,checkedAt:new Date().toISOString(),sources,items,policy:'Somente fontes oficiais e páginas primárias. Percentuais entram no gráfico apenas após validação metodológica.'});
};