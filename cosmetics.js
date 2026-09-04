(function(root) {
    'use strict';
    const cache = new Map();
    function polygon(ctx, points, color, stroke) {
        ctx.beginPath(); points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fillStyle=color;ctx.fill();
        if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=3;ctx.stroke();}
    }
    function avatar(ctx,id) {
        const dragon=id==='avatar-dragon';
        ctx.fillStyle=dragon?'#211327':'#111832';ctx.fillRect(0,0,256,256);
        ctx.strokeStyle=dragon?'#733e43':'#454779';ctx.lineWidth=2;
        [85,103,121].forEach(r=>{ctx.beginPath();ctx.arc(128,132,r,0,Math.PI*2);ctx.stroke();});
        for(let i=0;i<12;i++){const a=i*Math.PI/6;polygon(ctx,[[128+109*Math.cos(a),132+109*Math.sin(a)],[130+115*Math.cos(a),134+115*Math.sin(a)],[126+119*Math.cos(a),130+119*Math.sin(a)]],dragon?'#ffbc6b':'#b8adff');}
        if(dragon){
            polygon(ctx,[[48,57],[109,91],[128,60],[148,90],[210,49],[190,118],[216,154],[162,188],[129,224],[86,196],[42,154],[65,120]],'#ba493d','#ffb16b');
            polygon(ctx,[[48,57],[88,90],[73,117]],'#ffe4af');polygon(ctx,[[210,49],[171,93],[187,117]],'#ffe4af');
            polygon(ctx,[[68,119],[110,129],[88,144]],'#1d1c2e');polygon(ctx,[[148,129],[189,119],[169,144]],'#1d1c2e');
            polygon(ctx,[[76,128],[106,134],[87,138]],'#80ffe0');polygon(ctx,[[151,134],[182,128],[167,138]],'#80ffe0');
            polygon(ctx,[[128,128],[158,165],[148,192],[109,192],[96,165]],'#ef8454');
            polygon(ctx,[[114,157],[121,169],[107,166]],'#29182a');polygon(ctx,[[143,157],[149,166],[136,169]],'#29182a');
            polygon(ctx,[[109,192],[128,207],[147,192]],'#ffe4af');
        }else{
            polygon(ctx,[[52,50],[105,82],[151,82],[204,50],[197,140],[171,210],[128,229],[86,208],[58,145]],'#6650a6','#c2b4ff');
            polygon(ctx,[[52,50],[102,87],[73,98]],'#ae9dec');polygon(ctx,[[204,50],[154,87],[184,98]],'#ae9dec');
            [[91,126],[165,126]].forEach(([x,y])=>{ctx.fillStyle='#e5daff';ctx.beginPath();ctx.ellipse(x,y,39,44,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ffca6b';ctx.beginPath();ctx.arc(x,y,24,0,Math.PI*2);ctx.fill();ctx.fillStyle='#161b35';ctx.beginPath();ctx.arc(x,y,13,0,Math.PI*2);ctx.fill();ctx.fillStyle='white';ctx.beginPath();ctx.arc(x-5,y-6,4,0,Math.PI*2);ctx.fill();});
            polygon(ctx,[[115,155],[141,155],[128,179]],'#ffbe64');
            [181,195,209].forEach(y=>polygon(ctx,[[106,y],[128,y+8],[150,y],[128,y+17]],'#9880cd'));
        }
    }
    function frame(ctx,id,x=0,y=0,size=256) {
        ctx.save();ctx.translate(x,y);ctx.scale(size/256,size/256);
        const ice=id==='frame-ice', color=ice?'#8cecff':'#ffd480';
        ctx.strokeStyle=color;ctx.lineWidth=5;ctx.strokeRect(12,12,232,232);ctx.lineWidth=2;ctx.strokeRect(20,20,216,216);
        if(ice){
            [[12,12],[244,12],[12,244],[244,244]].forEach(([cx,cy])=>{ctx.save();ctx.translate(cx,cy);polygon(ctx,[[0,-12],[16,0],[0,28],[-16,0]],'#9df3ff','#e2fdff');ctx.restore();});
            [55,105,155,205].forEach(p=>{polygon(ctx,[[p,9],[p+10,24],[p-8,38]],'#69bada');polygon(ctx,[[p,247],[p+10,232],[p-8,218]],'#b3f3ff');});
        }else{
            [55,84,113,142,171,200].forEach(p=>{polygon(ctx,[[12,p+14],[3,p],[13,p-13],[23,p]],'#f4bb55');polygon(ctx,[[244,p+14],[233,p],[243,p-13],[253,p]],'#f4bb55');});
            polygon(ctx,[[93,16],[99,2],[117,13],[128,0],[139,13],[157,2],[163,16],[153,31],[103,31]],'#ffe3a4','#a36b28');
            polygon(ctx,[[128,230],[145,241],[128,254],[111,241]],'#ffe3a4');
        }
        ctx.restore();
    }
    function image(id) {
        if(cache.has(id))return cache.get(id);
        const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;
        const ctx=canvas.getContext('2d');
        if(id.startsWith('avatar-'))avatar(ctx,id);else frame(ctx,id);
        const data=canvas.toDataURL('image/png');cache.set(id,data);return data;
    }
    function card(ctx,style,width,height) {
        if(!['aurora','ember'].includes(style))return;
        ctx.save();
        if(style==='aurora'){
            for(let i=0;i<5;i++){ctx.strokeStyle=['#5effba','#64b4ef','#b98aff'][i%3];ctx.globalAlpha=.12;ctx.lineWidth=30+i*12;ctx.beginPath();ctx.moveTo(width-190+i*35,0);ctx.bezierCurveTo(width-650,height*.32,width+200,height*.6,width-100,height);ctx.stroke();}
            ctx.globalAlpha=.55;for(let i=0;i<40;i++){ctx.fillStyle='#d7ffee';ctx.fillRect((i*137)%width,(i*211)%height,3,3);}
        }else{
            for(let i=0;i<9;i++){const y=i*165;polygon(ctx,[[width-120,y],[width,y+65],[width,y+170],[width-70,y+125]],'#8f442e');polygon(ctx,[[0,y],[55,y+60],[0,y+160]],'#542a2a');}
            ctx.strokeStyle='#e6a56c';ctx.lineWidth=3;[[30,30],[width-30,30],[30,height-30],[width-30,height-30]].forEach(([x,y])=>{ctx.strokeRect(x-9,y-9,18,18);});
        }
        ctx.restore();
    }
    root.CosmeticArt={image,frame,card};
})(globalThis);
