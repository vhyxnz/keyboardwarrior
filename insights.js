(function(){
 'use strict';
 const key='kw_session_history_v1';let guest=[];
 function isGuest(){return (document.getElementById('navStats')?.textContent||'').trim().toLowerCase()==='guest';}
 function read(){if(isGuest())return guest;try{return JSON.parse(localStorage.getItem(key)||'[]');}catch(e){return [];}}
 function write(rows){if(isGuest())guest=rows;else try{localStorage.setItem(key,JSON.stringify(rows));}catch(e){}}
 const panel=document.createElement('section');panel.className='insights-panel';panel.innerHTML='<div class="insights-head"><div><h2>Performance Trends</h2><p>Detailed analytics from rounds played since version 2.5.</p></div><select id="insightRange" aria-label="Statistics period"><option value="7">7 days</option><option value="30">30 days</option><option value="9999">All time</option></select></div><div class="insight-summary" id="insightSummary"></div><div class="trend-chart" id="trendChart" aria-label="Recent accuracy chart"></div><h3>Recent Sessions</h3><div class="recent-sessions" id="recentSessions"></div>';
 (document.getElementById('profile-pane-stats')||document.getElementById('statsScreen')).append(panel);
 function modeName(id){return String(id||'Round').replace(/ghostrace/i,'Ghost Race').replace(/suddendeath/i,'Sudden Death').replace(/nomercy/i,'No Mercy').replace(/defense/i,'Keyboard Defense').replace(/survival/i,'Typing Survival').replace(/^./,x=>x.toUpperCase());}
 function render(){
  const days=Number(panel.querySelector('#insightRange').value),after=Date.now()-days*864e5,rows=read().filter(r=>r.at>=after),summary=panel.querySelector('#insightSummary');
  if(!rows.length){summary.innerHTML='<p class="insight-empty">Complete a round to begin detailed trend tracking.</p>';panel.querySelector('#trendChart').innerHTML='';panel.querySelector('#recentSessions').innerHTML='';return;}
  const avg=name=>Math.round(rows.reduce((n,r)=>n+(Number(r[name])||0),0)/rows.length);
  const bestWpm=Math.max(...rows.map(r=>r.wpm||0)),bestScore=Math.max(...rows.map(r=>r.score||0));
  summary.innerHTML='<span><strong>'+rows.length+'</strong>Rounds</span><span><strong>'+avg('accuracy')+'%</strong>Avg accuracy</span><span><strong>'+bestWpm+'</strong>Best WPM</span><span><strong>'+bestScore+'</strong>Best score</span>';
  panel.querySelector('#trendChart').innerHTML=rows.slice(-12).map(r=>'<div class="trend-column" title="'+modeName(r.mode)+': '+r.accuracy+'%"><i style="height:'+Math.max(3,r.accuracy||0)+'%"></i><small>'+String(r.mode||'?').slice(0,3).toUpperCase()+'</small></div>').join('');
  panel.querySelector('#recentSessions').innerHTML=rows.slice(-8).reverse().map(r=>'<div><strong>'+modeName(r.mode)+'</strong><span>'+r.accuracy+'% · '+r.wpm+' WPM · '+Number(r.seconds).toFixed(1)+'s</span><time>'+new Date(r.at).toLocaleDateString()+'</time></div>').join('');
 }
 panel.querySelector('#insightRange').onchange=render;
 window.KWInsights={record(event,result){
   const rows=read(),previous=[...rows].reverse().find(r=>r.mode===event.mode);
   const record={at:Date.now(),mode:event.mode,accuracy:Number(event.accuracy)||0,wpm:Number(event.wpm)||0,seconds:Number(event.seconds)||0,mistakes:Number(event.mistakes)||0,score:Number(event.score??event.metric)||0};
   rows.push(record);write(rows.slice(-120));render();
   const reward={xp:result.xp||0,coins:result.coins||0,badges:result.badges||[],daily:result.dailyCompleted||[]};
   sessionStorage.setItem('kw_last_result_extra',JSON.stringify({record,previous,reward}));
   if(window.KWFinal)window.KWFinal.checkRankUp();
   setTimeout(renderResult,0);
 },render,getHistory:read};
 function renderResult(){
  let data;try{data=JSON.parse(sessionStorage.getItem('kw_last_result_extra'));}catch(e){}if(!data)return;
  const screen=document.querySelector('#arcadeResultScreen.active,#resultScreen.active');if(!screen){setTimeout(renderResult,80);return;}
  let box=screen.querySelector('.result-upgrade-summary');if(!box){box=document.createElement('div');box.className='result-upgrade-summary';const anchor=screen.querySelector('#arcadeResultDetails,#roundComment');anchor.after(box);}
  const p=data.previous,delta=p?data.record.score-p.score:null;
  box.innerHTML='<div><strong>+'+data.reward.xp+' XP</strong><span>+'+data.reward.coins+' coins</span></div><p>'+(p?(delta>0?'▲ '+delta+' above your previous score':delta<0?'▼ '+Math.abs(delta)+' below your previous score':'Matched your previous score'):'First detailed result recorded for this mode')+'</p>'+(data.reward.badges.length?'<small>Achievement progress updated</small>':'')+(data.reward.daily.length?'<small>Daily challenge completed: '+data.reward.daily.join(', ')+'</small>':'');
 }
 const observer=new MutationObserver(()=>{if(document.getElementById('statsScreen').classList.contains('active'))render();});observer.observe(document.getElementById('statsScreen'),{attributes:true,attributeFilter:['class']});render();
})();
