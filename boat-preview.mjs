import {createScene} from './scene.mjs?v=0.18.92';
import {createGame} from './simulation.mjs?v=0.18.92';
import {createWake} from './wake.mjs?v=0.18.92';
const cache=new Map(),queue=[];let renderer,canvas,scheduled=false,failed=false;
function process(){scheduled=false;const next=queue.shift();if(!next)return;if(!next.image.isConnected){schedule();return;}try{if(failed)throw Error('Preview unavailable');if(!renderer){canvas=document.createElement('canvas');renderer=createScene(canvas,{preview:true});if(!renderer)throw Error('WebGL2 unavailable');}const state=createGame();state.career.boat=next.design.id;Object.assign(state,{x:-32000,y:-44000,heading:0,hour:12,deck:next.design.pots,capacity:next.design.capacity,fuel:next.design.tank,paused:true});renderer.setZoom(.32*next.design.length/24);renderer.setTilt(.95);renderer.draw(state,{wind:7,waves:.35,fog:0,rain:0,front:0},0,400,240,1,createWake());const url=canvas.toDataURL('image/jpeg',.87);cache.set(next.design.id,url);next.image.src=url;next.image.dataset.ready='true';}catch(error){failed=true;next.image.alt=next.design.name+' · Preview unavailable';next.image.classList.add('preview-unavailable');}schedule();}
function schedule(){if(queue.length&&!scheduled){scheduled=true;if(globalThis.requestIdleCallback)requestIdleCallback(process,{timeout:800});else requestAnimationFrame(process);}}
const lazyPreviews=new WeakMap();
const observer=typeof IntersectionObserver==='function'?new IntersectionObserver(entries=>{
 for(const entry of entries){
  if(!entry.isIntersecting)continue;
  const image=entry.target,design=lazyPreviews.get(image);
  observer.unobserve(image);
  if(design){queue.push({image,design});schedule();}
 }
},{rootMargin:'160px'}):null;
export function boatPreview(design,{lazy=false}={}){const image=document.createElement('img');image.className='boat-preview';image.width=400;image.height=240;image.alt='Preview of '+design.name;const existing=cache.get(design.id);if(existing){image.src=existing;image.dataset.ready='true';}else if(lazy&&observer){lazyPreviews.set(image,design);observer.observe(image);}else{queue.push({image,design});schedule();}return image;}
