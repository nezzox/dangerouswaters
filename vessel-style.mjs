export function vesselStyle(design={}){const family=Number(/^boat-(\d+)-/.exec(design.id||'')?.[1]||0);return {family,netLane:!!design.salmon,gantry:[2,3,4,6,9,10].includes(family),exhausts:[2,7,9,10].includes(family)?2:1,upperBridge:[6,9,10].includes(family),bowShield:family===7,radarArch:[1,3,5,8].includes(family)};}
export function potRackPosition(i,design={}){return design.salmon?{x:-10+Math.floor(i/4)*2,z:1.7,y:2.4+(i%4)*1.25}:{x:-10+Math.floor(i/6)*2,z:-2.05+(i%2)*2.05,y:2.4+Math.floor((i%6)/2)*1.25};}

export const boxesOverlap=(a,b)=>a.min.every((v,i)=>v<b.max[i]&&a.max[i]>b.min[i]);
export const potBounds=p=>({min:[p.x-.89,p.y-.62,p.z-.87],max:[p.x+.89,p.y+.62,p.z+.87]});
export function gantryPlacement(design={}){const style=vesselStyle(design);return style.gantry?{x:style.family===2?-7:-9.8,z:3.25,height:design.salmon?7.6:6.8}:null;}
const hardwareCache=new Map();
const layoutKey=d=>(d.id||'starter')+'/'+(d.hauler||'starboard')+'/'+!!d.salmon;
export function deckHardware(design={}){const key=layoutKey(design);if(!hardwareCache.has(key))hardwareCache.set(key,buildDeckHardware(design));return hardwareCache.get(key);}
function buildDeckHardware(design={}){const style=vesselStyle(design),solid=[],work=[];if(!style.family)return {solid,work};
 const sides=design.hauler==='both'?[-1,1]:[design.hauler==='port'?-1:1];for(const side of sides){if(design.hauler==='stern'){solid.push({min:[-8.32,1.7,1.38],max:[-7.88,5.35,1.82]},{min:[-12.35,1.6,-.65],max:[-9.35,3.2,.65]});work.push({min:[-12.4,1.7,-.85],max:[-7,7.4,2.4]});}else{solid.push({min:[-1.73,1.7,side*2.1-.23],max:[-1.27,5.35,side*2.1+.23]},{min:[-3.45,1.6,side*2.7-.45],max:[-2.55,3.15,side*2.7+.45]});work.push({min:[-4.9,1.7,side>0?-.4:-5],max:[-.7,7.4,side>0?5:.4]});}}
 if(design.salmon)solid.push({min:[-8.95,1.7,-2.05],max:[-6.5,3.65,.18]});
 if(style.gantry){const {x,z,height:h}=gantryPlacement(design);for(const side of [-1,1])solid.push({min:[x-.2,1.7,side*z-.2],max:[x+1.6,h+.2,side*z+.2]});solid.push({min:[x-.24,h-.24,-z-.2],max:[x+.24,h+.24,z+.2]},{min:[x-.4,h-.35,-.6],max:[x+.4,h+.35,.6]});}
 return {solid,work};}
const rackCache=new Map();
export function rackPositions(count,design={}){const key=layoutKey(design)+'/'+Math.max(0,Math.min(count,20));if(rackCache.has(key))return rackCache.get(key);const result=buildRackPositions(count,design);if(rackCache.size>=256)rackCache.delete(rackCache.keys().next().value);rackCache.set(key,result);return result;}
function buildRackPositions(count,design={}){const hardware=deckHardware(design),limit=design.salmon?16:20,candidates=Array.from({length:limit},(_,i)=>potRackPosition(i,design));return candidates.filter(p=>![...hardware.solid,...hardware.work].some(box=>boxesOverlap(potBounds(p),box))).slice(0,Math.min(count,limit));}
