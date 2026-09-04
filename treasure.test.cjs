const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
function harness() {
    const ids = new Map(); let now = 1000, interval, records = [];
    class Element {
        constructor() { this.children=[]; this.listeners={}; this.classList={add(){},remove(){}}; this.value=''; }
        set innerHTML(v) { this.html=v; this.children=[]; for(const m of v.matchAll(/id="([^"]+)"/g)) ids.set(m[1],new Element()); }
        get innerHTML() { return this.html; }
        querySelector(s) { if(s.startsWith('#')) return ids.get(s.slice(1)); return this.children.find(x=>x.tag===s) || (this[s] ||= new Element()); }
        appendChild(c) { this.children.push(c); }
        replaceChildren() { this.children=[]; }
        before() {} after() {} focus() {}
        addEventListener(n,f) { this.listeners[n]=f; }
    }
    const root=new Element();
    const ctx={console, performance:{now:()=>now}, Date, Math, Set,
        document:{body:{},createElement(tag){const el=new Element();el.tag=tag;return el;},getElementById:id=>ids.get(id)||root,querySelector:()=>root},
        window:{},language:'english',attitude:'friendly',phrases:{english:{friendly:['alpha bravo','charlie delta','echo foxtrot','golf hotel','india juliet']}},
        stopTimer(){},clearArcadeRuntime(){},showScreen(id){if(id!=='treasureScreen')ctx.window.CursedTreasure.leave();},
        setInterval(f){interval=f;return 1;},clearInterval(){interval=null;},
        recordArcadeStats(...args){records.push(args);},arcadeStartTime:0};
    vm.runInNewContext(fs.readFileSync('treasure.js','utf8'),ctx);
    const content=()=>ids.get('treasureContent');
    const click=(prefix)=>{const b=content().children.find(x=>x.textContent?.startsWith(prefix));assert(b,'Missing button '+prefix);b.listeners.click();};
    const phrase=()=>ids.get('treasurePhrase').children.map(x=>x.textContent).join('');
    const type=(v)=>{const input=ids.get('treasureInput');input.value=v;input.listeners.input();};
    const advance=(ms)=>{now+=ms;if(interval)interval();};
    const clear=()=>{const text=phrase();type(text[0]);advance(4000);type(text);};
    ctx.window.CursedTreasure.open();click('OPEN THE FIRST');
    return {ctx,ids,click,type,advance,clear,phrase,records,content,active:()=>!!interval};
}
let t=harness();
const initial=t.ids.get('treasureClock').textContent;t.advance(30000);assert.equal(t.ids.get('treasureClock').textContent,initial,'Timer waits for typing');
t.clear();t.click('HASTE');assert.equal(t.ids.get('treasureScore').textContent,'100 POINTS · 1.5×');
t.clear();t.click('BANK');assert.equal(t.records.length,1);assert.equal(t.records[0][5],250);assert.equal(t.active(),false);
t.ctx.window.CursedTreasure.leave();assert.equal(t.records.length,1);
t=harness();t.clear();t.click('SEALED');
let prevented=false;const input=t.ids.get('treasureInput');input.selectionStart=input.selectionEnd=0;input.listeners.beforeinput({inputType:'deleteContentBackward',preventDefault(){prevented=true;}});assert(prevented);
t.type('!');assert.equal(t.records.length,1);assert.equal(t.records[0][5],100);assert.match(t.content().innerHTML,/vault claims/);
t=harness();t.clear();t.click('FADING');t.type(t.phrase()[0]);t.advance(8100);assert.match(t.ids.get('treasurePhrase').textContent,/ink has vanished/);t.click('PEEK');assert(t.ids.get('treasurePhrase').children.length>0);t.advance(100000);assert.equal(t.records.length,1);
t=harness();t.type('a');t.advance(100000);assert.equal(t.records.length,0,'No reward for zero cleared chambers');
t=harness();t.clear();t.click('HASTE');t.ctx.window.CursedTreasure.leave();t.advance(100000);assert.equal(t.active(),false);assert.equal(t.records.length,0,'Leaving abandons without reward');
t=harness();for(let i=0;i<5;i++){t.clear();if(i<4)t.click('HASTE');}assert.equal(t.records.length,1);assert.equal(t.records[0][5],1000);assert.match(t.content().innerHTML,/Treasure secured/);
console.log('Treasure tests passed: deferred timer, score multipliers, banking, sealed input, fading/peek, timeout, abandonment and five-chamber completion.');
