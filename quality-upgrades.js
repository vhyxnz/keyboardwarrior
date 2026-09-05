(function(){
    'use strict';
    const storageKey='kw_accessibility';
    let prefs={reducedMotion:false,largeText:false,highContrast:false};
    try{prefs=Object.assign(prefs,JSON.parse(localStorage.getItem(storageKey)||'{}'));}catch(error){}
    function apply(){
        const root=document.documentElement;
        Object.keys(prefs).forEach(name=>root.classList.toggle('kw-'+name.replace(/[A-Z]/g,m=>'-'+m.toLowerCase()),!!prefs[name]));
    }
    const settings=document.getElementById('settingsScreen');
    if(settings){
        const panel=document.createElement('div');panel.className='setting quality-settings';
        panel.innerHTML='<div class="setting-title">Accessibility</div><div class="setting-description">Adjust motion, readability, and contrast.</div>';
        [['reducedMotion','Reduced motion'],['largeText','Larger text'],['highContrast','High contrast']].forEach(([id,label])=>{
            const row=document.createElement('label');row.className='quality-toggle';
            const text=document.createElement('span');text.textContent=label;
            const input=document.createElement('input');input.type='checkbox';input.checked=!!prefs[id];
            input.addEventListener('change',()=>{prefs[id]=input.checked;localStorage.setItem(storageKey,JSON.stringify(prefs));apply();});
            row.append(text,input);panel.append(row);
        });
        settings.querySelector('.version-setting').before(panel);
    }
    const details=document.getElementById('arcadeResultDetails');
    if(details){
        const coach=document.createElement('div');coach.className='result-coach';coach.setAttribute('aria-live','polite');details.after(coach);
        new MutationObserver(()=>{
            const mode=document.getElementById('arcadeResultTitle').textContent;
            const accuracy=Number((details.textContent.match(/(\d+)%/)||[])[1]||0);
            if(mode==='Ghost Race') coach.textContent=/new best|faster ghost|defeated/i.test(details.textContent)?'COACH TIP · You beat the ghost. Keep a smooth rhythm to lower the record again.':'COACH TIP · Race the phrase, not the cursor—keep an even rhythm and avoid corrections.';
            else if(mode==='Typing Survival') coach.textContent=accuracy>=90?'COACH TIP · Clean run. Read the next word as soon as it appears.':'COACH TIP · Prioritize accuracy; one correction costs less time than losing a life.';
            else coach.textContent=accuracy>=90?'COACH TIP · Excellent defense. Start tracking the next-lowest target early.':accuracy>=70?'COACH TIP · Track the lowest matching target before completing the word.':'COACH TIP · Clear a bad prefix early and prioritize words closest to the base.';
        }).observe(details,{childList:true,characterData:true,subtree:true});
    }
    document.addEventListener('visibilitychange',()=>{
        if(document.hidden && typeof arcadeActive!=='undefined' && arcadeActive && !arcadePaused && arcadeLastMode!=='ghostrace') toggleArcadePause();
    });
    apply();
})();
