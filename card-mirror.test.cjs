const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const html = fs.readFileSync('index.html','utf8');
const rewards = fs.readFileSync('rewards.js','utf8');
const draw = rewards.match(/    function drawBanner\(ctx, width\) \{[\s\S]*?\n    \}/)[0];
for(const id of ['default','banner-sunset','banner-matrix']) {
    let calls=0;
    const canvas = new Proxy({}, {get(target,key) { if(key==='drawImage') throw Error('Export must not depend on SVG images'); if(key==='createLinearGradient')return ()=>({addColorStop(){}});return ()=>{calls++;}; },set(){return true;}});
    vm.runInNewContext(draw+';drawBanner(ctx,1080);',{ctx:canvas,itemFor:()=>id==='default'?null:{id}});
    assert(calls>10);
}
const shorten=html.match(/    function mirrorPhonePhrase\(phrase\) \{[\s\S]*?\n    \}/)[0];
const sandbox={};vm.createContext(sandbox);vm.runInContext(shorten,sandbox);
assert.equal(sandbox.mirrorPhonePhrase('one two three'),'one two three');
assert.equal(sandbox.mirrorPhonePhrase('one two three four five six seven eight nine ten eleven'),'one two three four five six seven eight nine ten');
const tap=html.match(/    function mirrorTapKey\(player, key\) \{[\s\S]*?\n    \}/)[0];
let updates=0;
const input={value:'',disabled:false};
const ctx={document:{getElementById:()=>input},mirrorMatchResults:[null,null],mirrorKeyboardState:{1:{shift:false,symbols:false}},mirrorMatchPhrase:"A’b",updateMirrorPlayer(){updates++;},buildMirrorKeyboard(){}};
vm.createContext(ctx);vm.runInContext(tap,ctx);
ctx.mirrorTapKey(1,'a');ctx.mirrorTapKey(1,"'");assert.equal(input.value,'A’');
ctx.mirrorTapKey(1,'BACK');assert.equal(input.value,'A');
input.disabled=true;ctx.mirrorTapKey(1,'x');assert.equal(input.value,'A');
assert.equal(updates,3);
const generate=html.match(/    function generateShareImage\(\) \{[\s\S]*?\n    \}/)[0];
const status={};const exportCtx={document:{getElementById:()=>status},createProfileCard(){throw Error('simulated canvas failure');},console:{error(){}},generatedCanvas:{},generatedImageData:'stale'};
vm.createContext(exportCtx);vm.runInContext(generate,exportCtx);assert.equal(exportCtx.generateShareImage(),false);assert.equal(exportCtx.generatedImageData,'');assert.match(status.textContent,/Could not generate/);
console.log('Card/Mirror tests passed: all canvas banner designs, visible generation errors, no stale exports, whole-word phone phrases, touch typing and disabled input.');
