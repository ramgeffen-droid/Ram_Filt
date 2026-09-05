// 3-second Ram Fit splash screen with a playful blink over the icon eyes.
(function(){
  const style=document.createElement('style');
  style.textContent=`
    #ramFitSplash{position:fixed;inset:0;z-index:99999;background:#f3f4f6;display:flex;align-items:center;justify-content:center;opacity:1;transition:opacity .35s ease}
    #ramFitSplash.hide{opacity:0;pointer-events:none}
    .rf-splash-wrap{position:relative;width:min(62vw,280px);aspect-ratio:1/1;animation:rfPop .55s cubic-bezier(.2,.9,.25,1.2) both}
    .rf-splash-icon{width:100%;height:100%;object-fit:contain;display:block;border-radius:22%}
    .rf-eyelid{position:absolute;height:7%;width:12%;background:#f3f4f6;border-radius:50%;transform:scaleY(0);transform-origin:center;animation:rfBlink 3s ease-in-out 1 both;pointer-events:none}
    .rf-eye-left{left:34%;top:38%}.rf-eye-right{right:34%;top:38%}
    @keyframes rfPop{0%{transform:scale(.82);opacity:0}100%{transform:scale(1);opacity:1}}
    @keyframes rfBlink{0%,31%,39%,68%,76%,100%{transform:scaleY(0)}34%,36%,71%,73%{transform:scaleY(1)}}
    @media (prefers-reduced-motion:reduce){.rf-splash-wrap,.rf-eyelid{animation:none}}
  `;
  document.head.appendChild(style);
  const splash=document.createElement('div');
  splash.id='ramFitSplash';
  splash.innerHTML=`<div class="rf-splash-wrap"><img class="rf-splash-icon" src="icon-512.png" alt="Ram Fit"><span class="rf-eyelid rf-eye-left"></span><span class="rf-eyelid rf-eye-right"></span></div>`;
  document.body.appendChild(splash);
  setTimeout(()=>{splash.classList.add('hide');setTimeout(()=>splash.remove(),400)},3000);
})();