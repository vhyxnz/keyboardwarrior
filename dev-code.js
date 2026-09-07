(function(){
    'use strict';
    const version=document.getElementById('appVersion');
    if(!version)return;
    let taps=0;
    const dialog=document.createElement('dialog');
    dialog.id='developerCodeDialog';dialog.className='developer-code-dialog';dialog.setAttribute('aria-labelledby','developerCodeTitle');
    dialog.innerHTML='<form method="dialog"><button class="developer-code-close" value="cancel" aria-label="Close">×</button><h2 id="developerCodeTitle">Developer Code</h2><p>Enter a developer code.</p><input id="developerCodeInput" type="text" autocomplete="off" autocapitalize="characters" spellcheck="false" aria-label="Developer code"><p id="developerCodeStatus" role="status"></p><button type="submit" class="action-btn" value="submit">RUN CODE</button></form>';
    document.body.appendChild(dialog);
    const input=document.getElementById('developerCodeInput'),status=document.getElementById('developerCodeStatus');
    function open(){taps=0;input.value='';status.textContent='';if(!dialog.open)dialog.showModal();setTimeout(()=>input.focus(),50);}
    function tap(){taps++;if(taps>=21)open();}
    version.setAttribute('role','button');version.setAttribute('tabindex','0');version.setAttribute('aria-label','App version');version.addEventListener('click',tap);
    version.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();tap();}});
    dialog.querySelector('form').addEventListener('submit',event=>{event.preventDefault();const code=input.value.trim().toUpperCase();if(code==='QUARTERPOUNDER'&&window.WarriorRewards&&WarriorRewards.grantCoins(100)){status.textContent='Accepted · 100 Key Coins added.';setTimeout(()=>dialog.close(),650);}else{status.textContent='Invalid developer code.';input.select();}});
})();
