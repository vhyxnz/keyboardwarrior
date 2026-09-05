const assert=require('node:assert/strict');require('./rewards-core.js');const e=globalThis.RewardEngine;
let s=e.fresh(),id=0,modes=['easy','medium','defense','survival','combo'];
for(let i=0;i<14;i++){const r=e.award(s,{id:'w'+(++id),day:'2026-09-05',mode:modes[i%5],seconds:10,units:1,metric:i+1});s=r.state;assert.equal(r.weeklyCompleted,false);}
let result=e.award(s,{id:'w'+(++id),day:'2026-09-05',mode:'easy',seconds:10,units:1,metric:20});s=result.state;
assert.equal(result.weeklyCompleted,true);assert.equal(result.xp>=170,true);assert.equal(result.coins>=110,true);
result=e.award(s,{id:'w'+(++id),day:'2026-09-05',mode:'easy',seconds:10,units:1,metric:1});assert.equal(result.weeklyCompleted,false);
assert.equal(e.weeklyView(result.state,'2026-09-05').claimed,true);assert.equal(e.weeklyView(result.state,'2026-09-07').claimed,false);
let d=e.fresh();d.daily=e.dailyView(d,'2026-09-05').state;const before=e.dailyView(d,'2026-09-05').tasks[2].name;d=e.rerollDaily(d,'2026-09-05');const after=e.dailyView(d,'2026-09-05').tasks[2].name;assert.notEqual(before,after);assert.equal(d.daily.rerolls,1);assert.deepEqual(e.rerollDaily(d,'2026-09-05'),d);
assert.deepEqual(e.normalize(JSON.parse(JSON.stringify(s))),s);
console.log('Final upgrade tests passed: weekly thresholds, reset, duplicate prevention, daily reroll and persistence.');
