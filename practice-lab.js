(function(){
 'use strict';
 const drills={
  weak:{name:'Weak Letters',text:'focus accuracy practice rhythm quick brown fox jumps over lazy dogs'},
  spelling:{name:'Common Words',text:'because separate definitely receive necessary occurrence rhythm maintenance'},
  symbols:{name:'Numbers & Symbols',text:'2026 @home #practice 50% faster email@example.com $24.99 (ready?)'},
  english:{name:'English Vocabulary',text:'curious resilient deliberate momentum precise adaptable confident'},
  filipino:{name:'Filipino Vocabulary',text:'pagsasanay kasanayan katumpakan bilis tiyaga tagumpay mandirigma'}
 };
 let target='',started=0,errors={},active='weak';
 const screen=document.createElement('section');screen.id='practiceLabScreen';screen.className='screen';
 screen.innerHTML='<div class="practice-shell"><div class="profile-kicker">TRAIN WITHOUT PRESSURE</div><h1 class="page-title">Practice Lab</h1><p class="page-subtitle">Build accuracy with focused drills or your own text. Practice does not affect rank.</p><div class="practice-types" id="practiceTypes"></div><label class="practice-custom">Custom text<textarea id="practiceCustom" maxlength="600" placeholder="Paste or write something you want to practice…"></textarea></label><button class="action-btn secondary-btn" id="practiceUseCustom">USE CUSTOM TEXT</button><div class="practice-prompt" id="practicePrompt"></div><textarea id="practiceInput" class="practice-input" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" placeholder="Start typing here…"></textarea><div class="practice-metrics"><span><strong id="practiceAccuracy">100%</strong>Accuracy</span><span><strong id="practiceWpm">0</strong>WPM</span><span><strong id="practiceErrors">0</strong>Errors</span></div><div class="practice-feedback" id="practiceFeedback" aria-live="polite"></div><div class="practice-actions"><button class="action-btn" id="practiceRestart">RESTART DRILL</button><button class="action-btn secondary-btn" id="practiceBack">BACK TO MODES</button></div></div>';
 document.querySelector('.app').append(screen);
 const types=screen.querySelector('#practiceTypes');
 Object.entries(drills).forEach(([id,d])=>{const b=document.createElement('button');b.type='button';b.className='practice-type';b.textContent=d.name;b.dataset.id=id;b.onclick=()=>load(id);types.append(b);});
 const modeCard=document.createElement('button');modeCard.type='button';modeCard.className='option practice-entry';modeCard.innerHTML='<span class="practice-entry-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M5 4h14v16H5zM8 8h8M8 12h5M8 16h7"/><path d="m17 2 3 3-3 3"/></svg></span><strong>Practice Lab</strong><span>Train weak letters, vocabulary, symbols, or your own text.</span>';
 modeCard.onclick=()=>{load(active);showScreen('practiceLabScreen');setTimeout(()=>screen.querySelector('#practiceInput').focus(),100);};
 const chaos=document.getElementById('chaosOption'),chaosHeading=[...document.querySelectorAll('#modeScreen h2')].find(h=>h.textContent.trim()==='Chaos Mode');
 const block=document.createElement('section');block.className='practice-entry-block';block.innerHTML='<h2>Practice</h2><p>Focused training that never changes your rank.</p>';block.append(modeCard);
 chaosHeading.parentNode.insertBefore(block,chaosHeading);
 const input=screen.querySelector('#practiceInput'),prompt=screen.querySelector('#practicePrompt');
 function weakText(){try{const saved=JSON.parse(localStorage.getItem('kw_weak_letters')||'{}'),letters=Object.entries(saved).sort((a,b)=>b[1]-a[1]).slice(0,5).map(x=>x[0]).filter(x=>/^[a-z]$/i.test(x));return letters.length?letters.map(x=>x+' '+x+' '+x).join(' ')+' focus accuracy practice rhythm':drills.weak.text;}catch(e){return drills.weak.text;}}
 function load(id,text){active=id;target=(text||(id==='weak'?weakText():drills[id].text)).trim();started=0;errors={};input.value='';prompt.textContent=target;screen.querySelector('#practiceFeedback').textContent='';types.querySelectorAll('button').forEach(b=>b.classList.toggle('selected',b.dataset.id===id));update();}
 function update(){
  const value=input.value;if(value&&!started)started=Date.now();let wrong=0;
  [...value].forEach((c,i)=>{if(c!==target[i]){wrong++;errors[target[i]||'?']=(errors[target[i]||'?']||0)+1;}});
  const elapsed=Math.max(1,(Date.now()-started)/60000),correct=Math.max(0,value.length-wrong);
  screen.querySelector('#practiceAccuracy').textContent=(value.length?Math.round(correct/value.length*100):100)+'%';screen.querySelector('#practiceWpm').textContent=started?Math.round(correct/5/elapsed):0;screen.querySelector('#practiceErrors').textContent=wrong;
  prompt.innerHTML=[...target].map((c,i)=>'<span class="'+(i<value.length?(value[i]===c?'right':'wrong'):i===value.length?'current':'')+'">'+(c===' '?' ':c.replace(/[&<>]/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[x])))+'</span>').join('');
  if(value===target){const weak=Object.entries(errors).sort((a,b)=>b[1]-a[1]).slice(0,3).map(x=>x[0]).join(', ');screen.querySelector('#practiceFeedback').textContent='Drill complete!'+(weak?' Review: '+weak:' Perfect accuracy.');try{const saved=JSON.parse(localStorage.getItem('kw_weak_letters')||'{}');Object.entries(errors).forEach(([c,n])=>{if(/^[a-z]$/i.test(c))saved[c]=(saved[c]||0)+n;});localStorage.setItem('kw_weak_letters',JSON.stringify(saved));}catch(e){}}
 }
 input.addEventListener('input',update);screen.querySelector('#practiceRestart').onclick=()=>{load(active,target);input.focus();};screen.querySelector('#practiceBack').onclick=showModeScreen;
 screen.querySelector('#practiceUseCustom').onclick=()=>{const value=screen.querySelector('#practiceCustom').value.trim();if(value){load('custom',value);input.focus();}};
 load('weak');
})();
