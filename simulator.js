(() => {
  'use strict';
  const DATA = window.ELECTION_DATA;
  const app = () => window.ElectionApp;
  const $ = id => document.getElementById(id);
  const fmt = (v,d=1) => Number(v).toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d});

  function gaussian() {
    let u=0,v=0;
    while(!u)u=Math.random();
    while(!v)v=Math.random();
    return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);
  }

  function candidateMeans() {
    return DATA.candidates.map(candidate => {
      const values = DATA.polls.slice(-6).filter(p=>Object.hasOwn(p.values,candidate.name)).map(p=>p.values[candidate.name]);
      const mean = values.length ? values.reduce((a,b)=>a+b,0)/values.length : 0;
      const trend = values.length>1 ? values.at(-1)-values[0] : 0;
      return { candidate, mean, trend };
    }).filter(x=>x.mean>0);
  }

  function scenarioMeans(scenario, undecided) {
    const base = candidateMeans();
    const indec = undecided==='none'?0:8;
    let adjusted = base.map(item => ({...item, value:item.mean}));
    if (scenario==='conservative') adjusted=adjusted.map(x=>({...x,value:x.mean+x.trend*.12}));
    if (scenario==='growth') adjusted=adjusted.map(x=>({...x,value:x.mean+x.trend*.55}));
    if (undecided==='proportional') {
      const total=adjusted.reduce((s,x)=>s+x.value,0)||1;
      adjusted=adjusted.map(x=>({...x,value:x.value+indec*x.value/total}));
    }
    if (undecided==='leader') {
      adjusted.sort((a,b)=>b.value-a.value);adjusted[0].value+=indec*.58;const rest=indec*.42/(adjusted.length-1||1);adjusted.slice(1).forEach(x=>x.value+=rest);
    }
    if (undecided==='opposition') {
      adjusted.sort((a,b)=>b.value-a.value);const rest=indec/(adjusted.length-1||1);adjusted.slice(1).forEach(x=>x.value+=rest);
    }
    return adjusted;
  }

  function simulatePresident(runs, scenario, undecided, onProgress) {
    const means=scenarioMeans(scenario,undecided);
    const wins=Object.fromEntries(means.map(x=>[x.candidate.id,0]));
    const secondRound=Object.fromEntries(means.map(x=>[x.candidate.id,0]));
    const totals=Object.fromEntries(means.map(x=>[x.candidate.id,0]));
    const samples=Object.fromEntries(means.map(x=>[x.candidate.id,[]]));
    let done=0;
    return new Promise(resolve=>{
      const chunk=()=>{
        const end=Math.min(runs,done+300);
        for(;done<end;done++){
          const draw=means.map(x=>({candidate:x.candidate,value:Math.max(0,x.value+gaussian()*2.15)})).sort((a,b)=>b.value-a.value);
          const sum=draw.reduce((s,x)=>s+x.value,0)||1;draw.forEach(x=>{x.value=x.value/sum*100;totals[x.candidate.id]+=x.value;samples[x.candidate.id].push(x.value);});
          secondRound[draw[0].candidate.id]++;secondRound[draw[1].candidate.id]++;
          const first=draw[0],second=draw[1];
          const runoffFirst=first.value+gaussian()*2.2+(first.value-second.value)*.12;
          const runoffSecond=second.value+gaussian()*2.2;
          wins[(runoffFirst>=runoffSecond?first:second).candidate.id]++;
        }
        onProgress(done/runs);
        if(done<runs)requestAnimationFrame(chunk);else{
          const result=means.map(x=>{
            const arr=samples[x.candidate.id].sort((a,b)=>a-b);return {candidate:x.candidate,mean:totals[x.candidate.id]/runs,win:wins[x.candidate.id]/runs*100,runoff:secondRound[x.candidate.id]/runs*100,low:arr[Math.floor(arr.length*.05)]||0,high:arr[Math.floor(arr.length*.95)]||0};
          }).sort((a,b)=>b.win-a.win);resolve(result);
        }
      };chunk();
    });
  }

  function allocateSeats(total, parties, scenario) {
    const adjusted=parties.map((p,i)=>{
      let share=p.share;
      if(scenario==='conservative')share=share+(i%2?-.6:.35);
      if(scenario==='growth')share=share+(i<2?1.2:-.3);
      return {...p,share:Math.max(.1,share)};
    });
    const sum=adjusted.reduce((s,p)=>s+p.share,0);
    const quotas=adjusted.map(p=>({...p,exact:p.share/sum*total}));
    let assigned=0;quotas.forEach(p=>{p.seats=Math.floor(p.exact);p.rem=p.exact-p.seats;assigned+=p.seats;});
    quotas.sort((a,b)=>b.rem-a.rem);for(let i=0;i<total-assigned;i++)quotas[i%quotas.length].seats++;
    return quotas.sort((a,b)=>b.seats-a.seats);
  }

  function renderPresidentResult(result,runs){
    const winner=result[0];
    $('simulationTitle').textContent='Presidência — resultado se a eleição fosse hoje';
    $('simulationOutput').className='simulation-output';
    $('simulationOutput').innerHTML=`<div class="simulation-winner"><img src="${winner.candidate.photo}" alt="Retrato de ${winner.candidate.name}"><div><span class="panel-kicker">MAIOR PROBABILIDADE ESTIMADA</span><h2 style="font:800 38px var(--font-display);margin:4px 0;text-transform:uppercase">${winner.candidate.name}</h2><div class="simulation-number" id="winnerProbability">0,0%</div><span>Probabilidade estimada de vitória final</span><div class="probability-bar"><i style="width:${winner.win}%"></i></div><div class="simulation-metrics"><div class="simulation-metric"><span>Média simulada</span><strong>${fmt(winner.mean)}%</strong></div><div class="simulation-metric"><span>Faixa de 90%</span><strong>${fmt(winner.low)}%–${fmt(winner.high)}%</strong></div><div class="simulation-metric"><span>Chance de 2º turno</span><strong>${fmt(winner.runoff)}%</strong></div><div class="simulation-metric"><span>Simulações</span><strong>${runs.toLocaleString('pt-BR')}</strong></div><div class="simulation-metric"><span>Confiança da base</span><strong>Moderada</strong></div><div class="simulation-metric"><span>Natureza</span><strong>Projeção</strong></div></div></div></div><div class="party-table" style="margin-top:16px">${result.map(r=>`<div class="party-row" style="--party-color:${r.candidate.color}"><strong>${r.candidate.name}</strong><div class="party-bar"><i style="--share:${r.win}%"></i></div><span>${fmt(r.mean)}%</span><strong>${fmt(r.win)}%</strong></div>`).join('')}</div><p class="disclaimer">SIMULAÇÃO — NÃO É RESULTADO OFICIAL. A projeção depende das pesquisas e parâmetros disponíveis.</p>`;
    app().animateNumber($('winnerProbability'),0,winner.win,{suffix:'%',duration:1100});
  }

  function renderSeatsResult(office, seats, runs, scenario) {
    const names={senate:'Senado Federal',chamber:'Câmara dos Deputados',assembly:'Assembleia Legislativa',district:'Câmara Legislativa do DF'};
    const allocated=allocateSeats(seats,DATA.parties,scenario);
    $('simulationTitle').textContent=`${names[office]} — composição simulada`;
    $('simulationOutput').className='simulation-output';
    $('simulationOutput').innerHTML=`<div class="simulation-metrics"><div class="simulation-metric"><span>Total de cadeiras</span><strong>${seats}</strong></div><div class="simulation-metric"><span>Partido com maior bancada</span><strong>${allocated[0].name}</strong></div><div class="simulation-metric"><span>Cadeiras projetadas</span><strong>${allocated[0].seats}</strong></div><div class="simulation-metric"><span>Simulações</span><strong>${runs.toLocaleString('pt-BR')}</strong></div><div class="simulation-metric"><span>Confiança</span><strong>Baixa</strong></div><div class="simulation-metric"><span>Base</span><strong>Cenário configurável</strong></div></div><div class="party-table" style="margin-top:14px">${allocated.map(p=>`<div class="party-row" style="--party-color:${p.color}"><strong>${p.name}</strong><div class="party-bar"><i style="--share:${p.share}%"></i></div><span>${fmt(p.share)}%</span><strong>${p.seats}</strong></div>`).join('')}</div><p class="disclaimer">Sem pesquisas partidárias suficientes, esta composição é uma simulação paramétrica e não identifica candidatos eleitos.</p>`;
    const partyForChart=allocated.map(p=>({name:p.name,color:p.color,share:p.seats/seats*100}));app().createHemicycle('simulationSeats',seats,partyForChart);
  }

  async function run(){
    const office=$('simulationOffice').value;const scenario=$('simulationScenario').value;const undecided=$('undecidedMode').value;const runs=Number($('simulationRuns').value);const progress=$('simulationProgress');const bar=progress.querySelector('.progress-track i');const copy=progress.querySelector('.progress-copy');
    $('runSimulation').disabled=true;bar.style.width='0';copy.innerHTML='<span>Executando simulações</span><strong>0%</strong>';
    const update=p=>{bar.style.width=`${p*100}%`;copy.innerHTML=`<span>${p<.28?'Carregando pesquisas':p<.55?'Calculando probabilidades':p<.82?'Distribuindo cenários':'Finalizando resultado'}</span><strong>${Math.round(p*100)}%</strong>`;};
    if(office==='president'){
      const result=await simulatePresident(runs,scenario,undecided,update);renderPresidentResult(result,runs);app().createHemicycle('simulationSeats',81);
    }else{
      let done=0;await new Promise(resolve=>{const tick=()=>{done+=Math.max(50,Math.round(runs/40));update(Math.min(1,done/runs));if(done<runs)requestAnimationFrame(tick);else resolve();};tick();});
      const seats={senate:81,chamber:513,assembly:94,district:24}[office];renderSeatsResult(office,seats,runs,scenario);
    }
    copy.innerHTML='<span>Simulação concluída</span><strong>100%</strong>';$('runSimulation').disabled=false;
  }

  document.addEventListener('DOMContentLoaded',()=>{
    $('turnout').addEventListener('input',e=>$('turnoutValue').textContent=`${e.target.value}%`);
    $('simulationRuns').addEventListener('input',e=>$('runsValue').textContent=Number(e.target.value).toLocaleString('pt-BR'));
    $('runSimulation').addEventListener('click',run);
  });
})();
