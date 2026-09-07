(function(){
    'use strict';
    const phrases=[
        'Speed is useful, but accuracy wins the argument.',
        'My keyboard survived another ambitious typing session.',
        'Confidence arrives before accuracy and leaves shortly after.',
        'The quickest comeback begins with one perfectly typed sentence.',
        'Every misplaced letter is evidence in the case against your keyboard skills.',
        'A true keyboard warrior types through chaos without negotiating with the backspace key.',
        'Precision under pressure separates a loud contender from an actual typing champion.',
        'The software watched your confidence rise and immediately prepared a more complicated sentence.',
        'Congratulations on reaching the point where punctuation capitalization and composure all become mandatory.',
        'You have survived long enough to face the machine, which has unfortunately been practicing while you were away.',
        'Speed without control is simply panic wearing a pair of running shoes.',
        'The space bar has done nothing wrong, so stop taking this out on it.',
        'Apparently punctuation is the final boss of basic concentration.',
        'Your fingers submitted a strategy, but accuracy rejected the proposal.',
        'The game increased the difficulty because your ego looked comfortable.',
        'Capital letters, commas, and composure: try keeping all three.',
        'Your comeback requires precision and absolutely no convenient excuses.',
        'Every second you waste gives the game time to prepare a more personal insult.',
        'Maintain your speed while inconvenient vocabulary attacks from every direction.',
        'Hesitation, carelessness, and misplaced punctuation are now equally expensive.',
        'The machine demands precision from fingers that recently lost an argument with Backspace.',
        'Demonstrate control while this unnecessarily elaborate sentence dismantles your confidence.',
        'Your reputation depends on letters, spaces, commas, and several questionable decisions.',
        'Only a composed typist can preserve accuracy when every correction consumes momentum.',
        'The game expanded its vocabulary and scheduled your confidence for immediate deletion.',
        'Extraordinary claims about typing speed require extraordinarily accurate keyboard evidence.',
        'A suspiciously complicated sentence approaches, carrying punctuation and zero sympathy.',
        'The alphabet remembers every mistake even when your results screen politely forgets.',
        'Your confidence entered the arena several rounds before your accuracy was ready.',
        'This sentence contains enough pressure to expose every lazy habit your fingers developed.'
    ];
    const lines={slow:['Bro is typing like the keyboard owes him money.','That was not a typing speed. That was a loading screen.','Take your time. We have all day.'],mistake:['HOW DID YOU MISS THAT?','The letter was literally RIGHT THERE.','Your keyboard is innocent. Leave it alone.'],many:['At this point, autocorrect deserves a degree.','Are you typing or fighting the alphabet?'],fast:['Okay, calm down, nobody asked you to become a machine.','Oh, NOW you know where the keys are?','Stop showing off.'],perfect:['...Lucky.','Okay. That one does not count.','I refuse to acknowledge that.'],comeback:['Okay... maybe you are not completely useless.','STOP GETTING BETTER. THIS IS NOT HOW THIS WORKS.']};
    let round=1,lives=3,streak=0,meter=0,roundStarted=0,lastErrors=0,runStarted=0,roundTimer=0,timeLimit=0,lastPhrase='',bestWpm=0;
    const pick=a=>a[Math.floor(Math.random()*a.length)];
    const screen=document.createElement('section');screen.id='trashTalkScreen';screen.className='screen';
    screen.innerHTML='<div class="trash-shell"><div class="page-title">Trash Talk Mode</div><p class="page-subtitle">Three lives. Rising targets. New rules. Every tenth round is a boss.</p><div id="trashUnlock" class="trash-unlock"></div><div id="trashGame" hidden><div class="trash-hud"><div><strong id="trashRound">1</strong><span>ROUND</span></div><div><strong id="trashLives">♥♥♥</strong><span>LIVES</span></div><div><strong id="trashTier">MILD</strong><span>HOSTILITY</span></div><div><strong id="trashStreak">0×</strong><span>COMEBACK</span></div></div><div class="trash-rule" id="trashRule"></div><div class="trash-time-track"><div class="trash-time-fill" id="trashTime"></div></div><div class="comeback-track"><div class="comeback-fill" id="trashMeter"></div></div><div class="trash-roast" id="trashRoast" aria-live="polite">You can do better.</div><div class="trash-phrase" id="trashPhrase"></div><textarea class="trash-input" id="trashInput" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="The timer starts with your first key..."></textarea><div class="trash-result" id="trashResult"></div><button type="button" class="action-btn" id="trashNext" hidden>NEXT ROUND</button></div><button type="button" class="action-btn secondary-btn" id="trashExit">BACK TO CHAOS</button></div>';
    screen.querySelector('.page-title').textContent='Ego Breaker';
    document.getElementById('chaosScreen').after(screen);
    const $=id=>document.getElementById(id), input=$('trashInput');
    function unlocked(){return window.WarriorRewards&&WarriorRewards.hasUnlock('trash-talk');}
    function refreshUnlock(){const box=$('trashUnlock'),game=$('trashGame');if(unlocked()){box.hidden=true;game.hidden=false;return true;}game.hidden=true;box.hidden=false;const level=window.WarriorRewards?WarriorRewards.playerLevel():1;box.innerHTML='<h2>LOCKED</h2><p>Reach player level 5 or unlock now for 600 Key Coins.</p><p>Current level: '+level+'</p><button type="button" class="action-btn" id="buyTrashTalk">UNLOCK · 600 COINS</button>';$('buyTrashTalk').onclick=()=>{try{WarriorRewards.unlockMode('trash-talk');start();}catch(e){box.querySelector('p').textContent=e.message;}};return false;}
    function level(){return Math.min(4,Math.max(Math.floor((round-1)/3),bestWpm>=70?3:bestWpm>=55?2:0));}
    function phrase(){const min=Math.min(phrases.length-6,level()*5),pool=phrases.slice(min);let choice=pick(pool);while(pool.length>1&&choice===lastPhrase)choice=pick(pool);lastPhrase=choice;return choice;}
    function tierName(){return ['MILD','DISRESPECTFUL','PERSONAL','UNHINGED','ALMIGHTY'][level()];}
    function targetWpm(){return Math.min(80,30+(round-1)*2+(round%10===0?8:0));}
    function rule(){if(round%10===0)return 'BOSS · 97% accuracy · Forward only';if(round>=6&&round%3===0)return 'PRECISION · 95% accuracy · Forward only';if(round>=4&&round%3===1)return 'SPRINT · shortened timer · Forward only';return 'STANDARD · 92% accuracy · Forward only';}
    function newRound(){clearInterval(roundTimer);lastErrors=0;roundStarted=0;input.value='';input.disabled=false;input.classList.remove('error');$('trashResult').className='trash-result';$('trashResult').textContent='';$('trashNext').hidden=true;$('trashRound').textContent=round;$('trashLives').textContent='♥'.repeat(lives)||'0';$('trashTier').textContent=tierName();$('trashStreak').textContent=streak+'×';$('trashMeter').style.width=meter+'%';$('trashPhrase').textContent=phrase();$('trashPhrase').classList.toggle('trash-boss',round%10===0);$('trashRule').textContent=rule()+' · Target '+targetWpm()+' WPM';timeLimit=Math.max(7,($('trashPhrase').textContent.length/5)/(targetWpm()/60)*(rule().startsWith('SPRINT')?1.05:1.3));$('trashTime').style.width='100%';$('trashTime').classList.remove('danger');$('trashRoast').textContent=round%10===0?'You have survived this long. Unfortunately, I have not run out of insults.':'You can do better.';setTimeout(()=>input.focus(),80);}
    function errors(value,target){let n=Math.max(0,value.length-target.length);for(let i=0;i<Math.min(value.length,target.length);i++)if(value[i]!==target[i])n++;return n;}
    function keepCaretAtEnd(){const end=input.value.length;try{input.setSelectionRange(end,end);}catch(error){}}
    input.addEventListener('pointerdown',e=>{e.preventDefault();input.focus();keepCaretAtEnd();});
    input.addEventListener('click',keepCaretAtEnd);
    input.addEventListener('select',keepCaretAtEnd);
    input.addEventListener('beforeinput',e=>{const kind=e.inputType||'',end=input.value.length,revises=kind.indexOf('delete')===0||kind==='historyUndo'||kind==='historyRedo',replaces=input.selectionStart!==end||input.selectionEnd!==end;if(revises||replaces){e.preventDefault();keepCaretAtEnd();$('trashRoast').textContent='No edits. Every typo stays on your record.';}});
    input.addEventListener('keydown',e=>{const navigation=['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End','PageUp','PageDown'],command=(e.ctrlKey||e.metaKey)&&['a','x','z','y'].includes(e.key.toLowerCase());if(e.key==='Backspace'||e.key==='Delete'||navigation.includes(e.key)||command){e.preventDefault();keepCaretAtEnd();$('trashRoast').textContent='Backspace left the chat. Live with your choices.';}});
    input.addEventListener('cut',e=>{e.preventDefault();keepCaretAtEnd();});
    input.addEventListener('paste',e=>{e.preventDefault();$('trashRoast').textContent='Paste? The game asked you to type.';});
    function tick(){const left=Math.max(0,timeLimit-(performance.now()-roundStarted)/1000),pct=left/timeLimit*100;$('trashTime').style.width=pct+'%';$('trashTime').classList.toggle('danger',pct<25);if(left<=0)lose('TIME EXPIRED · That sentence aged better than your attempt.');}
    input.addEventListener('input',()=>{if(!roundStarted){roundStarted=performance.now();if(!runStarted)runStarted=Date.now();roundTimer=setInterval(tick,100);}const target=$('trashPhrase').textContent,e=errors(input.value,target);if(e>lastErrors){$('trashRoast').textContent=pick(e>=4?lines.many:lines.mistake);input.classList.remove('error');void input.offsetWidth;input.classList.add('error');}lastErrors=e;if(input.value.length>=target.length)finish(target,e);});
    function finish(target,e){clearInterval(roundTimer);input.disabled=true;const secs=Math.max(.2,(performance.now()-roundStarted)/1000),wpm=Math.round((target.length/5)/(secs/60)),accuracy=Math.max(0,Math.round((target.length-e)/target.length*100)),required=rule().includes('97%')?97:rule().includes('95%')?95:92,strong=accuracy>=required&&wpm>=targetWpm(),perfect=e===0;bestWpm=Math.max(bestWpm,wpm);if(!strong){lose('ROUND LOST · '+accuracy+'% accuracy · '+wpm+' WPM',false);return;}streak++;meter=Math.min(100,meter+25);$('trashRoast').textContent=streak>=5?lines.comeback[1]:perfect?pick(lines.perfect):wpm>=65?pick(lines.fast):lines.comeback[0];$('trashStreak').textContent=streak+'×';$('trashMeter').style.width=meter+'%';$('trashResult').textContent=(round%10===0?'BOSS DEFEATED · ...I need a moment. · ':'COMEBACK! · ')+accuracy+'% · '+wpm+' WPM';$('trashNext').textContent='NEXT ROUND';$('trashNext').onclick=()=>{round++;newRound();};$('trashNext').hidden=false;}
    function lose(message,disable=true){clearInterval(roundTimer);if(disable)input.disabled=true;lives--;streak=0;meter=Math.max(0,meter-25);$('trashLives').textContent='♥'.repeat(lives)||'0';$('trashStreak').textContent='0×';$('trashMeter').style.width=meter+'%';$('trashResult').className='trash-result failed';$('trashResult').textContent=(round%10===0?'BOSS WINS · ':'')+message;$('trashRoast').textContent=pick(lines.many);$('trashNext').textContent=lives>0?'RETRY ROUND':'START NEW RUN';$('trashNext').onclick=lives>0?newRound:start;$('trashNext').hidden=false;}
    function start(){if(!refreshUnlock())return;round=1;lives=3;streak=0;meter=0;bestWpm=0;lastPhrase='';runStarted=Date.now();newRound();showScreen('trashTalkScreen');}
    function exitMode(){clearInterval(roundTimer);if(runStarted&&round>1&&window.awardWarriorRewards)awardWarriorRewards({id:'trash-talk:'+runStarted,mode:'trash-talk',seconds:Math.max(3,(Date.now()-runStarted)/1000),units:round-1,metric:round-1,accuracy:100,mistakes:0,wpm:bestWpm});runStarted=0;showScreen('chaosScreen');}
    $('trashNext').onclick=()=>{round++;newRound();};$('trashExit').onclick=exitMode;
    window.openTrashTalkMode=function(){if(unlocked())start();else{refreshUnlock();showScreen('trashTalkScreen');}};
})();
