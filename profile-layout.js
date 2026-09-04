(function () {
    'use strict';
    const screen=document.getElementById('statsScreen');
    const editor=screen.querySelector('.profile-editor');
    const edit=document.createElement('details');edit.className='profile-edit-disclosure';
    const summary=document.createElement('summary');summary.textContent='Edit profile';edit.appendChild(summary);
    editor.before(edit);edit.appendChild(editor);

    const tabs=document.createElement('div');tabs.className='profile-tabs';tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','Profile sections');edit.after(tabs);
    const sections=[['progress','Progress'],['badges','Badges'],['stats','Stats'],['card','Card']];
    const panels={}, buttons={};
    sections.forEach(([id,label])=>{
        const button=document.createElement('button');button.type='button';button.id='profile-tab-'+id;button.textContent=label;button.setAttribute('role','tab');button.setAttribute('aria-controls','profile-pane-'+id);buttons[id]=button;tabs.appendChild(button);
        const panel=document.createElement('section');panel.id='profile-pane-'+id;panel.className='profile-pane';panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby',button.id);panel.tabIndex=0;panels[id]=panel;screen.appendChild(panel);
        button.addEventListener('click',()=>select(id));
        button.addEventListener('keydown',event=>{
            const index=sections.findIndex(s=>s[0]===id);let next;
            if(event.key==='ArrowRight')next=(index+1)%sections.length;
            else if(event.key==='ArrowLeft')next=(index+sections.length-1)%sections.length;
            else if(event.key==='Home')next=0;
            else if(event.key==='End')next=sections.length-1;
            else return;
            event.preventDefault();select(sections[next][0]);buttons[sections[next][0]].focus();
        });
    });
    const rewards=screen.querySelector('.reward-panel');
    const badges=document.getElementById('rewardBadges');
    const badgeHelp=badges.previousElementSibling;
    panels.badges.append(badgeHelp,badges,document.getElementById('badgeDetails'));
    panels.progress.appendChild(rewards);
    panels.stats.append(screen.querySelector('.overall-stats-grid'),screen.querySelector('.mode-stat-section'));
    panels.card.append(screen.querySelector('.share-card'),document.getElementById('imagePreviewCard'));
    function select(id) {
        sections.forEach(([key])=>{
            const active=key===id;buttons[key].setAttribute('aria-selected',String(active));buttons[key].tabIndex=active?0:-1;panels[key].hidden=!active;
        });
    }
    select('progress');
})();
