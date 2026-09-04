const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
require('./shortcuts.js');
const rules = globalThis.ShortcutRules;
assert.deepEqual(rules.normalize(null), rules.defaults);
assert.equal(rules.normalize({clear:'a'}).clear,'');
assert.equal(rules.normalize({clear:'F2',freeze:'F2'}).freeze,'');
assert.equal(rules.normalize({clear:''}).clear,'');
assert.equal(rules.actionFor(rules.defaults,{key:'Delete'}),'clear');
for(const modifier of ['ctrlKey','altKey','metaKey','shiftKey','isComposing','defaultPrevented']) assert.equal(rules.actionFor(rules.defaults,{key:'F2',[modifier]:true}),null);
for(const key of ['a',' ','Backspace','Escape','Enter']) assert.equal(rules.actionFor(rules.defaults,{key}),null);
const source = fs.readFileSync('shortcuts.js','utf8');
const handler = source.match(/    function handleShortcut\(event\) \{[\s\S]*?\n    \}/)[0];
let cleared=0,activated=0,modal=false,active=true,prevented=0;
const input={}; const clear={};
const ctx={arcadeActive:true,arcadeLastMode:'defense',bindings:rules.defaults,actionFor:rules.actionFor,
    clearArcadeText(){cleared++;},arcadePowerPickup:{type:'freeze',el:{click(){activated++;}}},
    document:{activeElement:input,querySelector(){return modal;},getElementById(id){return id==='arcadeInput'?input:id==='arcadeClearText'?clear:{classList:{contains:()=>active}};}}};
vm.createContext(ctx);vm.runInContext(handler,ctx);
function press(key,extra={}){ctx.event={key,preventDefault(){prevented++;},stopImmediatePropagation(){},...extra};vm.runInContext('handleShortcut(event)',ctx);}
press('Delete');assert.equal(cleared,1);
press('F2');assert.equal(activated,1);
press('F4');assert.equal(activated,1,'Cannot activate another type');
press('F2',{repeat:true});assert.equal(activated,1);
ctx.arcadeLastMode='survival';press('F2');assert.equal(activated,1);press('Delete');assert.equal(cleared,2);
ctx.arcadeActive=false;press('Delete');assert.equal(cleared,2);
ctx.arcadeActive=true;modal=true;press('Delete');assert.equal(cleared,2);
modal=false;active=false;press('Delete');assert.equal(cleared,2);
active=true;ctx.document.activeElement={classList:{contains:()=>false}};press('Delete');assert.equal(cleared,2);
console.log('Shortcut tests passed: defaults, validation, duplicate removal, typing/modifier protection, both modes, pickup matching, repeat prevention, inactive screens and dialogs.');
