(function(root) {
    'use strict';
    const catalog = [
        { id:'frame-gold', category:'frame', name:'Gilded Frame', cost:80, color:'#ffd166', description:'A crowned gold frame with laurel leaves and a gemstone seal.' },
        { id:'frame-ice', category:'frame', name:'Frost Frame', cost:80, color:'#67e8f9', description:'A faceted crystal frame with shard corners and frozen edges.' },
        { id:'avatar-dragon', category:'avatar', name:'Dragon', cost:150, color:'#ff814a', symbol:'🐉', description:'An illustrated horned dragon with ember armor and luminous eyes.' },
        { id:'avatar-owl', category:'avatar', name:'Night Owl', cost:150, color:'#b197fc', symbol:'🦉', description:'An illustrated moon owl with layered feathers and amber eyes.' },
        { id:'card-aurora', category:'card', name:'Aurora Card', cost:160, color:'#6ee7b7', value:'aurora', description:'Flowing aurora ribbons and a constellation field on your exported card.' },
        { id:'card-ember', category:'card', name:'Ember Card', cost:160, color:'#ff985c', value:'ember', description:'Forged edge armor, copper rivets, and ember panels on your exported card.' },
        { id:'banner-sunset', category:'banner', name:'Sunset Banner', cost:100, color:'#fb7185', description:'Striped sun, layered mountain silhouettes, and a dusk sky.' },
        { id:'banner-matrix', category:'banner', name:'Circuit Banner', cost:120, color:'#34d399', description:'A terminal chip connected by illuminated circuit traces.' },
        { id:'title-quicksilver', category:'title', name:'Quicksilver', cost:90, color:'#cbd5e1', description:'Equip this title beneath your name.' },
        { id:'title-keymaster', category:'title', name:'Keymaster', cost:180, color:'#fbbf24', description:'A premium profile title, separate from your rank.' },
        { id:'hit-sparks', category:'hit', name:'Solar Burst', cost:100, color:'#ffd166', description:'An eight-point solar explosion and expanding golden shock ring.' },
        { id:'hit-frost', category:'hit', name:'Ice Shatter', cost:120, color:'#67e8f9', description:'A shattered crystal star with bright frozen shards.' },
        { id:'trail-comet', category:'trail', name:'Comet Trails', cost:140, color:'#c4b5fd', description:'Split comet streaks streaming behind falling targets.' },
        { id:'base-circuit', category:'base', name:'Circuit Base', cost:120, color:'#34d399', description:'A glowing command deck with etched circuit lines.' },
        { id:'base-fortress', category:'base', name:'Fortress Base', cost:160, color:'#fbbf24', description:'A fortified base with crenellated towers and gold armor.' },
        { id:'ghost-cyan', category:'ghost', name:'Glacier Ghost', cost:80, color:'#22d3ee', description:'An icy striped racer with a little ghost at the leading edge.' },
        { id:'ghost-pink', category:'ghost', name:'Rose Ghost', cost:80, color:'#f472b6', description:'A stardust racer with a little ghost at the leading edge.' },
        { id:'lane-dashed', category:'lane', name:'Track Marks', cost:100, color:'#cbd5e1', description:'Track boundaries and bold road markings for both racers.' },
        { id:'lane-neon', category:'lane', name:'Neon Lanes', cost:140, color:'#a78bfa', description:'A luminous tunnel track with neon crossbars and glowing rails.' }
    ];
    const badges = [
        { id:'first', name:'First Steps', description:'Finish your first qualifying round.' },
        { id:'survivor', name:'Minute Survivor', description:'Survive at least 60 seconds in Typing Survival.' },
        { id:'ghost', name:'Ghost Breaker', description:'Beat a recorded Ghost Race time.' },
        { id:'combo', name:'Combo Fifty', description:'Reach a 50-word streak in Combo Mode, then finish the round.' },
        { id:'defender', name:'Base Guardian', description:'Finish a Keyboard Defense run with at least 50 points (power-up points count).' },
        { id:'veteran', name:'Regular Warrior', description:'Finish 25 qualifying rounds.' }
    ];
    const tiers = ['Bronze','Silver','Gold'];
    const goals = {survivor:[60,120,180],ghost:[1,5,15],combo:[50,100,150],defender:[50,100,200],veteran:[25,100,250]};
    const units = {survivor:'seconds in one Typing Survival run',ghost:'Ghost Race wins',combo:'words in one Combo Mode streak',defender:'points in one Keyboard Defense run (power-ups count)',veteran:'completed qualifying rounds'};
    badges.forEach(b=>{ if(goals[b.id]) { b.tiers=goals[b.id].map((goal,i)=>({id:i?b.id+'-'+tiers[i].toLowerCase():b.id,name:tiers[i],goal})); b.description='Reach higher goals to upgrade this badge.'; } });
    badges.find(b=>b.id==='survivor').name='Survival Warrior';
    badges.find(b=>b.id==='combo').name='Combo Master';
    const badgeIds = badges.flatMap(b=>b.tiers?b.tiers.map(t=>t.id):[b.id]);
    const fresh = () => ({version:3,xp:0,coins:0,rounds:0,owned:[],equipped:{},badges:[],achievementProgress:{},best:{},claims:[],daily:null,weekly:null});
    function badgeView(state,badge) {
        const value=badge.id==='veteran'?state.rounds:(state.achievementProgress[badge.id]||0);
        const levels=(badge.tiers||[]).map(t=>({...t,earned:state.badges.includes(t.id)}));
        return {value,levels,current:levels.filter(t=>t.earned).at(-1),unit:units[badge.id]};
    }
    const dailyModes = ['easy','medium','nomercy','suddendeath','combo','curse','madlibs','reverse','ghostrace','defense','survival','treasure','freestyle','mirror','roast'];
    function dayKey(date = new Date()) { return date.getFullYear() + '-' + String(date.getMonth()+1).padStart(2,'0') + '-' + String(date.getDate()).padStart(2,'0'); }
    function cleanDaily(raw) {
        if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw.day)) return null;
        const date = new Date(raw.day+'T00:00:00Z');
        if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0,10)!==raw.day) return null;
        const d = {day:raw.day, rounds:0, modes:[], defense:0, survival:0, ghostrace:0, treasure:0, combo:0, claimed:[],rerolls:0,focusOffset:0};
        ['rounds','defense','survival','ghostrace','treasure','combo'].forEach(k=>d[k]=Number.isFinite(raw[k]) && raw[k]>=0 ? Math.min(1000000,raw[k]) : 0);
        d.modes = dailyModes.filter(m=>Array.isArray(raw.modes) && raw.modes.includes(m));
        d.claimed = ['rounds','variety','focus'].filter(id=>Array.isArray(raw.claimed) && raw.claimed.includes(id));
        d.rerolls=Math.min(1,count(raw.rerolls));d.focusOffset=Math.min(4,count(raw.focusOffset));
        return d;
    }
    function dailyView(raw, day = dayKey()) {
        if (!cleanDaily({day})) day = dayKey();
        let d = cleanDaily(raw.daily);
        // Never roll progress backwards and re-award yesterday after clock changes.
        if (!d || day > d.day) d = cleanDaily({day});
        const focuses = [
            {name:'Hold the Line',description:'Earn 30 total points in completed Keyboard Defense runs.',field:'defense',target:30},
            {name:'Stay Alive',description:'Accumulate 90 seconds across completed Typing Survival runs.',field:'survival',target:90},
            {name:'Chase the Echo',description:'Complete 2 Ghost Races. Winning is not required.',field:'ghostrace',target:2},
            {name:'Vault Visitor',description:'Finish a Cursed Treasure expedition with at least one chamber cleared.',field:'treasure',target:1},
            {name:'Find Your Flow',description:'Reach a 20-word Combo Mode streak, then finish the round.',field:'combo',target:20}
        ];
        const index = Math.floor(Date.parse(d.day+'T00:00:00Z') / 86400000);
        const focus = focuses[((index+d.focusOffset)%focuses.length+focuses.length)%focuses.length] || focuses[0];
        return {state:d, tasks:[
            {id:'rounds',name:'Daily Warm-up',description:'Complete 3 qualifying rounds in any modes.',target:3,value:d.rounds,xp:25,coins:20},
            {id:'variety',name:'Mix It Up',description:'Complete qualifying rounds in 2 different modes.',target:2,value:d.modes.length,xp:25,coins:25},
            {...focus,id:'focus',value:d[focus.field],xp:35,coins:30}
        ].map(t=>({...t,value:Math.min(t.target,t.value),claimed:d.claimed.includes(t.id)}))};
    }
    function rerollDaily(raw,day=dayKey()){
        const state=normalize(raw),view=dailyView(state,day),d=view.state;
        if(d.rerolls||d.claimed.includes('focus'))return state;
        d.rerolls=1;d.focusOffset=(d.focusOffset+1)%5;state.daily=d;return state;
    }
    function weekKey(day=dayKey()){const d=new Date(day+'T00:00:00Z'),n=d.getUTCDay()||7;d.setUTCDate(d.getUTCDate()-n+1);return d.toISOString().slice(0,10);}
    function cleanWeekly(raw,key=weekKey()){if(!raw||raw.week!==key)return{week:key,rounds:0,modes:[],claimed:false};return{week:key,rounds:count(raw.rounds),modes:dailyModes.filter(m=>Array.isArray(raw.modes)&&raw.modes.includes(m)),claimed:!!raw.claimed};}
    function weeklyView(raw,day=dayKey()){const w=cleanWeekly(raw.weekly,weekKey(day));return{state:w,name:'Versatile Warrior',description:'Complete 15 qualifying rounds across at least 5 modes this week.',rounds:Math.min(15,w.rounds),modes:Math.min(5,w.modes.length),complete:w.rounds>=15&&w.modes.length>=5,claimed:w.claimed,xp:150,coins:100};}
    function awardDaily(state, event) {
        if (!event.day || !/^\d{4}-\d{2}-\d{2}$/.test(event.day)) return {xp:0,coins:0,names:[]};
        const view = dailyView(state,event.day), d=view.state;
        state.daily=d;
        if (d.day !== event.day) return {xp:0,coins:0,names:[]};
        d.rounds++;
        if (dailyModes.includes(event.mode) && !d.modes.includes(event.mode)) d.modes.push(event.mode);
        if (event.mode==='defense') d.defense += event.units;
        if (event.mode==='survival') d.survival += event.seconds;
        if (event.mode==='ghostrace') d.ghostrace++;
        if (event.mode==='treasure') d.treasure++;
        if (event.mode==='combo') d.combo=Math.max(d.combo,event.combo || 0);
        const completed=dailyView(state,event.day).tasks.filter(t=>!t.claimed && t.value>=t.target);
        d.claimed.push(...completed.map(t=>t.id));
        return {xp:completed.reduce((n,t)=>n+t.xp,0),coins:completed.reduce((n,t)=>n+t.coins,0),names:completed.map(t=>t.name)};
    }
    const count = value => Number.isSafeInteger(value) && value >= 0 ? value : 0;
    function normalize(raw) {
        const s = fresh();
        if (!raw || typeof raw !== 'object') return s;
        s.daily = cleanDaily(raw.daily);
        s.weekly = raw.weekly ? cleanWeekly(raw.weekly) : null;
        ['xp','coins','rounds'].forEach(k => { s[k] = count(raw[k]); });
        s.owned = catalog.filter(i => Array.isArray(raw.owned) && raw.owned.includes(i.id)).map(i => i.id);
        s.badges = badgeIds.filter(id => Array.isArray(raw.badges) && raw.badges.includes(id));
        Object.keys(goals).forEach(id=>{
            const saved=raw.achievementProgress && raw.achievementProgress[id];
            const earned=badges.find(b=>b.id===id).tiers.filter(t=>s.badges.includes(t.id));
            const value=Math.max(Number.isFinite(saved)&&saved>=0?saved:0,...earned.map(t=>t.goal));
            if(value && id!=='veteran') s.achievementProgress[id]=value;
            // Preserve prior awards and fill lower tiers without paying them again.
            if(earned.length) badges.find(b=>b.id===id).tiers.filter(t=>t.goal<=Math.max(...earned.map(t=>t.goal))).forEach(t=>{if(!s.badges.includes(t.id))s.badges.push(t.id);});
        });
        catalog.forEach(i => { if(s.owned.includes(i.id) && raw.equipped && raw.equipped[i.category] === i.id) s.equipped[i.category] = i.id; });
        if(raw.best && typeof raw.best === 'object') Object.entries(raw.best).forEach(([k,v]) => {
            if (/^[a-z0-9:_-]+$/.test(k) && Number.isFinite(v) && v >= 0) s.best[k] = v;
        });
        s.claims = Array.isArray(raw.claims) ? raw.claims.filter(x => typeof x === 'string').slice(-100) : [];
        return s;
    }
    function award(raw, event) {
        const state = normalize(raw);
        if (!event || !event.id || state.claims.includes(event.id) || !Number.isFinite(event.seconds) || event.seconds < 3 || !Number.isFinite(event.units) || !(event.units > 0)) return {state, xp:0, coins:0, badges:[]};
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
        const progress=state.achievementProgress;
        if(event.mode==='survival') progress.survivor=Math.max(progress.survivor||0,event.seconds);
        if(event.mode==='ghostrace' && event.ghostWon) progress.ghost=(progress.ghost||0)+1;
        if(event.mode==='combo' && Number.isFinite(event.combo)) progress.combo=Math.max(progress.combo||0,event.combo);
        if(event.mode==='defense') progress.defender=Math.max(progress.defender||0,event.units);
        badges.filter(b=>b.tiers).forEach(b=>{const view=badgeView(state,b);view.levels.filter(t=>view.value>=t.goal).forEach(t=>eligible.push(t.id));});
        const unlocked = eligible.filter(id => !state.badges.includes(id));
        state.badges.push(...unlocked);
        state.badges=badgeIds.filter(id=>state.badges.includes(id));
        coins += unlocked.length * 20;
        const daily = awardDaily(state,event);
        xp += daily.xp; coins += daily.coins;
        const weekly=weeklyView(state,event.day),w=weekly.state;state.weekly=w;w.rounds++;if(dailyModes.includes(event.mode)&&!w.modes.includes(event.mode))w.modes.push(event.mode);
        const weeklyDone=w.rounds>=15&&w.modes.length>=5&&!w.claimed;if(weeklyDone){w.claimed=true;xp+=150;coins+=100;}
        state.xp += xp;
        state.coins += coins;
        return {state, xp, coins, badges:unlocked, personalBest, dailyCompleted:daily.names, weeklyCompleted:weeklyDone};
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
    root.RewardEngine = {catalog,badges,badgeView,fresh,normalize,award,purchase,equip,dayKey,dailyView,rerollDaily,weeklyView};
})(globalThis);
