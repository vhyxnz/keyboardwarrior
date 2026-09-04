(function(root) {
    'use strict';
    const catalog = [
        { id:'frame-gold', category:'frame', name:'Gilded Frame', cost:80, color:'#ffd166', description:'A golden border around your avatar.' },
        { id:'frame-ice', category:'frame', name:'Frost Frame', cost:80, color:'#67e8f9', description:'An icy cyan avatar border.' },
        { id:'avatar-dragon', category:'avatar', name:'Dragon', cost:150, color:'#ff814a', symbol:'🐉', description:'A collectible dragon avatar.' },
        { id:'avatar-owl', category:'avatar', name:'Night Owl', cost:150, color:'#b197fc', symbol:'🦉', description:'A collectible night owl avatar.' },
        { id:'card-aurora', category:'card', name:'Aurora Card', cost:160, color:'#6ee7b7', value:'aurora', description:'Emerald and midnight profile-card colors.' },
        { id:'card-ember', category:'card', name:'Ember Card', cost:160, color:'#ff985c', value:'ember', description:'Copper and charcoal profile-card colors.' },
        { id:'banner-sunset', category:'banner', name:'Sunset Banner', cost:100, color:'#fb7185', description:'Striped sun, layered mountain silhouettes, and a dusk sky.' },
        { id:'banner-matrix', category:'banner', name:'Circuit Banner', cost:120, color:'#34d399', description:'A terminal chip connected by illuminated circuit traces.' },
        { id:'title-quicksilver', category:'title', name:'Quicksilver', cost:90, color:'#cbd5e1', description:'Equip this title beneath your name.' },
        { id:'title-keymaster', category:'title', name:'Keymaster', cost:180, color:'#fbbf24', description:'A premium profile title, separate from your rank.' },
        { id:'hit-sparks', category:'hit', name:'Solar Burst', cost:100, color:'#ffd166', description:'Golden burst rings on Defense hits.' },
        { id:'hit-frost', category:'hit', name:'Ice Shatter', cost:120, color:'#67e8f9', description:'Icy diamond-shaped Defense bursts.' },
        { id:'trail-comet', category:'trail', name:'Comet Trails', cost:140, color:'#c4b5fd', description:'Light trails behind Defense enemies.' },
        { id:'base-circuit', category:'base', name:'Circuit Base', cost:120, color:'#34d399', description:'An illuminated green keyboard base.' },
        { id:'base-fortress', category:'base', name:'Fortress Base', cost:160, color:'#fbbf24', description:'Gold armored stripes along your base.' },
        { id:'ghost-cyan', category:'ghost', name:'Glacier Ghost', cost:80, color:'#22d3ee', description:'A cyan ghost progress bar.' },
        { id:'ghost-pink', category:'ghost', name:'Rose Ghost', cost:80, color:'#f472b6', description:'A pink ghost progress bar.' },
        { id:'lane-dashed', category:'lane', name:'Track Marks', cost:100, color:'#cbd5e1', description:'Dashed markings across your race lanes.' },
        { id:'lane-neon', category:'lane', name:'Neon Lanes', cost:140, color:'#a78bfa', description:'Glowing race-lane borders.' }
    ];
    const badges = [
        { id:'first', name:'First Steps', description:'Finish your first qualifying round.' },
        { id:'survivor', name:'Minute Survivor', description:'Survive at least 60 seconds in Typing Survival.' },
        { id:'ghost', name:'Ghost Breaker', description:'Beat a recorded Ghost Race time.' },
        { id:'combo', name:'Combo Fifty', description:'Reach a 50-word combo.' },
        { id:'defender', name:'Base Guardian', description:'Defend 50 words in one run.' },
        { id:'veteran', name:'Regular Warrior', description:'Finish 25 qualifying rounds.' }
    ];
    const fresh = () => ({version:1,xp:0,coins:0,rounds:0,owned:[],equipped:{},badges:[],best:{},claims:[]});
    const count = value => Number.isSafeInteger(value) && value >= 0 ? value : 0;
    function normalize(raw) {
        const s = fresh();
        if (!raw || typeof raw !== 'object') return s;
        ['xp','coins','rounds'].forEach(k => { s[k] = count(raw[k]); });
        s.owned = catalog.filter(i => Array.isArray(raw.owned) && raw.owned.includes(i.id)).map(i => i.id);
        s.badges = badges.filter(b => Array.isArray(raw.badges) && raw.badges.includes(b.id)).map(b => b.id);
        catalog.forEach(i => { if(s.owned.includes(i.id) && raw.equipped && raw.equipped[i.category] === i.id) s.equipped[i.category] = i.id; });
        if(raw.best && typeof raw.best === 'object') Object.entries(raw.best).forEach(([k,v]) => {
            if (/^[a-z0-9:_-]+$/.test(k) && Number.isFinite(v) && v >= 0) s.best[k] = v;
        });
        s.claims = Array.isArray(raw.claims) ? raw.claims.filter(x => typeof x === 'string').slice(-100) : [];
        return s;
    }
    function award(raw, event) {
        const state = normalize(raw);
        if (!event || !event.id || state.claims.includes(event.id) || !Number.isFinite(event.seconds) || event.seconds < 3 || !(event.units > 0)) return {state, xp:0, coins:0, badges:[]};
        state.claims.push(event.id);
        state.claims = state.claims.slice(-100);
        state.rounds++;
        let xp = 20, coins = 10;
        const key = event.key;
        const previous = state.best[key];
        const personalBest = Number.isFinite(event.metric) && event.metric > 0 && (previous === undefined || (event.lowerIsBetter ? event.metric < previous : event.metric > previous));
        if (personalBest) { state.best[key] = event.metric; xp += 10; coins += 5; }
        if (state.rounds % 10 === 0) { xp += 25; coins += 25; }
        const eligible = ['first'];
        if (event.mode === 'survival' && event.seconds >= 60) eligible.push('survivor');
        if (event.mode === 'ghostrace' && event.ghostWon) eligible.push('ghost');
        if (event.combo >= 50) eligible.push('combo');
        if (event.mode === 'defense' && event.units >= 50) eligible.push('defender');
        if (state.rounds >= 25) eligible.push('veteran');
        const unlocked = eligible.filter(id => !state.badges.includes(id));
        state.badges.push(...unlocked);
        coins += unlocked.length * 20;
        state.xp += xp;
        state.coins += coins;
        return {state, xp, coins, badges:unlocked, personalBest};
    }
    function purchase(raw, id) {
        const state = normalize(raw), item = catalog.find(i => i.id === id);
        if (!item) throw Error('Unknown cosmetic.');
        if (state.owned.includes(id)) return state;
        if (state.coins < item.cost) throw Error('Not enough Key Coins yet.');
        state.coins -= item.cost;
        state.owned.push(id);
        return state;
    }
    function equip(raw, id) {
        const state = normalize(raw), item = catalog.find(i => i.id === id);
        if (!item || !state.owned.includes(id)) throw Error('Unlock this cosmetic first.');
        state.equipped[item.category] = id;
        return state;
    }
    root.RewardEngine = {catalog,badges,fresh,normalize,award,purchase,equip};
})(globalThis);
