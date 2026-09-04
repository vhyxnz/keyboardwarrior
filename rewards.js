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
    banner.innerHTML = '<span>PLAYER PROFILE</span><strong id="bannerPlayerLevel">LEVEL 1</strong>';
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
            const preview = document.createElement('div');
            preview.className = 'shop-preview shop-preview-' + item.category;
            preview.style.setProperty('--preview-color', item.color);
            preview.textContent = item.symbol || (item.category === 'title' ? 'Aa' : item.category === 'avatar' ? 'KW' : '✦');
            if (item.category === 'banner') { preview.textContent = ''; preview.style.backgroundImage = 'url("./' + item.id + '.svg")'; preview.setAttribute('role', 'img'); preview.setAttribute('aria-label', item.description); }
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
            if (item.category === 'avatar') selectPresetAvatar(item.symbol, '#142034', item.color, true);
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
        document.getElementById('rewardXP').textContent = state.xp;
        document.getElementById('rewardProgress').value = state.xp % 100;
        document.getElementById('rewardProgressLabel').textContent = (100 - state.xp % 100) + ' XP to level ' + (level + 1);
        document.getElementById('rewardSessionLabel').textContent = currentAppProfile === 'guest' ? 'SESSION ONLY' : 'SAVED PROFILE';
        document.getElementById('bannerPlayerLevel').textContent = 'LEVEL ' + level;
        const list = document.getElementById('rewardBadges');
        list.replaceChildren();
        engine.badges.forEach(badge => {
            const el = document.createElement('span');
            const unlocked = state.badges.includes(badge.id);
            el.className = 'reward-badge' + (unlocked ? ' unlocked' : '');
            el.textContent = (unlocked ? '★ ' : '◇ ') + badge.name;
            el.title = (unlocked ? 'Earned: ' : 'Locked: ') + badge.description;
            el.setAttribute('aria-label', el.title);
            list.appendChild(el);
        });
        const root = document.documentElement;
        const frame = itemFor('frame'), ghost = itemFor('ghost');
        root.style.setProperty('--reward-frame', frame ? frame.color : 'var(--accent)');
        root.style.setProperty('--reward-ghost', ghost ? ghost.color : '#9b7bff');
        ['banner','hit','trail','base','lane'].forEach(category => {
            root.dataset['reward' + category[0].toUpperCase() + category.slice(1)] = state.equipped[category] || 'default';
        });
        const titleItem = itemFor('title');
        title.textContent = titleItem ? titleItem.name : '';
        title.hidden = !titleItem;
        document.querySelectorAll('[data-reward-card]').forEach(button => {
            button.textContent = button.dataset.rewardCard.toUpperCase() + (owns('card-' + button.dataset.rewardCard) ? '' : ' · SHOP');
        });
        if (dialog.open) renderShop();
    }
    function award(event) {
        try {
            const result = engine.award(state, event);
            if (!result.xp) return;
            commit(result.state);
            render();
            const names = engine.badges.filter(b => result.badges.includes(b.id)).map(b => b.name);
            notify('+' + result.xp + ' XP · +' + result.coins + ' Key Coins' + (result.personalBest ? ' · Personal best!' : '') + (names.length ? ' · ' + names.join(', ') : ''));
        } catch(error) { notify('Rewards could not be saved. Check available device storage.'); }
    }
    function selectProfile(type) {
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
            ctx.strokeStyle = frame.color; ctx.lineWidth = 7;
            roundRect(ctx,60,58,112,112,30); ctx.stroke();
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
})();
