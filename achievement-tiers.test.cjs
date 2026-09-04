const assert=require('node:assert/strict');
require('./rewards-core.js');
const e=globalThis.RewardEngine;
let serial=0;
const round=(mode,extra={})=>({id:'tier-'+(++serial),mode,seconds:10,units:1,...extra});
assert.equal(e.badges.find(b=>b.id==='first').tiers,undefined);
for(const [id,mode,field,goals] of [
    ['survivor','survival','seconds',[60,120,180]],
    ['combo','combo','combo',[50,100,150]],
    ['defender','defense','units',[50,100,200]]
]) {
    let state=e.fresh();
    for(let i=0;i<3;i++){
        let result=e.award(state,round(mode,{[field]:goals[i]-1}));state=result.state;
        const tierId=i?id+'-'+['bronze','silver','gold'][i]:id;
        assert(!state.badges.includes(tierId));
        result=e.award(state,round(mode,{[field]:goals[i]}));state=result.state;
        assert(result.badges.includes(tierId));
        assert.equal(e.award(state,round(mode,{[field]:goals[i]})).badges.length,0);
        assert.deepEqual(e.normalize(JSON.parse(JSON.stringify(state))),state);
    }
}
let state=e.fresh();
for(let i=1;i<=15;i++)state=e.award(state,round('ghostrace',{ghostWon:true})).state;
assert(state.badges.includes('ghost-gold'));
assert.equal(state.achievementProgress.ghost,15);
assert.equal(e.award(state,round('ghostrace',{ghostWon:false})).state.achievementProgress.ghost,15);
state=e.fresh();
for(let i=1;i<=250;i++)state=e.award(state,round('easy')).state;
assert(state.badges.includes('veteran-gold'));
const legacy=e.normalize({version:1,badges:['first','survivor','ghost','combo','defender','veteran'],rounds:25,coins:120});
assert.equal(legacy.coins,120);
assert.equal(legacy.achievementProgress.survivor,60);
assert.equal(e.award(legacy,round('easy')).badges.length,0);
const leap=e.award(e.fresh(),round('survival',{seconds:180}));
assert.deepEqual(leap.badges,['first','survivor','survivor-silver','survivor-gold']);
assert.equal(leap.coins,90);
assert.equal(e.award(leap.state,{id:leap.state.claims[0],mode:'survival',seconds:180,units:1}).coins,0);
console.log('Achievement tier tests passed: thresholds, upgrades, one-time awards, migration, mode isolation, backup and cumulative goals.');
