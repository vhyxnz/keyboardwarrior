(function() {
    'use strict';
    const screen=document.getElementById('chaosScreen');
    const title=screen.querySelector('.page-title'), subtitle=screen.querySelector('.page-subtitle');
    const hero=document.createElement('header');hero.className='chaos-hero';title.before(hero);
    const label=document.createElement('div');label.className='chaos-eyebrow';label.textContent='THE UNSTABLE SIDE OF TYPING';
    hero.append(label,title,subtitle);subtitle.textContent='Four modes. Zero chill. Pick your kind of trouble.';
    const sticker=document.createElement('span');sticker.className='chaos-sticker';sticker.textContent='!@#$';sticker.setAttribute('aria-hidden','true');hero.appendChild(sticker);
    const designs=[
        {key:'curse',name:'Curse Mode',tag:'SOLO · STACKING CURSES',slogan:'Your backspace called. It quit.',path:'<path d="M28 51V36a22 22 0 0 1 44 0v32l-11-6-11 8-11-8-11 6z"/><path d="m36 35 8 5-8 5m28-10-8 5 8 5M43 54h14M18 14l-6 10h10l-5 10m64 17-6 10h10l-5 10"/>'},
        {key:'roast',name:'Roast Battle',tag:'2 PLAYERS · PASS & PLAY',slogan:'Bring a friend. Leave with a roast.',path:'<path d="M31 65c-21-22 0-37 7-48 0 18 17 15 12 31 13-5 13-19 13-19 23 28 8 46-11 47-10 0-16-3-21-11z"/><path d="M40 64c-6-9 4-16 6-21 1 9 13 11 10 21M12 33l-5-6m69-11 6-7m-4 62 8 3"/>'},
        {key:'mirror',name:'Mirror Match',tag:'2 PLAYERS · LIVE RACE',slogan:'One screen. Two egos. One winner.',path:'<path d="M12 17h29v53H12zm47 0h29v53H59zM47 9h6v72"/><path d="m19 31 15-7m-15 21 15-7m32-7 15-7m-15 21 15-7M22 59h9m38 0h9"/>'},
        {key:'treasure',name:'Cursed Treasure',tag:'SOLO · RISK & REWARD',slogan:'More treasure. Worse decisions.',path:'<path d="M17 39V28c0-10 66-10 66 0v11M17 39h66v36H17zM34 22v17m32-17v17M17 52h24m18 0h24M41 45h18v19H41z"/><path d="m51 5 3 7 7 3-7 3-3 7-3-7-7-3 7-3M8 52l-4 5m85-30 6-3"/>'}
    ];
    screen.querySelectorAll('.mode-card').forEach((card,index)=>{
        const design=designs[index];if(!design)return;
        card.classList.add('chaos-card');card.dataset.chaos=design.key;
        const heading=card.querySelector('h2');heading.textContent=design.name;
        const art=document.createElement('div');art.className='chaos-art';art.setAttribute('aria-hidden','true');
        art.innerHTML='<svg viewBox="0 0 100 90" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">'+design.path+'</svg>';
        const info=document.createElement('div');info.className='chaos-card-head';
        const tag=document.createElement('span');tag.className='chaos-mode-tag';tag.textContent=design.tag;
        const slogan=document.createElement('div');slogan.className='chaos-slogan';slogan.textContent=design.slogan;
        heading.before(info);info.append(tag,heading,slogan);card.prepend(art);
        const button=card.querySelector('button');const arrow=document.createElement('span');arrow.className='chaos-start-arrow';arrow.textContent='↗';arrow.setAttribute('aria-hidden','true');button.appendChild(arrow);
    });
    const choices=[
        ['friendlyOption','mint','<circle cx="12" cy="12" r="9"/><path d="M8 9h.01M16 9h.01M7.5 14a5 5 0 0 0 9 0"/>'],
        ['almightyOption','flame','<path d="m3 7 4 4 5-7 5 7 4-4-2 12H5zM7 22h10"/>'],
        ['easyOption','mint','<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6z"/><path d="m8 12 3 3 5-6"/>'],
        ['mediumOption','gold','<path d="m13 3-9 11h7l-1 7 10-12h-7z"/>'],
        ['noMercyOption','pink','<circle cx="12" cy="13" r="8"/><path d="M9 2h6m-3 3V2m6 5 2-2M12 9v5l3 2"/>']
    ];
    choices.forEach(([id,tone,path])=>{
        const option=document.getElementById(id);option.classList.add('battle-choice');option.dataset.tone=tone;
        const icon=document.createElement('div');icon.className='battle-choice-icon';icon.setAttribute('aria-hidden','true');icon.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'+path+'</svg>';option.prepend(icon);
    });
})();
