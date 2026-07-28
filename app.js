(() => {
  'use strict';
  const DATA = window.ELECTION_DATA;
  const state = {
    selectedCandidate: DATA.candidates[0],
    chartMode: 'line',
    registry: [],
    registryFiltered: [],
    registryLimit: 50,
    sources: DATA.sourcesFallback,
    localItems: []
  };
  window.ElectionApp = { state, renderSources, renderRegistry, renderLocal, createHemicycle, animateNumber };

  const $ = (id) => document.getElementById(id);
  const fmt = (value, digits = 1) => Number(value).toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits });
  const fmtPct = value => `${fmt(value)}%`;
  const NS = 'http://www.w3.org/2000/svg';

  function animateNumber(element, from, to, options = {}) {
    if (!element) return;
    const duration = options.duration || 800;
    const suffix = options.suffix ?? '';
    const digits = options.digits ?? 1;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      element.textContent = `${fmt(to, digits)}${suffix}`;
      return;
    }
    const start = performance.now();
    const step = now => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      element.textContent = `${fmt(from + (to - from) * eased, digits)}${suffix}`;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function getCandidateLatest(candidate) {
    for (let i = DATA.polls.length - 1; i >= 0; i--) {
      if (Object.hasOwn(DATA.polls[i].values, candidate.name)) {
        const current = DATA.polls[i].values[candidate.name];
        let previous = current;
        for (let j = i - 1; j >= 0; j--) {
          if (Object.hasOwn(DATA.polls[j].values, candidate.name)) { previous = DATA.polls[j].values[candidate.name]; break; }
        }
        return { poll: DATA.polls[i], value: current, previous, change: current - previous };
      }
    }
    return null;
  }

  function candidatePhoto(candidate, className = '') {
    return `<img class="${className}" src="${candidate.photo}" alt="Retrato de rosto de ${candidate.name}" style="--focus:${candidate.focus};--candidate-color:${candidate.color}" loading="lazy" decoding="async">`;
  }

  function renderCandidateCards() {
    const ranked = DATA.candidates.map(candidate => ({ candidate, ...getCandidateLatest(candidate) })).filter(x => x.poll).sort((a,b) => b.value - a.value);
    $('candidateCards').innerHTML = ranked.map((item, index) => {
      const changeClass = item.change > .05 ? 'up' : item.change < -.05 ? 'down' : 'stable';
      const arrow = item.change > .05 ? '▲' : item.change < -.05 ? '▼' : '—';
      return `<button type="button" class="candidate-card ${item.candidate.id === state.selectedCandidate.id ? 'selected' : ''}" data-id="${item.candidate.id}" style="--candidate-color:${item.candidate.color};--index:${index};--focus:${item.candidate.focus}">
        <span class="candidate-rank">${index + 1}</span>
        <span class="candidate-photo-wrap">${candidatePhoto(item.candidate, 'candidate-photo')}</span>
        <span class="candidate-card-data"><strong class="candidate-value" data-value="${item.value}">0,0%</strong><b class="candidate-name">${item.candidate.name}</b><span class="candidate-party">${item.candidate.party}</span><span class="candidate-change ${changeClass}">${arrow} ${fmt(Math.abs(item.change))} pp</span></span>
      </button>`;
    }).join('');
    document.querySelectorAll('.candidate-card').forEach(button => button.addEventListener('click', () => selectCandidate(button.dataset.id)));
    document.querySelectorAll('.candidate-value').forEach(el => animateNumber(el, 0, Number(el.dataset.value), { suffix:'%', duration:950 }));
  }

  function selectCandidate(id) {
    const candidate = DATA.candidates.find(c => c.id === id);
    if (!candidate) return;
    state.selectedCandidate = candidate;
    document.querySelectorAll('.candidate-card').forEach(card => card.classList.toggle('selected', card.dataset.id === id));
    renderFeaturedCandidate();
    renderChart();
  }

  function renderFeaturedCandidate() {
    const c = state.selectedCandidate;
    const latest = getCandidateLatest(c);
    const values = DATA.polls.filter(p => Object.hasOwn(p.values, c.name)).map(p => p.values[c.name]);
    const history = DATA.polls.filter(p => Object.hasOwn(p.values, c.name)).slice(-5).reverse();
    $('featuredName').textContent = c.name;
    $('featuredCandidate').innerHTML = `<div class="featured-portrait" style="--candidate-color:${c.color};--focus:${c.focus}">${candidatePhoto(c)}</div><div class="featured-stats"><h3>${c.name}</h3><span>${c.party}</span><div class="featured-main-value" id="featuredValue" style="color:${c.color}">0,0%</div><div class="featured-stat-grid"><div class="mini-stat"><span>Pesquisas utilizadas</span><strong>${values.length}</strong></div><div class="mini-stat"><span>Última publicação</span><strong>${latest.poll.publication}</strong></div><div class="mini-stat"><span>Menor resultado</span><strong>${fmtPct(Math.min(...values))}</strong></div><div class="mini-stat"><span>Maior resultado</span><strong>${fmtPct(Math.max(...values))}</strong></div></div></div>`;
    animateNumber($('featuredValue'), 0, latest.value, { suffix:'%', duration:850 });
    $('featuredHistory').innerHTML = history.map(p => `<tr><td>${p.publication}</td><td>${p.institute}</td><td>${p.scope}</td><td>${p.sample}</td><td><strong>${fmtPct(p.values[c.name])}</strong></td></tr>`).join('');
  }

  function svgEl(name, attrs = {}) {
    const node = document.createElementNS(NS, name);
    Object.entries(attrs).forEach(([k,v]) => node.setAttribute(k, v));
    return node;
  }

  function renderChart() {
    const svg = $('mainChart');
    if (!svg) return;
    svg.innerHTML = '';
    const width = Math.max(620, svg.clientWidth || 760);
    const height = Math.max(210, svg.clientHeight || 210);
    const pad = { left:40, right:18, top:15, bottom:27 };
    const plotW = width - pad.left - pad.right;
    const plotH = height - pad.top - pad.bottom;
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    const times = DATA.polls.map(p => new Date(`${p.date}T12:00:00`).getTime());
    const minT = Math.min(...times), maxT = Math.max(...times);
    const x = t => pad.left + ((t - minT) / (maxT - minT || 1)) * plotW;
    const y = v => pad.top + plotH - (v / 50) * plotH;

    for (let v=0;v<=50;v+=10) {
      const yy = y(v);
      svg.appendChild(svgEl('line',{x1:pad.left,y1:yy,x2:width-pad.right,y2:yy,class:'grid-line'}));
      const label = svgEl('text',{x:pad.left-6,y:yy+3,class:'axis-label','text-anchor':'end'}); label.textContent=`${v}%`; svg.appendChild(label);
    }
    const months = new Map();
    DATA.polls.forEach(p => { const key=p.date.slice(0,7); if(!months.has(key)) months.set(key,p); });
    [...months.values()].forEach((p,i,arr)=>{ const xx=x(new Date(`${p.date}T12:00:00`).getTime()); const t=svgEl('text',{x:xx,y:height-8,class:'axis-label','text-anchor':i===0?'start':i===arr.length-1?'end':'middle'}); t.textContent=p.label.replace(/^\d+\s/,'').toUpperCase(); svg.appendChild(t); });

    const selected = state.selectedCandidate.id;
    DATA.candidates.forEach((candidate, seriesIndex) => {
      const points = DATA.polls.filter(p => Object.hasOwn(p.values,candidate.name)).map(p => ({ poll:p, value:p.values[candidate.name], x:x(new Date(`${p.date}T12:00:00`).getTime()), y:y(p.values[candidate.name]) }));
      if (!points.length) return;
      const opacity = candidate.id === selected ? 1 : .68;
      if (state.chartMode === 'bar') {
        const last = points[points.length-1];
        const barW = Math.max(12, plotW/(DATA.candidates.length*2.2));
        const bx = pad.left + seriesIndex*(barW+8)+20;
        const rect = svgEl('rect',{x:bx,y:height-pad.bottom,width:barW,height:0,fill:candidate.color,opacity});
        svg.appendChild(rect);
        const targetH = plotH - (last.y-pad.top);
        requestAnimationFrame(()=>{ rect.style.transition='y .7s ease,height .7s ease';rect.setAttribute('y',last.y);rect.setAttribute('height',targetH); });
        const label=svgEl('text',{x:bx+barW/2,y:last.y-5,class:'axis-label','text-anchor':'middle'});label.textContent=fmtPct(last.value);svg.appendChild(label);
        return;
      }
      const d = points.map((p,i)=>`${i?'L':'M'} ${p.x} ${p.y}`).join(' ');
      if (state.chartMode === 'area') {
        const areaD = `${d} L ${points.at(-1).x} ${y(0)} L ${points[0].x} ${y(0)} Z`;
        svg.appendChild(svgEl('path',{d:areaD,fill:candidate.color,class:'series-area',opacity:candidate.id===selected?.25:.08}));
      }
      const path=svgEl('path',{d,stroke:candidate.color,class:'series-line',opacity});
      svg.appendChild(path);
      const length=path.getTotalLength();path.style.strokeDasharray=length;path.style.strokeDashoffset=length;
      requestAnimationFrame(()=>{path.style.transition=`stroke-dashoffset ${700+seriesIndex*70}ms ease`;path.style.strokeDashoffset='0';});
      points.forEach((point,index)=>{
        const circle=svgEl('circle',{cx:point.x,cy:point.y,r:candidate.id===selected?5:3.7,fill:candidate.color,class:`point ${index===points.length-1&&candidate.id===selected?'point-pulse':''}`,opacity});
        circle.style.animationDelay=`${.35+index*.035}s`;
        circle.addEventListener('mouseenter',ev=>showChartTooltip(ev,candidate,point.poll,point.value));
        circle.addEventListener('mousemove',ev=>showChartTooltip(ev,candidate,point.poll,point.value));
        circle.addEventListener('mouseleave',()=>$('chartTooltip').classList.add('hidden'));
        circle.addEventListener('click',()=>openPollDetail(candidate,point.poll,point.value));
        svg.appendChild(circle);
      });
    });
    renderLegend();
  }

  function showChartTooltip(event,candidate,poll,value){
    const tip=$('chartTooltip');tip.innerHTML=`<strong>${candidate.name}: ${fmtPct(value)}</strong><span>${poll.institute} • ${poll.publication}</span><span>Amostra: ${poll.sample} • Margem: ${poll.margin}</span>`;tip.classList.remove('hidden');tip.style.left=`${Math.min(innerWidth-220,event.clientX+12)}px`;tip.style.top=`${Math.max(8,event.clientY-42)}px`;
  }

  function renderLegend(){
    $('chartLegend').innerHTML=DATA.candidates.map(c=>`<button type="button" class="legend-item" data-id="${c.id}" style="border:0;background:none;color:${c.id===state.selectedCandidate.id?'white':'#aebfd0'}"><i style="background:${c.color}"></i>${c.name} (${c.party})</button>`).join('');
    document.querySelectorAll('.legend-item').forEach(b=>b.addEventListener('click',()=>selectCandidate(b.dataset.id)));
  }

  function openPollDetail(candidate,poll,value){
    $('dialogBody').innerHTML=`<div class="dialog-candidate" style="--candidate-color:${candidate.color}">${candidatePhoto(candidate)}<div><span class="panel-kicker">DETALHES DA PESQUISA</span><h2>${candidate.name}</h2><div class="featured-main-value" style="color:${candidate.color}">${fmtPct(value)}</div><div class="simulation-metrics"><div class="simulation-metric"><span>Instituto</span><strong>${poll.institute}</strong></div><div class="simulation-metric"><span>Publicação</span><strong>${poll.publication}</strong></div><div class="simulation-metric"><span>Amostra</span><strong>${poll.sample}</strong></div><div class="simulation-metric"><span>Margem</span><strong>${poll.margin}</strong></div><div class="simulation-metric"><span>Registro</span><strong>${poll.registry}</strong></div><div class="simulation-metric"><span>Abrangência</span><strong>${poll.scope}</strong></div></div>${poll.source?`<a class="wide-action" style="display:block;text-align:center;text-decoration:none" href="${poll.source}" target="_blank" rel="noopener">Abrir fonte da pesquisa</a>`:''}</div></div>`;
    $('detailDialog').showModal();
  }

  function openCandidateDialog(){
    const c=state.selectedCandidate;const rows=DATA.polls.filter(p=>Object.hasOwn(p.values,c.name)).slice().reverse();
    $('dialogBody').innerHTML=`<div class="dialog-candidate" style="--candidate-color:${c.color}">${candidatePhoto(c)}<div><span class="panel-kicker">HISTÓRICO COMPLETO</span><h2>${c.name}</h2><p>${c.party} • ${rows.length} levantamentos validados no painel presidencial.</p></div></div><div class="table-scroll dialog-table"><table class="data-table"><thead><tr><th>Data</th><th>Instituto</th><th>Campo</th><th>Amostra</th><th>Margem</th><th>Registro</th><th>Resultado</th></tr></thead><tbody>${rows.map(p=>`<tr><td>${p.publication}</td><td>${p.institute}</td><td>${p.field}</td><td>${p.sample}</td><td>${p.margin}</td><td>${p.registry}</td><td><strong>${fmtPct(p.values[c.name])}</strong></td></tr>`).join('')}</tbody></table></div>`;
    $('detailDialog').showModal();
  }

  function renderStateGrids(){
    const markup=DATA.ufs.map(uf=>{const count=state.registry.filter(r=>r.uf===uf).length;return `<button type="button" class="state-card" data-uf="${uf}"><span>${uf}</span><h3>${DATA.stateNames[uf]}</h3><div class="state-status">${count?`${count} registro${count>1?'s':''} no TSE`:'Dados em monitoramento'}</div></button>`}).join('');
    ['governorGrid','assemblyGrid','senateStates'].forEach(id=>{const el=$(id);if(el)el.innerHTML=markup;});
    document.querySelectorAll('.state-card').forEach(card=>card.addEventListener('click',()=>{showView('registry');$('registryUf').value=card.dataset.uf;filterRegistry();}));
  }

  function createHemicycle(containerId,total=81,partyData=DATA.parties){
    const container=$(containerId);if(!container)return;
    const w=640,h=350,cx=w/2,cy=320;const seats=[];
    const rows=total>200?9:6;
    const radii=Array.from({length:rows},(_,i)=>110+i*(total>200?22:25));
    const weightSum=radii.reduce((a,b)=>a+b,0);
    const rowCounts=radii.map(r=>Math.max(4,Math.floor(total*r/weightSum)));
    let countSum=rowCounts.reduce((a,b)=>a+b,0);
    for(let i=rows-1;countSum<total;i=(i-1+rows)%rows){rowCounts[i]++;countSum++;}
    for(let i=rows-1;countSum>total;i=(i-1+rows)%rows){if(rowCounts[i]>4){rowCounts[i]--;countSum--;}}
    const allocations=[];let allocated=0;
    partyData.forEach((p,i)=>{const n=i===partyData.length-1?total-allocated:Math.round(total*(p.share||0)/100);allocated+=n;for(let j=0;j<n&&allocations.length<total;j++)allocations.push(p.color);});
    while(allocations.length<total)allocations.push('#506174');
    let index=0;
    radii.forEach((radius,row)=>{
      const count=rowCounts[row];
      for(let i=0;i<count&&index<total;i++,index++){
        const angle=Math.PI+(i/(Math.max(1,count-1)))*Math.PI;
        const x=cx+Math.cos(angle)*radius;const y=cy+Math.sin(angle)*radius;
        seats.push(`<circle class="seat" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${total>200?4.6:7}" fill="${allocations[index]}" style="animation-delay:${index*4}ms"/>`);
      }
    });
    container.innerHTML=`<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Distribuição simulada de ${total} cadeiras"><g>${seats.join('')}</g><text x="${cx}" y="${cy-10}" text-anchor="middle" fill="#fff" style="font:800 42px var(--font-display)">${total}</text><text x="${cx}" y="${cy+16}" text-anchor="middle" fill="#9fb4c9" style="font:700 12px var(--font-display)">CADEIRAS</text></svg>`;
  }

  function renderPartyProjection(){
    const container=$('partyProjectionTable');if(!container)return;
    container.innerHTML=`<span class="panel-kicker">CENÁRIO DEMONSTRATIVO</span><h2>Distribuição configurável</h2><p style="color:var(--muted)">O simulador aplica as regras proporcionais aos percentuais informados. Sem pesquisas partidárias adequadas, não declara candidatos eleitos.</p><div class="party-table">${DATA.parties.map(p=>`<div class="party-row" style="--party-color:${p.color}"><strong>${p.name}</strong><div class="party-bar"><i style="--share:${p.share}%"></i></div><span>${p.share}%</span><strong>${Math.round(513*p.share/100)}</strong></div>`).join('')}</div>`;
  }

  function renderPresidentialFull(){
    const el=$('presidentFull');if(!el)return;
    el.innerHTML=`<article class="panel"><span class="panel-kicker">PESQUISAS VALIDADAS</span><h2>${DATA.polls.length} levantamentos no gráfico</h2><div class="table-scroll"><table class="data-table"><thead><tr><th>Data</th><th>Instituto</th><th>Amostra</th><th>Margem</th><th>Registro</th><th>Fonte</th></tr></thead><tbody>${DATA.polls.slice().reverse().map(p=>`<tr><td>${p.publication}</td><td>${p.institute}</td><td>${p.sample}</td><td>${p.margin}</td><td>${p.registry}</td><td>${p.source?`<a href="${p.source}" target="_blank" rel="noopener">Abrir</a>`:'—'}</td></tr>`).join('')}</tbody></table></div></article><article class="panel"><span class="panel-kicker">CRITÉRIO</span><h2>Dados separados por cenário</h2><p style="color:var(--muted);line-height:1.7">Primeiro turno, segundo turno, espontânea, estimulada, rejeição e aprovação não são misturados. O painel presidencial atual exibe somente o cenário principal validado.</p></article>`;
  }

  function renderRegistry(){
    const records=state.registryFiltered.length||$('registrySearch')?.value||$('registryOffice')?.value!=='Todos'||$('registryUf')?.value!=='Todas'?state.registryFiltered:state.registry;
    const shown=records.slice(0,state.registryLimit);
    $('registryTableBody').innerHTML=shown.length?shown.map(r=>`<tr><td><strong>${r.registry||'—'}</strong></td><td>${r.office||'Não identificado'}</td><td>${[r.uf,r.location].filter(Boolean).join(' • ')||'Brasil'}</td><td>${r.institute||'—'}</td><td>${r.fieldStart||'—'}${r.fieldEnd?` a ${r.fieldEnd}`:''}</td><td>${r.sample||'—'}</td><td><span class="status-chip ${r.hasResults?'result':''}">${r.hasResults?'Resultado localizado':'Registro oficial'}</span></td></tr>`).join(''):`<tr><td colspan="7">Nenhum registro disponível para este filtro.</td></tr>`;
    $('loadMoreRegistry').hidden=shown.length>=records.length;
    const offices=[...new Set(state.registry.map(r=>r.office).filter(Boolean))].sort();
    const current=$('registryOffice').value;$('registryOffice').innerHTML='<option value="Todos">Todos</option>'+offices.map(o=>`<option>${o}</option>`).join('');$('registryOffice').value=offices.includes(current)?current:'Todos';
    $('registrySummary').innerHTML=[['Registros oficiais',state.registry.length],['Presidente',state.registry.filter(r=>/presidente/i.test(r.office)).length],['Governador',state.registry.filter(r=>/governador/i.test(r.office)).length],['Senador',state.registry.filter(r=>/senador/i.test(r.office)).length],['Proporcionais',state.registry.filter(r=>/deputad/i.test(r.office)).length]].map(([l,v])=>`<div class="registry-card"><span>${l}</span><strong>${Number(v).toLocaleString('pt-BR')}</strong></div>`).join('');
  }

  function filterRegistry(){
    const q=$('registrySearch').value.trim().toLowerCase();const office=$('registryOffice').value;const uf=$('registryUf').value;
    state.registryFiltered=state.registry.filter(r=>(office==='Todos'||r.office===office)&&(uf==='Todas'||r.uf===uf)&&(!q||[r.registry,r.office,r.uf,r.location,r.institute,r.company].join(' ').toLowerCase().includes(q)));
    state.registryLimit=50;renderRegistry();
  }

  function renderLocal(){
    const q=($('localSearch')?.value||'').toLowerCase();const uf=$('localUf')?.value||'Todas';const source=$('localSource')?.value||'Todas';const office=$('localOffice')?.value||'Todos';
    const localRecords=state.registry.filter(r=>r.uf&&r.uf!=='BR').filter(r=>(uf==='Todas'||r.uf===uf)&&(office==='Todos'||r.office===office)&&(source==='Todas'||r.institute===source)&&(!q||[r.uf,r.location,r.institute,r.office,r.registry].join(' ').toLowerCase().includes(q))).slice(0,12);
    state.localItems=localRecords;
    $('localTableBody').innerHTML=localRecords.length?localRecords.map(r=>`<tr><td><strong>${r.location||DATA.stateNames[r.uf]||r.uf}</strong><br><small>${r.uf}</small></td><td>${r.institute||'TSE/PesqEle'}</td><td>${r.publication||r.fieldEnd||'—'}</td><td>${r.office||'Não informado'}</td><td><span class="status-chip ${r.hasResults?'result':''}">${r.hasResults?'Com resultado':'Registro TSE'}</span></td><td><button class="table-action" data-registry="${r.registry||''}">VER</button></td></tr>`).join(''):`<tr><td colspan="6">Nenhum registro local encontrado. A base continuará sendo atualizada automaticamente.</td></tr>`;
    renderMapPoints(localRecords);
    document.querySelectorAll('.table-action').forEach(b=>b.addEventListener('click',()=>openRegistryRecord(b.dataset.registry)));
    const sources=[...new Set(state.registry.map(r=>r.institute).filter(Boolean))].sort();const currentSource=$('localSource').value;$('localSource').innerHTML='<option value="Todas">Todas</option>'+sources.map(s=>`<option>${s}</option>`).join('');$('localSource').value=sources.includes(currentSource)?currentSource:'Todas';
  }

  function renderMapPoints(records){
    const coords={AC:[105,250],AL:[405,260],AP:[280,90],AM:[160,150],BA:[345,280],CE:[402,205],DF:[292,273],ES:[385,335],GO:[280,275],MA:[345,180],MT:[225,250],MS:[240,325],MG:[330,320],PA:[260,155],PB:[420,225],PR:[285,380],PE:[410,245],PI:[365,210],RJ:[365,355],RN:[425,205],RS:[255,430],RO:[160,245],RR:[175,75],SC:[290,405],SP:[315,350],SE:[402,275],TO:[310,225]};
    const group=$('mapPoints');if(!group)return;group.innerHTML='';
    [...new Set(records.map(r=>r.uf))].forEach((uf,i)=>{const c=coords[uf];if(!c)return;const circle=svgEl('circle',{cx:c[0],cy:c[1],r:6,fill:i%2?'#f7cf18':'#19c84b',class:'map-point'});circle.style.animationDelay=`${i*80}ms`;const title=svgEl('title');title.textContent=`${DATA.stateNames[uf]}: ${records.filter(r=>r.uf===uf).length} registros`;circle.appendChild(title);group.appendChild(circle);});
  }

  function openRegistryRecord(registry){
    const r=state.registry.find(x=>x.registry===registry);if(!r)return;
    $('dialogBody').innerHTML=`<span class="panel-kicker">REGISTRO OFICIAL TSE</span><h2 style="font:800 34px var(--font-display);text-transform:uppercase">${r.registry||'Pesquisa registrada'}</h2><div class="simulation-metrics"><div class="simulation-metric"><span>Cargo</span><strong>${r.office||'—'}</strong></div><div class="simulation-metric"><span>UF/local</span><strong>${[r.uf,r.location].filter(Boolean).join(' • ')||'Brasil'}</strong></div><div class="simulation-metric"><span>Instituto</span><strong>${r.institute||'—'}</strong></div><div class="simulation-metric"><span>Amostra</span><strong>${r.sample||'—'}</strong></div><div class="simulation-metric"><span>Período</span><strong>${r.fieldStart||'—'}${r.fieldEnd?` a ${r.fieldEnd}`:''}</strong></div><div class="simulation-metric"><span>Situação</span><strong>${r.status||'Registrada'}</strong></div></div><p style="color:var(--muted);line-height:1.7">${r.hasResults?'O sistema localizou uma publicação verificável associada a este registro.':'Pesquisa registrada no TSE, mas os percentuais ainda não foram divulgados ou localizados em fonte pública verificável.'}</p>`;
    $('detailDialog').showModal();
  }

  function renderSources(){
    const sources=state.sources.length?state.sources:DATA.sourcesFallback;
    $('sourceTickerItems').innerHTML=sources.slice(0,8).map(s=>`<span class="ticker-source ${s.online===false?'offline':''}"><i></i>${s.name}</span>`).join('');
    $('sourcesList').innerHTML=sources.slice(0,12).map(s=>`<div class="source-row ${s.online===false?'':'online'}"><i></i><div><strong>${s.name}</strong><span>${(s.coverage||[]).join(' • ')}</span></div><small>${s.online===false?'Indisponível':'Disponível'}</small></div>`).join('');
    $('sourcesExtended').innerHTML=sources.map(s=>`<article class="source-directory-card"><span class="panel-kicker">${s.kind||'Fonte monitorada'}</span><h3>${s.name}</h3><p>${s.description||`Cobertura: ${(s.coverage||[]).join(', ')}`}</p><div class="source-row ${s.online===false?'':'online'}"><i></i><div><strong>${s.online===false?'Indisponível temporariamente':'Fonte disponível'}</strong><span>Última verificação automática</span></div></div>${s.url?`<a href="${s.url}" target="_blank" rel="noopener">Abrir fonte</a>`:''}</article>`).join('');
  }

  async function loadRegistry(){
    try{
      const response=await fetch(`/api/tse-registry?ts=${Date.now()}`,{cache:'no-store'});const data=await response.json();if(!response.ok||!data.ok)throw new Error(data.error||'Falha');
      state.registry=data.records||[];
      localStorage.setItem('tseRegistryCache',JSON.stringify({at:Date.now(),records:state.registry}));
    }catch(error){
      try{const cached=JSON.parse(localStorage.getItem('tseRegistryCache')||'null');if(cached?.records)state.registry=cached.records;}catch{}
    }
    state.registryFiltered=state.registry.slice();renderRegistry();renderLocal();renderStateGrids();
  }

  function populateFilters(){
    const ufOptions=DATA.ufs.map(uf=>`<option value="${uf}">${uf} — ${DATA.stateNames[uf]}</option>`).join('');
    ['localUf','registryUf'].forEach(id=>{const el=$(id);if(el)el.insertAdjacentHTML('beforeend',ufOptions);});
  }

  function showView(id){
    document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id===id));
    document.querySelectorAll('.nav-item').forEach(n=>n.classList.toggle('active',n.dataset.view===id));
    $('sidebar').classList.remove('open');scrollTo({top:0,behavior:'smooth'});
    if(id==='senate')createHemicycle('senateHemicycle',81);
    if(id==='chamber')createHemicycle('chamberHemicycle',513);
    if(id==='district')createHemicycle('districtHemicycle',24);
  }

  function bindEvents(){
    document.querySelectorAll('.nav-item').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.view)));
    document.querySelectorAll('.chart-mode').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('.chart-mode').forEach(x=>x.classList.remove('active'));b.classList.add('active');state.chartMode=b.dataset.mode;renderChart();}));
    $('openCandidateDetails').addEventListener('click',openCandidateDialog);$('closeDialog').addEventListener('click',()=>$('detailDialog').close());$('detailDialog').addEventListener('click',e=>{if(e.target===$('detailDialog'))$('detailDialog').close();});
    $('mobileMenuButton').addEventListener('click',()=>$('sidebar').classList.toggle('open'));
    ['localSearch','localUf','localSource','localOffice'].forEach(id=>$(id)?.addEventListener(id==='localSearch'?'input':'change',renderLocal));
    ['registrySearch','registryOffice','registryUf'].forEach(id=>$(id)?.addEventListener(id==='registrySearch'?'input':'change',filterRegistry));
    $('loadMoreRegistry').addEventListener('click',()=>{state.registryLimit+=50;renderRegistry();});
    $('refreshLocal').addEventListener('click',loadRegistry);
    addEventListener('resize',()=>{clearTimeout(window.__chartTimer);window.__chartTimer=setTimeout(renderChart,120);});
  }

  function startClock(){
    setInterval(()=>{const now=new Date();const time=now.toLocaleTimeString('pt-BR',{timeZone:'America/Sao_Paulo'});$('liveClock').textContent=time;$('sourcesTime').textContent=time;},1000);
  }

  function init(){
    populateFilters();renderCandidateCards();renderFeaturedCandidate();renderChart();renderPresidentialFull();renderStateGrids();createHemicycle('senateHemicycle',81);createHemicycle('chamberHemicycle',513);createHemicycle('districtHemicycle',24);renderPartyProjection();renderSources();renderRegistry();renderLocal();bindEvents();startClock();loadRegistry();setTimeout(()=>$('bootScreen').classList.add('done'),1550);
  }
  document.addEventListener('DOMContentLoaded',init);
})();
