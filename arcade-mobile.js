(function(){
 'use strict';
 const screen=document.getElementById('arcadeModeScreen'),viewport=window.visualViewport;
 if(!screen||!viewport)return;
 let baseline=viewport.height,frame=0;
 function sync(){
  cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{
   if(!screen.classList.contains('active')){document.documentElement.classList.remove('arcade-keyboard-open');baseline=viewport.height;return;}
   baseline=Math.max(baseline,viewport.height);
   document.documentElement.style.setProperty('--arcade-visible-height',Math.round(viewport.height)+'px');
   document.documentElement.style.setProperty('--arcade-visible-top',Math.round(viewport.offsetTop)+'px');
   document.documentElement.classList.toggle('arcade-keyboard-open',viewport.height<baseline-120);
  });
 }
 new MutationObserver(sync).observe(screen,{attributes:true,attributeFilter:['class']});
 viewport.addEventListener('resize',sync);viewport.addEventListener('scroll',sync);
 window.addEventListener('orientationchange',()=>{baseline=viewport.height;sync();});
 screen.addEventListener('focusin',sync);screen.addEventListener('focusout',sync);sync();
})();
