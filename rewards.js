(function() {
    'use strict';
    const engine = RewardEngine;
    let state = engine.fresh();
    let toastTimer;
    function read() {
        try { return engine.normalize(JSON.parse(localStorage.getItem('kw_rewards'))); }
        catch(error) { return engine.fresh(); }
    }
    function commit(next) {
        // Persist before updating the UI; failed purchases cannot spend coins in memory.
        if (currentAppProfile !== 'guest') localStorage.setItem('kw_rewards', JSON.stringify(next));
        state = next;
    }
    function notify(message) {
        const el = document.getElementById('rewardNotice');
        el.textContent = message;
        el.hidden = false;
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => { el.hidden = true; }, 6000);
    }
    function itemFor(category) { return engine.catalog.find(i => i.id === state.equipped[category]); }
    function owns(id) { return state.owned.includes(id); }
    function invalidateCard() {
        generatedCanvas = null;
        generatedImageData = '';
        const preview = document.getElementById('imagePreviewCard');
        if (preview) preview.classList.remove('show');
    }

    const profileCard = document.querySelector('#statsScreen .profile-card');
    const banner = document.createElement('div');
    banner.id = 'warriorBanner';
    banner.className = 'warrior-banner';
    banner.innerHTML = '<div id="bannerCoins" class="banner-coins" role="status" aria-label="0 Key Coins"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="6"/><path d="M10 8v8m5-8-5 4 5 4"/></svg><b id="bannerCoinBalance">0</b></div><strong id="bannerPlayerLevel">LEVEL 1</strong>';
    profileCard.before(banner);
    const title = document.createElement('div');
    title.id = 'warriorTitle';
    title.className = 'warrior-title';
    profileCard.querySelector('.profile-info').appendChild(title);

    const panel = document.createElement('section');
    panel.className = 'reward-panel';
    panel.setAttribute('aria-label', 'Warrior rewards');
    panel.innerHTML = '<div class="reward-heading"><h2>Warrior Rewards</h2><span id="rewardSessionLabel"></span></div><div class="reward-wallet"><div><strong id="rewardLevel">1</strong><span>PLAYER LEVEL</span></div><div><strong id="rewardCoins">0</strong><span>KEY COINS</span></div><div><strong id="rewardXP">0</strong><span>TOTAL XP</span></div></div><progress id="rewardProgress" max="100" value="0" aria-label="Progress to next player level"></progress><p id="rewardProgressLabel"></p><div class="reward-badges" id="rewardBadges"></div><button type="button" class="action-btn" id="openCosmeticShop">COSMETIC SHOP</button><details class="reward-rules"><summary>How to earn rewards</summary><p>Qualifying rounds earn 20 XP + 10 Key Coins. A new personal best adds 10 XP + 5 coins. Every 10 rewarded rounds adds 25 XP + 25 coins. Each new badge grants 20 coins.</p><p>Every 100 XP raises your player level. Your skill-based rank is unchanged. A run must last at least 3 seconds and include successful typing; quitting an unfinished phrase does not count.</p><p>Rewards start from new rounds played with this update. Existing stats are kept. Guest rewards are temporary; Warrior rewards are included in data backups.</p></details>';
    document.querySelector('#statsScreen .profile-editor').after(panel);
    panel.querySelector('#openCosmeticShop').addEventListener('click', openShop);
    panel.querySelector('#openCosmeticShop').innerHTML='<svg class="kw-shop-icon" viewBox="0 0 32 32" fill="none" aria-hidden="true"><rect x="2" y="2" width="28" height="28" rx="7" stroke="currentColor" stroke-width="2"/><path d="M5 24h22" stroke="currentColor" stroke-width="1.5"/><text x="16" y="20" text-anchor="middle" fill="currentColor" font-family="Arial,sans-serif" font-weight="900" font-size="12">KW</text></svg><span>Shop</span>';
    const achievementHelp=document.createElement('p');achievementHelp.className='reward-rules';
    achievementHelp.textContent='Achievements · Tap a badge for details';
    document.getElementById('rewardBadges').before(achievementHelp);
    const dailyPanel=document.createElement('section');dailyPanel.className='daily-panel';dailyPanel.setAttribute('aria-label','Daily challenges');
    dailyPanel.innerHTML='<h3>Daily Challenges</h3><p id="dailyReset" class="reward-rules"></p><div id="dailyTasks"></div><details class="daily-rules"><summary>Challenge rules</summary><p>Tap a challenge for its goal. Only qualifying rounds finished today count (at least 3 seconds with successful typing). Rewards are credited automatically once per challenge. No reward multiplier affects these payouts. Guest progress lasts for this session only.</p></details>';
    document.getElementById('rewardBadges').after(dailyPanel);
    let selectedBadge = null;
    const badgeDetails=document.createElement('section');badgeDetails.id='badgeDetails';badgeDetails.className='badge-details';badgeDetails.hidden=true;badgeDetails.setAttribute('aria-label','Achievement details');
    document.getElementById('rewardBadges').after(badgeDetails);
    const badgeIcons = {
        first:'<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9z"/>',
        survivor:'<path d="M20.8 4.8a5.5 5.5 0 0 0-7.8 0L12 6l-1-1.2a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.4a5.5 5.5 0 0 0 0-7.8Z"/><path d="M3 12h5l2-4 4 8 2-4h5"/>',
        ghost:'<path d="M5 21V10a7 7 0 0 1 14 0v11l-3-2-4 2-4-2z"/><path d="M9 10v2m6-2v2"/>',
        combo:'<path d="m13 2-9 12h7l-1 8 10-13h-8z"/>',
        defender:'<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6z"/><path d="m8 12 3 3 5-6"/>',
        veteran:'<path d="M8 3h8v6a4 4 0 0 1-8 0zM8 5H4v3a4 4 0 0 0 4 4m8-7h4v3a4 4 0 0 1-4 4M12 13v6m-5 2h10m-8-2h6"/>'
    };
    function renderBadges() {
        const list=document.getElementById('rewardBadges');list.replaceChildren();
        engine.badges.forEach(badge=>{
            const view=engine.badgeView(state,badge), tier=view.current;
            const unlocked=state.badges.includes(badge.id), selected=selectedBadge===badge.id;
            const button=document.createElement('button');button.type='button';button.className='reward-badge'+(unlocked?' unlocked':'')+(selected?' selected':'');
            if(tier)button.dataset.tier=tier.name.toLowerCase();
            button.setAttribute('aria-expanded',String(selected));button.setAttribute('aria-controls','badgeDetails');button.setAttribute('aria-label',badge.name+' — '+(tier?tier.name:unlocked?'Earned':'Locked')+'. Show unlock details');
            button.innerHTML='<span class="achievement-emblem"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+badgeIcons[badge.id]+'</svg></span>';
            const name=document.createElement('strong');name.textContent=badge.name;
            const status=document.createElement('small');status.textContent=tier?tier.name.toUpperCase():unlocked?'EARNED':'LOCKED';button.append(name,status);
            button.addEventListener('click',()=>{selectedBadge=selected?null:badge.id;renderBadges();list.children[engine.badges.indexOf(badge)].focus({preventScroll:true});});list.appendChild(button);
        });
        const badge=engine.badges.find(b=>b.id===selectedBadge);badgeDetails.hidden=!badge;badgeDetails.replaceChildren();
        if(!badge)return;
        const heading=document.createElement('strong');heading.textContent=badge.name;
        const close=document.createElement('button');close.type='button';close.className='badge-details-close';close.textContent='×';close.setAttribute('aria-label','Close achievement details');
        close.addEventListener('click',()=>{const index=engine.badges.indexOf(badge);selectedBadge=null;renderBadges();list.children[index].focus({preventScroll:true});});
        const description=document.createElement('p');description.textContent=badge.description;
        const reward=document.createElement('small');reward.textContent=state.badges.includes(badge.id)?'Earned · 20 Key Coins awarded':'Reward: 20 Key Coins · Awarded once';
        const rule=document.createElement('p');rule.className='badge-qualifier';rule.textContent='Checked when a round ends: at least 3 seconds with successful typing.';
        badgeDetails.append(heading,close,description,reward,rule);
        if(badge.tiers){
            const view=engine.badgeView(state,badge);
            description.textContent='Goal: '+view.unit+'.';
            reward.textContent='20 Key Coins per tier · Each awarded once';
            const levels=document.createElement('div');levels.className='badge-tier-list';
            view.levels.forEach(t=>{
                const row=document.createElement('div');row.className='badge-tier-row';row.dataset.tier=t.name.toLowerCase();
                const label=document.createElement('span');label.textContent=t.name+' · '+(t.earned?'Earned':Math.min(Math.floor(view.value),t.goal)+' / '+t.goal);
                const meter=document.createElement('progress');meter.max=t.goal;meter.value=t.earned?t.goal:Math.min(view.value,t.goal);meter.setAttribute('aria-label',t.name+' progress');
                const goal=document.createElement('small');goal.textContent=t.goal+' '+view.unit;
                row.append(label,goal,meter);levels.append(row);
            });
            rule.before(levels);
        }
    }

    const dialog = document.createElement('dialog');
    dialog.id = 'cosmeticShop';
    dialog.className = 'cosmetic-shop';
    dialog.setAttribute('aria-labelledby', 'shopTitle');
    dialog.innerHTML = '<div class="shop-heading"><div><h2 id="shopTitle">Warrior Shop</h2><p id="shopBalance"></p></div><button type="button" class="shop-close" aria-label="Close shop">×</button></div><p class="shop-help">Cosmetics only—no stat boosts or locked gameplay.</p><label class="shop-filter-label" for="shopCategory">Browse cosmetics</label><select id="shopCategory"><option value="all">All cosmetics</option><option value="frame">Avatar frames</option><option value="avatar">Collectible avatars</option><option value="card">Profile cards</option><option value="banner">Profile banners</option><option value="title">Profile titles</option><option value="hit">Defense hit effects</option><option value="trail">Defense trails</option><option value="base">Defense bases</option><option value="ghost">Ghost colors</option><option value="lane">Race lanes</option></select><p id="shopStatus" role="status"></p><div id="shopItems" class="shop-grid"></div>';
    document.body.appendChild(dialog);
    dialog.querySelector('.shop-close').addEventListener('click', () => dialog.close());
    dialog.querySelector('#shopCategory').addEventListener('change', renderShop);
    const notice = document.createElement('div');
    notice.id = 'rewardNotice';
    notice.className = 'reward-notice';
    notice.setAttribute('role', 'status');
    notice.hidden = true;
    document.body.appendChild(notice);

    function openShop() {
        document.getElementById('shopStatus').textContent = '';
        renderShop();
        if (!dialog.open) dialog.showModal();
    }
    function renderShop() {
        document.getElementById('shopBalance').textContent = state.coins + ' Key Coins' + (currentAppProfile === 'guest' ? ' · Guest session' : '');
        const filter = document.getElementById('shopCategory').value;
        const container = document.getElementById('shopItems');
        container.replaceChildren();
        engine.catalog.filter(i => filter === 'all' || i.category === filter).forEach(item => {
            const card = document.createElement('article');
            card.className = 'shop-item';
            const preview = document.createElement('button');
            preview.type='button';preview.setAttribute('aria-label','Enlarge '+item.name+' preview');preview.setAttribute('aria-expanded','false');
            preview.addEventListener('click',()=>{const expanded=card.classList.toggle('preview-expanded');preview.setAttribute('aria-expanded',String(expanded));});
            preview.className = 'shop-preview shop-preview-' + item.category;
            preview.style.setProperty('--preview-color', item.color);
            preview.textContent = item.symbol || (item.category === 'title' ? 'Aa' : item.category === 'avatar' ? 'KW' : '✦');
            if (item.category === 'banner') { preview.textContent = ''; preview.style.backgroundImage = 'url("./' + item.id + '.svg")'; preview.setAttribute('aria-label', 'Enlarge '+item.name+' preview: '+item.description); }
            preview.dataset.cosmetic=item.id;
            if(['avatar','frame'].includes(item.category)) {
                preview.textContent='';const art=document.createElement('img');art.src=CosmeticArt.image(item.id);art.alt=item.name+' design';preview.appendChild(art);
            } else if(item.category==='card') {
                preview.textContent='';const canvas=document.createElement('canvas');canvas.width=180;canvas.height=110;const c=canvas.getContext('2d');c.fillStyle='#141722';c.fillRect(0,0,180,110);CosmeticArt.card(c,item.value,180,110);c.fillStyle='#e6edf9';c.font='bold 12px Arial';c.fillText(item.name.toUpperCase(),12,33);c.globalAlpha=.55;[49,65,81].forEach(y=>c.fillRect(12,y,100,4));preview.appendChild(canvas);
            } else if(item.category!=='banner') {
                preview.textContent='';const sample=document.createElement('span');sample.className='cosmetic-sample cosmetic-sample-'+item.category;
                sample.textContent=item.category==='title'?item.name:item.category==='base'?'BASE':item.category==='trail'?'word':'';preview.appendChild(sample);
            }
            const heading = document.createElement('h3');
            heading.textContent = item.name;
            const description = document.createElement('p');
            description.textContent = item.description;
            const button = document.createElement('button');
            button.type = 'button';
            const equipped = item.category === 'card' ? owns(item.id) && profileCardStyle === item.value : state.equipped[item.category] === item.id;
            button.textContent = equipped ? 'EQUIPPED' : owns(item.id) ? 'EQUIP' : item.cost + ' COINS · BUY & EQUIP';
            button.disabled = equipped || (!owns(item.id) && state.coins < item.cost);
            button.addEventListener('click', () => purchaseAndEquip(item));
            card.append(preview, heading, description, button);
            if (equipped) {
                const reset = document.createElement('button');
                reset.type = 'button';
                reset.className = 'shop-reset';
                reset.textContent = item.category === 'avatar' ? 'USE DEFAULT AVATAR' : 'USE DEFAULT';
                reset.addEventListener('click', () => {
                    try {
                        const next = engine.normalize(state);
                        delete next.equipped[item.category];
                        commit(next);
                        if (item.category === 'card') selectProfileCardStyle('classic');
                        if (item.category === 'avatar') resetProfileAvatar();
                        invalidateCard(); render();
                    } catch(error) { document.getElementById('shopStatus').textContent = 'Could not save this change. Please check device storage.'; }
                });
                card.appendChild(reset);
            }
            container.appendChild(card);
        });
    }
    function purchaseAndEquip(item) {
        try {
            commit(engine.equip(engine.purchase(state, item.id), item.id));
            if (item.category === 'avatar') { applyCollectibleAvatar(item); updateProfileDisplay(); }
            if (item.category === 'card') selectProfileCardStyle(item.value);
            invalidateCard();
            render();
            document.getElementById('shopStatus').textContent = item.name + ' equipped.';
        } catch(error) {
            document.getElementById('shopStatus').textContent = error.message === 'Not enough Key Coins yet.' ? error.message : 'Could not finish this change. Check device storage; owned items can be equipped again without charge.';
        }
    }
    function render() {
        const level = 1 + Math.floor(state.xp / 100);
        document.getElementById('rewardLevel').textContent = level;
        document.getElementById('rewardCoins').textContent = state.coins;
        document.getElementById('bannerCoinBalance').textContent = state.coins.toLocaleString();
        document.getElementById('bannerCoins').setAttribute('aria-label', state.coins.toLocaleString() + ' Key Coins');
        document.getElementById('rewardXP').textContent = state.xp;
        document.getElementById('rewardProgress').value = state.xp % 100;
        document.getElementById('rewardProgressLabel').textContent = (100 - state.xp % 100) + ' XP to level ' + (level + 1);
        document.getElementById('rewardSessionLabel').textContent = currentAppProfile === 'guest' ? 'SESSION ONLY' : 'SAVED PROFILE';
        document.getElementById('bannerPlayerLevel').textContent = 'LEVEL ' + level;
        renderBadges();
        const root = document.documentElement;
        const frame = itemFor('frame'), ghost = itemFor('ghost');
        let frameArt=document.getElementById('equippedFrameArt');
        if(frame && !frameArt){frameArt=document.createElement('img');frameArt.id='equippedFrameArt';frameArt.alt='';frameArt.className='equipped-frame-art';document.getElementById('profileAvatarButton').appendChild(frameArt);}
        if(frameArt){frameArt.hidden=!frame;if(frame)frameArt.src=CosmeticArt.image(frame.id);}
        const avatar=itemFor('avatar');
        if(avatar){const data=CosmeticArt.image(avatar.id);if(profileAvatarData!==data){try { applyCollectibleAvatar(avatar); } catch(error) { /* Keep the existing avatar if storage is full. */ }}}
        root.style.setProperty('--reward-frame', frame ? frame.color : 'var(--accent)');
        root.style.setProperty('--reward-ghost', ghost ? ghost.color : '#9b7bff');
        ['banner','hit','trail','base','lane','ghost','title'].forEach(category => {
            root.dataset['reward' + category[0].toUpperCase() + category.slice(1)] = state.equipped[category] || 'default';
        });
        const titleItem = itemFor('title');
        title.textContent = titleItem ? titleItem.name : '';
        title.hidden = !titleItem;
        document.querySelectorAll('[data-reward-card]').forEach(button => {
            button.textContent = button.dataset.rewardCard.toUpperCase() + (owns('card-' + button.dataset.rewardCard) ? '' : ' · SHOP');
        });
        renderDaily();
        if (dialog.open) renderShop();
    }
    function applyCollectibleAvatar(item) {
        const data=CosmeticArt.image(item.id);
        if(currentAppProfile!=='guest')localStorage.setItem('kw_profile_avatar',data);
        profileAvatarData=data;
        const image=document.getElementById('profileAvatarImage');image.src=data;
        document.getElementById('profileAvatarButton').classList.add('has-image');
    }
    function renderDaily() {
        const view=engine.dailyView(state);
        document.getElementById('dailyReset').textContent=view.state.day+' · Resets at midnight'+(currentAppProfile==='guest'?' · Guest':'');
        const container=document.getElementById('dailyTasks');container.replaceChildren();
        view.tasks.forEach(task=>{
            const card=document.createElement('details');card.className='daily-task'+(task.claimed?' completed':'');
            const summary=document.createElement('summary');
            const name=document.createElement('strong');name.textContent=task.name;
            const desc=document.createElement('p');desc.textContent=task.description;
            const progress=document.createElement('progress');progress.max=task.target;progress.value=task.value;progress.setAttribute('aria-label',task.name+' progress');
            const count=document.createElement('span');count.className='daily-count';count.textContent=task.claimed?'✓ Done':Math.floor(task.value)+' / '+task.target;
            const label=document.createElement('small');label.textContent=task.xp+' XP + '+task.coins+' coins'+(task.claimed?' · Awarded':'');
            summary.append(name,count,progress,label);card.append(summary,desc);container.appendChild(card);
        });
    }
    let dayTimer;
    function watchDay() {
        clearTimeout(dayTimer);renderDaily();const now=new Date(), next=new Date(now.getFullYear(),now.getMonth(),now.getDate()+1);
        dayTimer=setTimeout(watchDay,Math.max(1000,next-now+100));
    }
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)watchDay();});
    function award(event) {
        try {
            const result = engine.award(state, event);
            if (!result.xp) return;
            commit(result.state);
            render();
            const names = engine.badges.flatMap(b => b.tiers?b.tiers.filter(t=>result.badges.includes(t.id)).map(t=>b.name+' '+t.name):result.badges.includes(b.id)?[b.name]:[]);
            if(result.dailyCompleted?.length) names.push('Daily: '+result.dailyCompleted.join(', '));
            notify('+' + result.xp + ' XP · +' + result.coins + ' Key Coins' + (result.personalBest ? ' · Personal best!' : '') + (names.length ? ' · ' + names.join(', ') : ''));
        } catch(error) { notify('Rewards could not be saved. Check available device storage.'); }
    }
    function selectProfile(type) {
        selectedBadge=null;
        state = type === 'guest' ? engine.fresh() : read();
        if (type === 'guest') profileCardStyle = 'classic';
        clearTimeout(toastTimer);
        notice.hidden = true;
        invalidateCard();
    }
    function decorateCard(ctx, width) {
        const bannerItem = itemFor('banner'), frame = itemFor('frame'), titleItem = itemFor('title');
        ctx.save();
        if (frame) {
            CosmeticArt.frame(ctx,frame.id,60,58,112);
        }
        if (titleItem) {
            ctx.fillStyle = titleItem.color; ctx.font = '800 18px Arial'; ctx.textAlign = 'right';
            ctx.fillText(titleItem.name.toUpperCase(), width - 60, 477);
        }
        ctx.restore();
    }
    function avatarChanged() {
        if (!state.equipped.avatar) return;
        const next = engine.normalize(state);
        delete next.equipped.avatar;
        try { commit(next); } catch(error) { state = next; }
        invalidateCard();
    }
    function drawBanner(ctx, width) {
        const bannerItem = itemFor('banner');
        // Draw export artwork directly: local-file/WebView SVG images can taint
        // a canvas or fail to load offline, preventing PNG serialization.
        ctx.save(); ctx.scale(width / 960, 215 / 240);
        const style = bannerItem ? bannerItem.id : 'default';
        ctx.fillStyle = style === 'banner-sunset' ? '#67345d' : style === 'banner-matrix' ? '#092328' : '#1d203c';
        ctx.fillRect(0,0,960,240);
        function path(points, color, fill) {
            ctx.beginPath(); points.forEach((p,i) => i ? ctx.lineTo(p[0],p[1]) : ctx.moveTo(p[0],p[1]));
            if (fill) { ctx.closePath(); ctx.fillStyle=color; ctx.fill(); } else { ctx.strokeStyle=color; ctx.lineWidth=2; ctx.stroke(); }
        }
        if (style === 'banner-sunset') {
            ctx.fillStyle='#ffcf8a'; ctx.beginPath(); ctx.arc(725,100,65,0,Math.PI*2); ctx.fill();
            ctx.fillStyle='#67345d'; [112,128,144,160].forEach(y=>ctx.fillRect(655,y,140,5));
            path([[0,210],[126,128],[229,185],[393,74],[510,169],[575,126],[685,181],[779,122],[960,199],[960,240],[0,240]],'#623460',true);
            path([[0,235],[170,166],[269,205],[428,134],[522,200],[616,177],[704,202],[836,143],[960,193],[960,240],[0,240]],'#352441',true);
            path([[0,240],[148,220],[248,232],[400,194],[546,228],[679,210],[817,221],[960,195],[960,240]],'#181c31',true);
        } else if (style === 'banner-matrix') {
            for(let y=0;y<240;y+=24) path([[0,y],[960,y]],'#133b3c');
            for(let x=0;x<960;x+=24) path([[x,0],[x,240]],'#133b3c');
            [60,100,140,180].forEach((y,i)=>{path([[960,y],[850,y],[810,y+20],[724,y+20]],'#35cda5');path([[626,y+20],[520,y+20],[480,y+40],[220+i*45,y+40]],'#35cda5');});
            ctx.fillStyle='#102e35'; ctx.fillRect(626,69,98,110);ctx.strokeStyle='#8bffcc';ctx.strokeRect(626,69,98,110);
            path([[649,108],[667,124],[649,140]],'#a7ffde');path([[679,140],[701,140]],'#a7ffde');
        } else {
            const stars=[[440,188],[507,101],[585,146],[665,51],[739,144],[845,95],[899,182]];
            path(stars,'#8a84bf');
            stars.concat([[208,159],[315,38],[814,31],[907,48]]).forEach(([x,y])=>{ctx.fillStyle='#d8d9ff';ctx.beginPath();ctx.arc(x,y,3,0,Math.PI*2);ctx.fill();});
            ctx.strokeStyle='#8a84bf';ctx.beginPath();ctx.arc(665,51,25,0,Math.PI*2);ctx.stroke();
        }
        const shade=ctx.createLinearGradient(0,0,960,0);shade.addColorStop(0,'rgba(8,11,18,.9)');shade.addColorStop(1,'rgba(8,11,18,.2)');
        ctx.fillStyle=shade;ctx.fillRect(0,0,960,240);ctx.restore();
    }
    window.WarriorRewards = {award,selectProfile,render,owns,openShop,decorateCard,avatarChanged,drawBanner};
    window.awardWarriorRewards = function(event) {
        event.day=engine.dayKey();
        event.key = language + ':' + attitude + ':' + event.mode;
        if (event.scope) event.key += ':' + Array.from(event.scope).map(c => c.codePointAt(0).toString(16)).join('-');
        award(event);
    };
    window.chooseRewardCard = function(style) {
        if (!owns('card-' + style)) { openShop(); document.getElementById('shopCategory').value = 'card'; renderShop(); return; }
        const item = engine.catalog.find(i => i.id === 'card-' + style);
        purchaseAndEquip(item);
    };
    state = currentAppProfile === 'guest' ? engine.fresh() : read();
    render();
    watchDay();
})();
