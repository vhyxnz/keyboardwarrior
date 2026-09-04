const assert=require('node:assert/strict');require('./rewards-core.js');const e=RewardEngine;
const day='2026-09-04';let state=e.fresh();
const play=(id,mode='easy',extra={})=>{const r=e.award(state,{id:String(id),mode,key:mode,seconds:10,units:10,metric:1,day,...extra});state=r.state;return r;};
assert.equal(e.dailyView(state,day).tasks.length,3);
play(1);let r=play(2,'medium');assert(r.dailyCompleted.includes('Mix It Up'));assert.equal(r.coins,40);
r=play(3);assert(r.dailyCompleted.includes('Daily Warm-up'));assert.equal(r.xp,45);
r=play(3);assert.equal(r.xp,0);assert.equal(state.daily.rounds,3);
r=play(4);assert.deepEqual(r.dailyCompleted,[]);
const restored=e.normalize(JSON.parse(JSON.stringify(state)));assert.deepEqual(restored.daily,state.daily);
state=restored;assert.equal(play(5).dailyCompleted.length,0);
play(6,'easy',{day:'2026-09-05'});assert.equal(state.daily.rounds,1);assert.equal(state.daily.claimed.length,0);
play(7,'easy',{day:'2026-09-04'});assert.equal(state.daily.day,'2026-09-05');assert.equal(state.daily.rounds,1);
const days=['2026-09-06','2026-09-07','2026-09-08','2026-09-09','2026-09-10'];
for(const date of days){state=e.fresh();const focus=e.dailyView(state,date).tasks[2];const extra={day:date,units:40,seconds:100,combo:25};play(date+'a',focus.field,extra);r=play(date+'b',focus.field,extra);assert(state.daily.claimed.includes('focus'),focus.field);const before=state.coins;play(date+'c',focus.field,extra);assert(!r.dailyCompleted.includes('focus') || focus.field==='ghostrace');assert(state.coins>before);}
state=e.fresh();play('short','easy',{seconds:2});assert.equal(state.daily,null);
assert.equal(e.dayKey(new Date(2026,0,2)),'2026-01-02');
assert.equal(e.dailyView(e.fresh(),'2026-09-04').state.rounds,0);
console.log('Daily tests passed: goals, exact payouts, duplicate prevention, backup/reload, midnight reset, clock rollback, rotating focus goals and qualifying rounds.');
