import { Application, Graphics } from 'pixi.js';
import { loadVfxExportBundle } from 'nixie-fx/export';
import { PixiVfxRenderer, createPixiVfx2dProjection } from 'nixie-fx/pixi';
const status=document.querySelector('#status');
const stats=document.querySelector('#stats');
const canvas=document.querySelector('#baseline');
const ctx=canvas.getContext('2d');
const motion=matchMedia('(prefers-reduced-motion: reduce)');
const reduce=document.querySelector('#reduce');
let app,adapter,raf,seconds=0.3,playing=false,last=0,particles=[],disposed=false;
const seed=43,count=24;
function makeBaseline(){
 let state=seed;
 const random=()=>{state=(Math.imul(1664525,state)+1013904223)>>>0;return state/4294967296;};
 return Array.from({length:count},()=>({vx:-1.6+random()*3.2,vy:0.4+random()*2.4}));
}
function drawBaseline(t){
 ctx.fillStyle='#0d1c29';ctx.fillRect(0,0,480,300);
 ctx.strokeStyle='#486373';ctx.beginPath();ctx.moveTo(40,240);ctx.lineTo(440,240);ctx.stroke();
 let visible=0;
 if(t<1) for(const p of particles){
  ctx.globalAlpha=t<=0.6?1-t*0.25:0.85*(1-t)/0.4;
  ctx.fillStyle='#33e6bf';ctx.beginPath();
  ctx.arc(240+p.vx*t*80,240-p.vy*t*80,3,0,Math.PI*2);ctx.fill();visible++;
 }
 ctx.globalAlpha=1;return visible;
}
try {
 const get=async p=>{const r=await fetch(p);if(!r.ok)throw Error('Cannot load '+p);return r.json();};
 const manifest=await get('./vfx/manifest.json');
 const effectsByPath=Object.fromEntries(await Promise.all(manifest.effects.map(async e=>[e.path,await get('./vfx/'+e.path)])));
 const bundle=loadVfxExportBundle({manifest,effectsByPath},{requiredBackend:'pixi2d',requiredEffectIds:['comparison-burst']});
 const effect=bundle.effectsById.get('comparison-burst');
 if(effect.assets.length)throw Error('Expected an assetless procedural example.');
 app=new Application();await app.init({width:480,height:300,background:'#0d1c29',antialias:true,preference:'webgl',resolution:1});
 app.ticker.stop();document.querySelector('#runtime').append(app.canvas);
 app.canvas.setAttribute('role','img');app.canvas.setAttribute('aria-label','NixieFX burst rendered in PixiJS at the selected time');
 app.stage.addChild(new Graphics().moveTo(40,240).lineTo(440,240).stroke({width:1,color:0x486373}));
 adapter=new PixiVfxRenderer({parent:app.stage,projection:createPixiVfx2dProjection({originX:240,originY:240,pixelsPerUnit:80,yAxis:'up'})});
 const instance=adapter.createEffect(effect,{autoStart:false});
 const reduced=()=>motion.matches||reduce.checked;
 function draw(){const visible=drawBaseline(seconds);app.renderer.render(app.stage);stats.textContent=`t=${seconds.toFixed(2)} s | seed=${seed} | Canvas visible=${visible} | NixieFX/PixiJS active=${instance.stats.activeParticles}, visible=${instance.stats.visibleParticles} | export pixi2d=${effect.support.backends.pixi2d.status}, three3d=${effect.support.backends.three3d.status}`;}
 function hold(t){playing=false;seconds=t;particles=makeBaseline();instance.reset({position:[0,0,0],seed});for(let i=0;i<Math.round(t*120);i++)adapter.update(1/120);status.textContent='Held frame; positions are not expected to match across the two implementations.';draw();}
 document.querySelector('#early').onclick=()=>hold(0.3);
 document.querySelector('#late').onclick=()=>hold(0.7);
 document.querySelector('#finish').onclick=()=>hold(1.1);
 document.querySelector('#replay').onclick=()=>{if(reduced()){hold(0.3);status.textContent='Reduced motion: replay holds a still frame.';return;}hold(0);seconds=0;last=performance.now();playing=true;status.textContent='Playing one burst.';};
 const changed=()=>{if(reduced())hold(0.3);};reduce.onchange=changed;motion.addEventListener('change',changed);
 function frame(now){if(disposed)return;if(playing){const dt=Math.min((now-last)/1000,0.05);seconds+=dt;adapter.update(dt);if(seconds>=1.1){playing=false;status.textContent='Finished; both effects have cleared.';}draw();}last=now;raf=requestAnimationFrame(frame);}
 function cleanup(){disposed=true;playing=false;cancelAnimationFrame(raf);motion.removeEventListener('change',changed);adapter.destroy();app.destroy(true);}
 document.querySelector('#dispose').onclick=()=>{cleanup();ctx.clearRect(0,0,480,300);for(const b of document.querySelectorAll('button, input'))b.disabled=true;status.textContent='Disposed: animation canceled, runtime and renderer destroyed. Reload to recreate.';};
 window.addEventListener('pagehide',()=>{if(!disposed)cleanup();},{once:true});
 for(const b of document.querySelectorAll('button'))b.disabled=false;hold(0.3);raf=requestAnimationFrame(frame);
} catch(e){status.textContent=e.message;console.error(e);}
